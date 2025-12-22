// src/composables/usePreviewFleet.js
import { ref, computed } from 'vue';
import { useResearch } from '@/composables/useResearch';

// 싱글톤(전역 상태)
const previewVehicles = ref([]);

// ✅ UI 갱신용 tick (남은시간 표시 갱신 트리거)
const nowTickMs = ref(Date.now());

let tickTimer = null;

// --- 시간 유틸 ---
function nowMs() {
  return Date.now();
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

function formatRemain(ms) {
  const diff = Math.max(0, ms);
  const s = Math.floor(diff / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${pad2(h)}h ${pad2(m)}m ${pad2(sec)}s`;
}

// --- 오빠가 정한 프리뷰 운행시간 규칙 ---
function pickBusRouteAndDurationSec() {
  const routes = ['시내버스', '광역버스', '시외버스', '고속버스'];
  const routeName = routes[Math.floor(Math.random() * routes.length)];

  const rndInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

  let minutes = 60;

  if (routeName === '시내버스') {
    minutes = rndInt(30, 120); // 30분~2시간
  } else if (routeName === '광역버스') {
    minutes = rndInt(60, 180); // 1시간~3시간
  } else if (routeName === '시외버스') {
    minutes = 120; // 2시간 고정
  } else if (routeName === '고속버스') {
    // 2시간~5시간, 극한 1%로 5~8시간
    const extreme = Math.random() < 0.01;
    minutes = extreme ? rndInt(300, 480) : rndInt(120, 300);
  }

  return { routeName, durationSec: minutes * 60 };
}

function pickDurationByTransport(transportId) {
  if (transportId === 'bus') return pickBusRouteAndDurationSec();

  const rndInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const minutes = rndInt(45, 150);
  return { routeName: transportId === 'truck' ? '화물운송' : '철도운송', durationSec: minutes * 60 };
}

function ensureTimerRunning() {
  if (tickTimer) return;

  tickTimer = setInterval(() => {
    // ✅ 1) UI 갱신 트리거(남은시간 차감 표시)
    nowTickMs.value = Date.now();

    // ✅ 2) 종료된 운행은 다음 운행 자동 배정(현재는 기본 ON)
    const now = nowTickMs.value;
    const list = previewVehicles.value.slice();

    let changed = false;

    for (let i = 0; i < list.length; i += 1) {
      const v = list[i];
      if (!v) continue;

      if (now >= Number(v.endsAtMs || 0)) {
        const { routeName, durationSec } = pickDurationByTransport(v.transportId);
        const startedAtMs = now;
        const endsAtMs = now + durationSec * 1000;

        list[i] = {
          ...v,
          routeName,
          startedAtMs,
          endsAtMs,
        };
        changed = true;
      }
    }

    if (changed) previewVehicles.value = list;
  }, 1000);
}

function createPreviewVehicleIfMissing(transportId) {
  const id = `pv_${transportId}_1`;
  const exists = previewVehicles.value.some((v) => v?.id === id);
  if (exists) return;

  const now = nowMs();
  const { routeName, durationSec } = pickDurationByTransport(transportId);

  previewVehicles.value = [
    ...previewVehicles.value,
    {
      id,
      transportId,
      name: `프리뷰 ${transportId.toUpperCase()} 1호`,
      routeName,
      startedAtMs: now,
      endsAtMs: now + durationSec * 1000,
    },
  ];
}

function removePreviewVehicle(transportId) {
  const id = `pv_${transportId}_1`;
  previewVehicles.value = previewVehicles.value.filter((v) => v?.id !== id);
}

export function usePreviewFleet() {
  const research = useResearch();

  // ✅ 프리뷰 연구 완료 여부(이게 “오픈”의 절대 기준)
  const previewUnlocked = computed(() => {
    return !!research.completedIds.value?.has?.('sys_preview_starter_vehicles');
  });

  // ✅ 현재 해금된 운송수단 id 목록
  const unlockedTransportIds = computed(() => {
    const tiers = research.unlockedTransportTiers.value || {};
    return Object.keys(tiers).filter((id) => Number(tiers[id] || 0) >= 1);
  });

  function hydratePreviewVehicles() {
    if (!previewUnlocked.value) return;

    const unlocked = new Set(unlockedTransportIds.value || []);
    const starters = ['bus', 'truck', 'rail'];

    for (const t of starters) {
      if (unlocked.has(t)) createPreviewVehicleIfMissing(t);
      else removePreviewVehicle(t);
    }

    ensureTimerRunning();
  }

  // 수동 재롤링(= 노선 재분배 버튼)
  function rerollRoute(transportId) {
    const idx = previewVehicles.value.findIndex((v) => v?.transportId === transportId);
    if (idx < 0) return;

    const now = nowMs();
    const { routeName, durationSec } = pickDurationByTransport(transportId);

    const next = previewVehicles.value.slice();
    next[idx] = {
      ...next[idx],
      routeName,
      startedAtMs: now,
      endsAtMs: now + durationSec * 1000,
    };
    previewVehicles.value = next;
  }

  // ✅ 남은시간: nowTickMs를 참조해서 매초 반응형 갱신되게 만든다
  function remainingLabel(v) {
    // eslint-disable-next-line no-unused-expressions
    nowTickMs.value; // 의도적으로 의존성 연결
    if (!v) return '00h 00m 00s';
    return formatRemain(Number(v.endsAtMs || 0) - Date.now());
  }

  return {
    previewUnlocked,
    previewVehicles,
    hydratePreviewVehicles,
    rerollRoute,
    remainingLabel,
  };
}
