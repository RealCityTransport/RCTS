<!-- src/components/main/MainVehicleSummary.vue -->
<template>
  <div class="vehicle-summary">
    <header class="panel-header">
      <h2 class="panel-title">차량 운행 요약</h2>
      <span class="panel-tag">VEHICLES</span>
    </header>

    <div class="panel-body">
      <ul class="stat-list">
        <li class="stat-item">
          <span class="label">운행 중</span>
          <span class="value">-</span>
        </li>
        <li class="stat-item">
          <span class="label">대기 중</span>
          <span class="value">-</span>
        </li>
        <li class="stat-item">
          <span class="label">정비 필요</span>
          <span class="value">-</span>
        </li>
        <li class="stat-item">
          <span class="label">전체 가동률</span>
          <span class="value">-</span>
        </li>
      </ul>

      <p class="note">
        나중에 방치형/노선 시스템의 실제 차량 상태를 연결해서, 한눈에 운행 상황을 볼 수 있도록 사용할 영역입니다.
      </p>
    </div>
  </div>
</template>

<script setup>
// 현재는 데이터 없이 레이아웃만 정의
</script>

<style scoped>
.vehicle-summary {
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

.note {
  margin-top: 6px;
  font-size: 0.7rem;
  opacity: 0.7;
}
</style>
