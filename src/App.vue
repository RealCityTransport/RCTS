<template>
  <div class="rcts-page">
    <header class="topbar">
      <div class="brand-block">
        <span>Realtime Mission Simulation</span>
        <h1>RCTS</h1>
      </div>

      <aside class="digital-clock" aria-label="현 표준시간">
        <span>현 표준시간</span>
        <strong>{{ digitalClockText }}</strong>
        <em>{{ digitalDateText }}</em>
      </aside>
    </header>

    <main class="deck-panel" aria-label="통합카드덱">
      <header class="deck-head">
        <span>통합카드덱</span>
        <strong>{{ watchCards.length }}개 진행중</strong>
      </header>

      <div class="card-deck">
        <article
          v-for="card in watchCards"
          :key="card.id"
          class="watch-card"
          :class="[card.kind, card.group || '', card.status || '']"
        >
          <div class="card-label">{{ card.badge }}</div>

          <div class="card-bodyline">
            <h2>{{ card.title }}</h2>
            <strong>{{ card.timeLabel }}</strong>
          </div>

          <div class="progress-track" aria-label="진행률">
            <span :style="{ width: `${card.progress}%` }"></span>
          </div>

          <p v-if="card.sub">{{ card.sub }}</p>
        </article>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { loadRctsAutoSave, saveRctsAutoSave } from './storage/rctsSaveStorage.js'

const SAVE_SCHEMA_VERSION = 8
const SECOND_MS = 1000
const MINUTE_MS = 60 * SECOND_MS
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS
const AUTO_SAVE_INTERVAL_MS = 60 * SECOND_MS
const OPERATION_INTERVAL_MS = HOUR_MS
const FACILITY_INTERVAL_MS = 7 * DAY_MS
const MAX_OPERATION_CATCH_UP = 120
const MAX_FACILITY_CATCH_UP = 30
const MAINTENANCE_SLOT_LIMIT = 5

const groupLabels = {
  bus: '버스',
  rail: '철도',
  air: '항공',
  ship: '선박',
  space: '우주',
}

const maintenanceGroups = [
  { id: 'bus', label: '버스' },
  { id: 'rail', label: '철도' },
  { id: 'air', label: '항공' },
  { id: 'ship', label: '선박' },
  { id: 'space', label: '우주' },
]

const operationGroups = [
  { id: 'bus', label: '버스', title: '버스운행', minMs: 1 * HOUR_MS, maxMs: 4 * HOUR_MS },
  { id: 'rail', label: '철도', title: '철도운행', minMs: 2 * HOUR_MS, maxMs: 6 * HOUR_MS },
  { id: 'air', label: '항공', title: '항공운항', minMs: 1 * HOUR_MS, maxMs: 15 * HOUR_MS },
  { id: 'ship', label: '선박', title: '선박운항', minMs: 1 * DAY_MS, maxMs: 30 * DAY_MS },
]

const facilityCatalog = [
  { title: '도로설치', type: 'install', totalMin: 30, totalMax: 500, dailyMin: 2, dailyMax: 5 },
  { title: '철도설치', type: 'install', totalMin: 30, totalMax: 500, dailyMin: 1, dailyMax: 3 },
  { title: '시설유지보수', type: 'maintenance', totalMin: 5, totalMax: 120, dailyMin: 4, dailyMax: 10 },
  { title: '도로유지보수', type: 'maintenance', totalMin: 10, totalMax: 180, dailyMin: 5, dailyMax: 12 },
  { title: '철도유지보수', type: 'maintenance', totalMin: 10, totalMax: 160, dailyMin: 3, dailyMax: 8 },
]

const standardNow = ref(new Date())
let tickTimer = null
let autoSaveTimer = null
let saveLock = false

const state = reactive({
  acceptedMissions: [],
  facilityQueue: [],
  activeFacilityMission: null,
  maintenanceCenters: createEmptyMaintenanceCenters(),
  lastOperationByGroup: {},
  lastFacilityAt: '',
})

const digitalDateText = computed(() => formatDateOnly(standardNow.value))
const digitalClockText = computed(() => formatClockTime(standardNow.value))

