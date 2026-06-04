<!--
  파일 주소:
  src/views/Home.vue

  적용 내용:
  - RCTS 대시보드 메인 화면
  - 버스 모듈의 운행중 슬롯 데이터를 대시보드에 표시
  - 운행중인 버스는 남은 시간이 적은 순서대로 정렬
  - 차량명, 노선, 상태, 진행률, 다음 정류장 남은 시간, 전체 남은 시간, 최근 정산 표시
  - 운행 중 예약 변경이 있으면 예약 표시
  - 버스 운영 센터로 이동하는 안내 카드 포함

  연결된 파일:
  - src/router/index.js
  - src/modules/bus.js
  - src/modules/finance.js
  - src/modules/gameState.js
  - src/App.vue
  - src/views/BusView.vue

  수정 시 주의:
  - 대시보드는 읽기 전용
  - 운행 시작/수정/판매는 BusView.vue에서 처리
  - 버스 운행 데이터는 src/modules/bus.js의 busSlots를 기준으로 표시
-->

<template>
  <main class="dashboard-page">
    <section class="dashboard-hero panel">
      <div>
        <p>DASHBOARD</p>
        <h1>운송 관리 대시보드</h1>
        <span>
          현재 운행 중인 차량과 정산 흐름을 한눈에 확인합니다.
          운행 조작은 각 운송수단 메뉴에서 처리합니다.
        </span>
      </div>

      <div class="hero-summary">
        <article>
          <span>운행중 버스</span>
          <strong>{{ runningBusCards.length }}대</strong>
        </article>

        <article>
          <span>가장 가까운 도착</span>
          <strong>{{ nearestBusRemainingText }}</strong>
        </article>

        <article>
          <span>예상 시간당 수익</span>
          <strong>{{ formatMoney(safeBusSummary.hourlyRevenue) }}</strong>
        </article>
      </div>
    </section>

    <section class="kpi-grid">
      <article class="kpi-card highlight">
        <span>버스 운행중</span>
        <strong>{{ safeBusSummary.runningSlots }} / {{ safeBusSummary.totalSlots }}</strong>
        <small>현재 출발한 버스 슬롯</small>
      </article>

      <article class="kpi-card">
        <span>버스 대기중</span>
        <strong>{{ safeBusSummary.waitingSlots }}대</strong>
        <small>수동 출발 대기 차량</small>
      </article>

      <article class="kpi-card">
        <span>변경 예약</span>
        <strong>{{ safeBusSummary.pendingSlots }}대</strong>
        <small>귀환 후 적용 예정</small>
      </article>

      <article class="kpi-card income">
        <span>버스 예상 수익</span>
        <strong>{{ formatMoney(safeBusSummary.hourlyRevenue) }}/h</strong>
        <small>현재 배정 기준</small>
      </article>
    </section>

    <section class="panel running-panel">
      <div class="section-head">
        <div>
          <p>BUS RUNNING</p>
          <h2>운행중인 버스</h2>
        </div>

        <span class="head-note">남은 시간이 적은 차량이 맨 위에 표시됩니다.</span>
      </div>

      <div v-if="runningBusCards.length > 0" class="running-list">
        <article
          v-for="bus in runningBusCards"
          :key="bus.id"
          class="running-card"
          :class="{ pending: bus.hasPending }"
        >
          <div class="bus-main">
            <small>{{ bus.id }} · {{ bus.categoryLabel }}</small>
            <strong>{{ bus.vehicle }}</strong>
            <span>{{ bus.route }}</span>
          </div>

          <div class="bus-status">
            <small>{{ bus.statusText }}</small>
            <strong>{{ bus.remaining }}</strong>
            <span>다음 정류장 {{ bus.nextStopText }}</span>
          </div>

          <div class="bus-progress">
            <div class="progress-info">
              <span>{{ bus.progress }}%</span>
              <span>{{ bus.operationModeText }}</span>
            </div>

            <div class="progress-bar">
              <div :style="{ width: `${bus.progress}%` }"></div>
            </div>

            <small>{{ bus.lastStopLabel || '정류장 정산 대기' }}</small>
          </div>

          <div class="bus-settlement">
            <small>최근 승차 {{ bus.lastPassengerCount }}명</small>
            <strong>{{ formatMoney(bus.lastSettlementAmount) }}</strong>
            <span v-if="bus.hasPending">변경 예약 있음</span>
            <span v-else>예약 변경 없음</span>
          </div>
        </article>
      </div>

      <div v-else class="empty-card">
        <strong>운행중인 버스가 없습니다.</strong>
        <span>Bus 메뉴에서 차량을 출발시키면 이곳에 표시됩니다.</span>
      </div>
    </section>

    <section class="bottom-grid">
      <section class="panel summary-panel">
        <div class="section-head compact">
          <div>
            <p>RECENT SETTLEMENT</p>
            <h2>최근 버스 정산</h2>
          </div>
        </div>

        <ul class="settlement-list">
          <li
            v-for="item in recentBusSettlements"
            :key="item.id"
          >
            <div>
              <strong>{{ item.title }}</strong>
              <span>{{ item.detail }}</span>
            </div>

            <b>+{{ formatMoney(item.amount) }}</b>
          </li>

          <li v-if="recentBusSettlements.length === 0">
            <div>
              <strong>정산 대기중</strong>
              <span>운행 중인 버스가 정류장에 도착하면 정산됩니다.</span>
            </div>

            <b>0R</b>
          </li>
        </ul>
      </section>

      <section class="panel summary-panel">
        <div class="section-head compact">
          <div>
            <p>OPERATION NOTE</p>
            <h2>운영 메모</h2>
          </div>
        </div>

        <div class="note-list">
          <article>
            <strong>정렬 기준</strong>
            <span>운행중인 차량 중 전체 남은 시간이 적은 순서로 표시됩니다.</span>
          </article>

          <article>
            <strong>수정 처리</strong>
            <span>운행 중 수정/판매는 예약 후 왕복 완료 시 적용됩니다.</span>
          </article>

          <article>
            <strong>정산 처리</strong>
            <span>왕복 완료가 아니라 정류장 출발/도착마다 승객 수익이 발생합니다.</span>
          </article>
        </div>
      </section>
    </section>
  </main>
