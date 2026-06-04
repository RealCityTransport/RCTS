/*
  파일 주소:
  src/modules/finance.js

  적용 내용:
  - RCTS 자금 관리 전용 모듈
  - gameState.finance.funds를 직접 조작하지 않고 이 모듈을 통해 수익/비용을 처리
  - 수익 추가, 비용 지출, 구매 가능 여부 확인, 환불, 장부 기록, 요약 계산 제공
  - 자금이 음수가 되지 않도록 방지
  - 수익/비용 처리 시 finance.ledger에 기록
  - 수익 처리 시 최근 정산 기록에도 반영 가능
  - save.js 자동저장을 통해 변경된 자금 상태가 자동 저장됨

  연결된 파일:
  - src/modules/gameState.js
  - src/modules/save.js
  - src/components/layout/RctsHeader.vue
  - src/views/Home.vue
  - src/views/SettingsView.vue

  향후 연결 예정:
  - src/modules/settlement.js
  - src/modules/operations.js
  - src/modules/bus.js
  - src/modules/air.js
  - src/modules/ship.js
  - src/modules/research.js

  수정 시 주의:
  - 다른 파일에서 gameState.finance.funds를 직접 수정하지 말 것
  - 자금 증감은 addIncome(), addExpense(), spendFunds(), refundFunds()를 통해 처리
  - 비용 처리 시 allowDebt 기본값은 false이며, 자금 부족 시 실패 처리
*/

import { gameState } from './gameState'

const LEDGER_LIMIT = 100
const SETTLEMENT_LIMIT = 30

export const FINANCE_TYPES = {
  INCOME: 'INCOME',
  EXPENSE: 'EXPENSE',
  REFUND: 'REFUND',
  ADJUSTMENT: 'ADJUSTMENT'
}

export const FINANCE_SOURCES = {
  BUS_SETTLEMENT: 'BUS_SETTLEMENT',
  RAIL_SETTLEMENT: 'RAIL_SETTLEMENT',
  AIR_SETTLEMENT: 'AIR_SETTLEMENT',
  SHIP_SETTLEMENT: 'SHIP_SETTLEMENT',
  CRUISE_SETTLEMENT: 'CRUISE_SETTLEMENT',

  VEHICLE_PURCHASE: 'VEHICLE_PURCHASE',
  SLOT_UPGRADE: 'SLOT_UPGRADE',
  RESEARCH: 'RESEARCH',
  OPERATION_COST: 'OPERATION_COST',
  MAINTENANCE: 'MAINTENANCE',

  REFUND: 'REFUND',
  SYSTEM: 'SYSTEM'
}

export function getFunds() {
  ensureFinanceShape()

  return gameState.finance.funds
}

export function canAfford(amount) {
  const safeAmount = normalizeAmount(amount)

  return gameState.finance.funds >= safeAmount
}

export function addIncome({
  amount,
  source = FINANCE_SOURCES.SYSTEM,
  title = '수익',
  detail = '',
  mode = '',
  relatedId = '',
  addToSettlements = true
}) {
  ensureFinanceShape()

  const safeAmount = normalizeAmount(amount)

  if (safeAmount <= 0) {
    return createFinanceResult(false, '수익 금액이 올바르지 않습니다.')
  }

  const before = gameState.finance.funds
  const after = before + safeAmount

  gameState.finance.funds = after
  gameState.finance.totalRevenue += safeAmount
  gameState.finance.updatedAt = Date.now()

  const record = recordLedger({
    type: FINANCE_TYPES.INCOME,
    source,
    title,
    detail,
    mode,
    relatedId,
    amount: safeAmount,
    balanceBefore: before,
    balanceAfter: after
  })

  if (addToSettlements) {
    addSettlementRecord({
      title,
      detail,
      amount: safeAmount,
      source,
      mode,
      relatedId
    })
  }

  return createFinanceResult(true, '수익이 반영되었습니다.', record)
}

export function addExpense({
  amount,
  source = FINANCE_SOURCES.OPERATION_COST,
  title = '비용',
  detail = '',
  mode = '',
  relatedId = '',
  allowDebt = false
}) {
  ensureFinanceShape()

  const safeAmount = normalizeAmount(amount)

  if (safeAmount <= 0) {
    return createFinanceResult(false, '비용 금액이 올바르지 않습니다.')
  }

  if (!allowDebt && !canAfford(safeAmount)) {
    return createFinanceResult(false, '보유 자금이 부족합니다.')
  }

  const before = gameState.finance.funds
  const after = allowDebt ? before - safeAmount : Math.max(0, before - safeAmount)

  gameState.finance.funds = after
  gameState.finance.totalExpense += safeAmount
  gameState.finance.updatedAt = Date.now()

  const record = recordLedger({
    type: FINANCE_TYPES.EXPENSE,
    source,
    title,
    detail,
    mode,
    relatedId,
    amount: safeAmount,
    balanceBefore: before,
    balanceAfter: after
  })

  return createFinanceResult(true, '비용이 반영되었습니다.', record)
}

