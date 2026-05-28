<!-- src/pages/SystemPage.vue -->

<script setup>
import { computed, inject, onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useRctsStore } from '../stores/rctsStore'

const worldClock = inject('worldClock', null)

const {
  company,
  isMenuOpen,
  getDepartmentHead,
  getDepartmentHeadTitle,
  getSystemSecretaryCandidates,
  getSystemSecretary,
  assignSystemSecretary,
  getResearch,
  canStartResearch,
  startSystemResearch,
  getResearchRemainingSeconds,
  isResearchFinished,
  completeSystemResearch,
  formatSeconds,
  hasSystemSecretary,
  isDataSaveUnlocked,
} = useRctsStore()

const localNow = ref(Date.now())
let localTimer = null

const nowMs = computed(() => {
  return worldClock?.now?.value ?? localNow.value
})

const systemHead = computed(() => {
  return getDepartmentHead('system')
})

const systemHeadTitle = computed(() => {
  return getDepartmentHeadTitle('system')
})

const systemSecretaryCandidates = computed(() => {
  return getSystemSecretaryCandidates()
})

const systemSecretary = computed(() => {
  return getSystemSecretary()
})

const timeResearch = computed(() => {
  return getResearch('timeBasic')
})

const dataResearch = computed(() => {
  return getResearch('dataBasic')
})

const timeResearchRemainingText = computed(() => {
  return formatSeconds(getResearchRemainingSeconds('timeBasic', nowMs.value))
})

const dataResearchRemainingText = computed(() => {
  return formatSeconds(getResearchRemainingSeconds('dataBasic', nowMs.value))
})

const canStartTimeResearch = computed(() => {
  return canStartResearch('timeBasic')
})

const canStartDataResearch = computed(() => {
  return canStartResearch('dataBasic')
})

function startResearch(researchId) {
  startSystemResearch(researchId)
}

function updateResearchCompletion() {
  if (isResearchFinished('timeBasic', nowMs.value)) {
    completeSystemResearch('timeBasic')
  }

  if (isResearchFinished('dataBasic', nowMs.value)) {
    completeSystemResearch('dataBasic')
  }
}

function selectSystemSecretary(staffId) {
  assignSystemSecretary(staffId)
}

watch(nowMs, () => {
  updateResearchCompletion()
})

