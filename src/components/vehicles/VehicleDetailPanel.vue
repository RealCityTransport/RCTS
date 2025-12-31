<!-- src/components/vehicles/VehicleDetailPanel.vue -->
<template>
  <section class="vehicle-detail-panel">
    <header class="vehicle-detail-header">
      <div>
        <h3 class="detail-title">차량 상세 · 노선 배정</h3>
        <p class="detail-sub">
          선택된 차량의 기본 정보와 편성 개요를 확인하고,
          이 차량을 어느 노선에 투입할지 관리하는 영역입니다.
          실제 운행 및 스케줄링은 운영 메뉴에서 관리됩니다.
        </p>
      </div>
    </header>

    <div
      v-if="!vehicle"
      class="detail-empty"
    >
      왼쪽에서 차량을 먼저 선택하세요.
      <br />
      차량을 선택하면 이 영역에 상세 정보와 노선 배정 메뉴가 표시됩니다.
    </div>

    <div
      v-else
      class="detail-body"
    >
      <!-- 기본 정보 -->
      <section class="detail-section">
        <h4 class="section-title">기본 정보</h4>

        <div class="field-inline">
          <div class="field-block">
            <div class="field-label">차량 이름</div>
            <div class="field-value strong">
              {{ vehicle.name }}
            </div>
          </div>

          <div class="field-badges">
            <span class="badge type-badge">
              {{ typeLabel(vehicle.type) }}
            </span>
            <span
              class="badge status-badge"
              :data-status="vehicle.status"
            >
              {{ statusLabel(vehicle.status) }}
            </span>
          </div>
        </div>

        <div class="field-grid">
          <div class="field-block">
            <div class="field-label">차량 ID</div>
            <div class="field-value dim">
              {{ vehicle.id }}
            </div>
          </div>

          <div class="field-block">
            <div class="field-label">편성 구성</div>
            <div class="field-value">
              {{ carsLabel(vehicle) }}
            </div>
          </div>

          <div class="field-block">
            <div class="field-label">정원(승객)</div>
            <div class="field-value">
              <span v-if="vehicle.capacity">
                {{ vehicle.capacity.toLocaleString('ko-KR') }} 명
              </span>
              <span v-else>-</span>
            </div>
          </div>

          <div class="field-block">
            <div class="field-label">최고 속도</div>
            <div class="field-value">
              <span v-if="vehicle.maxSpeedKmh">
                {{ vehicle.maxSpeedKmh }} km/h
              </span>
              <span v-else>-</span>
            </div>
          </div>

          <div class="field-block">
            <div class="field-label">최근 갱신</div>
            <div class="field-value">
              {{ vehicle.lastUpdatedAt || '-' }}
            </div>
          </div>
        </div>
      </section>

      <!-- 노선 배정 -->
      <section class="detail-section">
        <h4 class="section-title">노선 배정</h4>

        <div class="assign-row">
          <div class="field-block">
            <div class="field-label">현재 배정 상태</div>

            <template v-if="vehicle.assignedRouteId">
              <div class="field-value">
                <span class="assigned-pill">
                  {{ vehicle.assignedRouteName || '알 수 없는 노선' }}
                </span>
              </div>
              <p class="help-text">
                이 차량은 현재 위 노선에 투입되어 있습니다.
                다른 노선에 배정하거나, 배정을 해제하여 대기 차량으로 돌릴 수 있습니다.
              </p>
            </template>

            <template v-else>
              <div class="field-value">
                <span class="assigned-pill assigned-pill-empty">
                  미배정 상태
                </span>
              </div>
              <p class="help-text">
                이 차량은 아직 어떤 노선에도 투입되지 않은 상태입니다.
                아래에서 노선을 선택해 배정할 수 있습니다.
              </p>
            </template>
          </div>
        </div>

        <div class="assign-row">
          <div class="field-block">
            <div class="field-label">노선 선택</div>
            <select
              v-model="selectedRouteId"
              class="route-select"
            >
              <option value="">노선 선택 안 함</option>
              <option
                v-for="route in routes"
                :key="route.id"
                :value="route.id"
              >
                {{ route.name }} ({{ statusLabel(route.status) }})
              </option>
            </select>
          </div>

          <div class="assign-actions">
            <button
              type="button"
              class="primary-action"
              :disabled="!selectedRouteId"
              @click="assignRouteClick"
            >
              선택 노선에 배정
            </button>

            <button
              v-if="vehicle.assignedRouteId"
              type="button"
              class="secondary-action"
              @click="unassignRouteClick"
            >
              배정 해제 (대기 상태로)
            </button>
          </div>
        </div>

        <p class="assign-note">
          노선 배정은 이 차량이 **어느 노선에 투입되어 있는지**를 결정하는 단계입니다.
          실제 운행 스케줄, 수익, 혼잡도 등은 운영 메뉴에서 별도로 처리합니다.
        </p>
      </section>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  vehicle: {
    type: Object,
    default: null,
  },
  routes: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['assign-route', 'unassign-route'])

