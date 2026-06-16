import { computed, reactive } from 'vue'

export const DEFAULT_MODULE_FUNDS = 300_000_000

function safeNumber(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function positiveAmount(value) {
  return Math.max(0, Math.floor(safeNumber(value)))
}

export function formatFinanceMoney(value) {
  return `${Math.floor(safeNumber(value)).toLocaleString('ko-KR')}R`
}

export function createFinanceModule(initialState = {}) {
  const state = reactive({
    moduleFunds: positiveAmount(initialState.moduleFunds ?? DEFAULT_MODULE_FUNDS),
    totalRevenue: positiveAmount(initialState.totalRevenue),
    totalExpense: positiveAmount(initialState.totalExpense),
    lastTransactionAt: initialState.lastTransactionAt || null,
    lastTransactionMemo: initialState.lastTransactionMemo || '',
  })

  const moduleFundsText = computed(() => formatFinanceMoney(state.moduleFunds))

  function snapshot() {
    return {
      moduleFunds: positiveAmount(state.moduleFunds),
      totalRevenue: positiveAmount(state.totalRevenue),
      totalExpense: positiveAmount(state.totalExpense),
      lastTransactionAt: state.lastTransactionAt,
      lastTransactionMemo: state.lastTransactionMemo,
    }
  }

  function restore(payload = {}) {
    const source = payload?.state && typeof payload.state === 'object' ? payload.state : payload
    state.moduleFunds = positiveAmount(source.moduleFunds ?? source.money ?? DEFAULT_MODULE_FUNDS)
    state.totalRevenue = positiveAmount(source.totalRevenue)
    state.totalExpense = positiveAmount(source.totalExpense)
    state.lastTransactionAt = source.lastTransactionAt || null
    state.lastTransactionMemo = source.lastTransactionMemo || ''
  }

  function addRevenue(amount, memo = '수익 반영') {
    const value = positiveAmount(amount)
    if (value <= 0) return 0

    state.moduleFunds += value
    state.totalRevenue += value
    state.lastTransactionAt = new Date().toISOString()
    state.lastTransactionMemo = memo
    return value
  }

  function spend(amount, memo = '지출 반영') {
    const value = positiveAmount(amount)
    if (value <= 0) return 0
    if (state.moduleFunds < value) return false

    state.moduleFunds -= value
    state.totalExpense += value
    state.lastTransactionAt = new Date().toISOString()
    state.lastTransactionMemo = memo
    return value
  }

  function canSpend(amount) {
    return state.moduleFunds >= positiveAmount(amount)
  }

  function reset(nextFunds = DEFAULT_MODULE_FUNDS) {
    state.moduleFunds = positiveAmount(nextFunds)
    state.totalRevenue = 0
    state.totalExpense = 0
    state.lastTransactionAt = null
    state.lastTransactionMemo = ''
  }

  return {
    state,
    moduleFundsText,
    snapshot,
    restore,
    addRevenue,
    spend,
    canSpend,
    reset,
    formatMoney: formatFinanceMoney,
  }
}

export const financeModule = createFinanceModule()