onMounted(() => {
  localTimer = window.setInterval(() => {
    localNow.value = Date.now()
  }, 1000)

  updateResearchCompletion()
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
        <h1>시스템</h1>
        <p v-if="systemHead">
          {{ systemHead.name }} {{ systemHeadTitle }}
        </p>
      </div>
    </header>

    <section v-if="!company" class="empty-panel">
      <strong>회사 정보 없음</strong>
    </section>

    <section v-else-if="!isMenuOpen('system')" class="empty-panel">
      <strong>직원고용하세요</strong>
    </section>

    <section v-else class="active-panel">
      <article class="department-head-card">
        <span>DEPARTMENT HEAD</span>
        <strong>{{ systemHead?.name }} {{ systemHeadTitle }}</strong>
      </article>

      <section class="secretary-section">
        <div class="section-title">
          <span>SECRETARY</span>
          <h2>시스템부 비서</h2>
        </div>

        <article
          v-if="systemSecretary"
          class="secretary-card active"
        >
          <strong>{{ systemSecretary.name }}</strong>
          <span>비서 배치 완료</span>
        </article>

        <div
          v-else-if="systemSecretaryCandidates.length > 0"
          class="secretary-list"
        >
          <button
            v-for="staff in systemSecretaryCandidates"
            :key="staff.id"
            class="secretary-button"
            type="button"
            @click="selectSystemSecretary(staff.id)"
          >
            {{ staff.name }} 배치
          </button>
        </div>

        <article
          v-else
          class="secretary-card"
        >
          <strong>배치 가능 직원 없음</strong>
        </article>
      </section>

      <section class="research-section">
        <div class="section-title">
          <span>BASIC RESEARCH</span>
          <h2>기초단계 연구</h2>
        </div>

        <article class="research-card">
          <div>
            <strong>{{ timeResearch.name }}</strong>
            <span v-if="timeResearch.completed">완료</span>
            <span v-else-if="timeResearch.startedAtMs">진행 중</span>
            <span v-else>대기 중</span>
          </div>

          <p v-if="hasSystemSecretary">
            완료 시 상단에 서울 기준 표준시간이 표시됩니다.
          </p>

          <button
            v-if="!timeResearch.startedAtMs && !timeResearch.completed"
            class="primary-button"
            type="button"
            :disabled="!canStartTimeResearch"
            @click="startResearch('timeBasic')"
          >
            연구 시작
          </button>

          <div
            v-else-if="timeResearch.startedAtMs && !timeResearch.completed"
            class="countdown"
          >
            {{ timeResearchRemainingText }}
          </div>

          <div
            v-else
            class="complete-text"
          >
            시간 표시 해금 완료
          </div>
        </article>

        <article class="research-card">
          <div>
            <strong>{{ dataResearch.name }}</strong>
            <span v-if="dataResearch.completed">완료</span>
            <span v-else-if="dataResearch.startedAtMs">진행 중</span>
            <span v-else>대기 중</span>
          </div>

          <p v-if="hasSystemSecretary">
            완료 시 저장 기능이 활성화됩니다.
          </p>

          <button
            v-if="!dataResearch.startedAtMs && !dataResearch.completed"
            class="primary-button"
            type="button"
            :disabled="!canStartDataResearch"
            @click="startResearch('dataBasic')"
          >
            연구 시작
          </button>

          <div
            v-else-if="dataResearch.startedAtMs && !dataResearch.completed"
            class="countdown"
          >
            {{ dataResearchRemainingText }}
          </div>

          <div
            v-else
            class="complete-text"
          >
            저장 기능 활성화 완료
          </div>
        </article>

        <div class="save-status">
          <strong>저장 상태</strong>
          <span v-if="isDataSaveUnlocked">활성화</span>
          <span v-else>비활성화</span>
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
  gap: 16px;
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

.department-head-card,
.secretary-card,
.research-card {
  display: grid;
  gap: 12px;
  padding: 18px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 18px;
  background: rgba(15, 23, 42, 0.52);
}

.department-head-card span,
.section-title span {
  color: #60a5fa;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.14em;
}

.department-head-card strong,
.secretary-card strong,
.research-card strong {
  color: #f8fafc;
  font-size: 18px;
  font-weight: 900;
}

.secretary-card span {
  color: #93c5fd;
  font-size: 13px;
  font-weight: 900;
}

.secretary-section,
.research-section {
  display: grid;
  gap: 14px;
}

.section-title {
  display: grid;
  gap: 6px;
}

.section-title h2 {
  margin: 0;
  color: #f8fafc;
  font-size: 22px;
  font-weight: 900;
}

.secretary-list {
  display: grid;
  gap: 10px;
}

.secretary-button {
  padding: 14px 16px;
  border: 1px solid rgba(96, 165, 250, 0.34);
  border-radius: 16px;
  background: rgba(96, 165, 250, 0.1);
  color: #f8fafc;
  font-size: 15px;
  font-weight: 900;
  cursor: pointer;
}

.research-card > div:first-child {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.research-card span {
  color: #93c5fd;
  font-size: 13px;
  font-weight: 900;
}

.research-card p {
  margin: 0;
  color: #94a3b8;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.6;
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

.countdown {
  padding: 14px;
  border: 1px solid rgba(96, 165, 250, 0.34);
  border-radius: 16px;
  background: rgba(96, 165, 250, 0.1);
  color: #f8fafc;
  font-size: 24px;
  font-weight: 900;
  text-align: center;
  letter-spacing: 0.08em;
}

.complete-text {
  padding: 14px;
  border-radius: 16px;
  background: rgba(34, 197, 94, 0.12);
  color: #bbf7d0;
  font-size: 14px;
  font-weight: 900;
  text-align: center;
}

.save-status {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 16px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 16px;
  background: rgba(15, 23, 42, 0.52);
}

.save-status strong,
.save-status span {
  color: #f8fafc;
  font-size: 14px;
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
}
</style>