<!-- src/pages/StaffPage.vue -->

<script setup>
import { computed, inject, onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useRctsStore } from '../stores/rctsStore'

const worldClock = inject('worldClock', null)

const {
  company,
  staffList,
  departments,
  recruitment,
  isMenuOpen,
  isTimeDisplayUnlocked,
  hasSystemSecretary,
  getDepartmentHead,
  getDepartmentHeadTitle,
  getStaffRoleTitle,
  canOpenRecruitment,
  openRecruitment,
  updateRecruitment,
  getRecruitmentRemainingSeconds,
  isCurrentRecruitmentLimitReached,
  formatSeconds,
  registerAdditionalStaff,
} = useRctsStore()

const localTick = ref(0)
let localTimer = null

const activeTab = ref('recruit')
const candidateName = ref('')
const selectedDepartment = ref('')

const currentTick = computed(() => {
  return worldClock?.tick?.value ?? localTick.value
})

const staffHead = computed(() => {
  return getDepartmentHead('staff')
})

const staffHeadTitle = computed(() => {
  return getDepartmentHeadTitle('staff')
})

const pendingCandidate = computed(() => {
  return recruitment.value.pendingCandidate
})

const recruitmentRunning = computed(() => {
  return recruitment.value.candidateStartedAtTick !== null
})

const remainingRecruitmentText = computed(() => {
  return formatSeconds(getRecruitmentRemainingSeconds(currentTick.value))
})

const canHireCandidate = computed(() => {
  return (
    pendingCandidate.value &&
    candidateName.value.trim().length > 0 &&
    selectedDepartment.value
  )
})

const tabs = [
  {
    id: 'recruit',
    name: '신규채용',
  },
  {
    id: 'list',
    name: '직원목록',
  },
  {
    id: 'education',
    name: '교육센터',
  },
]

function selectTab(tabId) {
  activeTab.value = tabId
}

function selectDepartment(departmentId) {
  selectedDepartment.value = departmentId
}

function startRecruitment() {
  if (!canOpenRecruitment(currentTick.value)) return

  openRecruitment(currentTick.value)
}

function hireCandidate() {
  if (!canHireCandidate.value) return

  registerAdditionalStaff({
    name: candidateName.value,
    gender: pendingCandidate.value.gender,
    departmentId: selectedDepartment.value,
  })

  candidateName.value = ''
  selectedDepartment.value = ''
}

function updateRecruitmentState() {
  if (!company.value) return
  if (!isMenuOpen('staff')) return

  updateRecruitment(currentTick.value)
}

watch(currentTick, () => {
  updateRecruitmentState()
})

onMounted(() => {
  localTimer = window.setInterval(() => {
    localTick.value += 1
  }, 1000)

  updateRecruitmentState()
})

onUnmounted(() => {
  if (localTimer) {
    window.clearInterval(localTimer)
    localTimer = null
  }
})
</script>

<template>
  <section class="menu-page">
    <header class="page-header">
      <RouterLink to="/" class="back-link">← 뒤로</RouterLink>

      <div>
        <h1>직원</h1>
        <p v-if="staffHead">
          {{ staffHead.name }} {{ staffHeadTitle }}
        </p>
      </div>
    </header>

    <section v-if="!company" class="empty-panel">
      <strong>회사 정보 없음</strong>
    </section>

    <section v-else-if="!isMenuOpen('staff')" class="empty-panel">
      <strong>직원고용하세요</strong>
    </section>

    <section v-else class="active-panel">
      <nav class="sub-menu">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          :class="{ active: activeTab === tab.id }"
          @click="selectTab(tab.id)"
        >
          {{ tab.name }}
        </button>
      </nav>

      <section
        v-if="activeTab === 'recruit'"
        class="tab-panel"
      >
        <div class="section-title">
          <span>RECRUIT</span>
          <h2>신규채용</h2>
        </div>

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
              @keyup.enter="hireCandidate"
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
            :disabled="!canHireCandidate"
            @click="hireCandidate"
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

          <span v-if="hasSystemSecretary">
            추가 채용은 이후 단계에서 개방됩니다.
          </span>
        </article>

        <article
          v-else
          class="waiting-card"
        >
          <strong>추가 직원 개방</strong>

          <button
            class="primary-button"
            type="button"
            :disabled="!canOpenRecruitment(currentTick)"
            @click="startRecruitment"
          >
            채용 개방
          </button>
        </article>
      </section>

      <section
        v-else-if="activeTab === 'list'"
        class="tab-panel"
      >
        <div class="section-title">
          <span>STAFF LIST</span>
          <h2>직원목록</h2>
        </div>

        <div class="staff-list">
          <article
            v-for="staff in staffList"
            :key="staff.id"
            class="staff-card"
          >
            <strong>{{ staff.name }}</strong>

            <dl>
              <div>
                <dt>성별</dt>
                <dd>{{ staff.gender }}</dd>
              </div>

              <div>
                <dt>배치 부서</dt>
                <dd>{{ staff.departmentName }}</dd>
              </div>

              <div>
                <dt>직책</dt>
                <dd>{{ getStaffRoleTitle(staff) }}</dd>
              </div>
            </dl>
          </article>
        </div>
      </section>

      <section
        v-else
        class="tab-panel"
      >
        <div class="section-title">
          <span>EDUCATION CENTER</span>
          <h2>교육센터</h2>
        </div>

        <div class="locked-box">
          <strong>미개방</strong>
        </div>
      </section>
    </section>
  </section>
