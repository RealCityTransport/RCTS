// src/composables/useEconomy.js
import { computed, reactive, readonly } from "vue";
import { getVehicleDef } from "@/data/vehicles/catalog";

// 선택: 오빠가 이미 쓰는 시간 유틸이 있으면 그걸 그대로 물려.
import { useKstTime } from "@/composables/useKstTime";

// 선택: 로그인/저장 구조가 이미 있으면 여기에 연결만.
// (없어도 로컬 저장만으로 정상 동작)
import { useAuth } from "@/composables/useAuth";

const STORAGE_KEY = "rcts_economy_state_v1";

/**
 * 전역 싱글톤 상태
 */
const state = reactive({
  version: 1,

  money: 0,

  // 보유 차량: { [vehicleId]: count }
  owned: {},

  // 연구 효과 캐시(경제는 연구를 “조회”만 함)
  unlockedCategories: new Set(), // Set은 직렬화 어려우니 저장 시 배열로 변환
  incomeMultiplier: 1.0,

  // 루프 제어
  loopRunning: false,
  loopTimer: null,

  // 오프라인/누적 계산용
  lastTickMs: 0,

  // 저장 토글(오빠가 최근 테스트한 저장 OFF 개념 반영)
  persistEnabled: true,
});

/**
 * 직렬화/역직렬화 helpers (Set 처리)
 */
function toSavableSnapshot() {
  return {
    version: state.version,
    money: state.money,
    owned: state.owned,
    unlockedCategories: Array.from(state.unlockedCategories),
    incomeMultiplier: state.incomeMultiplier,
    lastTickMs: state.lastTickMs,
    persistEnabled: state.persistEnabled,
  };
}

function applySnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== "object") return;

  state.money = Number(snapshot.money ?? 0);
  state.owned = snapshot.owned && typeof snapshot.owned === "object" ? snapshot.owned : {};
  state.unlockedCategories = new Set(Array.isArray(snapshot.unlockedCategories) ? snapshot.unlockedCategories : []);
  state.incomeMultiplier = Number(snapshot.incomeMultiplier ?? 1.0);
  state.lastTickMs = Number(snapshot.lastTickMs ?? 0);
  state.persistEnabled = snapshot.persistEnabled !== false;
}

function loadLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    applySnapshot(parsed);
    return true;
  } catch {
    return false;
  }
}

function saveLocal() {
  if (!state.persistEnabled) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSavableSnapshot()));
  } catch {
    // ignore
  }
}

/**
 * 연구 시스템과의 연결점:
 * - 경제는 연구 상태를 “입력값”으로만 받는다.
 */
function setResearchEffects({ unlockedCategories = [], incomeMultiplier = 1.0 } = {}) {
  state.unlockedCategories = new Set(unlockedCategories);
  state.incomeMultiplier = Number(incomeMultiplier || 1.0);
}

/**
 * 수익 계산(초당 단위)
 */
function calcIncomePerSec() {
  let total = 0;

  for (const [vehicleId, countRaw] of Object.entries(state.owned)) {
    const count = Number(countRaw || 0);
    if (count <= 0) continue;

    const def = getVehicleDef(vehicleId);
    if (!def) continue;

    total += def.baseIncomePerSec * count;
  }

  total *= state.incomeMultiplier;
  return total;
}

/**
 * 틱 처리: lastTickMs 기준으로 “경과 시간”만큼 누적 수익 반영
 */
function tick(nowMs) {
  if (!state.lastTickMs) state.lastTickMs = nowMs;

  const deltaMs = nowMs - state.lastTickMs;
  if (deltaMs <= 0) return;

  const incomePerSec = calcIncomePerSec();
  const deltaSec = deltaMs / 1000;

  const earned = incomePerSec * deltaSec;
  if (earned > 0) state.money += earned;

  state.lastTickMs = nowMs;
}

/**
 * 루프: 1초 간격(가볍고 안정적)
 */