const selectedRouteId = ref('')

watch(
  () => props.vehicle,
  (v) => {
    if (!v) {
      selectedRouteId.value = ''
      return
    }

    // 기본값: 현재 배정된 노선이 있으면 그걸 세팅
    if (v.assignedRouteId) {
      selectedRouteId.value = v.assignedRouteId
    } else {
      selectedRouteId.value = ''
    }
  },
  { immediate: true },
)

const hasRoutes = computed(() => (props.routes || []).length > 0)

function statusLabel(status) {
  switch (status) {
    case 'idle':
      return '대기'
    case 'active':
      return '운영중'
    case 'maintenance':
      return '점검중'
    case '설계중':
    case 'draft':
      return '설계중'
    case '운영중':
    case 'active-route':
      return '운영중'
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

function assignRouteClick() {
  if (!props.vehicle) return
  if (!selectedRouteId.value) return
  emit('assign-route', {
    vehicleId: props.vehicle.id,
    routeId: selectedRouteId.value,
  })
}

function unassignRouteClick() {
  if (!props.vehicle) return
  emit('unassign-route', {
    vehicleId: props.vehicle.id,
  })
}
</script>

<style scoped>
.vehicle-detail-panel {
  padding: 10px 10px 12px;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.94);
  border: 1px solid rgba(148, 163, 184, 0.6);
  font-size: 0.82rem;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.vehicle-detail-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.detail-title {
  font-size: 0.9rem;
  font-weight: 600;
}

.detail-sub {
  font-size: 0.76rem;
  opacity: 0.8;
}

/* 빈 상태 */
.detail-empty {
  margin-top: 10px;
  padding: 12px 10px;
  border-radius: 12px;
  border: 1px dashed rgba(148, 163, 184, 0.7);
  background: rgba(15, 23, 42, 0.96);
  text-align: center;
  line-height: 1.6;
}

/* 내용 */
.detail-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 4px;
}

.detail-section {
  padding: 8px 8px;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.98);
  border: 1px solid rgba(51, 65, 85, 0.85);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-title {
  font-size: 0.82rem;
  font-weight: 600;
}

/* 기본 정보 */
.field-block {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.field-label {
  font-size: 0.72rem;
  opacity: 0.78;
}

.field-value {
  font-size: 0.82rem;
}

.field-value.strong {
  font-weight: 600;
}

.field-value.dim {
  opacity: 0.75;
  font-size: 0.74rem;
}

.field-inline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.field-badges {
  display: flex;
  align-items: center;
  gap: 6px;
}

.badge {
  font-size: 0.72rem;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.9);
  white-space: nowrap;
}

.type-badge {
  border-color: rgba(129, 140, 248, 0.95);
}

.status-badge[data-status='idle'] {
  border-color: rgba(148, 163, 184, 0.9);
}

.status-badge[data-status='active'] {
  border-color: rgba(52, 211, 153, 0.95);
}

.status-badge[data-status='maintenance'] {
  border-color: rgba(250, 204, 21, 0.95);
}

/* grid */
.field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

/* 노선 배정 */
.assign-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.assigned-pill {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 999px;
  border: 1px solid rgba(52, 211, 153, 0.9);
  font-size: 0.78rem;
}

.assigned-pill-empty {
  border-style: dashed;
  border-color: rgba(148, 163, 184, 0.85);
  opacity: 0.9;
}

.help-text {
  margin-top: 4px;
  font-size: 0.74rem;
  opacity: 0.86;
  line-height: 1.4;
}

.route-select {
  margin-top: 2px;
  padding: 5px 8px;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.8);
  background: rgba(15, 23, 42, 0.98);
  color: #e5e7eb;
  font-size: 0.8rem;
  min-width: 180px;
}

.assign-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.primary-action {
  padding: 5px 12px;
  border-radius: 999px;
  border: 1px solid rgba(59, 130, 246, 0.95);
  background: radial-gradient(
    circle at 0% 0%,
    rgba(59, 130, 246, 0.28),
    rgba(15, 23, 42, 0.98)
  );
  color: #e5e7eb;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.primary-action:disabled {
  opacity: 0.5;
  cursor: default;
}

.secondary-action {
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.9);
  background: rgba(15, 23, 42, 0.98);
  color: #e5e7eb;
  font-size: 0.76rem;
  cursor: pointer;
}

.assign-note {
  margin-top: 4px;
  font-size: 0.74rem;
  opacity: 0.86;
  line-height: 1.5;
}

/* 반응형 */
@media (max-width: 700px) {
  .field-inline {
    flex-direction: column;
    align-items: flex-start;
  }

  .field-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .assign-row {
    flex-direction: column;
  }

  .assign-actions {
    align-items: flex-start;
  }
}
</style>