</template>

<script setup>
import { computed } from 'vue'
import {
  busSlots,
  busSummary,
  getBusVehicle
} from '../modules/bus'
import { formatMoney } from '../modules/finance'

const safeBusSummary = computed(() => {
  const summary = busSummary.value ?? {}

  return {
    runningSlots: safeNumber(summary.runningSlots),
    waitingSlots: safeNumber(summary.waitingSlots),
    pendingSlots: safeNumber(summary.pendingSlots),
    totalSlots: safeNumber(summary.totalSlots),
    hourlyRevenue: safeNumber(summary.hourlyRevenue),
    recentBusSettlements: Array.isArray(summary.recentBusSettlements)
      ? summary.recentBusSettlements
      : []
  }
})

const runningBusCards = computed(() => {
  const list = Array.isArray(busSlots.value) ? busSlots.value : []

  return list
    .filter((slot) => slot.status === 'running')
    .map((slot) => {
      const vehicle = getBusVehicle(slot.vehicleId)

      return {
        id: slot.id ?? 'BUS-000',
        vehicle: slot.vehicle ?? vehicle?.name ?? '버스',
        categoryLabel: vehicle?.categoryLabel ?? '버스',
        route: slot.route ?? '미배정',
        statusText: slot.statusText ?? '운행중',
        operationMode: slot.operationMode ?? 'manual',
        operationModeText: slot.operationMode === 'auto' ? '자동운행' : '수동운행',
        progress: clamp(safeNumber(slot.progress), 0, 100),
        remainingSeconds: safeNumber(slot.remainingSeconds),
        remaining: slot.remaining ?? formatDuration(safeNumber(slot.remainingSeconds)),
        nextStopText: slot.nextStopText ?? '-',
        lastStopLabel: slot.lastStopLabel ?? '',
        lastPassengerCount: safeNumber(slot.lastPassengerCount),
        lastSettlementAmount: safeNumber(slot.lastSettlementAmount),
        hasPending: hasPendingChanges(slot)
      }
    })
    .sort((a, b) => {
      if (a.remainingSeconds !== b.remainingSeconds) {
        return a.remainingSeconds - b.remainingSeconds
      }

      return a.id.localeCompare(b.id)
    })
})

