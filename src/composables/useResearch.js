// src/composables/useResearch.js
import { ref, computed, watchEffect } from 'vue';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/plugins/firebase/config';
import { useKstTime } from './useKstTime';

const { kstDate, isKstTimeReady } = useKstTime();

/**
 * ============================================================
 * Research Engine (Hardcoded v1)
 * - 게스트(비로그인)도 로그인과 동일하게 "플레이" 가능
 * - 차이점: Firebase 저장/로드만 로그인 상태에서 수행
 *
 * 추가 규칙(오빠 요청):
 * - 비로그인 상태에서 새로고침하면 초기화(택1부터 다시)
 *   => 게스트 상태를 localStorage에 저장하지 않는다.
 * ============================================================
 */

const TRANSPORT_IDS = ['bus', 'truck', 'rail', 'plane', 'ship', 'spaceship'];

const transportMeta = {
  bus: { name: '버스', icon: '🚌' },
  truck: { name: '트럭', icon: '🚚' },
  rail: { name: '철도', icon: '🚆' },
  plane: { name: '비행기', icon: '✈️' },
  ship: { name: '배', icon: '🚢' },
  spaceship: { name: '우주선', icon: '🚀' },
};

// 저장/자동저장 설정 (LocalStorage) — 이건 설정이므로 유지
const LS_SAVE_ENABLED = 'rcts.research.saveEnabled';
const LS_AUTOSAVE_ENABLED = 'rcts.research.autosave.enabled';
const LS_AUTOSAVE_BASE = 'rcts.research.autosave.base';
const LS_AUTOSAVE_INTERVAL = 'rcts.research.autosave.intervalMin';

// ===== 전역 상태 (싱글톤) =====
// ✅ 게스트는 새로고침 시 초기화해야 하므로 firstUnlockId를 localStorage에서 로드하지 않는다.
const firstUnlockId = ref(null);
const transports = ref(buildInitialTransports());

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

// ===== Helpers =====
function buildInitialTransports() {
  return TRANSPORT_IDS.map((id) => ({
    id,
    name: transportMeta[id]?.name ?? id,
    icon: transportMeta[id]?.icon ?? '❓',
    locked: true,
    isResearching: false,
    researchFinishTime: null,
    researchStartTime: null,
  }));
}

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

// ===== 연구 규칙/상태 =====
const isKstReady = computed(() => isKstTimeReady.value && kstDate.value instanceof Date);

function applyFirstUnlockRule() {
  if (!firstUnlockId.value) return;

  const chosen = transports.value.find(t => t.id === firstUnlockId.value);
  if (!chosen) return;

  chosen.locked = false;
  chosen.isResearching = false;
  chosen.researchStartTime = null;
  chosen.researchFinishTime = null;
}

const lockedTransports = computed(() => transports.value.filter(t => t.locked));
const unlockedTransports = computed(() => transports.value.filter(t => !t.locked));

const needsFirstUnlockSelection = computed(() => !firstUnlockId.value);

const firstUnlockCandidates = computed(() =>
  TRANSPORT_IDS.map(id => ({
    id,
    name: transportMeta[id]?.name ?? id,
    icon: transportMeta[id]?.icon ?? '❓',
  }))
);

/**
 * 게스트 전환(로그아웃 시 포함):
 * - 게스트도 플레이는 가능하되, "새로고침하면 초기화"이므로 로컬 영속은 하지 않음.
 * - 여기서는 Firebase 관련만 정리.
 */
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

// ===== 직렬화/역직렬화 =====
const serializeTransport = (t) => ({
  id: t.id,
  locked: !!t.locked,
  isResearching: !!t.isResearching,
  researchStartTimeMs: t.researchStartTime instanceof Date ? t.researchStartTime.getTime() : null,
  researchFinishTimeMs: t.researchFinishTime instanceof Date ? t.researchFinishTime.getTime() : null,
});

function applyRemoteState(remote) {
  const remoteFirst = typeof remote?.firstUnlockId === 'string' ? remote.firstUnlockId : null;
  firstUnlockId.value = remoteFirst;

  const map = new Map((remote?.transports || []).map(x => [x.id, x]));
  transports.value = buildInitialTransports().map(base => {
    const r = map.get(base.id);
    if (!r) return { ...base };

    return {
      ...base,
      locked: typeof r.locked === 'boolean' ? r.locked : base.locked,
      isResearching: typeof r.isResearching === 'boolean' ? r.isResearching : false,
      researchStartTime: typeof r.researchStartTimeMs === 'number' ? new Date(r.researchStartTimeMs) : null,
      researchFinishTime: typeof r.researchFinishTimeMs === 'number' ? new Date(r.researchFinishTimeMs) : null,
    };
  });

  // 규칙 우선 적용
  applyFirstUnlockRule();
}

