<template>
  <div class="game-shell">
    <header class="app-header">
      <div class="brand-block">
        <strong>RCTS</strong>
        <span>Transport Idle Operation</span>
      </div>

      <div class="top-scroll-strip">
        <nav class="top-mode-nav" aria-label="교통수단 메뉴">
          <button
            v-for="mode in transportModes"
            :key="mode.id"
            class="top-mode-button"
            :class="{ active: selectedMode === mode.id }"
            type="button"
            @click="selectMode(mode.id)"
          >
            <span>{{ mode.icon }}</span>
            <b>{{ mode.name }}</b>
            <small v-if="mode.id !== 'bus'">준비중</small>
          </button>
        </nav>

        <div class="header-status-bar" aria-label="상단 상태 정보">
          <div class="header-money">
            <span>보유자금</span>
            <strong>{{ formatMoney(gameState.money) }}</strong>
          </div>
          <div class="header-clock">
            <span>표준시간</span>
            <strong>{{ standardClock }}</strong>
          </div>
        </div>
      </div>
    </header>

    <main class="main-area">
      <section v-if="selectedMode === 'bus'" class="bus-layout">
        <section class="panel bus-shop-panel">
          <div class="section-title-row">
            <div>
              <p class="eyebrow">Vehicle Shop</p>
              <h1>버스 구입</h1>
            </div>
            <span class="pill">차량을 사면 운행 슬롯이 1개 추가됩니다</span>
          </div>

          <div class="shop-list">
            <article v-for="item in busCatalog" :key="item.id" class="shop-card">
              <div>
                <strong>{{ item.name }}</strong>
                <span>정원 {{ item.capacity }}명 · 가능 노선: {{ item.allowedRoutesText }}</span>
                <b>{{ formatMoney(item.price) }}</b>
              </div>
              <button type="button" :disabled="!canAfford(item.price)" @click="purchaseVehicle(item)">
                {{ canAfford(item.price) ? '구입' : '자금 부족' }}
              </button>
            </article>
          </div>
        </section>

        <section class="panel bus-main-panel">
          <div class="section-title-row">
            <div>
              <p class="eyebrow">Bus Operation Slots</p>
              <h1>버스 운행 슬롯</h1>
            </div>
            <span class="pill">운행 중/출발 대기 슬롯은 남은 시간 빠른 순서로 정렬</span>
          </div>

          <div class="bus-summary-grid">
            <article>
              <span>보유 버스</span>
              <strong>{{ busOwnedVehicles.length }}대</strong>
            </article>
            <article>
              <span>운행 중</span>
              <strong>{{ runningBusSlots.length }}개</strong>
            </article>
            <article>
              <span>출발 대기</span>
              <strong>{{ waitingBusSlots.length }}개</strong>
            </article>
            <article>
              <span>버스 누적 수익</span>
              <strong>{{ formatMoney(gameState.busEarned) }}</strong>
            </article>
          </div>

          <div v-if="busOwnedVehicles.length === 0" class="empty-state large-empty">
            <strong>아직 운행 슬롯이 없습니다.</strong>
            <span>버스를 구입하면 차량 1대당 슬롯 1개가 자동으로 생성됩니다.</span>
          </div>

          <div v-else class="slot-list">
            <article
              v-for="slot in sortedBusSlots"
              :key="slot.vehicleId"
              class="slot-card"
              :class="{ running: slot.status === 'running', waiting: slot.status === 'waiting' }"
            >
              <div class="slot-compact-row">
                <div class="slot-main-info">
                  <p class="slot-label">{{ slot.vehicleName }} · {{ vehicleTypeLabel(slot.vehicleCatalogId) }} · 정원 {{ slot.capacity }}명</p>
                  <h3>{{ slot.routeName || '노선 미설정' }}</h3>
                  <p class="slot-line">{{ slotOperationText(slot) }}</p>
                </div>

                <div class="slot-compact-status">
                  <strong class="slot-timer">{{ slotTimerLabel(slot) }}</strong>
                  <div class="slot-inline-meta">
                    <span>{{ slotStatusLabel(slot) }}</span>
                    <span v-if="slot.routeId && isStopBasedRoute(slot.routeId)">이번 {{ formatMoney(slot.routeRevenue) }}</span>
                    <span v-else-if="slot.expectedRevenue">예상 {{ formatMoney(slot.expectedRevenue) }}</span>
                    <span v-if="slot.lastStopRevenue">최근 +{{ formatMoney(slot.lastStopRevenue) }}</span>
                    <span v-if="slot.nextRouteName">예약 {{ slot.nextRouteName }}</span>
                    <span v-else-if="slot.routeId && slot.status === 'running'">노선 유지</span>
                    <span v-if="slot.pendingSale" class="danger-text">자동판매 예약</span>
                  </div>
                </div>

                <div class="slot-quick-actions">
                  <button
                    v-if="slot.status === 'waiting'"
                    type="button"
                    class="mini-action start-button"
                    :disabled="isNextDayStartWaiting(slot)"
                    @click="startWaitingBusSlotNow(slot)"
                  >
                    {{ isNextDayStartWaiting(slot) ? '시간대기' : '즉시출발' }}
                  </button>
                  <button
                    v-if="slot.status === 'running'"
                    type="button"
                    class="mini-action danger-button ghost-danger"
                    @click="toggleAutoSellAfterRun(slot)"
                  >
                    {{ slot.pendingSale ? '판매취소' : '완료후판매' }}
                  </button>
                  <button v-else type="button" class="mini-action danger-button" @click="sellBusVehicle(slot)">
                    매각 50%
                  </button>

                  <details class="slot-route-picker">
                    <summary>노선</summary>
                    <div class="route-button-grid compact-route-grid">
                      <button
                        v-for="route in availableRoutesForSlot(slot)"
                        :key="route.id"
                        type="button"
                        @click="reserveBusSlot(slot, route)"
                      >
                        <b>{{ routeButtonTitle(slot, route) }}</b>
                        <small>{{ route.short }}</small>
                      </button>
                      <p v-if="availableRoutesForSlot(slot).length === 0" class="slot-warning">
                        예약 가능한 노선 없음
                      </p>
                    </div>
                  </details>
                </div>
              </div>

              <div v-if="slot.status === 'running' || slot.status === 'waiting'" class="slot-progress compact-progress">
                <div>
                  <span :style="{ width: `${slotProgress(slot)}%` }"></span>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section class="panel route-rules-panel">
          <div class="section-title-row">
            <div>
              <p class="eyebrow">Bus Route Rules</p>
              <h2>버스 노선 기준</h2>
            </div>
            <span class="pill">마을·시내·광역은 반복 운행 / 전세·통근은 완료 후 재설정</span>
          </div>

          <div class="route-rule-grid">
            <article v-for="route in busRoutes" :key="route.id">
              <strong>{{ route.name }}</strong>
              <p>{{ route.description }}</p>
              <ul>
                <li>수익: {{ route.fixedRevenue ? formatMoney(route.fixedRevenue) : `${formatMoney(route.fare)} × 승차인원` }}</li>
                <li>정류장: {{ route.stopsText }}</li>
                <li>차량: {{ route.allowedVehicleNames }}</li>
                <li>운행 시간: {{ route.durationLabel || formatDuration(route.durationSeconds) }}</li>
              </ul>
            </article>
          </div>
        </section>
      </section>

      <section v-else class="panel mode-placeholder preparing-mode">
        <div class="section-title-row">
          <div>
            <p class="eyebrow">{{ currentMode.name }} Mode</p>
            <h1>{{ currentMode.icon }} {{ currentMode.name }} 준비중</h1>
          </div>
          <span class="pill">추후 교통 모듈로 추가 예정</span>
        </div>
        <p>
          {{ currentMode.name }}은 현재 준비중입니다. 메뉴는 열어두지만, 실제 운행 슬롯과 차량 구매는 버스부터 먼저 세팅합니다.
        </p>
      </section>

      <section class="panel log-panel">
        <div class="section-title-row">
          <div>
            <p class="eyebrow">Activity</p>
            <h2>최근 활동</h2>
          </div>
          <button class="text-button" type="button" @click="clearLogs">정리</button>
        </div>

        <div class="activity-log">
          <p v-for="log in activityLogs" :key="log.id">
            <span>{{ log.time }}</span>
            <b>{{ log.icon }}</b>
            <em>{{ log.text }}</em>
          </p>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { loadRctsAutoSave, saveRctsAutoSave } from './storage/rctsSaveStorage.js'