const nearestBusRemainingText = computed(() => {
  if (runningBusCards.value.length === 0) {
    return '없음'
  }

  return runningBusCards.value[0].remaining
})

const recentBusSettlements = computed(() => {
  return safeBusSummary.value.recentBusSettlements.map((item) => ({
    id: item.id ?? `settlement-${Math.random()}`,
    title: item.title ?? '버스 정산',
    detail: item.detail ?? '정산 정보 없음',
    amount: safeNumber(item.amount)
  }))
})

function hasPendingChanges(slot) {
  const pending = slot?.pendingChanges

  if (!pending) {
    return false
  }

  return Boolean(
    pending.vehicleName ||
    pending.routeId ||
    pending.routeNumber ||
    pending.routeName ||
    pending.operationMode ||
    pending.sellAfterReturn
  )
}

function safeNumber(value) {
  const number = Number(value)

  if (!Number.isFinite(number)) {
    return 0
  }

  return Math.floor(number)
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function formatDuration(totalSeconds) {
  const seconds = Math.max(0, safeNumber(totalSeconds))

  if (seconds <= 0) {
    return '0초'
  }

  if (seconds < 60) {
    return `${seconds}초`
  }

  const minutes = Math.floor(seconds / 60)
  const remainSeconds = seconds % 60

  if (minutes < 60) {
    return remainSeconds > 0
      ? `${minutes}분 ${remainSeconds}초`
      : `${minutes}분`
  }

  const hours = Math.floor(minutes / 60)
  const remainMinutes = minutes % 60

  return remainMinutes > 0
    ? `${hours}시간 ${remainMinutes}분`
    : `${hours}시간`
}
</script>

<style scoped>
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
}

.panel {
  border: 1px solid rgba(120, 190, 255, 0.16);
  border-radius: 16px;
  background: rgba(8, 20, 34, 0.78);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.24);
}

.dashboard-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 460px;
  gap: 14px;
  padding: 16px;
}

.dashboard-hero p,
.section-head p {
  margin: 0 0 6px;
  color: #4bcaff;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.15em;
}

.dashboard-hero h1 {
  margin: 0 0 6px;
  font-size: 30px;
}

.dashboard-hero span {
  color: #a8bacb;
  line-height: 1.45;
}

.hero-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.hero-summary article {
  display: flex;
  min-width: 0;
  flex-direction: column;
  justify-content: center;
  padding: 12px;
  border: 1px solid rgba(80, 205, 255, 0.16);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.035);
}

.hero-summary span {
  color: #8fa2b5;
  font-size: 11px;
}

.hero-summary strong {
  overflow: hidden;
  margin-top: 6px;
  color: #eaf4ff;
  font-size: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.kpi-card {
  padding: 13px;
  border: 1px solid rgba(120, 190, 255, 0.12);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.035);
}

.kpi-card.highlight {
  border-color: rgba(229, 211, 90, 0.22);
  background: rgba(229, 211, 90, 0.065);
}

.kpi-card.income {
  border-color: rgba(117, 237, 130, 0.18);
  background: rgba(117, 237, 130, 0.055);
}

.kpi-card span {
  display: block;
  color: #8ea2b4;
  font-size: 12px;
}

.kpi-card strong {
  display: block;
  margin-top: 5px;
  font-size: 20px;
}

.kpi-card.highlight strong {
  color: #e5d35a;
}

.kpi-card.income strong {
  color: #75ed82;
}

