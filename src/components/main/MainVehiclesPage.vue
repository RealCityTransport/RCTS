<!-- src/components/main/MainVehiclesPage.vue -->
<template>
  <div class="vehicles-page">
    <!-- 상단 헤더 카드 -->
    <section class="page-header-card">
      <header class="page-header">
        <h2 class="page-title">차량 · 장비 관리</h2>
        <p class="page-desc">
          버스, 트럭, 철도 차량, 비행기, 선박, 우주선 등
          계정이 보유한 모든 운송 수단과 편성을 관리하고,
          특정 노선에 어느 차량/편성을 투입할지 준비하는 영역입니다.
        </p>
      </header>
    </section>

    <!-- 메인 3열 레이아웃: 차량 목록 / 편성 에디터 / 노선 배치 -->
    <section class="vehicles-layout-card">
      <section class="vehicles-layout">
        <!-- 1️⃣ 좌측: 차량 타입 필터 + 차량 목록 (OpenTTD 스타일) -->
        <section class="vehicles-column vehicles-left">
          <header class="column-header">
            <div>
              <h3 class="column-title">차량 목록</h3>
              <p class="column-sub">
                운송 수단별 차량 리스트를 한눈에 보고,
                편성에 포함시킬 차량을 선택하는 영역입니다.
                OpenTTD 차량 목록처럼, 간단한 성능과 배치 노선을 함께 표시합니다.
              </p>
            </div>
          </header>

          <!-- 타입 필터 -->
          <div class="type-filter-row">
            <button
              v-for="type in vehicleTypes"
              :key="type.value"
              type="button"
              class="type-chip"
              :class="{ active: activeType === type.value }"
              @click="activeType = type.value"
            >
              {{ type.label }}
            </button>
          </div>

          <!-- 차량 리스트 -->
          <div class="vehicles-list-wrapper">
            <div
              v-if="!filteredVehicles.length"
              class="vehicles-list-empty"
            >
              아직 등록된 차량 데이터가 없습니다.<br />
              추후 DTS 연동이 완료되면 이 영역에
              <span class="highlight">보유 차량 목록</span>
              이 표시됩니다.
            </div>

            <ul
              v-else
              class="vehicles-list"
            >
              <li
                v-for="vehicle in filteredVehicles"
                :key="vehicle.id"
                class="vehicle-item"
                :class="`mode-${vehicle.mode}`"
              >
                <div class="vehicle-main">
                  <!-- 아이콘/실루엣 자리 -->
                  <div class="vehicle-icon-slot">
                    <span class="vehicle-icon-label">
                      {{ modeShortLabel(vehicle.mode) }}
                    </span>
                  </div>

                  <!-- 텍스트 정보 -->
                  <div class="vehicle-text">
                    <!-- 이름 + 상태 -->
                    <div class="vehicle-name-row">
                      <span class="vehicle-name">
                        {{ vehicle.name }}
                      </span>
                      <span
                        class="vehicle-state-tag"
                        :data-state="vehicle.state"
                      >
                        {{ stateLabel(vehicle.state) }}
                      </span>
                    </div>

                    <!-- 스펙 / 타입 -->
                    <div class="vehicle-meta-row">
                      <span class="vehicle-mode-tag">
                        {{ modeLabel(vehicle.mode) }}
                      </span>
                      <span
                        v-if="vehicle.capacity != null"
                        class="vehicle-spec"
                      >
                        정원 {{ vehicle.capacity }}명
                      </span>
                      <span
                        v-if="vehicle.cargoCapacity != null"
                        class="vehicle-spec"
                      >
                        적재 {{ vehicle.cargoCapacity }}t
                      </span>
                      <span
                        v-if="vehicle.speed != null"
                        class="vehicle-spec"
                      >
                        최고 {{ vehicle.speed }} km/h
                      </span>
                    </div>

                    <!-- 배치 노선 -->
                    <div class="vehicle-route-row">
                      <span class="vehicle-route-label">배치 노선</span>
                      <span class="vehicle-route-value">
                        {{ vehicle.assignedRoute || '미배치' }}
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </section>

        <!-- 2️⃣ 가운데: 편성 에디터 -->
        <section class="vehicles-column vehicles-center">
          <header class="column-header">
            <div>
              <h3 class="column-title">편성 에디터</h3>
              <p class="column-sub">
                선택한 차량들을 순서대로 배치해 하나의 편성(Trainset)을 구성하는 영역입니다.
                현재는 레이아웃만 정의된 상태이며, 추후 DTS 차량 데이터와 연동할 예정입니다.
              </p>
            </div>
          </header>

          <div class="formation-editor">
            <div class="formation-track">
              <div class="formation-placeholder">
                아직 편성에 추가된 차량이 없습니다.<br />
                왼쪽에서 차량을 선택한 뒤,
                <span class="highlight">편성 슬롯</span>
                에 추가하는 흐름을 설계할 예정입니다.
              </div>
            </div>

            <div class="formation-actions">
              <button
                type="button"
                class="primary-button"
                disabled
              >
                편성 저장 (준비 중)
              </button>
              <p class="formation-note">
                현재는 UI 초안 단계입니다.<br />
                향후에는
                <strong>편성 저장 · 불러오기 · 복제</strong>
                기능과 함께,
                특정 편성을 노선에 곧바로 배치하는 플로우로 확장할 계획입니다.
              </p>
            </div>
          </div>
        </section>

        <!-- 3️⃣ 우측: 노선 배치 패널 -->
        <section class="vehicles-column vehicles-right">
          <header class="column-header">
            <div>
              <h3 class="column-title">노선 배치</h3>
              <p class="column-sub">
                내 계정의 노선 목록을 참고하여,
                현재 편성을 어떤 노선에 투입할지 결정하는 영역입니다.
              </p>
            </div>
          </header>

          <div class="route-assign-body">
            <div class="route-assign-empty">
              노선 데이터 연동 전 초기 상태입니다.<br />
              이후에는
              <span class="highlight">내 계정의 노선 목록</span>
              이 표시되고, 선택한 편성을 특정 노선에 배치하는
              <span class="highlight">“배치하기”</span>
              버튼이 추가될 예정입니다.
            </div>

            <div class="route-assign-footer">
              <p class="route-assign-note">
                이 화면의 목표는
                <strong>“보유 차량/편성 → 노선에 투입”</strong>
                까지만 처리하는 것입니다.<br />
                실제 운행 스케줄, 배차 간격, 피크 타임 운행 등은
                <strong>운행 메뉴</strong> 에서 관리합니다.
              </p>
            </div>
          </div>
        </section>
      </section>
    </section>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

