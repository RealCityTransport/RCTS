<!-- src/components/routes/RouteDetailPanel.vue -->
<template>
  <section class="route-detail-panel">
    <header class="route-detail-header">
      <div>
        <h3 class="detail-title">노선 상세</h3>
        <p class="detail-sub">
          선택된 노선의 기본 정보와 진행 단계를 확인하고,
          이름 · 운송 수단 · 상태를 관리할 수 있습니다.
        </p>
      </div>
    </header>

    <div
      v-if="!route"
      class="detail-empty"
    >
      왼쪽에서 노선을 선택하면
      <br />
      이 영역에 노선 상세 정보가 표시됩니다.
    </div>

    <div
      v-else
      class="detail-body"
    >
      <!-- 진행 단계 요약 -->
      <section class="detail-section">
        <h4 class="section-title">노선 진행 단계</h4>

        <div class="status-row">
          <span class="status-pill" :data-phase="effectiveStatus">
            {{ statusLabel(effectiveStatus) }}
          </span>

          <span class="status-info">
            {{ phaseDescription }}
          </span>
        </div>

        <!-- 정류장 편집 가능 여부 안내 -->
        <p
          v-if="canEditStops"
          class="stops-edit-info stops-edit-on"
        >
          현재 단계에서는 정류장 추가 · 순서 변경 · 정보 수정이 가능합니다.
        </p>
        <p
          v-else
          class="stops-edit-info stops-edit-off"
        >
          이 노선은 시공이 시작된 이후 단계입니다. 정류장 추가나 수정은 할 수 없고,
          정류장 삭제만 가능합니다.
        </p>

        <div
          v-if="effectiveStatus === '설계중'"
          class="phase-actions"
        >
          <button
            type="button"
            class="primary-action"
            @click="startConstruction"
          >
            노선 확정 · 시공 시작 (1시간)
          </button>
        </div>

        <div
          v-else-if="effectiveStatus === '건설중'"
          class="phase-progress"
        >
          <div class="progress-label">
            시공 진행 중
          </div>
          <div class="progress-text">
            {{ constructionModeText }}
          </div>
          <div class="progress-text">
            {{ constructionProgressText }}
          </div>
        </div>

        <div
          v-else-if="effectiveStatus === '운영중'"
          class="phase-done"
        >
          노선 시공이 완료되어 운영 중입니다.
        </div>
      </section>

      <!-- 기본 정보 -->
      <section class="detail-section">
        <h4 class="section-title">기본 정보</h4>

        <div class="field-block field-inline">
          <div class="field-block">
            <div class="field-label">노선 이름</div>
            <input
              v-model="nameEdit"
              type="text"
              class="name-input"
              :placeholder="route.name"
            />
          </div>

          <button
            type="button"
            class="save-button"
            :disabled="!canSave"
            @click="handleSave"
          >
            변경 사항 저장
          </button>
        </div>

        <div class="field-grid">
          <div class="field-block">
            <div class="field-label">노선 ID</div>
            <div class="field-value dim">
              {{ route.id }}
            </div>
          </div>

          <!-- 유형: 설계중에는 드롭다운, 이후에는 텍스트 -->
          <div class="field-block">
            <div class="field-label">유형</div>
            <div class="field-value">
              <template v-if="effectiveStatus === '설계중'">
                <select
                  v-model="typeEdit"
                  class="type-select"
                >
                  <option
                    v-for="opt in typeOptions"
                    :key="opt.value"
                    :value="opt.value"
                  >
                    {{ opt.label }}
                  </option>
                </select>
              </template>
              <template v-else>
                {{ typeLabel(route.type) }}
              </template>
            </div>
          </div>

          <div class="field-block">
            <div class="field-label">상태(원본)</div>
            <div class="field-value">
              {{ statusLabel(route.status) }}
            </div>
          </div>

          <div class="field-block">
            <div class="field-label">정류장 수</div>
            <div class="field-value">
              {{ totalStops }} 개
            </div>
          </div>

          <!-- 운송 수단: 설계중에는 드롭다운, 이후에는 텍스트 -->
          <div class="field-block">
            <div class="field-label">운송 수단</div>
            <div class="field-value">
              <template v-if="effectiveStatus === '설계중'">
                <select
                  v-model="transportEdit"
                  class="transport-select"
                >
                  <option
                    v-for="opt in transportOptions"
                    :key="opt.value"
                    :value="opt.value"
                  >
                    {{ opt.label }}
                  </option>
                </select>
              </template>
              <template v-else>
                {{ transportLabel(route.transport) }}
              </template>
            </div>
          </div>
        </div>
      </section>

      <!-- 운영 요약 -->
      <section class="detail-section">
        <h4 class="section-title">운영 요약</h4>

        <div class="field-grid">
          <div class="field-block">
            <div class="field-label">평균 혼잡도(탑승률)</div>
            <div class="field-value">
              {{ congestionText }}
            </div>
          </div>

          <div class="field-block">
            <div class="field-label">최근 수정</div>
            <div class="field-value">
              {{ route.lastUpdatedAt || '-' }}
            </div>
          </div>

          <div class="field-block">
            <div class="field-label">생성 시각</div>
            <div class="field-value">
              {{ route.createdAt || '-' }}
            </div>
          </div>
        </div>

        <div class="revenue-row">
          <div class="field-block">
            <div class="field-label">최근 1시간 수익</div>
            <div class="field-value">
              {{ formatCurrency(route.revenueSummary?.lastHour) }}
            </div>
          </div>

          <div class="field-block">
            <div class="field-label">최근 1일 수익</div>
            <div class="field-value">
              {{ formatCurrency(route.revenueSummary?.lastDay) }}
            </div>
          </div>

          <div class="field-block">
            <div class="field-label">누적 수익</div>
            <div class="field-value">
              {{ formatCurrency(route.revenueSummary?.total) }}
            </div>
          </div>
        </div>
      </section>

      <!-- 노선 삭제 (위험 구역) -->
      <section class="detail-section danger-section">
        <h4 class="section-title">노선 삭제</h4>
        <p class="danger-text">
          이 노선을 삭제하면 연결된 정류장과 관련 기록이 함께 제거됩니다.
          어떤 상태이든 상관없이 즉시 삭제되며, 되돌릴 수 없습니다.
        </p>
        <button
          type="button"
          class="danger-button"
          :disabled="effectiveStatus === '건설중'"
          @click="requestDeleteRoute"
        >
          <template v-if="effectiveStatus === '건설중'">
            시공 중에는 노선을 삭제할 수 없습니다
          </template>
          <template v-else>
            이 노선 완전히 삭제하기
          </template>
        </button>
      </section>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  route: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update-route', 'request-delete-route'])

