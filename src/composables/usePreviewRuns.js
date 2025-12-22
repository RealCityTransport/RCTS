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
    // ✅ 상태 정의:
    // idle   : (초기/미시작) - 기존 호환용
    // running: 운행중(시간 흐름)
    // ready  : 운행 완료 후 대기(수동 시작 대기)
    status: 'idle', // running | idle | ready
    startedAtMs: null,
    endsAtMs: null,
    durationSec: 0,
    routeName: '프리뷰 운행',
  };

  if (!r || typeof r !== 'object') return base;

  const status =
    (r.status === 'running' || r.status === 'idle' || r.status === 'ready')
      ? r.status
      : 'idle';

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
  // ✅ transportTypes를 가져와서 previewActive를 “단일 진실”로 사용
  const { transportTypes } = useTransportUnlocks();
  const { formatRemainMs } = useTimeFormat();

  // ✅ 프리뷰 연구 완료 여부(기존 유지)
  const previewUnlocked = computed(() =>
    !!research.completedIds.value?.has?.('sys_preview_starter_vehicles')
  );

  // ✅ 자동화 연구 완료 여부(기존 유지)
  const autoAssignUnlocked = computed(() =>
    !!research.completedIds.value?.has?.('sys_preview_auto_assign')
  );

  // ✅ "프리뷰에 실제로 표시/운행할 대상" = previewActive인 운송수단만
  const previewActiveIds = computed(() => {
    const list = transportTypes.value || [];
    return new Set(list.filter((t) => t?.previewActive).map((t) => t.id));
  });

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

  /**
   * ✅ 핵심 복구 로직
   * - 자동화 연구가 켜져있으면(=autoAssignUnlocked)
   *   ready/idle 상태가 남아있더라도 자동으로 다음 운행을 시작해야 한다.
   * - (자동화 연구 완료 순간, 혹은 새로고침 후에도) "00:00 멈춤" 방지
   */
  function ensureAutoRuns(nowMs = Date.now()) {
    if (!previewUnlocked.value) return false;
    if (!autoAssignUnlocked.value) return false;

    const ids = previewActiveIds.value;
    if (!ids || ids.size === 0) return false;

    let changed = false;

    for (const tid of ids) {
      const r = normalizeRun(tid, runs.value?.[tid]);

      // ✅ 자동화 모드에서는 running이 아니면 즉시 재시작
      if (r.status !== 'running') {
        startRunNow(tid, nowMs);
        changed = true;
      } else {
        // running인데 endsAtMs가 비어있거나 이상하면 재시작(데이터 꼬임 방지)
        const end = Number(r.endsAtMs || 0);
        if (!end || end <= nowMs) {
          startRunNow(tid, nowMs);
          changed = true;
        }
      }
    }

    if (changed) saveLocal({ runs: runs.value });
    return changed;
  }

  // ---- 프리뷰 활성화 시: "previewActive" 대상에 대해서만 초기 운행 1회 자동 생성 ----
  watchEffect(() => {
    if (!previewUnlocked.value) return;

    const ids = previewActiveIds.value; // ✅ 단일 진실 소스
    if (!ids || ids.size === 0) return;

    let changed = false;

    for (const tid of ids) {
      const existing = runs.value?.[tid];
      if (existing) continue;

      startRunNow(tid, Date.now());
      changed = true;
    }

    if (changed) saveLocal({ runs: runs.value });

    // ✅ 자동화 모드면, 혹시 기존 ready/idle이 남아있어도 즉시 복구
    ensureAutoRuns(Date.now());
  });

  // ---- 틱: (1) clock 갱신으로 화면 초당 업데이트 (2) running 종료 처리 ----
  let timer = null;

  function ensureTimer() {
    if (timer) return;

    timer = setInterval(() => {
      clockMs.value = Date.now();

      if (!previewUnlocked.value) return;

      const now = clockMs.value;
      const activeSet = previewActiveIds.value;
      let changed = false;

      // ✅ 자동화 모드면, ready/idle로 멈춘 것부터 먼저 복구
      if (autoAssignUnlocked.value) {
        const fixed = ensureAutoRuns(now);
        if (fixed) changed = true;
      }

      for (const tid of Object.keys(runs.value || {})) {
        if (!activeSet.has(tid)) continue;

        const r = normalizeRun(tid, runs.value[tid]);

        if (r.status !== 'running') continue;

        const end = Number(r.endsAtMs || 0);
        if (!end) continue;

        if (now >= end) {
          if (autoAssignUnlocked.value) {
            // ✅ 자동화 연구 완료 후: 즉시 다음 운행 자동 개시
            startRunNow(tid, now);
          } else {
            // ✅ 자동화 연구 전: 대기 상태로 고정
            runs.value[tid] = {
              ...r,
              status: 'ready',
              startedAtMs: null,
              endsAtMs: end,
              durationSec: r.durationSec || 0,
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
    const tick = clockMs.value;

    if (!previewActiveIds.value.has(transportId)) return 0;

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
    if (!previewActiveIds.value.has(transportId)) return 'idle';
    const r = normalizeRun(transportId, runs.value?.[transportId]);
    return r.status;
  }

  function startManualRun(transportId) {
    if (!previewUnlocked.value) return false;

    if (!previewActiveIds.value.has(transportId)) return false;

    // ✅ 자동화 연구가 끝나면 수동 시작 금지
    if (autoAssignUnlocked.value) return false;

    const r = normalizeRun(transportId, runs.value?.[transportId]);
    if (r.status !== 'ready') return false;

    startRunNow(transportId, Date.now());
    saveLocal({ runs: runs.value });

    clockMs.value = Date.now();
    return true;
  }

  // ✅ UI에 내보내는 리스트 자체를 “활성 대상만” 필터링
  const runList = computed(() => {
    const activeSet = previewActiveIds.value;
    const arr = Object.values(runs.value || {})
      .map((r) => normalizeRun(r.transportId, r))
      .filter((r) => activeSet.has(r.transportId));

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
