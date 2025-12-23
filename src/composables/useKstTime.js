// src/composables/useKstTime.js
import { ref, computed } from 'vue'
import { useServerTime } from '@/composables/useServerTime'

// ===== 전역 싱글톤 =====
const kstDate = ref(null)
const isKstTimeReady = ref(false)

let timerId = null
let initialized = false

const KST_OFFSET_MS = 9 * 60 * 60 * 1000

// PROD에서만 서버 시간 사용
const REMOTE_TIME_ENABLED =
  import.meta.env.PROD &&
  (import.meta.env.VITE_REMOTE_TIME_ENABLED ?? 'true') === 'true'

// ===== 시간 계산 =====

// PROD: UTC → KST
function computeKstFromUtc(utcMs) {
  return new Date(utcMs + KST_OFFSET_MS)
}

// DEV: 로컬 시간을 그대로 사용 (이미 KST라고 가정)
function computeLocalKst(localMs) {
  return new Date(localMs)
}

// HH:MM 포맷
function formatKstHHMM(d) {
  if (!(d instanceof Date)) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// ===== 초기화 =====
export function initializeKstTimeTracker() {
  if (initialized) return
  initialized = true

  let nowMsProvider
  let computeDate

  if (REMOTE_TIME_ENABLED) {
    // PROD: 서버 UTC 기반
    const { serverNowMs, isServerTimeReady } = useServerTime()

    nowMsProvider = () => {
      void isServerTimeReady
      return serverNowMs()
    }
    computeDate = computeKstFromUtc
  } else {
    // DEV: 로컬 시간 기반 (이미 KST)
    nowMsProvider = () => Date.now()
    computeDate = computeLocalKst
  }

  const tick = () => {
    try {
      const nowMs = Number(nowMsProvider?.() ?? Date.now())
      kstDate.value = computeDate(nowMs)
      isKstTimeReady.value = true
    } catch (e) {
      // 절대 UI 죽지 않게 폴백
      kstDate.value = new Date()
      isKstTimeReady.value = true
      console.warn('[useKstTime] fallback to local time:', e)
    }
  }

  tick()
  timerId = setInterval(tick, 60_000) // ✅ 1분 단위면 충분 (초 단위 불필요)
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

// ===== Public API =====
export function useKstTime() {
  // TopBar에서 호출되면 자동 보장
  if (!initialized) {
    initializeKstTimeTracker()
  }

  const isKstReady = computed(
    () => isKstTimeReady.value && kstDate.value instanceof Date
  )

  const kstString = computed(() =>
    isKstReady.value ? formatKstHHMM(kstDate.value) : ''
  )

  return {
    kstDate,
    isKstTimeReady,
    isKstReady,
    kstString, // ✅ HH:MM
  }
}
