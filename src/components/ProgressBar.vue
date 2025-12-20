<!-- src/components/ProgressBar.vue -->
<template>
  <div class="progress-bar-module-container">
    <span v-if="displayText" class="progress-display-text">{{ displayText }}</span>
    <div class="progress-bar-frame">
      <div class="progress-bar-fill" :style="{ width: displayPercentage + '%' }"></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  // 진행률 (0~100)
  percentage: {
    type: Number,
    required: true,
    validator: value => value >= 0 && value <= 100
  },
  // 진행바 위에 표시될 텍스트 (예: "30초 남음", "연구 완료!")
  displayText: {
    type: String,
    default: ''
  },
  // 진행바 색상 테마 (기본: positive-color)
  theme: {
    type: String,
    default: 'positive', // 'positive', 'accent', 'danger' 등 필요에 따라 확장 가능
  }
});

//percentage가 0~100 사이의 유효한 값인지 확인하고 0 미만이면 0, 100 초과면 100으로 보정
const displayPercentage = computed(() => Math.max(0, Math.min(100, props.percentage)));

// 나중에 theme에 따라 배경색을 바꿀 수 있도록 구현 가능. 지금은 일단 고정.
</script>

<style scoped lang="scss">
@use '../styles/progress-bar';
</style>