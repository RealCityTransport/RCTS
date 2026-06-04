/*
  파일 주소:
  src/modules/bus.js

  적용 내용:
  - RCTS 버스 운행 모듈
  - 스타터 소형버스 10대 자동 생성
  - 슬롯 1개 = 차량 1대
  - 스타터 차량도 판매 가능
  - 차량 구매 시 차량 슬롯 자동 추가
  - 노선 해금 시간은 해당 노선의 왕복 운행시간과 동일
  - 자동 배차 연구 시간은 24시간
  - 버스 연구/해금 작업은 한 번에 1개만 진행 가능
  - 모든 노선은 왕복 고정
  - 일반 노선 정류장 간 이동시간 1분
  - 광역 노선 권역 내 정류장 간 이동시간 3분, 중간 이동 1시간
  - 마을버스 단가 12,000R
  - 시내버스 단가 1,500R
  - 광역버스 단가 3,000R
  - 정산은 왕복 완료가 아니라 정류장 출발/도착 시점마다 발생
  - 왕복 완료 시 수동 대기 / 자동 재출발 / 예약 변경 적용 처리
  - 운행 중 차량명 수정 / 노선 변경 / 노선명 변경 / 판매 / 운행방식 변경은 귀환 후 적용 예약
  - 대기 중 변경은 즉시 적용

  연결된 파일:
  - src/App.vue
  - src/modules/gameState.js
  - src/modules/finance.js
  - src/views/BusView.vue

  수정 시 주의:
  - 자금은 직접 수정하지 말고 finance.js의 addIncome(), spendFunds(), refundFunds() 사용
  - 이 모듈은 버스 운행 규칙의 기준점
*/

import { computed, reactive } from 'vue'
import { gameState } from './gameState'
import {
  FINANCE_SOURCES,
  addIncome,
  canAfford,
  formatMoney,
  refundFunds,
  spendFunds
} from './finance'

const BUS_TICK_MS = 1000
const STARTER_BUS_COUNT = 10
const DEFAULT_ROUTE_KEY = 'village-small'

export const BUS_RESEARCH_CATALOG = {
  autoDispatch: {
    key: 'autoDispatch',
    label: '자동 배차 관리',
    durationSeconds: 24 * 60 * 60
  }
}

let busTimer = null
let initialized = false

export const BUS_VEHICLE_CATALOG = {
  small: {
    key: 'small',
    label: '소형버스',
    capacity: 25,
    price: 65000000,
    sellRate: 0.45,
    timeMultiplier: 0.95,
    demandMultiplier: 1,
    compatibleServices: ['village']
  },
  medium: {
    key: 'medium',
    label: '중형버스',
    capacity: 35,
    price: 120000000,
    sellRate: 0.45,
    timeMultiplier: 1,
    demandMultiplier: 1.03,
    compatibleServices: ['village', 'city']
  },
  large: {
    key: 'large',
    label: '대형버스',
    capacity: 45,
    price: 260000000,
    sellRate: 0.45,
    timeMultiplier: 1.05,
    demandMultiplier: 1.08,
    compatibleServices: ['city', 'metro']
  },
  double: {
    key: 'double',
    label: '2층버스',
    capacity: 70,
    price: 550000000,
    sellRate: 0.45,
    timeMultiplier: 1.12,
    demandMultiplier: 1.12,
    compatibleServices: ['metro']
  }
}

export const BUS_ROUTE_CATALOG = [
  {
    key: 'village-small',
    service: 'village',
    scale: 'small',
    label: '마을 순환 노선',
    defaultRouteNumber: '마을-01',
    defaultName: '마을 순환 1번',
    legacyNames: ['마을버스 소형 노선'],
    oneWayStops: 10,
    fare: 12000,
    localSegmentMinutes: 1,
    demandRate: 0.55,
    unlockDefault: true
  },
  {
    key: 'village-medium',
    service: 'village',
    scale: 'medium',
    label: '마을 연결 노선',
    defaultRouteNumber: '마을-02',
    defaultName: '마을 연결 2번',
    legacyNames: ['마을버스 중형 노선'],
    oneWayStops: 20,
    fare: 12000,
    localSegmentMinutes: 1,
    demandRate: 0.62,
    unlockDefault: false
  },
  {
    key: 'village-large',
    service: 'village',
    scale: 'large',
    label: '생활권 순환 노선',
    defaultRouteNumber: '마을-03',
    defaultName: '생활권 순환 3번',
    legacyNames: ['마을버스 대형 노선', '마을 광역연계 3번'],
    oneWayStops: 40,
    fare: 12000,
    localSegmentMinutes: 1,
    demandRate: 0.68,
    unlockDefault: false
  },
  {
    key: 'city-small',
    service: 'city',
    scale: 'small',
    label: '시내 일반 노선',
    defaultRouteNumber: '시내-01',
    defaultName: '시내 일반 1번',
    legacyNames: ['시내버스 소형 노선'],
    oneWayStops: 20,
    fare: 1500,
    localSegmentMinutes: 1,
    demandRate: 0.68,
    unlockDefault: false
  },
  {
    key: 'city-medium',
    service: 'city',
    scale: 'medium',
    label: '시내 간선 노선',
    defaultRouteNumber: '시내-02',
    defaultName: '시내 간선 2번',
    legacyNames: ['시내버스 중형 노선'],
    oneWayStops: 40,
    fare: 1500,
    localSegmentMinutes: 1,
    demandRate: 0.76,
    unlockDefault: false
  },
  {
    key: 'city-large',
    service: 'city',
    scale: 'large',
    label: '시내 장거리 노선',
    defaultRouteNumber: '시내-03',
    defaultName: '시내 장거리 3번',
    legacyNames: ['시내버스 대형 노선'],
    oneWayStops: 80,
    fare: 1500,
    localSegmentMinutes: 1,
    demandRate: 0.82,
    unlockDefault: false
  },
  {
    key: 'metro',
    service: 'metro',
    scale: 'metro',
    label: '광역 직행 노선',
    defaultRouteNumber: '광역-01',
    defaultName: '광역 직행 1번',
    legacyNames: ['광역버스 노선'],
    originStops: 5,
    destinationStops: 5,
    localSegmentMinutes: 3,
    middleMoveMinutes: 60,
    fare: 3000,
    demandRate: 0.88,
    unlockDefault: false
  }
]

export const busState = reactive({
  isRunning: false,
  message: '버스 모듈 준비 중',
  selectedSlotId: null,
  lastSettlementText: '',
  lastUpdatedAt: null
})

export const busRoutes = computed(() =>
  gameState.routes.filter((route) => route.mode === 'bus')
)

export const busSlots = computed(() =>
  gameState.operationSlots.filter((slot) => slot.mode === 'bus')
)

export const busVehicles = computed(() =>
  gameState.vehicles.filter((vehicle) => vehicle.mode === 'bus')
)

export const busResearch = computed(() => {
  ensureBusState()
  return gameState.bus.research
})

