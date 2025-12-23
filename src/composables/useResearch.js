// src/composables/useResearch.js
import { ref, computed, watchEffect } from 'vue';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '@/plugins/firebase/config';
import { useKstTime } from './useKstTime';

import { researchCatalog, getResearchDef } from '@/data/research/catalog';
import { useTimeFormat } from '@/composables/useTimeFormat';

// 저장/자동저장 설정 (LocalStorage) — "설정"이므로 유지
const LS_SAVE_ENABLED = 'rcts.research.saveEnabled'; // 의미: 자동저장/배경 저장 허용
const LS_AUTOSAVE_ENABLED = 'rcts.research.autosave.enabled';
const LS_AUTOSAVE_BASE = 'rcts.research.autosave.base';
const LS_AUTOSAVE_INTERVAL = 'rcts.research.autosave.intervalMin';

const { kstDate, isKstTimeReady } = useKstTime();
const isKstReady = computed(() => isKstTimeReady.value && kstDate.value instanceof Date);

function nowKstMs() {
  return isKstReady.value ? kstDate.value.getTime() : Date.now();
}

// =======================================================
// ✅ 긴급 잠금(실서비스 핫픽스)
// =======================================================
const HARD_LOCK_RESEARCH_IDS = new Set([
  'sys_unlock_vehicle',
  'sys_unlock_route',
  'sys_unlock_construction',
  'sys_unlock_finance',
  'sys_unlock_city',
]);

function isHardLockedResearchId(id) {
  if (!id) return false;
  if (!HARD_LOCK_RESEARCH_IDS.has(id)) return false;

  const def = getResearchDef(id);
  return def?.enabled === false;
}

// ===== 전역 상태(싱글톤) =====
const firstUnlockTransportId = ref(null);
const completedIds = ref(new Set());
const activeResearch = ref(null); // { id, startedAtMs, endsAtMs }
const queuedResearchIds = ref([]);

const unlockedTransportTiers = ref({});
const incomeMultiplier = ref(1.0);

const researchSpeedLevel = ref(0);
const researchDurationMultiplier = ref(1.0);

const queueReserveLevel = ref(1);

const cityScale = ref('NONE');

const unlockedFeatures = ref({
  vehicle: false,
  route: false,
  construction: false,
  finance: false,
  city: false,
});

// Firebase 연동 상태
const isLoadingFirebaseData = ref(false);
const isSavingFirebaseData = ref(false);
const isStateLoaded = ref(false);
const currentUid = ref(null);

let saveDebounceTimer = null;
let isHydrating = false;

// Firestore 구독 핸들
let unsubscribeFn = null;

// 저장 ON/OFF (의미를 "자동/배경 저장 허용"으로 축소)
const saveEnabled = ref(loadBool(LS_SAVE_ENABLED, true));

// 자동 저장 설정
const autoSaveEnabled = ref(loadBool(LS_AUTOSAVE_ENABLED, false));
const autoSaveBase = ref(loadNum(LS_AUTOSAVE_BASE, 5));
const autoSaveIntervalMin = ref(loadNum(LS_AUTOSAVE_INTERVAL, 10));

// 자동 저장 상태 표시용
const autoSaveRunning = ref(false);
const lastAutoSaveAtMs = ref(0);

// 자동 저장 타이머
let autoSaveTimerId = null;

// ===== Helpers (LocalStorage settings only) =====
function loadBool(key, def) {
  const v = localStorage.getItem(key);
  if (v === null) return def;
  return v === '1';
}
function loadNum(key, def) {
  const v = localStorage.getItem(key);
  const n = v == null ? NaN : Number(v);
  return Number.isFinite(n) ? n : def;
}
function saveBool(key, value) {
  localStorage.setItem(key, value ? '1' : '0');
}
function saveNum(key, value) {
  localStorage.setItem(key, String(value));
}

// ===== 예약 슬롯 계산 =====
function queueLimitByLevel(level) {
  const lv = Math.max(1, Math.min(3, Number(level || 1)));
  if (lv === 1) return 1;
  if (lv === 2) return 3;
  return 5;
}

