<!--
  파일명: src/views/ProgressView.vue

  역할:
  - 현재 표준시간 기준으로 진행 중인 업무를 관제판처럼 표시합니다.
-->

<template>
  <section class="page">
    <header class="page-title">
      <div>
        <p>PROGRESS BOARD</p>
        <h2>진행현황</h2>
      </div>
    </header>

    <section class="progress-layout">
      <article class="panel main-progress">
        <header class="panel-head">
          <div>
            <p>RUNNING</p>
            <h3>현재 진행 중</h3>
          </div>
        </header>

        <div class="panel-inner list">
          <article v-for="task in runningTasks" :key="task.id" class="running-card">
            <div class="running-head">
              <div>
                <h4>{{ task.projectName }}</h4>
                <p>{{ task.secretaryName }} · {{ task.departmentName }}</p>
              </div>
              <strong>{{ getProgressPercent(task) }}%</strong>
            </div>

            <div class="progress-bar"><span :style="{ width: `${getProgressPercent(task)}%` }" /></div>

            <div class="meta-row">
              <span class="pill">{{ getExecutionModeLabel(task.executionMode) }}</span>
              <span class="pill">{{ getTaskDateText(task) }}</span>
              <span class="pill">종료까지 {{ getRemainingText(task.endAt) }}</span>
            </div>
          </article>

          <div v-if="runningTasks.length <= 0" class="empty">
            현재 진행 중인 업무가 없습니다.
          </div>
        </div>
      </article>

      <article class="panel side-progress">
        <header class="panel-head">
          <div>
            <p>NEXT</p>
            <h3>다음 예정</h3>
          </div>
        </header>

        <div class="panel-inner list">
          <article v-for="task in nextTasks" :key="task.id" class="item-card">
            <h4>{{ task.projectName }}</h4>
            <p>{{ task.secretaryName }} · {{ getExecutionModeLabel(task.executionMode) }} · {{ getRemainingText(task.startAt) }} 후 시작</p>
          </article>

          <div v-if="nextTasks.length <= 0" class="empty">
            다음 예정 업무가 없습니다.
          </div>
        </div>
      </article>
    </section>
  </section>
</template>

<script setup>
import { computed } from 'vue'

import { getRemainingText, getTaskStatusByTime } from '../modules/time'
import {
  getExecutionModeLabel,
  getProgressPercent,
  getTaskDateText,
  runningTasks,
  upcomingTasks,
} from '../stores/terrariaManager'

const nextTasks = computed(() => {
  return upcomingTasks.value
    .filter((task) => getTaskStatusByTime(task) === 'reserved')
    .slice(0, 5)
})
</script>

<style scoped>
.progress-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(320px, 0.55fr);
  gap: 1rem;
}

.running-card {
  padding: 1.1rem;
  border: 1px solid rgba(56, 189, 248, 0.28);
  border-radius: 1.2rem;
  background: rgba(14, 165, 233, 0.1);
}

.running-head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.running-head h4 {
  margin: 0 0 0.35rem;
  font-size: 1.2rem;
}

.running-head p {
  margin: 0;
  color: #bae6fd;
}

.running-head strong {
  font-size: 2rem;
  color: #7dd3fc;
}

@media (max-width: 920px) {
  .progress-layout {
    grid-template-columns: 1fr;
  }
}
</style>