export const busRouteCatalog = computed(() => {
  ensureBusState()

  return BUS_ROUTE_CATALOG.map((template) => {
    const route = findBusRouteByKey(template.key)
    const unlockState = getUnlockState(template.key)
    const unlockSeconds = getRouteUnlockSeconds(template)
    const durationSeconds = calculateRouteDurationSeconds(template)

    return {
      ...template,
      routeId: route?.id ?? getRouteId(template.key),
      routeNumber: route?.routeNumber ?? template.defaultRouteNumber,
      name: route?.name ?? template.defaultName,
      displayName: route
        ? getRouteDisplayName(route)
        : `${template.defaultRouteNumber} ${template.defaultName}`,
      durationSeconds,
      durationText: formatDuration(durationSeconds),
      allowedVehicleLabels: getAllowedVehicleCategories(template.service)
        .map((key) => BUS_VEHICLE_CATALOG[key]?.label)
        .filter(Boolean)
        .join(', '),
      unlocked: unlockState.unlocked,
      unlocking: unlockState.unlocking,
      unlockRemainingSeconds: unlockState.remainingSeconds,
      unlockRemainingText: formatDuration(unlockState.remainingSeconds),
      unlockSeconds,
      unlockDurationText: formatDuration(unlockSeconds)
    }
  })
})

export const busSummary = computed(() => {
  ensureBusState()

  const runningSlots = busSlots.value.filter((slot) => slot.status === 'running').length
  const waitingSlots = busSlots.value.filter((slot) => slot.status !== 'running').length
  const pendingSlots = busSlots.value.filter((slot) => hasPendingChanges(slot)).length
  const totalSlots = busSlots.value.length
  const activeJob = getActiveBusJob()

  const hourlyRevenue = busRoutes.value.reduce(
    (sum, route) => sum + normalizeNumber(route.hourlyRevenue),
    0
  )

  const recentBusSettlements = gameState.settlements
    .filter((item) => item.mode === 'bus' || item.source === FINANCE_SOURCES.BUS_SETTLEMENT)
    .slice(0, 5)

  return {
    runningSlots,
    waitingSlots,
    pendingSlots,
    totalSlots,
    routeCount: busRoutes.value.length,
    vehicleCount: busVehicles.value.length,
    hourlyRevenue,
    autoDispatchUnlocked: Boolean(gameState.bus?.research?.autoDispatch),
    autoDispatchResearching: isResearchRunning('autoDispatch'),
    autoDispatchResearchRemainingSeconds: getResearchRemainingSeconds('autoDispatch'),
    autoDispatchResearchRemainingText: formatDuration(getResearchRemainingSeconds('autoDispatch')),
    autoDispatchResearchDurationText: formatDuration(BUS_RESEARCH_CATALOG.autoDispatch.durationSeconds),
    hasActiveJob: Boolean(activeJob),
    activeJob,
    recentBusSettlements
  }
})

export function initializeBusModule() {
  if (initialized) {
    return
  }

  ensureBusState()
  ensureUnlockedRoutes()
  ensureStarterSmallBuses()
  normalizeAllBusSlots()
  tickUnlockJobs()
  tickResearchJobs()
  syncBusRouteStats()

  initialized = true
  busState.message = '버스 운행 준비 완료'
}

export function startBusSimulation() {
  initializeBusModule()

  if (busTimer) {
    busState.isRunning = true
    return
  }

  busState.isRunning = true
  busState.message = '버스 운행 시뮬레이션 작동 중'

  busTimer = window.setInterval(() => {
    tickUnlockJobs()
    tickResearchJobs()
    tickBusOperations()
  }, BUS_TICK_MS)
}

export function stopBusSimulation() {
  if (busTimer) {
    window.clearInterval(busTimer)
    busTimer = null
  }

  busState.isRunning = false
  busState.message = '버스 운행 시뮬레이션 정지'
}

export function selectBusSlot(slotId) {
  const slot = findBusSlot(slotId)

  if (!slot) {
    return {
      success: false,
      message: '버스 슬롯을 찾을 수 없습니다.'
    }
  }

  busState.selectedSlotId = busState.selectedSlotId === slotId ? null : slotId

  return {
    success: true,
    message: `${slot.id} 선택`
  }
}

export function startBusSlot(slotId) {
  const slot = findBusSlot(slotId)

  if (!slot) {
    return {
      success: false,
      message: '버스 슬롯을 찾을 수 없습니다.'
    }
  }

  if (!slot.routeId) {
    return {
      success: false,
      message: '먼저 노선을 배정해야 합니다.'
    }
  }

  if (slot.status === 'running') {
    return {
      success: false,
      message: '이미 운행 중입니다.'
    }
  }

  if (slot.pendingChanges?.sellAfterReturn) {
    return {
      success: false,
      message: '판매 예약된 차량은 출발할 수 없습니다.'
    }
  }

  const route = findBusRoute(slot.routeId)
  const vehicle = findBusVehicle(slot.vehicleId)

  if (!route || !vehicle) {
    return {
      success: false,
      message: '차량 또는 노선 데이터가 없습니다.'
    }
  }

  if (!isVehicleCompatibleWithRoute(vehicle.category, route.service)) {
    return {
      success: false,
      message: '이 차량은 해당 노선에 배치할 수 없습니다.'
    }
  }

  beginBusRoundTrip(slot, route, vehicle)

  busState.message = `${slot.id} 출발`
  syncBusRouteStats()

  return {
    success: true,
    message: `${slot.vehicle} 출발`
  }
}

export function setSlotOperationMode(slotId, mode) {
  const slot = findBusSlot(slotId)

  if (!slot) {
    return {
      success: false,
      message: '버스 슬롯을 찾을 수 없습니다.'
    }
  }

  const nextMode = mode === 'auto' ? 'auto' : 'manual'

  if (nextMode === 'auto' && !gameState.bus.research.autoDispatch) {
    return {
      success: false,
      message: '자동 배차 연구가 필요합니다.'
    }
  }

  ensurePendingChanges(slot)

  if (slot.status === 'running') {
    slot.pendingChanges.operationMode = nextMode

    return {
      success: true,
      message: '운행 중이므로 귀환 후 운행방식 변경이 적용됩니다.'
    }
  }

  slot.operationMode = nextMode
  slot.statusText = slot.operationMode === 'auto' ? '자동운행 설정' : '수동운행 설정'

  return {
    success: true,
    message: slot.operationMode === 'auto'
      ? '자동운행으로 변경했습니다.'
      : '수동운행으로 변경했습니다.'
  }
}

