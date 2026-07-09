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

      <div v-if="watchCards.length" class="card-deck">
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

      <div v-else class="empty-card">
        <strong>진행 중인 항목 없음</strong>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { loadRctsAutoSave, saveRctsAutoSave } from './storage/rctsSaveStorage.js'

const SAVE_SCHEMA_VERSION = 6
const SECOND_MS = 1000
const MINUTE_MS = 60 * SECOND_MS
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS
const AUTO_SAVE_INTERVAL_MS = 60 * SECOND_MS
const MAINTENANCE_SLOT_LIMIT = 5
const LOG_LIMIT = 140
const MAX_OPERATION_CATCH_UP = 180
const MAX_FACILITY_CATCH_UP = 30
const MAX_MAINTENANCE_CATCH_UP = 120

const AUTO_RULES = {
  operationIntervalHours: 1,
  operationBatchMin: 2,
  operationBatchMax: 3,
  facilityIntervalDays: 7,
  maintenanceIntervalDays: 1,
  maintenanceDailyCount: 1,
}

const groups = [
  { id: 'bus', label: '버스' },
  { id: 'rail', label: '철도' },
  { id: 'air', label: '항공' },
  { id: 'ship', label: '선박' },
  { id: 'space', label: '우주' },
]

const missionCatalog = [
  { group: 'bus', title: '출근 시간대 대체 운행', minHours: 2, maxHours: 4 },
  { group: 'bus', title: '퇴근 시간대 대체 운행', minHours: 2, maxHours: 4 },
  { group: 'bus', title: '행사장 셔틀 운행', minHours: 3, maxHours: 8 },
  { group: 'bus', title: '통근버스 지원', minHours: 2, maxHours: 6 },
  { group: 'bus', title: '학교 셔틀 운행', minHours: 1, maxHours: 3 },
  { group: 'bus', title: '광역버스 증차 지원', minHours: 4, maxHours: 8 },
  { group: 'bus', title: '심야 임시 운행', minHours: 3, maxHours: 6 },
  { group: 'bus', title: '전세버스 단거리 운행', minHours: 4, maxHours: 10 },
  { group: 'bus', title: '전세버스 장거리 운행', minHours: 8, maxHours: 12 },
  { group: 'bus', title: '비상 수송 지원', minHours: 1, maxHours: 5 },
  { group: 'rail', title: '임시 열차 투입', minHours: 6, maxHours: 12 },
  { group: 'rail', title: '혼잡 구간 증편', minHours: 4, maxHours: 10 },
  { group: 'rail', title: '관광열차 운행', minHours: 12, maxHours: 24 },
  { group: 'rail', title: '장거리 열차 운행', minHours: 24, maxHours: 72 },
  { group: 'air', title: '국내선 임시 운항', minHours: 4, maxHours: 8 },
  { group: 'air', title: '단거리 국제선 운항', minHours: 6, maxHours: 10 },
  { group: 'air', title: '장거리 국제선 운항', minHours: 12, maxHours: 14 },
  { group: 'air', title: '긴급 화물 운송', minHours: 8, maxHours: 24 },
  { group: 'ship', title: '국내 여객선 운항', minHours: 12, maxHours: 24 },
  { group: 'ship', title: '단거리 화물선 운송', minHours: 72, maxHours: 168 },
  { group: 'ship', title: '해외 화물선 운송', minHours: 360, maxHours: 720 },
  { group: 'ship', title: '장거리 해외 화물선 운송', minHours: 720, maxHours: 1440 },
  { group: 'space', title: '우주정거장 보급', minHours: 720, maxHours: 1440 },
  { group: 'space', title: '달 궤도 운송', minHours: 2160, maxHours: 4320 },
  { group: 'space', title: '심우주 보급', minHours: 4320, maxHours: 8760 },
  { group: 'space', title: '외행성 운송', minHours: 8760, maxHours: 17280 },
]

