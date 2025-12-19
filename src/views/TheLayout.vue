<!-- src/views/TheLayout.vue -->
<template>
  <div class="game-app-container">
    <TheHeader /> 

    <main class="game-main-content">
      <router-view /> 
    </main>

    <TheFooter /> 
  </div>
</template>

<script setup>
import TheHeader from '@/components/TheHeader.vue'; // 헤더 컴포넌트 임포트
import TheFooter from '@/components/TheFooter.vue'; // 푸터 컴포넌트 임포트
</script>

<style lang="scss" scoped>
.game-app-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #1a1a2e; /* 다크 계열 배경색 (컨셉 반영) */
  color: #e0e0e0; /* 기본 텍스트 색상 */
}

.game-main-content {
  flex-grow: 1;
  overflow-y: auto; /* ⭐⭐⭐ 세로 스크롤은 유지 ⭐⭐⭐ */
  overflow-x: hidden;
  width: 100%;
  // display: flex; /* 주석 처리 혹은 제거 - 콘텐츠가 꽉 채우도록 허용 */

  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
}
</style>