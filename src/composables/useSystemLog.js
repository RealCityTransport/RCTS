// src/composables/useSystemLog.js
import { ref, readonly } from 'vue'

/**
 * 전역 시스템 로그 스토어
 * - logs: 최근 로그 목록 (최신 순)
 * - addLog(type, message, payload?): 로그 추가
 * - clearLogs(): 전체 비우기
 *
 * type 예시:
 *  - 'route:create'
 *  - 'route:update'
 *  - 'stop:create'
 *  - 'stop:update'
 *  - 'stop:reorder'
 */
const logs = ref([])

let logSeq = 0
// ✅ 최대 로그 개수: 10개까지만 유지
const MAX_LOGS = 10

export function useSystemLog() {
  function addLog(type, message, payload = {}) {
    const now = new Date()

    logs.value.unshift({
      id: `log-${++logSeq}`,
      ts: now.toISOString(),
      type,
      message,
      payload,
    })

    // 오래된 로그는 잘라내기 (앞에서 10개만 유지)
    if (logs.value.length > MAX_LOGS) {
      logs.value = logs.value.slice(0, MAX_LOGS)
    }
  }

  function clearLogs() {
    logs.value = []
  }

  return {
    logs: readonly(logs),
    addLog,
    clearLogs,
  }
}