export function assignRouteToSlot(slotId, routeId) {
  const slot = findBusSlot(slotId)
  const route = findBusRoute(routeId)

  if (!slot) {
    return {
      success: false,
      message: '버스 슬롯을 찾을 수 없습니다.'
    }
  }

  if (!route) {
    return {
      success: false,
      message: '노선을 찾을 수 없습니다.'
    }
  }

  const vehicle = findBusVehicle(slot.vehicleId)

  if (!vehicle) {
    return {
      success: false,
      message: '차량 데이터를 찾을 수 없습니다.'
    }
  }

  if (!isVehicleCompatibleWithRoute(vehicle.category, route.service)) {
    return {
      success: false,
      message: '이 차량은 해당 노선에 배치할 수 없습니다.'
    }
  }

  ensurePendingChanges(slot)

  if (slot.status === 'running') {
    slot.pendingChanges.routeId = route.id

    return {
      success: true,
      message: '운행 중이므로 귀환 후 노선 변경이 적용됩니다.'
    }
  }

  applyRouteToSlot(slot, route, vehicle)
  syncBusRouteStats()

  return {
    success: true,
    message: `${slot.vehicle} → ${getRouteDisplayName(route)} 배정 완료`
  }
}

export function renameBusVehicleBySlot(slotId, nextName) {
  const slot = findBusSlot(slotId)

  if (!slot) {
    return {
      success: false,
      message: '버스 슬롯을 찾을 수 없습니다.'
    }
  }

  const safeName = String(nextName ?? '').trim()

  if (!safeName) {
    return {
      success: false,
      message: '차량 이름을 입력해야 합니다.'
    }
  }

  ensurePendingChanges(slot)

  if (slot.status === 'running') {
    slot.pendingChanges.vehicleName = safeName

    return {
      success: true,
      message: '운행 중이므로 귀환 후 차량 이름이 변경됩니다.'
    }
  }

  applyVehicleName(slot, safeName)

  return {
    success: true,
    message: '차량 이름을 수정했습니다.'
  }
}

export function updateBusRouteIdentity(routeId, { routeNumber, name }) {
  const route = findBusRoute(routeId)

  if (!route) {
    return {
      success: false,
      message: '노선을 찾을 수 없습니다.'
    }
  }

  const safeRouteNumber = String(routeNumber ?? '').trim()
  const safeName = String(name ?? '').trim()

  if (!safeRouteNumber || !safeName) {
    return {
      success: false,
      message: '노선번호와 노선명을 모두 입력해야 합니다.'
    }
  }

  const runningSlots = busSlots.value.filter(
    (slot) => slot.routeId === route.id && slot.status === 'running'
  )

  if (runningSlots.length > 0) {
    runningSlots.forEach((slot) => {
      ensurePendingChanges(slot)
      slot.pendingChanges.routeNumber = safeRouteNumber
      slot.pendingChanges.routeName = safeName
    })
  }

  const waitingSlots = busSlots.value.filter(
    (slot) => slot.routeId === route.id && slot.status !== 'running'
  )

  route.routeNumber = safeRouteNumber
  route.name = safeName

  waitingSlots.forEach((slot) => {
    slot.route = getRouteDisplayName(route)
  })

  return {
    success: true,
    message: runningSlots.length > 0
      ? '대기 차량은 즉시 적용, 운행 중 차량은 귀환 후 적용됩니다.'
      : '노선 정보를 수정했습니다.'
  }
}

export function unlockBusRoute(routeKey) {
  ensureBusState()

  const template = BUS_ROUTE_CATALOG.find((item) => item.key === routeKey)

  if (!template) {
    return {
      success: false,
      message: '해금할 노선 정보를 찾을 수 없습니다.'
    }
  }

  if (isRouteUnlocked(routeKey)) {
    return {
      success: false,
      message: '이미 해금된 노선입니다.'
    }
  }

  const currentJob = gameState.bus.unlockJobs[routeKey]

  if (currentJob?.status === 'running') {
    return {
      success: false,
      message: `이미 해금 진행 중입니다. 남은 시간: ${formatDuration(getUnlockRemainingSeconds(currentJob))}`
    }
  }

  const activeJob = getActiveBusJob()

  if (activeJob) {
    return {
      success: false,
      message: `다른 작업이 진행 중입니다. 현재 작업: ${activeJob.label} · 남은 시간 ${activeJob.remainingText}`
    }
  }

  const now = Date.now()
  const unlockSeconds = getRouteUnlockSeconds(template)

  if (unlockSeconds <= 0) {
    completeRouteUnlock(routeKey)

    return {
      success: true,
      message: `${template.label} 해금 완료`
    }
  }

  gameState.bus.unlockJobs[routeKey] = {
    routeKey,
    status: 'running',
    startedAt: now,
    endsAt: now + unlockSeconds * 1000,
    unlockSeconds,
    remainingSeconds: unlockSeconds
  }

  return {
    success: true,
    message: `${template.label} 해금 시작 · ${formatDuration(unlockSeconds)}`
  }
}

export function completeAutoDispatchResearch() {
  ensureBusState()

  if (gameState.bus.research.autoDispatch) {
    return {
      success: false,
      message: '이미 자동 배차 연구가 완료되었습니다.'
    }
  }

  const currentJob = gameState.bus.researchJobs.autoDispatch

  if (currentJob?.status === 'running') {
    return {
      success: false,
      message: `이미 자동 배차 연구가 진행 중입니다. 남은 시간: ${formatDuration(getResearchRemainingSeconds('autoDispatch'))}`
    }
  }

  const activeJob = getActiveBusJob()

  if (activeJob) {
    return {
      success: false,
      message: `다른 작업이 진행 중입니다. 현재 작업: ${activeJob.label} · 남은 시간 ${activeJob.remainingText}`
    }
  }

  const now = Date.now()
  const durationSeconds = BUS_RESEARCH_CATALOG.autoDispatch.durationSeconds

  gameState.bus.researchJobs.autoDispatch = {
    key: 'autoDispatch',
    status: 'running',
    startedAt: now,
    endsAt: now + durationSeconds * 1000,
    durationSeconds,
    remainingSeconds: durationSeconds
  }

  return {
    success: true,
    message: `자동 배차 연구 시작 · ${formatDuration(durationSeconds)}`
  }
}

export function sellBusSlot(slotId) {
  const slot = findBusSlot(slotId)

  if (!slot) {
    return {
      success: false,
      message: '버스 슬롯을 찾을 수 없습니다.'
    }
  }

  ensurePendingChanges(slot)

  if (slot.status === 'running') {
    slot.pendingChanges.sellAfterReturn = true

    return {
      success: true,
      message: '운행 중이므로 귀환 후 차량이 판매됩니다.'
    }
  }

  return applySellSlot(slot)
}

