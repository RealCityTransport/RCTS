// src/composables/useServerTime.js
import { ref, computed } from 'vue'
import { ref as dbRef, onValue, off } from 'firebase/database'
import { rtdb } from '@/plugins/firebase/config'

// 전역 싱글톤
const serverOffsetMs = ref(0)
const isServerTimeReady = ref(false)

let initialized = false
let offsetRef = null

export function initializeServerTimeTracker() {
  if (initialized) return
  initialized = true

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
  if (!offsetRef) return
  off(offsetRef)
  offsetRef = null
  initialized = false
  isServerTimeReady.value = false
}

export function useServerTime() {
  const serverNowMs = () => Date.now() + (serverOffsetMs.value || 0)

  return {
    serverOffsetMs,
    isServerTimeReady,
    serverNowMs,
  }
}