.kpi-card small {
  display: block;
  margin-top: 4px;
  color: #6f8294;
  font-size: 11px;
}

.running-panel,
.summary-panel {
  padding: 14px;
}

.section-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
}

.section-head.compact {
  margin-bottom: 10px;
}

.section-head h2 {
  margin: 0;
  font-size: 18px;
}

.head-note {
  color: #8fa2b5;
  font-size: 12px;
}

.running-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.running-card {
  display: grid;
  grid-template-columns:
    minmax(170px, 1.1fr)
    minmax(150px, 0.9fr)
    minmax(230px, 1.4fr)
    minmax(130px, 0.8fr);
  gap: 12px;
  align-items: center;
  min-height: 84px;
  padding: 12px;
  border: 1px solid rgba(120, 190, 255, 0.12);
  border-left: 4px solid #45b7ff;
  border-radius: 14px;
  background:
    linear-gradient(90deg, rgba(69, 183, 255, 0.06), transparent 42%),
    rgba(255, 255, 255, 0.035);
}

.running-card.pending {
  border-right: 4px solid #ffbf62;
}

.bus-main,
.bus-status,
.bus-progress,
.bus-settlement {
  min-width: 0;
}

.bus-main small,
.bus-status small,
.bus-progress small,
.bus-settlement small {
  display: block;
  margin-bottom: 4px;
  color: #8fa2b5;
  font-size: 12px;
}

.bus-main strong,
.bus-status strong,
.bus-settlement strong {
  display: block;
  overflow: hidden;
  color: #eaf4ff;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bus-main span,
.bus-status span,
.bus-settlement span {
  display: block;
  margin-top: 4px;
  color: #9cafc1;
  font-size: 12px;
}

.bus-status strong {
  color: #e5d35a;
  font-size: 18px;
}

.bus-settlement strong {
  color: #75ed82;
  font-size: 18px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  color: #a7bacb;
  font-size: 12px;
}

.progress-bar {
  height: 9px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
}

.progress-bar div {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #45b7ff, rgba(255, 255, 255, 0.82));
}

.empty-card {
  padding: 18px;
  border: 1px dashed rgba(120, 190, 255, 0.24);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.025);
}

.empty-card strong {
  display: block;
  color: #eaf4ff;
}

.empty-card span {
  display: block;
  margin-top: 6px;
  color: #8fa2b5;
  font-size: 13px;
}

.bottom-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.settlement-list {
  padding: 0;
  margin: 0;
  list-style: none;
}

.settlement-list li {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
}

.settlement-list li:last-child {
  border-bottom: 0;
}

.settlement-list strong {
  display: block;
  color: #eaf4ff;
}

.settlement-list span {
  display: block;
  margin-top: 4px;
  color: #8fa2b5;
  font-size: 12px;
}

.settlement-list b {
  color: #75ed82;
  white-space: nowrap;
}

.note-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.note-list article {
  padding: 12px;
  border-radius: 13px;
  background: rgba(255, 255, 255, 0.035);
}

.note-list strong {
  display: block;
  color: #eaf4ff;
}

.note-list span {
  display: block;
  margin-top: 4px;
  color: #8fa2b5;
  font-size: 12px;
  line-height: 1.45;
}

@media (max-width: 1250px) {
  .dashboard-hero,
  .bottom-grid {
    grid-template-columns: 1fr;
  }

  .running-card {
    grid-template-columns: 1fr 1fr;
  }

  .bus-progress {
    grid-column: 1 / -1;
  }
}

@media (max-width: 840px) {
  .dashboard-page {
    padding: 10px;
  }

  .dashboard-hero,
  .hero-summary,
  .kpi-grid,
  .running-card {
    grid-template-columns: 1fr;
  }

  .dashboard-hero h1 {
    font-size: 26px;
  }

  .section-head {
    align-items: flex-start;
    flex-direction: column;
  }

  .bus-progress {
    grid-column: auto;
  }
}
</style>