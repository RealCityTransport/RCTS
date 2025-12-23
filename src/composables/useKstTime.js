// src/composables/useKstTime.js
import { ref, computed } from 'vue'
import { useServerTime } from '@/composables/useServerTime'

// 전역 싱글톤
const kstDate = ref(null)
const isKstTimeReady = ref(false)

let timerId = null
let initialized = false

const KST_OFFSET_MS = 9 * 60 * 60 * 1000

function computeKstDate(serverNowMs) {
  // serverNowMs는 UTC 기반 ms. 여기에 KST 오프셋 더해서 "KST 기준 시각"을 만든다.
  return new Date(serverNowMs + KST_OFFSET_MS)
}

export function initializeKstTimeTracker() {
  if (initialized) return
  initialized = true

  const { serverNowMs } = useServerTime()

  const tick = () => {
    kstDate.value = computeKstDate(serverNowMs())
    isKstTimeReady.value = true
  }

  tick()
  timerId = setInterval(tick, 1000) // 1초 해상도면 연구/프리뷰 충분히 안정적
}

export function stopKstTimeTracker() {
  if (timerId) {
    clearInterval(timerId)
    timerId = null
  }
  initialized = false
  isKstTimeReady.value = false
  kstDate.value = null
}

export function useKstTime() {
  const isReady = computed(() => isKstTimeReady.value && kstDate.value instanceof Date)

  return {
    kstDate,
    isKstTimeReady,
    isKstReady: isReady,
  }
}
