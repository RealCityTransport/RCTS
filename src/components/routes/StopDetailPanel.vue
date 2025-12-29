<!-- src/components/routes/StopDetailPanel.vue -->
<template>
  <section class="stop-detail-panel">
    <header class="panel-header">
      <div>
        <h3 class="panel-title">정류장 상세</h3>
        <p class="panel-sub">
          선택된 정류장/역의 이름과 역할, 이전 정류장까지 거리를 수정할 수 있습니다.
          시공 중인 노선에서는 거리 변경이 제한됩니다.
        </p>
      </div>
    </header>

    <div
      v-if="!stop || !route"
      class="panel-empty"
    >
      가운데 리스트에서 정류장이나 역을 선택하면
      <br />
      이 영역에 상세 정보가 표시됩니다.
    </div>

    <div
      v-else
      class="panel-body"
    >
      <!-- 기본 정보 -->
      <section class="detail-section">
        <h4 class="section-title">기본 정보</h4>

        <div class="field-block">
          <div class="field-label">소속 노선</div>
          <div class="field-value">
            {{ route.name }} <span class="dim">({{ route.id }})</span>
          </div>
        </div>

        <div class="field-block">
          <div class="field-label">정류장/역 ID</div>
          <div class="field-value dim">
            {{ stop.id }}
          </div>
        </div>

        <div class="field-grid">
          <div class="field-block">
            <div class="field-label">정류장 이름</div>
            <input
              v-model="nameEdit"
              type="text"
              class="text-input"
              :placeholder="stop.name"
            />
          </div>

          <div class="field-block">
            <div class="field-label">유형</div>
            <div class="field-value">
              {{ kindLabel(stop.kind) }}
            </div>
          </div>

          <div class="field-block">
            <div class="field-label">역할</div>
            <div class="field-value">
              {{ roleLabel(stop.role) }}
            </div>
          </div>
        </div>
      </section>

      <!-- 거리 설정 -->
      <section class="detail-section">
        <h4 class="section-title">거리 설정</h4>

        <div
          v-if="stop.seq === 1"
          class="field-block"
        >
          <div class="field-label">이전 정류장까지 거리</div>
          <div class="field-value">
            출발 기준 정류장입니다.
            <span class="dim">(이전 정류장 없음, 거리 0km 고정)</span>
          </div>
        </div>

        <div
          v-else
          class="field-block"
        >
          <div class="field-label">
            이전 정류장까지 거리 (km)
          </div>
          <div class="distance-input-row">
            <input
              v-model="distanceEdit"
              type="number"
              step="0.1"
              min="0"
              class="number-input"
              :disabled="isLocked"
            />
            <span class="suffix">km</span>
          </div>
          <p class="helper-text">
            <template v-if="isLocked">
              시공 중인 노선에서는 거리를 변경할 수 없습니다. 이름만 수정할 수 있습니다.
            </template>
            <template v-else>
              권장 범위는 2 ~ 5km 입니다. 필요에 따라 조정할 수 있습니다.
            </template>
          </p>
        </div>
      </section>

      <!-- 액션: 저장 + 삭제 -->
      <section class="actions">
        <button
          type="button"
          class="save-button"
          :disabled="!canSave"
          @click="handleSave"
        >
          변경 사항 저장
        </button>

        <button
          type="button"
          class="danger-button"
          :disabled="isLocked"
          @click="handleDelete"
        >
          이 정류장 삭제하기
        </button>
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
  stop: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update-stop', 'delete-stop'])

const nameEdit = ref('')
const distanceEdit = ref('')

/** 시공 중 잠금 여부: 건설중일 때 거리 변경 불가, 이름만 허용 + 삭제도 비활성화 */
const isLocked = computed(() => props.route?.status === '건설중')

watch(
  () => props.stop,
  (newStop) => {
    nameEdit.value = newStop?.name ?? ''
    if (typeof newStop?.distanceFromPrevKm === 'number') {
      distanceEdit.value = newStop.distanceFromPrevKm.toFixed(1)
    } else {
      distanceEdit.value = ''
    }
  },
  { immediate: true },
)

