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
            :disabled="isSaving"
          />
        </div>

        <div class="form-actions">
          <button
            type="submit"
            class="primary-button"
            :disabled="!canSubmit || isSaving || !isLoggedIn"
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

        <p class="hint-text" v-if="!isLoggedIn">
          구글 로그인 후에 회사를 등록할 수 있어요.
        </p>
      </form>
    </div>

    <!-- 회사가 있는 경우 -->
    <div v-else>
      <h3 class="company-title">회사 정보</h3>

      <div class="company-summary company-summary--plain">
        <div class="summary-row summary-row--plain">
          <span class="summary-label">현재 회사명</span>
          <span class="summary-value">{{ company.name }}</span>
        </div>

        <div class="summary-row summary-row--plain">
          <span class="summary-label">자회사</span>
          <span class="summary-value">구현 예정</span>
        </div>
      </div>

      <!-- 이름 수정 -->
      <form class="company-form" @submit.prevent="onSubmitRename">
        <div class="form-row">
          <label class="form-label" for="company-rename">회사 이름 변경</label>
          <input
            id="company-rename"
            v-model="rename.name"
            type="text"
            class="form-input"
            placeholder="새 회사 이름 입력"
            :disabled="isSaving"
          />
        </div>

        <div class="form-actions">
          <button
            type="submit"
            class="primary-button"
            :disabled="!canRename || isSaving"
          >
            <span v-if="isSaving">저장 중...</span>
            <span v-else>이름 수정</span>
          </button>

          <button
            type="button"
            class="ghost-button"
            :disabled="isSaving"
            @click="onResetRename"
          >
            되돌리기
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed, watch } from 'vue'
import { useCompany } from '@/composables/useCompany.js'

const { company, loading, isLoggedIn, createCompany, updateCompanyName } =
  useCompany()

const isSaving = computed(() => loading.value)

/* 랜덤 회사 이름 */
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

/* 등록 폼 */
const form = reactive({
  name: randomCompanyName(),
})

const canSubmit = computed(() => form.name.trim().length > 0)

const onRandomizeName = () => {
  if (isSaving.value) return
  form.name = randomCompanyName()
}

const onSubmitCreate = async () => {
  if (!isLoggedIn.value) return
  if (!canSubmit.value || isSaving.value) return
  await createCompany(form.name)
}

/* 이름 수정 폼 */
const rename = reactive({
  name: '',
})

watch(
  company,
  (c) => {
    rename.name = c?.name ?? ''
  },
  { immediate: true }
)

const canRename = computed(() => {
  const next = rename.name.trim()
  const cur = company.value?.name ?? ''
  return next && next !== cur
})

const onSubmitRename = async () => {
  if (!company.value) return
  if (!canRename.value || isSaving.value) return
  await updateCompanyName(rename.name)
}

const onResetRename = () => {
  if (isSaving.value) return
  rename.name = company.value?.name ?? ''
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

/* ✅ 테두리 상자 제거(요약 영역) */
.company-summary--plain {
  margin: 6px 0 2px;
  gap: 6px;
}

.summary-row--plain {
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
}

/* 힌트 */
.hint-text {
  margin: 0;
  font-size: 0.74rem;
  color: rgba(226, 232, 240, 0.72);
  line-height: 1.5;
}
</style>
