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
  height: 100vh; /* 전체 화면 높이 */
  background-color: #1a1a2e; /* 다크 계열 배경색 (컨셉 반영) */
  color: #e0e0e0; /* 기본 텍스트 색상 */
  font-family: 'NexonLv1Gothic', sans-serif; /* 폰트 적용 (아직 적용 안 됐다면 추후 안내) */
}

.game-main-content {
  flex-grow: 1; /* 남은 공간을 모두 차지 */
  overflow-y: auto; /* 내용이 넘치면 스크롤 */
  padding: 1rem; /* 내부 여백 */
  display: flex; /* 중앙 콘텐츠도 flexbox로 관리 */
  justify-content: center; /* 수평 중앙 정렬 */
  align-items: flex-start; /* 수직 상단 정렬 (컨텐츠 시작점) */
  width: 100%;
}
</style>