const canSave = computed(() => {
  if (!props.stop) return false

  const trimmedName = nameEdit.value.trim()
  const nameChanged = trimmedName && trimmedName !== props.stop.name

  // 시공 중에는 이름 변경만 허용
  if (isLocked.value) {
    return !!nameChanged
  }

  if (props.stop.seq === 1) {
    // 출발 정류장은 이름 변경만 가능
    return !!nameChanged
  }

  const currentDistance =
    typeof props.stop.distanceFromPrevKm === 'number'
      ? props.stop.distanceFromPrevKm
      : null

  const edited = Number(distanceEdit.value)
  const validNumber = !Number.isNaN(edited)
  const distanceChanged =
    validNumber && currentDistance != null && edited !== currentDistance

  return !!nameChanged || distanceChanged
})

function kindLabel(kind) {
  switch (kind) {
    case 'station':
      return '역'
    case 'stop':
      return '정류장'
    default:
      return '기타'
  }
}

function roleLabel(role) {
  switch (role) {
    case 'hub':
      return '거점'
    case 'transfer':
      return '환승'
    case 'terminal':
      return '종점'
    case 'facility':
      return '시설'
    default:
      return '일반'
  }
}

function handleSave() {
  if (!props.stop || !canSave.value) return

  const trimmedName = nameEdit.value.trim() || props.stop.name

  // 기본값: 기존 거리 유지
  let distanceValue =
    typeof props.stop.distanceFromPrevKm === 'number'
      ? props.stop.distanceFromPrevKm
      : null

  if (!isLocked.value) {
    if (props.stop.seq > 1) {
      const parsed = Number(distanceEdit.value)
      if (!Number.isNaN(parsed) && parsed >= 0) {
        distanceValue = Number(parsed.toFixed(1))
      }
    } else {
      // 출발 정류장
      distanceValue = 0
    }
  } else if (props.stop.seq === 1) {
    // 시공중 + 출발 정류장도 0 고정
    distanceValue = 0
  }

  const payload = {
    id: props.stop.id,
    name: trimmedName,
    distanceFromPrevKm: distanceValue,
  }

  emit('update-stop', payload)
}

function handleDelete() {
  if (isLocked.value) return
  if (!props.stop || !props.route) return

  emit(
    'delete-stop',
    props.stop.id,
    {
      routeId: props.route.id,
      stopId: props.stop.id,
    },
  )
}
</script>

<style scoped>
.stop-detail-panel {
  padding: 10px 10px 12px;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.94);
  border: 1px solid rgba(148, 163, 184, 0.6);
  font-size: 0.82rem;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.panel-title {
  font-size: 0.9rem;
  font-weight: 600;
}

.panel-sub {
  font-size: 0.76rem;
  opacity: 0.8;
}

/* 빈 상태 */

.panel-empty {
  margin-top: 8px;
  padding: 10px;
  border-radius: 12px;
  border: 1px dashed rgba(148, 163, 184, 0.7);
  background: rgba(15, 23, 42, 0.96);
  text-align: center;
  line-height: 1.6;
}

/* 내용 */

.panel-body {
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

.field-value .dim {
  font-size: 0.72rem;
  opacity: 0.75;
}

/* grid */

.field-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

/* 인풋 */

.text-input {
  margin-top: 2px;
  padding: 5px 8px;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.8);
  background: rgba(15, 23, 42, 0.98);
  color: #e5e7eb;
  font-size: 0.8rem;
}

.text-input:focus {
  outline: none;
  border-color: rgba(56, 189, 248, 0.9);
}

.distance-input-row {
  margin-top: 2px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.number-input {
  padding: 5px 8px;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.8);
  background: rgba(15, 23, 42, 0.98);
  color: #e5e7eb;
  font-size: 0.8rem;
  max-width: 90px;
}

.number-input:focus {
  outline: none;
  border-color: rgba(56, 189, 248, 0.9);
}

.number-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.suffix {
  font-size: 0.78rem;
  opacity: 0.85;
}

.helper-text {
  margin-top: 2px;
  font-size: 0.72rem;
  opacity: 0.8;
}

/* 액션 */

.actions {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-top: 4px;
}

.save-button {
  padding: 5px 10px;
  border-radius: 999px;
  border: 1px solid rgba(56, 189, 248, 0.95);
  background: radial-gradient(
    circle at 0% 0%,
    rgba(56, 189, 248, 0.24),
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

.danger-button {
  padding: 5px 10px;
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
  white-space: nowrap;
}

.danger-button:disabled {
  opacity: 0.45;
  cursor: default;
}

/* 반응형 */

@media (max-width: 768px) {
  .field-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