export function buyBusVehicle(category = 'small') {
  initializeBusModule()

  const catalog = BUS_VEHICLE_CATALOG[category]

  if (!catalog) {
    return {
      success: false,
      message: '차량 구분이 올바르지 않습니다.'
    }
  }

  if (!canAfford(catalog.price)) {
    return {
      success: false,
      message: `구매 자금이 부족합니다. 필요 자금: ${formatMoney(catalog.price)}`
    }
  }

  const spendResult = spendFunds({
    amount: catalog.price,
    source: FINANCE_SOURCES.VEHICLE_PURCHASE,
    title: `${catalog.label} 구매`,
    detail: '버스 차량 추가 구매',
    mode: 'bus',
    relatedId: category
  })

  if (!spendResult.success) {
    return spendResult
  }

  const nextNumber = getNextBusNumber()
  const now = Date.now()
  const vehicleId = `vehicle-bus-${String(nextNumber).padStart(3, '0')}`
  const slotId = `BUS-${String(nextNumber).padStart(3, '0')}`

  const vehicle = {
    id: vehicleId,
    mode: 'bus',
    category,
    categoryLabel: catalog.label,
    name: `${catalog.label} ${nextNumber}호`,
    capacity: catalog.capacity,
    purchasePrice: catalog.price,
    starter: false,
    createdAt: now
  }

  const slot = createSlotForVehicle(vehicle, slotId, null, {
    starter: false,
    status: 'unassigned',
    statusText: '노선 미배정'
  })

  gameState.vehicles.push(vehicle)
  gameState.operationSlots.push(slot)

  syncBusRouteStats()

  return {
    success: true,
    message: `${vehicle.name} 구매 완료`,
    vehicle,
    slot
  }
}

export function getAssignableRoutesForSlot(slotId) {
  const slot = findBusSlot(slotId)

  if (!slot) {
    return []
  }

  const vehicle = findBusVehicle(slot.vehicleId)

  if (!vehicle) {
    return []
  }

  return busRoutes.value.filter((route) =>
    isVehicleCompatibleWithRoute(vehicle.category, route.service)
  )
}

export function getBusSlot(slotId) {
  return findBusSlot(slotId)
}

export function getBusRoute(routeId) {
  return findBusRoute(routeId)
}

export function getBusVehicle(vehicleId) {
  return findBusVehicle(vehicleId)
}

export function formatBusDuration(seconds) {
  return formatDuration(seconds)
}

function beginBusRoundTrip(slot, route, vehicle) {
  const totalSegments = getRouteTotalSegments(route)
  const durationSeconds = calculateSlotDurationSeconds(route, vehicle)
  const firstSegmentSeconds = getRouteSegmentSeconds(route, 0, vehicle)

  slot.status = 'running'
  slot.statusText = slot.operationMode === 'auto' ? '자동 운행중' : '수동 운행중'
  slot.durationSeconds = durationSeconds
  slot.remainingSeconds = durationSeconds
  slot.progress = 0
  slot.segmentIndex = 0
  slot.totalSegments = totalSegments
  slot.nextStopRemainingSeconds = firstSegmentSeconds
  slot.nextStopText = formatDuration(firstSegmentSeconds)
  slot.remaining = formatDuration(durationSeconds)
  slot.startedAt = Date.now()
  slot.lastTickAt = Date.now()

  processStopSettlement(slot, {
    reason: '출발 정류장',
    stopIndex: 0
  })
}

function tickBusOperations() {
  const now = Date.now()

  busSlots.value.forEach((slot) => {
    normalizeBusSlot(slot)

    if (slot.status !== 'running') {
      return
    }

    const route = findBusRoute(slot.routeId)
    const vehicle = findBusVehicle(slot.vehicleId)

    if (!route || !vehicle) {
      slot.status = 'error'
      slot.statusText = '차량 또는 노선 데이터 없음'
      return
    }

    const lastTickAt = Number(slot.lastTickAt || now)
    const elapsedSeconds = Math.max(1, Math.floor((now - lastTickAt) / 1000))

    slot.lastTickAt = now
    slot.remainingSeconds = Math.max(0, normalizeNumber(slot.remainingSeconds) - elapsedSeconds)
    slot.nextStopRemainingSeconds = Math.max(
      0,
      normalizeNumber(slot.nextStopRemainingSeconds) - elapsedSeconds
    )

    while (
      slot.status === 'running' &&
      slot.nextStopRemainingSeconds <= 0 &&
      normalizeNumber(slot.segmentIndex) < normalizeNumber(slot.totalSegments)
    ) {
      slot.segmentIndex = normalizeNumber(slot.segmentIndex) + 1

      processStopSettlement(slot, {
        reason: '정류장 도착',
        stopIndex: slot.segmentIndex
      })

      if (slot.segmentIndex >= slot.totalSegments) {
        completeBusRoundTrip(slot)
        break
      }

      slot.nextStopRemainingSeconds += getRouteSegmentSeconds(route, slot.segmentIndex, vehicle)
    }

    if (slot.status === 'running') {
      updateSlotDisplay(slot)
    }
  })

  syncBusRouteStats()
  busState.lastUpdatedAt = now
}

function processStopSettlement(slot, { reason, stopIndex }) {
  const route = findBusRoute(slot.routeId)
  const vehicle = findBusVehicle(slot.vehicleId)

  if (!route || !vehicle) {
    return
  }

  const settlement = simulateStopSettlement({
    route,
    vehicle,
    onboard: normalizeNumber(slot.passengersOnboard)
  })

  slot.passengersOnboard = settlement.finalOnboard
  slot.lastPassengerCount = settlement.boarded
  slot.lastSettlementAmount = settlement.revenue
  slot.lastStopSettlementAt = Date.now()
  slot.lastStopLabel = `${reason} ${stopIndex + 1}`
  slot.revenue = formatMoney(settlement.revenue)

  if (settlement.revenue <= 0) {
    slot.statusText = `${reason} · 승객 변동 없음`
    return
  }

  const incomeResult = addIncome({
    amount: settlement.revenue,
    source: FINANCE_SOURCES.BUS_SETTLEMENT,
    title: vehicle.name,
    detail: `${getRouteDisplayName(route)} · ${reason} · 승차 ${settlement.boarded}명`,
    mode: 'bus',
    relatedId: slot.id,
    addToSettlements: true
  })

  if (incomeResult.success) {
    busState.lastSettlementText = `${vehicle.name} ${formatMoney(settlement.revenue)} 정류장 정산`
    busState.message = '정류장 정산 완료'
    slot.statusText = `${reason} · ${formatMoney(settlement.revenue)}`
  }
}

function completeBusRoundTrip(slot) {
  const route = findBusRoute(slot.routeId)
  const vehicle = findBusVehicle(slot.vehicleId)

  if (!route || !vehicle) {
    slot.status = 'error'
    slot.statusText = '차량 또는 노선 데이터 없음'
    return
  }

  const now = Date.now()

  slot.cycleCount = normalizeNumber(slot.cycleCount) + 1
  slot.lastSettlementAt = now

  const pendingResult = applyPendingChangesAfterReturn(slot)

  if (pendingResult.sold) {
    syncBusRouteStats()
    return
  }

  const nextRoute = findBusRoute(slot.routeId)
  const nextVehicle = findBusVehicle(slot.vehicleId)

  if (!nextRoute || !nextVehicle) {
    slot.status = 'unassigned'
    slot.statusText = '노선 미배정'
    slot.remaining = '미배정'
    syncBusRouteStats()
    return
  }

  const durationSeconds = calculateSlotDurationSeconds(nextRoute, nextVehicle)

  if (slot.operationMode === 'auto' && gameState.bus.research.autoDispatch) {
    beginBusRoundTrip(slot, nextRoute, nextVehicle)
    slot.statusText = '자동 재출발'
  } else {
    slot.status = 'idle'
    slot.statusText = pendingResult.changed ? '변경 적용 완료 · 출발 대기' : '왕복 완료 · 출발 대기'
    slot.durationSeconds = durationSeconds
    slot.remainingSeconds = durationSeconds
    slot.progress = 0
    slot.segmentIndex = 0
    slot.totalSegments = getRouteTotalSegments(nextRoute)
    slot.nextStopRemainingSeconds = getRouteSegmentSeconds(nextRoute, 0, nextVehicle)
    slot.nextStopText = formatDuration(slot.nextStopRemainingSeconds)
    slot.remaining = formatDuration(durationSeconds)
    slot.lastTickAt = now
  }

  syncBusRouteStats()
}

