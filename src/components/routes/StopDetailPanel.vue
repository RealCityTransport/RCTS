<!-- src/components/routes/StopDetailPanel.vue -->
<template>
  <section class="stop-detail-panel">
    <header class="stop-detail-header">
      <div>
        <h3 class="detail-title">정류장 상세</h3>
        <p class="detail-sub">
          선택된 정류장의 이름과 유형, 역할 등을 확인하고 수정할 수 있습니다.
        </p>
      </div>
    </header>

    <div
      v-if="!route"
      class="detail-empty"
    >
      먼저 왼쪽에서 노선을 선택해 주세요.
    </div>

    <div
      v-else-if="!stop"
      class="detail-empty"
    >
      가운데 리스트에서 정류장/역을 선택하면,
      <br />
      여기에 상세 정보가 표시됩니다.
    </div>

    <div
      v-else
      class="detail-body"
    >
      <!-- 기본 정보 -->
      <section class="detail-section">
        <h4 class="section-title">기본 정보</h4>

        <div class="field-block">
          <div class="field-label">소속 노선</div>
          <div class="field-value">
            {{ route.name }}
          </div>
        </div>

        <div class="field-block field-inline">
          <div>
            <div class="field-label">정류장 이름</div>
            <input
              v-model="nameEdit"
              type="text"
              class="name-input"
              :placeholder="stop.name"
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
            <div class="field-label">순서</div>
            <div class="field-value">
              {{ stop.seq }} / {{ totalStops }}
            </div>
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

          <div class="field-block">
            <div class="field-label">ID</div>
            <div class="field-value dim">
              {{ stop.id }}
            </div>
          </div>
        </div>
      </section>

      <!-- 메모/추후 확장 영역 -->
      <section class="detail-section">
        <h4 class="section-title">메모 (예정)</h4>
        <p class="memo-text">
          추후 이 정류장에 대한 승·하차 수요, 시설 보너스(예: 시설 노선 200% 보상),
          러시아워 혼잡도 등의 데이터를 요약해서 보여줄 수 있습니다.
        </p>
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

const emit = defineEmits(['update-stop'])

const nameEdit = ref('')

watch(
  () => props.stop,
  (newStop) => {
    nameEdit.value = newStop?.name ?? ''
  },
  { immediate: true },
)

const totalStops = computed(() => {
  if (!props.route) return 0
  if (Array.isArray(props.route.stops)) return props.route.stops.length
  return props.route.stopsCount ?? 0
})

const canSave = computed(() => {
  if (!props.stop) return false
  const trimmed = nameEdit.value.trim()
  return trimmed.length > 0 && trimmed !== props.stop.name
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

function handleSave() {
  if (!props.stop || !canSave.value) return
  const trimmed = nameEdit.value.trim()
  emit('update-stop', {
    ...props.stop,
    name: trimmed,
  })
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

.stop-detail-header {
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

/* 메모 */
.memo-text {
  font-size: 0.76rem;
  opacity: 0.86;
  line-height: 1.5;
}

/* 반응형 */
@media (max-width: 600px) {
  .field-inline {
    flex-direction: column;
    align-items: stretch;
  }

  .field-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
