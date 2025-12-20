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

// 💡 모든 운송 수단을 기본적으로 잠금(locked: true) 상태로 변경합니다.
const transportTypes = ref([
  { id: 1, name: '버스', icon: '🚌', locked: true }, // 버스도 이제 잠김
  { id: 2, name: '트럭', icon: '🚚', locked: true },
  { id: 3, name: '철도', icon: '🚄', locked: true },
  { id: 4, name: '비행기', icon: '✈️', locked: true },
  { id: 5, name: '배', icon: '🚢', locked: true },
  { id: 6, name: '우주', icon: '🚀', locked: true },
]);
</script>

<!-- scoped SCSS를 외부 .scss 파일로 분리하여 참조합니다. -->
<style scoped lang="scss">
@import '../styles/TheLeftArea.scss';
</style>