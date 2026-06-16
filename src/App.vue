<template>
  <div class="rcts-shell">
    <header class="top-header">
      <div class="brand">
        <strong>RCTS</strong>

        <span>자동 운영</span>
      </div>

      <div class="fund-box">
        <span>모듈자금</span>
        <strong>{{ moduleFundsText }}</strong>
      </div>
    </header>

    <main class="page-body">
      <nav class="mode-tabs" aria-label="RCTS 메뉴">
        <button
          type="button"
          :class="{ active: activeMenu === 'operations' }"
          @click="activeMenu = 'operations'"
        >
          운영메인
        </button>
        <button
          type="button"
          :class="{ active: activeMenu === 'purchase' }"
          @click="activeMenu = 'purchase'"
        >
          구입센터
        </button>
      </nav>

      <section v-if="offlineReport" class="offline-card">
        <div>
          <strong>오프라인 반영</strong>

          <span>{{ offlineReport.elapsedText }} · {{ offlineReport.completedRuns }}회 · +{{ formatMoney(offlineReport.revenue) }}</span>
        </div>
        <button type="button" @click="offlineReport = null">닫기</button>
      </section>

      <section v-if="activeMenu === 'operations'" class="operations-page">
        <section class="summary-grid" aria-label="운영 요약">
          <article class="summary-card">
            <span>보유 차량</span>
            <strong>{{ ownedVehicles.length }}대</strong>
          </article>
          <article class="summary-card">
            <span>총 운행횟수</span>
            <strong>{{ totalRuns }}회</strong>
          </article>
          <article class="summary-card">
            <span>누적 수익</span>
            <strong>{{ formatMoney(financeModule.state.totalRevenue) }}</strong>
          </article>
          <article class="summary-card">
            <span>누적 지출</span>
            <strong>{{ formatMoney(financeModule.state.totalExpense) }}</strong>
          </article>
        </section>

        <section class="section-head">
          <div>
            <h1>운영메인</h1>
          </div>

          <button type="button" class="ghost-button" @click="activeMenu = 'purchase'">구입</button>
        </section>

        <section v-if="ownedVehicles.length" class="vehicle-list" aria-label="운영 중인 차량 목록">
          <article
            v-for="vehicle in ownedVehicles"
            :key="vehicle.id"
            class="vehicle-card"
            :class="vehicle.type"
          >
            <div class="vehicle-main">
              <span class="vehicle-kind">{{ vehicle.typeName }}</span>
              <h2>{{ vehicle.name }}</h2>
            </div>

            <div class="vehicle-timer">
              <span>남은 시간</span>
              <strong>{{ formatDuration(vehicle.remainingSeconds) }}</strong>
              <em>1회 {{ formatDuration(vehicle.durationSeconds) }}</em>
            </div>

            <div class="vehicle-stats">
              <span>운행 {{ vehicle.runs }}회</span>
              <strong>+{{ formatMoney(vehicle.revenuePerRun) }}</strong>

              <em>자동 정산</em>
            </div>
          </article>
        </section>

        <section v-else class="empty-card">

          <strong>운영 차량 없음</strong>
          <button type="button" @click="activeMenu = 'purchase'">구입센터</button>
        </section>
      </section>

      <section v-else class="purchase-page">
        <section class="section-head">
          <div>
            <h1>구입센터</h1>
          </div>
        </section>

        <section class="catalog-grid" aria-label="차량 구입 목록">
          <article
            v-for="item in vehicleCatalog"
            :key="item.id"
            class="catalog-card"
            :class="item.type"
          >
            <div class="catalog-icon">{{ item.icon }}</div>
            <div class="catalog-body">
              <span>{{ item.typeName }}</span>
              <h2>{{ item.name }}</h2>
              <dl>
                <div>
                  <dt>가격</dt>
                  <dd>{{ formatMoney(item.price) }}</dd>
                </div>
                <div>

                  <dt>시간</dt>
                  <dd>{{ formatDuration(item.durationSeconds) }}</dd>
                </div>
                <div>

                  <dt>수익</dt>
                  <dd>{{ formatMoney(item.revenuePerRun) }}</dd>
                </div>
              </dl>
            </div>

            <button
              type="button"
              class="buy-button"
              :disabled="!canBuy(item)"
              @click="buyVehicle(item)"
            >
              {{ canBuy(item) ? '구입' : '자금 부족' }}
            </button>
          </article>
        </section>
      </section>

      <section v-if="logs.length" class="log-card" aria-label="최근 기록">
        <header>

          <strong>기록</strong>
          <button type="button" @click="logs = []">삭제</button>
        </header>
        <ul>
          <li v-for="log in logs" :key="log.id">
            <span>{{ log.time }}</span>
            <p>{{ log.text }}</p>
          </li>
        </ul>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { loadRctsAutoSave, saveRctsAutoSave } from './storage/rctsSaveStorage.js'
