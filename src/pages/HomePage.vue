<!-- src/pages/HomePage.vue -->

<script setup>
import { computed, inject, onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useRctsStore } from '../stores/rctsStore'

const worldClock = inject('worldClock', null)

const {
  company,
  staffList,
  menusUnlocked,
  departments,
  menuCards,
  recruitment,
  isTimeDisplayUnlocked,
  isMenuOpen,
  canOpenRecruitment,
  openRecruitment,
  updateRecruitment,
  getRecruitmentRemainingSeconds,
  isCurrentRecruitmentLimitReached,
  formatSeconds,
  createCompany: storeCreateCompany,
  registerFirstStaff,
  registerAdditionalStaff,
} = useRctsStore()

const localPageStartedAt = Date.now()
const localNow = ref(Date.now())

let localTimer = null
let storyTimer = null

const currentRuntimeSeconds = computed(() => {
  if (worldClock?.runtimeSeconds?.value !== undefined) {
    return worldClock.runtimeSeconds.value
  }

  return Math.floor((localNow.value - localPageStartedAt) / 1000)
})

const nowMs = computed(() => {
  return worldClock?.now?.value ?? localNow.value
})

const companyName = ref('')
const companyCreatedAtRuntimeSeconds = ref(null)

const visitorGender = ref('')
const visitorName = ref('')
const selectedDepartment = ref('')

const candidateName = ref('')
const candidateDepartment = ref('')

const storyStarted = ref(false)
const storyPhase = ref('idle')
const storyLineIndex = ref(-1)

const hasRegisteredStaff = computed(() => {
  return menusUnlocked.value && staffList.value.length > 0
})

const staffMenuOpen = computed(() => {
  return isMenuOpen('staff')
})

const pendingCandidate = computed(() => {
  return recruitment.value.pendingCandidate
})

const recruitmentRunning = computed(() => {
  return Boolean(recruitment.value.candidateStartedAtMs)
})

const remainingRecruitmentText = computed(() => {
  return formatSeconds(getRecruitmentRemainingSeconds(nowMs.value))
})

const canCreateCompany = computed(() => {
  return companyName.value.trim().length > 0 && !company.value
})

const secondsAfterCompanyCreated = computed(() => {
  if (!company.value || companyCreatedAtRuntimeSeconds.value === null) {
    return 0
  }

  return currentRuntimeSeconds.value - companyCreatedAtRuntimeSeconds.value
})

const canStartFirstVisitorEvent = computed(() => {
  return (
    company.value &&
    secondsAfterCompanyCreated.value >= 60 &&
    !storyStarted.value &&
    !hasRegisteredStaff.value
  )
})

const storyLines = computed(() => {
  if (!company.value) return []

  return [
    '똑똑똑.',
    '나 : 누구세요?',
    `?? : 여기가 ${company.value.name} 인가요? 직원 필요하실거 같아서.`,
  ]
})

const currentStoryLine = computed(() => {
  if (storyPhase.value !== 'dialogue') return ''
  if (storyLineIndex.value < 0) return ''

  return storyLines.value[storyLineIndex.value] ?? ''
})

const canRegisterVisitor = computed(() => {
  return (
    visitorName.value.trim().length > 0 &&
    selectedDepartment.value &&
    storyPhase.value === 'register' &&
    !hasRegisteredStaff.value
  )
})

const canHireCandidateFromHome = computed(() => {
  return (
    pendingCandidate.value &&
    candidateName.value.trim().length > 0 &&
    candidateDepartment.value &&
    !staffMenuOpen.value
  )
})

function createCompany() {
  if (!canCreateCompany.value) return

  storeCreateCompany(companyName.value)
  companyCreatedAtRuntimeSeconds.value = currentRuntimeSeconds.value
}

function getRandomGender() {
  return Math.random() < 0.5 ? '남성' : '여성'
}

function startFirstVisitorEvent() {
  if (storyStarted.value) return

  storyStarted.value = true
  storyPhase.value = 'dialogue'
  visitorGender.value = getRandomGender()
  storyLineIndex.value = 0

  storyTimer = window.setInterval(() => {
    if (storyLineIndex.value < storyLines.value.length - 1) {
      storyLineIndex.value += 1
      return
    }

    window.clearInterval(storyTimer)
    storyTimer = null

    storyLineIndex.value = -1
    storyPhase.value = 'register'
  }, 2200)
}

