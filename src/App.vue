<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue'
import { useSync } from '@/composables/useSync'
import { initializeServerTimeTracker } from '@/composables/useServerTime'
import { initializeKstTimeTracker } from '@/composables/useKstTime'

// 동기화 매니저: 앱 생애주기 동안 1회만 시작
useSync().start()

onMounted(() => {
  // ✅ 서버 기준 시간(오프셋) 먼저
  initializeServerTimeTracker()

  // ✅ 그 다음 KST 트래커 (서버 now 기반)
  initializeKstTimeTracker()
})
</script>
