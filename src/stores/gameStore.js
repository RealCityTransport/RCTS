/*
  파일명: src/stores/gameStore.js

  역할:
  - RCTS v2 공용 게임 상태 store입니다.
  - 저장 데이터는 업데이트되어도 초기화하지 않고 필드만 보정합니다.

  표시 정렬:
  - 차량 구입 목록은 연구 완료 차량을 위로, 가격 낮은 순으로 표시합니다.
  - 연구 안 된 차량은 아래로 보냅니다.
  - 연구 목록은 진행 중 → 연구 가능 → 자금 부족 → 잠김 순서로 표시합니다.

  v7 핵심 변경:
  - 버스 Lv.1~Lv.4 구조 추가
  - 마을버스 Lv.3 제거
  - 버스 차량 분류 연구 추가
  - 버스 운행을 정류장 정차/이동 단계형으로 표시
  - 버스 Lv.4 이후 시간표/노선슬롯 구조 준비
  - multi_unlock, auto_save 연구 효과 지원
*/

import { computed, ref } from 'vue'

import { RESEARCH_CATALOG } from '../data/researchCatalog'
import {
  createDefaultGameState,
  GAME_STATE_VERSION,
} from '../state/defaultGameState'
import { loadGame, saveGame } from '../modules/save'
import {
  applyGameTick,
  calculateOfflineProgress,
  createGameClock,
  createInitialBusProgress,
} from '../modules/time'

export const gameState = ref(createDefaultGameState())

export const isGameBooted = ref(false)
export const isSaving = ref(false)
export const standardTime = ref(new Date())

let clock = null
let autoSaveTimer = null

const METRO_BUS_LV1_DURATION_SECONDS = 60 * 60 + 10 * 30 + 8 * 90

export const VEHICLE_CATALOG = [
  /*
    택시
  */
  {
    type: 'taxi_lv1',
    icon: '🚕',
    name: '택시 Lv.1',
    category: '택시',
    durationMode: 'fixed',
    durationSeconds: 10 * 60,
    settlementMode: 'fixed',
    settlementAmount: 8000,
    settlementLabel: '기본요금',
    description: '운행시간 10분 / 기본 택시 운행',
    price: 80000,
    starterLimit: 1,
    requiredUnlock: 'taxiLv1',
    upgradeTo: ['taxi_lv2'],
  },
  {
    type: 'taxi_lv2',
    icon: '🚕',
    name: '택시 Lv.2',
    category: '택시',
    durationMode: 'fixed',
    durationSeconds: 30 * 60,
    settlementMode: 'fixed',
    settlementAmount: 16000,
    settlementLabel: '중거리 택시 운행',
    description: '운행시간 30분 / 정산 16,000R',
    price: 180000,
    requiredUnlock: 'taxiLv2',
    upgradeFrom: ['taxi_lv1'],
    upgradeTo: ['taxi_lv3'],
  },
  {
    type: 'taxi_lv3',
    icon: '🚕',
    name: '택시 Lv.3',
    category: '택시',
    durationMode: 'fixed',
    durationSeconds: 60 * 60,
    settlementMode: 'fixed',
    settlementAmount: 32000,
    settlementLabel: '장거리 택시 운행',
    description: '운행시간 1시간 / 정산 32,000R',
    price: 350000,
    requiredUnlock: 'taxiLv3',
    upgradeFrom: ['taxi_lv2'],
    upgradeTo: ['taxi_real'],
  },
  {
    type: 'taxi_real',
    icon: '🚖',
    name: '택시 리얼',
    category: '택시',
    durationMode: 'random',
    minDurationSeconds: 10 * 60,
    maxDurationSeconds: 2 * 60 * 60,
    settlementMode: 'taxi_real',
    settlementLabel: '실시간 택시 운행',
    description: '10분~2시간 랜덤 / 시외요금·통행료 반영',
    price: 500000,
    requiredUnlock: 'taxiReal',
    upgradeFrom: ['taxi_lv3'],
  },

  /*
    택배
  */
  {
    type: 'parcel_lv1',
    icon: '🚚',
    name: '택배 Lv.1',
    category: '택배',
    durationMode: 'fixed',
    durationSeconds: 30 * 60,
    settlementMode: 'fixed',
    settlementAmount: 30000,
    settlementLabel: '지역 택배 배송',
    description: '운행시간 30분 / 지역 택배 배송',
    price: 120000,
    starterLimit: 1,
    requiredUnlock: 'parcelLv1',
    upgradeTo: ['parcel_lv2'],
  },
  {
    type: 'parcel_lv2',
    icon: '🚚',
    name: '택배 Lv.2',
    category: '택배',
    durationMode: 'fixed',
    durationSeconds: 60 * 60,
    settlementMode: 'fixed',
    settlementAmount: 70000,
    settlementLabel: '확장 택배 배송',
    description: '운행시간 1시간 / 정산 70,000R',
    price: 280000,
    requiredUnlock: 'parcelLv2',
    upgradeFrom: ['parcel_lv1'],
    upgradeTo: ['parcel_lv3'],
  },
  {
    type: 'parcel_lv3',
    icon: '🚚',
    name: '택배 Lv.3',
    category: '택배',
    durationMode: 'fixed',
    durationSeconds: 2 * 60 * 60,
    settlementMode: 'fixed',
    settlementAmount: 160000,
    settlementLabel: '고급 택배 배송',
    description: '운행시간 2시간 / 정산 160,000R',
    price: 650000,
    requiredUnlock: 'parcelLv3',
    upgradeFrom: ['parcel_lv2'],
    upgradeTo: ['parcel_real', 'parcel_line'],
  },
  {
    type: 'parcel_real',
    icon: '📦',
    name: '택배 리얼',
    category: '택배',
    durationMode: 'parcel_count',
    minParcelCount: 30,
    maxParcelCount: 300,
    perParcelAmount: 2500,
    settlementMode: 'parcel_real_count',
    settlementLabel: '건수형 택배 배송',
    description: '30~300건 랜덤 / 1틱 1건 처리 / 건당 2,500R',
    price: 1200000,
    requiredUnlock: 'parcelReal',
    upgradeFrom: ['parcel_lv3'],
  },
  {
    type: 'parcel_line',
    icon: '🚛',
    name: '간선택배',
    category: '택배',
    durationMode: 'fixed',
    durationSeconds: 4 * 60 * 60,
    settlementMode: 'fixed',
    settlementAmount: 320000,
    settlementLabel: '지역 간 간선 운송',
    description: '운행시간 4시간 / 정산 320,000R',
    price: 1200000,
    requiredUnlock: 'parcelLine',
    upgradeFrom: ['parcel_lv3'],
    upgradeTo: ['parcel_local'],
  },
  {
    type: 'parcel_local',
    icon: '🏢',
    name: '지역택배',
    category: '택배',
    durationMode: 'fixed',
    durationSeconds: 8 * 60 * 60,
    settlementMode: 'fixed',
    settlementAmount: 1000000,
    settlementLabel: '지역 거점 택배 운송',
    description: '운행시간 8시간 / 정산 1,000,000R',
    price: 2500000,
    requiredUnlock: 'parcelLocal',
    upgradeFrom: ['parcel_line'],
  },

  /*
    버스 Lv.1

    초기에는 세부 차종을 보여주지 않고 "버스"로만 표시합니다.
    내부적으로는 기존 village_bus_lv1 타입을 유지해서 기존 저장 데이터를 깨지 않도록 합니다.
  */
  {
    type: 'village_bus_lv1',
    icon: '🚌',
    name: '버스',
    category: '버스',
    durationMode: 'bus_stops',
    durationSeconds: 60 * 60,
    routeCycleSeconds: 60 * 60,
    settlementMode: 'bus_route',
    settlementLabel: '마을버스 Lv.1',
    description: '마을버스 Lv.1 / 운행시간 1시간 / 20정류장',
    price: 200000,
    starterLimit: 1,
    requiredUnlocks: ['busLv1'],
    legacyUnlocks: ['villageBusLv1'],
    busServiceType: 'village_bus_lv1',
    busServiceName: '마을버스 Lv.1',
    busPattern: 'local',
    stopCount: 20,
    stopDwellSeconds: 30,
    capacity: 25,
    fareAmount: 1200,
    vehicleBodyType: 'basic_bus',
    upgradeTo: ['village_bus_lv2', 'city_bus_lv1'],
  },

  /*
    버스 Lv.2
  */
  {
    type: 'village_bus_lv2',
    icon: '🚌',
    name: '마을버스 Lv.2',
    category: '버스',
    durationMode: 'bus_stops',
    durationSeconds: 2 * 60 * 60,
    routeCycleSeconds: 2 * 60 * 60,
    settlementMode: 'bus_route',
    settlementLabel: '마을버스 Lv.2',
    description: '운행시간 2시간 / 40정류장 / 생활권 촘촘한 노선',
    price: 450000,
    requiredUnlocks: ['busLv2'],
    busServiceType: 'village_bus_lv2',
    busServiceName: '마을버스 Lv.2',
    busPattern: 'local',
    stopCount: 40,
    stopDwellSeconds: 30,
    capacity: 25,
    fareAmount: 1200,
    vehicleBodyType: 'basic_bus',
    upgradeFrom: ['village_bus_lv1'],
  },
  {
    type: 'city_bus_lv1',
    icon: '🚌',
    name: '시내버스 Lv.1',
    category: '버스',
    durationMode: 'bus_stops',
    durationSeconds: 60 * 60,
    routeCycleSeconds: 60 * 60,
    settlementMode: 'bus_route',
    settlementLabel: '시내버스 Lv.1',
    description: '운행시간 1시간 / 40정류장 / 빠른 회전형 시내 노선',
    price: 650000,
    requiredUnlocks: ['busLv2'],
    busServiceType: 'city_bus_lv1',
    busServiceName: '시내버스 Lv.1',
    busPattern: 'local',
    stopCount: 40,
    stopDwellSeconds: 30,
    capacity: 35,
    fareAmount: 1500,
    vehicleBodyType: 'basic_bus',
    upgradeFrom: ['village_bus_lv1'],
    upgradeTo: ['city_bus_lv2'],
  },

  /*
    버스 Lv.3

    마을버스 Lv.3은 없습니다.
    버스 Lv.3에서는 시내버스 Lv.2와 광역버스 Lv.1이 열립니다.
  */
  {
    type: 'city_bus_lv2',
    icon: '🚌',
    name: '시내버스 Lv.2',
    category: '버스',
    durationMode: 'bus_stops',
    durationSeconds: 90 * 60,
    routeCycleSeconds: 90 * 60,
    settlementMode: 'bus_route',
    settlementLabel: '시내버스 Lv.2',
    description: '운행시간 1시간 30분 / 40정류장 / 상위 시내 노선',
    price: 1100000,
    requiredUnlocks: ['busLv3'],
    busServiceType: 'city_bus_lv2',
    busServiceName: '시내버스 Lv.2',
    busPattern: 'local',
    stopCount: 40,
    stopDwellSeconds: 30,
    capacity: 45,
    fareAmount: 1500,
    vehicleBodyType: 'basic_bus',
    upgradeFrom: ['city_bus_lv1'],
  },
  {
    type: 'metro_bus_lv1',
    icon: '🚍',
    name: '광역버스 Lv.1',
    category: '버스',
    durationMode: 'bus_metro',
    durationSeconds: METRO_BUS_LV1_DURATION_SECONDS,
    routeCycleSeconds: METRO_BUS_LV1_DURATION_SECONDS,
    settlementMode: 'bus_route',
    settlementLabel: '광역버스 Lv.1',
    description: '출발지 5정류장 → 광역 이동 1시간 → 종착지 5정류장',
    price: 1500000,
    requiredUnlocks: ['busLv3'],
    busServiceType: 'metro_bus_lv1',
    busServiceName: '광역버스 Lv.1',
    busPattern: 'metropolitan',
    startStops: 5,
    endStops: 5,
    expressMoveSeconds: 60 * 60,
    stopDwellSeconds: 30,
    accessMoveSeconds: 90,
    capacity: 45,
    fareAmount: 3000,
    vehicleBodyType: 'basic_bus',
  },

  /*
    버스 차량 분류 연구 이후 등장하는 차체

    현재 구조에서는 차량 구입 시 바로 운행 슬롯이 생기므로,
    각 차체는 우선 대표 운행 패턴을 가진 차량으로 동작하게 합니다.
    이후 노선/차량 분리 시스템이 확장되면 이 차체들은 노선 슬롯에 배정되는 차량이 됩니다.
  */
  {
    type: 'small_bus',
    icon: '🚌',
    name: '소형버스',
    category: '버스',
    durationMode: 'bus_stops',
    durationSeconds: 2 * 60 * 60,
    routeCycleSeconds: 2 * 60 * 60,
    settlementMode: 'bus_route',
    settlementLabel: '소형버스 마을 노선',
    description: '25인승 / 마을·생활권 노선용 / 40정류장',
    price: 300000,
    requiredUnlocks: ['busVehicleClass', 'busLv2'],
    busServiceType: 'village_bus_lv2',
    busServiceName: '마을버스 Lv.2',
    busPattern: 'local',
    stopCount: 40,
    stopDwellSeconds: 30,
    capacity: 25,
    fareAmount: 1200,
    vehicleBodyType: 'small_bus',
  },
  {
    type: 'medium_bus',
    icon: '🚌',
    name: '중형버스',
    category: '버스',
    durationMode: 'bus_stops',
    durationSeconds: 60 * 60,
    routeCycleSeconds: 60 * 60,
    settlementMode: 'bus_route',
    settlementLabel: '중형버스 시내 노선',
    description: '35인승 / 시내 노선용 / 40정류장',
    price: 600000,
    requiredUnlocks: ['busVehicleClass', 'busLv2'],
    busServiceType: 'city_bus_lv1',
    busServiceName: '시내버스 Lv.1',
    busPattern: 'local',
    stopCount: 40,
    stopDwellSeconds: 30,
    capacity: 35,
    fareAmount: 1500,
    vehicleBodyType: 'medium_bus',
  },
  {
    type: 'large_bus',
    icon: '🚌',
    name: '대형버스',
    category: '버스',
    durationMode: 'bus_stops',
    durationSeconds: 90 * 60,
    routeCycleSeconds: 90 * 60,
    settlementMode: 'bus_route',
    settlementLabel: '대형버스 시내 상위 노선',
    description: '45인승 / 시내 상위·광역 진입용',
    price: 1000000,
    requiredUnlocks: ['busVehicleClass', 'busLv3'],
    busServiceType: 'city_bus_lv2',
    busServiceName: '시내버스 Lv.2',
    busPattern: 'local',
    stopCount: 40,
    stopDwellSeconds: 30,
    capacity: 45,
    fareAmount: 1500,
    vehicleBodyType: 'large_bus',
  },
  {
    type: 'articulated_bus',
    icon: '🚍',
    name: '굴절버스',
    category: '버스',
    durationMode: 'bus_stops',
    durationSeconds: 90 * 60,
    routeCycleSeconds: 90 * 60,
    settlementMode: 'bus_route',
    settlementLabel: '굴절버스 고수요 시내/BRT 노선',
    description: '70인승 / BRT와 고수요 시내 간선 대응 차량',
    price: 3000000,
    requiredUnlocks: ['articulatedBus'],
    busServiceType: 'city_bus_brt_ready',
    busServiceName: '고수요 시내/BRT 준비 노선',
    busPattern: 'local',
    stopCount: 40,
    stopDwellSeconds: 30,
    capacity: 70,
    fareAmount: 1800,
    vehicleBodyType: 'articulated_bus',
  },
  {
    type: 'double_decker_bus',
    icon: '🚌',
    name: '2층버스',
    category: '버스',
    durationMode: 'bus_metro',
    durationSeconds: METRO_BUS_LV1_DURATION_SECONDS,
    routeCycleSeconds: METRO_BUS_LV1_DURATION_SECONDS,
    settlementMode: 'bus_route',
    settlementLabel: '2층버스 광역 노선',
    description: '80인승 / 고수요 광역버스 확장형',
    price: 3500000,
    requiredUnlocks: ['doubleDeckerBus'],
    busServiceType: 'metro_bus_high_capacity',
    busServiceName: '고수요 광역버스',
    busPattern: 'metropolitan',
    startStops: 5,
    endStops: 5,
    expressMoveSeconds: 60 * 60,
    stopDwellSeconds: 30,
    accessMoveSeconds: 90,
    capacity: 80,
    fareAmount: 3000,
    vehicleBodyType: 'double_decker_bus',
  },
]

