import { reactive, computed } from 'vue'
import { getNowMs } from '../modules/time'
import { loadSave, saveGame, clearSave } from '../modules/save'

const randomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

const makeId = (prefix) => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

const START_MONEY = 300_000_000

const CATALOG = [
  {
    id: 'bus_county',
    type: 'bus',
    categoryLabel: '버스',
    name: '소형버스',
    modelHint: '현대 카운티급',
    capacity: 25,
    price: 90_000_000,
    description: '초반 운행에 적합한 소형 버스입니다.',
  },
  {
    id: 'bus_mid',
    type: 'bus',
    categoryLabel: '버스',
    name: '중형버스',
    modelHint: 'BS090급',
    capacity: 35,
    price: 130_000_000,
    description: '초반 수익을 안정적으로 올리기 좋은 중형 버스입니다.',
  },
  {
    id: 'bus_large',
    type: 'bus',
    categoryLabel: '버스',
    name: '대형버스',
    modelHint: '현대 일렉시티급',
    capacity: 75,
    price: 350_000_000,
    description: '시내·광역 운행에 모두 투입 가능한 대형 버스입니다.',
  },
  {
    id: 'bus_articulated',
    type: 'bus',
    categoryLabel: '버스',
    name: '굴절버스',
    modelHint: 'BRT 전용 대용량 차량',
    capacity: 110,
    price: 650_000_000,
    description: '시내버스 대용량 운행에 특화된 굴절 버스입니다.',
  },
  {
    id: 'bus_double_decker',
    type: 'bus',
    categoryLabel: '버스',
    name: '2층버스',
    modelHint: '광역 2층버스급',
    capacity: 90,
    price: 520_000_000,
    description: '광역 노선에 특화된 2층 버스입니다.',
  },
  {
    id: 'ship_water_bus',
    type: 'ship',
    categoryLabel: '선박',
    name: '소형 수상버스',
    modelHint: '한강버스급',
    capacity: 150,
    price: 1_500_000_000,
    description: '짧은 수상 이동에 적합한 소형 여객선입니다.',
  },
  {
    id: 'ship_coastal_ferry',
    type: 'ship',
    categoryLabel: '선박',
    name: '연안 여객선',
    modelHint: '중형 페리급',
    capacity: 450,
    price: 8_000_000_000,
    description: '장시간 운항으로 큰 정산을 노리는 선박입니다.',
  },
  {
    id: 'ship_large_ferry',
    type: 'ship',
    categoryLabel: '선박',
    name: '대형 페리',
    modelHint: '대형 여객 페리급',
    capacity: 1_200,
    price: 35_000_000_000,
    description: '비싸지만 수송량이 큰 장기 운항용 선박입니다.',
  },
  {
    id: 'ship_cruise',
    type: 'ship',
    categoryLabel: '선박',
    name: '크루즈 여객선',
    modelHint: '초대형 크루즈급',
    capacity: 3_000,
    price: 300_000_000_000,
    description: '후반 장기 운항용 초대형 여객선입니다.',
  },
  {
    id: 'rail_lrt',
    type: 'rail',
    categoryLabel: '철도',
    name: '경전철 2량 편성',
    modelHint: '가상 경전철 편성',
    capacity: 180,
    price: 4_500_000_000,
    description: '철도 노선 운영을 시작하기 위한 소형 편성입니다.',
  },
  {
    id: 'rail_commuter',
    type: 'rail',
    categoryLabel: '철도',
    name: '광역철도 4량 편성',
    modelHint: '가상 광역철도 편성',
    capacity: 520,
    price: 14_000_000_000,
    description: '중거리 철도 노선에 적합한 기본 편성입니다.',
  },
  {
    id: 'rail_express',
    type: 'rail',
    categoryLabel: '철도',
    name: '고속철도 6량 편성',
    modelHint: '가상 고속철도 편성',
    capacity: 720,
    price: 42_000_000_000,
    description: '후반 장거리 노선용 고가 편성입니다.',
  },
]

