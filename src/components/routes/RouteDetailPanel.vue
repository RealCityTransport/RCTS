<!-- src/components/routes/RouteDetailPanel.vue -->
<template>
  <section class="route-detail-panel">
    <header class="route-detail-header">
      <div>
        <h3 class="detail-title">노선 상세</h3>
        <p class="detail-sub">
          선택된 노선의 기본 정보와 운영 상태를 확인하고,
          이름을 수정할 수 있습니다.
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
            이름 저장
          </button>
        </div>

        <div class="field-grid">
          <div class="field-block">
            <div class="field-label">노선 ID</div>
            <div class="field-value dim">
              {{ route.id }}
            </div>
          </div>

          <div class="field-block">
            <div class="field-label">유형</div>
            <div class="field-value">
              {{ typeLabel(route.type) }}
            </div>
          </div>

          <div class="field-block">
            <div class="field-label">상태</div>
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
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  route: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update-route'])

const nameEdit = ref('')

watch(
  () => props.route,
  (newRoute) => {
    nameEdit.value = newRoute?.name ?? ''
  },
  { immediate: true },
)

const totalStops = computed(() => {
  if (!props.route) return 0
  if (Array.isArray(props.route.stops)) return props.route.stops.length
  return props.route.stopsCount ?? 0
})

const canSave = computed(() => {
  if (!props.route) return false
  const trimmed = nameEdit.value.trim()
  return trimmed.length > 0 && trimmed !== props.route.name
})

const congestionText = computed(() => {
  if (!props.route) return '-'
  const lf = props.route.avgLoadFactor
  if (typeof lf !== 'number') return '-'
  const pct = Math.round(lf * 100)
  return `${pct}%`
})

function typeLabel(type) {
  switch (type) {
    case 'virtual':
      return '가상 노선'
    case 'facility':
      return '시설 연계 노선'
    case 'real':
      return '실제 기반 노선'
    default:
      return '기타'
  }
}

function statusLabel(status) {
  switch (status) {
    case 'active':
      return '운행 중'
    case 'paused':
      return '일시 중지'
    case 'draft':
      return '설계 중'
    default:
      return '알 수 없음'
  }
}

function formatCurrency(value) {
  if (typeof value !== 'number') return '-'
  return value.toLocaleString('ko-KR') + ' 크레딧'
}

function handleSave() {
  if (!props.route || !canSave.value) return
  const trimmed = nameEdit.value.trim()
  emit('update-route', {
    id: props.route.id,
    name: trimmed,
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
}
</style>
