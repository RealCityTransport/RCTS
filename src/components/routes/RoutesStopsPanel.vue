<!-- src/components/routes/RoutesStopsPanel.vue -->
<template>
  <section class="stops-panel">
    <header class="stops-header">
      <div class="stops-header-main">
        <div>
          <h3 class="stops-title">정류장 · 역 리스트</h3>
          <p class="stops-sub">
            선택된 노선의 실제 정류장/역 순서를 한눈에 볼 수 있는 영역입니다.
            드래그로 순서를 변경하고, 항목을 클릭해 세부 정보를 볼 수 있습니다.
          </p>
        </div>
      </div>

      <div class="stops-header-right">
        <div class="stops-badge">
          총
          <span class="strong">
            {{ totalStops }}
          </span>
          개
        </div>

        <button
          v-if="route && canAddStops"
          type="button"
          class="primary-button"
          @click="$emit('request-add-stop')"
        >
          정류장 추가
        </button>
      </div>
    </header>

    <div
      v-if="!route"
      class="stops-empty"
    >
      왼쪽에서 노선을 먼저 선택하면,
      <br />
      이 영역에 정류장/역 리스트가 표시됩니다.
    </div>

    <div
      v-else-if="!orderedStops.length"
      class="stops-empty"
    >
      현재 노선에 등록된 정류장/역 정보가 없습니다.
      <br />
      <span v-if="canAddStops">
        “정류장 추가” 버튼을 눌러 새 지점을 등록해 보세요.
      </span>
      <span v-else>
        이 노선은 시공 단계라 정류장을 새로 추가할 수 없습니다.
      </span>
    </div>

    <ul
      v-else
      class="stops-list"
    >
      <li
        v-for="(stop, index) in orderedStops"
        :key="stop.id"
        class="stop-item"
        :class="{
          'is-dragging': draggingIndex === index,
          'is-drop-target':
            dragOverIndex === index && draggingIndex !== null && draggingIndex !== index,
          'is-selected': selectedStopId === stop.id,
          'is-locked': !canReorderStops,
        }"
        :draggable="canReorderStops"
        @click="onClickStop(stop)"
        @dragstart="onDragStart(index, $event)"
        @dragover.prevent="onDragOver(index, $event)"
        @dragleave="onDragLeave(index, $event)"
        @drop.prevent="onDrop(index, $event)"
        @dragend="onDragEnd"
      >
        <div class="stop-main">
          <!-- 순서 동그라미 -->
          <div class="stop-seq">
            {{ index + 1 }}
          </div>

          <div class="stop-text">
            <!-- 이름 -->
            <div class="stop-name">
              {{ stop.name }}
            </div>

            <!-- 순서 n / N -->
            <div class="stop-order">
              순서
              <span class="order-strong">
                {{ index + 1 }}
              </span>
              /
              <span class="order-total">
                {{ totalStops }}
              </span>
            </div>

            <!-- 타입 / 역할 태그 -->
            <div class="stop-tags">
              <span
                class="stop-chip"
                :data-kind="stop.kind"
              >
                {{ kindLabel(stop.kind) }}
              </span>
              <span
                v-if="stop.role"
                class="stop-chip stop-chip-soft"
              >
                {{ roleLabel(stop.role) }}
              </span>
            </div>

            <!-- 정류장 시공 상태 태그 -->
            <div class="stop-status">
              <span
                class="status-chip"
                :data-build="buildState(stop)"
              >
                {{ buildStatusLabel(stop) }}
              </span>
            </div>

            <!-- 거리 정보 -->
            <div class="stop-distance">
              <template v-if="index === 0">
                <span class="distance-label">출발 지점</span>
                <span class="distance-value distance-dim">
                  (이전 정류장 없음)
                </span>
              </template>
              <template v-else>
                <span class="distance-label">이전 정류장까지</span>
                <span class="distance-value">
                  {{ formatDistance(stop.distanceFromPrevKm) }}
                </span>
              </template>
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
  route: {
    type: Object,
    default: null,
  },
  selectedStopId: {
    type: String,
    default: null,
  },
})

