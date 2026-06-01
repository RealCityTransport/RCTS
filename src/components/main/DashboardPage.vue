<!--
RCTS FILE CONTEXT
파일 역할:
- 대시보드 화면.
- 회사가 없으면 회사 생성 화면을 보여준다.
- 회사가 있으면 현재 월드 상태와 운행중/자동대기 노선을 보여준다.

수정 사항:
- 운행 메뉴와 같은 routeRuntime 계산을 사용한다.
- 정차시간, 왕복시간, 이동중/정차중 상태를 그대로 반영한다.
- 운행중 노선은 왕복 완료까지 남은 시간이 빠른 순서로 표시한다.
- 자동 재출발 대기 노선도 표시한다.
-->

<template>
  <BaseMainPage
    eyebrow="DASHBOARD"
    title="대시보드"
    description="현재 회사와 운행중인 노선 상태를 확인하는 화면입니다."
    badge="HOME"
  >
    <section v-if="!company" class="start-panel">
      <div>
        <span>START</span>
        <h2>사장님, 어떤 회사를 운영하시겠습니까?</h2>
        <p>
          회사를 생성하면 연구, 저장, 시설, 차량, 운행 메뉴가 순서대로 열립니다.
        </p>
      </div>

      <form class="company-form" @submit.prevent="submitCompany">
        <input
          v-model.trim="companyName"
          type="text"
          maxlength="24"
          placeholder="회사명을 입력하세요"
        />

        <button type="submit">
          회사 생성
        </button>
      </form>
    </section>

    <section v-else class="dashboard-shell">
      <section class="summary-grid">
        <article class="summary-card">
          <span>COMPANY</span>
          <strong>{{ company.name }}</strong>
          <p>현재 운영 중인 회사입니다.</p>
        </article>

        <article class="summary-card">
          <span>FACILITY</span>
          <strong>{{ facilities.length }}개</strong>
          <p>등록된 시설 수입니다.</p>
        </article>

        <article class="summary-card">
          <span>VEHICLE</span>
          <strong>{{ vehicles.length }}대</strong>
          <p>보유 차량 수입니다.</p>
        </article>

        <article class="summary-card">
          <span>ROUTE</span>
          <strong>{{ operationRoutes.length }}개</strong>
          <p>생성된 운행 노선 수입니다.</p>
        </article>
      </section>

      <section class="running-panel">
        <div class="panel-title">
          <div>
            <span>ACTIVE ROUTES</span>
            <h3>운행 현황</h3>
          </div>

          <strong>{{ sortedActiveRoutes.length }}개</strong>
        </div>

        <div v-if="sortedActiveRoutes.length" class="running-list">
          <article
            v-for="route in sortedActiveRoutes"
            :key="route.id"
            class="running-card"
            :class="route.status"
          >
            <div class="running-top">
              <div>
                <span>{{ getRouteStatusLabel(route.status) }}</span>
                <h4>{{ route.name }}</h4>
                <p>{{ getRouteFacilityNames(route).join(' → ') }}</p>
              </div>

              <strong>{{ getPrimaryTimeText(route) }}</strong>
            </div>

            <div class="runtime-grid">
              <div>
                <span>{{ getRuntimeTitle(route) }}</span>
                <strong>{{ getLivePositionText(route) }}</strong>
                <small>{{ getLiveRemainingText(route) }}</small>
              </div>

              <div>
                <span>{{ route.status === 'auto-waiting' ? '자동운행' : '진행률' }}</span>
                <strong>{{ getSecondaryValue(route) }}</strong>
                <small>{{ getSecondaryText(route) }}</small>
              </div>
            </div>
          </article>
        </div>

        <div v-else class="empty-box">
          <strong>현재 운행중인 노선이 없습니다.</strong>
          <span>운행 메뉴에서 노선을 생성하고 차량을 배차한 뒤 운행개시를 누르면 이곳에 표시됩니다.</span>
        </div>
      </section>
    </section>
  </BaseMainPage>