const nameEdit = ref('')
const transportEdit = ref('bus')
const typeEdit = ref('가상')

const transportOptions = [
  { value: 'bus', label: '버스' },
  { value: 'truck', label: '트럭' },
  { value: 'rail', label: '철도' },
  { value: 'air', label: '비행기' },
  { value: 'ship', label: '배' },
  { value: 'space', label: '우주선' },
]

/** 유형: 가상 노선 / 현실 노선 (DB에는 '가상' / '현실'로 저장) */
const typeOptions = [
  { value: '가상', label: '가상 노선' },
  { value: '현실', label: '현실 노선' },
]

const now = ref(Date.now())
let timerId = null
const autoCompletedOnce = ref(false)

// route가 바뀔 때마다 편집용 값 세팅
watch(
  () => props.route,
  (newRoute) => {
    nameEdit.value = newRoute?.name ?? ''
    transportEdit.value = newRoute?.transport ?? 'bus'

    if (newRoute?.type === '현실') {
      typeEdit.value = '현실'
    } else {
      typeEdit.value = '가상'
    }

    autoCompletedOnce.value = false
  },
  { immediate: true },
)

onMounted(() => {
  timerId = window.setInterval(() => {
    now.value = Date.now()
    tryAutoComplete()
  }, 30_000) // 30초마다 체크
})

onUnmounted(() => {
  if (timerId) {
    clearInterval(timerId)
    timerId = null
  }
})

const totalStops = computed(() => {
  if (!props.route) return 0
  if (Array.isArray(props.route.stops)) return props.route.stops.length
  return props.route.stopsCount ?? 0
})

/** 실제 DB status + 시공 종료 시각을 고려한 "실제 단계" */
const effectiveStatus = computed(() => {
  if (!props.route) return '설계중'

  const raw = props.route.status || '설계중'
  if (raw !== '건설중') return raw

  const end = props.route.constructionEndsAt
  if (typeof end === 'number' && now.value >= end) {
    // 이미 시공 완료 시간 지남 → 사실상 운영중
    return '운영중'
  }
  return '건설중'
})

/** 정류장 편집 가능 여부
 * - 건설중: 정류장 구조 편집 불가
 * - 설계중/운영중: 정류장 편집 가능
 */
const canEditStops = computed(() => effectiveStatus.value !== '건설중')

/** 운송 수단/유형 변경 가능 여부: 설계중에서만 */
const canEditTransport = computed(() => effectiveStatus.value === '설계중')
const canEditType = computed(() => effectiveStatus.value === '설계중')