function applyPendingChangesAfterReturn(slot) {
  ensurePendingChanges(slot)

  let changed = false

  if (slot.pendingChanges.vehicleName) {
    applyVehicleName(slot, slot.pendingChanges.vehicleName)
    changed = true
  }

  if (slot.pendingChanges.routeNumber || slot.pendingChanges.routeName) {
    const route = findBusRoute(slot.routeId)

    if (route) {
      if (slot.pendingChanges.routeNumber) {
        route.routeNumber = slot.pendingChanges.routeNumber
      }

      if (slot.pendingChanges.routeName) {
        route.name = slot.pendingChanges.routeName
      }

      busSlots.value
        .filter((item) => item.routeId === route.id)
        .forEach((item) => {
          item.route = getRouteDisplayName(route)
        })

      changed = true
    }
  }

  if (slot.pendingChanges.routeId) {
    const route = findBusRoute(slot.pendingChanges.routeId)
    const vehicle = findBusVehicle(slot.vehicleId)

    if (route && vehicle && isVehicleCompatibleWithRoute(vehicle.category, route.service)) {
      applyRouteToSlot(slot, route, vehicle)
      changed = true
    }
  }

  if (slot.pendingChanges.operationMode) {
    const nextMode = slot.pendingChanges.operationMode

    if (nextMode === 'manual' || (nextMode === 'auto' && gameState.bus.research.autoDispatch)) {
      slot.operationMode = nextMode
      changed = true
    }
  }

  if (slot.pendingChanges.sellAfterReturn) {
    clearPendingChanges(slot)
    const sellResult = applySellSlot(slot)

    return {
      changed: true,
      sold: sellResult.success
    }
  }

  clearPendingChanges(slot)

  return {
    changed,
    sold: false
  }
}

function applyRouteToSlot(slot, route, vehicle) {
  const durationSeconds = calculateSlotDurationSeconds(route, vehicle)

  slot.routeId = route.id
  slot.route = getRouteDisplayName(route)
  slot.durationSeconds = durationSeconds
  slot.remainingSeconds = durationSeconds
  slot.progress = 0
  slot.segmentIndex = 0
  slot.totalSegments = getRouteTotalSegments(route)
  slot.nextStopRemainingSeconds = getRouteSegmentSeconds(route, 0, vehicle)
  slot.nextStopText = formatDuration(slot.nextStopRemainingSeconds)
  slot.remaining = formatDuration(durationSeconds)
  slot.status = 'idle'
  slot.statusText = '노선 배정 완료'
  slot.expectedSettlement = estimateRoundTripSettlement(route, vehicle)
}

function applyVehicleName(slot, safeName) {
  const vehicle = findBusVehicle(slot.vehicleId)

  if (!vehicle) {
    return
  }

  vehicle.name = safeName
  slot.vehicle = safeName

  busSlots.value
    .filter((item) => item.vehicleId === vehicle.id)
    .forEach((item) => {
      item.vehicle = safeName
    })
}

function applySellSlot(slot) {
  const vehicle = findBusVehicle(slot.vehicleId)

  if (!vehicle) {
    return {
      success: false,
      message: '차량 데이터를 찾을 수 없습니다.'
    }
  }

  const catalog = BUS_VEHICLE_CATALOG[vehicle.category]
  const basePrice = normalizeNumber(vehicle.purchasePrice) || normalizeNumber(catalog?.price)
  const refundAmount = Math.floor(basePrice * Number(catalog?.sellRate ?? 0.4))

  if (refundAmount > 0) {
    refundFunds({
      amount: refundAmount,
      source: FINANCE_SOURCES.REFUND,
      title: `${vehicle.name} 판매`,
      detail: '버스 차량 매각',
      mode: 'bus',
      relatedId: vehicle.id
    })
  }

  removeById(gameState.operationSlots, slot.id)
  removeById(gameState.vehicles, vehicle.id)

  if (busState.selectedSlotId === slot.id) {
    busState.selectedSlotId = null
  }

  return {
    success: true,
    message: `${vehicle.name} 판매 완료 · ${formatMoney(refundAmount)} 회수`
  }
}

function simulateStopSettlement({ route, vehicle, onboard }) {
  const capacity = normalizeNumber(vehicle.capacity) || 25
  const fare = normalizeNumber(route.fare) || 1200
  const vehicleDemandMultiplier = Number(BUS_VEHICLE_CATALOG[vehicle.category]?.demandMultiplier ?? 1)
  const demandRate = clamp(Number(route.demandRate ?? 0.55) * vehicleDemandMultiplier, 0.1, 1)

  const currentOnboard = clamp(onboard, 0, capacity)
  const alighted = randomInt(0, currentOnboard)
  const afterAlight = Math.max(0, currentOnboard - alighted)

  const emptySeats = Math.max(0, capacity - afterAlight)
  const maxDemand = Math.max(0, Math.ceil(emptySeats * demandRate))
  const boarded = randomInt(0, maxDemand)

  const finalOnboard = Math.min(capacity, afterAlight + boarded)
  const revenue = boarded * fare

  return {
    alighted,
    boarded,
    finalOnboard,
    revenue
  }
}

function updateSlotDisplay(slot) {
  const durationSeconds = Math.max(1, normalizeNumber(slot.durationSeconds))
  const remainingSeconds = Math.max(0, normalizeNumber(slot.remainingSeconds))
  const completedSeconds = Math.max(0, durationSeconds - remainingSeconds)

  slot.progress = clamp(Math.floor((completedSeconds / durationSeconds) * 100), 0, 100)
  slot.remaining = formatDuration(remainingSeconds)
  slot.nextStopText = formatDuration(slot.nextStopRemainingSeconds)
}

function tickUnlockJobs() {
  ensureBusState()

  Object.values(gameState.bus.unlockJobs).forEach((job) => {
    if (!job || job.status !== 'running') {
      return
    }

    const remainingSeconds = getUnlockRemainingSeconds(job)

    job.remainingSeconds = remainingSeconds

    if (remainingSeconds <= 0) {
      completeRouteUnlock(job.routeKey)
    }
  })
}