const facilityCatalog = [
  { title: '도로신설', type: 'linear', dailyMin: 2, dailyMax: 5 },
  { title: '철도신설', type: 'linear', dailyMin: 1, dailyMax: 3 },
  { title: '시설유지보수', minDays: 7, maxDays: 30 },
  { title: '신설노선', minDays: 14, maxDays: 60 },
  { title: '도로 유지보수', minDays: 3, maxDays: 14 },
  { title: '철도 유지보수', minDays: 7, maxDays: 30 },
  { title: '공항 시설 개선', minDays: 14, maxDays: 90 },
  { title: '항만 시설 개선', minDays: 14, maxDays: 90 },
  { title: '우주 기지 확장', minDays: 180, maxDays: 720 },
]

const maintenanceRules = {
  bus: {
    heavy: { title: '버스 중정비', minHours: 12, maxHours: 72, partsChance: 10, partsMinHours: 2, partsMaxHours: 12 },
    overhaul: { title: '버스 대수선', minHours: 72, maxHours: 168, partsChance: 20, partsMinHours: 2, partsMaxHours: 12 },
  },
  rail: {
    heavy: { title: '철도 중정비', minHours: 72, maxHours: 336, partsChance: 15, partsMinHours: 12, partsMaxHours: 72 },
    overhaul: { title: '철도 대수선', minHours: 336, maxHours: 1080, partsChance: 25, partsMinHours: 12, partsMaxHours: 72 },
  },
  air: {
    heavy: { title: '항공 중정비', minHours: 168, maxHours: 720, partsChance: 20, partsMinHours: 24, partsMaxHours: 168 },
    overhaul: { title: '항공 대수선', minHours: 720, maxHours: 2160, partsChance: 35, partsMinHours: 24, partsMaxHours: 168 },
  },
  ship: {
    heavy: { title: '선박 중정비', minHours: 336, maxHours: 1440, partsChance: 25, partsMinHours: 72, partsMaxHours: 336 },
    overhaul: { title: '선박 대수선', minHours: 1440, maxHours: 4320, partsChance: 40, partsMinHours: 72, partsMaxHours: 336 },
  },
  space: {
    heavy: { title: '우주 중정비', minHours: 720, maxHours: 4320, partsChance: 35, partsMinHours: 168, partsMaxHours: 1440 },
    overhaul: { title: '우주 대수선', minHours: 4320, maxHours: 17280, partsChance: 50, partsMinHours: 168, partsMaxHours: 1440 },
  },
}

const standardNow = ref(new Date())
let tickTimer = null
let autoSaveTimer = null
let saveLock = false

const state = reactive({
  acceptedMissions: [],
  facilityQueue: [],
  activeFacilityMission: null,
  maintenanceCenters: createEmptyMaintenanceCenters(),
  activityLog: [],
  lastOperationAt: '',
  lastFacilityAt: '',
  lastMaintenanceAt: '',
  offlineReport: '',
})

const standardTimeText = computed(() => formatDateTime(standardNow.value))
const digitalDateText = computed(() => formatDateOnly(standardNow.value))
const digitalClockText = computed(() => formatClockTime(standardNow.value))
const operationSorted = computed(() => [...state.acceptedMissions].sort((a, b) => toTime(a.endsAt) - toTime(b.endsAt)))
const facilityQueueSorted = computed(() => [...state.facilityQueue].sort((a, b) => toTime(a.createdAt) - toTime(b.createdAt)))
const recentLogs = computed(() => [...state.activityLog].sort((a, b) => toTime(b.at) - toTime(a.at)).slice(0, 10))

const totalMaintenanceCapacity = computed(() => groups.length * MAINTENANCE_SLOT_LIMIT)
const totalActiveMaintenance = computed(() => groups.reduce((sum, group) => sum + maintenanceActiveCount(group.id), 0))
const totalQueuedMaintenance = computed(() => groups.reduce((sum, group) => sum + maintenanceQueueCount(group.id), 0))

const nextCompletion = computed(() => {
  const candidates = []

  state.acceptedMissions.forEach((mission) => {
    candidates.push({ title: `[${groupName(mission.group)}] ${mission.title}`, endsAt: mission.endsAt })
  })

  if (state.activeFacilityMission) {
    candidates.push({ title: `[시설] ${state.activeFacilityMission.title}`, endsAt: state.activeFacilityMission.endsAt })
  }

  allMaintenanceItems().forEach((item) => {
    if (item.status !== 'queued') candidates.push({ title: `[정비] ${item.title}`, endsAt: item.currentEndsAt })
  })

  return candidates
    .filter((item) => toTime(item.endsAt) > standardNow.value.getTime())
    .sort((a, b) => toTime(a.endsAt) - toTime(b.endsAt))[0] || null
})

