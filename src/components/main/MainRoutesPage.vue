<!-- src/components/main/MainRoutesPage.vue -->
<template>
  <div class="routes-page">
    <header class="page-header">
      <h2 class="page-title">노선 관리</h2>
      <p class="page-desc">
        도시 전체의 주요 노선들을 설계·편집하고, 혼잡도와 수익성을 관리하는 영역입니다.
      </p>
    </header>

    <section class="content-card">
      <p class="placeholder">
        아직은 기본 레이아웃 단계입니다.<br />
        나중에 여기에서 노선 목록, 노선 상세, 혼잡도 맵 등을 순차적으로 붙여갈 예정입니다.
      </p>
    </section>
  </div>
</template>

<script setup>
// 나중에 실제 노선 데이터/컴포저블 연결
</script>

<style scoped>
.routes-page {
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