import { DEFAULT_MODULE_FUNDS, financeModule, formatFinanceMoney } from './modules/finance.js'

const SAVE_SCHEMA_VERSION = 2
const AUTO_SAVE_INTERVAL_MS = 10 * 60 * 1000
const SECOND_MS = 1000
const SECOND = 1
const MINUTE = 60
const HOUR = 3600

const vehicleCatalog = [
  {
    id: 'basic_bus',
    type: 'bus',
    typeName: '버스',
    icon: '🚌',
    name: '기본 버스',
    description: '도로 운송',
    price: 180_000_000,
    durationSeconds: 30 * MINUTE,
    revenuePerRun: 300_000,
  },
  {
    id: 'basic_rail',
    type: 'rail',
    typeName: '철도',
    icon: '🚆',
    name: '기본 철도',
    description: '철도 편성',
    price: 850_000_000,
    durationSeconds: 1 * HOUR,
    revenuePerRun: 1_200_000,
  },
  {
    id: 'basic_air',
    type: 'air',
    typeName: '항공',
    icon: '✈️',
    name: '기본 항공',
    description: '항공 운송',
    price: 3_500_000_000,
    durationSeconds: 2 * HOUR,
    revenuePerRun: 4_500_000,
  },
  {
    id: 'basic_ship',
    type: 'ship',
    typeName: '선박',
    icon: '🚢',
    name: '기본 선박',
    description: '도심 수상교통',
    price: 650_000_000,
    durationSeconds: 2 * HOUR,
    revenuePerRun: 800_000,
  },
]

const activeMenu = ref('operations')
const ownedVehicles = reactive([])
const standardNow = ref(new Date())
const offlineReport = ref(null)
const moduleFundsText = financeModule.moduleFundsText
const logs = ref([])

let secondTimer = null
let autoSaveTimer = null
let standardTimer = null
let isSaving = false

const totalRuns = computed(() => ownedVehicles.reduce((sum, vehicle) => sum + vehicle.runs, 0))

function canBuy(item) {
  return financeModule.canSpend(item.price)
}

function buyVehicle(item) {
  const spent = financeModule.spend(item.price, `${item.name} 구입`)
  if (!spent) return

  const count = ownedVehicles.filter((vehicle) => vehicle.catalogId === item.id).length + 1
  ownedVehicles.unshift(createOwnedVehicle(item, count))

  addLog(`${item.name} ${count}호 구입`)
  activeMenu.value = 'operations'
  saveSoon()
}

function createOwnedVehicle(item, count = 1, overrides = {}) {
  return {
    id: overrides.id || cryptoRandomId(),
    catalogId: item.id,
    type: item.type,
    typeName: item.typeName,
    name: overrides.name || `${item.name} ${count}호`,
    description: item.description,
    price: item.price,
    durationSeconds: item.durationSeconds,
    remainingSeconds: normalizePositiveNumber(overrides.remainingSeconds, item.durationSeconds),
    revenuePerRun: item.revenuePerRun,
    runs: normalizePositiveNumber(overrides.runs, 0),
    purchasedAt: overrides.purchasedAt || new Date().toISOString(),
  }
}

function tickGame() {
  standardNow.value = new Date()

  ownedVehicles.forEach((vehicle) => {
    vehicle.remainingSeconds -= SECOND

    if (vehicle.remainingSeconds <= 0) {
      completeVehicleRun(vehicle)
    }
  })
}

