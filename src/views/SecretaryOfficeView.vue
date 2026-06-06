<!--
  파일명: src/views/SecretaryOfficeView.vue

  역할:
  - 랜덤 임무 보고함입니다.
  - 카운터 임무와 표준시간 임무를 표시하고 수락/예약합니다.
-->

<template>
  <section class="page">
    <header class="page-title">
      <div>
        <p>MISSION INBOX</p>
        <h2>임무 보고함</h2>
      </div>
    </header>

    <article v-if="!terrariaState.initialized" class="panel">
      <div class="panel-inner empty">
        먼저 본부에서 사장 프로필을 생성해 주세요.
      </div>
    </article>

    <template v-else>
      <article class="panel">
        <header class="panel-head">
          <div>
            <p>RANDOM MISSION FLOW</p>
            <h3>{{ terrariaState.secretaries.length <= 0 ? '사장 직접 수행 단계' : '비서 보고 단계' }}</h3>
          </div>
          <span class="pill">대기 {{ randomMissionReports.length }}건</span>
        </header>

      </article>

      <section class="report-grid">
        <article
          v-for="report in randomMissionReports"
          :key="report.id"
          class="panel report-card"
          :class="{ 'unlock-card': report.specialAction === 'unlockSecretary' }"
        >
          <header class="panel-head">
            <div>
              <p>{{ report.departmentName }} · {{ report.missionType }}</p>
              <h3>{{ report.projectName }}</h3>
            </div>
            <span class="pill">{{ report.priority }}</span>
          </header>

          <div class="panel-inner">
            <p class="report-text">{{ report.reportText }}</p>

            <div class="meta-row">
              <span class="pill">담당 {{ report.secretaryName }}</span>
              <span class="pill">예상 {{ getDurationText(report.durationMinutes) }}</span>
              <span class="pill mode-pill">{{ getExecutionModeLabel(report.executionMode) }}</span>
            </div>

            <div class="button-row report-actions">
              <button type="button" class="ghost-button" @click="dismissMissionReport(report.id)">
                보류함에서 제외
              </button>

              <button
                v-if="report.executionMode === 'counter'"
                type="button"
                class="primary-button"
                @click="startCounterMissionReport(report.id)"
              >
                카운터 즉시 진행
              </button>

              <button
                v-else-if="report.executionMode === 'secretary-standard'"
                type="button"
                class="primary-button"
                @click="autoScheduleMissionReport(report.id)"
              >
                비서 표준시간 자동 예약
              </button>
            </div>
          </div>
        </article>
      </section>

      <div v-if="randomMissionReports.length <= 0" class="empty">
        대기 중인 임무가 없습니다.
      </div>
    </template>
  </section>
</template>

<script setup>
import {
  autoScheduleMissionReport,
  dismissMissionReport,
  getDurationText,
  getExecutionModeLabel,
  randomMissionReports,
  startCounterMissionReport,
  terrariaState,
} from '../stores/terrariaManager'

</script>

<style scoped>
.report-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
  gap: 1rem;
}

.report-card.unlock-card {
  border-color: rgba(250, 204, 21, 0.45);
  background: rgba(113, 63, 18, 0.22);
}

.report-text {
  min-height: 4.5rem;
  margin: 0;
  color: #dbeafe;
  line-height: 1.65;
}

.mode-pill {
  border-color: rgba(125, 211, 252, 0.35);
  color: #bae6fd;
}

.schedule-box {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin: 1rem 0;
}

.report-actions {
  gap: 0.9rem;
  margin-top: 1.1rem;
}

.report-actions button {
  min-width: 9.5rem;
}

@media (max-width: 640px) {
  .report-grid {
    grid-template-columns: 1fr;
  }

  .schedule-box {
    grid-template-columns: 1fr;
  }

  .report-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .report-actions button {
    width: 100%;
    min-width: 0;
  }
}
</style>
