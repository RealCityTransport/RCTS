<!-- src/components/TheCenterArea.vue -->
<template>
  <div class="layout-area center-area">
    <div class="center-content-wrapper">
      <h2 class="main-title">Real City Transport Simulation</h2>
      <p class="subtitle">당신의 도시를 움직일 제국을 건설하세요!</p>

      <!-- 연구 허브 카드 -->
      <div class="research-hub-card">
        <h3 class="card-title">🚀 연구 허브 활성화 🚀</h3>
        <p class="card-description">첫 번째 운송 수단을 해금하고 도시 발전을 시작하세요!</p>
        <button class="research-start-btn">연구 시작하기</button>
      </div>

      <p class="game-guide-text">로그인하여 진행 상황을 저장하고 나만의 운송 제국을 키워보세요.</p>
    </div>
  </div>
</template>

<script setup>
// TheCenterArea 컴포넌트에는 현재 특별한 로직이 없으므로 비워둡니다.
</script>

<!-- scoped SCSS를 외부 .scss 파일로 분리하여 참조합니다. -->
<style scoped lang="scss">
@import '../styles/TheCenterArea.scss';
</style>