function completeVehicleRun(vehicle, count = 1) {
  const completedCount = Math.max(1, Math.floor(Number(count) || 1))
  vehicle.runs += completedCount
  financeModule.addRevenue(vehicle.revenuePerRun * completedCount, `${vehicle.name} 운행 완료`)

  if (completedCount === 1) {
    vehicle.remainingSeconds += vehicle.durationSeconds

    addLog(`${vehicle.name} 완료 · +${formatMoney(vehicle.revenuePerRun)}`)
  }
}

function applyOfflineProgress(elapsedSeconds) {
  if (!elapsedSeconds || elapsedSeconds < 1 || ownedVehicles.length === 0) return

  let completedRuns = 0
  let revenue = 0

  ownedVehicles.forEach((vehicle) => {
    const beforeRemaining = Math.max(0, Math.floor(Number(vehicle.remainingSeconds) || vehicle.durationSeconds))
    const duration = Math.max(1, Math.floor(Number(vehicle.durationSeconds) || 1))
    const totalProgress = elapsedSeconds + (duration - beforeRemaining)
    const completed = Math.floor(totalProgress / duration)
    const nextProgress = totalProgress % duration

    if (completed > 0) {
      vehicle.runs += completed
      completedRuns += completed
      revenue += vehicle.revenuePerRun * completed
    }

    vehicle.remainingSeconds = duration - nextProgress
    if (vehicle.remainingSeconds <= 0) vehicle.remainingSeconds = duration
  })

  if (revenue > 0) {
    financeModule.addRevenue(revenue, '오프라인 운행 수익')
    offlineReport.value = {
      elapsedText: formatDuration(elapsedSeconds),
      completedRuns,
      revenue,
    }

    addLog(`오프라인 ${completedRuns}회 · +${formatMoney(revenue)}`)
  }
}

function getSavePayload() {
  return {
    schemaVersion: SAVE_SCHEMA_VERSION,
    savedAt: new Date().toISOString(),
    activeMenu: activeMenu.value,
    standardTime: standardNow.value.toISOString(),
    finance: financeModule.snapshot(),
    ownedVehicles: ownedVehicles.map((vehicle) => ({ ...vehicle })),
    logs: logs.value.slice(0, 30),
  }
}

async function saveSoon() {
  if (isSaving) return
  isSaving = true

  try {
    await saveRctsAutoSave(getSavePayload())
  } finally {
    isSaving = false
  }
}

async function loadSave() {
  const record = await loadRctsAutoSave()
  const payload = record?.payload

  if (!payload || payload.schemaVersion !== SAVE_SCHEMA_VERSION) {
    financeModule.reset(DEFAULT_MODULE_FUNDS)

    addLog('새 구조 시작')
    return
  }

  financeModule.restore(payload.finance)

  if (payload.activeMenu === 'operations' || payload.activeMenu === 'purchase') {
    activeMenu.value = payload.activeMenu
  }

  if (Array.isArray(payload.ownedVehicles)) {
    const restored = payload.ownedVehicles
      .map(normalizeSavedVehicle)
      .filter(Boolean)
    ownedVehicles.splice(0, ownedVehicles.length, ...restored)
  }

  if (Array.isArray(payload.logs)) {
    logs.value = payload.logs.slice(0, 30)
  }

  const savedAt = new Date(payload.savedAt || record.savedAt || Date.now())
  if (!Number.isNaN(savedAt.getTime())) {
    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - savedAt.getTime()) / SECOND_MS))
    applyOfflineProgress(elapsedSeconds)
  }
}

function normalizeSavedVehicle(savedVehicle) {
  const catalogItem = vehicleCatalog.find((item) => item.id === savedVehicle?.catalogId)
  if (!catalogItem) return null

  return createOwnedVehicle(catalogItem, 1, {
    id: savedVehicle.id,
    name: savedVehicle.name,
    remainingSeconds: clampDuration(savedVehicle.remainingSeconds, catalogItem.durationSeconds),
    runs: savedVehicle.runs,
    purchasedAt: savedVehicle.purchasedAt,
  })
}

function clampDuration(value, durationSeconds) {
  const number = Math.floor(Number(value))
  if (!Number.isFinite(number) || number <= 0) return durationSeconds
  return Math.min(number, durationSeconds)
}

function normalizePositiveNumber(value, fallback = 0) {
  const number = Math.floor(Number(value))
  if (!Number.isFinite(number) || number < 0) return fallback
  return number
}