function selectDepartment(departmentId) {
  selectedDepartment.value = departmentId
}

function selectCandidateDepartment(departmentId) {
  candidateDepartment.value = departmentId
}

function completeFirstStaffRegistration() {
  if (!canRegisterVisitor.value) return

  registerFirstStaff({
    name: visitorName.value,
    gender: visitorGender.value,
    departmentId: selectedDepartment.value,
  })

  storyPhase.value = 'registered'
}

function startHomeRecruitment() {
  if (staffMenuOpen.value) return
  if (!canOpenRecruitment()) return

  openRecruitment(nowMs.value)
}

function hireCandidateFromHome() {
  if (!canHireCandidateFromHome.value) return

  registerAdditionalStaff({
    name: candidateName.value,
    gender: pendingCandidate.value.gender,
    departmentId: candidateDepartment.value,
  })

  candidateName.value = ''
  candidateDepartment.value = ''
}

function updateHomeRecruitment() {
  if (!company.value) return
  if (!hasRegisteredStaff.value) return
  if (staffMenuOpen.value) return

  updateRecruitment(nowMs.value)
}

watch(canStartFirstVisitorEvent, (canStart) => {
  if (canStart) {
    startFirstVisitorEvent()
  }
})

watch(nowMs, () => {
  updateHomeRecruitment()
})

onMounted(() => {
  localTimer = window.setInterval(() => {
    localNow.value = Date.now()
  }, 1000)

  updateHomeRecruitment()
})

onUnmounted(() => {
  if (localTimer) {
    window.clearInterval(localTimer)
    localTimer = null
  }

  if (storyTimer) {
    window.clearInterval(storyTimer)
    storyTimer = null
  }
})
</script>