function tickResearchJobs() {
  ensureBusState()

  Object.values(gameState.bus.researchJobs).forEach((job) => {
    if (!job || job.status !== 'running') {
      return
    }

    const remainingSeconds = getResearchRemainingSeconds(job.key)

    job.remainingSeconds = remainingSeconds

    if (remainingSeconds <= 0) {
      completeResearchJob(job.key)
    }
  })
}

function completeRouteUnlock(routeKey) {
  ensureBusState()

  const template = BUS_ROUTE_CATALOG.find((item) => item.key === routeKey)

  if (!template) {
    return
  }

  if (!gameState.bus.unlockedRouteKeys.includes(routeKey)) {
    gameState.bus.unlockedRouteKeys.push(routeKey)
  }

  gameState.bus.unlockJobs[routeKey] = {
    routeKey,
    status: 'completed',
    startedAt: gameState.bus.unlockJobs[routeKey]?.startedAt ?? Date.now(),
    endsAt: Date.now(),
    unlockSeconds: getRouteUnlockSeconds(template),
    remainingSeconds: 0
  }

  createRouteFromTemplate(template)
  syncBusRouteStats()

  busState.message = `${template.label} 해금 완료`
}

function completeResearchJob(key) {
  ensureBusState()

  if (key === 'autoDispatch') {
    gameState.bus.research.autoDispatch = true
  }

  gameState.bus.researchJobs[key] = {
    key,
    status: 'completed',
    startedAt: gameState.bus.researchJobs[key]?.startedAt ?? Date.now(),
    endsAt: Date.now(),
    durationSeconds: BUS_RESEARCH_CATALOG[key]?.durationSeconds ?? 0,
    remainingSeconds: 0
  }

  busState.message = `${BUS_RESEARCH_CATALOG[key]?.label ?? '연구'} 완료`
}

function getActiveBusJob() {
  ensureBusState()

  const runningUnlockJob = Object.values(gameState.bus.unlockJobs).find(
    (job) => job?.status === 'running'
  )

  if (runningUnlockJob) {
    const template = BUS_ROUTE_CATALOG.find((item) => item.key === runningUnlockJob.routeKey)
    const remainingSeconds = getUnlockRemainingSeconds(runningUnlockJob)

    return {
      type: 'unlock',
      key: runningUnlockJob.routeKey,
      label: template?.label ?? '노선 해금',
      remainingSeconds,
      remainingText: formatDuration(remainingSeconds)
    }
  }

  const runningResearchJob = Object.values(gameState.bus.researchJobs).find(
    (job) => job?.status === 'running'
  )

  if (runningResearchJob) {
    const catalog = BUS_RESEARCH_CATALOG[runningResearchJob.key]
    const remainingSeconds = getResearchRemainingSeconds(runningResearchJob.key)

    return {
      type: 'research',
      key: runningResearchJob.key,
      label: catalog?.label ?? '연구',
      remainingSeconds,
      remainingText: formatDuration(remainingSeconds)
    }
  }

  return null
}

function isResearchRunning(key) {
  ensureBusState()

  return gameState.bus.researchJobs[key]?.status === 'running'
}

function getResearchRemainingSeconds(key) {
  ensureBusState()

  const job = gameState.bus.researchJobs[key]

  if (!job || job.status !== 'running') {
    return 0
  }

  return Math.max(0, Math.ceil((normalizeNumber(job.endsAt) - Date.now()) / 1000))
}

function getUnlockState(routeKey) {
  ensureBusState()

  const unlocked = isRouteUnlocked(routeKey)
  const job = gameState.bus.unlockJobs[routeKey]
  const unlocking = !unlocked && job?.status === 'running'

  return {
    unlocked,
    unlocking,
    remainingSeconds: unlocking ? getUnlockRemainingSeconds(job) : 0
  }
}

function getUnlockRemainingSeconds(job) {
  if (!job) {
    return 0
  }

  return Math.max(0, Math.ceil((normalizeNumber(job.endsAt) - Date.now()) / 1000))
}

function ensureBusState() {
  if (!gameState.bus) {
    gameState.bus = {}
  }

  if (!Array.isArray(gameState.bus.unlockedRouteKeys)) {
    gameState.bus.unlockedRouteKeys = [DEFAULT_ROUTE_KEY]
  }

  if (!gameState.bus.unlockedRouteKeys.includes(DEFAULT_ROUTE_KEY)) {
    gameState.bus.unlockedRouteKeys.unshift(DEFAULT_ROUTE_KEY)
  }

  if (!gameState.bus.research) {
    gameState.bus.research = {}
  }

  if (typeof gameState.bus.research.autoDispatch !== 'boolean') {
    gameState.bus.research.autoDispatch = false
  }

  if (typeof gameState.bus.research.demandBoostLevel !== 'number') {
    gameState.bus.research.demandBoostLevel = 0
  }

  if (typeof gameState.bus.research.revenueBoostLevel !== 'number') {
    gameState.bus.research.revenueBoostLevel = 0
  }

  if (typeof gameState.bus.research.timeEfficiencyLevel !== 'number') {
    gameState.bus.research.timeEfficiencyLevel = 0
  }

  if (!gameState.bus.settings) {
    gameState.bus.settings = {
      manualByDefault: true
    }
  }

  if (!gameState.bus.unlockJobs || typeof gameState.bus.unlockJobs !== 'object') {
    gameState.bus.unlockJobs = {}
  }

  if (!gameState.bus.researchJobs || typeof gameState.bus.researchJobs !== 'object') {
    gameState.bus.researchJobs = {}
  }
}

function ensureUnlockedRoutes() {
  ensureBusState()

  BUS_ROUTE_CATALOG.forEach((template) => {
    if (template.unlockDefault && !gameState.bus.unlockedRouteKeys.includes(template.key)) {
      gameState.bus.unlockedRouteKeys.push(template.key)
    }

    if (isRouteUnlocked(template.key)) {
      createRouteFromTemplate(template)
    }
  })
}

function ensureStarterSmallBuses() {
  const defaultRoute = findBusRouteByKey(DEFAULT_ROUTE_KEY) ?? createRouteFromTemplate(
    BUS_ROUTE_CATALOG.find((template) => template.key === DEFAULT_ROUTE_KEY)
  )

  for (let index = 1; index <= STARTER_BUS_COUNT; index += 1) {
    const padded = String(index).padStart(3, '0')
    const vehicleId = `vehicle-bus-${padded}`
    const slotId = `BUS-${padded}`

    let vehicle = findBusVehicle(vehicleId)

    if (!vehicle) {
      vehicle = {
        id: vehicleId,
        mode: 'bus',
        category: 'small',
        categoryLabel: BUS_VEHICLE_CATALOG.small.label,
        name: `소형버스 ${index}호`,
        capacity: BUS_VEHICLE_CATALOG.small.capacity,
        purchasePrice: 0,
        starter: true,
        createdAt: Date.now()
      }

      gameState.vehicles.push(vehicle)
    }

    let slot = findBusSlot(slotId)

    if (!slot) {
      slot = createSlotForVehicle(vehicle, slotId, defaultRoute, {
        starter: true,
        status: 'idle',
        statusText: '출발 대기'
      })

      gameState.operationSlots.push(slot)
    }
  }
}