// ===== 저장 토글 =====
function setSaveEnabled(v) {
  saveEnabled.value = !!v;
  saveBool(LS_SAVE_ENABLED, saveEnabled.value);

  // saveEnabled=false는 "자동/배경 저장"만 중지한다.
  // 핵심 액션(연구 시작/완료 등)의 커밋은 막지 않는 방향이 서버 정본 정책에 더 안전함.
  if (!saveEnabled.value) {
    if (saveDebounceTimer) {
      clearTimeout(saveDebounceTimer);
      saveDebounceTimer = null;
    }
    stopAutoSave();
  } else {
    syncAutoSave();
  }
}

function setAutoSaveEnabled(v) {
  autoSaveEnabled.value = !!v;
  saveBool(LS_AUTOSAVE_ENABLED, autoSaveEnabled.value);
  syncAutoSave();
}

function setAutoSaveBase(v) {
  const base = Number(v) === 10 ? 10 : 5;
  autoSaveBase.value = base;
  saveNum(LS_AUTOSAVE_BASE, base);

  const cur = Number(autoSaveIntervalMin.value) || base;
  const fixed = Math.max(base, Math.round(cur / base) * base);
  autoSaveIntervalMin.value = fixed;
  saveNum(LS_AUTOSAVE_INTERVAL, fixed);

  syncAutoSave(true);
}

function setAutoSaveIntervalMin(v) {
  const base = Number(autoSaveBase.value) === 10 ? 10 : 5;
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return;

  const fixed = Math.max(base, Math.round(n / base) * base);
  autoSaveIntervalMin.value = fixed;
  saveNum(LS_AUTOSAVE_INTERVAL, fixed);

  syncAutoSave(true);
}

// ===== KST 경계 자동저장 =====
function calcDelayToNextKstBoundaryMs(intervalMin) {
  const interval = Number(intervalMin);
  if (!Number.isFinite(interval) || interval <= 0) return 60_000;

  const intervalMs = interval * 60 * 1000;

  const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
  const kstNow = Date.now() + KST_OFFSET_MS;

  const next = (Math.floor(kstNow / intervalMs) + 1) * intervalMs;
  const delay = next - kstNow;

  return Math.max(1000, delay);
}

function stopAutoSave() {
  autoSaveRunning.value = false;
  if (autoSaveTimerId) {
    clearTimeout(autoSaveTimerId);
    autoSaveTimerId = null;
  }
}

function scheduleNextAutoSave() {
  if (autoSaveTimerId) {
    clearTimeout(autoSaveTimerId);
    autoSaveTimerId = null;
  }

  if (!autoSaveEnabled.value) return stopAutoSave();
  if (!saveEnabled.value) return stopAutoSave();
  if (!currentUid.value) return stopAutoSave();
  if (!isStateLoaded.value) return stopAutoSave();
  if (isHydrating) return stopAutoSave();

  autoSaveRunning.value = true;

  const interval = Number(autoSaveIntervalMin.value) || 10;
  const delay = calcDelayToNextKstBoundaryMs(interval);

  autoSaveTimerId = setTimeout(async () => {
    try {
      await saveNow({ reason: 'autosave' });
      lastAutoSaveAtMs.value = Date.now();
    } catch (e) {
      console.error('useResearch: 자동저장 실패:', e);
    } finally {
      scheduleNextAutoSave();
    }
  }, delay);
}

function syncAutoSave(restart = false) {
  if (restart) stopAutoSave();

  if (
    autoSaveEnabled.value &&
    saveEnabled.value &&
    currentUid.value &&
    isStateLoaded.value &&
    !isHydrating
  ) {
    scheduleNextAutoSave();
  } else {
    stopAutoSave();
  }
}

// ===== 게스트 전환(로그아웃 포함) =====
function becomeGuestMode() {
  if (saveDebounceTimer) {
    clearTimeout(saveDebounceTimer);
    saveDebounceTimer = null;
  }
  stopAutoSave();

  currentUid.value = null;
  isStateLoaded.value = false;
  isHydrating = false;
}

// ===== 카탈로그 해석 =====
function prerequisitesMet(def) {
  const reqs = Array.isArray(def?.requires) ? def.requires : [];
  return reqs.every((rid) => completedIds.value.has(rid));
}