const operationSorted = computed(() => {
  return [...state.acceptedMissions].sort((a, b) => toTime(a.endsAt) - toTime(b.endsAt))
})

const facilityQueueSorted = computed(() => {
  return [...state.facilityQueue].sort((a, b) => toTime(a.createdAt) - toTime(b.createdAt))
})

const watchCards = computed(() => {
  const cards = []

  if (state.activeFacilityMission) {
    cards.push(createFacilityWatchCard(state.activeFacilityMission, 'active'))
  }

  facilityQueueSorted.value.slice(0, 4).forEach((mission, index) => {
    cards.push(createFacilityWatchCard(mission, `queue-${index + 1}`))
  })

  operationSorted.value.slice(0, 40).forEach((mission) => {
    cards.push(createOperationWatchCard(mission))
  })

  allMaintenanceItems().slice(0, 20).forEach((item) => {
    cards.push(createMaintenanceWatchCard(item))
  })

  return cards
    .filter(Boolean)
    .sort((a, b) => a.sortAt - b.sortAt)
    .slice(0, 48)
})

function bootstrapNewGame(now) {
  standardNow.value = now
  state.acceptedMissions = []
  state.facilityQueue = []
  state.activeFacilityMission = null
  state.maintenanceCenters = createEmptyMaintenanceCenters()
  state.lastOperationByGroup = {}
  state.lastFacilityAt = now.toISOString()

  operationGroups.forEach((group, index) => {
    const seedDate = new Date(now.getTime() - randomInteger(5, 45) * MINUTE_MS - index * 2 * MINUTE_MS)
    generateOperationMission(group, seedDate)
    state.lastOperationByGroup[group.id] = now.toISOString()
  })

  generateFacilityMission(new Date(now.getTime() - 2 * DAY_MS))
  processGameState(now)
}

function processGameState(now) {
  standardNow.value = now
  maybeGenerateOperations(now)
  maybeGenerateFacility(now)
  processFacility(now)
  processMaintenance(now)
  completeOperationMissions(now)
  trimLists()
}

function maybeGenerateOperations(now) {
  operationGroups.forEach((group) => {
    const last = toTime(state.lastOperationByGroup[group.id]) || now.getTime()
    const elapsed = Math.floor((now.getTime() - last) / OPERATION_INTERVAL_MS)

    if (elapsed <= 0) {
      if (!state.lastOperationByGroup[group.id]) state.lastOperationByGroup[group.id] = now.toISOString()
      return
    }

    const count = Math.min(elapsed, MAX_OPERATION_CATCH_UP)

    for (let index = count; index >= 1; index -= 1) {
      generateOperationMission(group, new Date(now.getTime() - index * OPERATION_INTERVAL_MS))
    }

    state.lastOperationByGroup[group.id] = new Date(last + elapsed * OPERATION_INTERVAL_MS).toISOString()
  })
}

function generateOperationMission(group, date) {
  const durationMs = randomInteger(group.minMs, group.maxMs)

  state.acceptedMissions.push({
    id: createId('op'),
    kind: 'operation',
    group: group.id,
    title: group.title,
    durationMs,
    startedAt: date.toISOString(),
    endsAt: new Date(date.getTime() + durationMs).toISOString(),
  })
}

function completeOperationMissions(now) {
  state.acceptedMissions = state.acceptedMissions.filter((mission) => {
    return toTime(mission.endsAt) > now.getTime()
  })
}

function maybeGenerateFacility(now) {
  const last = toTime(state.lastFacilityAt) || now.getTime()
  const elapsed = Math.floor((now.getTime() - last) / FACILITY_INTERVAL_MS)

  if (elapsed <= 0) {
    if (!state.lastFacilityAt) state.lastFacilityAt = now.toISOString()
    return
  }

  const count = Math.min(elapsed, MAX_FACILITY_CATCH_UP)

  for (let index = count; index >= 1; index -= 1) {
    generateFacilityMission(new Date(now.getTime() - index * FACILITY_INTERVAL_MS))
  }

  state.lastFacilityAt = new Date(last + elapsed * FACILITY_INTERVAL_MS).toISOString()
}

