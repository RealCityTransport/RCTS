<!--
  파일명: src/views/ReportsView.vue

  역할:
  - 표준시간에 따라 완료된 업무 보고서를 보여줍니다.
-->

<template>
  <section class="page">
    <header class="page-title">
      <div>
        <p>REPORT ARCHIVE</p>
        <h2>보고서</h2>
      </div>
      <span>완료된 업무는 완료 보고로 남습니다. 보상이나 완료 수량이 아니라 기록 중심입니다.</span>
    </header>

    <article class="panel">
      <header class="panel-head">
        <div>
          <p>COMPLETED REPORTS</p>
          <h3>완료 보고 기록</h3>
        </div>
        <span class="pill">최근 {{ terrariaState.completedReports.length }}건</span>
      </header>

      <div class="panel-inner list">
        <article v-for="report in terrariaState.completedReports" :key="report.id" class="item-card">
          <h4>{{ report.projectName }}</h4>
          <p>{{ report.secretaryName }} 비서가 완료를 보고했습니다.</p>
          <div class="meta-row">
            <span class="pill">{{ report.departmentName }}</span>
            <span class="pill">{{ formatDateTime(report.completedAt) }}</span>
          </div>
        </article>

        <div v-if="terrariaState.completedReports.length <= 0" class="empty">
          완료 보고가 아직 없습니다. 예약된 업무가 종료되면 자동으로 기록됩니다.
        </div>
      </div>
    </article>
  </section>
</template>

<script setup>
import { formatDateTime } from '../modules/time'
import { recordCompletedTasks, terrariaState } from '../stores/terrariaManager'

recordCompletedTasks()
</script>
