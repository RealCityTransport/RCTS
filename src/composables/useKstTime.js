// src/composables/useKstTime.js
import { ref, computed, onMounted, onUnmounted } from 'vue'

/**
 * RCTS 표준시간 (KST 기반 실시간)
 *
 * - 내부적으로는 timestamp(ms)를 기준으로 움직인다.
 * - tickMs 단위(기본 1000ms)로 nowMs가 갱신된다.
 * - 경과 시간 계산(diffMs)은 ms 단위(초 단위까지 정확)로 동작.
 *
 * 화면 표기는 utils/timeFormat 의 formatKstTimeYYYYMMDDHHMM 을 사용해서
 * YYYY. MM. DD. HH:MM 형식으로만 보여준다.
 */
export function useKstTime(tickMs = 1000) {
  const nowMs = ref(Date.now())
  let timerId = null

  const now = computed(() => new Date(nowMs.value))

  onMounted(() => {
    timerId = setInterval(() => {
      nowMs.value = Date.now()
    }, tickMs)
  })

  onUnmounted(() => {
    if (timerId !== null) {
      clearInterval(timerId)
      timerId = null
    }
  })

  /**
   * 경과 시간(ms) 계산
   * - from, to는 Date 또는 timestamp(ms) 모두 허용
   * - to를 생략하면 현재(nowMs 기준)를 사용
   */
  function diffMs(from, to) {
    const fromMs = from instanceof Date ? from.getTime() : Number(from)

    let toMs
    if (to === undefined) {
      toMs = nowMs.value
    } else {
      toMs = to instanceof Date ? to.getTime() : Number(to)
    }

    return toMs - fromMs
  }

  return {
    nowMs, // number (timestamp)
    now,   // computed Date
    diffMs,
  }
}