function generateFacilityMission(date) {
  const template = pickRandom(facilityCatalog)
  const mission = createFacilityMission(template, date)

  if (!state.activeFacilityMission) {
    startFacilityMission(mission, date)
  } else {
    state.facilityQueue.push(mission)
  }

  return mission
}

function createFacilityMission(template, date) {
  const totalKm = randomInteger(template.totalMin, template.totalMax)
  const dailyKm = randomInteger(template.dailyMin, template.dailyMax)
  const durationMs = Math.ceil(totalKm / dailyKm) * DAY_MS

  return {
    id: createId('facility'),
    kind: 'facility',
    type: template.type,
    title: template.title,
    totalKm,
    dailyKm,
    durationMs,
    createdAt: date.toISOString(),
    startedAt: '',
    endsAt: '',
  }
}

function startFacilityMission(mission, date) {
  state.activeFacilityMission = {
    ...mission,
    startedAt: date.toISOString(),
    endsAt: new Date(date.getTime() + mission.durationMs).toISOString(),
  }
}

function processFacility(now) {
  if (state.activeFacilityMission && toTime(state.activeFacilityMission.endsAt) <= now.getTime()) {
    state.activeFacilityMission = null
  }

  if (!state.activeFacilityMission && state.facilityQueue.length) {
    const [nextMission, ...rest] = facilityQueueSorted.value
    state.facilityQueue = rest
    startFacilityMission(nextMission, now)
  }
}

function createEmptyMaintenanceCenters() {
  return maintenanceGroups.reduce((centers, group) => {
    centers[group.id] = []
    return centers
  }, {})
}

function processMaintenance(now) {
  maintenanceGroups.forEach((group) => {
    const center = state.maintenanceCenters[group.id] || []
    const remaining = []

    center.forEach((item) => {
      if (item.status === 'queued') {
        remaining.push(item)
        return
      }

      if (item.status === 'repairing' && item.partsEvent?.plannedAt && !item.partsEvent.occurredAt && toTime(item.partsEvent.plannedAt) <= now.getTime()) {
        const occurredAt = new Date(item.partsEvent.plannedAt)
        const durationMs = Number(item.partsEvent.durationMs || item.partsEvent.durationHours * HOUR_MS || 0)
        const partsEndsAt = new Date(occurredAt.getTime() + durationMs)
        item.partsEvent.occurredAt = occurredAt.toISOString()
        item.partsEvent.endsAt = partsEndsAt.toISOString()
        item.currentEndsAt = new Date(toTime(item.currentEndsAt) + durationMs).toISOString()
        item.status = partsEndsAt.getTime() > now.getTime() ? 'parts_waiting' : 'repairing'
      }

      if (item.status === 'parts_waiting' && item.partsEvent?.endsAt && toTime(item.partsEvent.endsAt) <= now.getTime()) {
        item.status = 'repairing'
      }

      if (item.currentEndsAt && toTime(item.currentEndsAt) <= now.getTime()) {
        return
      }

      remaining.push(item)
    })

    state.maintenanceCenters[group.id] = promoteMaintenanceQueue(group.id, remaining, now)
  })
}

function promoteMaintenanceQueue(groupId, items, now) {
  const promoted = [...items]

  while (promoted.filter((item) => item.status !== 'queued').length < MAINTENANCE_SLOT_LIMIT) {
    const next = promoted.find((item) => item.status === 'queued')
    if (!next) break
    startLegacyMaintenance(next, now)
  }

  return promoted
}

function startLegacyMaintenance(item, date) {
  const baseDurationMs = Number(item.baseDurationMs) || Math.max(HOUR_MS, toTime(item.currentEndsAt || item.originalEndsAt) - date.getTime()) || DAY_MS
  const originalEndsAt = new Date(date.getTime() + baseDurationMs)

  item.status = 'repairing'
  item.baseDurationMs = baseDurationMs
  item.repairStartedAt = date.toISOString()
  item.originalEndsAt = item.originalEndsAt || originalEndsAt.toISOString()
  item.currentEndsAt = item.currentEndsAt || originalEndsAt.toISOString()

  if (item.partsEvent && item.partsEvent.durationHours && !item.partsEvent.durationMs) {
    item.partsEvent.durationMs = Number(item.partsEvent.durationHours) * HOUR_MS
  }
}

