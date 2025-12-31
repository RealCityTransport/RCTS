<!-- src/components/vehicles/VehiclesListPanel.vue -->
<template>
  <section class="list-panel">
    <header class="list-header">
      <div>
        <h3 class="list-title">차량 목록</h3>
        <p class="list-sub">
          이 계정에 등록된 차량 및 편성들이 표시됩니다.
          차량을 선택하면 오른쪽에서 상세 정보와 노선 배정을 할 수 있습니다.
        </p>
      </div>

      <button
        type="button"
        class="primary-button"
        @click="$emit('create-vehicle')"
      >
        + 새 차량 등록
      </button>
    </header>

    <div class="toolbar">
      <div class="field search-field">
        <label class="field-label">검색</label>
        <input
          v-model="localSearch"
          type="text"
          class="field-input"
          placeholder="차량 이름으로 검색"
        />
      </div>

      <div class="field">
        <label class="field-label">유형</label>
        <select
          v-model="localTypeFilter"
          class="field-select"
        >
          <option value="all">전체</option>
          <option value="bus">버스</option>
          <option value="rail">철도</option>
          <option value="truck">트럭</option>
          <option value="air">비행기</option>
          <option value="ship">배</option>
          <option value="space">우주선</option>
        </select>
      </div>

      <div class="field">
        <label class="field-label">상태</label>
        <select
          v-model="localStatusFilter"
          class="field-select"
        >
          <option value="all">전체</option>
          <option value="idle">대기</option>
          <option value="active">운영중</option>
          <option value="maintenance">점검중</option>
        </select>
      </div>
    </div>

    <div
      v-if="!filteredVehicles.length"
      class="list-empty"
    >
      현재 조건에 해당하는 차량이 없습니다.
      <br />
      상단의
      <span class="highlight">[+ 새 차량 등록]</span> 버튼으로 테스트용 차량을 추가해 볼 수 있습니다.
    </div>

    <ul
      v-else
      class="vehicles-list"
    >
      <li
        v-for="vehicle in filteredVehicles"
        :key="vehicle.id"
        class="vehicle-item"
        :class="{ active: vehicle.id === selectedVehicleId }"
        @click="() => handleSelect(vehicle.id)"
      >
        <div class="vehicle-main">
          <div class="vehicle-title-row">
            <span class="vehicle-name">
              {{ vehicle.name }}
            </span>

            <span
              class="vehicle-status"
              :data-status="vehicle.status"
            >
              {{ statusLabel(vehicle.status) }}
            </span>
          </div>

          <div class="vehicle-meta-row">
            <span class="meta-tag type-tag">
              {{ typeLabel(vehicle.type) }}
            </span>
            <span class="meta-tag">
              {{ carsLabel(vehicle) }}
            </span>

            <span
              v-if="vehicle.capacity"
              class="meta-tag"
            >
              정원 {{ vehicle.capacity }}명
            </span>

            <span
              v-if="vehicle.assignedRouteName"
              class="meta-chip"
            >
              배정: {{ vehicle.assignedRouteName }}
            </span>
            <span
              v-else
              class="meta-chip meta-chip-dim"
            >
              미배정
            </span>
          </div>
        </div>

        <div class="vehicle-side">
          <div class="vehicle-stat">
            <div class="stat-label">최고속도</div>
            <div class="stat-value">
              <span v-if="vehicle.maxSpeedKmh">
                {{ vehicle.maxSpeedKmh }} km/h
              </span>
              <span v-else>
                -
              </span>
            </div>
          </div>
          <div class="vehicle-updated">
            <div class="updated-label">최근 갱신</div>
            <div class="updated-value">
              {{ vehicle.lastUpdatedAt || '-' }}
            </div>
          </div>
        </div>
      </li>
    </ul>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  vehicles: {
    type: Array,
    default: () => [],
  },
  selectedVehicleId: {
    type: String,
    default: null,
  },
})

const emit = defineEmits(['select-vehicle', 'create-vehicle'])

const localSearch = ref('')
const localTypeFilter = ref('all')
const localStatusFilter = ref('all')

const filteredVehicles = computed(() => {
  let list = props.vehicles || []

  const keyword = localSearch.value.trim().toLowerCase()
  if (keyword) {
    list = list.filter((v) =>
      (v.name || '').toLowerCase().includes(keyword),
    )
  }

  if (localTypeFilter.value !== 'all') {
    list = list.filter((v) => v.type === localTypeFilter.value)
  }

  if (localStatusFilter.value !== 'all') {
    list = list.filter((v) => v.status === localStatusFilter.value)
  }

  // 최근 갱신순 정렬
  return [...list].sort((a, b) =>
    (b.lastUpdatedAt || '').localeCompare(a.lastUpdatedAt || ''),
  )
})