/**
 * 차량 타입 필터
 * - 버스 / 트럭 / 철도 / 비행기 / 배 / 우주선
 */
const vehicleTypes = [
  { value: 'all', label: '전체' },
  { value: 'bus', label: '버스' },
  { value: 'truck', label: '트럭' },
  { value: 'rail', label: '철도' },
  { value: 'air', label: '비행기' },
  { value: 'ship', label: '배' },
  { value: 'space', label: '우주선' },
]

const activeType = ref('all')

/**
 * 임시 샘플 차량 데이터
 * - 나중에 DTS / Firestore 연동 시 교체 예정
 */
const allVehicles = ref([
  {
    id: 'veh-bus-001',
    name: '서울 시내버스 1호',
    mode: 'bus',
    capacity: 40,
    cargoCapacity: null,
    speed: 80,
    state: 'assigned',
    assignedRoute: '서울 시내버스 101',
  },
  {
    id: 'veh-bus-002',
    name: '광역버스 A1',
    mode: 'bus',
    capacity: 55,
    cargoCapacity: null,
    speed: 95,
    state: 'idle',
    assignedRoute: '',
  },
  {
    id: 'veh-truck-001',
    name: '도심 화물 트럭 1호',
    mode: 'truck',
    capacity: null,
    cargoCapacity: 12,
    speed: 90,
    state: 'idle',
    assignedRoute: '',
  },
  {
    id: 'veh-rail-001',
    name: '도시철도 1편성',
    mode: 'rail',
    capacity: 380,
    cargoCapacity: null,
    speed: 110,
    state: 'running',
    assignedRoute: '서울 지하철 1호선',
  },
  {
    id: 'veh-air-001',
    name: '중형 여객기 01',
    mode: 'air',
    capacity: 180,
    cargoCapacity: null,
    speed: 840,
    state: 'maintenance',
    assignedRoute: '',
  },
  {
    id: 'veh-ship-001',
    name: '연안 여객선 1호',
    mode: 'ship',
    capacity: 320,
    cargoCapacity: null,
    speed: 32,
    state: 'assigned',
    assignedRoute: '연안 여객 노선 A',
  },
  {
    id: 'veh-space-001',
    name: 'L1 궤도 셔틀 01',
    mode: 'space',
    capacity: 40,
    cargoCapacity: 5,
    speed: 28000,
    state: 'idle',
    assignedRoute: '',
  },
])