const LARGE_BUS_PRICE = 350_000_000
const START_MONEY = LARGE_BUS_PRICE
const BUS_STOP_DISTANCE_KM = 1
const BUS_SPEED_KMH = 50
const BUS_DWELL_SECONDS = 10
const NORMAL_ROUTE_WAIT_SECONDS = 600
const CHARTER_COMMUTE_REVENUE = 300_000
const CHARTER_BUS_DAILY_REVENUE = 500_000

const selectedMode = ref('bus')
const standardNow = ref(new Date())
const ownedVehicles = ref([])
const busSlots = ref([])
const activityLogs = ref([])

const saveMeta = reactive({
  loaded: false,
  saving: false,
  lastSavedAt: null,
  status: '준비 중',
  error: '',
})

const gameState = reactive({
  money: START_MONEY,
  totalSpent: 0,
  totalEarned: 0,
  busEarned: 0,
})

let standardTimer = null
let autoSaveTimer = null
let saveDebounceTimer = null

const weekdayLabels = ['일', '월', '화', '수', '목', '금', '토']

const transportModes = [
  { id: 'bus', name: '버스', icon: '🚌', description: '초반 방치 운행' },
  { id: 'rail', name: '철도', icon: '🚆', description: '대량 수송' },
  { id: 'air', name: '항공', icon: '✈️', description: '장거리 운송' },
  { id: 'ship', name: '선박', icon: '🚢', description: '항만 운송' },
  { id: 'space', name: '우주선', icon: '🚀', description: '최종 확장' },
]

const busCatalog = [
  { id: 'bus-small', mode: 'bus', name: '소형 버스', price: 90_000_000, capacity: 25, boardingPerStop: 7, allowedRoutes: ['village'], allowedRoutesText: '마을' },
  { id: 'bus-medium', mode: 'bus', name: '중형 버스', price: 130_000_000, capacity: 35, boardingPerStop: 10, allowedRoutes: ['village', 'city'], allowedRoutesText: '마을 · 시내' },
  { id: 'bus-large', mode: 'bus', name: '대형 버스', price: LARGE_BUS_PRICE, capacity: 70, boardingPerStop: 16, allowedRoutes: ['village', 'city', 'regional', 'commuter', 'charter'], allowedRoutesText: '마을 · 시내 · 광역 · 전세' },
  { id: 'bus-articulated', mode: 'bus', name: '굴절버스', price: 750_000_000, capacity: 110, boardingPerStop: 24, allowedRoutes: ['city'], allowedRoutesText: '시내' },
  { id: 'bus-double-decker', mode: 'bus', name: '2층버스', price: 900_000_000, capacity: 90, boardingPerStop: 20, allowedRoutes: ['regional'], allowedRoutesText: '광역' },
]

const busRoutes = computed(() => [
  {
    id: 'village',
    name: '마을버스 노선',
    short: '1,200R · 20정류장 · 반복',
    fare: 1_200,
    stopCount: 20,
    stopsText: '20개',
    durationSeconds: stopRouteDuration(20),
    allowedVehicleIds: ['bus-small', 'bus-medium', 'bus-large'],
    allowedVehicleNames: '소형 · 중형 · 대형',
    repeatAfterComplete: true,
    description: '1km, 50km/h, 정류장 정차 10초 기준. 정류장별 승차인원 × 1,200R로 정산합니다.',
  },
  {
    id: 'city',
    name: '시내버스 노선',
    short: '1,500R · 40정류장 · 반복',
    fare: 1_500,
    stopCount: 40,
    stopsText: '40개',
    durationSeconds: stopRouteDuration(40),
    allowedVehicleIds: ['bus-medium', 'bus-large', 'bus-articulated'],
    allowedVehicleNames: '중형 · 대형 · 굴절',
    repeatAfterComplete: true,
    description: '정류장 수가 많은 기본 수익 노선입니다. 정류장별 승차인원 × 1,500R로 정산합니다.',
  },
  {
    id: 'regional',
    name: '광역버스 노선',
    short: '3,000R · 출발5/도착5 · 반복',
    fare: 3_000,
    stopCount: 10,
    stopsText: '10개: 출발지 5 · 도착지 5',
    durationSeconds: 3600 + (10 * BUS_DWELL_SECONDS),
    durationLabel: '약 1시간',
    allowedVehicleIds: ['bus-large', 'bus-double-decker'],
    allowedVehicleNames: '대형 · 2층',
    repeatAfterComplete: true,
    regional: true,
    description: '100km/h 고속도로 주행 연출. 출발지 5개, 도착지 5개 정류장을 기준으로 정산합니다.',
  },
  {
    id: 'commuter',
    name: '전세통근버스',
    short: '월~금 · 오전/오후 · 다음날 시작',
    fare: 0,
    fixedRevenue: CHARTER_COMMUTE_REVENUE,
    stopCount: 0,
    stopsText: '인원 무시',
    durationSeconds: 86400,
    durationLabel: '1일 단위 정산',
    allowedVehicleIds: ['bus-large'],
    allowedVehicleNames: '대형',
    nextDayStart: true,
    description: '월~금 오전 6~10시, 오후 17~21시 적용. 하루 운행 정산 후 노선 변경이 가능합니다.',
  },
  {
    id: 'charter',
    name: '전세버스',
    short: '1~3일 랜덤 · 다음날 시작',
    fare: 0,
    fixedRevenue: CHARTER_BUS_DAILY_REVENUE,
    stopCount: 0,
    stopsText: '인원 무시',
    durationSeconds: 86400,
    durationLabel: '1~3일 랜덤',
    allowedVehicleIds: ['bus-large'],
    allowedVehicleNames: '대형',
    randomDays: true,
    nextDayStart: true,
    description: '1~3일 랜덤 운행. 최종 운행 완료 후 다시 예약할 수 있습니다.',
  },
])

