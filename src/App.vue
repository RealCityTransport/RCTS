<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue'
import { initializeKstTimeTracker } from '@/composables/useKstTime'
import { useSync } from '@/composables/useSync'

// 동기화 매니저: 앱 생애주기 동안 1회만 시작
useSync().start()

// KST 트래커: 최초 한 번만 시작
onMounted(() => {
  initializeKstTimeTracker()
})
</script>