const emit = defineEmits(['request-add-stop', 'reorder-stops', 'select-stop'])

/**
 * 정류장 추가 가능 여부
 * - 설계중/운영중: 추가 가능
 * - 건설중: 추가 불가
 */
const canAddStops = computed(() => {
  const status = props.route?.status
  if (!status) return true
  return status === '설계중' || status === '운영중'
})

/**
 * 정류장 순서 변경 가능 여부
 * - 설계중/운영중: 드래그 가능
 * - 건설중: 드래그 불가
 *   (완공 후 제약은 상위 스토어에서 built 순서 검사로 처리)
 */
const canReorderStops = computed(() => {
  const status = props.route?.status
  if (!status) return true
  return status !== '건설중'
})

/**
 * stops는 "저장된 순서 그대로" 보여줌.
 * (초기 데이터에서 seq 순으로 넣어두면 그대로 출력)
 */
const orderedStops = computed(() => {
  const stops = props.route?.stops || []
  return [...stops]
})

const totalStops = computed(() => {
  if (!props.route) return 0
  if (Array.isArray(props.route.stops)) return props.route.stops.length
  return props.route.stopsCount ?? 0
})

function kindLabel(kind) {
  switch (kind) {
    case 'station':
      return '역'
    case 'stop':
      return '정류장'
    default:
      return '지점'
  }
}

function roleLabel(role) {
  switch (role) {
    case 'hub':
      return '중심 허브'
    case 'transfer':
      return '환승'
    case 'terminal':
      return '종점'
    case 'facility':
      return '시설 연계'
    case 'normal':
    default:
      return '일반'
  }
}

/**
 * 정류장 시공 상태 (스타일용)
 * - building : 노선이 건설중(시공중)
 * - built    : 노선 운영중 + 완공 정류장
 * - planning : 설계중 정류장
 */
function buildState(stop) {
  const status = props.route?.status
  if (status === '건설중') return 'building'
  if (status === '운영중' && stop?.built) return 'built'
  return 'planning'
}

/**
 * 정류장 시공 상태 라벨
 */
function buildStatusLabel(stop) {
  const status = props.route?.status
  if (status === '건설중') {
    return '시공 중 정류장'
  }
  if (status === '운영중' && stop?.built) {
    return '완공 정류장'
  }
  if (status === '운영중') {
    return '설계중(추가) 정류장'
  }
  return '설계 중 정류장'
}

/* 거리 표시용 */
function formatDistance(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '— km'
  }
  return `${value.toFixed(1)} km`
}

/* 정류장 클릭 → 선택 (편집은 상세 패널에서) */
function onClickStop(stop) {
  emit('select-stop', stop.id)
}

/* 드래그 상태 관리 */
const draggingIndex = ref(null)
const dragOverIndex = ref(null)

function onDragStart(index, event) {
  if (!canReorderStops.value) return
  draggingIndex.value = index
  dragOverIndex.value = null
  event.dataTransfer?.setData('text/plain', String(index))
  event.dataTransfer?.setDragImage?.(event.target, 0, 0)
}

function onDragOver(index, event) {
  if (!canReorderStops.value) return
  if (draggingIndex.value === null) return
  if (index === draggingIndex.value) {
    dragOverIndex.value = null
  } else {
    dragOverIndex.value = index
  }
}

function onDragLeave(index, event) {
  if (!canReorderStops.value) return
  if (dragOverIndex.value === index) {
    dragOverIndex.value = null
  }
}

function onDrop(targetIndex, event) {
  if (!canReorderStops.value) return
  if (draggingIndex.value === null) return
  const from = draggingIndex.value
  const to = targetIndex

  dragOverIndex.value = null

  if (from === to) {
    draggingIndex.value = null
    return
  }

  const list = [...orderedStops.value]
  const [moved] = list.splice(from, 1)
  list.splice(to, 0, moved)

  // seq 재계산 (거리 값은 그대로 유지)
  const reSequenced = list.map((stop, idx) => ({
    ...stop,
    seq: idx + 1,
  }))

  emit('reorder-stops', reSequenced)
  draggingIndex.value = null
}