function createSlotForVehicle(vehicle, slotId, route, options = {}) {
  const now = Date.now()
  const durationSeconds = route
    ? calculateSlotDurationSeconds(route, vehicle)
    : 0

  return {
    id: slotId,
    mode: 'bus',
    vehicleId: vehicle.id,
    routeId: route?.id ?? '',

    vehicle: vehicle.name,
    route: route ? getRouteDisplayName(route) : '미배정',

    status: options.status ?? 'idle',
    statusText: options.statusText ?? '출발 대기',

    operationMode: 'manual',
    starter: Boolean(options.starter),

    durationSeconds,
    remainingSeconds: durationSeconds,
    progress: 0,

    segmentIndex: 0,
    totalSegments: route ? getRouteTotalSegments(route) : 0,
    nextStopRemainingSeconds: route ? getRouteSegmentSeconds(route, 0, vehicle) : 0,
    nextStopText: route ? formatDuration(getRouteSegmentSeconds(route, 0, vehicle)) : '미배정',

    cycleCount: 0,
    passengersOnboard: 0,
    lastPassengerCount: 0,
    lastSettlementAmount: 0,
    lastStopLabel: '',
    expectedSettlement: route ? estimateRoundTripSettlement(route, vehicle) : 0,

    remaining: route ? formatDuration(durationSeconds) : '미배정',
    revenue: '0R',

    pendingChanges: createEmptyPendingChanges(),

    startedAt: null,
    lastTickAt: now,
    lastSettlementAt: null,
    lastStopSettlementAt: null
  }
}

function createRouteFromTemplate(template) {
  if (!template) {
    return null
  }

  let route = findBusRouteByKey(template.key)

  if (route) {
    normalizeBusRoute(route, template)
    return route
  }

  const durationSeconds = calculateRouteDurationSeconds(template)

  route = {
    id: getRouteId(template.key),
    routeKey: template.key,
    mode: 'bus',
    service: template.service,
    scale: template.scale,

    routeNumber: template.defaultRouteNumber,
    name: template.defaultName,

    oneWayStops: template.oneWayStops ?? 0,
    originStops: template.originStops ?? 0,
    destinationStops: template.destinationStops ?? 0,
    localSegmentMinutes: template.localSegmentMinutes ?? 1,
    middleMoveMinutes: template.middleMoveMinutes ?? 0,

    fare: template.fare,
    demandRate: template.demandRate,

    durationSeconds,
    durationText: formatDuration(durationSeconds),

    slotCount: 0,
    headwayText: '운행 없음',
    hourlyRevenue: 0
  }

  gameState.routes.push(route)

  return route
}

function normalizeAllBusSlots() {
  busRoutes.value.forEach((route) => {
    const template = BUS_ROUTE_CATALOG.find((item) => item.key === route.routeKey)
    normalizeBusRoute(route, template)
  })

  busSlots.value.forEach((slot) => {
    normalizeBusSlot(slot)
  })
}

function normalizeBusRoute(route, template) {
  const fallback = template ?? BUS_ROUTE_CATALOG.find((item) => item.key === route.routeKey)

  route.mode = 'bus'
  route.service = route.service || fallback?.service || 'village'
  route.scale = route.scale || fallback?.scale || 'small'
  route.routeNumber = route.routeNumber || fallback?.defaultRouteNumber || '노선-00'

  if (!route.name || fallback?.legacyNames?.includes(route.name)) {
    route.name = fallback?.defaultName || '버스 노선'
  }

  route.fare = fallback?.fare ?? normalizeNumber(route.fare) ?? 1200
  route.demandRate = Number(route.demandRate ?? fallback?.demandRate ?? 0.55)
  route.durationSeconds = calculateRouteDurationSeconds(route)
  route.durationText = formatDuration(route.durationSeconds)
}

function normalizeBusSlot(slot) {
  const vehicle = findBusVehicle(slot.vehicleId)
  const route = findBusRoute(slot.routeId)

  slot.mode = 'bus'
  slot.vehicle = vehicle?.name ?? slot.vehicle ?? '버스'
  slot.route = route ? getRouteDisplayName(route) : slot.route || '미배정'
  slot.operationMode = slot.operationMode === 'auto' ? 'auto' : 'manual'
  slot.status = slot.status || 'idle'
  slot.statusText = slot.statusText || '출발 대기'
  slot.progress = clamp(normalizeNumber(slot.progress), 0, 100)
  slot.cycleCount = normalizeNumber(slot.cycleCount)
  slot.passengersOnboard = normalizeNumber(slot.passengersOnboard)
  slot.lastPassengerCount = normalizeNumber(slot.lastPassengerCount)
  slot.lastSettlementAmount = normalizeNumber(slot.lastSettlementAmount)
  slot.segmentIndex = normalizeNumber(slot.segmentIndex)
  ensurePendingChanges(slot)

  if (route && vehicle) {
    const durationSeconds = calculateSlotDurationSeconds(route, vehicle)

    slot.durationSeconds = normalizeNumber(slot.durationSeconds) || durationSeconds
    slot.remainingSeconds = normalizeNumber(slot.remainingSeconds) || durationSeconds
    slot.totalSegments = normalizeNumber(slot.totalSegments) || getRouteTotalSegments(route)
    slot.nextStopRemainingSeconds = normalizeNumber(slot.nextStopRemainingSeconds) || getRouteSegmentSeconds(route, 0, vehicle)
    slot.nextStopText = slot.nextStopText || formatDuration(slot.nextStopRemainingSeconds)
    slot.expectedSettlement = normalizeNumber(slot.expectedSettlement) || estimateRoundTripSettlement(route, vehicle)
    slot.remaining = slot.remaining || formatDuration(slot.remainingSeconds)
  }
}

function syncBusRouteStats() {
  busRoutes.value.forEach((route) => {
    const assignedSlots = busSlots.value.filter((slot) => slot.routeId === route.id)
    const runningSlots = assignedSlots.filter((slot) => slot.status === 'running')
    const durationSeconds = Math.max(1, normalizeNumber(route.durationSeconds))
    const slotCount = assignedSlots.length
    const runningCount = runningSlots.length

    route.slotCount = slotCount
    route.headwayText = runningCount > 0
      ? formatDuration(Math.max(1, Math.floor(durationSeconds / runningCount)))
      : '운행 없음'

    const estimatedCycleRevenue = assignedSlots.reduce((sum, slot) => {
      return sum + normalizeNumber(slot.expectedSettlement)
    }, 0)

    route.hourlyRevenue = slotCount > 0
      ? Math.floor(estimatedCycleRevenue * (3600 / durationSeconds))
      : 0
  })

  const busMode = gameState.modes.find((mode) => mode.key === 'bus')

  if (busMode) {
    busMode.running = busSlots.value.filter((slot) => slot.status === 'running').length
    busMode.total = busSlots.value.length
    busMode.hourlyRevenue = busRoutes.value.reduce(
      (sum, route) => sum + normalizeNumber(route.hourlyRevenue),
      0
    )
  }

  gameState.finance.hourlyRevenue = gameState.modes.reduce(
    (sum, mode) => sum + normalizeNumber(mode.hourlyRevenue),
    0
  )
}

