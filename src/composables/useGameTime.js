// src/composables/useGameTime.js
import { ref, computed, watch } from 'vue'
import { useKstTime } from './useKstTime'

/**
 * 게임 시간 시스템
 *
 * - 표준시간(useKstTime)의 nowMs를 기반으로 동작한다.
 * - 속도(speed)에 따라 gameTimeMs 가 증가한다.
 *   - speed = 0  → 일시정지
 *   - speed = 1  → 현실 시간과 동일
 *   - speed = 2  → 2배속
 *   - speed = 4  → 4배속
 *
 * - 화면에서 시간 표기는 formatKstTimeYYYYMMDDHHMM 으로만 분 단위까지 보여주되,
 *   내부 계산은 ms 단위로 계속 이루어진다.
 */
export function useGameTime(options = {}) {
  const {
    initialSpeed = 1,
    // 시작 기준 시간 (timestamp ms 또는 Date)
    startAt,
  } = options

  const { nowMs } = useKstTime(1000) // 1초 tick

  // 게임 시간(ms)
  const gameTimeMs = ref(
    startAt instanceof Date
      ? startAt.getTime()
      : startAt != null
        ? Number(startAt)
        : nowMs.value,
  )

  const speed = ref(initialSpeed) // 0, 1, 2, 4 ...

  // 마지막 기준 nowMs 값
  let lastNowMs = nowMs.value

  // nowMs 가 1초마다 변할 때마다 게임 시간 갱신
  watch(
    nowMs,
    (current) => {
      const elapsedReal = current - lastNowMs
      lastNowMs = current

      if (speed.value > 0 && elapsedReal > 0) {
        const delta = elapsedReal * speed.value
        gameTimeMs.value += delta
      }
    },
    { flush: 'post' },
  )

  const gameTime = computed(() => new Date(gameTimeMs.value))

  function setSpeed(x) {
    speed.value = Number(x) || 0
  }

  /**
   * 게임 시간을 특정 시점으로 리셋
   * - to: Date 또는 timestamp(ms), 생략 시 현재(nowMs) 기준
   */
  function reset(to) {
    const baseMs =
      to instanceof Date
        ? to.getTime()
        : to != null
          ? Number(to)
          : nowMs.value

    gameTimeMs.value = baseMs
    lastNowMs = nowMs.value
  }

  return {
    gameTime,    // computed Date (표시는 util로 포맷)
    gameTimeMs,  // number (timestamp)
    speed,       // ref
    setSpeed,
    reset,
  }
}