function startLoop() {
  if (state.loopRunning) return;
  state.loopRunning = true;

  const { nowKstMs } = useKstTime(); // nowKstMs()가 있다고 가정. 없으면 Date.now()로 바꿔도 됨.
  const getNowMs = typeof nowKstMs === "function" ? nowKstMs : () => Date.now();

  // 즉시 1회 틱(오빠가 배포 들어가면 “이미 벌려 있어야” 하는 느낌도 맞춰줌)
  tick(getNowMs());
  saveLocal();

  state.loopTimer = setInterval(() => {
    tick(getNowMs());
    saveLocal();
  }, 1000);
}

function stopLoop() {
  state.loopRunning = false;
  if (state.loopTimer) clearInterval(state.loopTimer);
  state.loopTimer = null;
}

/**
 * 구매: 해금 체크 + 비용 차감 + 보유 증가
 */
function canBuy(vehicleId, count = 1) {
  const def = getVehicleDef(vehicleId);
  if (!def) return { ok: false, reason: "UNKNOWN_VEHICLE" };

  // 카테고리 해금 필요
  if (!state.unlockedCategories.has(def.category)) {
    return { ok: false, reason: "CATEGORY_LOCKED" };
  }

  const qty = Math.max(1, Math.floor(count));
  const cost = def.purchaseCost * qty;

  if (state.money < cost) return { ok: false, reason: "NOT_ENOUGH_MONEY" };
  return { ok: true, cost };
}

function buyVehicle(vehicleId, count = 1) {
  const check = canBuy(vehicleId, count);
  if (!check.ok) return check;

  const qty = Math.max(1, Math.floor(count));
  state.money -= check.cost;

  state.owned[vehicleId] = Number(state.owned[vehicleId] || 0) + qty;

  saveLocal();
  return { ok: true };
}

/**
 * 초기화/삭제(오빠가 데이터 지우는 테스트 자주 하니까 바로 제공)
 */
function resetEconomy() {
  state.money = 0;
  state.owned = {};
  state.lastTickMs = 0;
  saveLocal();
}

function setPersistEnabled(v) {
  state.persistEnabled = !!v;
  saveLocal();
}

/**
 * (선택) 로그인 저장 연결 훅
 * 오빠가 이미 useResearch에서 users/{uid}/... 저장하듯이,
 * 경제도 users/{uid}/economy/state 같은 경로로 저장/로드를 붙이면 됨.
 *
 * 여기서는 “연결 고리”만 만들어 둠.
 */
async function syncFromCloud(loadFn) {
  // loadFn: (uid) => snapshot
  const auth = useAuth?.();
  const uid = auth?.user?.uid;
  if (!uid || typeof loadFn !== "function") return { ok: false };

  const snap = await loadFn(uid);
  applySnapshot(snap);
  saveLocal();
  return { ok: true };
}

async function syncToCloud(saveFn) {
  // saveFn: (uid, snapshot) => void
  if (!state.persistEnabled) return { ok: false, reason: "PERSIST_DISABLED" };

  const auth = useAuth?.();
  const uid = auth?.user?.uid;
  if (!uid || typeof saveFn !== "function") return { ok: false };

  await saveFn(uid, toSavableSnapshot());
  return { ok: true };
}

const money = computed(() => state.money);
const incomePerSec = computed(() => calcIncomePerSec());

export function useEconomy() {
  // 최초 1회 로컬 로드(중복 로드해도 무해하지만 깔끔하게)
  if (!useEconomy.__inited) {
    loadLocal();
    useEconomy.__inited = true;
  }

  return {
    state: readonly(state),

    money,
    incomePerSec,

    startLoop,
    stopLoop,

    setResearchEffects,

    canBuy,
    buyVehicle,

    resetEconomy,
    setPersistEnabled,

    syncFromCloud,
    syncToCloud,
  };
}
useEconomy.__inited = false;
