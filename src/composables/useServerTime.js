// src/composables/useServerTime.js
import { ref, computed } from 'vue'
import { ref as dbRef, onValue, off } from 'firebase/database'
import { rtdb, REMOTE_ENABLED } from '@/plugins/firebase/config'

// 전역 싱글톤
const serverOffsetMs = ref(0)
const isServerTimeReady = ref(false)

let initialized = false
let offsetRef = null

// ✅ DEV에서는 원격 시간(RTDB) 트래킹 금지
const REMOTE_TIME_ENABLED =
  import.meta.env.PROD &&
  !!REMOTE_ENABLED &&
  (import.meta.env.VITE_REMOTE_TIME_ENABLED ?? 'true') === 'true'

export function initializeServerTimeTracker() {
  if (initialized) return
  initialized = true

  // ✅ DEV/원격 불가: 네트워크 없이 로컬 시간 기반으로 동작
  if (!REMOTE_TIME_ENABLED || !rtdb) {
    serverOffsetMs.value = 0
    isServerTimeReady.value = true
    offsetRef = null
    return
  }

  // RTDB: 서버 시간 오프셋(ms)
  offsetRef = dbRef(rtdb, '/.info/serverTimeOffset')

  onValue(
    offsetRef,
    (snap) => {
      const v = Number(snap.val() || 0)
      serverOffsetMs.value = Number.isFinite(v) ? v : 0
      isServerTimeReady.value = true
    },
    (err) => {
      console.warn('ServerTime: offset subscribe failed:', err)
      // 실패해도 앱은 돌아가게: 오프셋 0으로 처리
      serverOffsetMs.value = 0
      isServerTimeReady.value = true
    }
  )
}

export function stopServerTimeTracker() {
  // ✅ 원격이 꺼져 있으면 정리할 구독 자체가 없음
  if (!offsetRef) {
    initialized = false
    isServerTimeReady.value = false
    serverOffsetMs.value = 0
    return
  }

  try {
    off(offsetRef)
  } catch (e) {
    console.warn('ServerTime: off failed:', e)
  } finally {
    offsetRef = null
    initialized = false
    isServerTimeReady.value = false
    serverOffsetMs.value = 0
  }
}

export function useServerTime() {
  // offset이 0이면 그냥 Date.now()와 동일
  const serverNowMs = () => Date.now() + (serverOffsetMs.value || 0)

  const isReady = computed(() => isServerTimeReady.value === true)

  return {
    serverOffsetMs,
    isServerTimeReady,
    isServerTimeReadyComputed: isReady,
    serverNowMs,
  }
}