// ===== 저장 로직(Firebase) =====
function canSave() {
  if (!saveEnabled.value) return false;
  if (!currentUid.value) return false;
  if (!isStateLoaded.value) return false;
  if (isHydrating) return false;
  return true;
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
      version: 4,
      firstUnlockId: firstUnlockId.value ?? null,
      transports: transports.value.map(serializeTransport),
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

// ===== Public API =====
export function useResearch() {
  /**
   * isHydrated = "플레이 가능 상태"
   * - 게스트: 원격 로드 없음 → 항상 true (즉시 플레이)
   * - 로그인: 로드 완료 후 true
   */
  const isHydrated = computed(() => (!currentUid.value) || isStateLoaded.value);

  // TheLeftArea 계약 유지
  const transportTypes = computed(() => transports.value);
  const getUnlockedTransports = unlockedTransports;

  // 최초 택1 (게스트도 가능, 단 새로고침하면 초기화됨)
  const setFirstUnlockTransport = (id) => {
    if (!TRANSPORT_IDS.includes(id)) return;
    if (firstUnlockId.value === id) return;

    firstUnlockId.value = id;
    applyFirstUnlockRule();

    scheduleSave(); // 로그인 상태면 저장, 게스트면 no-op
  };

  // 연구 시작 (게스트도 가능)
  const unlockTransport = (id) => {
    if (!firstUnlockId.value) return;

    const t = transports.value.find(x => x.id === id);
    if (!t || !isKstReady.value || t.isResearching || !t.locked) return;

    const now = new Date(kstDate.value.getTime());
    const ONE_HOUR_MS = 60 * 60 * 1000;
    const finish = new Date(now.getTime() + ONE_HOUR_MS);

    t.researchStartTime = now;
    t.researchFinishTime = finish;
    t.isResearching = true;

    scheduleSave();
  };

  const getResearchProgress = (id) => {
    const item = transports.value.find(t => t.id === id);
    if (
      !item ||
      !item.isResearching ||
      !(item.researchStartTime instanceof Date) ||
      !(item.researchFinishTime instanceof Date) ||
      !isKstReady.value
    ) return 0;

    const total = item.researchFinishTime.getTime() - item.researchStartTime.getTime();
    if (total <= 0) return 0;

    const elapsed = kstDate.value.getTime() - item.researchStartTime.getTime();
    return Math.max(0, Math.min(100, (elapsed / total) * 100));
  };

  const getResearchRemainingTime = (id) => {
    const item = transports.value.find(t => t.id === id);
    if (!item || !(item.researchFinishTime instanceof Date) || !isKstReady.value) return '00h 00m 00s';

    const diff = Math.max(0, item.researchFinishTime.getTime() - kstDate.value.getTime());
    const s = Math.floor(diff / 1000);
    const h = String(Math.floor(s / 3600)).padStart(2, '0');
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const sec = String(s % 60).padStart(2, '0');
    return `${h}h ${m}m ${sec}s`;
  };

  // 로그인 시: 원격 로드
  const loadForUser = async (uid) => {
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
        // 문서가 없으면: 현재 로컬(게스트 플레이 상태) 유지
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
  };

  // 로그아웃/게스트 전환
  const clearUserState = () => {
    becomeGuestMode();

    // 오빠 요구: 비로그인 새로고침=초기화.
    // 로그아웃은 새 세션처럼 시작하는 게 일관적이라 즉시 초기화해둠.
    firstUnlockId.value = null;
    transports.value = buildInitialTransports();
  };

  // 연구 완료 판정: 완료 시 locked=false → 연구목록에서 자동 제거
  watchEffect(() => {
    let changed = false;

    transports.value.forEach(t => {
      if (
        t.isResearching &&
        isKstReady.value &&
        t.researchFinishTime instanceof Date &&
        kstDate.value.getTime() >= t.researchFinishTime.getTime()
      ) {
        t.locked = false;
        t.isResearching = false;
        t.researchFinishTime = null;
        t.researchStartTime = null;
        changed = true;
      }
    });

    if (changed) scheduleSave();
  });

  return {
    // 택1
    firstUnlockId,
    needsFirstUnlockSelection,
    firstUnlockCandidates,
    setFirstUnlockTransport,

    // 센터 패널
    transportTypes,
    getUnlockedTransports,
    isHydrated,

    // 연구 목록/상태
    lockedTransports,
    unlockedTransports,

    // 액션/유틸
    unlockTransport,
    getResearchProgress,
    getResearchRemainingTime,
    isKstTimeReady,

    // Firebase API
    loadForUser,
    clearUserState,

    // 저장 API
    saveNow,
    scheduleSave,

    // 저장 설정
    saveEnabled,
    setSaveEnabled,

    // 자동저장 설정
    autoSaveEnabled,
    autoSaveBase,
    autoSaveIntervalMin,
    setAutoSaveEnabled,
    setAutoSaveBase,
    setAutoSaveIntervalMin,

    // 자동저장 상태
    autoSaveRunning,
    lastAutoSaveAtMs,

    // 플래그
    isLoadingFirebaseData,
    isSavingFirebaseData,
    isStateLoaded,
  };
}
