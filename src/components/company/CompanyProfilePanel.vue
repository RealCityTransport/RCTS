<!-- src/company/CompanyProfilePanel.vue -->
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
        </div>
      </form>
    </div>

    <!-- 회사가 있는 경우: 정보 표시 -->
    <div v-else>
      <h3 class="company-title">회사 등록</h3>

      <div class="company-summary">
        <div class="summary-row">
          <span class="summary-label">회사 이름</span>
          <span class="summary-value">{{ company.name }}</span>
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

<script setup lang="ts">
import { reactive, computed, ref } from 'vue'
import { usePlayerAccount } from '@/composables/usePlayerAccount'
import type { CompanyPayload } from '@/composables/usePlayerAccount'

const {
  company,
  saveCompanyForCurrentUser,
  clearCompanyForCurrentUser,
} = usePlayerAccount()

/* ---------------------------
   랜덤 회사 이름 생성
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

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomCompanyName() {
  return `${pick(companyPrefixes)} ${pick(companySuffixes)}`
}

/* ---------------------------
   폼 초기값
--------------------------- */
const form = reactive<{ name: string }>({
  name: randomCompanyName(),
})

const isSaving = ref(false)

const canSubmit = computed(() => {
  return form.name.trim().length > 0
})

const onSubmitCreate = async () => {
  if (!canSubmit.value || isSaving.value) return
  isSaving.value = true
  try {
    const payload: CompanyPayload = {
      name: form.name.trim(),
      // 기존 스키마 호환용 기본값
      type: 'operator',
    }
    await saveCompanyForCurrentUser(payload)
  } catch (err) {
    console.error('[CompanyProfilePanel] 회사 생성 에러:', err)
  } finally {
    isSaving.value = false
  }
}

const onDeleteCompany = async () => {
  if (isSaving.value) return
  isSaving.value = true
  try {
    await clearCompanyForCurrentUser()
  } catch (err) {
    console.error('[CompanyProfilePanel] 회사 삭제 에러:', err)
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
  font-size: 0.95rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

/* 폼 */

.company-form {
  margin-top: 4px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-label {
  font-size: 0.78rem;
  opacity: 0.9;
}

.form-input {
  padding: 6px 9px;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.9);
  background: rgba(15, 23, 42, 0.96);
  color: #e5e7eb;
  font-size: 0.8rem;
  outline: none;
}

.form-input::placeholder {
  color: rgba(148, 163, 184, 0.85);
}

/* 버튼 */

.form-actions {
  margin-top: 6px;
  display: flex;
  gap: 8px;
}

.primary-button,
.danger-button {
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 0.8rem;
  cursor: pointer;
  border: 1px solid transparent;
  background: transparent;
  color: inherit;
}

.primary-button {
  border-color: rgba(129, 140, 248, 0.95);
  background: rgba(129, 140, 248, 0.2);
}

.primary-button:hover:not(:disabled) {
  background: rgba(129, 140, 248, 0.3);
}

.primary-button:disabled {
  opacity: 0.5;
  cursor: default;
}

.danger-button {
  border-color: rgba(248, 113, 113, 0.95);
  background: rgba(248, 113, 113, 0.16);
}

.danger-button:hover:not(:disabled) {
  background: rgba(248, 113, 113, 0.24);
}

/* 요약 */

.company-summary {
  margin: 4px 0 2px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.8rem;
}

.summary-row {
  display: flex;
  gap: 8px;
}

.summary-label {
  min-width: 72px;
  opacity: 0.75;
}

.summary-value {
  flex: 1;
}
</style>
