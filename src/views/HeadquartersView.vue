<!--
  파일명: src/views/HeadquartersView.vue

  역할:
  - 테라리아 본부 화면입니다.
  - 회사 생성, 회사 재생성, 비서 후보 확정, 전체 상태 요약을 담당합니다.
-->

<template>
  <section class="page">
    <header class="page-title">
      <div>
        <p>HEADQUARTERS</p>
        <h2>본부</h2>
      </div>
    </header>

    <article v-if="!terrariaState.initialized" class="panel setup-panel">
      <header class="panel-head">
        <div>
          <p>COMPANY SETUP</p>
          <h3>사장 프로필 생성</h3>
        </div>
      </header>

      <div class="panel-inner">
        <div class="mini-grid">
          <label class="field">
            <span>성</span>
            <input v-model="playerDraft.surname" placeholder="예: 차" />
          </label>

          <label class="field">
            <span>이름</span>
            <input v-model="playerDraft.givenName" placeholder="예: 은우" />
          </label>

          <label class="field">
            <span>성별</span>
            <select v-model="playerDraft.gender">
              <option value="male">남성</option>
              <option value="female">여성</option>
            </select>
          </label>

          <label class="field">
            <span>출생연도</span>
            <input v-model.number="playerDraft.birthYear" type="number" min="1950" max="2026" />
          </label>

          <label class="field">
            <span>생월</span>
            <input v-model.number="playerDraft.birthMonth" type="number" min="1" max="12" />
          </label>

          <label class="field">
            <span>생일</span>
            <input v-model.number="playerDraft.birthDay" type="number" min="1" max="28" />
          </label>
        </div>


        <button type="button" class="primary-button" @click="createCompany">
          회사 설립 및 임무 시작
        </button>
      </div>
    </article>

    <template v-else>
      <section class="grid">
        <article class="panel" style="grid-column: span 12;">
          <header class="panel-head">
            <div>
              <p>CEO PROFILE</p>
              <h3>{{ terrariaState.player.fullName }} 사장</h3>
            </div>
            <div class="header-actions">
              <span class="pill">{{ getGenderLabel(terrariaState.player.gender) }}</span>
              <button type="button" class="danger-button" @click="restartCurrentCompany">
                회사 새로 만들기
              </button>
            </div>
          </header>

          <div class="panel-inner mini-grid">
            <div class="stat-card">
              <span>현재 나이</span>
              <strong>{{ getAge(terrariaState.player) }}세</strong>
            </div>

            <div class="stat-card">
              <span>비서 수</span>
              <strong>{{ stateSummary.secretaries }}</strong>
            </div>

            <div class="stat-card">
              <span>대기 임무</span>
              <strong>{{ stateSummary.pendingReports }}</strong>
            </div>

            <div class="stat-card">
              <span>진행 중</span>
              <strong>{{ stateSummary.runningTasks }}</strong>
            </div>

            <div class="stat-card">
              <span>총 수락 임무</span>
              <strong>{{ stateSummary.totalAcceptedMissions }}</strong>
            </div>

          </div>
        </article>

        <article v-if="terrariaState.pendingSecretaryCandidates.length > 0" class="panel" style="grid-column: span 12;">
          <header class="panel-head">
            <div>
              <p>SECRETARY CANDIDATE</p>
              <h3>비서 후보 확인</h3>
            </div>
          </header>

          <div class="panel-inner">

            <section class="candidate-grid">
              <article
                v-for="candidate in terrariaState.pendingSecretaryCandidates"
                :key="candidate.tempId"
                class="candidate-card"
              >
                <div>
                  <p class="candidate-label">{{ candidate.departmentName }} · {{ candidate.role }}</p>

                  <label class="field candidate-name-field">
                    <span>후보 이름</span>
                    <input
                      :value="candidate.editableFullName"
                      @input="updateSecretaryCandidateName(candidate.tempId, $event.target.value)"
                    />
                  </label>

                  <p>{{ getGenderLabel(candidate.gender) }} · {{ getAge(candidate) }}세</p>
                </div>

                <div class="button-row">
                  <button type="button" class="ghost-button" @click="rerollSecretaryCandidateName(candidate.tempId)">
                    이름만 다시 생성
                  </button>

                  <button type="button" class="primary-button" @click="confirmSecretaryCandidate(candidate.tempId)">
                    이 이름으로 확정
                  </button>
                </div>
              </article>
            </section>
          </div>
        </article>

        <article class="panel" style="grid-column: span 12;">
          <header class="panel-head">
            <div>
              <p>TODAY FLOW</p>
              <h3>오늘의 흐름</h3>
            </div>
          </header>

          <div class="panel-inner list">
            <div v-if="flowTasks.length <= 0" class="empty">
              현재 진행 중이거나 예정된 업무가 없습니다. 임무 보고함에서 임무를 수락해 주세요.
            </div>

            <article v-for="task in flowTasks" :key="task.id" class="item-card">
              <h4>{{ task.projectName }}</h4>
              <p>{{ task.secretaryName }} · {{ task.departmentName }}</p>
              <div class="progress-bar"><span :style="{ width: `${getProgressPercent(task)}%` }" /></div>
              <div class="meta-row">
                <span class="pill">{{ getTaskStatusLabel(task) }}</span>
                <span class="pill">{{ getTaskDateText(task) }}</span>
              </div>
            </article>
          </div>
        </article>

      </section>
    </template>
  </section>
</template>

<script setup>
import { computed, reactive } from 'vue'
import { useRouter } from 'vue-router'

import {
  confirmSecretaryCandidate,
  getAge,
  getGenderLabel,
  getProgressPercent,
  getTaskDateText,
  getTaskStatusLabel,
  initializeCompany,
  rerollSecretaryCandidateName,
  restartCompany,
  stateSummary,
  terrariaState,
  upcomingTasks,
  updateSecretaryCandidateName,
} from '../stores/terrariaManager'

const router = useRouter()

const playerDraft = reactive({
  surname: '차',
  givenName: '은우',
  gender: 'male',
  birthYear: 1995,
  birthMonth: 1,
  birthDay: 1,
})

const flowTasks = computed(() => {
  return upcomingTasks.value
    .filter((task) => task.completionRecorded !== true)
    .slice(0, 8)
})

const createCompany = () => {
  initializeCompany(playerDraft)
  router.push('/secretary-office')
}

const restartCurrentCompany = () => {
  const confirmed = window.confirm('현재 회사 데이터를 지우고 새 회사 생성 화면으로 돌아갈까요?')

  if (!confirmed) {
    return
  }

  restartCompany()
  router.push('/headquarters')
}
</script>

<style scoped>
.setup-panel {
  max-width: 960px;
  margin: 0 auto;
}

.setup-note,
.guide-text {
  margin: 1rem 0;
  color: #94a3b8;
  line-height: 1.6;
}

.candidate-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 0.85rem;
}

.candidate-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 1rem;
  background: rgba(2, 6, 23, 0.26);
}

.candidate-label,
.candidate-card p {
  margin: 0;
  color: #94a3b8;
}

.candidate-name-field {
  margin: 0.8rem 0 0.35rem;
}

.candidate-name-field input {
  font-size: 1.15rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.candidate-hint {
  margin-top: 0.45rem !important;
  font-size: 0.82rem;
  line-height: 1.45;
}

.header-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.5rem;
}

@media (max-width: 860px) {
  [style*='grid-column'] {
    grid-column: auto !important;
  }
}
</style>
