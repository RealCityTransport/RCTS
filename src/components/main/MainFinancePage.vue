<!-- src/components/main/MainFinancePage.vue -->
<template>
  <div class="finance-page">
    <header class="page-header">
      <h2 class="page-title">재정 · 수익 관리</h2>
      <p class="page-desc">
        노선별 수익, 유지비, 투자, 연구비 등을 포함한 전체 재정 흐름을 관리하는 영역입니다.
      </p>
    </header>

    <section class="content-card">
      <p class="placeholder">
        이곳에는 손익 그래프, 노선별 수익 비교, 고정비/변동비, 투자 계획 등의 UI가 들어갈 예정입니다.
      </p>
    </section>
  </div>
</template>

<script setup>
// 향후 자금 시스템 연결
</script>

<style scoped>
.finance-page {
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
