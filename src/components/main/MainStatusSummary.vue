<!-- src/components/main/MainStatusSummary.vue -->
<template>
  <div class="status-summary">
    <header class="panel-header">
      <h2 class="panel-title">도시 / 회사 상태</h2>
      <span class="panel-tag">STATUS</span>
    </header>

    <div class="panel-body">
      <ul class="stat-list">
        <li class="stat-item">
          <span class="label">총 승객 수</span>
          <span class="value">-</span>
        </li>
        <li class="stat-item">
          <span class="label">일일 수익</span>
          <span class="value">-</span>
        </li>
        <li class="stat-item">
          <span class="label">운영 중 노선</span>
          <span class="value">-</span>
        </li>
        <li class="stat-item">
          <span class="label">운행 차량 수</span>
          <span class="value">-</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
// 지금은 로직 없음. 나중에 props/composables 연결 예정.
</script>

<style scoped>
.status-summary {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.panel-title {
  font-size: 0.95rem;
  font-weight: 700;
}

.panel-tag {
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.8);
  text-transform: uppercase;
}

.panel-body {
  font-size: 0.8rem;
}

.stat-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-item .label {
  opacity: 0.8;
}

.stat-item .value {
  font-weight: 600;
}
</style>
