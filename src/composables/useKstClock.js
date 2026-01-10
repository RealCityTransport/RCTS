// src/composables/useKstClock.js
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

/**
 * KST 표준시간 표시용 컴포저블
 * - 초 단위(nowMs) 갱신
 * - 표시는 요일 + HH:MM, 날짜(YYYY.MM.DD)
 * - timeZone: Asia/Seoul 강제
 */
export function useKstClock(options = {}) {
  const {
    intervalMs = 1000,
    timeZone = 'Asia/Seoul',
    locale = 'ko-KR',
  } = options

  const nowMs = ref(Date.now())
  let timerId = null

  const parts = computed(() => {
    const d = new Date(nowMs.value)

    const dateStr = new Intl.DateTimeFormat(locale, {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d)

    // 예: "2026. 01. 11."
    const cleaned = dateStr.replace(/\s/g, '').replace(/\.$/, '')
    const ymd = cleaned.replace(/\./g, '.').replace(/\.$/, '')

    const weekday = new Intl.DateTimeFormat(locale, {
      timeZone,
      weekday: 'short',
    }).format(d)

    const time = new Intl.DateTimeFormat(locale, {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(d)

    return { ymd, weekday, time }
  })

  const kstDate = computed(() => parts.value.ymd)
  const kstWeekday = computed(() => parts.value.weekday)
  const kstTime = computed(() => parts.value.time)

  const start = () => {
    if (timerId) return
    timerId = window.setInterval(() => {
      nowMs.value = Date.now()
    }, intervalMs)
  }

  const stop = () => {
    if (!timerId) return
    window.clearInterval(timerId)
    timerId = null
  }

  onMounted(start)
  onBeforeUnmount(stop)

  return {
    nowMs,
    parts,
    kstDate,
    kstWeekday,
    kstTime,
    start,
    stop,
  }
}
