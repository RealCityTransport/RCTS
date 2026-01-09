<!-- src/components/play/company/CompanyProfilePanel.vue -->
<template>
  <div class="company-profile-root">
    <!-- 회사가 없는 경우: 등록 폼 -->
    <div v-if="!company">
      <h3 class="company-title">회사 등록</h3>

      <form class="company-form" @submit.prevent="onSubmitCreate">
        <div class="form-row">
          <label class="form-label" for="company-name">회사 이름</label>
          <input
            id="company-name"
            v-model="form.name"
            type="text"
            class="form-input"
            placeholder="예: 스카이 교통"
          />
        </div>

        <div class="form-actions">
          <button
            type="submit"
            class="primary-button"
            :disabled="!canSubmit || isSaving"
          >
            <span v-if="isSaving">저장 중...</span>
            <span v-else>회사 등록</span>
          </button>

          <button
            type="button"
            class="ghost-button"
            :disabled="isSaving"
            @click="onRandomizeName"
          >
            랜덤 이름
          </button>
        </div>

        <p class="hint-text">
          지금은 UI 시연 단계라서 실제 저장은 하지 않아. (나중에 로그인/계정 저장 붙이면 연결할 예정)
        </p>
      </form>
    </div>

    <!-- 회사가 있는 경우: 정보 표시 -->
    <div v-else>
      <h3 class="company-title">회사 정보</h3>

      <div class="company-summary">
        <div class="summary-row">
          <span class="summary-label">회사 이름</span>
          <span class="summary-value">{{ company.name }}</span>
        </div>

        <div class="summary-row">
          <span class="summary-label">상태</span>
          <span class="summary-value">UI 더미 (저장 미연동)</span>
        </div>
      </div>

      <div class="form-actions">
        <button
          type="button"
          class="danger-button"
          :disabled="isSaving"
          @click="onDeleteCompany"
        >
          회사 삭제
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed, ref } from 'vue'

/* ---------------------------
   UI 더미 상태 (저장/계정 연동 X)
--------------------------- */
const company = ref(null)

/* ---------------------------
   랜덤 회사 이름 생성 (UI 연출용)
--------------------------- */
const companyPrefixes = [
  '미래',
  '한빛',
  '스카이',
  '네오',
  '레일',
  '트랜스',
  '어반',
  '도시',
  '시티',
  '메트로',
]

const companySuffixes = [
  '운송',
  '교통',
  '트랜스',
  '라인',
  '모빌리티',
  '네트웍스',
  '테크',
]

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomCompanyName() {
  return `${pick(companyPrefixes)} ${pick(companySuffixes)}`
}

/* ---------------------------
   폼 초기값
--------------------------- */
const form = reactive({
  name: randomCompanyName(),
})

const isSaving = ref(false)

const canSubmit = computed(() => {
  return form.name.trim().length > 0
})

const onRandomizeName = () => {
  if (isSaving.value) return
  form.name = randomCompanyName()
}

const onSubmitCreate = async () => {
  if (!canSubmit.value || isSaving.value) return
  isSaving.value = true

  try {
    // “저장되는 척” 연출
    await new Promise((r) => setTimeout(r, 350))
    company.value = {
      name: form.name.trim(),
    }
  } finally {
    isSaving.value = false
  }
}

const onDeleteCompany = async () => {
  if (isSaving.value) return
  isSaving.value = true

  try {
    await new Promise((r) => setTimeout(r, 250))
    company.value = null
    form.name = randomCompanyName()
  } finally {
    isSaving.value = false
  }
}
</script>

<style scoped>
.company-profile-root {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.company-title {
  font-size: 0.92rem;
  font-weight: 900;
  color: rgba(248, 250, 252, 0.96);
  letter-spacing: 0.02em;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

/* 폼 */

.company-form {
  margin-top: 4px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 0.78rem;
  color: rgba(226, 232, 240, 0.86);
}

.form-input {
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.55);
  background: rgba(2, 6, 23, 0.45);
  color: rgba(248, 250, 252, 0.96);
  font-size: 0.82rem;
  outline: none;
  transition:
    border-color 0.12s ease-out,
    box-shadow 0.12s ease-out,
    background 0.12s ease-out;
}

.form-input::placeholder {
  color: rgba(148, 163, 184, 0.78);
}

.form-input:focus {
  border-color: rgba(191, 219, 254, 0.95);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.18);
  background: rgba(2, 6, 23, 0.55);
}

/* 버튼 */

.form-actions {
  margin-top: 2px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.primary-button,
.danger-button,
.ghost-button {
  padding: 7px 12px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 800;
  cursor: pointer;
  border: 1px solid transparent;
  background: transparent;
  color: rgba(248, 250, 252, 0.96);
  transition:
    transform 0.08s ease-out,
    background 0.12s ease-out,
    border-color 0.12s ease-out,
    filter 0.12s ease-out;
}

.primary-button {
  border-color: rgba(129, 140, 248, 0.9);
  background: rgba(129, 140, 248, 0.18);
}

.primary-button:hover:not(:disabled) {
  background: rgba(129, 140, 248, 0.26);
}

.primary-button:active:not(:disabled) {
  transform: translateY(1px);
}

.primary-button:disabled {
  opacity: 0.55;
  cursor: default;
}

.ghost-button {
  border-color: rgba(148, 163, 184, 0.45);
  background: rgba(15, 23, 42, 0.45);
}

.ghost-button:hover:not(:disabled) {
  border-color: rgba(191, 219, 254, 0.75);
  background: rgba(15, 23, 42, 0.6);
}

.ghost-button:active:not(:disabled) {
  transform: translateY(1px);
}

.danger-button {
  border-color: rgba(248, 113, 113, 0.85);
  background: rgba(248, 113, 113, 0.16);
}

.danger-button:hover:not(:disabled) {
  background: rgba(248, 113, 113, 0.24);
}

.danger-button:active:not(:disabled) {
  transform: translateY(1px);
}

/* 요약 */

.company-summary {
  margin: 6px 0 2px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 0.82rem;
}

.summary-row {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 8px 10px;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  background: rgba(2, 6, 23, 0.42);
}

.summary-label {
  min-width: 72px;
  color: rgba(148, 163, 184, 0.86);
  font-weight: 700;
}

.summary-value {
  flex: 1;
  color: rgba(248, 250, 252, 0.95);
  font-weight: 800;
}

/* 힌트 */

.hint-text {
  margin: 0;
  font-size: 0.74rem;
  color: rgba(226, 232, 240, 0.72);
  line-height: 1.5;
}
</style>