function revealSatisfied(def) {
  const reveal = Array.isArray(def?.revealAfter) ? def.revealAfter : [];
  if (reveal.length === 0) return true;
  return reveal.every((rid) => completedIds.value.has(rid));
}

function isCompleted(id) {
  return completedIds.value.has(id);
}

function isTier1TransportUnlock(def) {
  if (!def) return false;
  if (Number(def.tier || 1) !== 1) return false;
  return (def.effects || []).some(
    (e) => e?.type === 'UNLOCK_TRANSPORT_TIER' && Number(e?.tier || 1) === 1 && !!e?.transportId
  );
}

function isSystemFixedResearch(def) {
  if (!def) return false;
  if (def.timePolicy === 'FIXED') return true;
  return def.type === 'SYSTEM';
}

function isScalableResearch(def) {
  if (!def) return false;
  if (def.timePolicy === 'SCALABLE') return true;
  if (def.timePolicy == null) return !isSystemFixedResearch(def);
  return false;
}

function cityScaleRank(scale) {
  switch (String(scale || '').toUpperCase()) {
    case 'REGION': return 1;
    case 'CITY': return 2;
    case 'COUNTRY': return 3;
    case 'STATE': return 4;
    case 'PLANET': return 5;
    default: return 0;
  }
}

function recomputeEffects() {
  const tiers = {};
  let mult = 1.0;

  let rsLevel = 0;
  let reserveLv = 1;

  let nextCityScale = 'NONE';

  const features = {
    vehicle: false,
    route: false,
    construction: false,
    finance: false,
    city: false,
  };

  for (const node of researchCatalog) {
    if (!completedIds.value.has(node.id)) continue;

    for (const eff of node.effects || []) {
      if (eff.type === 'UNLOCK_TRANSPORT_TIER') {
        const tid = eff.transportId;
        const t = Number(eff.tier || 1);
        if (!tid) continue;
        tiers[tid] = Math.max(Number(tiers[tid] || 0), t);
      }

      if (eff.type === 'INCOME_MULTIPLIER') {
        mult *= Number(eff.value || 1.0);
      }

      if (eff.type === 'RESEARCH_SPEED_LEVEL') {
        const lv = Number(eff.level || 0);
        if (Number.isFinite(lv)) rsLevel = Math.max(rsLevel, lv);
      }

      if (eff.type === 'QUEUE_RESERVE_LEVEL') {
        const lv = Number(eff.level || 1);
        if (Number.isFinite(lv)) reserveLv = Math.max(reserveLv, lv);
      }

      if (eff.type === 'UNLOCK_FEATURE') {
        const k = String(eff.featureKey || '');
        if (k && Object.prototype.hasOwnProperty.call(features, k)) {
          features[k] = true;
        }
      }

      if (eff.type === 'SET_CITY_SCALE') {
        const s = String(eff.scale || '').toUpperCase();
        if (cityScaleRank(s) > cityScaleRank(nextCityScale)) nextCityScale = s;
      }
    }
  }

  unlockedTransportTiers.value = tiers;
  incomeMultiplier.value = mult;

  researchSpeedLevel.value = rsLevel;

  const raw = 1 - 0.05 * Math.max(0, rsLevel);
  researchDurationMultiplier.value = Math.max(0.2, raw);

  cityScale.value = nextCityScale;
  unlockedFeatures.value = features;

  queueReserveLevel.value = Math.max(1, Math.min(3, reserveLv));

  const limit = queueLimitByLevel(queueReserveLevel.value);
  if (queuedResearchIds.value.length > limit) {
    queuedResearchIds.value = queuedResearchIds.value.slice(0, limit);
  }
}

const visibleCatalog = computed(() => {
  return researchCatalog.filter((def) => {
    const tier = Number(def?.tier || 1);
    if (tier >= 2) return true;
    return revealSatisfied(def);
  });
});

const transportIdsTier1 = computed(() => {
  const set = new Set();
  for (const r of researchCatalog) {
    if (Number(r.tier || 1) !== 1) continue;
    for (const e of r.effects || []) {
      if (e.type === 'UNLOCK_TRANSPORT_TIER' && Number(e.tier || 1) === 1 && e.transportId) {
        set.add(e.transportId);
      }
    }
  }
  return Array.from(set);
});

