// src/composables/useAutoSaveScheduler.js
import { ref } from "vue";

/**
 * KST 기준 "분 경계"에 맞춰 다음 실행까지 delay(ms)를 계산
 * 예) interval=10 -> 10,20,30,40,50,00 분에 실행
 *
 * 테스트 용도로 nowMs를 주입할 수 있게 분리.
 */
export function calcDelayToNextKstBoundaryMs(intervalMin, nowMs = Date.now()) {
  const interval = Number(intervalMin);
  if (!Number.isFinite(interval) || interval <= 0) return 60_000;

  const intervalMs = interval * 60 * 1000;

  // KST는 UTC+9 고정 오프셋
  const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
  const kstNow = nowMs + KST_OFFSET_MS;

  const next = (Math.floor(kstNow / intervalMs) + 1) * intervalMs;
  const delay = next - kstNow;

  // 최소 1초 안전장치
  return Math.max(1000, delay);
}

/**
 * 자동 저장 스케줄러
 * - start() 호출 시: "KST 경계"에 맞춰 1회 실행 예약
 * - 실행 후: 다시 다음 경계로 재예약 (드리프트 최소화)
 * - stop()으로 완전 중지
 *
 * onExecute: 실제 저장 함수 (예: persistAll)
 * canExecute: 조건 함수 (예: saveEnabled && autoSaveEnabled && (로그인 여부 정책))
 */
export function useAutoSaveScheduler({ onExecute, canExecute }) {
  const running = ref(false);
  const lastRunAtMs = ref(0);

  let timerId = null;
  let getIntervalMin = () => 10; // 기본

  function clearTimer() {
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
  }

  async function tick() {
    clearTimer();

    // 중지 상태면 아무것도 하지 않음
    if (!running.value) return;

    const interval = Number(getIntervalMin()) || 10;
    const delay = calcDelayToNextKstBoundaryMs(interval);

    timerId = setTimeout(async () => {
      try {
        if (typeof canExecute === "function" && !canExecute()) {
          return;
        }
        await onExecute?.();
        lastRunAtMs.value = Date.now();
      } catch (e) {
        console.error("[AutoSaveScheduler] execute failed:", e);
      } finally {
        // 다음 경계로 재예약
        if (running.value) tick();
      }
    }, delay);
  }

  /**
   * intervalMinGetter: () => number
   * - interval 설정을 반영하기 위해 getter로 받는게 안전 (reactive/refs 대응)
   */
  function start(intervalMinGetter) {
    getIntervalMin = typeof intervalMinGetter === "function" ? intervalMinGetter : () => 10;
    running.value = true;
    tick();
  }

  function stop() {
    running.value = false;
    clearTimer();
  }

  function restart(intervalMinGetter) {
    stop();
    start(intervalMinGetter);
  }

  return {
    running,
    lastRunAtMs,
    start,
    stop,
    restart,
  };
}
