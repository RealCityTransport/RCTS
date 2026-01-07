<!-- src/company/CompanyProfilePanel.vue -->
<template>
  <div class="company-profile-root">
    <!-- 회사가 없는 경우: 등록 폼 -->
    <div v-if="!company">
      <h3 class="company-title">회사 프로필 등록</h3>
      <p class="company-desc">
        RCTS에서 사용할 회사 정보를 등록합니다.
        회사는 필수가 아니지만, 이름과 본사 위치를 설정해 두면
        이후 운영·노선·차량·재정 화면에서 데이터를 회사 단위로 묶어서
        더 명확하게 확인할 수 있습니다.
      </p>
      <p class="company-desc company-desc-secondary">
        처음 진입할 때는 예시로 사용할 수 있는 이름과 주소가
        자동으로 채워집니다. 실제로 운용할 회사 정보를 입력해
        그대로 저장해도 되고, 예시를 참고해 새로 작성해도 됩니다.
      </p>

      <form class="company-form" @submit.prevent="onSubmitCreate">
        <div class="form-row">
          <label class="form-label" for="company-name">회사 이름</label>
          <input
            id="company-name"
            v-model="form.name"
            type="text"
            class="form-input"
            placeholder="예: 민은운송"
          />
        </div>

        <div class="form-row">
          <label class="form-label" for="hq-location">본사 위치</label>
          <input
            id="hq-location"
            v-model="form.hqLocation"
            type="text"
            class="form-input"
            placeholder="예: 수원시 영통구 ○○로 12번길"
          />
          <p class="form-help">
            실제 주소를 정확히 입력할 필요는 없습니다.
            도시·구 단위 정도로만 적어두어도,
            나중에 회사 관제 기준 위치를 잡을 때 참고 정보로 활용됩니다.
          </p>
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
      <h3 class="company-title">등록된 회사</h3>
      <p class="company-desc">
        현재 계정에 연결된 회사 프로필입니다.
        이 정보는 운영·노선·차량·재정 화면에서
        “어떤 회사 기준으로 보고 있는지”를 구분하는 기준이 됩니다.
      </p>

      <dl class="company-summary">
        <div class="summary-row">
          <dt>회사 이름</dt>
          <dd>{{ company.name }}</dd>
        </div>
        <div class="summary-row" v-if="company.hqLocation">
          <dt>본사 위치</dt>
          <dd>{{ company.hqLocation }}</dd>
        </div>
      </dl>

      <p class="company-note">
        회사는 계정당 1개만 유지됩니다.
        회사 이름이나 위치를 바꾸고 싶다면
        아래에서 회사를 삭제한 뒤, 새 프로필을 다시 등록할 수 있습니다.
      </p>

      <div class="form-actions form-actions-split">
        <button
          type="button"
          class="primary-button"
          disabled
        >
          회사 기준 플레이 보기 (준비중)
        </button>

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
   랜덤 회사 이름 / 주소 생성
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

const addressCities = [
  '서울특별시 강남구',
  '서울특별시 송파구',
  '경기도 수원시 영통구',
  '경기도 용인시 수지구',
  '부산광역시 해운대구',
  '대구광역시 수성구',
  '광주광역시 서구',
  '대전광역시 유성구',
  '인천광역시 연수구',
]

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomCompanyName() {
  return `${pick(companyPrefixes)} ${pick(companySuffixes)}`
}

function randomAddress() {
  const num = Math.floor(Math.random() * 200) + 1
  return `${pick(addressCities)} ${num}번길`
}

/* ---------------------------
   폼 초기값 = 랜덤 예시
--------------------------- */
const form = reactive<CompanyPayload>({
  name: randomCompanyName(),
  hqLocation: randomAddress(),
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
      hqLocation: form.hqLocation?.trim() || undefined,
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
}

.company-desc {
  font-size: 0.8rem;
  opacity: 0.9;
  line-height: 1.6;
}

.company-desc-secondary {
  margin-top: -2px;
  opacity: 0.85;
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

.form-help {
  font-size: 0.74rem;
  opacity: 0.8;
}

/* 버튼 */

.form-actions {
  margin-top: 6px;
  display: flex;
  gap: 8px;
}

.form-actions-split {
  justify-content: space-between;
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

.summary-row dt {
  min-width: 72px;
  opacity: 0.75;
}

.summary-row dd {
  margin: 0;
  flex: 1;
}

.company-note {
  font-size: 0.76rem;
  opacity: 0.85;
  line-height: 1.5;
  margin-top: 4px;
}
</style>
