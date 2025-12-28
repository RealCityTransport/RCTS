<!-- src/components/main/MainVehiclesPage.vue -->
<template>
  <div class="vehicles-page">
    <header class="page-header">
      <h2 class="page-title">차량 관리</h2>
      <p class="page-desc">
        버스, 열차, 기타 운송수단의 도입·배치·정비 상태를 관리하는 영역입니다.
      </p>
    </header>

    <section class="content-card">
      <p class="placeholder">
        이 영역에는 차량 목록, 운행 상태, 정비 필요 여부, 배차 계획 등의 정보를 표시할 예정입니다.
      </p>
    </section>
  </div>
</template>

<script setup>
// 나중에 차량 상태/슬롯 시스템 연결
</script>

<style scoped>
.vehicles-page {
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