const needsFirstUnlockSelection = computed(() => !firstUnlockTransportId.value);
const firstUnlockCandidates = computed(() => transportIdsTier1.value.map((id) => ({ id })));

function hasAnyStarterTransportUnlocked() {
  return (
    completedIds.value.has('unlock_bus_t1') ||
    completedIds.value.has('unlock_truck_t1') ||
    completedIds.value.has('unlock_rail_t1')
  );
}

function getStatus(researchId) {
  const def = getResearchDef(researchId);
  if (!def) return 'unknown';

  const tier = Number(def.tier || 1);

  if (tier === 1 && !revealSatisfied(def)) return 'hidden';

  if (isCompleted(researchId)) return 'done';
  if (activeResearch.value?.id === researchId) return 'active';
  if (queuedResearchIds.value.includes(researchId)) return 'queued';

  if (def.enabled === false) return 'comingSoon';

  if (researchId === 'sys_preview_starter_vehicles') {
    if (!firstUnlockTransportId.value) return 'locked';
    if (!hasAnyStarterTransportUnlocked()) return 'locked';
    return 'available';
  }

  if (tier === 1 && isTier1TransportUnlock(def) && !!firstUnlockTransportId.value) {
    return 'available';
  }

  if (!prerequisitesMet(def)) return 'locked';
  return 'available';
}

function findTier1UnlockResearchId(transportId) {
  const node = researchCatalog.find(
    (r) =>
      r.enabled !== false &&
      Number(r.tier || 1) === 1 &&
      (r.effects || []).some(
        (e) =>
          e.type === 'UNLOCK_TRANSPORT_TIER' &&
          e.transportId === transportId &&
          Number(e.tier || 1) === 1
      )
  );
  return node?.id ?? null;
}

// 서버 정본 정책: 로그인 상태 + 로드 완료 + 하이드레이션 중 아님이면 커밋 가능
function canCommit() {
  if (!currentUid.value) return false;
  if (!isStateLoaded.value) return false;
  if (isHydrating) return false;
  return true;
}

// "배경/자동 저장" 허용 여부 (설정)
function canBackgroundSave() {
  if (!saveEnabled.value) return false;
  return canCommit();
}

function serializeState() {
  const limit = queueLimitByLevel(queueReserveLevel.value);

  return {
    version: 10,
    firstUnlockTransportId: firstUnlockTransportId.value ?? null,
    completedResearchIds: Array.from(completedIds.value),
    activeResearch: activeResearch.value
      ? {
          id: activeResearch.value.id,
          startedAtMs: activeResearch.value.startedAtMs,
          endsAtMs: activeResearch.value.endsAtMs,
        }
      : null,

    queuedResearchIds: Array.isArray(queuedResearchIds.value)
      ? queuedResearchIds.value.slice(0, limit)
      : [],
  };
}

function applyRemoteState(remote) {
  firstUnlockTransportId.value =
    typeof remote?.firstUnlockTransportId === 'string'
      ? remote.firstUnlockTransportId
      : (typeof remote?.firstUnlockId === 'string' ? remote.firstUnlockId : null);

  const list = Array.isArray(remote?.completedResearchIds) ? remote.completedResearchIds : [];
  completedIds.value = new Set(list.filter((x) => typeof x === 'string'));

  const ar = remote?.activeResearch;
  if (ar && typeof ar === 'object' && typeof ar.id === 'string') {
    activeResearch.value = {
      id: ar.id,
      startedAtMs: Number(ar.startedAtMs || 0),
      endsAtMs: Number(ar.endsAtMs || 0),
    };
  } else {
    activeResearch.value = null;
  }

  const qArr = Array.isArray(remote?.queuedResearchIds)
    ? remote.queuedResearchIds.filter((x) => typeof x === 'string')
    : [];

  const legacyQ = typeof remote?.queuedResearchId === 'string' ? remote.queuedResearchId : null;

  const merged = [];
  for (const id of qArr) {
    if (!merged.includes(id)) merged.push(id);
  }
  if (legacyQ && !merged.includes(legacyQ)) merged.push(legacyQ);

  queuedResearchIds.value = merged;

  // legacy migration hook
  if (completedIds.value.size === 0 && Array.isArray(remote?.transports)) {
    for (const t of remote.transports) {
      if (!t || typeof t.id !== 'string') continue;
      if (t.locked === false) {
        const rid = findTier1UnlockResearchId(t.id);
        if (rid) completedIds.value.add(rid);
      }
    }
  }

  recomputeEffects();
}

