<!-- src/components/routes/EditRouteDialog.vue -->
<template>
  <div
    v-if="visible"
    class="dialog-backdrop"
  >
    <div class="dialog-panel">
      <header class="dialog-header">
        <h3 class="dialog-title">노선 편집</h3>
        <p class="dialog-sub">
          기본 정보와 상태를 수정할 수 있습니다. 정류장 구조 편집은 추후 별도 화면으로 확장할 수 있습니다.
        </p>
      </header>

      <section class="dialog-body">
        <!-- 1. 기본 정보 -->
        <section class="dialog-section">
          <h4 class="section-title">기본 정보</h4>

          <div class="form-grid">
            <div class="form-field">
              <label class="field-label">
                노선 이름
                <span class="required">*</span>
              </label>
              <input
                v-model="localRoute.name"
                type="text"
                class="field-input"
                placeholder="예: 도심 순환 A"
              />
            </div>

            <div class="form-field">
              <label class="field-label">
                상태
              </label>
              <select
                v-model="localRoute.status"
                class="field-select"
              >
                <option value="active">운영 중</option>
                <option value="paused">일시 중지</option>
                <option value="draft">설계 중</option>
              </select>
            </div>

            <div class="form-field">
              <label class="field-label">
                노선 유형
              </label>
              <select
                v-model="localRoute.type"
                class="field-select"
              >
                <option value="virtual">가상 노선</option>
                <option value="facility">시설 연계</option>
                <option value="real">현실 기반</option>
              </select>
            </div>

            <div class="form-field">
              <label class="field-label">
                정류장 수
              </label>
              <input
                v-model.number="localRoute.stopsCount"
                type="number"
                min="0"
                class="field-input"
              />
            </div>
          </div>
        </section>

        <!-- 2. 태그 / 메타 -->
        <section class="dialog-section">
          <h4 class="section-title">태그 · 메타 정보</h4>

          <div class="form-grid form-grid-single">
            <div class="form-field">
              <label class="field-label">
                태그
                <span class="field-hint">쉼표로 구분해 입력하세요. (예: 가상, 기본)</span>
              </label>
              <input
                v-model="tagsText"
                type="text"
                class="field-input"
                placeholder="예: 가상, 기본"
              />
            </div>
          </div>

          <div class="meta-row">
            <div class="meta-block">
              <div class="meta-label">생성 시각</div>
              <div class="meta-value">
                {{ route?.createdAt || '-' }}
              </div>
            </div>
            <div class="meta-block">
              <div class="meta-label">최근 수정</div>
              <div class="meta-value">
                {{ route?.lastUpdatedAt || '-' }}
              </div>
            </div>
          </div>
        </section>
      </section>

      <footer class="dialog-footer">
        <button
          type="button"
          class="ghost-button"
          @click="onCancel"
        >
          취소
        </button>
        <button
          type="button"
          class="primary-button"
          :disabled="!isValid"
          @click="onSave"
        >
          저장
        </button>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  route: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['close', 'save'])

/**
 * 로컬 편집용 상태
 */
const localRoute = ref({
  id: '',
  name: '',
  status: 'draft',
  type: 'virtual',
  stopsCount: 0,
})

const tagsText = ref('')

/**
 * 부모에서 route가 바뀔 때마다 로컬 상태 초기화
 */
watch(
  () => props.route,
  (val) => {
    if (!val) return
    localRoute.value = {
      id: val.id,
      name: val.name ?? '',
      status: val.status ?? 'draft',
      type: val.type ?? 'virtual',
      stopsCount: val.stopsCount ?? 0,
    }
    tagsText.value = (val.tags ?? []).join(', ')
  },
  { immediate: true },
)

const isValid = computed(() => {
  return Boolean(localRoute.value.name && localRoute.value.id)
})

function parseTags(text) {
  if (!text) return []
  return text
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
}

function onCancel() {
  emit('close')
}

function onSave() {
  if (!isValid.value) return

  const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ') // 예: 2025-12-29 10:12

  const edited = {
    ...props.route,
    ...localRoute.value,
    tags: parseTags(tagsText.value),
    lastUpdatedAt: nowStr,
  }

  emit('save', edited)
}
</script>

<style scoped>
.dialog-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.82);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  z-index: 50;
}

.dialog-panel {
  width: 100%;
  max-width: 640px;
  max-height: 90vh;
  border-radius: 16px;
  background: rgba(15, 23, 42, 0.98);
  border: 1px solid rgba(148, 163, 184, 0.85);
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.9);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-size: 0.82rem;
}

.dialog-header {
  padding: 12px 14px 8px;
  border-bottom: 1px solid rgba(51, 65, 85, 0.9);
}

.dialog-title {
  font-size: 0.96rem;
  font-weight: 700;
}

.dialog-sub {
  margin-top: 4px;
  font-size: 0.78rem;
  opacity: 0.85;
}

.dialog-body {
  padding: 10px 14px 12px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.dialog-section {
  padding: 8px 8px;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.96);
  border: 1px solid rgba(51, 65, 85, 0.85);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-title {
  font-size: 0.82rem;
  font-weight: 600;
}

/* 폼 레이아웃 */

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.form-grid-single {
  grid-template-columns: minmax(0, 1fr);
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field-label {
  font-size: 0.76rem;
  opacity: 0.9;
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.required {
  color: #f97373;
  font-size: 0.72rem;
}

.field-hint {
  font-size: 0.7rem;
  opacity: 0.7;
}

.field-input,
.field-select {
  min-height: 30px;
  padding: 5px 8px;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.8);
  background: rgba(15, 23, 42, 0.96);
  color: #e5e7eb;
  font-size: 0.8rem;
}

.field-input::placeholder {
  opacity: 0.6;
}

/* 메타 정보 */

.meta-row {
  margin-top: 6px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.meta-block {
  min-width: 0;
}

.meta-label {
  font-size: 0.72rem;
  opacity: 0.8;
}

.meta-value {
  margin-top: 2px;
  font-size: 0.8rem;
  opacity: 0.9;
}

/* 푸터 */

.dialog-footer {
  padding: 10px 14px;
  border-top: 1px solid rgba(51, 65, 85, 0.9);
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.ghost-button,
.primary-button {
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 0.8rem;
  cursor: pointer;
  white-space: nowrap;
}

.ghost-button {
  border: 1px solid rgba(148, 163, 184, 0.9);
  background: transparent;
  color: #e5e7eb;
}

.primary-button {
  border: 1px solid rgba(45, 212, 191, 0.95);
  background: radial-gradient(circle at 0% 0%, rgba(45, 212, 191, 0.24), rgba(15, 23, 42, 0.98));
  color: #e5e7eb;
  font-weight: 600;
}

.primary-button:disabled {
  opacity: 0.5;
  cursor: default;
}

.primary-button:not(:disabled):hover {
  filter: brightness(1.08);
}

/* 반응형 */

@media (max-width: 600px) {
  .dialog-panel {
    max-width: 100%;
  }

  .form-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