const currentMode = computed(() => transportModes.find((mode) => mode.id === selectedMode.value) ?? transportModes[0])
const busOwnedVehicles = computed(() => ownedVehicles.value.filter((vehicle) => vehicle.mode === 'bus'))
const runningBusSlots = computed(() => busSlots.value.filter((slot) => slot.status === 'running'))
const waitingBusSlots = computed(() => busSlots.value.filter((slot) => slot.status === 'waiting'))
const sortedBusSlots = computed(() => {
  return [...busSlots.value].sort((a, b) => {
    const aActive = a.status === 'running' || a.status === 'waiting'
    const bActive = b.status === 'running' || b.status === 'waiting'
    if (aActive && !bActive) return -1
    if (!aActive && bActive) return 1
    if (aActive && bActive) return Number(a.remainingSeconds || 0) - Number(b.remainingSeconds || 0)
    return String(a.vehiclePurchasedAt || '').localeCompare(String(b.vehiclePurchasedAt || ''))
  })
})
const standardClock = computed(() => formatStandardClock(standardNow.value))
const standardWeekday = computed(() => weekdayLabels[standardNow.value.getDay()])

onMounted(async () => {
  await restoreAutoSave()
  syncSlotsWithOwnedVehicles()
  syncStandardTime()
  scheduleStandardTick()
  addLog('시스템', '버스 슬롯형 운행 화면을 불러왔습니다.', '▣')
  startAutoSave()
  window.addEventListener('beforeunload', handleBeforeUnload)
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onBeforeUnmount(() => {
  if (standardTimer) window.clearTimeout(standardTimer)
  if (autoSaveTimer) window.clearInterval(autoSaveTimer)
  if (saveDebounceTimer) window.clearTimeout(saveDebounceTimer)
  window.removeEventListener('beforeunload', handleBeforeUnload)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})

watch(ownedVehicles, () => syncSlotsWithOwnedVehicles(), { deep: true })

function selectMode(modeId) {
  selectedMode.value = modeId
}

function syncStandardTime() {
  standardNow.value = new Date()
  tickBusSlots()
}

function scheduleStandardTick() {
  syncStandardTime()
  const now = new Date()
  const delay = 1000 - now.getMilliseconds()
  standardTimer = window.setTimeout(scheduleStandardTick, delay)
}

function tickBusSlots() {
  const completedSlots = []
  const readySlots = []

  busSlots.value = busSlots.value.map((slot) => {
    if (slot.status !== 'running' && slot.status !== 'waiting') return slot

    const nextRemaining = Math.max(0, Number(slot.remainingSeconds || 0) - 1)
    let updated = { ...slot, remainingSeconds: nextRemaining }

    if (updated.status === 'running') {
      updated = settleStopRevenueIfNeeded(updated)
    }

    if (nextRemaining <= 0) {
      if (slot.status === 'running') completedSlots.push(updated)
      if (slot.status === 'waiting') readySlots.push(updated)
    }
    return updated
  })

  completedSlots.forEach(completeBusSlot)
  readySlots.forEach(beginReservedBusSlot)
}

function completeBusSlot(slot) {
  const route = getBusRoute(slot.routeId)
  const isStopRoute = Boolean(route && isStopBasedRoute(route.id))
  const revenue = isStopRoute ? 0 : Number(slot.expectedRevenue || 0)

  if (revenue > 0) {
    gameState.money += revenue
    gameState.totalEarned += revenue
    gameState.busEarned += revenue
  }

  if (slot.pendingSale) {
    const refund = Math.round(Number(slot.purchasePrice || 0) * 0.5)
    gameState.money += refund
    ownedVehicles.value = ownedVehicles.value.filter((vehicle) => vehicle.id !== slot.vehicleId)
    busSlots.value = busSlots.value.filter((item) => item.vehicleId !== slot.vehicleId)
    addLog('자동판매', `${slot.vehicleName} 운행 완료 후 자동판매 · +${formatMoney(refund)}`, '↩')
    return
  }

  const nextRouteId = slot.nextRouteId || (route?.repeatAfterComplete ? route.id : null)
  const nextRoute = nextRouteId ? getBusRoute(nextRouteId) : null

  busSlots.value = busSlots.value.map((item) => {
    if (item.vehicleId !== slot.vehicleId) return item

    if (nextRoute) {
      const waitSeconds = nextRoute.nextDayStart ? secondsUntilNextDayStart(nextRoute) : NORMAL_ROUTE_WAIT_SECONDS
      return {
        ...item,
        status: 'waiting',
        routeId: nextRoute.id,
        routeName: nextRoute.name,
        nextRouteId: null,
        nextRouteName: '',
        totalSeconds: waitSeconds,
        remainingSeconds: waitSeconds,
        expectedRevenue: calculateRouteRevenue(item, nextRoute, nextRoute.durationSeconds),
        routeRevenue: 0,
        lastStopRevenue: 0,
        lastStopBoarding: null,
        lastStopAlighting: null,
        onboardPassengers: 0,
        totalBoardings: 0,
        settledStops: [],
        lastCompletedAt: new Date().toISOString(),
        waitingReason: nextRoute.nextDayStart ? '다음날 시작 대기' : '다음 운행 대기',
      }
    }

    return {
      ...item,
      status: 'idle',
      routeId: null,
      routeName: '',
      nextRouteId: null,
      nextRouteName: '',
      totalSeconds: 0,
      remainingSeconds: 0,
      expectedRevenue: 0,
      routeRevenue: 0,
      lastStopRevenue: 0,
      lastStopBoarding: null,
      lastStopAlighting: null,
      onboardPassengers: 0,
      totalBoardings: 0,
      settledStops: [],
      startedAt: null,
      lastCompletedAt: new Date().toISOString(),
      waitingReason: '',
    }
  })

  if (isStopRoute) {
    addLog('버스 운행', `${slot.vehicleName} · ${slot.routeName} 운행 완료 · 정류장별 정산 ${formatMoney(slot.routeRevenue || 0)}`, '🧾')
  } else {
    addLog('버스 정산', `${slot.vehicleName} · ${slot.routeName} 완료 · +${formatMoney(revenue)}`, '🧾')
  }
}

function startWaitingBusSlotNow(slot) {
  const route = getBusRoute(slot.routeId)
  if (!route || slot.status !== 'waiting') return

  if (route.nextDayStart) {
    addLog('출발 대기', `${slot.vehicleName} · ${route.name}은 표준시간 시작 조건까지 대기합니다.`, '⏳')
    return
  }

  busSlots.value = busSlots.value.map((item) => {
    if (item.vehicleId !== slot.vehicleId) return item
    return {
      ...item,
      remainingSeconds: 0,
      totalSeconds: Math.max(1, Number(item.totalSeconds || 1)),
    }
  })

  beginReservedBusSlot({ ...slot, remainingSeconds: 0 })
  addLog('즉시 출발', `${slot.vehicleName} · ${route.name} 출발 대기를 건너뛰고 운행을 시작했습니다.`, '▶')
}

function isNextDayStartWaiting(slot) {
  const route = getBusRoute(slot.routeId)
  return Boolean(slot.status === 'waiting' && route?.nextDayStart)
}

function beginReservedBusSlot(slot) {
  const route = getBusRoute(slot.routeId)
  if (!route) return

  const durationSeconds = getRouteRunDuration(route)
  const expectedRevenue = calculateRouteRevenue(slot, route, durationSeconds)

  busSlots.value = busSlots.value.map((item) => {
    if (item.vehicleId !== slot.vehicleId) return item
    return {
      ...item,
      status: 'running',
      nextRouteId: null,
      nextRouteName: '',
      pendingSale: false,
      totalSeconds: durationSeconds,
      remainingSeconds: durationSeconds,
      expectedRevenue,
      routeRevenue: 0,
      lastStopRevenue: 0,
      lastStopBoarding: null,
      lastStopAlighting: null,
      onboardPassengers: 0,
      totalBoardings: 0,
      settledStops: [],
      startedAt: new Date().toISOString(),
      waitingReason: '',
    }
  })

  addLog('자동 운행', `${slot.vehicleName} · ${route.name} 운행을 시작했습니다.`, '▶')
}

function canAfford(price) {
  return gameState.money >= price
}

function purchaseVehicle(item) {
  if (!canAfford(item.price)) {
    addLog('차량 구매', `${item.name} 구매 실패 · 자금 부족`, '!')
    return
  }

  const vehicle = {
    id: `${item.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    catalogId: item.id,
    mode: item.mode,
    name: item.name,
    price: item.price,
    capacity: item.capacity,
    boardingPerStop: item.boardingPerStop,
    allowedRoutes: item.allowedRoutes,
    purchasedAt: new Date().toISOString(),
    status: '대기',
  }

  gameState.money -= item.price
  gameState.totalSpent += item.price
  ownedVehicles.value.push(vehicle)
  addLog('차량 구매', `${item.name} 1대를 구입했습니다. 슬롯이 1개 추가되었습니다.`, '🚌')
}

function sellBusVehicle(slot) {
  if (slot.status === 'running') {
    toggleAutoSellAfterRun(slot)
    return
  }
  const refund = Math.round(Number(slot.purchasePrice || 0) * 0.5)
  gameState.money += refund
  ownedVehicles.value = ownedVehicles.value.filter((vehicle) => vehicle.id !== slot.vehicleId)
  busSlots.value = busSlots.value.filter((item) => item.vehicleId !== slot.vehicleId)
  addLog('차량 매각', `${slot.vehicleName} 매각 · +${formatMoney(refund)}`, '↩')
}

function toggleAutoSellAfterRun(slot) {
  const nextValue = !slot.pendingSale
  busSlots.value = busSlots.value.map((item) => {
    if (item.vehicleId !== slot.vehicleId) return item
    return {
      ...item,
      pendingSale: nextValue,
      nextRouteId: nextValue ? null : item.nextRouteId,
      nextRouteName: nextValue ? '' : item.nextRouteName,
    }
  })
  addLog('자동판매', `${slot.vehicleName} ${nextValue ? '운행 후 자동판매를 예약했습니다.' : '자동판매 예약을 취소했습니다.'}`, nextValue ? '↩' : '↺')
}

function syncSlotsWithOwnedVehicles() {
  const existingSlots = new Map(busSlots.value.map((slot) => [slot.vehicleId, slot]))
  const nextSlots = []

  busOwnedVehicles.value.forEach((vehicle) => {
    const existing = existingSlots.get(vehicle.id)
    if (existing) {
      nextSlots.push({
        ...existing,
        vehicleName: vehicle.name,
        vehicleCatalogId: vehicle.catalogId,
        capacity: vehicle.capacity,
        boardingPerStop: vehicle.boardingPerStop,
        purchasePrice: vehicle.price,
        vehiclePurchasedAt: vehicle.purchasedAt,
      })
      return
    }

    nextSlots.push({
      vehicleId: vehicle.id,
      vehicleName: vehicle.name,
      vehicleCatalogId: vehicle.catalogId,
      capacity: vehicle.capacity,
      boardingPerStop: vehicle.boardingPerStop,
      purchasePrice: vehicle.price,
      vehiclePurchasedAt: vehicle.purchasedAt,
      status: 'idle',
      routeId: null,
      routeName: '',
      totalSeconds: 0,
      remainingSeconds: 0,
      expectedRevenue: 0,
      routeRevenue: 0,
      lastStopRevenue: 0,
      lastStopBoarding: null,
      lastStopAlighting: null,
      onboardPassengers: 0,
      totalBoardings: 0,
      settledStops: [],
      startedAt: null,
      lastCompletedAt: null,
      waitingReason: '',
      nextRouteId: null,
      nextRouteName: '',
      pendingSale: false,
    })
  })

  busSlots.value = nextSlots
}

function availableRoutesForSlot(slot) {
  return busRoutes.value.filter((route) => route.allowedVehicleIds.includes(slot.vehicleCatalogId))
}

function reserveBusSlot(slot, route) {
  if (slot.pendingSale) {
    addLog('노선 예약', `${slot.vehicleName}은 자동판매 예약 중이라 노선을 예약할 수 없습니다.`, '!')
    return
  }

  if (slot.status === 'running') {
    busSlots.value = busSlots.value.map((item) => {
      if (item.vehicleId !== slot.vehicleId) return item
      return {
        ...item,
        nextRouteId: route.id,
        nextRouteName: route.name,
      }
    })
    addLog('다음 노선 예약', `${slot.vehicleName} · 운행 완료 후 ${route.name} 예약`, '⏭')
    return
  }

  const waitSeconds = route.nextDayStart ? secondsUntilNextDayStart(route) : NORMAL_ROUTE_WAIT_SECONDS
  const durationSeconds = getRouteRunDuration(route)
  const expectedRevenue = calculateRouteRevenue(slot, route, durationSeconds)

  busSlots.value = busSlots.value.map((item) => {
    if (item.vehicleId !== slot.vehicleId) return item
    return {
      ...item,
      status: 'waiting',
      routeId: route.id,
      routeName: route.name,
      nextRouteId: null,
      nextRouteName: '',
      pendingSale: false,
      totalSeconds: waitSeconds,
      remainingSeconds: waitSeconds,
      expectedRevenue,
      routeRevenue: 0,
      lastStopRevenue: 0,
      lastStopBoarding: null,
      lastStopAlighting: null,
      onboardPassengers: 0,
      totalBoardings: 0,
      settledStops: [],
      startedAt: null,
      waitingReason: route.nextDayStart ? '다음날 시작 대기' : '다음 운행 대기',
    }
  })

  addLog('노선 예약', `${slot.vehicleName} · ${route.name} 예약 · ${formatDuration(waitSeconds)} 후 출발`, '⏱')
}

function routeButtonTitle(slot, route) {
  if (slot.status === 'running') {
    if (slot.nextRouteId === route.id) return `다음 예약됨 · ${route.name}`
    return `운행 후 예약 · ${route.name}`
  }
  if (slot.routeId === route.id) return `노선 유지 · ${route.name}`
  return `노선 예약 · ${route.name}`
}

function autoSellButtonLabel(slot) {
  if (slot.pendingSale) return '자동판매 예약 취소'
  return `운행 후 자동판매 예약 · ${formatMoney(slot.purchasePrice * 0.5)}`
}


function isStopBasedRoute(routeId) {
  return ['village', 'city', 'regional'].includes(routeId)
}

function settleStopRevenueIfNeeded(slot) {
  const route = getBusRoute(slot.routeId)
  if (!route || !isStopBasedRoute(route.id)) return slot

  const stopIndex = currentSettlementStopIndex(slot, route)
  if (!stopIndex) return slot

  const settledStops = Array.isArray(slot.settledStops) ? [...slot.settledStops] : []
  if (settledStops.includes(stopIndex)) return slot

  const previousOnboard = Number(slot.onboardPassengers || 0)
  const capacity = Number(slot.capacity || 0)
  const isLastStop = stopIndex >= route.stopCount
  const allowsBoarding = route.id === 'regional' ? stopIndex <= 5 && !isLastStop : !isLastStop

  let alighting = 0
  let boarding = 0

  if (stopIndex === 1) {
    alighting = 0
    boarding = randomInteger(0, capacity)
  } else if (isLastStop) {
    alighting = previousOnboard
    boarding = 0
  } else {
    alighting = randomInteger(0, previousOnboard)
    const afterAlighting = Math.max(0, previousOnboard - alighting)
    const remainingCapacity = Math.max(0, capacity - afterAlighting)
    boarding = allowsBoarding ? randomInteger(0, remainingCapacity) : 0
  }

  const onboardPassengers = Math.max(0, previousOnboard - alighting + boarding)
  const revenue = boarding * Number(route.fare || 0)

  if (revenue > 0) {
    gameState.money += revenue
    gameState.totalEarned += revenue
    gameState.busEarned += revenue
  }

  addLog(
    '정류장 정산',
    `${slot.vehicleName} · ${stopLabel(route, stopIndex)} 하차 ${alighting}명 / 승차 ${boarding}명${revenue > 0 ? ` · +${formatMoney(revenue)}` : ''}`,
    revenue > 0 ? '＋' : '•',
  )

  settledStops.push(stopIndex)

  return {
    ...slot,
    onboardPassengers,
    totalBoardings: Number(slot.totalBoardings || 0) + boarding,
    routeRevenue: Number(slot.routeRevenue || 0) + revenue,
    lastStopRevenue: revenue,
    lastStopBoarding: boarding,
    lastStopAlighting: alighting,
    settledStops,
  }
}

function currentSettlementStopIndex(slot, route) {
  const elapsed = Math.max(0, Number(slot.totalSeconds || 0) - Number(slot.remainingSeconds || 0))

  if (route.id === 'regional') {
    const startDwellBlock = 5 * BUS_DWELL_SECONDS
    const highwayBlock = 3600
    const arrivalDwellBlock = 5 * BUS_DWELL_SECONDS

    if (elapsed < startDwellBlock) return Math.min(5, Math.floor(elapsed / BUS_DWELL_SECONDS) + 1)
    if (elapsed < startDwellBlock + highwayBlock) return null
    const arrivalElapsed = elapsed - startDwellBlock - highwayBlock
    if (arrivalElapsed >= arrivalDwellBlock) return null
    return Math.min(10, 6 + Math.floor(arrivalElapsed / BUS_DWELL_SECONDS))
  }

  const segmentSeconds = Math.round((BUS_STOP_DISTANCE_KM / BUS_SPEED_KMH) * 3600)
  const cycle = segmentSeconds + BUS_DWELL_SECONDS
  const currentStop = Math.min(route.stopCount, Math.floor(elapsed / cycle) + 1)
  const phase = elapsed % cycle

  if (currentStop > route.stopCount) return null
  if (phase >= BUS_DWELL_SECONDS) return null
  return currentStop
}

function stopLabel(route, stopIndex) {
  if (route.id === 'regional') {
    if (stopIndex <= 5) return `출발지 ${stopIndex}번 정류장`
    return `도착지 ${stopIndex - 5}번 정류장`
  }
  return `${stopIndex}번 정류장`
}

function calculateRouteRevenue(slot, route, durationSeconds) {
  if (route.id === 'commuter') return CHARTER_COMMUTE_REVENUE
  if (route.id === 'charter') return Math.round((durationSeconds / 86400) * CHARTER_BUS_DAILY_REVENUE)
  return 0
}

function getRouteRunDuration(route) {
  if (route.randomDays) return randomInteger(1, 3) * route.durationSeconds
  return route.durationSeconds
}

function secondsUntilNextDayStart(route) {
  const now = new Date(standardNow.value)
  const target = new Date(now)
  target.setDate(target.getDate() + 1)
  target.setHours(route.id === 'commuter' ? 6 : 8, 0, 0, 0)

  if (route.id === 'commuter') {
    while (target.getDay() === 0 || target.getDay() === 6) {
      target.setDate(target.getDate() + 1)
    }
  }

  return Math.max(1, Math.round((target.getTime() - now.getTime()) / 1000))
}

function getBusRoute(routeId) {
  return busRoutes.value.find((route) => route.id === routeId)
}

function stopRouteDuration(stopCount) {
  const segmentSeconds = Math.round((BUS_STOP_DISTANCE_KM / BUS_SPEED_KMH) * 3600)
  return stopCount * (segmentSeconds + BUS_DWELL_SECONDS)
}

function slotProgress(slot) {
  if (!slot.totalSeconds) return 0
  return Math.min(100, Math.max(0, ((slot.totalSeconds - slot.remainingSeconds) / slot.totalSeconds) * 100))
}

function slotTimerLabel(slot) {
  if (slot.status === 'running') return formatDuration(slot.remainingSeconds)
  if (slot.status === 'waiting') return `출발까지 ${formatDuration(slot.remainingSeconds)}`
  return '대기'
}

function slotStatusLabel(slot) {
  if (slot.status === 'running') return '운행 중'
  if (slot.status === 'waiting') return slot.waitingReason || '출발 대기'
  return '노선 설정 가능'
}

function slotOperationText(slot) {
  const route = getBusRoute(slot.routeId)
  if (!route) return '노선 설정 대기중'
  if (slot.status === 'waiting') return `${route.name} 출발 대기중 · 예약 변경/차량 매각 가능`
  if (slot.status !== 'running') return '대기중'
  if (route.id === 'commuter') return '전세통근버스 운행중 · 하루 단위 정산 대기중'
  if (route.id === 'charter') return '전세버스 운행중 · 최종 운행 완료 후 재예약 가능'
  if (route.id === 'regional') return regionalOperationText(slot, route)
  return stopRouteOperationText(slot, route)
}

function stopRouteOperationText(slot, route) {
  const segmentSeconds = Math.round((BUS_STOP_DISTANCE_KM / BUS_SPEED_KMH) * 3600)
  const elapsed = Math.max(0, Number(slot.totalSeconds || 0) - Number(slot.remainingSeconds || 0))
  const cycle = segmentSeconds + BUS_DWELL_SECONDS
  const currentStop = Math.min(route.stopCount, Math.floor(elapsed / cycle) + 1)
  const phase = elapsed % cycle

  if (phase < BUS_DWELL_SECONDS) {
    const isLastStop = currentStop >= route.stopCount
    return `${currentStop}번 정류장 대기중 · ${isLastStop ? '전원 하차/운행 마감' : '승하차/정산 처리'} · 현재 탑승 ${slot.onboardPassengers || 0}명`
  }

  const nextStop = Math.min(route.stopCount, currentStop + 1)
  return `${currentStop}번 정류장 → ${nextStop}번 정류장 이동중`
}

function regionalOperationText(slot) {
  const elapsed = Math.max(0, Number(slot.totalSeconds || 0) - Number(slot.remainingSeconds || 0))
  const dwellBlock = 5 * BUS_DWELL_SECONDS
  const highwayBlock = 3600

  if (elapsed < dwellBlock) {
    const stop = Math.min(5, Math.floor(elapsed / BUS_DWELL_SECONDS) + 1)
    return `출발지 ${stop}번 정류장 대기중 · 광역 승차/정산 처리 · 현재 탑승 ${slot.onboardPassengers || 0}명`
  }

  if (elapsed < dwellBlock + highwayBlock) {
    return '출발지 5번 정류장 → 도착지 1번 정류장 이동중 · 고속도로 100km/h 주행'
  }

  const arrivalElapsed = elapsed - dwellBlock - highwayBlock
  const stop = Math.min(5, Math.floor(arrivalElapsed / BUS_DWELL_SECONDS) + 1)
  return `도착지 ${stop}번 정류장 대기중 · 하차 처리`
}

function vehicleTypeLabel(catalogId) {
  return busCatalog.find((item) => item.id === catalogId)?.name ?? '버스'
}

function randomInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function addLog(source, text, icon = '•') {
  activityLogs.value.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    time: formatShortTime(new Date()),
    source,
    text,
    icon,
  })
  activityLogs.value = activityLogs.value.slice(0, 16)
}

function clearLogs() {
  activityLogs.value = []
  addLog('로그', '활동 로그를 정리했습니다.', '✓')
}

async function restoreAutoSave() {
  try {
    const saved = await loadRctsAutoSave()
    if (saved?.payload) {
      applySavedPayload(saved.payload)
      saveMeta.lastSavedAt = saved.savedAt ?? null
      saveMeta.status = '저장됨'
    } else {
      saveMeta.status = '신규 시작'
    }
    saveMeta.error = ''
  } catch (error) {
    saveMeta.error = error instanceof Error ? error.message : '자동저장을 불러오지 못했습니다.'
    saveMeta.status = '오류'
  } finally {
    saveMeta.loaded = true
  }
}

function applySavedPayload(payload) {
  if (payload.selectedMode) selectedMode.value = payload.selectedMode
  if (payload.gameState) {
    gameState.money = Number(payload.gameState.money ?? START_MONEY)
    gameState.totalSpent = Number(payload.gameState.totalSpent ?? 0)
    gameState.totalEarned = Number(payload.gameState.totalEarned ?? 0)
    gameState.busEarned = Number(payload.gameState.busEarned ?? 0)
  }
  if (Array.isArray(payload.ownedVehicles)) ownedVehicles.value = payload.ownedVehicles
  if (Array.isArray(payload.busSlots)) busSlots.value = payload.busSlots.map(normalizeSavedSlot)
  if (Array.isArray(payload.activityLogs)) activityLogs.value = payload.activityLogs
}

function normalizeSavedSlot(slot) {
  return {
    ...slot,
    purchasePrice: Number(slot.purchasePrice || 0),
    routeRevenue: Number(slot.routeRevenue || 0),
    lastStopRevenue: Number(slot.lastStopRevenue || 0),
    lastStopBoarding: slot.lastStopBoarding === null || slot.lastStopBoarding === undefined ? null : Number(slot.lastStopBoarding),
    lastStopAlighting: slot.lastStopAlighting === null || slot.lastStopAlighting === undefined ? null : Number(slot.lastStopAlighting),
    nextRouteId: slot.nextRouteId || null,
    nextRouteName: slot.nextRouteName || '',
    pendingSale: Boolean(slot.pendingSale),
    onboardPassengers: Number(slot.onboardPassengers || 0),
    totalBoardings: Number(slot.totalBoardings || 0),
    settledStops: Array.isArray(slot.settledStops) ? slot.settledStops : [],
    status: ['running', 'waiting', 'idle'].includes(slot.status) ? slot.status : 'idle',
    waitingReason: slot.waitingReason || '',
  }
}

function buildSavePayload() {
  const payload = {
    savedAt: new Date().toISOString(),
    standardTime: standardNow.value.toISOString(),
    selectedMode: selectedMode.value,
    gameState: { ...gameState },
    ownedVehicles: ownedVehicles.value,
    busSlots: busSlots.value,
    activityLogs: activityLogs.value,
  }
  return JSON.parse(JSON.stringify(payload))
}

function startAutoSave() {
  saveNow()
  autoSaveTimer = window.setInterval(saveNow, 600_000)
}

function queueAutoSave() {
  if (!saveMeta.loaded) return
  if (saveDebounceTimer) window.clearTimeout(saveDebounceTimer)
  saveDebounceTimer = window.setTimeout(saveNow, 650)
}

async function saveNow() {
  if (!saveMeta.loaded || saveMeta.saving) return
  saveMeta.saving = true
  saveMeta.error = ''
  try {
    const savedAt = await saveRctsAutoSave(buildSavePayload())
    saveMeta.lastSavedAt = savedAt
    saveMeta.status = '저장됨'
  } catch (error) {
    saveMeta.error = error instanceof Error ? error.message : '자동저장에 실패했습니다.'
    saveMeta.status = '오류'
  } finally {
    saveMeta.saving = false
  }
}

function handleBeforeUnload() {
  saveNow()
}

function handleVisibilityChange() {
  if (document.visibilityState === 'hidden') saveNow()
}

function formatStandardClock(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${year}.${month}.${day} ${hour}:${minute}`
}

function formatShortTime(value) {
  const date = value instanceof Date ? value : new Date(value)
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${hour}:${minute}`
}

function formatDuration(seconds) {
  const totalSeconds = Math.max(0, Math.round(Number(seconds) || 0))
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const remain = totalSeconds % 60
  if (days > 0) return `${days}일 ${hours}시간`
  if (hours > 0) return `${hours}시간 ${minutes}분`
  if (minutes > 0) return `${minutes}분 ${remain}초`
  return `${remain}초`
}

function formatMoney(value) {
  const number = Math.round(Number(value) || 0)
  return `${number.toLocaleString('ko-KR')}R`
}
</script>

<style scoped>
:global(:root) {
  --fixed-header-height: 5.25rem;
}

:global(*) {
  box-sizing: border-box;
}

:global(html),
:global(body) {
  margin: 0;
  min-width: 320px;
  min-height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

:global(html::-webkit-scrollbar),
:global(body::-webkit-scrollbar),
:global(.top-mode-nav::-webkit-scrollbar) {
  display: none;
  width: 0;
  height: 0;
}

:global(body) {
  background:
    radial-gradient(circle at 20% 0%, rgba(38, 139, 255, 0.25), transparent 28rem),
    linear-gradient(135deg, #06101d 0%, #071827 50%, #09101d 100%);
  color: #edf6ff;
  font-family: Inter, Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

button {
  border: 0;
  font: inherit;
  cursor: pointer;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.48;
}

.game-shell {
  min-height: 100vh;
  padding-top: var(--fixed-header-height);
}

.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0.75rem;
  align-items: center;
  padding: 0.72rem 1rem;
  border-bottom: 1px solid rgba(125, 184, 255, 0.16);
  background: rgba(5, 18, 34, 0.96);
  backdrop-filter: blur(18px);
  box-shadow: 0 0.8rem 2rem rgba(0, 0, 0, 0.28);
}

.brand-block strong,
.brand-block span {
  display: block;
}

.brand-block strong {
  color: #4aa5ff;
  font-size: 2rem;
  font-weight: 950;
  letter-spacing: -0.08em;
  line-height: 0.85;
}

.brand-block span {
  margin-top: 0.25rem;
  color: #91b6dd;
  font-size: 0.7rem;
  white-space: nowrap;
}

.top-scroll-strip {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.top-scroll-strip::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}

.top-mode-nav {
  display: flex;
  flex: 0 0 auto;
  gap: 0.42rem;
}

.top-mode-button {
  display: inline-flex;
  align-items: center;
  gap: 0.32rem;
  min-width: max-content;
  padding: 0.56rem 0.68rem;
  border: 1px solid rgba(125, 184, 255, 0.18);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.055);
  color: #c4d8ee;
  font-weight: 850;
}

.top-mode-button small {
  padding: 0.1rem 0.28rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: #8fa9c4;
  font-size: 0.58rem;
  font-weight: 900;
}

.top-mode-button.active {
  border-color: rgba(75, 170, 255, 0.75);
  background: linear-gradient(135deg, rgba(17, 126, 255, 0.92), rgba(17, 73, 170, 0.84));
  color: #fff;
}

.top-mode-button.active small {
  background: rgba(255, 255, 255, 0.16);
  color: #dceeff;
}

.header-status-bar {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 0.42rem;
  margin-left: 0.15rem;
}

.header-money,
.header-clock {
  min-width: max-content;
  padding: 0.48rem 0.64rem;
  border: 1px solid rgba(125, 184, 255, 0.18);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.055);
}

.header-money span,
.header-clock span {
  display: block;
  color: #8da7c3;
  font-size: 0.58rem;
  font-weight: 900;
  line-height: 1;
}

.header-money strong,
.header-clock strong {
  display: block;
  margin-top: 0.12rem;
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 950;
  line-height: 1.1;
  white-space: nowrap;
}

.header-money strong {
  color: #8fffba;
}

.header-clock strong {
  color: #cfe8ff;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  letter-spacing: -0.05em;
}

.main-area {
  width: min(1280px, 100%);
  margin: 0 auto;
  padding: 1rem;
}

.panel {
  border: 1px solid rgba(126, 183, 255, 0.17);
  background: linear-gradient(180deg, rgba(11, 34, 58, 0.92), rgba(9, 27, 47, 0.9));
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.2);
}

.bus-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.85rem;
  margin-top: 0.85rem;
}

.panel {
  width: 100%;
  border-radius: 1.1rem;
  padding: 1rem;
}

.section-title-row {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: flex-start;
  margin-bottom: 0.85rem;
}

.section-title-row h1,
.section-title-row h2 {
  margin: 0;
  color: #fff;
  font-weight: 950;
  letter-spacing: -0.05em;
}

.section-title-row h1 {
  font-size: clamp(1.35rem, 4vw, 2.1rem);
}

.section-title-row h2 {
  font-size: 1.25rem;
}

.eyebrow {
  margin: 0 0 0.25rem;
  color: #6bb6ff;
  font-size: 0.72rem;
  font-weight: 950;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.pill {
  padding: 0.45rem 0.65rem;
  border-radius: 999px;
  background: rgba(75, 170, 255, 0.12);
  color: #bfe0ff;
  font-size: 0.74rem;
  font-weight: 850;
  white-space: nowrap;
}

.shop-list {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.7rem;
}

.shop-card {
  display: flex;
  min-height: 9rem;
  flex-direction: column;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.86rem;
  border: 1px solid rgba(125, 184, 255, 0.14);
  border-radius: 0.95rem;
  background: rgba(255, 255, 255, 0.045);
}

.shop-card strong,
.shop-card span,
.shop-card b {
  display: block;
}

.shop-card strong {
  color: #fff;
}

.shop-card span {
  margin-top: 0.25rem;
  color: #90aac5;
  font-size: 0.76rem;
  line-height: 1.45;
}

.shop-card b {
  margin-top: 0.45rem;
  color: #8fffba;
}

.shop-card button,
.route-button-grid button,
.danger-button {
  border-radius: 0.78rem;
  color: #fff;
  font-weight: 900;
}

.shop-card button,
.route-button-grid button {
  background: linear-gradient(135deg, #1686ff, #0f59c8);
}

.shop-card button {
  width: 100%;
  padding: 0.7rem 0.78rem;
}

.bus-summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.65rem;
  margin-bottom: 0.85rem;
}

.bus-summary-grid article {
  padding: 0.85rem;
  border: 1px solid rgba(125, 184, 255, 0.12);
  border-radius: 0.9rem;
  background: rgba(255, 255, 255, 0.04);
}

.bus-summary-grid span,
.slot-meta span,
.slot-progress small {
  color: #90aac5;
  font-size: 0.76rem;
}

.bus-summary-grid strong {
  display: block;
  margin-top: 0.25rem;
  color: #fff;
  font-size: 1.2rem;
  font-weight: 950;
}

.empty-state {
  padding: 1rem;
  border: 1px dashed rgba(143, 194, 255, 0.22);
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.035);
  color: #adc1d5;
}

.large-empty strong,
.large-empty span {
  display: block;
}

.large-empty strong {
  color: #fff;
  margin-bottom: 0.35rem;
}

.slot-list,
.activity-log {
  display: grid;
  gap: 0.7rem;
}

.slot-card {
  padding: 0.95rem;
  border: 1px solid rgba(125, 184, 255, 0.15);
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.045);
}

.slot-card.running {
  border-color: rgba(95, 210, 255, 0.42);
  background: linear-gradient(135deg, rgba(24, 103, 205, 0.18), rgba(255, 255, 255, 0.045));
}

.slot-card.waiting {
  border-color: rgba(255, 207, 106, 0.35);
  background: linear-gradient(135deg, rgba(255, 176, 44, 0.12), rgba(255, 255, 255, 0.045));
}

.slot-head {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: flex-start;
}

.slot-label {
  margin: 0 0 0.22rem;
  color: #7dbfff;
  font-size: 0.78rem;
  font-weight: 850;
}

.slot-head h3 {
  margin: 0;
  color: #fff;
  font-size: 1.08rem;
}

.slot-timer {
  color: #8fffba;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  white-space: nowrap;
  text-align: right;
}

.slot-meta,
.slot-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-top: 0.65rem;
}

.compact-actions {
  align-items: center;
  gap: 0.35rem;
  margin-top: 0.55rem;
}

.slot-meta span {
  padding: 0.35rem 0.55rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
}

.slot-progress {
  margin-top: 0.85rem;
}

.slot-progress div {
  height: 0.55rem;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
}

.slot-progress span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #3f9cff, #74f0bd);
}

.slot-progress small {
  display: block;
  margin-top: 0.35rem;
}

.route-button-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: 0.45rem;
  margin-top: 0.85rem;
}

.compact-route-grid {
  grid-template-columns: repeat(auto-fit, minmax(8.2rem, max-content));
  justify-content: start;
  align-items: center;
  gap: 0.35rem;
  margin-top: 0.55rem;
}

.route-button-grid button {
  padding: 0.72rem;
  text-align: left;
}

.compact-route-grid button {
  min-width: 8.2rem;
  max-width: 11rem;
  padding: 0.44rem 0.58rem;
  border-radius: 0.68rem;
  line-height: 1.18;
}

.route-button-grid b,
.route-button-grid small {
  display: block;
}

.route-button-grid small {
  margin-top: 0.18rem;
  color: rgba(255, 255, 255, 0.75);
  font-size: 0.72rem;
}

.compact-route-grid b {
  font-size: 0.78rem;
}

.compact-route-grid small {
  margin-top: 0.12rem;
  font-size: 0.64rem;
}

.start-button {
  padding: 0.55rem 0.8rem;
  background: linear-gradient(135deg, #2f8cff, #43d6a0);
  color: #ffffff;
  font-weight: 800;
}

.mini-action {
  min-height: 2rem;
  padding: 0.38rem 0.58rem !important;
  border-radius: 999px !important;
  font-size: 0.74rem;
  line-height: 1;
  white-space: nowrap;
}

.start-button:disabled {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.48);
}

.danger-button {
  padding: 0.55rem 0.7rem;
  background: rgba(255, 99, 114, 0.18);
  color: #ffb9be;
}

.compact-actions .danger-button {
  background: rgba(255, 99, 114, 0.14);
}

.ghost-danger {
  border: 1px solid rgba(255, 99, 114, 0.32);
}

.danger-text {
  color: #ffb9be !important;
  background: rgba(255, 99, 114, 0.14) !important;
}

.slot-warning {
  color: #ffb3b8;
  font-size: 0.82rem;
}

.route-rule-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.65rem;
}

.route-rule-grid article {
  padding: 0.85rem;
  border: 1px solid rgba(125, 184, 255, 0.13);
  border-radius: 0.95rem;
  background: rgba(255, 255, 255, 0.04);
}

.route-rule-grid strong {
  color: #fff;
}

.route-rule-grid p,
.route-rule-grid li {
  color: #adc1d5;
  font-size: 0.78rem;
  line-height: 1.45;
}

.route-rule-grid ul {
  padding-left: 1rem;
  margin: 0.55rem 0 0;
}

.log-panel,
.mode-placeholder {
  margin-top: 0.85rem;
}

.text-button {
  padding: 0.4rem 0.62rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  color: #cbe1f9;
  font-weight: 850;
}

.activity-log p {
  display: grid;
  grid-template-columns: 3.3rem 1.6rem minmax(0, 1fr);
  gap: 0.5rem;
  align-items: center;
  margin: 0;
  padding: 0.68rem;
  border-radius: 0.78rem;
  background: rgba(255, 255, 255, 0.04);
}

.activity-log span {
  color: #80acd8;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.78rem;
}

.activity-log em {
  color: #dceeff;
  font-style: normal;
  font-size: 0.88rem;
}

.mode-placeholder p {
  color: #b8cee4;
  line-height: 1.7;
}


.slot-compact-row {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(13rem, 0.9fr) auto;
  align-items: center;
  gap: 0.65rem;
}

.slot-main-info {
  min-width: 0;
}

.slot-main-info h3 {
  margin: 0;
  color: #fff;
  font-size: 0.98rem;
  line-height: 1.25;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.slot-line {
  margin: 0.18rem 0 0;
  color: #90aac5;
  font-size: 0.74rem;
  line-height: 1.25;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.slot-compact-status {
  min-width: 0;
  text-align: right;
}

.slot-inline-meta {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 0.28rem;
  margin-top: 0.22rem;
}

.slot-inline-meta span {
  padding: 0.18rem 0.38rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  color: #90aac5;
  font-size: 0.66rem;
  line-height: 1;
}

.slot-quick-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.32rem;
  white-space: nowrap;
}

.slot-route-picker {
  position: relative;
}

.slot-route-picker summary {
  list-style: none;
  min-height: 2rem;
  padding: 0.55rem 0.7rem;
  border-radius: 999px;
  background: rgba(80, 151, 255, 0.16);
  color: #dceeff;
  font-size: 0.74rem;
  font-weight: 900;
  line-height: 1;
  cursor: pointer;
  user-select: none;
}

.slot-route-picker summary::-webkit-details-marker {
  display: none;
}

.slot-route-picker[open] summary {
  background: rgba(80, 151, 255, 0.3);
}

.slot-route-picker[open] .compact-route-grid {
  position: absolute;
  right: 0;
  top: calc(100% + 0.35rem);
  z-index: 8;
  width: min(18rem, 78vw);
  padding: 0.55rem;
  border: 1px solid rgba(125, 184, 255, 0.22);
  border-radius: 0.9rem;
  background: rgba(8, 24, 42, 0.98);
  box-shadow: 0 1rem 2rem rgba(0, 0, 0, 0.28);
}

.compact-progress {
  margin-top: 0.5rem;
}

.compact-progress div {
  height: 0.32rem;
}

@media (max-width: 1100px) {
  .shop-list,
  .route-rule-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 980px) {
  .app-header {
    grid-template-columns: auto minmax(0, 1fr);
    align-items: start;
  }

  .bus-summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 620px) {
  :global(:root) {
    --fixed-header-height: 6.2rem;
  }

  .slot-card {
    padding: 0.62rem;
  }

  .slot-compact-row {
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 0.45rem;
  }

  .slot-compact-status {
    grid-column: 1 / -1;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.45rem;
    text-align: left;
  }

  .slot-inline-meta {
    justify-content: flex-start;
    margin-top: 0;
  }

  .slot-quick-actions {
    grid-row: 1;
    grid-column: 2;
    align-self: start;
    flex-wrap: wrap;
    max-width: 8.8rem;
    gap: 0.22rem;
  }

  .slot-main-info h3,
  .slot-line {
    white-space: nowrap;
  }

  .slot-route-picker[open] .compact-route-grid {
    right: 0;
    width: min(17rem, 88vw);
  }
  .main-area {
    padding: 0.75rem;
  }

  .app-header {
    padding: 0.75rem;
  }

  .brand-block strong {
    font-size: 1.55rem;
  }

  .brand-block span {
    display: none;
  }

  .top-mode-button {
    padding: 0.48rem 0.58rem;
    font-size: 0.82rem;
  }

  .top-mode-button small {
    display: none;
  }

  .header-money,
  .header-clock {
    padding: 0.42rem 0.55rem;
  }

  .header-money span,
  .header-clock span {
    display: none;
  }

  .header-money strong,
  .header-clock strong {
    margin-top: 0;
    font-size: 0.72rem;
  }

  .shop-list,
  .bus-summary-grid,
  .route-rule-grid {
    grid-template-columns: 1fr;
  }

  .panel {
    border-radius: 0.9rem;
    padding: 0.85rem;
  }

  .slot-head,
  .section-title-row {
    align-items: flex-start;
  }

  .slot-head,
  .section-title-row {
    flex-direction: column;
  }

  .slot-timer {
    text-align: left;
  }

  .compact-actions {
    gap: 0.3rem;
  }

  .mini-action {
    min-height: 1.85rem;
    padding: 0.34rem 0.5rem !important;
    font-size: 0.68rem;
  }

  .compact-route-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
  }

  .compact-route-grid button {
    flex: 0 1 auto;
    min-width: 6.9rem;
    max-width: 9.2rem;
    padding: 0.38rem 0.48rem;
  }

  .compact-route-grid b {
    font-size: 0.72rem;
  }

  .compact-route-grid small {
    font-size: 0.58rem;
  }
}
</style>