<template>
  <section class="home-page">
    <section v-if="!company" class="company-start-panel">
      <div class="start-title">
        <span class="panel-label">RCTS START</span>

        <h1>사장님 어떤 회사를 운영하실까요?</h1>

        <p>회사이름을 정해주세요.</p>
      </div>

      <div class="company-form">
        <label class="input-field">
          <span>회사명</span>
          <input
            v-model="companyName"
            type="text"
            placeholder="회사명을 입력하세요"
            @keyup.enter="createCompany"
          />
        </label>

        <button
          class="primary-button"
          type="button"
          :disabled="!canCreateCompany"
          @click="createCompany"
        >
          회사 설립
        </button>
      </div>
    </section>

    <section v-else class="company-created-panel">
      <h1 class="created-company-name">
        {{ company.name }}
      </h1>

      <div
        v-if="storyPhase === 'dialogue' && !hasRegisteredStaff"
        class="story-line-space active"
      >
        <span>{{ currentStoryLine }}</span>
      </div>

      <article
        v-else-if="storyPhase === 'register' && !hasRegisteredStaff"
        class="visitor-register-space"
      >
        <div class="visitor-register-header">
          <span>FIRST VISITOR</span>
          <strong>이름과 배치 부서를 정해주세요.</strong>
        </div>

        <dl class="visitor-info">
          <div>
            <dt>성별</dt>
            <dd>{{ visitorGender }}</dd>
          </div>
        </dl>

        <label class="input-field">
          <span>직원 이름</span>
          <input
            v-model="visitorName"
            type="text"
            placeholder="첫 직원의 이름을 입력하세요"
            @keyup.enter="completeFirstStaffRegistration"
          />
        </label>

        <div class="department-section">
          <span class="department-label">배치 부서</span>

          <div class="department-grid">
            <button
              v-for="department in departments"
              :key="department.id"
              class="department-button"
              :class="{ selected: selectedDepartment === department.id }"
              type="button"
              @click="selectDepartment(department.id)"
            >
              <strong>{{ department.departmentName }}</strong>
            </button>
          </div>
        </div>

        <button
          class="primary-button"
          type="button"
          :disabled="!canRegisterVisitor"
          @click="completeFirstStaffRegistration"
        >
          첫 직원 등록
        </button>
      </article>

      <template v-else-if="hasRegisteredStaff">
        <nav class="department-menu-grid">
          <template
            v-for="menu in menuCards"
            :key="menu.id"
          >
            <RouterLink
              v-if="menu.isOpen"
              class="department-menu-card open"
              :to="menu.path"
            >
              <strong>{{ menu.menuName }}</strong>
            </RouterLink>

            <div
              v-else
              class="department-menu-card locked"
              aria-disabled="true"
            >
              <strong>{{ menu.menuName }}</strong>
              <span>직원고용하세요</span>
            </div>
          </template>
        </nav>

        <section
          v-if="!staffMenuOpen"
          class="home-recruit-panel"
        >
          <article
            v-if="pendingCandidate"
            class="candidate-card"
          >
            <div class="candidate-header">
              <span>지원자 도착</span>
              <strong>신규 지원자</strong>
            </div>

            <dl>
              <div>
                <dt>성별</dt>
                <dd>{{ pendingCandidate.gender }}</dd>
              </div>
            </dl>

            <label class="input-field">
              <span>직원 이름</span>
              <input
                v-model="candidateName"
                type="text"
                placeholder="직원 이름을 입력하세요"
                @keyup.enter="hireCandidateFromHome"
              />
            </label>

            <div class="department-section">
              <span class="department-label">배치 부서</span>

              <div class="department-grid">
                <button
                  v-for="department in departments"
                  :key="department.id"
                  class="department-button"
                  :class="{ selected: candidateDepartment === department.id }"
                  type="button"
                  @click="selectCandidateDepartment(department.id)"
                >
                  <strong>{{ department.departmentName }}</strong>
                </button>
              </div>
            </div>

            <button
              class="primary-button"
              type="button"
              :disabled="!canHireCandidateFromHome"
              @click="hireCandidateFromHome"
            >
              직원 채용
            </button>
          </article>

          <article
            v-else-if="recruitmentRunning"
            class="waiting-card"
          >
            <strong>지원자 대기 중</strong>

            <span v-if="isTimeDisplayUnlocked">
              {{ remainingRecruitmentText }}
            </span>
          </article>

          <article
            v-else-if="isCurrentRecruitmentLimitReached()"
            class="waiting-card"
          >
            <strong>현재 단계 채용 종료</strong>
          </article>

          <article
            v-else
            class="waiting-card"
          >
            <strong>추가 직원 개방</strong>

            <button
              class="primary-button"
              type="button"
              :disabled="!canOpenRecruitment()"
              @click="startHomeRecruitment"
            >
              채용 개방
            </button>
          </article>
        </section>
      </template>
    </section>
  </section>
</template>

<style scoped>
.home-page {
  display: grid;
  gap: 18px;
}

.company-start-panel {
  min-height: calc(100dvh - 120px);
  display: grid;
  place-items: center;
  align-content: center;
  gap: 28px;
  padding: 32px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 28px;
  background:
    radial-gradient(circle at top, rgba(96, 165, 250, 0.18), transparent 48%),
    rgba(15, 23, 42, 0.62);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.22);
  text-align: center;
}

.start-title {
  display: grid;
  gap: 10px;
}

.panel-label {
  color: #60a5fa;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.14em;
}

.start-title h1 {
  margin: 0;
  color: #f8fafc;
  font-size: clamp(30px, 5vw, 52px);
  font-weight: 900;
  letter-spacing: -0.04em;
}

.start-title p {
  margin: 0;
  color: #cbd5e1;
  font-size: 18px;
  font-weight: 800;
}

.company-form,
.visitor-register-space,
.home-recruit-panel,
.candidate-card,
.waiting-card {
  width: min(100%, 560px);
  display: grid;
  gap: 14px;
}

.input-field {
  display: grid;
  gap: 8px;
  text-align: left;
}

.input-field span,
.department-label {
  color: #cbd5e1;
  font-size: 13px;
  font-weight: 800;
}

.input-field input {
  width: 100%;
  padding: 15px 16px;
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 16px;
  outline: none;
  background: rgba(15, 23, 42, 0.78);
  color: #f8fafc;
  font-size: 16px;
}

.input-field input::placeholder {
  color: #64748b;
}

.input-field input:focus {
  border-color: rgba(96, 165, 250, 0.7);
}

