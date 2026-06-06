<!--
  파일명: src/views/ScheduleView.vue

  역할:
  - 완료된 업무를 제외한 예약/진행 스케줄을 표시합니다.
  - 완료 기록은 스케줄 목록에 남기지 않습니다.
-->

<template>
  <section class="page">
    <header class="page-title">
      <div>
        <p>SCHEDULE</p>
        <h2>스케줄</h2>
      </div>
    </header>

    <article class="panel">
      <header class="panel-head">
        <div>
          <p>RESERVED TASKS</p>
          <h3>예약 / 진행 업무</h3>
        </div>
      </header>

      <div class="panel-inner list">
        <article v-for="task in upcomingTasks" :key="task.id" class="item-card schedule-card">
          <div class="task-main">
            <div>
              <h4>{{ task.projectName }}</h4>
              <p>{{ task.secretaryName }} · {{ task.departmentName }}</p>
            </div>

            <div class="status-stack">
              <span class="status-pill" :class="getStatusClass(task)">
                {{ getTaskStatusLabel(task) }}
              </span>
              <span class="pill">{{ getExecutionModeLabel(task.executionMode) }}</span>
            </div>
          </div>

          <p class="date-line">{{ getTaskDateText(task) }}</p>

          <div class="meta-row">
            <span class="pill">예상 {{ getDurationText(task.durationMinutes) }}</span>
            <span class="pill">우선도 {{ task.priority }}</span>
            <span class="pill">{{ task.scheduleSource === 'counter' ? '즉시 카운터' : '표준시간' }}</span>
          </div>

          <div class="progress-bar"><span :style="{ width: `${getProgressPercent(task)}%` }" /></div>

          <button type="button" class="danger-button" @click="cancelScheduledTask(task.id)">
            예약 취소
          </button>
        </article>

        <div v-if="upcomingTasks.length <= 0" class="empty">
          예약 또는 진행 중인 업무가 없습니다.
        </div>
      </div>
    </article>
  </section>
</template>

<script setup>
import {
  cancelScheduledTask,
  getDurationText,
  getExecutionModeLabel,
  getProgressPercent,
  getTaskDateText,
  getTaskStatusLabel,
  upcomingTasks,
} from '../stores/terrariaManager'

import { getTaskStatusByTime } from '../modules/time'

const getStatusClass = (task) => {
  return `status-${getTaskStatusByTime(task)}`
}
</script>

<style scoped>
.schedule-card {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.task-main {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.date-line {
  color: #bfdbfe !important;
}

.status-stack {
  display: flex;
  align-items: flex-end;
  flex-direction: column;
  gap: 0.4rem;
}

.status-pill {
  flex: 0 0 auto;
  border-radius: 999px;
  padding: 0.35rem 0.65rem;
  font-size: 0.78rem;
  font-weight: 900;
}

.status-reserved {
  background: rgba(59, 130, 246, 0.18);
  color: #bfdbfe;
}

.status-running {
  background: rgba(34, 197, 94, 0.18);
  color: #bbf7d0;
}

.status-completed {
  background: rgba(148, 163, 184, 0.18);
  color: #e2e8f0;
}
</style>