function createOperationWatchCard(mission) {
  const startedAt = toTime(mission.startedAt)
  const endsAt = toTime(mission.endsAt)

  return {
    id: mission.id,
    kind: 'operation',
    group: mission.group,
    badge: `운영.${groupName(mission.group)}`,
    title: mission.title,
    sub: '',
    timeLabel: formatRemaining(mission.endsAt),
    sortAt: endsAt,
    progress: progressPercent(startedAt, endsAt),
  }
}

function createFacilityWatchCard(mission, mode) {
  const isQueue = mode !== 'active'
  const startedAt = toTime(mission.startedAt)
  const endsAt = toTime(mission.endsAt)
  const progress = isQueue ? 0 : progressPercent(startedAt, endsAt)
  const linearProgress = !isQueue ? facilityProgress(mission) : null

  return {
    id: `${mission.id}_${mode}`,
    kind: 'facility',
    status: isQueue ? 'queued' : mission.type,
    badge: `시설.${mission.type === 'maintenance' ? '유지보수' : '설치'}`,
    title: mission.title,
    sub: isQueue
      ? '대기중'
      : `${linearProgress.doneKm}km / ${mission.totalKm}km · ${linearProgress.percent.toFixed(1)}%`,
    timeLabel: isQueue ? '대기중' : formatRemaining(mission.endsAt),
    sortAt: isQueue ? toTime(mission.createdAt) + 1000 * DAY_MS : endsAt,
    progress,
  }
}


function createMaintenanceWatchCard(item) {
  const isQueued = item.status === 'queued'
  const startedAt = toTime(item.repairStartedAt || item.enteredAt)
  const endsAt = toTime(item.currentEndsAt)

  return {
    id: item.id,
    kind: 'maintenance',
    group: item.group,
    status: item.status,
    badge: `정비.${groupName(item.group)}`,
    title: maintenanceDisplayTitle(item),
    sub: maintenanceStatusText(item.status),
    timeLabel: isQueued ? '대기중' : formatRemaining(item.currentEndsAt),
    sortAt: isQueued ? toTime(item.enteredAt) + 1200 * DAY_MS : endsAt,
    progress: isQueued ? 0 : progressPercent(startedAt, endsAt),
  }
}

function allMaintenanceItems() {
  return maintenanceGroups
    .flatMap((group) => state.maintenanceCenters[group.id] || [])
    .sort((a, b) => {
      if (a.status === 'queued' && b.status !== 'queued') return 1
      if (a.status !== 'queued' && b.status === 'queued') return -1
      return toTime(a.currentEndsAt || a.enteredAt) - toTime(b.currentEndsAt || b.enteredAt)
    })
}

function maintenanceActiveCount(groupId) {
  return (state.maintenanceCenters[groupId] || []).filter((item) => item.status !== 'queued').length
}

function maintenanceDisplayTitle(item) {
  return item?.title || `${groupName(item?.group)}정비`
}

function maintenanceStatusText(status) {
  if (status === 'parts_waiting') return '부품조달중'
  if (status === 'queued') return '대기열'
  return '정비중'
}

function facilityProgress(mission) {
  if (!mission?.startedAt) {
    return { doneKm: '0.0', remainingKm: mission?.totalKm || 0, percent: 0 }
  }

  const elapsedDays = Math.max(0, (standardNow.value.getTime() - toTime(mission.startedAt)) / DAY_MS)
  const done = Math.min(mission.totalKm, elapsedDays * mission.dailyKm)
  const remaining = Math.max(0, mission.totalKm - done)
  const percent = mission.totalKm > 0 ? Math.min(100, (done / mission.totalKm) * 100) : 0

  return {
    doneKm: done.toFixed(1),
    remainingKm: remaining.toFixed(1),
    percent,
  }
}