</template>

<script setup>
import { computed, ref } from 'vue'
import BaseMainPage from './BaseMainPage.vue'

import {
  createRouteRuntimeInfo,
  formatTicks,
} from '../../modules/routeRuntime'

const props = defineProps({
  company: {
    type: Object,
    default: null,
  },
  facilities: {
    type: Array,
    default: () => [],
  },
  vehicles: {
    type: Array,
    default: () => [],
  },
  operationRoutes: {
    type: Array,
    default: () => [],
  },
  currentTick: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits(['create-company'])

const companyName = ref('')

const sortedActiveRoutes = computed(() => {
  return props.operationRoutes
    .filter((route) => {
      return route.status === 'running' || route.status === 'auto-waiting'
    })
    .map((route) => {
      return {
        ...route,
        runtime: getRuntimeInfo(route),
        eventRemainingTicks: getRouteEventRemainingTicks(route),
      }
    })
    .sort((a, b) => {
      return a.eventRemainingTicks - b.eventRemainingTicks
    })
})

function submitCompany() {
  if (!companyName.value) {
    return
  }

  emit('create-company', {
    name: companyName.value,
  })

  companyName.value = ''
}

function getRuntimeInfo(route) {
  return createRouteRuntimeInfo(route, props.facilities, props.vehicles, props.currentTick)
}

function getRouteEventRemainingTicks(route) {
  if (route.status === 'auto-waiting') {
    return getAutoDispatchRemainingTicks(route)
  }

  return getRuntimeInfo(route).remainingRoundTripTicks
}

function getAutoDispatchRemainingTicks(route) {
  if (route.nextAutoDispatchAtTick === null || route.nextAutoDispatchAtTick === undefined) {
    return 0
  }

  return Math.max(0, route.nextAutoDispatchAtTick - props.currentTick)
}

function getRouteFacilityNames(route) {
  return route.orderedFacilityIds
    .map((facilityId) => {
      return props.facilities.find((facility) => facility.id === facilityId)?.name
    })
    .filter(Boolean)
}

function getRouteStatusLabel(status) {
  if (status === 'running') {
    return '운행중'
  }

  if (status === 'auto-waiting') {
    return '자동 재출발 대기'
  }

  return '상태 확인'
}

function getPrimaryTimeText(route) {
  if (route.status === 'auto-waiting') {
    return `재출발 ${formatTicks(getAutoDispatchRemainingTicks(route))}`
  }

  return `왕복 ${formatTicks(getRuntimeInfo(route).remainingRoundTripTicks)}`
}

function getRuntimeTitle(route) {
  if (route.status === 'auto-waiting') {
    return '자동 재출발'
  }

  return getRuntimeInfo(route).phaseLabel
}

function getLivePositionText(route) {
  if (route.status === 'auto-waiting') {
    return '대기중'
  }

  const runtime = getRuntimeInfo(route)

  if (runtime.phase === 'dwell') {
    return `${runtime.stoppedFacility?.name || '정류장'} 정차중`
  }

  if (runtime.phase === 'moving') {
    return `${runtime.currentLeg?.from?.name || '-'} → ${runtime.currentLeg?.to?.name || '-'} 이동중`
  }

  return '도착 처리중'
}

function getLiveRemainingText(route) {
  if (route.status === 'auto-waiting') {
    return `${formatTicks(getAutoDispatchRemainingTicks(route))} 뒤 다시 출발`
  }

  const runtime = getRuntimeInfo(route)

  if (runtime.phase === 'dwell') {
    return `정차 ${formatTicks(runtime.remainingCurrentPhaseTicks)} 남음`
  }

  if (runtime.phase === 'moving') {
    return `다음 정류장까지 ${formatTicks(runtime.remainingToNextStopTicks)} 남음`
  }

  return '상태 갱신 대기'
}

function getSecondaryValue(route) {
  if (route.status === 'auto-waiting') {
    return route.autoDispatchEnabled ? 'ON' : 'OFF'
  }

  return `${getRuntimeInfo(route).progressPercent}%`
}

function getSecondaryText(route) {
  if (route.status === 'auto-waiting') {
    return `${route.autoDispatchIntervalSeconds || 0}초 대기 후 출발`
  }

  return '1회 왕복 기준'
}
</script>

<style scoped>
*,
*::before,
*::after {
  box-sizing: border-box;
}

.start-panel,
.dashboard-shell {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.start-panel {
  padding: 24px;
  border: 1px solid #dbe3ef;
  border-radius: 14px;
  background: #ffffff;
}

.start-panel span,
.summary-card span,
.panel-title span,
.running-card span,
.runtime-grid span {
  display: block;
  color: #2563eb;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 1px;
}

.start-panel h2 {
  margin: 8px 0 0;
  color: #111827;
  font-size: 28px;
}

.start-panel p {
  max-width: 680px;
  margin: 10px 0 0;
  color: #64748b;
  line-height: 1.7;
}

.company-form {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 120px;
  gap: 10px;
  margin-top: 10px;
  min-width: 0;
}

.company-form input {
  width: 100%;
  min-width: 0;
  height: 44px;
  padding: 0 12px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  color: #111827;
  font-size: 15px;
  font-weight: 900;
  outline: none;
}

.company-form button {
  height: 44px;
  border: 0;
  border-radius: 10px;
  background: var(--blue);
  color: white;
  font-weight: 900;
  cursor: pointer;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  min-width: 0;
}

.summary-card,
.running-panel {
  min-width: 0;
  padding: 18px;
  border: 1px solid #dbe3ef;
  border-radius: 12px;
  background: #f8fafc;
}

.summary-card strong {
  display: block;
  margin-top: 8px;
  color: #111827;
  font-size: 24px;
}

.summary-card p {
  margin: 7px 0 0;
  color: #64748b;
  font-size: 14px;
}

.panel-title {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 14px;
}

.panel-title h3 {
  margin: 5px 0 0;
  color: #111827;
  font-size: 21px;
}

.panel-title strong {
  flex-shrink: 0;
  color: #334155;
  font-size: 14px;
  font-weight: 900;
}

.running-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.running-card {
  min-width: 0;
  padding: 16px;
  border: 1px solid #93c5fd;
  border-radius: 12px;
  background: #eff6ff;
}

.running-card.auto-waiting {
  border-color: #f59e0b;
  background: #fff7ed;
}

.running-top {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: flex-start;
  gap: 14px;
  min-width: 0;
}

.running-top h4 {
  margin: 6px 0 0;
  color: #111827;
  font-size: 20px;
  word-break: keep-all;
}

.running-top p {
  margin: 7px 0 0;
  color: #64748b;
  font-size: 14px;
  line-height: 1.55;
  word-break: keep-all;
}

.running-top strong {
  flex-shrink: 0;
  color: #1e3a8a;
  font-size: 14px;
  font-weight: 900;
  white-space: nowrap;
}

.runtime-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 14px;
}

.runtime-grid div {
  min-width: 0;
  padding: 12px;
  border-radius: 10px;
  background: white;
}

.runtime-grid strong {
  display: block;
  margin-top: 6px;
  color: #111827;
  font-size: 16px;
  word-break: keep-all;
}

.runtime-grid small {
  display: block;
  margin-top: 5px;
  color: #64748b;
  font-size: 12px;
  font-weight: 900;
}

.empty-box {
  min-height: 96px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
  padding: 18px;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
  background: white;
}

.empty-box strong {
  color: #111827;
  font-size: 17px;
}

.empty-box span {
  color: #64748b;
  font-size: 14px;
  line-height: 1.6;
}

@media (max-width: 1100px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .summary-grid,
  .company-form,
  .runtime-grid,
  .running-top {
    grid-template-columns: 1fr;
  }

  .panel-title {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>