const OPERATION_TEMPLATES = [
  {
    id: 'bus_village_route',
    type: 'bus',
    title: '마을버스 노선',
    durationSeconds: 30 * 60,
    fare: 1200,
    demandMin: 0.45,
    demandMax: 0.95,
    allowedCatalogIds: ['bus_county', 'bus_mid', 'bus_large'],
    allowedVehicleText: '소형 · 중형 · 대형',
    description: '마을버스 노선입니다. 단가 1,200R, 운행 시간 30분입니다.',
  },
  {
    id: 'bus_city_route',
    type: 'bus',
    title: '시내버스 노선',
    durationSeconds: 60 * 60,
    fare: 1500,
    demandMin: 0.55,
    demandMax: 1.1,
    allowedCatalogIds: ['bus_mid', 'bus_large', 'bus_articulated'],
    allowedVehicleText: '중형 · 대형 · 굴절',
    description: '시내버스 노선입니다. 단가 1,500R, 운행 시간 1시간입니다.',
  },
  {
    id: 'bus_metro_route',
    type: 'bus',
    title: '광역버스 노선',
    durationSeconds: 2 * 60 * 60,
    fare: 3000,
    demandMin: 0.45,
    demandMax: 0.9,
    allowedCatalogIds: ['bus_large', 'bus_double_decker'],
    allowedVehicleText: '대형 · 2층',
    description: '광역버스 노선입니다. 단가 3,000R, 운행 시간 2시간입니다.',
  },
  {
    id: 'ship_river_route',
    type: 'ship',
    title: '수상버스 단거리 운항',
    durationSeconds: 2 * 60 * 60,
    fare: 5000,
    demandMin: 0.35,
    demandMax: 0.85,
    description: '선박 입문용 단거리 운항입니다.',
  },
  {
    id: 'ship_coastal_route',
    type: 'ship',
    title: '연안 여객 운항',
    durationSeconds: 8 * 60 * 60,
    fare: 18000,
    demandMin: 0.35,
    demandMax: 0.8,
    description: '오래 걸리지만 큰 정산을 기대할 수 있습니다.',
  },
  {
    id: 'ship_long_route',
    type: 'ship',
    title: '장거리 여객 운항',
    durationSeconds: 24 * 60 * 60,
    fare: 65000,
    demandMin: 0.25,
    demandMax: 0.7,
    description: '보내두고 기다리는 장기 운항입니다.',
  },
]

const AIRPORT_CATALOG = [
  {
    id: 'airport_regional',
    name: '소형 지방공항',
    standCount: 3,
    runwayCount: 1,
    price: 18_000_000_000,
    buildSeconds: 6 * 60 * 60,
    description: '항공 관제 시스템을 시작하기 위한 소형 공항입니다.',
  },
  {
    id: 'airport_city',
    name: '중형 도시공항',
    standCount: 8,
    runwayCount: 1,
    price: 75_000_000_000,
    buildSeconds: 18 * 60 * 60,
    description: '게이트와 지상 이동 관리를 본격적으로 다루는 공항입니다.',
  },
  {
    id: 'airport_international',
    name: '국제공항 1단계',
    standCount: 16,
    runwayCount: 2,
    price: 250_000_000_000,
    buildSeconds: 48 * 60 * 60,
    description: '후반 항공 관제의 중심이 되는 대형 공항입니다.',
  },
]

const DEFAULT_STATE = {
  companyCreated: false,
  companyName: '',
  money: START_MONEY,
  ownedVehicles: [],
  railRoutes: [],
  airportProjects: [],
  airports: [],
  operations: [],
  settlementQueue: [],
  settlementHistory: [],
  totalEarned: 0,
  totalCompleted: 0,
  tickNow: getNowMs(),
  savedAt: null,
}

const state = reactive({ ...DEFAULT_STATE })

let timer = null
let saveTimer = null

const normalizeSavedVehicle = (vehicle) => {
  if (!vehicle || typeof vehicle !== 'object') return vehicle
  if (vehicle.catalogId === 'bus_city') {
    return {
      ...vehicle,
      catalogId: 'bus_large',
      name: vehicle.name || '대형버스',
      modelHint: '현대 일렉시티급',
    }
  }
  if (vehicle.catalogId === 'bus_brt') {
    return {
      ...vehicle,
      catalogId: 'bus_articulated',
      name: vehicle.name || '굴절버스',
      modelHint: 'BRT 전용 대용량 차량',
    }
  }
  return vehicle
}

const migrateSavedState = (saved) => {
  return {
    ...DEFAULT_STATE,
    ...saved,
    money: typeof saved?.money === 'number' ? saved.money : START_MONEY,
    tickNow: getNowMs(),
    operations: Array.isArray(saved?.operations) ? saved.operations : [],
    ownedVehicles: Array.isArray(saved?.ownedVehicles) ? saved.ownedVehicles.map(normalizeSavedVehicle) : [],
    railRoutes: Array.isArray(saved?.railRoutes) ? saved.railRoutes : [],
    airportProjects: Array.isArray(saved?.airportProjects) ? saved.airportProjects : [],
    airports: Array.isArray(saved?.airports) ? saved.airports : [],
    settlementQueue: Array.isArray(saved?.settlementQueue) ? saved.settlementQueue : [],
    settlementHistory: Array.isArray(saved?.settlementHistory) ? saved.settlementHistory : [],
  }
}