function progressPercent(startAt, endAt) {
  if (!startAt || !endAt || endAt <= startAt) return 0
  const percent = ((standardNow.value.getTime() - startAt) / (endAt - startAt)) * 100
  return Math.min(100, Math.max(0, percent))
}

function trimLists() {
  if (state.acceptedMissions.length > 240) {
    state.acceptedMissions = operationSorted.value.slice(0, 240)
  }

  if (state.facilityQueue.length > 40) {
    state.facilityQueue = facilityQueueSorted.value.slice(0, 40)
  }
}

function getSavePayload() {
  return {
    schemaVersion: SAVE_SCHEMA_VERSION,
    savedAt: new Date().toISOString(),
    standardTime: standardNow.value.toISOString(),
    acceptedMissions: toPlainArray(state.acceptedMissions),
    facilityQueue: toPlainArray(state.facilityQueue),
    activeFacilityMission: state.activeFacilityMission ? { ...state.activeFacilityMission } : null,
    maintenanceCenters: toPlainMaintenanceCenters(),
    lastOperationByGroup: { ...state.lastOperationByGroup },
    lastFacilityAt: state.lastFacilityAt,
  }
}

function restorePayload(payload, now = new Date()) {
  state.acceptedMissions = normalizeArray(payload.acceptedMissions)
  state.facilityQueue = normalizeArray(payload.facilityQueue)
  state.activeFacilityMission = payload.activeFacilityMission || null
  state.maintenanceCenters = normalizeMaintenanceCenters(payload.maintenanceCenters)
  state.lastOperationByGroup = normalizeLastOperationByGroup(payload.lastOperationByGroup, now)
  state.lastFacilityAt = payload.lastFacilityAt || now.toISOString()
}

function normalizeLastOperationByGroup(value, now = new Date()) {
  return operationGroups.reduce((result, group) => {
    result[group.id] = value?.[group.id] || now.toISOString()
    return result
  }, {})
}

function toPlainArray(array) {
  return JSON.parse(JSON.stringify(array || []))
}

function normalizeArray(value) {
  return Array.isArray(value) ? value : []
}

function toPlainMaintenanceCenters() {
  return maintenanceGroups.reduce((result, group) => {
    result[group.id] = toPlainArray(state.maintenanceCenters[group.id])
    return result
  }, {})
}

function normalizeMaintenanceCenters(value) {
  const centers = createEmptyMaintenanceCenters()
  if (!value || typeof value !== 'object') return centers

  maintenanceGroups.forEach((group) => {
    centers[group.id] = normalizeArray(value[group.id])
      .map((item) => normalizeLegacyMaintenanceItem(item, group.id))
      .filter(Boolean)
  })

  return centers
}

function normalizeLegacyMaintenanceItem(item, fallbackGroup) {
  if (!item || typeof item !== 'object') return null

  const group = groupLabels[item.group] ? item.group : fallbackGroup
  const enteredAt = validDateText(item.enteredAt || item.createdAt || item.startedAt) || new Date().toISOString()
  const status = item.status || (item.repairStartedAt || item.currentEndsAt || item.originalEndsAt ? 'repairing' : 'queued')
  const repairStartedAt = item.repairStartedAt || (status === 'queued' ? '' : enteredAt)
  const endCandidate = item.currentEndsAt || item.endsAt || item.originalEndsAt
  const baseDurationMs = Number(item.baseDurationMs) || Math.max(
    HOUR_MS,
    toTime(endCandidate) - toTime(repairStartedAt || enteredAt),
  )
  const originalEndsAt = item.originalEndsAt || item.endsAt || (repairStartedAt ? new Date(toTime(repairStartedAt) + baseDurationMs).toISOString() : '')
  const currentEndsAt = item.currentEndsAt || item.endsAt || originalEndsAt
  const partsEvent = item.partsEvent
    ? {
        ...item.partsEvent,
        durationMs: Number(item.partsEvent.durationMs || item.partsEvent.durationHours * HOUR_MS || 0),
      }
    : null

  return {
    ...item,
    id: item.id || createId('maint_legacy'),
    kind: 'maintenance',
    group,
    level: item.level || 'legacy',
    title: item.title || `${groupName(group)}정비`,
    status,
    enteredAt,
    baseDurationMs,
    repairStartedAt,
    originalEndsAt,
    currentEndsAt,
    partsEvent,
  }
}

