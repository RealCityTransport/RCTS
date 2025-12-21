// src/composables/useResearch.js
import { ref, computed, watchEffect } from 'vue';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/plugins/firebase/config';
import { useKstTime } from './useKstTime';

import { researchCatalog, getResearchDef } from '@/data/research/catalog';

// 저장/자동저장 설정 (LocalStorage) — "설정"이므로 유지
const LS_SAVE_ENABLED = 'rcts.research.saveEnabled';
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
// - catalog.js에서 enabled:false로 내려둔 5개 연구
// - "새로 시작"뿐 아니라, "진행중/예약중"도 즉시 취소
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
  // 카탈로그에서 enabled:false로 내려둔 경우만 최종 잠금
  return def?.enabled === false;
}

// ===== 전역 상태(싱글톤) =====
const firstUnlockTransportId = ref(null);

// 완료 연구(로그인 시 Firebase로만 저장)
const completedIds = ref(new Set());

// 진행 중 연구(단일)
const activeResearch = ref(null); // { id, startedAtMs, endsAtMs }

// ✅ 예약(대기열): 다중 큐
const queuedResearchIds = ref([]); // string[]

// 파생 효과 캐시
const unlockedTransportTiers = ref({}); // { [transportId]: number } 최고 티어
const incomeMultiplier = ref(1.0);

// ✅ 연구 속도 효과
const researchSpeedLevel = ref(0); // v2: 레벨1부터 5% 감산이므로 0부터
const researchDurationMultiplier = ref(1.0); // durationSec에 곱해질 값 (작을수록 빠름)

// ✅ 예약 레벨 (기본 1개, Lv2=3개, Lv3=5개)
const queueReserveLevel = ref(1);

// ✅ 도시 스케일(향후 UI/게이트용)
const cityScale = ref('NONE'); // NONE | REGION | CITY | COUNTRY | STATE | PLANET

// ✅ 기능 해금 상태(향후 시스템 게이트용)
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

// 저장 ON/OFF
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
  return 5; // lv === 3
}

// ===== 저장 토글 =====
function setSaveEnabled(v) {
  saveEnabled.value = !!v;
  saveBool(LS_SAVE_ENABLED, saveEnabled.value);

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

  // 자동저장은 로그인+로드완료에서만
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

// ✅ 기능 오픈(SYSTEM) 연구인지 판단(고정 8시간, 효율 미적용)
function isSystemFixedResearch(def) {
  if (!def) return false;
  if (def.timePolicy === 'FIXED') return true;
  return def.type === 'SYSTEM';
}

// ✅ 연구 효율 적용 대상인지 판단
function isScalableResearch(def) {
  if (!def) return false;
  if (def.timePolicy === 'SCALABLE') return true;
  // 하위호환: timePolicy 미지정이면 기존처럼 효율 적용(단, SYSTEM은 제외)
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

      // ✅ 예약 레벨 효과
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

  // ✅ 레벨당 -5% (Lv1=5%, Lv2=10% ...)
  const raw = 1 - 0.05 * Math.max(0, rsLevel);
  researchDurationMultiplier.value = Math.max(0.2, raw);

  cityScale.value = nextCityScale;
  unlockedFeatures.value = features;

  queueReserveLevel.value = Math.max(1, Math.min(3, reserveLv));

  // ✅ 예약 슬롯이 줄어드는 경우 초과분은 안전하게 잘라냄
  const limit = queueLimitByLevel(queueReserveLevel.value);
  if (queuedResearchIds.value.length > limit) {
    queuedResearchIds.value = queuedResearchIds.value.slice(0, limit);
  }
}

/**
 * ✅ 오빠 요구:
 * - tier2 이상은 항상 노출
 * - tier1은 reveal 규칙
 */
const visibleCatalog = computed(() => {
  return researchCatalog.filter((def) => {
    const tier = Number(def?.tier || 1);
    if (tier >= 2) return true;
    return revealSatisfied(def);
  });
});

// 첫 해금 후보(transportId 추출)
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

/**
 * ✅ 상태 머신
 * - 1차 해금 이후 “나머지 티어1 운송 해금 연구”는 전부 available
 */
function getStatus(researchId) {
  const def = getResearchDef(researchId);
  if (!def) return 'unknown';

  const tier = Number(def.tier || 1);

  if (tier === 1 && !revealSatisfied(def)) return 'hidden';

  if (isCompleted(researchId)) return 'done';
  if (activeResearch.value?.id === researchId) return 'active';
  if (queuedResearchIds.value.includes(researchId)) return 'queued';

  if (def.enabled === false) return 'comingSoon';

  if (tier === 1 && isTier1TransportUnlock(def) && !!firstUnlockTransportId.value) {
    return 'available';
  }

  if (!prerequisitesMet(def)) return 'locked';
  return 'available';
}

// Tier1 운송 해금 연구 id 찾기(첫 해금 즉시 완료용)
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

// ===== Firebase 저장/로드 =====
function canSave() {
  if (!saveEnabled.value) return false;
  if (!currentUid.value) return false;
  if (!isStateLoaded.value) return false;
  if (isHydrating) return false;
  return true;
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

  // ✅ 마이그레이션: queuedResearchId -> queuedResearchIds
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

  // 구버전 마이그레이션: transports[].locked=false → tier1 완료로 승격
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
  if (!canSave()) return;

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
  if (!canSave()) return;

  if (saveDebounceTimer) clearTimeout(saveDebounceTimer);
  saveDebounceTimer = setTimeout(async () => {
    await saveNow({ reason: 'debounced' });
  }, 800);
};

// ===== Public Actions =====
function setFirstUnlockTransport(transportId) {
  if (!transportId) return;
  if (firstUnlockTransportId.value) return;

  const researchId = findTier1UnlockResearchId(transportId);
  if (!researchId) return;

  firstUnlockTransportId.value = transportId;

  // 첫 해금은 즉시 완료
  completedIds.value.add(researchId);

  recomputeEffects();
  scheduleSave();
}

function startResearchInternal(researchId) {
  // ✅ 긴급 잠금: 엔진 레벨에서 시작 자체 차단
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
    scheduleSave();
    return { ok: true, instant: true };
  }

  activeResearch.value = {
    id: researchId,
    startedAtMs: now,
    endsAtMs: now + durSec * 1000,
  };

  scheduleSave();
  return { ok: true, instant: false };
}