const hydrate = () => {
  const saved = loadSave()
  if (!saved) return
  Object.assign(state, migrateSavedState(saved))
}

const persist = () => {
  saveGame({
    companyCreated: state.companyCreated,
    companyName: state.companyName,
    money: state.money,
    ownedVehicles: state.ownedVehicles,
    railRoutes: state.railRoutes,
    airportProjects: state.airportProjects,
    airports: state.airports,
    operations: state.operations,
    settlementQueue: state.settlementQueue,
    settlementHistory: state.settlementHistory,
    totalEarned: state.totalEarned,
    totalCompleted: state.totalCompleted,
  })
}

const createCompany = (companyName) => {
  const name = String(companyName || '').trim() || 'RCTS 운송'
  Object.assign(state, {
    ...DEFAULT_STATE,
    companyCreated: true,
    companyName: name,
    tickNow: getNowMs(),
  })
  persist()
}

const resetCompany = () => {
  clearSave()
  Object.assign(state, { ...DEFAULT_STATE, tickNow: getNowMs() })
}

const getCatalogItem = (catalogId) => CATALOG.find((item) => item.id === catalogId)
const getVehicle = (vehicleId) => state.ownedVehicles.find((vehicle) => vehicle.id === vehicleId)
const getOperationTemplate = (templateId) => OPERATION_TEMPLATES.find((item) => item.id === templateId)
const isTemplateAllowedForVehicle = (template, vehicle) => {
  if (!template || !vehicle) return false
  if (template.type !== vehicle.type) return false
  if (!Array.isArray(template.allowedCatalogIds)) return true
  return template.allowedCatalogIds.includes(vehicle.catalogId)
}
const getRailRoute = (routeId) => state.railRoutes.find((route) => route.id === routeId)
const getAirportCatalogItem = (airportId) => AIRPORT_CATALOG.find((item) => item.id === airportId)

const getVehicleStatus = (vehicleId) => {
  if (state.operations.some((operation) => operation.vehicleId === vehicleId)) return '운행 중'
  if (state.settlementQueue.some((settlement) => settlement.vehicleId === vehicleId)) return '정산 대기'
  return '대기'
}

const purchaseVehicle = ({ catalogId, customName }) => {
  const catalog = getCatalogItem(catalogId)
  if (!catalog) return { ok: false, message: '차량 정보를 찾을 수 없습니다.' }
  if (state.money < catalog.price) return { ok: false, message: '자금이 부족합니다.' }

  const sameTypeCount = state.ownedVehicles.filter((vehicle) => vehicle.catalogId === catalog.id).length + 1
  const name = String(customName || '').trim() || `${catalog.name} ${sameTypeCount}`

  state.money -= catalog.price
  state.ownedVehicles.push({
    id: makeId('vehicle'),
    catalogId: catalog.id,
    type: catalog.type,
    categoryLabel: catalog.categoryLabel,
    name,
    modelHint: catalog.modelHint,
    capacity: catalog.capacity,
    purchasePrice: catalog.price,
    purchasedAt: getNowMs(),
  })
  persist()
  return { ok: true, message: `${name} 구입 완료` }
}

const sellVehicle = (vehicleId) => {
  const vehicle = getVehicle(vehicleId)
  if (!vehicle) return { ok: false, message: '보유 차량을 찾을 수 없습니다.' }
  if (getVehicleStatus(vehicleId) !== '대기') return { ok: false, message: '대기 중인 차량만 매각할 수 있습니다.' }

  const refund = Math.floor(vehicle.purchasePrice * 0.5)
  state.money += refund
  state.ownedVehicles = state.ownedVehicles.filter((item) => item.id !== vehicleId)
  persist()
  return { ok: true, message: `${vehicle.name} 매각 완료` }
}

const calculateExpectedRevenue = (vehicle, template) => {
  const averageDemand = (template.demandMin + template.demandMax) / 2
  return Math.floor(vehicle.capacity * template.fare * averageDemand)
}

const calculateRailDurationSeconds = (route) => {
  const distance = Math.max(1, Number(route.distanceKm) || 1)
  const speed = Math.max(20, Number(route.averageSpeedKmh) || 60)
  const stationCount = Math.max(2, Number(route.stationCount) || 2)
  const moveSeconds = Math.ceil((distance / speed) * 3600)
  const dwellSeconds = Math.max(0, stationCount - 2) * 60
  return Math.max(5 * 60, moveSeconds + dwellSeconds)
}