async function saveNow({ reason = 'manual' } = {}) {
  // 핵심 커밋(수동/액션)은 saveEnabled와 무관하게 가능해야 서버 정본이 안전함.
  if (!canCommit()) return;

  if (saveDebounceTimer) {
    clearTimeout(saveDebounceTimer);
    saveDebounceTimer = null;
  }

  try {
    isSavingFirebaseData.value = true;

    const payload = {
      ...serializeState(),
      updatedAt: serverTimestamp(),
      lastSaveReason: reason,
    };

    const refDoc = doc(db, 'users', currentUid.value, 'research', 'state');
    await setDoc(refDoc, payload, { merge: true });
  } catch (e) {
    console.error('useResearch: Firebase 저장 실패:', e);
  } finally {
    isSavingFirebaseData.value = false;
  }
}

const scheduleSave = () => {
  // 배경/디바운스 저장은 saveEnabled 설정을 존중
  if (!canBackgroundSave()) return;

  if (saveDebounceTimer) clearTimeout(saveDebounceTimer);
  saveDebounceTimer = setTimeout(async () => {
    await saveNow({ reason: 'debounced' });
  }, 800);
};

function setFirstUnlockTransport(transportId) {
  if (!transportId) return;
  if (firstUnlockTransportId.value) return;

  const researchId = findTier1UnlockResearchId(transportId);
  if (!researchId) return;

  firstUnlockTransportId.value = transportId;
  completedIds.value.add(researchId);

  recomputeEffects();

  // 이건 유저 액션이므로 saveEnabled와 무관하게 즉시 커밋해도 됨.
  saveNow({ reason: 'firstUnlock' });
}

function startResearchInternal(researchId) {
  if (isHardLockedResearchId(researchId)) return { ok: false, reason: 'COMING_SOON' };

  const def = getResearchDef(researchId);
  if (!def) return { ok: false, reason: 'UNKNOWN_RESEARCH' };

  if (!firstUnlockTransportId.value) return { ok: false, reason: 'FIRST_UNLOCK_REQUIRED' };
  if (!isKstReady.value) return { ok: false, reason: 'KST_NOT_READY' };

  if (isCompleted(researchId)) return { ok: false, reason: 'ALREADY_DONE' };
  if (def.enabled === false) return { ok: false, reason: 'COMING_SOON' };

  const st = getStatus(researchId);
  if (st !== 'available') return { ok: false, reason: st.toUpperCase() };

  const now = nowKstMs();
  const baseSec = Number(def.durationSec || 0);

  let durSec = 0;
  if (baseSec > 0) {
    if (isSystemFixedResearch(def)) durSec = Math.ceil(baseSec);
    else if (isScalableResearch(def)) durSec = Math.ceil(baseSec * researchDurationMultiplier.value);
    else durSec = Math.ceil(baseSec * researchDurationMultiplier.value);
  }

  if (durSec <= 0) {
    completedIds.value.add(researchId);
    recomputeEffects();
    saveNow({ reason: 'instantComplete' });
    return { ok: true, instant: true };
  }

  activeResearch.value = {
    id: researchId,
    startedAtMs: now,
    endsAtMs: now + durSec * 1000,
  };

  saveNow({ reason: 'startResearch' });
  return { ok: true, instant: false };
}

function startResearch(researchId) {
  if (isHardLockedResearchId(researchId)) return { ok: false, reason: 'COMING_SOON' };

  const limit = queueLimitByLevel(queueReserveLevel.value);

  if (isCompleted(researchId)) return { ok: false, reason: 'ALREADY_DONE' };
  if (activeResearch.value?.id === researchId) return { ok: false, reason: 'ALREADY_ACTIVE' };
  if (queuedResearchIds.value.includes(researchId)) return { ok: true, queued: true, alreadyQueued: true };

  if (activeResearch.value) {
    if (queuedResearchIds.value.length >= limit) return { ok: false, reason: 'QUEUE_FULL' };

    const st = getStatus(researchId);
    if (st !== 'available') return { ok: false, reason: st.toUpperCase() };

    queuedResearchIds.value = [...queuedResearchIds.value, researchId].slice(0, limit);
    saveNow({ reason: 'queueAdd' });
    return { ok: true, queued: true };
  }

  return startResearchInternal(researchId);
}