function validDateText(value) {
  return toTime(value) ? new Date(value).toISOString() : ''
}

async function loadSave() {
  const now = new Date()
  const record = await loadRctsAutoSave()
  const payload = record?.payload

  if (!payload) {
    bootstrapNewGame(now)
    return
  }

  restorePayload(payload, now)
  processGameState(now)
}

async function saveSoon() {
  if (saveLock) return
  saveLock = true

  try {
    await saveRctsAutoSave(getSavePayload())
  } finally {
    saveLock = false
  }
}

function startTimers() {
  tickTimer = window.setInterval(() => {
    processGameState(new Date())
  }, SECOND_MS)

  autoSaveTimer = window.setInterval(saveSoon, AUTO_SAVE_INTERVAL_MS)
}

function handleVisibilityChange() {
  if (document.visibilityState === 'hidden') saveSoon()
  if (document.visibilityState === 'visible') processGameState(new Date())
}

function groupName(groupId) {
  return groupLabels[groupId] || groupId || '기타'
}

function pickRandom(array) {
  return array[Math.floor(Math.random() * array.length)]
}

function randomInteger(min, max) {
  const low = Math.ceil(Number(min))
  const high = Math.floor(Number(max))
  return Math.floor(Math.random() * (high - low + 1)) + low
}

function formatDateOnly(value) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const weekdays = ['일', '월', '화', '수', '목', '금', '토']
  return `${yyyy}.${mm}.${dd} ${weekdays[date.getDay()]}요일`
}

function formatClockTime(value) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '--:--'

  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

function formatRemaining(value) {
  const remainMs = Math.max(0, toTime(value) - standardNow.value.getTime())
  if (remainMs <= 0) return '완료 대기'
  return `${formatDuration(remainMs)} 남음`
}

function formatDuration(ms) {
  const totalMinutes = Math.max(0, Math.ceil(Number(ms || 0) / MINUTE_MS))
  const days = Math.floor(totalMinutes / (24 * 60))
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60)
  const minutes = totalMinutes % 60

  if (days > 0) return `${days}일 ${hours}시간`
  if (hours > 0) return `${hours}시간 ${minutes}분`
  return `${minutes}분`
}

function toTime(value) {
  const date = new Date(value)
  const time = date.getTime()
  return Number.isFinite(time) ? time : 0
}