function addLog(text) {
  logs.value = [
    {
      id: cryptoRandomId(),
      time: formatLogTime(new Date()),
      text,
    },
    ...logs.value,
  ].slice(0, 30)
}

function scheduleTimers() {
  secondTimer = window.setInterval(tickGame, SECOND_MS)
  autoSaveTimer = window.setInterval(saveSoon, AUTO_SAVE_INTERVAL_MS)
  scheduleStandardTick()
}

function scheduleStandardTick() {
  standardNow.value = new Date()
  const delay = SECOND_MS - standardNow.value.getMilliseconds()
  standardTimer = window.setTimeout(scheduleStandardTick, delay)
}

function handleVisibilityChange() {
  if (document.visibilityState === 'hidden') saveSoon()
}

function formatMoney(value) {
  return formatFinanceMoney(value)
}

function formatDuration(seconds) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0))
  const hours = Math.floor(total / HOUR)
  const minutes = Math.floor((total % HOUR) / MINUTE)
  const secs = total % MINUTE

  if (hours > 0) return `${hours}시간 ${minutes}분`
  if (minutes > 0) return `${minutes}분 ${secs}초`
  return `${secs}초`
}

function formatLogTime(date) {
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

function cryptoRandomId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

onMounted(async () => {
  await loadSave()
  scheduleTimers()
  window.addEventListener('beforeunload', saveSoon)
  document.addEventListener('visibilitychange', handleVisibilityChange)
  saveSoon()
})

onBeforeUnmount(() => {
  if (secondTimer) window.clearInterval(secondTimer)
  if (autoSaveTimer) window.clearInterval(autoSaveTimer)
  if (standardTimer) window.clearTimeout(standardTimer)
  window.removeEventListener('beforeunload', saveSoon)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  saveSoon()
})
</script>

<style scoped>
:global(*) {
  box-sizing: border-box;
}

:global(body) {
  margin: 0;
  min-width: 320px;
  color: #0f172a;
  background:
    radial-gradient(circle at top left, rgba(96, 165, 250, 0.22), transparent 34%),
    linear-gradient(135deg, #eef4ff 0%, #f8fafc 44%, #ecfeff 100%);
  font-family: Inter, Pretendard, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

button,
input {
  font: inherit;
}

button {
  border: 0;
  cursor: pointer;
}

button:disabled {
  cursor: not-allowed;
}

.rcts-shell {
  min-height: 100vh;
}

.top-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px clamp(14px, 4vw, 34px);
  background: rgba(248, 250, 252, 0.88);
  border-bottom: 1px solid rgba(148, 163, 184, 0.24);
  backdrop-filter: blur(16px);
}

.brand {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.brand strong {
  font-size: 20px;
  letter-spacing: -0.04em;
}

.brand span,
.fund-box span,
.summary-card span,
.vehicle-kind,
.vehicle-timer span,
.vehicle-stats span,
.catalog-body span,
.catalog-body dt,
.log-card li span {
  color: #64748b;
  font-size: 12px;
}

.fund-box {
  display: grid;
  gap: 2px;
  min-width: 140px;
  padding: 8px 12px;
  text-align: right;
  border: 1px solid rgba(37, 99, 235, 0.18);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
}

.fund-box strong {
  color: #1d4ed8;
  font-size: 18px;
  letter-spacing: -0.04em;
}

.page-body {
  width: min(1180px, calc(100% - 28px));
  margin: 0 auto;
  padding: 16px 0 44px;
}

.mode-tabs {
  display: flex;
  gap: 8px;
  padding: 6px;
  margin-bottom: 14px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.68);
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.06);
}

.mode-tabs button {
  flex: 1;
  padding: 10px 12px;
  color: #475569;
  font-weight: 800;
  border-radius: 16px;
  background: transparent;
}

.mode-tabs button.active {
  color: #0f172a;
  background: #ffffff;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
}

.offline-card,
.empty-card,
.log-card,
.section-head,
.summary-card,
.vehicle-card,
.catalog-card {
  border: 1px solid rgba(148, 163, 184, 0.24);
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 16px 42px rgba(15, 23, 42, 0.08);
}

.offline-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  margin-bottom: 14px;
  border-radius: 20px;
}

.offline-card div {
  display: grid;
  gap: 3px;
}

.offline-card strong {
  color: #1d4ed8;
  font-size: 13px;
}

