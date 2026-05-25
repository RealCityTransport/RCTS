<template>
  <WorldWaiting v-if="worldPhase === 'waiting_representative'" />
  <WorldBootPaper v-else-if="worldPhase === 'representative_arrived'" />
</template>

<script setup>
import { ref } from 'vue'
import WorldWaiting from '@/components/world/WorldWaiting.vue'
import WorldBootPaper from '@/components/world/WorldBootPaper.vue'

const worldPhase = ref('waiting_representative')

// 테스트용: 6초 뒤 대표자 도착 연출
setTimeout(() => {
  worldPhase.value = 'representative_arrived'
}, 6000)
</script>