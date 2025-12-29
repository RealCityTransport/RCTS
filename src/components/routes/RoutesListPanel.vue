<template>
  <section class="list-panel">
    <header class="list-header">
      <h3 class="list-title">노선 목록</h3>
      <p class="list-sub">
        선택한 계정에 저장된 노선들이 표시됩니다.
      </p>
    </header>

    <div
      v-if="!routes.length"
      class="list-empty"
    >
      아직 등록된 노선이 없습니다.<br />
      상단의
      <span class="highlight">[+ 새 노선 만들기]</span>
      버튼으로 첫 노선을 만들어보세요.
    </div>

    <ul
      v-else
      class="routes-list"
    >
      <li
        v-for="route in routes"
        :key="route.id"
        class="route-item"
        :class="{ active: route.id === selectedRouteId }"
        @click="() => handleSelect(route.id)"
      >
        <div class="route-main">
          <div class="route-title-row">
            <span class="route-name">
              {{ route.name }}
            </span>
            <span
              class="route-status"
              :data-status="route.status"
            >
              {{ statusLabel(route.status) }}
            </span>
          </div>

          <div class="route-meta-row">
            <span class="meta-tag">
              정류장 {{ route.stopsCount }}개
            </span>
            <span
              v-if="route.type"
              class="meta-tag"
            >
              {{ typeLabel(route.type) }}
            </span>
            <span
              v-for="tag in route.tags || []"
              :key="tag"
              class="meta-chip"
            >
              {{ tag }}
            </span>
          </div>
        </div>

        <div class="route-side">
          <div class="route-stat">
            <div class="stat-label">평균 혼잡도</div>
            <div class="stat-value">
              {{ Math.round((route.avgLoadFactor ?? 0) * 100) }}%
            </div>
          </div>
          <div class="route-updated">
            <div class="updated-label">최근 수정</div>
            <div class="updated-value">
              {{ route.lastUpdatedAt || '-' }}
            </div>
          </div>
        </div>
      </li>
    </ul>
  </section>
</template>

<script setup>
const props = defineProps({
  routes: {
    type: Array,
    default: () => [],
  },
  selectedRouteId: {
    type: String,
    default: null,
  },
})

const emit = defineEmits(['select-route'])

function handleSelect(id) {
  emit('select-route', id)
}

function statusLabel(status) {
  switch (status) {
    case 'active':
      return '운영 중'
    case 'paused':
      return '일시 중지'
    case 'draft':
      return '설계 중'
    default:
      return '알 수 없음'
  }
}

function typeLabel(type) {
  switch (type) {
    case 'virtual':
      return '가상 노선'
    case 'facility':
      return '시설 연계'
    case 'real':
      return '현실 기반'
    default:
      return '기타'
  }
}
</script>

<style scoped>
.list-panel {
  padding: 12px;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.86);
  border: 1px solid rgba(148, 163, 184, 0.55);
  font-size: 0.82rem;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.list-header {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.list-title {
  font-size: 0.9rem;
  font-weight: 600;
}

.list-sub {
  font-size: 0.76rem;
  opacity: 0.8;
}

.list-empty {
  margin-top: 12px;
  padding: 10px;
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.9);
  border: 1px dashed rgba(148, 163, 184, 0.6);
  text-align: center;
  line-height: 1.5;
}

.highlight {
  font-weight: 600;
  color: #a5b4fc;
}

.routes-list {
  list-style: none;
  margin: 6px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.route-item {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  gap: 8px;
  padding: 8px;
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(51, 65, 85, 0.9);
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    transform 0.05s ease;
}

.route-item:hover {
  border-color: rgba(96, 165, 250, 0.9);
}

.route-item.active {
  border-color: rgba(94, 234, 212, 0.95);
  background: radial-gradient(circle at 0% 0%, rgba(45, 212, 191, 0.12), rgba(15, 23, 42, 0.96));
  transform: translateY(-1px);
}

.route-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.route-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.route-name {
  font-weight: 600;
  font-size: 0.86rem;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.route-status {
  font-size: 0.72rem;
  padding: 2px 6px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.7);
  white-space: nowrap;
}

.route-status[data-status='active'] {
  border-color: rgba(45, 212, 191, 0.9);
}

.route-status[data-status='paused'] {
  border-color: rgba(250, 204, 21, 0.9);
}

.route-status[data-status='draft'] {
  border-color: rgba(148, 163, 184, 0.9);
}

.route-meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.meta-tag {
  font-size: 0.74rem;
  opacity: 0.8;
}

.meta-chip {
  font-size: 0.72rem;
  padding: 2px 6px;
  border-radius: 999px;
  background: rgba(30, 64, 175, 0.5);
  border: 1px solid rgba(129, 140, 248, 0.7);
}

/* 오른쪽 요약 정보 */
.route-side {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-end;
  gap: 4px;
  min-width: 120px;
}

.route-stat {
  text-align: right;
}

.stat-label {
  font-size: 0.7rem;
  opacity: 0.8;
}

.stat-value {
  font-size: 0.88rem;
  font-weight: 700;
}

.route-updated {
  text-align: right;
}

.updated-label {
  font-size: 0.68rem;
  opacity: 0.7;
}

.updated-value {
  font-size: 0.74rem;
  opacity: 0.9;
}

/* 좁은 화면에서 오른쪽 요약 줄이기 */
@media (max-width: 500px) {
  .route-item {
    flex-direction: column;
    align-items: stretch;
  }

  .route-side {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    min-width: 0;
  }
}
</style>
