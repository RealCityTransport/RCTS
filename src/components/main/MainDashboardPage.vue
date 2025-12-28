<!-- src/components/main/MainDashboardPage.vue -->
<template>
  <div class="dashboard-page">
    <!-- 상단 3분할 요약 영역 -->
    <section class="dashboard-grid">
      <MainStatusSummary class="dashboard-card" />
      <MainRouteSummary class="dashboard-card" />
      <MainVehicleSummary class="dashboard-card" />
    </section>

    <!-- 하단 로그 영역 -->
    <section class="log-section">
      <MainLogPanel />
    </section>
  </div>
</template>

<script setup>
import MainStatusSummary from '@/components/main/MainStatusSummary.vue'
import MainRouteSummary from '@/components/main/MainRouteSummary.vue'
import MainVehicleSummary from '@/components/main/MainVehicleSummary.vue'
import MainLogPanel from '@/components/main/MainLogPanel.vue'
</script>

<style scoped>
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 상단 3분할 레이아웃 */
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.dashboard-card {
  padding: 14px 12px;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.86);
  border: 1px solid rgba(148, 163, 184, 0.55);
}

/* 하단 로그 영역 */
.log-section {
  margin-top: 4px;
  padding: 0;
}

/* 반응형: 태블릿 이상에서 3분할 */
@media (min-width: 768px) {
  .dashboard-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
  }
}
</style>