function createId(prefix) {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return `${prefix}_${crypto.randomUUID()}`
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

onMounted(async () => {
  await loadSave()
  processGameState(new Date())
  startTimers()
  window.addEventListener('beforeunload', saveSoon)
  document.addEventListener('visibilitychange', handleVisibilityChange)
  saveSoon()
})

onBeforeUnmount(() => {
  if (tickTimer) window.clearInterval(tickTimer)
  if (autoSaveTimer) window.clearInterval(autoSaveTimer)
  window.removeEventListener('beforeunload', saveSoon)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  saveSoon()
})
</script>

<style scoped>
:global(*) {
  box-sizing: border-box;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

:global(*::-webkit-scrollbar) {
  width: 0;
  height: 0;
  display: none;
}

:global(html),
:global(body),
:global(#app) {
  width: 100%;
  min-width: 320px;
  min-height: 100%;
  margin: 0;
}

:global(body) {
  overflow-y: auto;
  color: #e5eefc;
  background:
    radial-gradient(circle at 10% -10%, rgba(56, 189, 248, 0.24), transparent 32%),
    linear-gradient(145deg, #020617 0%, #08111f 52%, #111827 100%);
  font-family: Pretendard, Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.rcts-page {
  width: min(100% - 24px, 860px);
  min-height: 100dvh;
  margin: 0 auto;
  padding: 12px 0 24px;
  overflow-x: hidden;
}

.topbar,
.deck-panel,
.watch-card {
  border: 1px solid rgba(148, 163, 184, 0.14);
  background: rgba(15, 23, 42, 0.72);
  box-shadow: 0 16px 44px rgba(0, 0, 0, 0.24);
  backdrop-filter: blur(16px);
}

.topbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(178px, 240px);
  gap: 10px;
  align-items: stretch;
  border-radius: 24px;
  padding: 14px;
}

.brand-block {
  display: flex;
  min-width: 0;
  flex-direction: column;
  justify-content: center;
}

.brand-block span,
.digital-clock span,
.deck-head span,
.card-label {
  display: block;
  color: #93c5fd;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.brand-block h1 {
  margin: 5px 0 0;
  color: #ffffff;
  font-size: clamp(42px, 11vw, 72px);
  line-height: 0.9;
  letter-spacing: -0.08em;
}

.digital-clock {
  display: flex;
  flex-direction: column;
  justify-content: center;
  border: 1px solid rgba(103, 232, 249, 0.22);
  border-radius: 18px;
  padding: 14px;
  background: rgba(8, 47, 73, 0.34);
}

.digital-clock strong {
  margin-top: 6px;
  color: #ffffff;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
  font-size: clamp(28px, 7vw, 42px);
  line-height: 1;
  letter-spacing: -0.05em;
}

.digital-clock em {
  margin-top: 5px;
  color: #8da3bd;
  font-size: 12px;
  font-style: normal;
}

.deck-panel {
  width: 100%;
  margin-top: 10px;
  border-radius: 24px;
  padding: 12px;
}

.deck-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.deck-head strong {
  color: #cffafe;
  font-size: 12px;
}

.card-deck {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
  width: 100%;
}

.watch-card {
  width: 100%;
  overflow: hidden;
  border-radius: 18px;
  border-left: 4px solid #60a5fa;
  padding: 12px;
}

.watch-card.operation.bus { border-left-color: #38bdf8; }
.watch-card.operation.rail { border-left-color: #a78bfa; }
.watch-card.operation.air { border-left-color: #22d3ee; }
.watch-card.operation.ship { border-left-color: #2dd4bf; }
.watch-card.facility { border-left-color: #c084fc; }
.watch-card.maintenance { border-left-color: #f59e0b; }
.watch-card.maintenance.bus { border-left-color: #38bdf8; }
.watch-card.maintenance.rail { border-left-color: #a78bfa; }
.watch-card.maintenance.air { border-left-color: #22d3ee; }
.watch-card.maintenance.ship { border-left-color: #2dd4bf; }
.watch-card.maintenance.space { border-left-color: #f0abfc; }
.watch-card.queued { opacity: 0.76; }

.card-label {
  color: #bfdbfe;
}

.card-bodyline {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: end;
  margin-top: 7px;
}

.card-bodyline h2 {
  min-width: 0;
  margin: 0;
  color: #ffffff;
  font-size: clamp(19px, 5vw, 26px);
  line-height: 1.08;
  letter-spacing: -0.045em;
}

.card-bodyline strong {
  color: #cffafe;
  font-size: 13px;
  white-space: nowrap;
}

.progress-track {
  height: 8px;
  margin-top: 11px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(2, 6, 23, 0.88);
}

.progress-track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #38bdf8, #67e8f9);
}

.watch-card p {
  margin: 8px 0 0;
  color: #9fb2ca;
  font-size: 12px;
  line-height: 1.35;
}

@media (max-width: 620px) {
  .rcts-page {
    width: min(100% - 14px, 620px);
    padding-top: 7px;
  }

  .topbar {
    grid-template-columns: 1fr;
    border-radius: 20px;
    padding: 12px;
  }

  .digital-clock,
  .deck-panel,
  .watch-card {
    border-radius: 16px;
  }

  .card-bodyline {
    grid-template-columns: 1fr;
    gap: 5px;
    align-items: start;
  }

  .card-bodyline strong {
    font-size: 12px;
  }
}
</style>