export function spendFunds({
  amount,
  source = FINANCE_SOURCES.SYSTEM,
  title = '지출',
  detail = '',
  mode = '',
  relatedId = ''
}) {
  return addExpense({
    amount,
    source,
    title,
    detail,
    mode,
    relatedId,
    allowDebt: false
  })
}

export function refundFunds({
  amount,
  source = FINANCE_SOURCES.REFUND,
  title = '환불',
  detail = '',
  mode = '',
  relatedId = ''
}) {
  ensureFinanceShape()

  const safeAmount = normalizeAmount(amount)

  if (safeAmount <= 0) {
    return createFinanceResult(false, '환불 금액이 올바르지 않습니다.')
  }

  const before = gameState.finance.funds
  const after = before + safeAmount

  gameState.finance.funds = after
  gameState.finance.updatedAt = Date.now()

  const record = recordLedger({
    type: FINANCE_TYPES.REFUND,
    source,
    title,
    detail,
    mode,
    relatedId,
    amount: safeAmount,
    balanceBefore: before,
    balanceAfter: after
  })

  return createFinanceResult(true, '환불이 반영되었습니다.', record)
}

export function recordLedger({
  type,
  source,
  title,
  detail = '',
  mode = '',
  relatedId = '',
  amount,
  balanceBefore,
  balanceAfter
}) {
  ensureFinanceShape()

  const now = Date.now()

  const record = {
    id: `finance-${now}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    source,
    title,
    detail,
    mode,
    relatedId,
    amount,
    balanceBefore,
    balanceAfter,
    createdAt: now,
    time: formatShortTime(now)
  }

  gameState.finance.ledger.unshift(record)
  gameState.finance.ledger = gameState.finance.ledger.slice(0, LEDGER_LIMIT)

  return record
}

export function getFinanceSummary() {
  ensureFinanceShape()

  const totalRevenue = gameState.finance.totalRevenue
  const totalExpense = gameState.finance.totalExpense
  const funds = gameState.finance.funds
  const netRevenue = totalRevenue - totalExpense

  return {
    funds,
    totalRevenue,
    totalExpense,
    netRevenue,
    hourlyRevenue: gameState.finance.hourlyRevenue ?? 0,
    dailyCost: gameState.finance.dailyCost ?? 0,
    ledgerCount: gameState.finance.ledger.length,
    updatedAt: gameState.finance.updatedAt
  }
}

export function getRecentFinanceRecords(limit = 10) {
  ensureFinanceShape()

  return gameState.finance.ledger.slice(0, limit)
}

export function formatMoney(value) {
  const safeValue = Number(value)

  if (!Number.isFinite(safeValue)) {
    return '0R'
  }

  return `${new Intl.NumberFormat('ko-KR').format(Math.floor(safeValue))}R`
}

export function formatSignedMoney(value) {
  const safeValue = Number(value)

  if (!Number.isFinite(safeValue)) {
    return '0R'
  }

  const sign = safeValue > 0 ? '+' : ''

  return `${sign}${formatMoney(safeValue)}`
}

function addSettlementRecord({
  title,
  detail,
  amount,
  source,
  mode,
  relatedId
}) {
  const now = Date.now()

  gameState.settlements.unshift({
    id: `settlement-${now}-${Math.random().toString(36).slice(2, 8)}`,
    time: formatShortTime(now),
    title,
    detail,
    amount,
    source,
    mode,
    relatedId,
    createdAt: now
  })

  gameState.settlements = gameState.settlements.slice(0, SETTLEMENT_LIMIT)
}

function ensureFinanceShape() {
  if (!gameState.finance) {
    gameState.finance = {}
  }

  if (typeof gameState.finance.funds !== 'number') {
    gameState.finance.funds = 0
  }

  if (typeof gameState.finance.totalRevenue !== 'number') {
    gameState.finance.totalRevenue = 0
  }

  if (typeof gameState.finance.totalExpense !== 'number') {
    gameState.finance.totalExpense = 0
  }

  if (typeof gameState.finance.hourlyRevenue !== 'number') {
    gameState.finance.hourlyRevenue = 0
  }

  if (typeof gameState.finance.dailyCost !== 'number') {
    gameState.finance.dailyCost = 0
  }

  if (!Array.isArray(gameState.finance.ledger)) {
    gameState.finance.ledger = []
  }

  if (typeof gameState.finance.updatedAt !== 'number') {
    gameState.finance.updatedAt = Date.now()
  }

  if (!Array.isArray(gameState.settlements)) {
    gameState.settlements = []
  }
}

function normalizeAmount(amount) {
  const safeAmount = Number(amount)

  if (!Number.isFinite(safeAmount)) {
    return 0
  }

  return Math.max(0, Math.floor(safeAmount))
}

function createFinanceResult(success, message, record = null) {
  return {
    success,
    message,
    record,
    funds: gameState.finance?.funds ?? 0
  }
}

function formatShortTime(value) {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(new Date(value))
}