/** 필터링된 차량 목록 */
const filteredVehicles = computed(() => {
  const type = activeType.value
  if (type === 'all') return allVehicles.value
  return allVehicles.value.filter((v) => v.mode === type)
})

/** 운송 수단 라벨 */
function modeLabel(mode) {
  switch (mode) {
    case 'bus':
      return '버스'
    case 'truck':
      return '트럭'
    case 'rail':
      return '철도'
    case 'air':
      return '비행기'
    case 'ship':
      return '선박'
    case 'space':
      return '우주선'
    default:
      return '기타'
  }
}

/** 아이콘 슬롯에 표시할 짧은 라벨 */
function modeShortLabel(mode) {
  switch (mode) {
    case 'bus':
      return 'BUS'
    case 'truck':
      return 'TRK'
    case 'rail':
      return 'RAIL'
    case 'air':
      return 'AIR'
    case 'ship':
      return 'SHIP'
    case 'space':
      return 'SPC'
    default:
      return 'VEH'
  }
}

/** 차량 상태 라벨 */
function stateLabel(state) {
  switch (state) {
    case 'idle':
      return '대기 중'
    case 'assigned':
      return '노선 배치'
    case 'running':
      return '운행 중'
    case 'maintenance':
      return '점검 중'
    case 'retired':
      return '퇴역'
    default:
      return '상태 미정'
  }
}
</script>

<style scoped>
.vehicles-page {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 상단 헤더 카드 */
.page-header-card {
  padding: 12px;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.86);
  border: 1px solid rgba(148, 163, 184, 0.55);
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
  line-height: 1.5;
}

/* 메인 레이아웃 카드 */
.vehicles-layout-card {
  padding: 10px 10px;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.86);
  border: 1px solid rgba(148, 163, 184, 0.55);
}

/* 3열 레이아웃 */
.vehicles-layout {
  display: grid;
  grid-template-columns: minmax(0, 32%) minmax(0, 36%) minmax(0, 32%);
  gap: 10px;
  align-items: stretch;
}

.vehicles-column {
  padding: 8px;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.98);
  border: 1px solid rgba(51, 65, 85, 0.85);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.column-header {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.column-title {
  font-size: 0.9rem;
  font-weight: 600;
}

.column-sub {
  font-size: 0.76rem;
  opacity: 0.85;
  line-height: 1.4;
}

/* 좌측: 차량 타입 필터 + 목록 */
.type-filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 2px;
}

.type-chip {
  padding: 3px 10px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.8);
  background: rgba(15, 23, 42, 0.98);
  color: #e5e7eb;
  font-size: 0.74rem;
  cursor: pointer;
  white-space: nowrap;
}

.type-chip.active {
  border-color: rgba(59, 130, 246, 0.95);
  background: radial-gradient(
    circle at 0% 0%,
    rgba(59, 130, 246, 0.3),
    rgba(15, 23, 42, 0.98)
  );
}