const calculateRailRevenue = (vehicle, route) => {
  const demandRate = Number((Math.random() * 0.45 + 0.55).toFixed(2))
  const passengers = Math.max(1, Math.min(vehicle.capacity, Math.floor(vehicle.capacity * demandRate)))
  const revenue = passengers * route.fare
  return { passengers, revenue }
}

const startOperation = ({ vehicleId, templateId }) => {
  const vehicle = getVehicle(vehicleId)
  const template = getOperationTemplate(templateId)
  if (!vehicle || !template) return { ok: false, message: '운행 정보를 확인할 수 없습니다.' }
  if (vehicle.type !== template.type) return { ok: false, message: '차량 유형과 운행 유형이 맞지 않습니다.' }
  if (Array.isArray(template.allowedCatalogIds) && !template.allowedCatalogIds.includes(vehicle.catalogId)) {
    return { ok: false, message: `${template.title}에는 ${template.allowedVehicleText} 차량만 배치할 수 있습니다.` }
  }
  if (getVehicleStatus(vehicleId) !== '대기') return { ok: false, message: '대기 중인 차량만 운행할 수 있습니다.' }

  const now = getNowMs()
  const demandRate = Number((Math.random() * (template.demandMax - template.demandMin) + template.demandMin).toFixed(2))
  const passengers = Math.max(1, Math.min(vehicle.capacity, Math.floor(vehicle.capacity * demandRate)))
  const revenue = passengers * template.fare

  state.operations.push({
    id: makeId('operation'),
    vehicleId: vehicle.id,
    vehicleName: vehicle.name,
    type: vehicle.type,
    categoryLabel: vehicle.categoryLabel,
    templateId: template.id,
    title: template.title,
    startedAt: now,
    endsAt: now + template.durationSeconds * 1000,
    durationSeconds: template.durationSeconds,
    fare: template.fare,
    passengers,
    revenue,
    status: 'running',
  })
  persist()
  return { ok: true, message: `${template.title} 시작` }
}

const createRailRoute = ({ name, distanceKm, stationCount, averageSpeedKmh, fare }) => {
  const routeName = String(name || '').trim()
  if (!routeName) return { ok: false, message: '노선명을 입력하세요.' }

  const distance = Math.max(1, Number(distanceKm) || 1)
  const stations = Math.max(2, Number(stationCount) || 2)
  const speed = Math.max(20, Number(averageSpeedKmh) || 60)
  const routeFare = Math.max(100, Number(fare) || 1800)

  state.railRoutes.push({
    id: makeId('railRoute'),
    name: routeName,
    distanceKm: distance,
    stationCount: stations,
    averageSpeedKmh: speed,
    fare: routeFare,
    createdAt: getNowMs(),
  })
  persist()
  return { ok: true, message: `${routeName} 노선 생성 완료` }
}

const deleteRailRoute = (routeId) => {
  if (state.operations.some((operation) => operation.routeId === routeId)) {
    return { ok: false, message: '운행 중인 노선은 삭제할 수 없습니다.' }
  }
  state.railRoutes = state.railRoutes.filter((route) => route.id !== routeId)
  persist()
  return { ok: true, message: '철도 노선을 삭제했습니다.' }
}

const startRailOperation = ({ vehicleId, routeId }) => {
  const vehicle = getVehicle(vehicleId)
  const route = getRailRoute(routeId)
  if (!vehicle || !route) return { ok: false, message: '철도 운행 정보를 확인할 수 없습니다.' }
  if (vehicle.type !== 'rail') return { ok: false, message: '철도 차량만 노선 운행에 투입할 수 있습니다.' }
  if (getVehicleStatus(vehicleId) !== '대기') return { ok: false, message: '대기 중인 차량만 운행할 수 있습니다.' }

  const now = getNowMs()
  const durationSeconds = calculateRailDurationSeconds(route)
  const { passengers, revenue } = calculateRailRevenue(vehicle, route)

  state.operations.push({
    id: makeId('operation'),
    vehicleId: vehicle.id,
    vehicleName: vehicle.name,
    type: 'rail',
    categoryLabel: '철도',
    routeId: route.id,
    routeName: route.name,
    title: `${route.name} 운행`,
    startedAt: now,
    endsAt: now + durationSeconds * 1000,
    durationSeconds,
    fare: route.fare,
    passengers,
    revenue,
    status: 'running',
  })
  persist()
  return { ok: true, message: `${route.name} 운행 시작` }
}