function cancelQueuedResearch(researchId) {
  const before = queuedResearchIds.value.slice();
  const next = before.filter((id) => id !== researchId);
  if (next.length === before.length) return;
  queuedResearchIds.value = next;
  saveNow({ reason: 'queueCancel' });
}

function cancelAllQueuedResearch() {
  if (queuedResearchIds.value.length === 0) return;
  queuedResearchIds.value = [];
  saveNow({ reason: 'queueCancelAll' });
}

function getResearchProgress(researchId) {
  if (!activeResearch.value || activeResearch.value.id !== researchId) return 0;
  if (!isKstReady.value) return 0;

  const total = activeResearch.value.endsAtMs - activeResearch.value.startedAtMs;
  if (total <= 0) return 0;

  const elapsed = nowKstMs() - activeResearch.value.startedAtMs;
  return Math.max(0, Math.min(100, (elapsed / total) * 100));
}

function getResearchRemainingTime(researchId) {
  const { formatRemainSec } = useTimeFormat();

  if (!activeResearch.value || activeResearch.value.id !== researchId) return '0s';
  if (!isKstReady.value) return '0s';

  const diff = Math.max(0, activeResearch.value.endsAtMs - nowKstMs());
  const s = Math.floor(diff / 1000);
  return formatRemainSec(s);
}

// ==============================
// 서버 정본: 구독 기반 로드
// ==============================
function unsubscribe() {
  if (unsubscribeFn) {
    unsubscribeFn();
    unsubscribeFn = null;
  }

  if (saveDebounceTimer) {
    clearTimeout(saveDebounceTimer);
    saveDebounceTimer = null;
  }
  stopAutoSave();

  currentUid.value = null;
  isStateLoaded.value = false;
  isHydrating = false;
}

function subscribeForUser(uid) {
  if (!uid) return;

  // 기존 구독 정리
  unsubscribe();

  currentUid.value = uid;
  isLoadingFirebaseData.value = true;
  isStateLoaded.value = false;

  const refDoc = doc(db, 'users', uid, 'research', 'state');

  // 최초 문서가 없을 수 있으므로: 1) 구독, 2) 없으면 초기 생성(선택)
  unsubscribeFn = onSnapshot(
    refDoc,
    async (snap) => {
      isHydrating = true;

      try {
        if (snap.exists()) {
          applyRemoteState(snap.data());
          // console.log('useResearch: onSnapshot 적용 완료');
        } else {
          // 문서 없음: 초기 상태 확정 + (원하면) 서버에 초기 문서 생성
          recomputeEffects();

          // "서버 정본"을 강하게 유지하려면 초기 문서를 만들어두는 게 좋다.
          // 단, 하이드레이션 중 무한루프 방지를 위해 isHydrating 상태에서 직접 setDoc 한다.
          const payload = {
            ...serializeState(),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            lastSaveReason: 'init',
          };
          await setDoc(refDoc, payload, { merge: true });
        }
      } catch (e) {
        console.error('useResearch: onSnapshot apply failed:', e);
      } finally {
        isHydrating = false;
        isLoadingFirebaseData.value = false;
        isStateLoaded.value = true;

        // 자동저장 옵션 동기화
        syncAutoSave(true);
      }
    },
    (err) => {
      isHydrating = false;
      isLoadingFirebaseData.value = false;
      isStateLoaded.value = false;
      stopAutoSave();
      console.error('useResearch: onSnapshot error:', err);
    }
  );
}

// (레거시 호환) 기존 코드가 loadForUser를 부르면 구독으로 연결
async function loadForUser(uid) {
  subscribeForUser(uid);
}

