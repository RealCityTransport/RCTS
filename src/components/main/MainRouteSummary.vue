<!-- src/components/main/MainRouteSummary.vue -->
<template>
  <div class="route-summary">
    <header class="panel-header">
      <h2 class="panel-title">주요 노선 요약</h2>
      <span class="panel-tag">ROUTES</span>
    </header>

    <div class="panel-body">
      <ul class="route-list">
        <li
          v-for="route in routes"
          :key="route.id"
          class="route-item"
        >
          <div class="route-main">
            <span class="route-name">{{ route.name }}</span>
            <span class="route-congestion" :class="`level-${route.level}`">
              {{ route.congestion }}
            </span>
          </div>
          <div class="route-sub">
            <span class="label">이용객</span>
            <span class="value">{{ route.passengers }}</span>
          </div>
        </li>
      </ul>

      <p class="route-note">
        지금은 예시 데이터이며, 나중에 실제 노선/혼잡도 데이터를 연결하게 됩니다.
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// 임시 더미 데이터
const routes = ref([
  {
    id: 1,
    name: '도심 순환선',
    congestion: '혼잡',
    level: 'high',
    passengers: '-',
  },
  {
    id: 2,
    name: '공항 직통선',
    congestion: '보통',
    level: 'mid',
    passengers: '-',
  },
  {
    id: 3,
    name: '신도시 급행선',
    congestion: '여유',
    level: 'low',
    passengers: '-',
  },
])
</script>

<style scoped>
.route-summary {
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

.route-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.route-item {
  padding: 6px 0;
  border-bottom: 1px solid rgba(148, 163, 184, 0.25);
}

.route-item:last-child {
  border-bottom: none;
}

.route-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.route-name {
  font-weight: 600;
}

.route-congestion {
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.7);
}

.route-congestion.level-high {
  border-color: rgba(248, 113, 113, 1);
}

.route-congestion.level-mid {
  border-color: rgba(250, 204, 21, 1);
}

.route-congestion.level-low {
  border-color: rgba(52, 211, 153, 1);
}

.route-sub {
  display: flex;
  justify-content: space-between;
  margin-top: 2px;
  opacity: 0.85;
}

.route-sub .label {
  opacity: 0.75;
}

.route-sub .value {
  font-weight: 600;
}

.route-note {
  margin-top: 6px;
  font-size: 0.7rem;
  opacity: 0.7;
}
</style>