.primary-button {
  width: 100%;
  padding: 15px 16px;
  border: 0;
  border-radius: 16px;
  background: #60a5fa;
  color: #0f172a;
  font-size: 15px;
  font-weight: 900;
  cursor: pointer;
}

.primary-button:disabled {
  background: rgba(148, 163, 184, 0.22);
  color: #64748b;
  cursor: not-allowed;
}

.company-created-panel {
  min-height: calc(100dvh - 120px);
  padding: 24px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 24px;
  background: rgba(15, 23, 42, 0.42);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.18);
  backdrop-filter: blur(16px);
}

.created-company-name {
  margin: 0;
  color: #f8fafc;
  font-size: 32px;
  font-weight: 900;
  letter-spacing: -0.03em;
}

.story-line-space {
  min-height: 34px;
  margin-top: 12px;
  color: transparent;
  font-size: 16px;
  font-weight: 800;
  line-height: 1.7;
}

.story-line-space.active {
  color: #cbd5e1;
}

.visitor-register-space,
.candidate-card,
.waiting-card {
  margin-top: 14px;
  padding: 18px;
  border: 1px solid rgba(96, 165, 250, 0.32);
  border-radius: 20px;
  background: rgba(96, 165, 250, 0.08);
}

.visitor-register-header,
.candidate-header {
  display: grid;
  gap: 6px;
}

.visitor-register-header span,
.candidate-header span {
  color: #60a5fa;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.14em;
}

.visitor-register-header strong,
.candidate-header strong,
.waiting-card strong {
  color: #f8fafc;
  font-size: 20px;
  font-weight: 900;
}

.waiting-card span {
  color: #94a3b8;
  font-size: 14px;
  font-weight: 900;
}

.visitor-info,
.candidate-card dl {
  display: grid;
  gap: 8px;
  margin: 0;
}

.visitor-info div,
.candidate-card dl div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.visitor-info dt,
.candidate-card dt {
  color: #94a3b8;
  font-size: 13px;
  font-weight: 800;
}

.visitor-info dd,
.candidate-card dd {
  margin: 0;
  color: #e2e8f0;
  font-size: 13px;
  font-weight: 900;
}

.department-section {
  display: grid;
  gap: 10px;
}

.department-grid,
.department-menu-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.department-button {
  min-height: 64px;
  display: grid;
  place-items: center;
  padding: 14px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 16px;
  background: rgba(15, 23, 42, 0.56);
  color: inherit;
  text-align: center;
  cursor: pointer;
}

.department-button strong {
  color: #f8fafc;
  font-size: 15px;
  font-weight: 900;
}

.department-button.selected {
  border-color: rgba(96, 165, 250, 0.78);
  background: rgba(96, 165, 250, 0.16);
}

.department-menu-grid {
  margin-top: 18px;
}

.department-menu-card {
  min-height: 120px;
  display: grid;
  align-content: center;
  gap: 8px;
  padding: 18px;
  border-radius: 20px;
  text-decoration: none;
  color: inherit;
  text-align: center;
}

.department-menu-card strong {
  color: #f8fafc;
  font-size: 21px;
  font-weight: 900;
}

.department-menu-card span {
  color: #94a3b8;
  font-size: 13px;
  font-weight: 800;
}

.department-menu-card.open {
  border: 1px solid rgba(96, 165, 250, 0.52);
  background:
    radial-gradient(circle at center, rgba(96, 165, 250, 0.18), transparent 64%),
    rgba(96, 165, 250, 0.1);
  cursor: pointer;
}

.department-menu-card.locked {
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: rgba(15, 23, 42, 0.46);
  opacity: 0.72;
  cursor: not-allowed;
  user-select: none;
}

.home-recruit-panel {
  margin-top: 16px;
}

@media (max-width: 720px) {
  .company-start-panel,
  .company-created-panel {
    min-height: calc(100dvh - 96px);
    padding: 22px;
    border-radius: 22px;
  }

  .start-title h1 {
    font-size: 30px;
  }

  .start-title p {
    font-size: 16px;
  }

  .created-company-name {
    font-size: 26px;
  }

  .department-grid,
  .department-menu-grid {
    grid-template-columns: 1fr;
  }

  .department-button {
    min-height: 54px;
  }

  .department-menu-card {
    min-height: 92px;
  }
}
</style>