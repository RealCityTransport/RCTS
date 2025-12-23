<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue'
import { useSync } from '@/composables/useSync'
import { initializeServerTimeTracker } from '@/composables/useServerTime'
import { initializeKstTimeTracker } from '@/composables/useKstTime'
import { REMOTE_ENABLED } from '@/plugins/firebase/config'

// ✅ 원격 기능은 PROD에서만
const REMOTE_OK = import.meta.env.PROD && !!REMOTE_ENABLED

onMounted(() => {
  // ✅ KST 표준시간은 DEV/PROD 무조건 시작
  // - DEV: 로컬 시간 기반
  // - PROD: 서버 시간 기반(오프셋은 아래 서버 트래커가 업데이트)
  initializeKstTimeTracker()

  // ✅ DEV: 저장/동기화 차단 정책 (여기서 종료)
  if (!REMOTE_OK) {
    return
  }

  // ✅ PROD: 동기화 매니저는 앱 생애주기 동안 1회만 시작
  useSync().start()

  // ✅ 서버 기준 시간(오프셋) 트래커
  initializeServerTimeTracker()
})
</script>