</template>

<style scoped>
.menu-page {
  min-height: calc(100dvh - 120px);
  padding: 24px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 24px;
  background: rgba(15, 23, 42, 0.42);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  gap: 16px;
  margin-bottom: 18px;
}

.back-link {
  color: #93c5fd;
  font-size: 13px;
  font-weight: 900;
  text-decoration: none;
}

.page-header h1,
.page-header p {
  margin: 0;
}

.page-header h1 {
  color: #f8fafc;
  font-size: 32px;
  font-weight: 900;
}

.page-header p {
  margin-top: 6px;
  color: #93c5fd;
  font-size: 14px;
  font-weight: 900;
}

.empty-panel,
.active-panel {
  min-height: 160px;
  display: grid;
  gap: 18px;
  padding: 24px;
  border-radius: 20px;
}

.empty-panel {
  place-items: center;
  border: 1px dashed rgba(148, 163, 184, 0.28);
  background: rgba(15, 23, 42, 0.42);
  color: #94a3b8;
  text-align: center;
}

.active-panel {
  border: 1px solid rgba(96, 165, 250, 0.42);
  background: rgba(96, 165, 250, 0.1);
  color: #f8fafc;
}

.sub-menu {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.sub-menu button {
  padding: 13px 14px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.52);
  color: #94a3b8;
  font-size: 14px;
  font-weight: 900;
  cursor: pointer;
}

.sub-menu button.active {
  border-color: rgba(96, 165, 250, 0.68);
  background: rgba(96, 165, 250, 0.16);
  color: #f8fafc;
}

.tab-panel {
  display: grid;
  gap: 14px;
}

.section-title {
  display: grid;
  gap: 6px;
}

.section-title span {
  color: #60a5fa;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.14em;
}

.section-title h2 {
  margin: 0;
  color: #f8fafc;
  font-size: 22px;
  font-weight: 900;
}

.staff-list {
  display: grid;
  gap: 12px;
}

.staff-card,
.candidate-card,
.waiting-card {
  display: grid;
  gap: 12px;
  padding: 16px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 18px;
  background: rgba(15, 23, 42, 0.52);
}

.staff-card strong,
.candidate-header strong,
.waiting-card strong {
  color: #f8fafc;
  font-size: 18px;
  font-weight: 900;
}

.waiting-card span {
  color: #94a3b8;
  font-size: 14px;
  font-weight: 800;
}

.candidate-header {
  display: grid;
  gap: 6px;
}

.candidate-header span {
  color: #93c5fd;
  font-size: 12px;
  font-weight: 900;
}

.staff-card dl,
.candidate-card dl {
  display: grid;
  gap: 8px;
  margin: 0;
}

.staff-card dl div,
.candidate-card dl div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.staff-card dt,
.candidate-card dt {
  color: #94a3b8;
  font-size: 13px;
  font-weight: 800;
}

.staff-card dd,
.candidate-card dd {
  margin: 0;
  color: #e2e8f0;
  font-size: 13px;
  font-weight: 900;
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

.department-section {
  display: grid;
  gap: 10px;
}

.department-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.department-button {
  min-height: 58px;
  display: grid;
  place-items: center;
  padding: 12px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.56);
  color: inherit;
  text-align: center;
  cursor: pointer;
}

.department-button strong {
  color: #f8fafc;
  font-size: 14px;
  font-weight: 900;
}

.department-button.selected {
  border-color: rgba(96, 165, 250, 0.78);
  background: rgba(96, 165, 250, 0.16);
}

.primary-button {
  width: 100%;
  padding: 14px 16px;
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

.locked-box {
  min-height: 100px;
  display: grid;
  place-items: center;
  border: 1px dashed rgba(148, 163, 184, 0.28);
  border-radius: 18px;
  background: rgba(15, 23, 42, 0.42);
  color: #94a3b8;
}

.locked-box strong {
  font-size: 16px;
  font-weight: 900;
}

@media (max-width: 720px) {
  .menu-page {
    min-height: calc(100dvh - 96px);
    padding: 18px;
    border-radius: 20px;
  }

  .page-header {
    display: grid;
  }

  .page-header h1 {
    font-size: 28px;
  }

  .sub-menu,
  .department-grid {
    grid-template-columns: 1fr;
  }
}
</style>