function isRouteUnlocked(routeKey) {
  ensureBusState()

  return gameState.bus.unlockedRouteKeys.includes(routeKey)
}

function isVehicleCompatibleWithRoute(category, service) {
  const vehicle = BUS_VEHICLE_CATALOG[category]

  if (!vehicle) {
    return false
  }

  return vehicle.compatibleServices.includes(service)
}

function getAllowedVehicleCategories(service) {
  return Object.values(BUS_VEHICLE_CATALOG)
    .filter((vehicle) => vehicle.compatibleServices.includes(service))
    .map((vehicle) => vehicle.key)
}

function calculateSlotDurationSeconds(route, vehicle) {
  const baseDuration = calculateRouteDurationSeconds(route)
  const multiplier = Number(BUS_VEHICLE_CATALOG[vehicle.category]?.timeMultiplier ?? 1)
  const researchDiscount = Math.max(0, normalizeNumber(gameState.bus?.research?.timeEfficiencyLevel) * 0.02)
  const finalMultiplier = Math.max(0.7, multiplier - researchDiscount)

  return Math.max(1, Math.floor(baseDuration * finalMultiplier))
}

function calculateRouteDurationSeconds(routeOrTemplate) {
  if (routeOrTemplate.service === 'metro') {
    const originStops = normalizeNumber(routeOrTemplate.originStops) || 5
    const destinationStops = normalizeNumber(routeOrTemplate.destinationStops) || 5
    const localSegmentMinutes = normalizeNumber(routeOrTemplate.localSegmentMinutes) || 3
    const middleMoveMinutes = normalizeNumber(routeOrTemplate.middleMoveMinutes) || 60

    const oneWayMinutes =
      Math.max(0, originStops - 1) * localSegmentMinutes +
      middleMoveMinutes +
      Math.max(0, destinationStops - 1) * localSegmentMinutes

    return oneWayMinutes * 2 * 60
  }

  const oneWayStops = normalizeNumber(routeOrTemplate.oneWayStops) || 10
  const localSegmentMinutes = normalizeNumber(routeOrTemplate.localSegmentMinutes) || 1
  const oneWayMinutes = Math.max(0, oneWayStops - 1) * localSegmentMinutes

  return oneWayMinutes * 2 * 60
}

function getRouteUnlockSeconds(template) {
  if (!template || template.unlockDefault) {
    return 0
  }

  return calculateRouteDurationSeconds(template)
}

function getRouteTotalSegments(route) {
  if (route.service === 'metro') {
    return 18
  }

  const oneWayStops = normalizeNumber(route.oneWayStops) || 10

  return Math.max(1, (oneWayStops - 1) * 2)
}

function getRouteSegmentSeconds(route, segmentIndex, vehicle) {
  const multiplier = Number(BUS_VEHICLE_CATALOG[vehicle?.category]?.timeMultiplier ?? 1)

  if (route.service !== 'metro') {
    const baseSeconds = (normalizeNumber(route.localSegmentMinutes) || 1) * 60
    return Math.max(1, Math.floor(baseSeconds * multiplier))
  }

  const localSeconds = (normalizeNumber(route.localSegmentMinutes) || 3) * 60
  const middleSeconds = (normalizeNumber(route.middleMoveMinutes) || 60) * 60

  if (segmentIndex === 4 || segmentIndex === 13) {
    return Math.max(1, Math.floor(middleSeconds * multiplier))
  }

  return Math.max(1, Math.floor(localSeconds * multiplier))
}

function estimateRoundTripSettlement(route, vehicle) {
  const capacity = normalizeNumber(vehicle?.capacity) || 25
  const fare = normalizeNumber(route?.fare) || 1200
  const stopEvents = getRouteTotalSegments(route) + 1
  const demandRate = clamp(Number(route?.demandRate ?? 0.55), 0.1, 1)

  return Math.floor(capacity * fare * stopEvents * demandRate * 0.22)
}

function ensurePendingChanges(slot) {
  if (!slot.pendingChanges || typeof slot.pendingChanges !== 'object') {
    slot.pendingChanges = createEmptyPendingChanges()
  }

  if (typeof slot.pendingChanges.sellAfterReturn !== 'boolean') {
    slot.pendingChanges.sellAfterReturn = false
  }
}

function createEmptyPendingChanges() {
  return {
    vehicleName: '',
    routeId: '',
    routeNumber: '',
    routeName: '',
    operationMode: '',
    sellAfterReturn: false
  }
}

function clearPendingChanges(slot) {
  slot.pendingChanges = createEmptyPendingChanges()
}

function hasPendingChanges(slot) {
  if (!slot?.pendingChanges) {
    return false
  }

  return Boolean(
    slot.pendingChanges.vehicleName ||
    slot.pendingChanges.routeId ||
    slot.pendingChanges.routeNumber ||
    slot.pendingChanges.routeName ||
    slot.pendingChanges.operationMode ||
    slot.pendingChanges.sellAfterReturn
  )
}

function findBusRoute(routeId) {
  return gameState.routes.find((route) => route.id === routeId && route.mode === 'bus')
}

function findBusRouteByKey(routeKey) {
  return gameState.routes.find((route) => route.routeKey === routeKey && route.mode === 'bus')
}

function findBusVehicle(vehicleId) {
  return gameState.vehicles.find((vehicle) => vehicle.id === vehicleId && vehicle.mode === 'bus')
}

function findBusSlot(slotId) {
  return gameState.operationSlots.find((slot) => slot.id === slotId && slot.mode === 'bus')
}

function getRouteId(routeKey) {
  return `route-bus-${routeKey}`
}

function getRouteDisplayName(route) {
  return `${route.routeNumber} ${route.name}`
}

function getNextBusNumber() {
  const numbers = busSlots.value
    .map((slot) => Number(String(slot.id).replace('BUS-', '')))
    .filter((number) => Number.isFinite(number))

  return numbers.length > 0 ? Math.max(...numbers) + 1 : 1
}

function removeById(list, id) {
  const index = list.findIndex((item) => item.id === id)

  if (index >= 0) {
    list.splice(index, 1)
  }
}

function formatDuration(totalSeconds) {
  const seconds = Math.max(0, normalizeNumber(totalSeconds))

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

function randomInt(min, max) {
  const safeMin = Math.ceil(Math.min(min, max))
  const safeMax = Math.floor(Math.max(min, max))

  if (safeMax <= safeMin) {
    return safeMin
  }

  return Math.floor(Math.random() * (safeMax - safeMin + 1)) + safeMin
}

function normalizeNumber(value) {
  const number = Number(value)

  if (!Number.isFinite(number)) {
    return 0
  }

  return Math.floor(number)
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}