const createId = (prefix = 'id') => {
  if (globalThis.crypto?.randomUUID) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const ensureLogs = () => {
  if (!gameState.value.logs) {
    gameState.value.logs = {
      settlements: [],
      system: [],
    }
  }

  if (!Array.isArray(gameState.value.logs.settlements)) {
    gameState.value.logs.settlements = []
  }

  if (!Array.isArray(gameState.value.logs.system)) {
    gameState.value.logs.system = []
  }
}

const addSystemLog = (message) => {
  ensureLogs()

  gameState.value.logs.system.unshift({
    id: createId('log'),
    message,
    createdAt: Date.now(),
  })

  gameState.value.logs.system = gameState.value.logs.system.slice(0, 50)
}

const getVehicleCatalogItem = (type) => {
  return VEHICLE_CATALOG.find((vehicle) => vehicle.type === type)
}

const getResearchCatalogItem = (researchId) => {
  return RESEARCH_CATALOG.find((research) => research.id === researchId)
}

const getCatalogIndex = (catalog, id) => {
  return catalog.findIndex((item) => item.id === id || item.type === id)
}

const getRandomInteger = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

const normalizeRequiredUnlocks = (item) => {
  const requiredUnlocks = []

  if (item?.requiredUnlock) {
    requiredUnlocks.push(item.requiredUnlock)
  }

  if (Array.isArray(item?.requiredUnlocks)) {
    requiredUnlocks.push(...item.requiredUnlocks)
  }

  return requiredUnlocks.filter(Boolean)
}

const normalizeLegacyUnlocks = (item) => {
  if (!Array.isArray(item?.legacyUnlocks)) return []
  return item.legacyUnlocks.filter(Boolean)
}

const isBusVehicleCatalog = (vehicle) => {
  return vehicle?.category === '버스' || vehicle?.durationMode === 'bus_stops' || vehicle?.durationMode === 'bus_metro'
}

const isBusSlot = (slot) => {
  return slot?.category === '버스' || slot?.durationMode === 'bus_stops' || slot?.durationMode === 'bus_metro'
}

const getVehicleInitialDurationSeconds = (vehicle) => {
  if (vehicle.durationMode === 'random') {
    return vehicle.minDurationSeconds ?? 10 * 60
  }

  if (vehicle.durationMode === 'parcel_count') {
    return vehicle.minParcelCount ?? 30
  }

  return vehicle.durationSeconds ?? 0
}

const getVehicleRunDurationSeconds = (vehicle) => {
  if (vehicle.durationMode === 'random') {
    return getRandomInteger(
      vehicle.minDurationSeconds ?? 10 * 60,
      vehicle.maxDurationSeconds ?? 2 * 60 * 60,
    )
  }

  if (vehicle.durationMode === 'parcel_count') {
    return getRandomInteger(
      vehicle.minParcelCount ?? 30,
      vehicle.maxParcelCount ?? 300,
    )
  }

  return vehicle.durationSeconds ?? 0
}

const calculateTaxiRealSettlement = (durationSeconds) => {
  const minutes = Math.ceil(durationSeconds / 60)

  let amount = 16000

  if (minutes > 30) {
    const extraBlocks = Math.ceil((minutes - 30) / 10)
    amount += extraBlocks * 6000
  }

  if (minutes >= 60) {
    amount += 2000
  }

  return amount
}

const calculateBusRouteSettlement = (vehicle) => {
  const capacity = Math.max(1, vehicle.capacity ?? 25)
  const fareAmount = Math.max(0, vehicle.fareAmount ?? 1200)

  const totalStops =
    vehicle.durationMode === 'bus_metro'
      ? (vehicle.startStops ?? 0) + (vehicle.endStops ?? 0)
      : vehicle.stopCount ?? 0

  if (totalStops <= 0 || fareAmount <= 0) {
    return {
      amount: 0,
      passengerStats: {
        capacity,
        totalStops,
        totalBoarded: 0,
        maxOnboard: 0,
      },
    }
  }

  let onboard = getRandomInteger(0, Math.ceil(capacity * 0.6))
  let totalBoarded = onboard
  let maxOnboard = onboard
  let amount = onboard * fareAmount

  for (let stopIndex = 2; stopIndex <= totalStops; stopIndex += 1) {
    const alightMax = Math.min(onboard, Math.ceil(capacity * 0.3))
    const alighted = getRandomInteger(0, alightMax)

    onboard = Math.max(0, onboard - alighted)

    const emptySeats = Math.max(0, capacity - onboard)
    const demandMax = Math.min(emptySeats, Math.ceil(capacity * 0.22))
    const boarded = getRandomInteger(0, demandMax)

    onboard += boarded
    totalBoarded += boarded
    maxOnboard = Math.max(maxOnboard, onboard)
    amount += boarded * fareAmount
  }

  return {
    amount,
    passengerStats: {
      capacity,
      totalStops,
      totalBoarded,
      maxOnboard,
    },
  }
}

const calculateVehicleSettlementAmount = (vehicle, durationSeconds) => {
  if (vehicle.settlementMode === 'taxi_real') {
    return calculateTaxiRealSettlement(durationSeconds)
  }

  if (vehicle.settlementMode === 'parcel_real_count') {
    return 0
  }

  if (vehicle.settlementMode === 'bus_route') {
    return calculateBusRouteSettlement(vehicle).amount
  }

  return vehicle.settlementAmount ?? 0
}

const copyBusCatalogFields = (vehicle) => {
  return {
    busServiceType: vehicle.busServiceType ?? null,
    busServiceName: vehicle.busServiceName ?? null,
    busPattern: vehicle.busPattern ?? null,
    stopCount: vehicle.stopCount ?? null,
    startStops: vehicle.startStops ?? null,
    endStops: vehicle.endStops ?? null,
    expressMoveSeconds: vehicle.expressMoveSeconds ?? null,
    stopDwellSeconds: vehicle.stopDwellSeconds ?? null,
    accessMoveSeconds: vehicle.accessMoveSeconds ?? null,
    capacity: vehicle.capacity ?? null,
    fareAmount: vehicle.fareAmount ?? null,
    vehicleBodyType: vehicle.vehicleBodyType ?? null,
    routeCycleSeconds: vehicle.routeCycleSeconds ?? vehicle.durationSeconds ?? null,
  }
}

const createDefaultRoute = (slot) => {
  const baseName = slot.busServiceName ?? slot.name ?? '버스 노선'

  return {
    number: slot.route?.number ?? '',
    name: slot.route?.name ?? `${baseName} 노선`,
  }
}

const getAssignedVehicleIds = (slot) => {
  if (Array.isArray(slot?.assignedVehicleIds)) {
    return slot.assignedVehicleIds.filter(Boolean)
  }

  if (slot?.vehicleId) {
    return [slot.vehicleId]
  }

  return []
}

const getRouteCycleSeconds = (slot) => {
  return Math.max(
    1,
    slot?.routeCycleSeconds ??
      slot?.durationSeconds ??
      slot?.originalDurationSeconds ??
      1,
  )
}

const createDefaultTimetable = (slot) => {
  return {
    level: 1,
    mode: 'auto_ratio',
    open: false,

    routeCycleSeconds: getRouteCycleSeconds(slot),

    headwaySeconds: null,
    targetHeadwaySeconds: null,
    requiredVehicleCount: 0,
    shortageVehicleCount: 0,

    firstBusTime: '05:00',
    lastBusTime: '23:30',
    normalHeadwaySeconds: null,

    morningPeakStart: '07:00',
    morningPeakEnd: '09:00',
    morningPeakHeadwaySeconds: null,

    eveningPeakStart: '17:30',
    eveningPeakEnd: '20:00',
    eveningPeakHeadwaySeconds: null,

    nightEnabled: false,
    nightHeadwaySeconds: null,
  }
}

const ensureRouteSlotFields = (slot) => {
  if (!slot) return slot

  if (!slot.route) {
    slot.route = createDefaultRoute(slot)
  }

  if (!Array.isArray(slot.assignedVehicleIds)) {
    slot.assignedVehicleIds = slot.vehicleId ? [slot.vehicleId] : []
  }

  if (!slot.timetable) {
    slot.timetable = createDefaultTimetable(slot)
  }

  slot.timetable.routeCycleSeconds = getRouteCycleSeconds(slot)

  return slot
}

const applyPendingRouteSettings = (slot) => {
  if (!slot) return

  if (slot.pendingRouteSettings) {
    slot.route = {
      ...(slot.route ?? createDefaultRoute(slot)),
      ...slot.pendingRouteSettings,
    }

    slot.pendingRouteSettings = null
  }

  if (slot.pendingTimetableSettings) {
    slot.timetable = {
      ...(slot.timetable ?? createDefaultTimetable(slot)),
      ...slot.pendingTimetableSettings,
    }

    slot.pendingTimetableSettings = null
  }
}

const convertBusSlotToRouteSlotIfUnlocked = (slot) => {
  if (!slot || !isBusSlot(slot)) return slot
  if (!gameState.value.unlocks?.busTimetableBasic) return slot

  slot.slotType = 'route'
  slot.mode = 'timetable_route'
  slot.routeStatus = slot.routeStatus ?? 'ready'

  ensureRouteSlotFields(slot)

  return slot
}

const applyVehicleCatalogToSlot = (slot, vehicle, purchasePrice = slot.purchasePrice ?? 0) => {
  const initialDuration = getVehicleInitialDurationSeconds(vehicle)
  const busFields = copyBusCatalogFields(vehicle)

  return {
    ...slot,

    slotType: 'vehicle',
    routeStatus: null,

    type: vehicle.type,
    icon: vehicle.icon,
    name: vehicle.name,
    category: vehicle.category,
    description: vehicle.description,

    durationMode: vehicle.durationMode ?? 'fixed',
    durationSeconds: initialDuration,
    originalDurationSeconds: initialDuration,
    minDurationSeconds: vehicle.minDurationSeconds ?? null,
    maxDurationSeconds: vehicle.maxDurationSeconds ?? null,

    minParcelCount: vehicle.minParcelCount ?? null,
    maxParcelCount: vehicle.maxParcelCount ?? null,
    perParcelAmount: vehicle.perParcelAmount ?? null,
    totalParcels: null,
    remainingParcels: null,
    processedParcels: 0,

    ...busFields,

    busProgress: null,
    passengerStats: null,

    settlementMode: vehicle.settlementMode ?? 'fixed',
    settlementAmount:
      vehicle.settlementMode === 'parcel_real_count'
        ? 0
        : vehicle.settlementAmount ?? 0,
    settlementLabel: vehicle.settlementLabel ?? '정산',

    purchasePrice,

    remainingSeconds: initialDuration,
    startedAt: null,
    completedAt: null,
    settledAt: null,

    runSnapshot: {
      funding: false,
    },
  }
}

const applyResearchEffectToState = (targetState, research) => {
  if (!research?.effect) {
    return false
  }

  if (!targetState.unlocks) {
    targetState.unlocks = {}
  }

  if (!targetState.limits) {
    targetState.limits = {
      maxOperationSlots: 3,
      operationSlotUnlimited: false,
    }
  }

  if (!targetState.time) {
    targetState.time = {}
  }

  if (research.effect.type === 'funding') {
    if (targetState.unlocks.funding) return false
    targetState.unlocks.funding = true
    return true
  }

  if (research.effect.type === 'slot_limit') {
    const currentLimit = targetState.limits.maxOperationSlots ?? 3
    const nextLimit = research.effect.value ?? currentLimit

    if (currentLimit >= nextLimit) return false

    targetState.limits.maxOperationSlots = nextLimit
    return true
  }

  if (research.effect.type === 'slot_sell') {
    if (targetState.unlocks.operationSlotSell) return false
    targetState.unlocks.operationSlotSell = true
    return true
  }

  if (research.effect.type === 'offline_progress') {
    if (targetState.unlocks.offlineProgress) return false
    targetState.unlocks.offlineProgress = true
    targetState.time.offlineProgressUnlocked = true
    return true
  }

  if (research.effect.type === 'auto_save') {
    if (targetState.unlocks.autoSave) return false
    targetState.unlocks.autoSave = true
    targetState.time.autoSaveUnlocked = true
    return true
  }

  if (research.effect.type === 'auto_settlement') {
    if (targetState.unlocks.autoSettlement) return false
    targetState.unlocks.autoSettlement = true
    return true
  }

  if (research.effect.type === 'slot_limit_unlimited') {
    if (targetState.unlocks.operationSlotUnlimited) return false
    targetState.unlocks.operationSlotUnlimited = true
    targetState.limits.operationSlotUnlimited = true
    return true
  }

  if (research.effect.type === 'vehicle_unlock') {
    const key = research.effect.unlockKey

    if (!key) return false
    if (targetState.unlocks[key]) return false

    targetState.unlocks[key] = true
    return true
  }

  if (research.effect.type === 'multi_unlock') {
    const keys = research.effect.unlockKeys ?? []
    let changed = false

    keys.forEach((key) => {
      if (!key) return
      if (targetState.unlocks[key]) return

      targetState.unlocks[key] = true
      changed = true
    })

    return changed
  }

  return false
}

const migrateGameState = (savedGame) => {
  const base = createDefaultGameState()

  if (!savedGame || typeof savedGame !== 'object') {
    return base
  }

  const merged = {
    ...base,
    ...savedGame,
    company: {
      ...base.company,
      ...(savedGame.company ?? {}),
    },
    research: {
      ...base.research,
      ...(savedGame.research ?? {}),
      completed: Array.isArray(savedGame.research?.completed)
        ? savedGame.research.completed
        : [],
    },
    unlocks: {
      ...base.unlocks,
      ...(savedGame.unlocks ?? {}),
    },
    limits: {
      ...base.limits,
      ...(savedGame.limits ?? {}),
    },
    time: {
      ...base.time,
      ...(savedGame.time ?? {}),
    },
    logs: {
      ...base.logs,
      ...(savedGame.logs ?? {}),
      settlements: Array.isArray(savedGame.logs?.settlements)
        ? savedGame.logs.settlements
        : [],
      system: Array.isArray(savedGame.logs?.system) ? savedGame.logs.system : [],
    },
  }

  merged.version = GAME_STATE_VERSION

  if (!Array.isArray(merged.vehicles)) merged.vehicles = []
  if (!Array.isArray(merged.operationSlots)) merged.operationSlots = []
  if (!Array.isArray(merged.research.completed)) merged.research.completed = []

  merged.research.completed.forEach((completedResearch) => {
    const catalog = getResearchCatalogItem(completedResearch.id)

    if (catalog) {
      applyResearchEffectToState(merged, catalog)
    }
  })

  if (merged.unlocks.villageBusLv1 && !merged.unlocks.busLv1) {
    merged.unlocks.busLv1 = true
  }

  merged.time.offlineProgressUnlocked = Boolean(
    merged.time.offlineProgressUnlocked || merged.unlocks.offlineProgress,
  )

  merged.time.autoSaveUnlocked = Boolean(
    merged.time.autoSaveUnlocked || merged.unlocks.autoSave,
  )

  merged.operationSlots = merged.operationSlots.map((slot) => {
    const catalog = getVehicleCatalogItem(slot.type)
    const vehicle = merged.vehicles.find((item) => item.id === slot.vehicleId)

    const purchasePrice =
      Number.isFinite(slot.purchasePrice)
        ? slot.purchasePrice
        : Number.isFinite(vehicle?.price)
          ? vehicle.price
          : 0

    const durationSeconds =
      slot.durationSeconds ??
      catalog?.durationSeconds ??
      catalog?.minDurationSeconds ??
      catalog?.minParcelCount ??
      0

    const migratedSlot = {
      ...slot,

      icon: slot.icon ?? catalog?.icon ?? '🚗',
      name:
        slot.type === 'village_bus_lv1'
          ? slot.name === '마을버스 Lv.1'
            ? '버스'
            : slot.name ?? catalog?.name ?? '버스'
          : slot.name ?? catalog?.name ?? '차량',
      category: slot.category ?? catalog?.category ?? '운송',
      description: slot.description ?? catalog?.description ?? '',

      slotType: slot.slotType ?? 'vehicle',
      routeStatus: slot.routeStatus ?? null,

      durationMode: slot.durationMode ?? catalog?.durationMode ?? 'fixed',
      durationSeconds,
      originalDurationSeconds: slot.originalDurationSeconds ?? durationSeconds,
      minDurationSeconds: slot.minDurationSeconds ?? catalog?.minDurationSeconds ?? null,
      maxDurationSeconds: slot.maxDurationSeconds ?? catalog?.maxDurationSeconds ?? null,

      minParcelCount: slot.minParcelCount ?? catalog?.minParcelCount ?? null,
      maxParcelCount: slot.maxParcelCount ?? catalog?.maxParcelCount ?? null,
      perParcelAmount: slot.perParcelAmount ?? catalog?.perParcelAmount ?? null,
      totalParcels: slot.totalParcels ?? null,
      remainingParcels: slot.remainingParcels ?? null,
      processedParcels: slot.processedParcels ?? 0,

      ...copyBusCatalogFields(catalog ?? {}),

      busProgress: slot.busProgress ?? null,
      passengerStats: slot.passengerStats ?? null,

      remainingSeconds: slot.remainingSeconds ?? durationSeconds,

      settlementMode: slot.settlementMode ?? catalog?.settlementMode ?? 'fixed',
      settlementAmount: slot.settlementAmount ?? catalog?.settlementAmount ?? 0,
      settlementLabel: slot.settlementLabel ?? catalog?.settlementLabel ?? '정산',

      purchasePrice,

      runSnapshot: slot.runSnapshot ?? {
        funding: false,
      },

      createdAt: slot.createdAt ?? Date.now(),
      startedAt: slot.startedAt ?? null,
      completedAt: slot.completedAt ?? null,
      settledAt: slot.settledAt ?? null,
    }

    if (migratedSlot.slotType === 'route') {
      ensureRouteSlotFields(migratedSlot)
    }

    return migratedSlot
  })

  return merged
}

export const formatRemainTime = (seconds = 0) => {
  const safeSeconds = Math.max(0, Math.floor(seconds))
  const hour = Math.floor(safeSeconds / 3600)
  const minute = Math.floor((safeSeconds % 3600) / 60)
  const second = safeSeconds % 60

  if (hour > 0) return `${hour}시간 ${minute}분`

  return `${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`
}

const formatMinuteHeadway = (seconds) => {
  if (!Number.isFinite(seconds) || seconds <= 0) return '-'
  const minute = Math.ceil(seconds / 60)
  return `${minute}분`
}

export const money = computed(() => gameState.value?.money ?? 0)

export const formattedMoney = computed(() => {
  return `${money.value.toLocaleString()}R`
})

export const isFundingUnlocked = computed(() => Boolean(gameState.value?.unlocks?.funding))
export const isOperationSlotSellUnlocked = computed(() => Boolean(gameState.value?.unlocks?.operationSlotSell))
export const isAutoSaveUnlocked = computed(() => Boolean(gameState.value?.unlocks?.autoSave))
export const isAutoSettlementUnlocked = computed(() => Boolean(gameState.value?.unlocks?.autoSettlement))
export const isOperationSlotUnlimitedUnlocked = computed(() => Boolean(gameState.value?.unlocks?.operationSlotUnlimited))

export const isBusTimetableBasicUnlocked = computed(() => Boolean(gameState.value?.unlocks?.busTimetableBasic))
export const isBusTimetable2Unlocked = computed(() => Boolean(gameState.value?.unlocks?.busTimetable2))
export const isBusTimetable3Unlocked = computed(() => Boolean(gameState.value?.unlocks?.busTimetable3))
export const isBusTimetable4Unlocked = computed(() => Boolean(gameState.value?.unlocks?.busTimetable4))

export const maxOperationSlotCount = computed(() => {
  if (isOperationSlotUnlimitedUnlocked.value) return Infinity
  return gameState.value?.limits?.maxOperationSlots ?? 3
})

export const currentOperationSlotCount = computed(() => {
  return gameState.value?.operationSlots?.length ?? 0
})

export const isOperationSlotLimitReached = computed(() => {
  if (isOperationSlotUnlimitedUnlocked.value) return false
  return currentOperationSlotCount.value >= maxOperationSlotCount.value
})

export const operationSlotMenuBadge = computed(() => {
  if (isOperationSlotUnlimitedUnlocked.value) {
    return `${currentOperationSlotCount.value}/∞`
  }

  return `${currentOperationSlotCount.value}/${maxOperationSlotCount.value}`
})

export const operationSlotLimitText = computed(() => {
  if (isOperationSlotUnlimitedUnlocked.value) return '무제한'
  return `${maxOperationSlotCount.value}`
})

const completedResearchIds = computed(() => {
  return (gameState.value.research?.completed ?? []).map((item) => item.id)
})

const isResearchEffectAlreadyApplied = (research) => {
  if (!research?.effect) return false

  if (research.effect.type === 'funding') return Boolean(gameState.value.unlocks?.funding)
  if (research.effect.type === 'slot_sell') return Boolean(gameState.value.unlocks?.operationSlotSell)
  if (research.effect.type === 'offline_progress') return Boolean(gameState.value.unlocks?.offlineProgress)
  if (research.effect.type === 'auto_save') return Boolean(gameState.value.unlocks?.autoSave)
  if (research.effect.type === 'auto_settlement') return Boolean(gameState.value.unlocks?.autoSettlement)
  if (research.effect.type === 'slot_limit_unlimited') return Boolean(gameState.value.unlocks?.operationSlotUnlimited)

  if (research.effect.type === 'slot_limit') {
    const currentLimit = gameState.value.limits?.maxOperationSlots ?? 3
    return currentLimit >= (research.effect.value ?? 3)
  }

  if (research.effect.type === 'vehicle_unlock') {
    return Boolean(gameState.value.unlocks?.[research.effect.unlockKey])
  }

  if (research.effect.type === 'multi_unlock') {
    const keys = research.effect.unlockKeys ?? []
    return keys.length > 0 && keys.every((key) => Boolean(gameState.value.unlocks?.[key]))
  }

  return false
}

export const isResearchCompleted = (researchId) => {
  if (completedResearchIds.value.includes(researchId)) return true

  const catalog = getResearchCatalogItem(researchId)
  return isResearchEffectAlreadyApplied(catalog)
}

export const isResearchRunning = (researchId) => {
  return gameState.value.research?.running?.id === researchId
}

export const getResearchName = (researchId) => {
  return getResearchCatalogItem(researchId)?.name ?? researchId
}

export const isResearchPrerequisiteMet = (research) => {
  const prerequisites = research.prerequisites ?? []
  return prerequisites.every((requiredId) => isResearchCompleted(requiredId))
}

export const getResearchPrerequisiteText = (research) => {
  const prerequisites = research.prerequisites ?? []

  if (prerequisites.length === 0) return '없음'

  const missing = prerequisites.filter((id) => !isResearchCompleted(id))

  if (missing.length === 0) return '충족'

  return missing.map((id) => getResearchName(id)).join(', ')
}

export const getResearchStatusText = (research) => {
  if (research.status === 'running') return '진행 중'
  if (research.status === 'completed') return '완료'
  if (!research.prerequisiteMet) return '잠김'
  if ((gameState.value.money ?? 0) < research.cost) return '자금 부족'
  if (gameState.value.research?.running) return '대기'
  return '연구 가능'
}

export const researches = computed(() => {
  return RESEARCH_CATALOG.map((research) => {
    const running = gameState.value.research?.running
    const runningMatched = running?.id === research.id
    const completedMatched = isResearchCompleted(research.id)
    const prerequisiteMet = isResearchPrerequisiteMet(research)

    return {
      ...research,
      prerequisiteMet,
      status: completedMatched ? 'completed' : runningMatched ? 'running' : 'waiting',
      remainingSeconds: runningMatched ? running.remainingSeconds : research.durationSeconds,
      progress: runningMatched
        ? Math.round(((research.durationSeconds - running.remainingSeconds) / research.durationSeconds) * 100)
        : completedMatched
          ? 100
          : 0,
    }
  })
})

const getResearchSortWeight = (research) => {
  if (research.status === 'running') return 0

  if (research.status === 'waiting' && research.prerequisiteMet && money.value >= research.cost) {
    return 1
  }

  if (research.status === 'waiting' && research.prerequisiteMet && money.value < research.cost) {
    return 2
  }

  return 3
}

export const researchListForView = computed(() => {
  return researches.value
    .filter((research) => research.status !== 'completed')
    .sort((a, b) => {
      const weightDiff = getResearchSortWeight(a) - getResearchSortWeight(b)

      if (weightDiff !== 0) return weightDiff

      const aWeight = getResearchSortWeight(a)

      if (aWeight === 1 || aWeight === 2) {
        const durationDiff = (a.durationSeconds ?? 0) - (b.durationSeconds ?? 0)
        if (durationDiff !== 0) return durationDiff
      }

      const aIndex = getCatalogIndex(RESEARCH_CATALOG, a.id)
      const bIndex = getCatalogIndex(RESEARCH_CATALOG, b.id)

      return aIndex - bIndex
    })
})

export const availableResearches = researchListForView

export const runningResearchTask = computed(() => {
  const running = gameState.value.research?.running
  if (!running) return null

  const catalog = getResearchCatalogItem(running.id)
  const durationSeconds = running.durationSeconds ?? catalog?.durationSeconds ?? 0
  const remainingSeconds = running.remainingSeconds ?? durationSeconds

  return {
    kind: 'research',
    id: running.id,
    icon: running.icon ?? catalog?.icon ?? '🧪',
    name: running.name ?? catalog?.name ?? '연구',
    description: running.description ?? catalog?.description ?? '',
    status: 'running',
    durationSeconds,
    remainingSeconds,
    progress:
      durationSeconds > 0
        ? Math.round(((durationSeconds - remainingSeconds) / durationSeconds) * 100)
        : 0,
    createdAt: running.startedAt ?? Date.now(),
    startedAt: running.startedAt ?? null,
  }
})

const getOperationDashboardSortWeight = (item) => {
  if (item.kind === 'vehicle' && item.status === 'completed') return 0
  if (item.kind === 'vehicle' && item.status === 'waiting') return 1
  if (item.status === 'running') return 2
  return 3
}

const getOperationDashboardSortSeconds = (item) => {
  if (item.kind === 'vehicle' && item.status === 'completed') return item.completedAt ?? 0
  if (item.kind === 'vehicle' && item.status === 'waiting') return item.durationSeconds ?? item.remainingSeconds ?? 0
  if (item.status === 'running') return item.remainingSeconds ?? 0
  return item.durationSeconds ?? item.remainingSeconds ?? 0
}

export const operationSlots = computed(() => {
  const slots = gameState.value?.operationSlots ?? []

  return [...slots].sort((a, b) => {
    const statusDiff =
      getOperationDashboardSortWeight({ kind: 'vehicle', ...a }) -
      getOperationDashboardSortWeight({ kind: 'vehicle', ...b })

    if (statusDiff !== 0) return statusDiff

    const secondsDiff =
      getOperationDashboardSortSeconds({ kind: 'vehicle', ...a }) -
      getOperationDashboardSortSeconds({ kind: 'vehicle', ...b })

    if (secondsDiff !== 0) return secondsDiff

    return (a.createdAt ?? 0) - (b.createdAt ?? 0)
  })
})

export const operationDashboardItems = computed(() => {
  const vehicleItems = (gameState.value?.operationSlots ?? []).map((slot) => ({
    kind: 'vehicle',
    ...slot,
  }))

  const researchItem = runningResearchTask.value
  const items = researchItem ? [...vehicleItems, researchItem] : vehicleItems

  return items.sort((a, b) => {
    const statusDiff = getOperationDashboardSortWeight(a) - getOperationDashboardSortWeight(b)
    if (statusDiff !== 0) return statusDiff

    const secondsDiff = getOperationDashboardSortSeconds(a) - getOperationDashboardSortSeconds(b)
    if (secondsDiff !== 0) return secondsDiff

    return (a.createdAt ?? 0) - (b.createdAt ?? 0)
  })
})

export const vehicles = computed(() => gameState.value?.vehicles ?? [])

export const standardTimeText = computed(() => {
  const date = standardTime.value
  const yyyy = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')

  return `${yyyy}.${month}.${day} ${hour}:${minute}`
})

export const isVehicleUnlocked = (vehicle) => {
  const requiredUnlocks = normalizeRequiredUnlocks(vehicle)
  const legacyUnlocks = normalizeLegacyUnlocks(vehicle)

  if (requiredUnlocks.length === 0) return true

  const requiredMet = requiredUnlocks.every((key) => Boolean(gameState.value.unlocks?.[key]))
  const legacyMet = legacyUnlocks.some((key) => Boolean(gameState.value.unlocks?.[key]))

  return requiredMet || legacyMet
}

const isVehicleVisible = (vehicle) => {
  if (vehicle.hiddenAfterUnlock && gameState.value.unlocks?.[vehicle.hiddenAfterUnlock]) {
    return false
  }

  return true
}

export const vehicleListForView = computed(() => {
  return [...VEHICLE_CATALOG]
    .filter(isVehicleVisible)
    .sort((a, b) => {
      const aUnlocked = isVehicleUnlocked(a)
      const bUnlocked = isVehicleUnlocked(b)

      if (aUnlocked !== bUnlocked) {
        return aUnlocked ? -1 : 1
      }

      if (aUnlocked && bUnlocked) {
        const priceDiff = (a.price ?? 0) - (b.price ?? 0)
        if (priceDiff !== 0) return priceDiff
      }

      const aIndex = getCatalogIndex(VEHICLE_CATALOG, a.type)
      const bIndex = getCatalogIndex(VEHICLE_CATALOG, b.type)

      return aIndex - bIndex
    })
})

export const getOwnedVehicleCount = (type) => {
  return vehicles.value.filter((vehicle) => vehicle.type === type).length
}

export const canBuyVehicle = (vehicle) => {
  const ownedCount = getOwnedVehicleCount(vehicle.type)

  if (!isVehicleUnlocked(vehicle)) return false
  if (isOperationSlotLimitReached.value) return false

  if (!isFundingUnlocked.value) {
    return ownedCount < (vehicle.starterLimit ?? 0)
  }

  return money.value >= vehicle.price
}

export const getVehiclePriceText = (vehicle) => {
  if (!isVehicleUnlocked(vehicle)) return '연구 필요'

  if (!isFundingUnlocked.value) {
    const ownedCount = getOwnedVehicleCount(vehicle.type)

    if (ownedCount >= (vehicle.starterLimit ?? 0)) return '초기 1대 완료'

    return '초기 무료'
  }

  return `${vehicle.price.toLocaleString()}R`
}

export const getVehicleButtonText = (vehicle) => {
  const ownedCount = getOwnedVehicleCount(vehicle.type)

  if (!isVehicleUnlocked(vehicle)) return '연구 필요'
  if (isOperationSlotLimitReached.value) return '슬롯 한도'

  if (!isFundingUnlocked.value && ownedCount >= (vehicle.starterLimit ?? 0)) {
    return '구입 완료'
  }

  if (isFundingUnlocked.value && money.value < vehicle.price) return '자금 부족'

  return '구입'
}

export const buyVehicle = async (vehicleType) => {
  const vehicle = getVehicleCatalogItem(vehicleType)

  if (!vehicle) return
  if (!canBuyVehicle(vehicle)) return

  const purchasePrice = isFundingUnlocked.value ? vehicle.price : 0

  if (purchasePrice > 0) {
    gameState.value.money = Math.max(0, (gameState.value.money ?? 0) - purchasePrice)
  }

  const vehicleId = createId('vehicle')
  const durationSeconds = getVehicleInitialDurationSeconds(vehicle)
  const busFields = copyBusCatalogFields(vehicle)

  gameState.value.vehicles.push({
    id: vehicleId,
    type: vehicle.type,
    icon: vehicle.icon,
    name: vehicle.name,
    category: vehicle.category,
    purchasedAt: Date.now(),
    price: purchasePrice,
    capacity: vehicle.capacity ?? null,
    vehicleBodyType: vehicle.vehicleBodyType ?? null,
  })

  gameState.value.operationSlots.push({
    id: createId('slot'),
    vehicleId,
    type: vehicle.type,
    icon: vehicle.icon,
    name: vehicle.name,
    category: vehicle.category,
    status: 'waiting',
    slotType: 'vehicle',
    routeStatus: null,
    mode: 'countdown',

    durationMode: vehicle.durationMode ?? 'fixed',
    durationSeconds,
    originalDurationSeconds: durationSeconds,
    minDurationSeconds: vehicle.minDurationSeconds ?? null,
    maxDurationSeconds: vehicle.maxDurationSeconds ?? null,

    minParcelCount: vehicle.minParcelCount ?? null,
    maxParcelCount: vehicle.maxParcelCount ?? null,
    perParcelAmount: vehicle.perParcelAmount ?? null,
    totalParcels: null,
    remainingParcels: null,
    processedParcels: 0,

    ...busFields,

    busProgress: null,
    passengerStats: null,
    routeVehicleRuns: null,

    remainingSeconds: durationSeconds,

    settlementMode: vehicle.settlementMode ?? 'fixed',
    settlementAmount:
      vehicle.settlementMode === 'parcel_real_count'
        ? 0
        : vehicle.settlementAmount ?? 0,
    settlementLabel: vehicle.settlementLabel,

    description: vehicle.description,
    purchasePrice,

    runSnapshot: {
      funding: false,
    },

    createdAt: Date.now(),
    startedAt: null,
    completedAt: null,
    settledAt: null,
  })

  await safeSaveGame()
}

const normalizeUpgradeTo = (vehicle) => {
  if (!vehicle?.upgradeTo) return []
  return Array.isArray(vehicle.upgradeTo) ? vehicle.upgradeTo : [vehicle.upgradeTo]
}

export const getNextUpgradeVehicles = (slot) => {
  if (!slot || slot.kind === 'research') return []
  if (slot.slotType === 'route') return []

  const currentVehicle = getVehicleCatalogItem(slot.type)
  const upgradeTypes = normalizeUpgradeTo(currentVehicle)

  return upgradeTypes
    .map((type) => getVehicleCatalogItem(type))
    .filter(Boolean)
}

export const getNextUpgradeVehicle = (slot) => {
  return getNextUpgradeVehicles(slot)[0] ?? null
}

export const getSlotUpgradeCost = (slot, nextVehicleType = null) => {
  const nextVehicle = nextVehicleType
    ? getVehicleCatalogItem(nextVehicleType)
    : getNextUpgradeVehicle(slot)

  if (!nextVehicle) return 0

  return Math.max(0, nextVehicle.price - (slot.purchasePrice ?? 0))
}

export const canUpgradeOperationSlot = (slot, nextVehicleType = null) => {
  const nextVehicle = nextVehicleType
    ? getVehicleCatalogItem(nextVehicleType)
    : getNextUpgradeVehicle(slot)

  if (!nextVehicle) return false
  if (slot.status !== 'waiting') return false
  if (slot.slotType === 'route') return false
  if (!isVehicleUnlocked(nextVehicle)) return false

  return money.value >= getSlotUpgradeCost(slot, nextVehicle.type)
}

export const getSlotUpgradeButtonText = (slot, nextVehicleType = null) => {
  const nextVehicle = nextVehicleType
    ? getVehicleCatalogItem(nextVehicleType)
    : getNextUpgradeVehicle(slot)

  if (!nextVehicle) return ''

  if (slot.slotType === 'route') return '노선 슬롯 업글 불가'
  if (slot.status !== 'waiting') return '운행 중 업글 불가'
  if (!isVehicleUnlocked(nextVehicle)) return `${nextVehicle.name} 연구 필요`

  const cost = getSlotUpgradeCost(slot, nextVehicle.type)

  if (money.value < cost) return `${nextVehicle.name} 자금 부족`

  return `${nextVehicle.name} 업글 ${cost.toLocaleString()}R`
}

export const upgradeOperationSlot = async (slotId, nextVehicleType = null) => {
  const slot = gameState.value.operationSlots.find((item) => item.id === slotId)

  if (!slot) return

  const nextVehicle = nextVehicleType
    ? getVehicleCatalogItem(nextVehicleType)
    : getNextUpgradeVehicle(slot)

  if (!nextVehicle) return
  if (!canUpgradeOperationSlot(slot, nextVehicle.type)) return

  const upgradeCost = getSlotUpgradeCost(slot, nextVehicle.type)

  if (upgradeCost > 0) {
    gameState.value.money = Math.max(0, (gameState.value.money ?? 0) - upgradeCost)
  }

  const nextPurchasePrice = (slot.purchasePrice ?? 0) + upgradeCost
  const upgradedSlot = applyVehicleCatalogToSlot(slot, nextVehicle, nextPurchasePrice)

  gameState.value.operationSlots = gameState.value.operationSlots.map((item) => {
    if (item.id !== slot.id) return item
    return upgradedSlot
  })

  gameState.value.vehicles = gameState.value.vehicles.map((vehicle) => {
    if (vehicle.id !== slot.vehicleId) return vehicle

    return {
      ...vehicle,
      type: nextVehicle.type,
      icon: nextVehicle.icon,
      name: nextVehicle.name,
      category: nextVehicle.category,
      price: nextPurchasePrice,
      capacity: nextVehicle.capacity ?? null,
      vehicleBodyType: nextVehicle.vehicleBodyType ?? null,
      upgradedAt: Date.now(),
    }
  })

  addSystemLog(`${slot.name} → ${nextVehicle.name} 업그레이드 완료`)

  await safeSaveGame()
}

export const isSlotFundingApplied = (slot) => {
  if (slot.kind === 'research') return false
  if (slot.status === 'waiting') return isFundingUnlocked.value
  return Boolean(slot.runSnapshot?.funding)
}

export const getSlotStatusText = (slot) => {
  if (slot.kind === 'research') return '연구 중'

  if (slot.slotType === 'route') {
    if (slot.status === 'running') return '시간표 운행 중'

    if (slot.status === 'completed') {
      if (isSlotFundingApplied(slot)) return '노선 정산 대기'
      return '노선 운행 완료'
    }

    const assignedCount = getAssignedVehicleIds(slot).length
    if (assignedCount <= 0) return '차량 없음'

    return '노선 대기'
  }

  if (slot.status === 'running') return '운행 중'

  if (slot.status === 'completed') {
    if (isSlotFundingApplied(slot)) return '정산 대기'
    return '운행 완료'
  }

  return '대기'
}

export const getSlotButtonText = (slot) => {
  if (slot.kind === 'research') return '진행 중'
  if (slot.status === 'running') return '운행 중'

  if (slot.status === 'completed') {
    if (isSlotFundingApplied(slot)) return '정산하기'
    return '완료 확인'
  }

  if (slot.slotType === 'route') {
    const assignedCount = getAssignedVehicleIds(slot).length
    if (assignedCount <= 0) return '차량 배정 필요'
    return '시간표 개시'
  }

  return '운행 시작'
}

export const getSlotRemainText = (slot) => {
  if (slot.kind === 'research') return formatRemainTime(slot.remainingSeconds)

  if (slot.durationMode === 'parcel_count') {
    if (slot.status === 'running') {
      return `${slot.remainingParcels ?? 0}건`
    }

    if (slot.status === 'completed') {
      return '0건'
    }

    return `${slot.minParcelCount ?? 30}~${slot.maxParcelCount ?? 300}건`
  }

  if (slot.slotType === 'route' && slot.status === 'running') {
    const waitingRuns = (slot.routeVehicleRuns ?? [])
      .filter((run) => run.status === 'waiting_departure')
      .sort((a, b) => (a.nextDepartureInSeconds ?? 0) - (b.nextDepartureInSeconds ?? 0))

    if (waitingRuns.length > 0) {
      return `다음 ${formatRemainTime(waitingRuns[0].nextDepartureInSeconds ?? 0)}`
    }
  }

  if (isBusSlot(slot) && slot.status === 'running' && slot.busProgress?.phaseRemainingSeconds) {
    return formatRemainTime(slot.busProgress.phaseRemainingSeconds)
  }

  return formatRemainTime(slot.remainingSeconds)
}

export const getSlotProgressText = (slot) => {
  if (slot.kind === 'research') return `${slot.progress ?? 0}%`

  if (slot.durationMode === 'parcel_count') {
    if (slot.status === 'running' || slot.status === 'completed') {
      return `${slot.processedParcels ?? 0}/${slot.totalParcels ?? 0}건`
    }

    return '건수 랜덤'
  }

  if (isBusSlot(slot)) {
    const capacity = slot.passengerStats?.capacity ?? slot.capacity ?? 0
    const totalBoarded = slot.passengerStats?.totalBoarded ?? 0

    if (slot.status === 'waiting') {
      return `${slot.capacity ?? 0}인승`
    }

    if (totalBoarded > 0) {
      return `${totalBoarded}명 / ${capacity}인승`
    }
  }

  return getSlotSettlementText(slot)
}

export const getSlotSettlementText = (slot) => {
  if (slot.kind === 'research') return '해금 대기'

  if (slot.settlementMode === 'parcel_real_count') {
    if (slot.status === 'waiting') {
      return `건당 ${(slot.perParcelAmount ?? 2500).toLocaleString()}R`
    }

    return `${(slot.settlementAmount ?? 0).toLocaleString()}R`
  }

  if (slot.status === 'waiting') {
    if (isFundingUnlocked.value) {
      return `${(slot.settlementAmount ?? 0).toLocaleString()}R`
    }

    return '연구 필요'
  }

  if (!isSlotFundingApplied(slot)) return '미적용'

  return `${(slot.settlementAmount ?? 0).toLocaleString()}R`
}

export const getBusOperationDetailText = (slot) => {
  if (!slot || slot.kind === 'research') return ''
  if (!isBusSlot(slot)) return ''

  if (slot.slotType === 'route') {
    const info = getSlotTimetableInfo(slot)
    const activeRuns = (slot.routeVehicleRuns ?? []).filter((run) => run.status === 'running').length
    const waitingRuns = (slot.routeVehicleRuns ?? []).filter((run) => run.status === 'waiting_departure').length

    if (slot.status === 'running') {
      return `배정 ${info.assignedVehicleCount}대 / 운행 ${activeRuns}대 / 대기 ${waitingRuns}대 / 배차 ${info.headwayText}`
    }

    return `노선 슬롯 / 배정 ${info.assignedVehicleCount}대 / 예상 배차 ${info.headwayText}`
  }

  if (slot.status === 'running' && slot.busProgress) {
    return slot.busProgress.label ?? ''
  }

  if (slot.durationMode === 'bus_metro') {
    return `출발지 ${slot.startStops ?? 0}정류장 → 광역 이동 ${formatRemainTime(slot.expressMoveSeconds ?? 0)} → 종착지 ${slot.endStops ?? 0}정류장`
  }

  return `${slot.stopCount ?? 0}정류장 / ${slot.capacity ?? 0}인승`
}

export const getRouteVehicleRunLines = (slot) => {
  if (!slot || slot.kind === 'research') return []
  if (slot.slotType !== 'route') return []

  return (slot.routeVehicleRuns ?? []).map((run, index) => {
    const label = run.label ?? `${index + 1}호차`

    if (run.status === 'waiting_departure') {
      return `${label}: 다음 출발 ${formatRemainTime(run.nextDepartureInSeconds ?? 0)}`
    }

    if (run.status === 'running') {
      const phase = run.busProgress?.label ?? '운행 중'
      return `${label}: ${phase} / 남은 ${formatRemainTime(run.remainingSeconds ?? 0)}`
    }

    if (run.status === 'completed') {
      return `${label}: 회차 완료`
    }

    return `${label}: 대기`
  })
}

export const canSellOperationSlot = (slot) => {
  if (!isOperationSlotSellUnlocked.value) return false
  if (!slot || slot.kind === 'research') return false
  return slot.status === 'waiting'
}

export const getSlotSellAmount = (slot) => {
  const purchasePrice = slot?.purchasePrice ?? 0
  if (purchasePrice <= 0) return 0
  return Math.floor(purchasePrice * 0.5)
}

export const getSlotSellButtonText = (slot) => {
  if (!isOperationSlotSellUnlocked.value) return '판매 잠김'
  if (!canSellOperationSlot(slot)) return '판매 불가'

  return `판매 ${getSlotSellAmount(slot).toLocaleString()}R`
}

export const sellOperationSlot = async (slotId) => {
  const slot = gameState.value.operationSlots.find((item) => item.id === slotId)

  if (!slot) return
  if (!canSellOperationSlot(slot)) return

  const sellAmount = getSlotSellAmount(slot)

  if (sellAmount > 0) {
    gameState.value.money = (gameState.value.money ?? 0) + sellAmount
  }

  gameState.value.operationSlots = gameState.value.operationSlots.filter((item) => item.id !== slot.id)
  gameState.value.vehicles = gameState.value.vehicles.filter((vehicle) => vehicle.id !== slot.vehicleId)

  addSystemLog(`${slot.name} 슬롯 판매 완료: ${sellAmount.toLocaleString()}R 획득`)

  await safeSaveGame()
}

const resetSlotAfterCompletion = (slot) => {
  const catalog = getVehicleCatalogItem(slot.type)
  const initialDuration = catalog ? getVehicleInitialDurationSeconds(catalog) : slot.durationSeconds

  applyPendingRouteSettings(slot)

  slot.status = 'waiting'
  slot.durationSeconds = initialDuration
  slot.originalDurationSeconds = initialDuration
  slot.remainingSeconds = initialDuration
  slot.startedAt = null
  slot.completedAt = null
  slot.settledAt = Date.now()
  slot.busProgress = null
  slot.routeVehicleRuns = null
  slot.routeStatus = slot.slotType === 'route' ? 'ready' : null
  slot.runSnapshot = {
    funding: false,
  }

  if (slot.durationMode === 'parcel_count') {
    slot.totalParcels = null
    slot.remainingParcels = null
    slot.processedParcels = 0
    slot.settlementAmount = 0
  }

  convertBusSlotToRouteSlotIfUnlocked(slot)
}

const applyAutoSettlement = () => {
  if (!isAutoSettlementUnlocked.value) return false

  const completedSlots = gameState.value.operationSlots.filter((slot) => {
    return slot.status === 'completed' && isSlotFundingApplied(slot)
  })

  if (completedSlots.length === 0) return false

  ensureLogs()

  completedSlots.forEach((slot) => {
    const reward = slot.settlementAmount ?? 0

    gameState.value.money = (gameState.value.money ?? 0) + reward

    gameState.value.logs.settlements.unshift({
      id: createId('settlement'),
      slotId: slot.id,
      slotName: slot.route?.name ?? slot.name,
      amount: reward,
      label: `${slot.settlementLabel} / 자동정산`,
      settledAt: Date.now(),
    })

    resetSlotAfterCompletion(slot)
  })

  gameState.value.logs.settlements = gameState.value.logs.settlements.slice(0, 20)

  return true
}

export const safeSaveGame = async () => {
  if (isSaving.value) return

  try {
    isSaving.value = true

    if (!gameState.value.time) {
      gameState.value.time = {}
    }

    gameState.value.time.lastSavedAt = Date.now()

    await saveGame(gameState.value)
  } catch (error) {
    console.error('[RCTS] 저장 실패:', error)
  } finally {
    isSaving.value = false
  }
}

const startAutoSave = () => {
  stopAutoSave()

  if (!gameState.value.unlocks?.autoSave) {
    return
  }

  autoSaveTimer = window.setInterval(() => {
    gameState.value.time.lastAutoSavedAt = Date.now()
    safeSaveGame()
  }, 10000)
}

const stopAutoSave = () => {
  if (autoSaveTimer) {
    window.clearInterval(autoSaveTimer)
    autoSaveTimer = null
  }
}

const applyResearchEffect = (research) => {
  return applyResearchEffectToState(gameState.value, research)
}

const applyCompletedResearchUnlocks = () => {
  const completed = gameState.value.research?.completed ?? []
  let autoSaveStateChanged = false

  completed.forEach((completedResearch) => {
    const catalog = getResearchCatalogItem(completedResearch.id)

    if (!catalog) return

    const beforeAutoSave = Boolean(gameState.value.unlocks?.autoSave)
    const applied = applyResearchEffect(catalog)
    const afterAutoSave = Boolean(gameState.value.unlocks?.autoSave)

    if (beforeAutoSave !== afterAutoSave) {
      autoSaveStateChanged = true
    }

    if (!applied) return

    if (!completedResearch.unlockedAt) {
      completedResearch.unlockedAt = Date.now()
    }

    addSystemLog(`${catalog.name} 완료: ${catalog.description}`)
  })

  if (autoSaveStateChanged) {
    startAutoSave()
  }
}

const startClock = () => {
  if (clock?.isRunning?.()) return

  clock = createGameClock({
    getState: () => gameState.value,
    setState: (nextState) => {
      gameState.value = nextState
    },
    onTick: () => {
      standardTime.value = new Date()
      applyCompletedResearchUnlocks()

      if (applyAutoSettlement()) {
        safeSaveGame()
      }
    },
  })

  clock.start()
}

const stopClock = () => {
  if (clock) {
    clock.stop()
    clock = null
  }
}

export const bootstrapGame = async () => {
  try {
    const savedGame = await loadGame()

    if (savedGame) {
      gameState.value = migrateGameState(savedGame)
    } else {
      gameState.value = createDefaultGameState()
    }

    const offlineResult = calculateOfflineProgress(gameState.value)

    if (offlineResult.appliedOfflineSeconds > 0) {
      gameState.value = applyGameTick(gameState.value, offlineResult.appliedOfflineSeconds)
    }

    applyCompletedResearchUnlocks()
    applyAutoSettlement()

    if (!gameState.value.time) {
      gameState.value.time = {}
    }

    gameState.value.time.lastOpenedAt = Date.now()
    gameState.value.time.lastSavedAt = Date.now()

    standardTime.value = new Date()

    await saveGame(gameState.value)

    startClock()
    startAutoSave()

    isGameBooted.value = true
  } catch (error) {
    console.error('[RCTS] 게임 초기화 실패:', error)

    gameState.value = createDefaultGameState()
    standardTime.value = new Date()

    startClock()
    startAutoSave()

    isGameBooted.value = true
  }
}

export const shutdownGame = async () => {
  stopClock()
  stopAutoSave()

  await safeSaveGame()
}

const createRouteVehicleRuns = (slot) => {
  ensureRouteSlotFields(slot)

  const assignedVehicleIds = getAssignedVehicleIds(slot)
  const info = getSlotTimetableInfo(slot)
  const headwaySeconds = Math.max(0, info.headwaySeconds ?? 0)
  const durationSeconds = getRouteCycleSeconds(slot)

  return assignedVehicleIds.map((vehicleId, index) => {
    const departureOffset = index * headwaySeconds

    if (index === 0) {
      return {
        id: createId('route-run'),
        vehicleId,
        label: `${index + 1}호차`,
        status: 'running',
        nextDepartureInSeconds: 0,
        remainingSeconds: durationSeconds,
        durationSeconds,
        busProgress: createInitialBusProgress(slot),
        startedAt: Date.now(),
        completedAt: null,
      }
    }

    return {
      id: createId('route-run'),
      vehicleId,
      label: `${index + 1}호차`,
      status: 'waiting_departure',
      nextDepartureInSeconds: departureOffset,
      remainingSeconds: durationSeconds,
      durationSeconds,
      busProgress: null,
      startedAt: null,
      completedAt: null,
    }
  })
}

const startTimetableRouteSlot = async (slot, vehicle) => {
  ensureRouteSlotFields(slot)

  const assignedVehicleIds = getAssignedVehicleIds(slot)

  if (assignedVehicleIds.length <= 0) return

  const settlementResult = calculateBusRouteSettlement(vehicle)
  const settlementAmount = settlementResult.amount * assignedVehicleIds.length
  const durationSeconds = getRouteCycleSeconds(slot)

  slot.status = 'running'
  slot.routeStatus = 'timetable_running'
  slot.durationSeconds = durationSeconds
  slot.remainingSeconds = durationSeconds
  slot.settlementAmount = settlementAmount
  slot.passengerStats = {
    ...settlementResult.passengerStats,
    totalBoarded: settlementResult.passengerStats.totalBoarded * assignedVehicleIds.length,
  }
  slot.routeVehicleRuns = createRouteVehicleRuns(slot)
  slot.startedAt = Date.now()
  slot.completedAt = null
  slot.settledAt = null

  slot.runSnapshot = {
    funding: isFundingUnlocked.value,
    timetable: {
      ...(slot.timetable ?? {}),
    },
  }

  await safeSaveGame()
}

export const startOperationSlot = async (slotId) => {
  const slot = gameState.value.operationSlots.find((item) => item.id === slotId)

  if (!slot) return
  if (slot.status === 'running') return
  if (slot.status === 'completed') return

  const vehicle = getVehicleCatalogItem(slot.type)

  if (!vehicle) return

  if (slot.slotType === 'route' && isBusSlot(slot) && isBusTimetableBasicUnlocked.value) {
    await startTimetableRouteSlot(slot, vehicle)
    return
  }

  if (vehicle.durationMode === 'parcel_count') {
    const totalParcels = getVehicleRunDurationSeconds(vehicle)

    slot.status = 'running'
    slot.durationSeconds = totalParcels
    slot.originalDurationSeconds = totalParcels
    slot.remainingSeconds = totalParcels
    slot.totalParcels = totalParcels
    slot.remainingParcels = totalParcels
    slot.processedParcels = 0
    slot.perParcelAmount = vehicle.perParcelAmount ?? 2500
    slot.settlementAmount = 0
    slot.startedAt = Date.now()
    slot.completedAt = null
    slot.settledAt = null

    slot.runSnapshot = {
      funding: isFundingUnlocked.value,
    }

    await safeSaveGame()
    return
  }

  const runDurationSeconds = getVehicleRunDurationSeconds(vehicle)
  let settlementAmount = calculateVehicleSettlementAmount(vehicle, runDurationSeconds)
  let passengerStats = null

  if (vehicle.settlementMode === 'bus_route') {
    const result = calculateBusRouteSettlement(vehicle)
    settlementAmount = result.amount
    passengerStats = result.passengerStats
  }

  slot.status = 'running'
  slot.durationSeconds = runDurationSeconds
  slot.originalDurationSeconds = runDurationSeconds
  slot.remainingSeconds = runDurationSeconds
  slot.settlementAmount = settlementAmount
  slot.passengerStats = passengerStats
  slot.startedAt = Date.now()
  slot.completedAt = null
  slot.settledAt = null

  if (isBusSlot(slot)) {
    slot.busProgress = createInitialBusProgress(slot)
  }

  slot.runSnapshot = {
    funding: isFundingUnlocked.value,
  }

  await safeSaveGame()
}

export const confirmOperationSlotCompleted = async (slotId) => {
  const slot = gameState.value.operationSlots.find((item) => item.id === slotId)

  if (!slot) return
  if (slot.status !== 'completed') return

  resetSlotAfterCompletion(slot)

  await safeSaveGame()
}

export const settleOperationSlot = async (slotId) => {
  const slot = gameState.value.operationSlots.find((item) => item.id === slotId)

  if (!slot) return
  if (slot.status !== 'completed') return

  if (!isSlotFundingApplied(slot)) {
    await confirmOperationSlotCompleted(slotId)
    return
  }

  const reward = slot.settlementAmount ?? 0

  gameState.value.money = (gameState.value.money ?? 0) + reward

  ensureLogs()

  gameState.value.logs.settlements.unshift({
    id: createId('settlement'),
    slotId: slot.id,
    slotName: slot.route?.name ?? slot.name,
    amount: reward,
    label: slot.settlementLabel,
    settledAt: Date.now(),
  })

  gameState.value.logs.settlements = gameState.value.logs.settlements.slice(0, 20)

  resetSlotAfterCompletion(slot)

  await safeSaveGame()
}

export const canHandleOperationSlotAction = (slot) => {
  if (!slot || slot.kind === 'research') return false
  if (slot.status === 'running') return false

  if (slot.slotType === 'route' && slot.status === 'waiting') {
    return getAssignedVehicleIds(slot).length > 0
  }

  return true
}

export const handleOperationSlotAction = async (slot) => {
  if (slot.kind === 'research') return

  if (slot.status === 'waiting') {
    await startOperationSlot(slot.id)
    return
  }

  if (slot.status === 'completed') {
    await settleOperationSlot(slot.id)
  }
}

export const startResearch = async (researchId) => {
  const research = getResearchCatalogItem(researchId)

  if (!research) return
  if (gameState.value.research?.running) return
  if (isResearchCompleted(researchId)) return
  if (!isResearchPrerequisiteMet(research)) return
  if ((gameState.value.money ?? 0) < research.cost) return

  if (research.cost > 0) {
    gameState.value.money -= research.cost
  }

  gameState.value.research.running = {
    id: research.id,
    icon: research.icon,
    name: research.name,
    description: research.description,
    durationSeconds: research.durationSeconds,
    remainingSeconds: research.durationSeconds,
    cost: research.cost,
    startedAt: Date.now(),
  }

  await safeSaveGame()
}

export const getResearchButtonText = (research) => {
  if (research.status === 'completed') return '완료'
  if (research.status === 'running') return '진행 중'
  if (gameState.value.research?.running) return '다른 연구 진행 중'
  if (!research.prerequisiteMet) return '선행 연구 필요'
  if ((gameState.value.money ?? 0) < research.cost) return '자금 부족'
  return '연구 시작'
}

export const isResearchButtonDisabled = (research) => {
  if (research.status === 'completed') return true
  if (research.status === 'running') return true
  if (gameState.value.research?.running) return true
  if (!research.prerequisiteMet) return true
  if ((gameState.value.money ?? 0) < research.cost) return true
  return false
}

export const canShowTimetableButton = (slot) => {
  if (!slot || slot.kind === 'research') return false
  if (!isBusSlot(slot)) return false
  return Boolean(gameState.value.unlocks?.busTimetableBasic)
}

export const toggleSlotTimetable = async (slotId) => {
  const slot = gameState.value.operationSlots.find((item) => item.id === slotId)
  if (!slot) return

  ensureRouteSlotFields(slot)

  slot.timetableOpen = !slot.timetableOpen

  await safeSaveGame()
}

export const getSlotTimetableInfo = (slot) => {
  if (!slot) {
    return {
      assignedVehicleCount: 0,
      headwaySeconds: null,
      headwayText: '-',
      requiredVehicleCount: 0,
      shortageVehicleCount: 0,
      modeText: '시간표 없음',
      canDispatch: false,
    }
  }

  ensureRouteSlotFields(slot)

  const assignedVehicleCount = getAssignedVehicleIds(slot).length
  const routeCycleSeconds = getRouteCycleSeconds(slot)

  let mode = 'auto_ratio'
  let modeText = '자동 비율 배차'
  let targetHeadwaySeconds = null

  if (gameState.value.unlocks?.busTimetable3) {
    mode = 'standard_custom'
    modeText = '표준시간 커스텀 시간표'
    targetHeadwaySeconds = slot.timetable?.normalHeadwaySeconds ?? slot.timetable?.targetHeadwaySeconds ?? null
  } else if (gameState.value.unlocks?.busTimetable2) {
    mode = 'target_headway'
    modeText = '목표 배차간격'
    targetHeadwaySeconds = slot.timetable?.targetHeadwaySeconds ?? null
  }

  const autoHeadwaySeconds =
    assignedVehicleCount > 0
      ? Math.ceil(routeCycleSeconds / assignedVehicleCount)
      : null

  const headwaySeconds = targetHeadwaySeconds ?? autoHeadwaySeconds
  const requiredVehicleCount =
    headwaySeconds && headwaySeconds > 0
      ? Math.ceil(routeCycleSeconds / headwaySeconds)
      : assignedVehicleCount

  const shortageVehicleCount = Math.max(0, requiredVehicleCount - assignedVehicleCount)

  return {
    mode,
    modeText,
    assignedVehicleCount,
    routeCycleSeconds,
    routeCycleText: formatRemainTime(routeCycleSeconds),
    headwaySeconds,
    headwayText: formatMinuteHeadway(headwaySeconds),
    autoHeadwaySeconds,
    autoHeadwayText: formatMinuteHeadway(autoHeadwaySeconds),
    targetHeadwaySeconds,
    targetHeadwayMinutes: targetHeadwaySeconds ? Math.ceil(targetHeadwaySeconds / 60) : '',
    requiredVehicleCount,
    shortageVehicleCount,
    canDispatch: assignedVehicleCount > 0,
  }
}

export const updateSlotRouteField = async (slotId, field, value) => {
  const slot = gameState.value.operationSlots.find((item) => item.id === slotId)
  if (!slot) return

  ensureRouteSlotFields(slot)

  const safeField = field === 'number' ? 'number' : 'name'

  if (slot.status === 'running') {
    slot.pendingRouteSettings = {
      ...(slot.pendingRouteSettings ?? {}),
      [safeField]: value,
    }
  } else {
    slot.route[safeField] = value
  }

  await safeSaveGame()
}

export const updateSlotTargetHeadwayMinutes = async (slotId, value) => {
  const slot = gameState.value.operationSlots.find((item) => item.id === slotId)
  if (!slot) return
  if (!gameState.value.unlocks?.busTimetable2) return

  ensureRouteSlotFields(slot)

  const minutes = Math.max(1, Number.parseInt(value, 10) || 1)
  const targetHeadwaySeconds = minutes * 60

  if (slot.status === 'running') {
    slot.pendingTimetableSettings = {
      ...(slot.pendingTimetableSettings ?? {}),
      targetHeadwaySeconds,
    }
  } else {
    slot.timetable.targetHeadwaySeconds = targetHeadwaySeconds
  }

  await safeSaveGame()
}

export const getTimetablePanelNotice = (slot) => {
  if (!slot) return ''

  if (slot.status === 'running') {
    return '운행 중 변경사항은 현재 회차 종료 후 다음 개시부터 적용됩니다.'
  }

  if (getAssignedVehicleIds(slot).length <= 0) {
    return '배정 차량이 없어 배차시간을 계산할 수 없습니다.'
  }

  const info = getSlotTimetableInfo(slot)

  if (info.shortageVehicleCount > 0) {
    return `목표 배차 기준 차량 ${info.shortageVehicleCount}대가 부족합니다.`
  }

  return '현재 설정으로 시간표 운행이 가능합니다.'
}

export const handleGameVisibilityChange = () => {
  if (document.visibilityState === 'hidden') {
    safeSaveGame()
  }
}

export const handleGameBeforeUnload = () => {
  if (gameState.value?.time) {
    gameState.value.time.lastSavedAt = Date.now()
  }

  saveGame(gameState.value)
}