.offline-card span {
  color: #64748b;
  font-size: 12px;
}

.offline-card button,
.ghost-button,
.empty-card button,
.log-card header button {
  padding: 10px 12px;
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 900;
  border-radius: 14px;
  background: rgba(37, 99, 235, 0.09);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 14px;
}

.summary-card {
  display: grid;
  gap: 6px;
  padding: 11px 14px;
  border-radius: 18px;
}

.summary-card strong {
  color: #0f172a;
  font-size: 22px;
  letter-spacing: -0.05em;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  margin-bottom: 12px;
  border-radius: 20px;
}

.section-head h1 {
  margin: 0 0 5px;
  font-size: clamp(24px, 4vw, 34px);
  letter-spacing: -0.06em;
}

.section-head p,
.empty-card p,
.catalog-body p,
.vehicle-main p {
  margin: 0;
  color: #64748b;
  font-size: 13px;
  line-height: 1.55;
}

.vehicle-list,
.catalog-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 12px;
  width: 100%;
}

.vehicle-card,
.catalog-card {
  width: 100%;
}

.vehicle-card {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 12px;
  align-items: center;
  overflow: hidden;
  padding: 14px 16px;
  border-radius: 22px;
}

.vehicle-card::before,
.catalog-card::before {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: 5px;
  background: #2563eb;
}