const canSave = computed(() => {
  if (!props.route) return false
  const trimmed = nameEdit.value.trim()
  const nameChanged =
    trimmed.length > 0 && trimmed !== props.route.name

  const transportChanged =
    canEditTransport.value &&
    transportEdit.value !== (props.route.transport ?? 'bus')

  const typeChanged =
    canEditType.value &&
    typeEdit.value !== (props.route.type ?? '가상')

  return nameChanged || transportChanged || typeChanged
})

const congestionText = computed(() => {
  if (!props.route) return '-'
  const lf = props.route.avgLoadFactor
  if (typeof lf !== 'number') return '-'
  const pct = Math.round(lf * 100)
  return `${pct}%`
})

/** 현재 시공이 초기 시공인지, 변경 시공인지 구분 */
const constructionModeText = computed(() => {
  if (!props.route || effectiveStatus.value !== '건설중') return ''
  const start = props.route.constructionStartedAt
  const end = props.route.constructionEndsAt
  if (typeof start !== 'number' || typeof end !== 'number') {
    return '시공 진행 중입니다.'
  }
  const totalMs = end - start
  const totalMin = Math.round(totalMs / 60000)

  // 대략 120분이면 변경 시공(2시간), 그 외는 초기 시공(1시간)으로 간주
  if (totalMin >= 110) {
    return '변경 시공(약 2시간) 진행 중입니다.'
  }
  return '초기 시공(약 1시간) 진행 중입니다.'
})

/** 단계 설명 텍스트 */
const phaseDescription = computed(() => {
  if (!props.route) return ''
  switch (effectiveStatus.value) {
    case '설계중':
      return '노선 구조와 정류장을 설계하는 단계입니다. 노선 확정 후 시공이 시작됩니다.'
    case '건설중':
      return '노선이 시공 중입니다. 시공이 완료되면 자동으로 운행 상태로 전환됩니다.'
    case '운영중':
      return '노선 시공이 완료되어 실제 운행 중입니다.'
    default:
      return ''
  }
})

/** 남은 시공 시간 텍스트 */
const constructionProgressText = computed(() => {
  if (!props.route) return ''
  const end = props.route.constructionEndsAt
  if (typeof end !== 'number') return '완공 예정 시간이 설정되지 않았습니다.'

  const remainMs = end - now.value
  if (remainMs <= 0) {
    return '시공 시간이 모두 경과했습니다. 곧 운영 상태로 전환됩니다.'
  }

  const remainMin = Math.ceil(remainMs / 60000)
  if (remainMin <= 1) return '약 1분 이내 완공 예정'
  return `약 ${remainMin}분 후 완공 예정`
})

function typeLabel(type) {
  switch (type) {
    case 'virtual':
    case '가상':
      return '가상 노선'
    case 'facility':
    case '시설':
      return '시설 연계 노선'
    case 'real':
    case '현실':
      return '현실 노선'
    default:
      return type || '기타'
  }
}

function transportLabel(mode) {
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
      return '배'
    case 'space':
      return '우주선'
    default:
      return mode || '기타'
  }
}

function statusLabel(status) {
  switch (status) {
    case 'active':
    case '운영중':
      return '운영 중'
    case 'paused':
      return '일시 중지'
    case 'draft':
    case '설계중':
      return '설계 중'
    case '건설중':
      return '건설 중'
    default:
      return status || '알 수 없음'
  }
}

function formatCurrency(value) {
  if (typeof value !== 'number') return '-'
  return value.toLocaleString('ko-KR') + ' 크레딧'
}

/** 이름/운송수단/유형 저장 */
function handleSave() {
  if (!props.route || !canSave.value) return

  const trimmed = nameEdit.value.trim() || props.route.name
  const payload = {
    id: props.route.id,
    name: trimmed,
  }

  if (canEditTransport.value) {
    if (transportEdit.value !== (props.route.transport ?? 'bus')) {
      payload.transport = transportEdit.value
    }
  }

  if (canEditType.value) {
    if (typeEdit.value !== (props.route.type ?? '가상')) {
      payload.type = typeEdit.value
    }
  }

  emit('update-route', payload)
}

/** 설계중 → 건설중 + 1시간 타이머 설정 (초기 시공) */
function startConstruction() {
  if (!props.route) return
  if (effectiveStatus.value !== '설계중') return

  const nowMs = Date.now()
  const oneHourLater = nowMs + 60 * 60 * 1000

  const trimmed = nameEdit.value.trim() || props.route.name

  emit('update-route', {
    id: props.route.id,
    name: trimmed,
    type: typeEdit.value,
    transport: transportEdit.value,
    status: '건설중',
    constructionStartedAt: nowMs,
    constructionEndsAt: oneHourLater,
  })
}

