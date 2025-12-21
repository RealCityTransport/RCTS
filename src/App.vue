<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue'
import { initializeKstTimeTracker } from '@/composables/useKstTime'

// 최초 한 번만 KST 시간 추적 시작
onMounted(() => {
  initializeKstTimeTracker()
})
</script>