.vehicle-card.rail::before,
.catalog-card.rail::before { background: #7c3aed; }
.vehicle-card.air::before,
.catalog-card.air::before { background: #0891b2; }
.vehicle-card.ship::before,
.catalog-card.ship::before { background: #0f766e; }

.vehicle-main,
.catalog-body {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 6px;
}

.vehicle-main h2,
.catalog-body h2 {
  margin: 0;
  font-size: 19px;
  letter-spacing: -0.04em;
}

.vehicle-timer,
.vehicle-stats {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 4px;
  min-width: 112px;
  padding: 10px;
  border-radius: 18px;
  background: rgba(248, 250, 252, 0.88);
}

.vehicle-timer strong,
.vehicle-stats strong {
  color: #0f172a;
  font-size: 18px;
  letter-spacing: -0.05em;
}

.vehicle-timer em,
.vehicle-stats em {
  color: #94a3b8;
  font-size: 11px;
  font-style: normal;
}

.empty-card {
  display: grid;
  gap: 8px;
  place-items: center;
  padding: 42px 20px;
  text-align: center;
  border-radius: 28px;
}

.empty-card strong {
  font-size: 20px;
  letter-spacing: -0.04em;
}

.catalog-card {
  position: relative;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 14px;
  padding: 14px 16px;
  border-radius: 22px;
}

.catalog-icon {
  position: relative;
  z-index: 1;
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 15px;
  background: rgba(37, 99, 235, 0.1);
  font-size: 23px;
}

.catalog-body dl {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin: 8px 0 0;
}

.catalog-body dl div {
  display: grid;
  gap: 3px;
  padding: 10px;
  border-radius: 16px;
  background: rgba(248, 250, 252, 0.9);
}

.catalog-body dd {
  margin: 0;
  color: #0f172a;
  font-size: 13px;
  font-weight: 900;
  letter-spacing: -0.03em;
}

.buy-button {
  grid-column: 1 / -1;
  position: relative;
  z-index: 1;
  padding: 11px 14px;
  color: #ffffff;
  font-weight: 900;
  border-radius: 16px;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  box-shadow: 0 12px 26px rgba(37, 99, 235, 0.22);
}

.buy-button:disabled {
  color: #94a3b8;
  background: #e2e8f0;
  box-shadow: none;
}

.log-card {
  margin-top: 14px;
  padding: 16px;
  border-radius: 24px;
}

.log-card header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.log-card ul {
  display: grid;
  gap: 8px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.log-card li {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  gap: 10px;
  align-items: start;
  padding: 9px 10px;
  border-radius: 14px;
  background: rgba(248, 250, 252, 0.84);
}

.log-card li p {
  margin: 0;
  color: #334155;
  font-size: 13px;
  line-height: 1.45;
}

@media (max-width: 860px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .vehicle-list,
  .catalog-grid {
    grid-template-columns: 1fr;
  }

  .vehicle-card {
    grid-template-columns: minmax(0, 1fr) auto auto;
  }
}

@media (max-width: 560px) {
  .top-header {
    gap: 8px;
    padding: 8px 10px;
  }

  .brand span {
    display: none;
  }

  .brand strong {
    font-size: 18px;
  }

  .fund-box {
    min-width: auto;
    padding: 7px 9px;
    text-align: right;
    border-radius: 13px;
  }

  .fund-box span {
    font-size: 10px;
  }

  .fund-box strong {
    font-size: 14px;
  }

  .page-body {
    width: calc(100% - 12px);
    padding: 8px 0 28px;
  }

  .mode-tabs {
    gap: 5px;
    padding: 4px;
    margin-bottom: 8px;
    border-radius: 14px;
  }

  .mode-tabs button {
    padding: 8px 6px;
    font-size: 13px;
    border-radius: 10px;
  }

  .summary-grid {
    gap: 6px;
    margin-bottom: 8px;
  }

  .summary-card {
    gap: 2px;
    padding: 8px 9px;
    border-radius: 13px;
  }

  .summary-card span,
  .vehicle-kind,
  .vehicle-timer span,
  .vehicle-stats span,
  .catalog-body span,
  .catalog-body dt,
  .log-card li span {
    font-size: 10px;
  }

  .summary-card strong {
    font-size: 15px;
  }

  .section-head {
    gap: 8px;
    padding: 9px 10px;
    margin-bottom: 8px;
    border-radius: 14px;
  }

  .section-head h1 {
    margin: 0;
    font-size: 18px;
  }

  .ghost-button,
  .offline-card button,
  .empty-card button,
  .log-card header button {
    padding: 7px 9px;
    font-size: 11px;
    border-radius: 10px;
  }

  .offline-card {
    gap: 8px;
    padding: 8px 9px;
    margin-bottom: 8px;
    border-radius: 14px;
  }

  .offline-card strong,
  .offline-card span {
    font-size: 11px;
  }

  .vehicle-list,
  .catalog-grid {
    gap: 7px;
  }

  .vehicle-card {
    grid-template-columns: minmax(0, 1fr) minmax(82px, auto);
    gap: 7px;
    padding: 9px 9px 9px 13px;
    border-radius: 15px;
  }

  .vehicle-card::before,
  .catalog-card::before {
    width: 3px;
  }

  .vehicle-main {
    grid-column: 1 / -1;
    gap: 2px;
  }

  .vehicle-main h2,
  .catalog-body h2 {
    font-size: 15px;
  }

  .vehicle-timer,
  .vehicle-stats {
    min-width: 0;
    gap: 2px;
    padding: 7px;
    border-radius: 11px;
  }

  .vehicle-timer strong,
  .vehicle-stats strong {
    font-size: 14px;
  }

  .vehicle-timer em,
  .vehicle-stats em {
    display: none;
  }

  .empty-card {
    gap: 8px;
    padding: 24px 14px;
    border-radius: 18px;
  }

  .empty-card strong {
    font-size: 16px;
  }

  .catalog-card {
    grid-template-columns: 34px minmax(0, 1fr);
    gap: 8px;
    padding: 9px 9px 9px 13px;
    border-radius: 15px;
  }

  .catalog-icon {
    width: 34px;
    height: 34px;
    border-radius: 11px;
    font-size: 19px;
  }

  .catalog-body {
    gap: 3px;
  }

  .catalog-body dl {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 4px;
    margin-top: 5px;
  }

  .catalog-body dl div {
    gap: 1px;
    padding: 5px;
    border-radius: 9px;
  }

  .catalog-body dd {
    font-size: 10px;
    line-height: 1.2;
  }

  .buy-button {
    padding: 8px 10px;
    border-radius: 11px;
  }

  .log-card {
    max-height: 170px;
    overflow: auto;
    margin-top: 8px;
    padding: 9px;
    border-radius: 15px;
  }

  .log-card header {
    margin-bottom: 6px;
  }

  .log-card ul {
    gap: 5px;
  }

  .log-card li {
    grid-template-columns: 34px minmax(0, 1fr);
    gap: 6px;
    padding: 6px 7px;
    border-radius: 10px;
  }

  .log-card li p {
    font-size: 12px;
    line-height: 1.35;
  }
}
</style>