function onDragEnd() {
  draggingIndex.value = null
  dragOverIndex.value = null
}
</script>

<style scoped>
.stops-panel {
  padding: 12px;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.6);
  font-size: 0.82rem;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stops-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.stops-header-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stops-title {
  font-size: 0.9rem;
  font-weight: 600;
}

.stops-sub {
  margin-top: 2px;
  font-size: 0.76rem;
  opacity: 0.8;
}

.stops-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stops-badge {
  font-size: 0.76rem;
  opacity: 0.85;
  white-space: nowrap;
}

.stops-badge .strong {
  font-weight: 700;
}

.primary-button {
  padding: 5px 10px;
  border-radius: 999px;
  border: 1px solid rgba(45, 212, 191, 0.95);
  background: radial-gradient(
    circle at 0% 0%,
    rgba(45, 212, 191, 0.24),
    rgba(15, 23, 42, 0.98)
  );
  color: #e5e7eb;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.primary-button:hover {
  filter: brightness(1.06);
}

/* 빈 상태 */
.stops-empty {
  margin-top: 8px;
  padding: 10px;
  border-radius: 10px;
  border: 1px dashed rgba(148, 163, 184, 0.7);
  background: rgba(15, 23, 42, 0.96);
  text-align: center;
  line-height: 1.6;
}

/* 리스트 */
.stops-list {
  list-style: none;
  margin: 6px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stop-item {
  padding: 6px 8px;
  border-radius: 9px;
  background: rgba(15, 23, 42, 0.97);
  border: 1px solid rgba(51, 65, 85, 0.9);
  cursor: grab;
  transition: background 0.12s ease, border-color 0.12s ease;
}

.stop-item.is-selected {
  border-color: rgba(56, 189, 248, 0.95);
  background: radial-gradient(
    circle at 0% 0%,
    rgba(56, 189, 248, 0.18),
    rgba(15, 23, 42, 0.98)
  );
}

.stop-item.is-dragging {
  opacity: 0.65;
  border-style: dashed;
}

.stop-item.is-drop-target {
  border-color: rgba(56, 189, 248, 0.95);
  box-shadow: 0 0 0 1px rgba(56, 189, 248, 0.4);
}

/* 시공 이후 잠금 상태 시 시각적 표시 */
.stop-item.is-locked {
  cursor: default;
  opacity: 0.9;
}

/* 드래그 중에도 내용 틀어지지 않게 */
.stop-main {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 순서 동그라미 */
.stop-seq {
  width: 22px;
  height: 22px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.74rem;
  font-weight: 700;
  background: rgba(15, 23, 42, 1);
  border: 1px solid rgba(148, 163, 184, 0.9);
}

.stop-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.stop-name {
  font-size: 0.82rem;
  font-weight: 500;
}

/* 순서 n / N */
.stop-order {
  font-size: 0.74rem;
  opacity: 0.8;
}

.order-strong {
  font-weight: 700;
}

.order-total {
  opacity: 0.9;
}

/* 태그들 */
.stop-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 2px;
}

.stop-chip {
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.9);
}

.stop-chip[data-kind='station'] {
  border-color: rgba(94, 234, 212, 0.9);
}

.stop-chip[data-kind='stop'] {
  border-color: rgba(129, 140, 248, 0.9);
}

.stop-chip-soft {
  border-color: rgba(148, 163, 184, 0.7);
  opacity: 0.85;
}

/* 정류장 시공 상태 */
.stop-status {
  margin-top: 2px;
}

.status-chip {
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.9);
  opacity: 0.95;
}

.status-chip[data-build='planning'] {
  border-color: rgba(129, 140, 248, 0.9);
}

.status-chip[data-build='building'] {
  border-color: rgba(250, 204, 21, 0.95);
}

.status-chip[data-build='built'] {
  border-color: rgba(52, 211, 153, 0.95);
}

/* 거리 표시 */
.stop-distance {
  margin-top: 2px;
  font-size: 0.74rem;
  opacity: 0.86;
}

.distance-label {
  margin-right: 4px;
}

.distance-value {
  font-weight: 500;
}

.distance-dim {
  opacity: 0.7;
}
</style>