/* 차량 리스트 영역 */
.vehicles-list-wrapper {
  margin-top: 6px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.vehicles-list-empty {
  padding: 10px;
  border-radius: 10px;
  border: 1px dashed rgba(148, 163, 184, 0.7);
  background: rgba(15, 23, 42, 0.96);
  text-align: center;
  font-size: 0.78rem;
  line-height: 1.6;
}

.highlight {
  font-weight: 600;
  color: #a5b4fc;
}

.vehicles-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* 차량 한 줄 (OpenTTD 목록 느낌) */
.vehicle-item {
  padding: 6px 8px;
  border-radius: 9px;
  background: rgba(15, 23, 42, 0.98);
  border: 1px solid rgba(51, 65, 85, 0.9);
  font-size: 0.8rem;
  display: flex;
  align-items: stretch;
  cursor: default;
}

.vehicle-main {
  display: flex;
  align-items: stretch;
  gap: 8px;
  width: 100%;
}

/* 아이콘 슬롯 */
.vehicle-icon-slot {
  width: 40px;
  min-width: 40px;
  height: 40px;
  border-radius: 8px;
  border: 1px solid rgba(75, 85, 99, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  opacity: 0.85;
}

/* 운송수단별 아이콘 배경 살짝 다르게 */
.vehicle-item.mode-bus .vehicle-icon-slot {
  border-color: rgba(96, 165, 250, 0.9);
}
.vehicle-item.mode-truck .vehicle-icon-slot {
  border-color: rgba(248, 181, 83, 0.9);
}
.vehicle-item.mode-rail .vehicle-icon-slot {
  border-color: rgba(129, 140, 248, 0.9);
}
.vehicle-item.mode-air .vehicle-icon-slot {
  border-color: rgba(248, 250, 252, 0.7);
}
.vehicle-item.mode-ship .vehicle-icon-slot {
  border-color: rgba(56, 189, 248, 0.9);
}
.vehicle-item.mode-space .vehicle-icon-slot {
  border-color: rgba(244, 114, 182, 0.9);
}

.vehicle-icon-label {
  opacity: 0.9;
}

/* 텍스트 영역 */
.vehicle-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

/* 이름 + 상태 */
.vehicle-name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.vehicle-name {
  font-size: 0.84rem;
  font-weight: 500;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.vehicle-state-tag {
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.9);
  white-space: nowrap;
}

/* 상태별 색감 */
.vehicle-state-tag[data-state='idle'] {
  border-color: rgba(148, 163, 184, 0.9);
}
.vehicle-state-tag[data-state='assigned'] {
  border-color: rgba(96, 165, 250, 0.9);
}
.vehicle-state-tag[data-state='running'] {
  border-color: rgba(52, 211, 153, 0.95);
}
.vehicle-state-tag[data-state='maintenance'] {
  border-color: rgba(250, 204, 21, 0.95);
}
.vehicle-state-tag[data-state='retired'] {
  border-color: rgba(239, 68, 68, 0.95);
}

/* 스펙 / 타입 */
.vehicle-meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  font-size: 0.74rem;
  opacity: 0.9;
}

.vehicle-mode-tag {
  padding: 1px 6px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.8);
}

.vehicle-spec {
  opacity: 0.85;
}

/* 배치 노선 */
.vehicle-route-row {
  font-size: 0.74rem;
  opacity: 0.9;
}

.vehicle-route-label {
  margin-right: 4px;
  opacity: 0.8;
}

.vehicle-route-value {
  font-weight: 500;
}

/* 가운데: 편성 에디터 */
.formation-editor {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.formation-track {
  min-height: 80px;
  border-radius: 10px;
  border: 1px dashed rgba(148, 163, 184, 0.7);
  background: radial-gradient(
    circle at 0% 0%,
    rgba(59, 130, 246, 0.16),
    rgba(15, 23, 42, 0.98)
  );
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
}

.formation-placeholder {
  font-size: 0.78rem;
  text-align: center;
  line-height: 1.6;
}

.formation-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.primary-button {
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid rgba(96, 165, 250, 0.9);
  background: rgba(37, 99, 235, 0.9);
  color: #e5e7eb;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.primary-button:disabled {
  opacity: 0.5;
  cursor: default;
}

.formation-note {
  font-size: 0.74rem;
  opacity: 0.85;
  line-height: 1.4;
}

/* 우측: 노선 배치 */
.route-assign-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.route-assign-empty {
  margin-top: 4px;
  padding: 10px;
  border-radius: 10px;
  border: 1px dashed rgba(148, 163, 184, 0.7);
  background: rgba(15, 23, 42, 0.96);
  font-size: 0.78rem;
  line-height: 1.6;
  text-align: center;
}

.route-assign-footer {
  font-size: 0.74rem;
  opacity: 0.9;
  line-height: 1.4;
}

.route-assign-note strong {
  font-weight: 700;
}

/* 반응형 */
@media (max-width: 1024px) {
  .vehicles-layout {
    grid-template-columns: minmax(0, 1fr);
  }

  .vehicles-column {
    min-height: 0;
  }

  .vehicles-list-wrapper {
    max-height: 260px;
  }
}
</style>
