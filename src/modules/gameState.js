/*
  파일 주소:
  src/modules/gameState.js

  적용 내용:
  - RCTS 실제 게임 상태 원본 모듈
  - 신규 게임 시작 자금은 0R
  - 버스 모드 전용 해금/연구 상태를 저장
  - 버스 스타터 차량/슬롯은 bus.js에서 자동 보정 생성
  - save.js는 createGameSnapshot()을 저장하고 applyGameSnapshot()으로 복원함
  - 자동저장은 기본 ON

  연결된 파일:
  - src/App.vue
  - src/modules/save.js
  - src/modules/finance.js
  - src/modules/bus.js
  - src/components/layout/RctsHeader.vue
  - src/views/BusView.vue
  - src/views/SettingsView.vue

  수정 시 주의:
  - 실제 게임 데이터의 단일 원본으로 사용
  - 자금 변경은 gameState.finance.funds를 직접 수정하지 말고 src/modules/finance.js를 통해 처리
  - 버스 운행/배정/해금은 src/modules/bus.js를 통해 처리
*/

import { reactive, toRaw } from 'vue'

export const SAVE_SCHEMA_VERSION = 1
export const GAME_VERSION = '0.1.0'

let initialized = false

export const gameState = reactive(createDefaultGameState())

export function initializeGameState() {
  if (initialized) {
    return
  }

  initialized = true
}

export function createGameSnapshot() {
  const rawState = toPlainObject(gameState)

  return {
    schemaVersion: SAVE_SCHEMA_VERSION,
    gameVersion: GAME_VERSION,
    savedAt: Date.now(),

    world: rawState.world,
    finance: rawState.finance,
    bus: rawState.bus,
    modes: rawState.modes,
    routes: rawState.routes,
    vehicles: rawState.vehicles,
    operationSlots: rawState.operationSlots,
    settlements: rawState.settlements,
    alerts: rawState.alerts,
    settings: rawState.settings
  }
}

export function applyGameSnapshot(snapshot) {
  const normalized = normalizeGameSnapshot(snapshot)

  replaceReactiveObject(gameState, normalized)

  return gameState
}

export function resetGameState() {
  replaceReactiveObject(gameState, createDefaultGameState())
}

export function getGameSummary() {
  return {
    companyName: gameState.world.companyName,
    funds: gameState.finance.funds,
    vehicleCount: gameState.vehicles.length,
    operationSlotCount: gameState.operationSlots.length,
    settlementCount: gameState.settlements.length,
    routeCount: gameState.routes.length
  }
}

function createDefaultGameState() {
  const now = Date.now()

  return {
    world: {
      id: 'world-primary',
      companyName: 'ME Transport',
      createdAt: now,
      updatedAt: now,
      version: GAME_VERSION,
      availableModes: ['bus', 'rail', 'air', 'ship', 'space']
    },

    finance: {
      funds: 0,
      totalRevenue: 0,
      totalExpense: 0,
      hourlyRevenue: 0,
      dailyCost: 0,
      updatedAt: now,
      ledger: []
    },

    bus: {
      unlockedRouteKeys: ['village-small'],
      research: {
        autoDispatch: false,
        demandBoostLevel: 0,
        revenueBoostLevel: 0,
        timeEfficiencyLevel: 0
      },
      settings: {
        manualByDefault: true
      }
    },

    modes: [
      {
        key: 'bus',
        label: '버스',
        running: 0,
        total: 10,
        hourlyRevenue: 0
      },
      {
        key: 'rail',
        label: '철도',
        running: 0,
        total: 0,
        hourlyRevenue: 0
      },
      {
        key: 'air',
        label: '항공',
        running: 0,
        total: 0,
        hourlyRevenue: 0
      },
      {
        key: 'ship',
        label: '선박',
        running: 0,
        total: 0,
        hourlyRevenue: 0
      },
      {
        key: 'space',
        label: '우주선',
        running: 0,
        total: 0,
        hourlyRevenue: 0
      }
    ],

    routes: [],
    vehicles: [],
    operationSlots: [],

    settlements: [],

    alerts: [],

    settings: {
      autosave: true,
      autosaveDelayMs: 5000,
      dashboardSlotLimit: 8,
      timezone: 'Asia/Seoul'
    }
  }
}

function normalizeGameSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') {
    throw new Error('게임 스냅샷 형식이 올바르지 않습니다.')
  }

  const base = createDefaultGameState()

  return {
    world: {
      ...base.world,
      ...(snapshot.world ?? {})
    },

    finance: {
      ...base.finance,
      ...(snapshot.finance ?? {}),
      funds: normalizeFunds(snapshot.finance?.funds ?? base.finance.funds),
      totalRevenue: normalizeNumber(snapshot.finance?.totalRevenue ?? base.finance.totalRevenue),
      totalExpense: normalizeNumber(snapshot.finance?.totalExpense ?? base.finance.totalExpense),
      hourlyRevenue: normalizeNumber(snapshot.finance?.hourlyRevenue ?? base.finance.hourlyRevenue),
      dailyCost: normalizeNumber(snapshot.finance?.dailyCost ?? base.finance.dailyCost),
      ledger: Array.isArray(snapshot.finance?.ledger)
        ? snapshot.finance.ledger
        : base.finance.ledger
    },

    bus: {
      ...base.bus,
      ...(snapshot.bus ?? {}),
      unlockedRouteKeys: Array.isArray(snapshot.bus?.unlockedRouteKeys)
        ? snapshot.bus.unlockedRouteKeys
        : base.bus.unlockedRouteKeys,
      research: {
        ...base.bus.research,
        ...(snapshot.bus?.research ?? {})
      },
      settings: {
        ...base.bus.settings,
        ...(snapshot.bus?.settings ?? {})
      }
    },

    modes: Array.isArray(snapshot.modes) ? snapshot.modes : base.modes,
    routes: Array.isArray(snapshot.routes) ? snapshot.routes : base.routes,
    vehicles: Array.isArray(snapshot.vehicles) ? snapshot.vehicles : base.vehicles,
    operationSlots: Array.isArray(snapshot.operationSlots)
      ? snapshot.operationSlots
      : base.operationSlots,
    settlements: Array.isArray(snapshot.settlements)
      ? snapshot.settlements
      : base.settlements,
    alerts: Array.isArray(snapshot.alerts) ? snapshot.alerts : base.alerts,

    settings: {
      ...base.settings,
      ...(snapshot.settings ?? {}),
      autosave: true
    }
  }
}

function replaceReactiveObject(target, source) {
  Object.keys(target).forEach((key) => {
    delete target[key]
  })

  Object.assign(target, source)
}

function toPlainObject(value) {
  return JSON.parse(JSON.stringify(toRaw(value)))
}

function normalizeFunds(value) {
  const safeValue = Number(value)

  if (!Number.isFinite(safeValue) || safeValue < 0) {
    return 0
  }

  return Math.floor(safeValue)
}

function normalizeNumber(value) {
  const safeValue = Number(value)

  if (!Number.isFinite(safeValue)) {
    return 0
  }

  return Math.floor(safeValue)
}