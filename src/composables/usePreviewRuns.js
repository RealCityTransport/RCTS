// src/composables/usePreviewRuns.js
import { ref, computed, watchEffect, onScopeDispose } from 'vue';
import { useResearch } from '@/composables/useResearch';
import { useTransportUnlocks } from '@/composables/useTransportUnlocks';
import { useTimeFormat } from '@/composables/useTimeFormat';

// ---- 로컬 저장 키 ----
const LS_KEY = 'rcts.preview.runs.v2';

// ---- 시간 규칙(요구사항) ----
// 운송수단 관계없이: 30분 ~ 3시간
const MIN = 60;
const RUN_MIN_SEC = 30 * MIN;
const RUN_MAX_SEC = 3 * 3600;

function randInt(min, max) {
  const a = Math.ceil(min);
  const b = Math.floor(max);
  return Math.floor(Math.random() * (b - a + 1)) + a;
}

function loadLocal() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (!obj || typeof obj !== 'object') return null;
    return obj;
  } catch {
    return null;
  }
}

function saveLocal(payload) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(payload));
  } catch {
    // ignore
  }
}

function normalizeRun(transportId, r) {
  const base = {
    transportId,
    status: 'idle', // running | idle
    startedAtMs: null,
    endsAtMs: null,
    durationSec: 0,
    routeName: '프리뷰 운행',
  };

  if (!r || typeof r !== 'object') return base;

  const status = (r.status === 'running' || r.status === 'idle') ? r.status : 'idle';

  return {
    ...base,
    ...r,
    transportId: r.transportId || transportId,
    status,
    routeName: r.routeName || '프리뷰 운행',
  };
}

export function usePreviewRuns() {
  const research = useResearch();
  const { unlockedTransports } = useTransportUnlocks();
  const { formatRemainMs } = useTimeFormat();

  // ✅ 프리뷰 연구 완료 여부
  const previewUnlocked = computed(() =>
    !!research.completedIds.value?.has?.('sys_preview_starter_vehicles')
  );

  // ✅ 자동화 연구 완료 여부
  const autoAssignUnlocked = computed(() =>
    !!research.completedIds.value?.has?.('sys_preview_auto_assign')
  );

  // ✅ 현재 해금된 운송수단 ID set
  const unlockedIds = computed(() => new Set((unlockedTransports.value || []).map((x) => x.id)));

  // runs state
  const runs = ref({});

  // ✅ UI 리렌더 트리거(초당 감소용)
  const clockMs = ref(Date.now());

  // ---- 초기 로드 ----
  const local = loadLocal();
  if (local?.runs && typeof local.runs === 'object') {
    runs.value = local.runs;
  }

  // ---- normalize(구버전 로컬데이터 방어) ----
  watchEffect(() => {
    const cur = runs.value || {};
    let changed = false;

    for (const [tid, r] of Object.entries(cur)) {
      const nr = normalizeRun(tid, r);
      if (!r?.status || r.status !== nr.status || r.routeName !== nr.routeName) {
        cur[tid] = nr;
        changed = true;
      }
    }

    if (changed) {
      runs.value = { ...cur };
      saveLocal({ runs: runs.value });
    }
  });

  function startRunNow(tid, nowMs = Date.now()) {
    const durationSec = randInt(RUN_MIN_SEC, RUN_MAX_SEC);
    const prev = normalizeRun(tid, runs.value?.[tid]);

    runs.value[tid] = {
      ...prev,
      transportId: tid,
      status: 'running',
      startedAtMs: nowMs,
      endsAtMs: nowMs + durationSec * 1000,
      durationSec,
      routeName: '프리뷰 운행',
    };
  }

  // ---- 프리뷰 활성화 시: 해금된 bus/truck/rail에 대해 초기 운행 1회 자동 생성 ----
  watchEffect(() => {
    if (!previewUnlocked.value) return;

    const ids = unlockedIds.value;
    const target = ['bus', 'truck', 'rail'].filter((id) => ids.has(id));

    let changed = false;

    for (const tid of target) {
      const existing = runs.value?.[tid];
      if (existing) continue;

      startRunNow(tid, Date.now());
      changed = true;
    }

    if (changed) saveLocal({ runs: runs.value });
  });

  // ---- 틱: (1) clock 갱신으로 화면 초당 업데이트 (2) running 종료 처리 ----
  let timer = null;

  function ensureTimer() {
    if (timer) return;

    timer = setInterval(() => {
      // ✅ 초당 감소(리렌더) 핵심
      clockMs.value = Date.now();

      if (!previewUnlocked.value) return;

      const now = clockMs.value;
      let changed = false;

      for (const tid of Object.keys(runs.value || {})) {
        const r = normalizeRun(tid, runs.value[tid]);
        if (r.status !== 'running') continue;

        const end = Number(r.endsAtMs || 0);
        if (!end) continue;

        if (now >= end) {
          if (autoAssignUnlocked.value) {
            // ✅ 자동화 연구 완료 후: 즉시 다음 운행 자동 개시
            startRunNow(tid, now);
          } else {
            // ✅ 자동화 연구 전: 운행대기(수동 버튼 대기)
            runs.value[tid] = {
              ...r,
              status: 'idle',
              startedAtMs: null,
              endsAtMs: null,
              durationSec: 0,
              routeName: '프리뷰 운행',
            };
          }
          changed = true;
        }
      }

      if (changed) saveLocal({ runs: runs.value });
    }, 1000);
  }

  function stopTimer() {
    if (!timer) return;
    clearInterval(timer);
    timer = null;
  }

  watchEffect(() => {
    if (!previewUnlocked.value) {
      stopTimer();
      return;
    }
    ensureTimer();

    onScopeDispose(() => {
      stopTimer();
    });
  });

  function remainingMsOf(transportId) {
    // ✅ clockMs를 읽어서 템플릿이 매초 리렌더 되게 함
    const tick = clockMs.value;

    const r = normalizeRun(transportId, runs.value?.[transportId]);
    if (r.status !== 'running') return 0;

    const end = Number(r.endsAtMs || 0);
    if (!end) return 0;

    return Math.max(0, end - tick);
  }

  function remainingOf(transportId) {
    return formatRemainMs(remainingMsOf(transportId));
  }

  function statusOf(transportId) {
    const r = normalizeRun(transportId, runs.value?.[transportId]);
    return r.status;
  }

  function startManualRun(transportId) {
    if (!previewUnlocked.value) return false;

    const r = normalizeRun(transportId, runs.value?.[transportId]);
    if (r.status !== 'idle') return false;

    startRunNow(transportId, Date.now());
    saveLocal({ runs: runs.value });

    // 버튼 누른 즉시 화면 갱신
    clockMs.value = Date.now();
    return true;
  }

  const runList = computed(() => {
    const arr = Object.values(runs.value || {}).map((r) => normalizeRun(r.transportId, r));
    return arr.sort((a, b) => String(a.transportId).localeCompare(String(b.transportId)));
  });

  return {
    previewUnlocked,
    autoAssignUnlocked,

    runs,
    runList,

    remainingOf,
    statusOf,

    startManualRun,
  };
}