// ===== 사용자 상태 정리 =====
function clearUserState() {
  // 서버 정본이므로 로그아웃 시에는 "구독 해제 + 메모리 상태 초기화"
  // (게스트로도 계속 플레이하게 할 거면 여기 정책을 바꾸면 됨)
  becomeGuestMode();

  firstUnlockTransportId.value = null;
  completedIds.value = new Set();
  activeResearch.value = null;
  queuedResearchIds.value = [];

  cityScale.value = 'NONE';
  unlockedFeatures.value = {
    vehicle: false,
    route: false,
    construction: false,
    finance: false,
    city: false,
  };

  researchSpeedLevel.value = 0;
  researchDurationMultiplier.value = 1.0;
  queueReserveLevel.value = 1;

  recomputeEffects();
}

// ===== watchEffect (기존 유지) =====
watchEffect(() => {
  if (isHydrating) return;

  let changed = false;

  if (activeResearch.value?.id && isHardLockedResearchId(activeResearch.value.id)) {
    activeResearch.value = null;
    changed = true;
  }

  if (Array.isArray(queuedResearchIds.value) && queuedResearchIds.value.length > 0) {
    const filtered = queuedResearchIds.value.filter((id) => !isHardLockedResearchId(id));
    if (filtered.length !== queuedResearchIds.value.length) {
      queuedResearchIds.value = filtered;
      changed = true;
    }
  }

  if (changed) {
    // 정책: 하드락 변경은 서버 정본에 반영되어야 하므로 즉시 커밋
    saveNow({ reason: 'hardLockCleanup' });
  }
});

watchEffect(() => {
  if (!isKstReady.value) return;

  const now = nowKstMs();

  if (activeResearch.value && now >= Number(activeResearch.value.endsAtMs || 0)) {
    const doneId = activeResearch.value.id;

    activeResearch.value = null;
    completedIds.value.add(doneId);

    recomputeEffects();

    if (queuedResearchIds.value.length > 0) {
      const [nextId, ...rest] = queuedResearchIds.value;
      queuedResearchIds.value = rest;

      const res = startResearchInternal(nextId);
      if (!res?.ok) {
        console.warn('useResearch: queued next start failed:', nextId, res?.reason);
      }
    }

    saveNow({ reason: 'researchComplete' });
  }
});

// ===== Public API =====
export function useResearch() {
  const isHydrated = computed(() => (!currentUid.value) || isStateLoaded.value);

  const queueLimit = computed(() => queueLimitByLevel(queueReserveLevel.value));
  const queueCount = computed(() => queuedResearchIds.value.length);
  const isQueueFull = computed(() => queueCount.value >= queueLimit.value);

  const hasFeature = (key) => !!unlockedFeatures.value?.[key];
  const cityScaleAtLeast = (scale) => cityScaleRank(cityScale.value) >= cityScaleRank(scale);

  return {
    catalog: researchCatalog,
    visibleCatalog,

    firstUnlockTransportId,
    needsFirstUnlockSelection,
    firstUnlockCandidates,
    setFirstUnlockTransport,

    completedIds,
    activeResearch,

    queuedResearchIds,
    queueReserveLevel,
    queueLimit,
    queueCount,
    isQueueFull,

    unlockedTransportTiers,
    incomeMultiplier,

    researchSpeedLevel,
    researchDurationMultiplier,

    cityScale,
    unlockedFeatures,
    hasFeature,
    cityScaleAtLeast,

    getStatus,
    startResearch,

    cancelQueuedResearch,
    cancelAllQueuedResearch,

    getResearchProgress,
    getResearchRemainingTime,

    isKstTimeReady,

    // 구독 기반
    subscribeForUser,
    unsubscribe,

    // 레거시 호환
    loadForUser,
    clearUserState,

    // 저장 API
    saveNow,
    scheduleSave,

    // 설정(자동/배경 저장)
    saveEnabled,
    setSaveEnabled,

    autoSaveEnabled,
    autoSaveBase,
    autoSaveIntervalMin,
    setAutoSaveEnabled,
    setAutoSaveBase,
    setAutoSaveIntervalMin,

    autoSaveRunning,
    lastAutoSaveAtMs,

    isLoadingFirebaseData,
    isSavingFirebaseData,
    isStateLoaded,
    isHydrated,
  };
}
