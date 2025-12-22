// src/composables/useTimeFormat.js
import { computed } from 'vue';

/**
 * 공통 시간 포맷터
 *
 * 요구사항:
 * - 00h 이면 h 제거
 * - 00m 이면 m 제거
 * - 결과 예:
 *   - 1h 05m 10s
 *   - 30m 10s
 *   - 45s
 *
 * - ms/sec 어떤 입력이 오더라도 사용할 수 있게 분리 제공
 */

function pad2(n) {
  return String(Math.max(0, Number(n) || 0)).padStart(2, '0');
}

function splitSec(totalSec) {
  const s = Math.max(0, Math.floor(Number(totalSec) || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return { h, m, sec };
}

function formatParts({ h, m, sec }) {
  // h가 있으면: Hh MMm SSs (m/s는 2자리)
  if (h > 0) return `${h}h ${pad2(m)}m ${pad2(sec)}s`;

  // h가 없고 m이 있으면: Mm SSs (m은 필요하면 2자리 유지 or 그대로)
  if (m > 0) return `${m}m ${pad2(sec)}s`;

  // h/m 둘 다 없으면: Ss
  return `${sec}s`;
}

export function useTimeFormat() {
  const formatRemainMs = (ms) => {
    const sec = Math.max(0, Math.floor(Number(ms || 0) / 1000));
    return formatParts(splitSec(sec));
  };

  const formatRemainSec = (sec) => {
    return formatParts(splitSec(sec));
  };

  // 가끔 UI에서 ref/compute로 쓰고 싶을 때를 대비해 helper도 제공
  const makeRemainLabelFromMs = (msRef) =>
    computed(() => formatRemainMs(msRef.value));

  const makeRemainLabelFromSec = (secRef) =>
    computed(() => formatRemainSec(secRef.value));

  return {
    formatRemainMs,
    formatRemainSec,
    makeRemainLabelFromMs,
    makeRemainLabelFromSec,
  };
}