const startAirportConstruction = ({ airportId, customName }) => {
  const item = getAirportCatalogItem(airportId)
  if (!item) return { ok: false, message: '공항 정보를 찾을 수 없습니다.' }
  if (state.money < item.price) return { ok: false, message: '자금이 부족합니다.' }
  if (state.airportProjects.length > 0) return { ok: false, message: '진행 중인 공항 건설이 있습니다.' }

  const name = String(customName || '').trim() || item.name
  const now = getNowMs()
  state.money -= item.price
  state.airportProjects.push({
    id: makeId('airportProject'),
    airportCatalogId: item.id,
    name,
    standCount: item.standCount,
    runwayCount: item.runwayCount,
    price: item.price,
    startedAt: now,
    endsAt: now + item.buildSeconds * 1000,
    buildSeconds: item.buildSeconds,
  })
  persist()
  return { ok: true, message: `${name} 건설 시작` }
}

const completeAirportProject = (project) => {
  state.airportProjects = state.airportProjects.filter((item) => item.id !== project.id)
  state.airports.push({
    id: makeId('airport'),
    airportCatalogId: project.airportCatalogId,
    name: project.name,
    standCount: project.standCount,
    runwayCount: project.runwayCount,
    builtAt: getNowMs(),
  })
}

const completeOperation = (operation) => {
  state.operations = state.operations.filter((item) => item.id !== operation.id)
  state.settlementQueue.push({
    id: makeId('settlement'),
    operationId: operation.id,
    vehicleId: operation.vehicleId,
    vehicleName: operation.vehicleName,
    type: operation.type,
    categoryLabel: operation.categoryLabel,
    title: operation.title,
    completedAt: getNowMs(),
    passengers: operation.passengers,
    fare: operation.fare,
    revenue: operation.revenue,
  })
}

const settle = (settlementId) => {
  const settlement = state.settlementQueue.find((item) => item.id === settlementId)
  if (!settlement) return { ok: false, message: '정산 항목을 찾을 수 없습니다.' }

  state.money += settlement.revenue
  state.totalEarned += settlement.revenue
  state.totalCompleted += 1
  state.settlementQueue = state.settlementQueue.filter((item) => item.id !== settlementId)
  state.settlementHistory.unshift({ ...settlement, settledAt: getNowMs() })
  state.settlementHistory = state.settlementHistory.slice(0, 30)
  persist()
  return { ok: true, message: '정산 완료' }
}

const settleAll = () => {
  const ids = state.settlementQueue.map((item) => item.id)
  ids.forEach((id) => settle(id))
}

const tick = () => {
  state.tickNow = getNowMs()
  const completedOperations = state.operations.filter((operation) => operation.endsAt <= state.tickNow)
  completedOperations.forEach(completeOperation)

  const completedAirports = state.airportProjects.filter((project) => project.endsAt <= state.tickNow)
  completedAirports.forEach(completeAirportProject)

  if (completedOperations.length > 0 || completedAirports.length > 0) persist()
}

const startTicker = () => {
  if (timer) return
  timer = window.setInterval(tick, 1000)
  saveTimer = window.setInterval(persist, 15000)
  tick()
}

const stopTicker = () => {
  if (timer) window.clearInterval(timer)
  if (saveTimer) window.clearInterval(saveTimer)
  timer = null
  saveTimer = null
}

hydrate()

export const rctsLiteManager = {
  state,
  catalog: CATALOG,
  operationTemplates: OPERATION_TEMPLATES,
  airportCatalog: AIRPORT_CATALOG,
  createCompany,
  resetCompany,
  purchaseVehicle,
  sellVehicle,
  startOperation,
  createRailRoute,
  deleteRailRoute,
  startRailOperation,
  startAirportConstruction,
  settle,
  settleAll,
  startTicker,
  stopTicker,
  persist,
  getVehicleStatus,
  calculateExpectedRevenue,
  calculateRailDurationSeconds,
  isTemplateAllowedForVehicle,
  getters: {
    busCatalog: computed(() => CATALOG.filter((item) => item.type === 'bus')),
    shipCatalog: computed(() => CATALOG.filter((item) => item.type === 'ship')),
    railCatalog: computed(() => CATALOG.filter((item) => item.type === 'rail')),
    busVehicles: computed(() => state.ownedVehicles.filter((item) => item.type === 'bus')),
    shipVehicles: computed(() => state.ownedVehicles.filter((item) => item.type === 'ship')),
    railVehicles: computed(() => state.ownedVehicles.filter((item) => item.type === 'rail')),
    runningOperations: computed(() => [...state.operations].sort((a, b) => a.endsAt - b.endsAt)),
    settlementQueue: computed(() => [...state.settlementQueue].sort((a, b) => b.completedAt - a.completedAt)),
    airportProjects: computed(() => [...state.airportProjects].sort((a, b) => a.endsAt - b.endsAt)),
  },
}