function handleSelect(id) {
  emit('select-vehicle', id)
}

function statusLabel(status) {
  switch (status) {
    case 'idle':
      return '대기'
    case 'active':
      return '운영중'
    case 'maintenance':
      return '점검중'
    default:
      return status || '알 수 없음'
  }
}

function typeLabel(type) {
  switch (type) {
    case 'bus':
      return '버스'
    case 'rail':
      return '철도'
    case 'truck':
      return '트럭'
    case 'air':
      return '비행기'
    case 'ship':
      return '배'
    case 'space':
      return '우주선'
    default:
      return type || '기타'
  }
}

function carsLabel(vehicle) {
  const n = vehicle.carsCount ?? 1
  if (vehicle.type === 'rail') {
    return `${n}량 편성`
  }
  if (vehicle.type === 'truck' || vehicle.type === 'bus') {
    return n > 1 ? `${n}대 연결` : '단독 차량'
  }
  return n > 1 ? `${n}기 구성` : '단독 편성'
}
</script>

<style scoped>
.list-panel {
  padding: 12px;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.55);
  font-size: 0.82rem;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.list-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.list-title {
  font-size: 0.9rem;
  font-weight: 600;
}

.list-sub {
  font-size: 0.76rem;
  opacity: 0.8;
}

.primary-button {
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid rgba(94, 234, 212, 0.9);
  background: radial-gradient(
    circle at 0% 0%,
    rgba(45, 212, 191, 0.28),
    rgba(15, 23, 42, 0.9)
  );
  color: #e5e7eb;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.search-field {
  min-width: 160px;
  flex: 1;
}

.field-label {
  font-size: 0.74rem;
  opacity: 0.8;
}

.field-input,
.field-select {
  min-height: 28px;
  padding: 4px 8px;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.6);
  background: rgba(15, 23, 42, 0.9);
  color: #e5e7eb;
  font-size: 0.8rem;
}

.list-empty {
  margin-top: 8px;
  padding: 10px;
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.96);
  border: 1px dashed rgba(148, 163, 184, 0.7);
  text-align: center;
  line-height: 1.5;
}

.highlight {
  font-weight: 600;
  color: #a5b4fc;
}

.vehicles-list {
  list-style: none;
  margin: 8px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.vehicle-item {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  gap: 8px;
  padding: 8px;
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.97);
  border: 1px solid rgba(51, 65, 85, 0.9);
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    transform 0.05s ease;
}

.vehicle-item:hover {
  border-color: rgba(96, 165, 250, 0.9);
}

.vehicle-item.active {
  border-color: rgba(94, 234, 212, 0.95);
  background: radial-gradient(
    circle at 0% 0%,
    rgba(45, 212, 191, 0.12),
    rgba(15, 23, 42, 0.96)
  );
  transform: translateY(-1px);
}

.vehicle-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.vehicle-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.vehicle-name {
  font-weight: 600;
  font-size: 0.86rem;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.vehicle-status {
  font-size: 0.72rem;
  padding: 2px 6px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.7);
  white-space: nowrap;
}

.vehicle-status[data-status='active'] {
  border-color: rgba(52, 211, 153, 0.95);
}

.vehicle-status[data-status='idle'] {
  border-color: rgba(148, 163, 184, 0.9);
}

.vehicle-status[data-status='maintenance'] {
  border-color: rgba(250, 204, 21, 0.95);
}

.vehicle-meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.meta-tag {
  font-size: 0.74rem;
  opacity: 0.85;
}

.type-tag {
  font-weight: 600;
}

.meta-chip {
  font-size: 0.72rem;
  padding: 2px 6px;
  border-radius: 999px;
  background: rgba(30, 64, 175, 0.5);
  border: 1px solid rgba(129, 140, 248, 0.7);
}

.meta-chip-dim {
  background: rgba(15, 23, 42, 0.9);
  border-style: dashed;
  opacity: 0.8;
}

/* 오른쪽 요약 정보 */
.vehicle-side {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-end;
  gap: 4px;
  min-width: 120px;
}

.vehicle-stat {
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

.vehicle-updated {
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

/* 좁은 화면 */
@media (max-width: 600px) {
  .list-header {
    flex-direction: column;
    align-items: stretch;
  }

  .vehicle-item {
    flex-direction: column;
    align-items: stretch;
  }

  .vehicle-side {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    min-width: 0;
  }
}
</style>