/**
 * - 진행중이면 큐에 추가(레벨 기반 제한)
 * - 비어있으면 즉시 시작
 */
function startResearch(researchId) {
  // ✅ 긴급 잠금: UI/상태 꼬여도 엔진에서 차단
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
    scheduleSave();
    return { ok: true, queued: true };
  }

  return startResearchInternal(researchId);
}

function cancelQueuedResearch(researchId) {
  const before = queuedResearchIds.value.slice();
  const next = before.filter((id) => id !== researchId);
  if (next.length === before.length) return;
  queuedResearchIds.value = next;
  scheduleSave();
}

function cancelAllQueuedResearch() {
  if (queuedResearchIds.value.length === 0) return;
  queuedResearchIds.value = [];
  scheduleSave();
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
  if (!activeResearch.value || activeResearch.value.id !== researchId) return '00h 00m 00s';
  if (!isKstReady.value) return '00h 00m 00s';

  const diff = Math.max(0, activeResearch.value.endsAtMs - nowKstMs());
  const s = Math.floor(diff / 1000);
  const h = String(Math.floor(s / 3600)).padStart(2, '0');
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const sec = String(s % 60).padStart(2, '0');
  return `${h}h ${m}m ${sec}s`;
}

// 로그인 시: 원격 로드
async function loadForUser(uid) {
  if (!uid) return;

  if (saveDebounceTimer) {
    clearTimeout(saveDebounceTimer);
    saveDebounceTimer = null;
  }
  stopAutoSave();

  currentUid.value = uid;
  isLoadingFirebaseData.value = true;
  isStateLoaded.value = false;

  try {
    const refDoc = doc(db, 'users', uid, 'research', 'state');
    const snap = await getDoc(refDoc);

    isHydrating = true;
    if (snap.exists()) {
      applyRemoteState(snap.data());
      console.log('useResearch: Firebase 상태 로드 완료');
    } else {
      console.log('useResearch: Firebase 문서 없음 (초기 상태)');
      recomputeEffects();
    }
    isHydrating = false;

    isStateLoaded.value = true;
    syncAutoSave(true);
  } catch (e) {
    isHydrating = false;
    console.error('useResearch: Firebase 로드 실패:', e);
    isStateLoaded.value = false;
    stopAutoSave();
  } finally {
    isLoadingFirebaseData.value = false;
  }
}

function clearUserState() {
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

// ✅ 긴급 잠금: 진행/예약 중인 대상 연구를 즉시 정리
watchEffect(() => {
  if (isHydrating) return;

  let changed = false;

  // 진행중인 연구가 잠금 대상이면 즉시 취소
  if (activeResearch.value?.id && isHardLockedResearchId(activeResearch.value.id)) {
    activeResearch.value = null;
    changed = true;
  }

  // 예약 큐에서 잠금 대상 제거
  if (Array.isArray(queuedResearchIds.value) && queuedResearchIds.value.length > 0) {
    const filtered = queuedResearchIds.value.filter((id) => !isHardLockedResearchId(id));
    if (filtered.length !== queuedResearchIds.value.length) {
      queuedResearchIds.value = filtered;
      changed = true;
    }
  }

  if (changed) scheduleSave();
});

// ✅ 연구 완료 판정 + 예약 자동 실행(큐)
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

    scheduleSave();
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

    loadForUser,
    clearUserState,

    saveNow,
    scheduleSave,

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