const watchCards = computed(() => {
  const cards = []

  if (state.activeFacilityMission) {
    cards.push(createFacilityWatchCard(state.activeFacilityMission, 'active'))
  }

  facilityQueueSorted.value.slice(0, 4).forEach((mission, index) => {
    cards.push(createFacilityWatchCard(mission, `queue-${index + 1}`))
  })

  operationSorted.value.slice(0, 18).forEach((mission) => {
    cards.push(createOperationWatchCard(mission))
  })

  allMaintenanceItems().slice(0, 22).forEach((item) => {
    cards.push(createMaintenanceWatchCard(item))
  })

  return cards
    .filter(Boolean)
    .sort((a, b) => a.sortAt - b.sortAt)
    .slice(0, 32)
})

function createEmptyMaintenanceCenters() {
  return groups.reduce((centers, group) => {
    centers[group.id] = []
    return centers
  }, {})
}

function bootstrapNewGame(now) {
  standardNow.value = now
  state.acceptedMissions = []
  state.facilityQueue = []
  state.activeFacilityMission = null
  state.maintenanceCenters = createEmptyMaintenanceCenters()
  state.activityLog = []
  state.offlineReport = ''
  state.lastOperationAt = now.toISOString()
  state.lastFacilityAt = now.toISOString()
  state.lastMaintenanceAt = now.toISOString()

  for (let index = 5; index >= 0; index -= 1) {
    generateOperationBatch(new Date(now.getTime() - index * 18 * MINUTE_MS), 'seed')
  }

  generateFacilityMission(new Date(now.getTime() - 2 * DAY_MS), 'seed')

  for (let index = 0; index < 5; index += 1) {
    createRandomMaintenance(new Date(now.getTime() - randomInteger(1, 30) * HOUR_MS), 'seed')
  }

  processGameState(now)
}

function processGameState(now, reason = 'tick') {
  const beforeLogCount = state.activityLog.length
  standardNow.value = now

  completeOperationMissions(now)
  processFacility(now)
  processMaintenance(now)
  maybeGenerateOperations(now)
  maybeGenerateFacility(now)
  maybeGenerateMaintenance(now)
  trimLists()

  if (reason === 'load') {
    const newLogCount = Math.max(0, state.activityLog.length - beforeLogCount)
    state.offlineReport = newLogCount > 0
      ? `${newLogCount}개의 자동 흐름이 반영되었습니다.`
      : '완료된 항목은 없지만 자동 진행 시간을 최신 상태로 맞췄습니다.'
  }
}

function generateOperationBatch(date, source = 'auto') {
  const count = randomInteger(AUTO_RULES.operationBatchMin, AUTO_RULES.operationBatchMax)

  for (let index = 0; index < count; index += 1) {
    generateOperationMission(new Date(date.getTime() + index * 3 * MINUTE_MS), source)
  }

  if (source !== 'seed') saveSoon()
}

function generateOperationMission(date, source = 'auto') {
  const template = pickRandom(missionCatalog)
  const durationMs = randomInteger(template.minHours, template.maxHours) * HOUR_MS
  const mission = {
    id: createId('op'),
    kind: 'operation',
    group: template.group,
    title: template.title,
    durationMs,
    startedAt: date.toISOString(),
    endsAt: new Date(date.getTime() + durationMs).toISOString(),
  }

  state.acceptedMissions.push(mission)
  addLog('operation', `[${groupName(mission.group)}] ${mission.title} 자동수락`, date)

  if (source !== 'seed') saveSoon()
  return mission
}

function maybeGenerateOperations(now) {
  const interval = AUTO_RULES.operationIntervalHours * HOUR_MS
  const last = toTime(state.lastOperationAt)

  if (!last) {
    state.lastOperationAt = now.toISOString()
    return
  }

  const elapsed = Math.floor((now.getTime() - last) / interval)
  if (elapsed <= 0) return

  const count = Math.min(elapsed, MAX_OPERATION_CATCH_UP)
  const skipped = Math.max(0, elapsed - count)

  for (let index = count; index >= 1; index -= 1) {
    generateOperationBatch(new Date(now.getTime() - index * interval), 'auto')
  }

  if (skipped > 0) addLog('system', `장기 오프라인 운영 ${skipped}시간은 요약 처리`, now)

  state.lastOperationAt = new Date(last + elapsed * interval).toISOString()
}

