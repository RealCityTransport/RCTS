<!-- src/components/TheLeftArea.vue -->
<template>
  <div class="layout-area left-area">
    <h2 class="area-title">운송 수단 목록</h2>
    
    <div class="transport-list">
      <div 
        v-for="transport in transportTypes" 
        :key="transport.id" 
        :class="['transport-card', { 'locked': transport.locked }]"
      >
        <span class="transport-icon">{{ transport.icon }}</span>
        <span class="transport-name">{{ transport.name }}</span>
        <span v-if="transport.locked" class="lock-icon">🔒</span>
        <span v-else class="status-indicator active">활성화됨</span>
      </div>
    </div>

    <p class="guide-text">연구를 통해 새로운 운송 수단을 해금하세요!</p>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useResearch } from '@/composables/useResearch'; 

const { transportTypes } = useResearch();
</script>

<style scoped lang="scss">
@use '@/styles/TheLeftArea.scss';
</style>