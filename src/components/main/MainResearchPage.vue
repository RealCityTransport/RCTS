<!-- src/components/main/MainResearchPage.vue -->
<template>
  <div class="research-page">
    <header class="page-header">
      <h2 class="page-title">연구 · 개발</h2>
      <p class="page-desc">
        노선 효율, 차량 성능, 승객 서비스 등을 향상시키는 연구를 진행하는 영역입니다.
      </p>
    </header>

    <section class="content-card">
      <p class="placeholder">
        향후 이곳에는 연구 트리, 연구 큐, 진행 중인 연구, 해금된 효과들을 표시하는 UI가 들어가게 됩니다.
      </p>
    </section>
  </div>
</template>

<script setup>
// 향후 연구 시스템 연결
</script>

<style scoped>
.research-page {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.page-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.page-title {
  font-size: 1rem;
  font-weight: 700;
}

.page-desc {
  font-size: 0.82rem;
  opacity: 0.9;
}

.content-card {
  padding: 14px 12px;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.86);
  border: 1px solid rgba(148, 163, 184, 0.55);
  font-size: 0.82rem;
}

.placeholder {
  opacity: 0.9;
  line-height: 1.5;
}
</style>