function completeOperationMissions(now) {
  const active = []

  state.acceptedMissions.forEach((mission) => {
    if (toTime(mission.endsAt) <= now.getTime()) {
      addLog('complete', `[${groupName(mission.group)}] ${mission.title} 완료`, new Date(mission.endsAt))
      return
    }
    active.push(mission)
  })

  state.acceptedMissions = active
}

function generateFacilityMission(date, source = 'auto') {
  const template = pickRandom(facilityCatalog)
  const mission = createFacilityMission(template, date)

  if (!state.activeFacilityMission) {
    startFacilityMission(mission, date)
    addLog('facility', `[시설] ${mission.title} 자동 시작`, date)
  } else {
    state.facilityQueue.push(mission)
    addLog('facility', `[시설] ${mission.title} 자동 대기`, date)
  }

  if (source !== 'seed') saveSoon()
  return mission
}

function createFacilityMission(template, date) {
  if (template.type === 'linear') {
    const totalKm = randomInteger(30, 500)
    const dailyKm = randomInteger(template.dailyMin, template.dailyMax)
    const durationMs = Math.ceil(totalKm / dailyKm) * DAY_MS

    return {
      id: createId('facility'),
      kind: 'facility',
      type: 'linear',
      title: template.title,
      totalKm,
      dailyKm,
      durationMs,
      createdAt: date.toISOString(),
      startedAt: '',
      endsAt: '',
    }
  }

  const durationMs = randomInteger(template.minDays, template.maxDays) * DAY_MS

  return {
    id: createId('facility'),
    kind: 'facility',
    type: 'standard',
    title: template.title,
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

function maybeGenerateFacility(now) {
  const interval = AUTO_RULES.facilityIntervalDays * DAY_MS
  const last = toTime(state.lastFacilityAt)

  if (!last) {
    state.lastFacilityAt = now.toISOString()
    return
  }

  const elapsed = Math.floor((now.getTime() - last) / interval)
  if (elapsed <= 0) return

  const count = Math.min(elapsed, MAX_FACILITY_CATCH_UP)

  for (let index = count; index >= 1; index -= 1) {
    generateFacilityMission(new Date(now.getTime() - index * interval), 'auto')
  }

  if (elapsed > count) addLog('system', `장기 오프라인 시설 ${elapsed - count}건은 요약 처리`, now)

  state.lastFacilityAt = new Date(last + elapsed * interval).toISOString()
}

function processFacility(now) {
  if (state.activeFacilityMission && toTime(state.activeFacilityMission.endsAt) <= now.getTime()) {
    const completed = state.activeFacilityMission
    addLog('complete', `[시설] ${completed.title} 완료`, new Date(completed.endsAt))
    state.activeFacilityMission = null
  }

  if (!state.activeFacilityMission && state.facilityQueue.length) {
    const [nextMission, ...rest] = facilityQueueSorted.value
    state.facilityQueue = rest
    startFacilityMission(nextMission, now)
    addLog('facility', `[시설] ${nextMission.title} 대기열 자동 시작`, now)
  }
}

function createRandomMaintenance(date, source = 'auto') {
  const group = pickRandom(groups).id
  const level = Math.random() < 0.72 ? 'heavy' : 'overhaul'
  const item = createMaintenanceItem(group, level, date)
  enqueueOrStartMaintenance(item, date)

  if (source !== 'seed') saveSoon()
  return item
}

function createMaintenanceItem(group, level, date) {
  const rule = maintenanceRules[group][level]
  const baseDurationMs = randomInteger(rule.minHours, rule.maxHours) * HOUR_MS
  const hasPartsEvent = randomInteger(1, 100) <= rule.partsChance

  return {
    id: createId('maint'),
    kind: 'maintenance',
    group,
    level,
    title: rule.title,
    status: 'queued',
    enteredAt: date.toISOString(),
    baseDurationMs,
    repairStartedAt: '',
    originalEndsAt: '',
    currentEndsAt: '',
    partsEvent: hasPartsEvent
      ? {
          plannedAt: '',
          occurredAt: '',
          durationMs: randomInteger(rule.partsMinHours, rule.partsMaxHours) * HOUR_MS,
          endsAt: '',
        }
      : null,
  }
}

function enqueueOrStartMaintenance(item, date) {
  const center = state.maintenanceCenters[item.group] || []

  if (maintenanceActiveCount(item.group) < MAINTENANCE_SLOT_LIMIT) {
    startMaintenance(item, date)
    center.push(item)
    addLog('maintenance', `[${groupName(item.group)}] ${item.title} 자동 입고`, date)
  } else {
    center.push(item)
    addLog('maintenance', `[${groupName(item.group)}] ${item.title} 대기열 등록`, date)
  }

  state.maintenanceCenters[item.group] = center
}

function startMaintenance(item, date) {
  const originalEndsAt = new Date(date.getTime() + item.baseDurationMs)
  item.status = 'repairing'
  item.repairStartedAt = date.toISOString()
  item.originalEndsAt = originalEndsAt.toISOString()
  item.currentEndsAt = originalEndsAt.toISOString()

  if (item.partsEvent) {
    const minDelay = Math.max(1, Math.floor(item.baseDurationMs * 0.2))
    const maxDelay = Math.max(minDelay, Math.floor(item.baseDurationMs * 0.72))
    item.partsEvent.plannedAt = new Date(date.getTime() + randomInteger(minDelay, maxDelay)).toISOString()
  }
}

function maybeGenerateMaintenance(now) {
  const interval = AUTO_RULES.maintenanceIntervalDays * DAY_MS
  const last = toTime(state.lastMaintenanceAt)

  if (!last) {
    state.lastMaintenanceAt = now.toISOString()
    return
  }

  const elapsed = Math.floor((now.getTime() - last) / interval)
  if (elapsed <= 0) return

  const count = Math.min(elapsed, MAX_MAINTENANCE_CATCH_UP)

  for (let dayIndex = count; dayIndex >= 1; dayIndex -= 1) {
    const checkDate = new Date(now.getTime() - dayIndex * interval)
    for (let itemIndex = 0; itemIndex < AUTO_RULES.maintenanceDailyCount; itemIndex += 1) {
      createRandomMaintenance(checkDate, 'auto')
    }
  }

  if (elapsed > count) addLog('system', `장기 오프라인 정비 ${elapsed - count}일은 요약 처리`, now)

  state.lastMaintenanceAt = new Date(last + elapsed * interval).toISOString()
}

function processMaintenance(now) {
  groups.forEach((group) => {
    const center = state.maintenanceCenters[group.id] || []
    const remaining = []

    center.forEach((item) => {
      if (item.status === 'queued') {
        remaining.push(item)
        return
      }

      if (item.status === 'repairing' && item.partsEvent?.plannedAt && !item.partsEvent.occurredAt && toTime(item.partsEvent.plannedAt) <= now.getTime()) {
        const occurredAt = new Date(item.partsEvent.plannedAt)
        const partsEndsAt = new Date(occurredAt.getTime() + item.partsEvent.durationMs)
        item.partsEvent.occurredAt = occurredAt.toISOString()
        item.partsEvent.endsAt = partsEndsAt.toISOString()
        item.currentEndsAt = new Date(toTime(item.currentEndsAt) + item.partsEvent.durationMs).toISOString()
        item.status = partsEndsAt.getTime() > now.getTime() ? 'parts_waiting' : 'repairing'
        addLog('parts', `[${groupName(item.group)}] ${item.title} 부품조달 +${formatDuration(item.partsEvent.durationMs)}`, occurredAt)
      }

      if (item.status === 'parts_waiting' && item.partsEvent?.endsAt && toTime(item.partsEvent.endsAt) <= now.getTime()) {
        item.status = 'repairing'
        addLog('maintenance', `[${groupName(item.group)}] ${item.title} 정비 재개`, new Date(item.partsEvent.endsAt))
      }

      if (item.currentEndsAt && toTime(item.currentEndsAt) <= now.getTime()) {
        addLog('complete', `[${groupName(item.group)}] ${item.title} 완료`, new Date(item.currentEndsAt))
      } else {
        remaining.push(item)
      }
    })

    state.maintenanceCenters[group.id] = promoteMaintenanceQueue(group.id, remaining, now)
  })
}

function promoteMaintenanceQueue(groupId, items, now) {
  const promoted = [...items]

  while (promoted.filter((item) => item.status !== 'queued').length < MAINTENANCE_SLOT_LIMIT) {
    const next = promoted.find((item) => item.status === 'queued')
    if (!next) break
    startMaintenance(next, now)
    addLog('maintenance', `[${groupName(groupId)}] ${next.title} 대기열 자동 입고`, now)
  }

  return promoted
}

function createOperationWatchCard(mission) {
  const startedAt = toTime(mission.startedAt)
  const endsAt = toTime(mission.endsAt)
  const progress = progressPercent(startedAt, endsAt)

  return {
    id: mission.id,
    kind: 'operation',
    group: mission.group,
    badge: `운영.${groupName(mission.group)}`,
    title: operationDisplayTitle(mission.group),
    sub: '',
    timeLabel: formatRemaining(mission.endsAt),
    sortAt: endsAt,
    progress,
  }
}

function createFacilityWatchCard(mission, mode) {
  const isQueue = mode !== 'active'
  const startedAt = toTime(mission.startedAt)
  const endsAt = toTime(mission.endsAt)
  const progress = isQueue ? 0 : progressPercent(startedAt, endsAt)
  const linear = mission.type === 'linear'
  const linearProgress = linear && !isQueue ? facilityProgress(mission) : null

  return {
    id: `${mission.id}_${mode}`,
    kind: 'facility',
    status: isQueue ? 'queued' : 'active',
    badge: `시설.${mission.title}`,
    title: mission.title,
    sub: linear && !isQueue
      ? `${linearProgress.doneKm}km / ${mission.totalKm}km · ${linearProgress.percent.toFixed(1)}%`
      : isQueue
        ? '대기중'
        : '',
    timeLabel: isQueue ? '대기중' : formatRemaining(mission.endsAt),
    sortAt: isQueue ? toTime(mission.createdAt) + 1000 * DAY_MS : endsAt,
    progress,
  }
}

function createMaintenanceWatchCard(item) {
  const isQueued = item.status === 'queued'
  const startedAt = toTime(item.repairStartedAt || item.enteredAt)
  const endsAt = toTime(item.currentEndsAt)
  const progress = isQueued ? 0 : progressPercent(startedAt, endsAt)

  return {
    id: item.id,
    kind: 'maintenance',
    group: item.group,
    status: item.status,
    badge: `정비.${groupName(item.group)}`,
    title: maintenanceDisplayTitle(item.group),
    sub: maintenanceStatusText(item.status),
    timeLabel: isQueued ? '대기중' : formatRemaining(item.currentEndsAt),
    sortAt: isQueued ? toTime(item.enteredAt) + 1200 * DAY_MS : endsAt,
    progress,
  }
}

function facilityProgress(mission) {
  if (!mission?.startedAt || mission.type !== 'linear') {
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

function allMaintenanceItems() {
  return groups
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

function maintenanceQueueCount(groupId) {
  return (state.maintenanceCenters[groupId] || []).filter((item) => item.status === 'queued').length
}

function operationDisplayTitle(groupId) {
  const labels = {
    bus: '버스운행',
    rail: '철도운행',
    air: '항공운항',
    ship: '선박운항',
    space: '우주운송',
  }

  return labels[groupId] || '운영임무'
}

function maintenanceDisplayTitle(groupId) {
  const labels = {
    bus: '버스정비',
    rail: '철도정비',
    air: '항공정비',
    ship: '선박정비',
    space: '우주정비',
  }

  return labels[groupId] || '정비'
}

function maintenanceStatusText(status) {
  if (status === 'parts_waiting') return '부품조달중'
  if (status === 'queued') return '대기열'
  return '정비중'
}

function logTypeText(type) {
  if (type === 'operation') return '운영'
  if (type === 'facility') return '시설'
  if (type === 'maintenance') return '정비'
  if (type === 'parts') return '부품'
  if (type === 'complete') return '완료'
  return '시스템'
}

function addLog(type, title, date = new Date()) {
  state.activityLog = [
    {
      id: createId('log'),
      type,
      title,
      at: date.toISOString(),
    },
    ...state.activityLog,
  ].slice(0, LOG_LIMIT)
}

function trimLists() {
  if (state.acceptedMissions.length > 240) {
    state.acceptedMissions = operationSorted.value.slice(0, 240)
  }

  if (state.facilityQueue.length > 40) {
    state.facilityQueue = facilityQueueSorted.value.slice(0, 40)
  }

  groups.forEach((group) => {
    const items = state.maintenanceCenters[group.id] || []
    if (items.length > 80) {
      state.maintenanceCenters[group.id] = items.slice(0, 80)
    }
  })

  state.activityLog = [...state.activityLog]
    .sort((a, b) => toTime(b.at) - toTime(a.at))
    .slice(0, LOG_LIMIT)
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
    activityLog: toPlainArray(state.activityLog),
    lastOperationAt: state.lastOperationAt,
    lastFacilityAt: state.lastFacilityAt,
    lastMaintenanceAt: state.lastMaintenanceAt,
  }
}

function restorePayload(payload) {
  state.acceptedMissions = normalizeArray(payload.acceptedMissions)
  state.facilityQueue = normalizeArray(payload.facilityQueue)
  state.activeFacilityMission = payload.activeFacilityMission || null
  state.maintenanceCenters = normalizeMaintenanceCenters(payload.maintenanceCenters)
  state.activityLog = normalizeArray(payload.activityLog).slice(0, LOG_LIMIT)
  state.lastOperationAt = payload.lastOperationAt || payload.lastGeneralMissionAt || ''
  state.lastFacilityAt = payload.lastFacilityAt || payload.lastFacilityMissionAt || ''
  state.lastMaintenanceAt = payload.lastMaintenanceAt || payload.lastMaintenanceCheckAt || ''
}

function toPlainArray(array) {
  return JSON.parse(JSON.stringify(array || []))
}

function toPlainMaintenanceCenters() {
  return groups.reduce((result, group) => {
    result[group.id] = toPlainArray(state.maintenanceCenters[group.id])
    return result
  }, {})
}

function normalizeArray(value) {
  return Array.isArray(value) ? value : []
}

function normalizeMaintenanceCenters(value) {
  return groups.reduce((centers, group) => {
    centers[group.id] = Array.isArray(value?.[group.id]) ? value[group.id] : []
    return centers
  }, {})
}

async function loadSave() {
  const now = new Date()
  const record = await loadRctsAutoSave()
  const payload = record?.payload

  if (!payload || payload.schemaVersion !== SAVE_SCHEMA_VERSION) {
    bootstrapNewGame(now)
    return
  }

  restorePayload(payload)
  processGameState(now, 'load')
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
  if (document.visibilityState === 'visible') processGameState(new Date(), 'load')
}

function groupName(groupId) {
  return groups.find((group) => group.id === groupId)?.label || groupId
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

function formatDateTime(value) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${yyyy}/${mm}/${dd} ${hh}:${min}`
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
.watch-card,
.empty-card {
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

.watch-card.operation.bus,
.watch-card.maintenance.bus { border-left-color: #38bdf8; }
.watch-card.operation.rail,
.watch-card.maintenance.rail { border-left-color: #a78bfa; }
.watch-card.operation.air,
.watch-card.maintenance.air { border-left-color: #22d3ee; }
.watch-card.operation.ship,
.watch-card.maintenance.ship { border-left-color: #2dd4bf; }
.watch-card.operation.space,
.watch-card.maintenance.space { border-left-color: #f0abfc; }
.watch-card.facility { border-left-color: #c084fc; }
.watch-card.parts_waiting {
  border-color: rgba(250, 204, 21, 0.3);
  border-left-color: #facc15;
  background: rgba(113, 63, 18, 0.18);
}
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

.empty-card {
  border-radius: 18px;
  padding: 16px;
}

.empty-card strong {
  color: #f8fafc;
}

.empty-card p {
  margin: 6px 0 0;
  color: #b6c5da;
  font-size: 13px;
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