/** 건설중 + 시공완료 시간 지났을 때 자동 운영중 전환 */
function tryAutoComplete() {
  if (!props.route) return
  if (autoCompletedOnce.value) return

  const rawStatus = props.route.status
  const end = props.route.constructionEndsAt

  if (rawStatus !== '건설중') return
  if (typeof end !== 'number') return
  if (Date.now() < end) return

  autoCompletedOnce.value = true

  emit('update-route', {
    id: props.route.id,
    status: '운영중',
    constructionStartedAt: props.route.constructionStartedAt ?? null,
    constructionEndsAt: end,
  })
}

/** 노선 삭제 요청 */
function requestDeleteRoute() {
  if (!props.route) return
  emit('request-delete-route', {
    routeId: props.route.id,
    name: props.route.name,
  })
}
</script>

<style scoped>
.route-detail-panel {
  padding: 10px 10px 12px;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.94);
  border: 1px solid rgba(148, 163, 184, 0.6);
  font-size: 0.82rem;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.route-detail-header {
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

/* 진행 단계 */
.status-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.status-pill {
  font-size: 0.74rem;
  padding: 3px 10px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.9);
  white-space: nowrap;
}

.status-pill[data-phase='설계중'] {
  border-color: rgba(148, 163, 184, 0.9);
}

.status-pill[data-phase='건설중'] {
  border-color: rgba(250, 204, 21, 0.95);
}

.status-pill[data-phase='운영중'] {
  border-color: rgba(52, 211, 153, 0.95);
}

.status-info {
  font-size: 0.76rem;
  opacity: 0.85;
}

/* 정류장 편집 안내 */
.stops-edit-info {
  margin-top: 4px;
  font-size: 0.74rem;
  line-height: 1.4;
}

.stops-edit-on {
  color: #a5f3fc;
}

.stops-edit-off {
  color: #fecaca;
}

.phase-actions {
  margin-top: 4px;
}

.phase-progress,
.phase-done {
  margin-top: 4px;
  font-size: 0.76rem;
  opacity: 0.9;
}

.progress-label {
  font-weight: 600;
  margin-bottom: 2px;
}

.progress-text {
  opacity: 0.9;
}

/* 설계→시공 전환 버튼 */
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
}

/* 필드 공통 */
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

.field-value.dim {
  opacity: 0.75;
  font-size: 0.74rem;
}

/* 이름 + 버튼 한 줄 */
.field-inline {
  flex-direction: row;
  align-items: flex-end;
  justify-content: space-between;
  gap: 8px;
}

.name-input {
  margin-top: 2px;
  padding: 5px 8px;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.8);
  background: rgba(15, 23, 42, 0.98);
  color: #e5e7eb;
  font-size: 0.8rem;
  min-width: 0;
}

.name-input:focus {
  outline: none;
  border-color: rgba(56, 189, 248, 0.9);
}

/* 드롭다운 (유형/운송 수단 공용) */
.type-select,
.transport-select {
  margin-top: 2px;
  padding: 5px 8px;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.8);
  background: rgba(15, 23, 42, 0.98);
  color: #e5e7eb;
  font-size: 0.8rem;
}

/* 저장 버튼 */
.save-button {
  padding: 5px 10px;
  border-radius: 999px;
  border: 1px solid rgba(59, 130, 246, 0.95);
  background: radial-gradient(
    circle at 0% 0%,
    rgba(59, 130, 246, 0.3),
    rgba(15, 23, 42, 0.98)
  );
  color: #e5e7eb;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.save-button:disabled {
  opacity: 0.5;
  cursor: default;
}

/* grid 정보 */
.field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

/* 수익 요약 */
.revenue-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

/* 위험 구역 (노선 삭제) */
.danger-section {
  border-color: rgba(248, 113, 113, 0.7);
}

.danger-text {
  font-size: 0.74rem;
  color: #fecaca;
  line-height: 1.5;
}

.danger-button {
  align-self: flex-start;
  margin-top: 4px;
  padding: 5px 12px;
  border-radius: 999px;
  border: 1px solid rgba(239, 68, 68, 0.95);
  background: radial-gradient(
    circle at 0% 0%,
    rgba(239, 68, 68, 0.28),
    rgba(15, 23, 42, 0.98)
  );
  color: #fee2e2;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
}

.danger-button:disabled {
  opacity: 0.45;
  cursor: default;
}

/* 반응형 */
@media (max-width: 700px) {
  .field-inline {
    flex-direction: column;
    align-items: stretch;
  }

  .field-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .revenue-row {
    grid-template-columns: minmax(0, 1fr);
  }

  .status-row {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
