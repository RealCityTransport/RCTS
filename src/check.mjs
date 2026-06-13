
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { loadRctsAutoSave, saveRctsAutoSave } from './storage/rctsSaveStorage.js'

const SUB_STAGE_UNLOCK_RUNS = 10
const NEXT_GROUP_UNLOCK_RUNS = 50
const GROUP_MASTER_RUNS = 100
const CUSTOM_MASTER_RUNS = 100
const MANUAL_WAIT_SECONDS = 30 * 60
const AUTO_WAIT_SECONDS = 10 * 60
const AUTO_SAVE_INTERVAL_MS = 10 * 60 * 1000
const SECOND = 1000
const MINUTE = 60
const HOUR = 3600
const DAY = 86400

const activePage = ref('rcts')
const terrariaTab = ref('npcs')

const terrariaTabs = [
  { id: 'npcs', label: 'NPC 목록' },
  { id: 'storyboards', label: '스토리보드' },
  { id: 'timeline', label: '사건 시간표' },
]

const terrariaStoryboards = reactive([])
const terrariaExtras = reactive([])
const processedTerrariaStepEffects = reactive([])

const defaultExtraPromotionDraft = { name: '', age: 20, gender: '기타/미정' }
const extraPromotionDrafts = reactive({})

const defaultStoryboardDraft = {
  title: '',
  boardType: 'story',
  start: '',
  end: '',
  npcIds: [],
  returningExtraIds: [],
  deathNpcIds: [],
  summary: '',
  newExtrasText: '',
}

const storyboardDraft = reactive({ ...defaultStoryboardDraft, npcIds: [], returningExtraIds: [], deathNpcIds: [] })
const storyboardStepDrafts = reactive([createEmptyStoryStepDraft()])
const editingStoryboardId = ref('')
const storyboardFormError = ref('')

const defaultNpcDraft = {
  name: '',
  birth: '',
  gender: '여성',
  memo: '',
}

const npcDraft = reactive({ ...defaultNpcDraft })

function createInitialTerrariaNpcs() {
  return []
}

const terrariaNpcs = reactive(createInitialTerrariaNpcs())
const legacyDemoNpcIds = new Set(['seoyun', 'seoha', 'serin', 'eunbyeol'])

const terrariaTimeline = computed(() => {
  const nowValue = standardNow.value.getTime()
  const steps = terrariaStoryboards
    .flatMap((board) => (board.steps || []).map((step) => ({
      id: `${board.id}:${step.id}`,
      boardTitle: board.title,
      boardType: board.boardType,
      time: normalizeDateTimeText(step.time || ''),
      value: dateTimeValue(step.time),
      actors: Array.isArray(step.actorLabels) ? step.actorLabels : [],
      text: step.text || '',
    })))
    .filter((item) => isValidDateTimeText(item.time))
    .sort((a, b) => a.value - b.value)

  const pastSteps = steps.filter((item) => item.value <= nowValue)
  const latestPast = pastSteps[pastSteps.length - 1]
  const upcomingSteps = steps.filter((item) => item.value > nowValue).slice(0, 8)
  const result = []

  if (latestPast) {
    result.push({
      id: `active:${latestPast.id}`,
      time: latestPast.time,
      title: `작동 중 · ${latestPast.boardTitle}`,
      text: `${latestPast.actors.length ? `${latestPast.actors.join(', ')} · ` : ''}${latestPast.text}`,
    })
  }

  upcomingSteps.forEach((item) => {
    result.push({
      id: `upcoming:${item.id}`,
      time: item.time,
      title: `예정 · ${item.boardTitle}`,
      text: `${item.actors.length ? `${item.actors.join(', ')} · ` : ''}${item.text}`,
    })
  })

  return result
})

const groups = [
  { id: 'bus', order: 1, name: '버스' },
  { id: 'rail', order: 2, name: '철도' },
  { id: 'air', order: 3, name: '항공' },
  { id: 'ship', order: 4, name: '선박' },
  { id: 'space', order: 5, name: '우주선' },
]

const stageDefinitions = [
  { id: 'village_bus', groupId: 'bus', localOrder: 1, name: '마을버스', durationSeconds: 30 * MINUTE },
  { id: 'city_bus', groupId: 'bus', localOrder: 2, name: '시내버스', durationSeconds: 1 * HOUR },
  { id: 'express_bus', groupId: 'bus', localOrder: 3, name: '광역버스', durationSeconds: 2 * HOUR },
  { id: 'commuter_charter', groupId: 'bus', localOrder: 4, name: '전세통근', durationSeconds: 8 * HOUR, timeWindow: 'commuter' },
  { id: 'charter_bus', groupId: 'bus', localOrder: 5, name: '전세버스', durationSeconds: 3 * DAY },

  { id: 'tram', groupId: 'rail', localOrder: 1, name: '트램', durationSeconds: 1 * HOUR },
  { id: 'light_rail', groupId: 'rail', localOrder: 2, name: '경전철', durationSeconds: 1 * HOUR },
  { id: 'metro_rail', groupId: 'rail', localOrder: 3, name: '광역전철', durationSeconds: 2 * HOUR },
  { id: 'general_train', groupId: 'rail', localOrder: 4, name: '일반열차', durationSeconds: 4 * HOUR },
  { id: 'domestic_hsr', groupId: 'rail', localOrder: 5, name: '국내고속열차', durationSeconds: 2 * HOUR },
  { id: 'international_hsr', groupId: 'rail', localOrder: 6, name: '국제고속열차', durationSeconds: 6 * HOUR },

  { id: 'domestic_flight', groupId: 'air', localOrder: 1, name: '국내선 항공', durationSeconds: 2 * HOUR },
  { id: 'international_flight', groupId: 'air', localOrder: 2, name: '국제선 항공', durationSeconds: 10 * HOUR },

  { id: 'domestic_ship', groupId: 'ship', localOrder: 1, name: '국내선 선박', durationSeconds: 1 * DAY },
  { id: 'short_international_ship', groupId: 'ship', localOrder: 2, name: '국제선 단거리 선박', durationSeconds: 15 * DAY },
  { id: 'long_international_ship', groupId: 'ship', localOrder: 3, name: '국제선 장거리 선박', durationSeconds: 30 * DAY },

  { id: 'space_station_shuttle', groupId: 'space', localOrder: 1, name: '우주정거장 셔틀', durationSeconds: 3 * HOUR },
  { id: 'stellar_shuttle', groupId: 'space', localOrder: 2, name: '성계 셔틀', durationSeconds: 60 * DAY },
  { id: 'galaxy_shuttle', groupId: 'space', localOrder: 3, name: '은하 셔틀', durationSeconds: 180 * DAY },
]

const defaultCustomDraft = {
  routeName: '',
  roundTripDays: 0,
  roundTripHours: 1,
  roundTripMinutes: 0,
  headwayMinutes: 30,
}

const standardNow = ref(new Date())
const offlineReport = ref(null)
let secondTimer = null
let autoSaveTimer = null
let standardTimer = null
let isSaving = false

function createInitialStages() {
  return stageDefinitions.map((stage) => {
    const initiallyUnlocked = stage.groupId === 'bus' && stage.localOrder === 1
    return {
      ...stage,
      unlocked: initiallyUnlocked,
      phase: initiallyUnlocked ? 'running' : 'locked',
      runs: 0,
      remainingSeconds: stage.durationSeconds,
    }
  })
}

function createInitialCustomRoutes() {
  return groups.map((group) => ({
    groupId: group.id,
    created: false,
    routeName: '',
    roundTripSeconds: 1 * HOUR,
    dispatchIntervalSeconds: 30 * MINUTE,
    nextDispatchAt: null,
    activeVehicles: [],
    runs: 0,
    pendingUpdate: null,
  }))
}

function createInitialCustomDrafts() {
  return Object.fromEntries(groups.map((group) => [group.id, { ...defaultCustomDraft }]))
}

const stages = reactive(createInitialStages())
const customRoutes = reactive(createInitialCustomRoutes())
const customDrafts = reactive(createInitialCustomDrafts())
const logs = ref([])

const standardClock = computed(() => formatStandardClock(standardNow.value))
const npcDraftAge = computed(() => (npcDraft.birth ? npcAgeText(npcDraft.birth) : '-'))
const terrariaWorldStatus = computed(() => {
  if (terrariaNpcs.length === 0) {
    return {
      title: '대기 · NPC 없음',
      description: 'NPC를 생성한 뒤, 현재 시간 이후의 스토리보드를 연결해야 세계가 진행됩니다.',
    }
  }

  const missingNpcs = terrariaNpcs.filter((npc) => !npcHasFutureStoryboard(npc))
  if (missingNpcs.length > 0) {
    return {
      title: '정지 · 미래 보드 부족',
      description: `${missingNpcs.map((npc) => npc.name).join(', ')}의 다음 흐름이 비어 있습니다. 한 명이라도 비어 있으면 전체 세계 시간이 멈춥니다.`,
    }
  }

  return {
    title: '진행 가능 · 미래 보드 확보',
    description: '모든 NPC가 현재 시간 이후의 스토리보드를 가지고 있어 이야기가 계속 진행됩니다.',
  }
})

function groupStages(groupId) {
  return stages.filter((stage) => stage.groupId === groupId)
}

function groupTotal(group) {
  const total = groupStages(group.id).reduce((sum, stage) => sum + stage.runs, 0)
  return Math.min(total, GROUP_MASTER_RUNS)
}

function isGroupUnlocked(group) {
  return groupStages(group.id).some((stage) => stage.unlocked)
}

function isGroupMaster(group) {
  return groupTotal(group) >= GROUP_MASTER_RUNS
}

function groupStateLabel(group) {
  if (!isGroupUnlocked(group)) return '대기'
  if (isGroupMaster(group)) return customRoute(group.id).created ? '커스텀' : '마스터'
  if (groupTotal(group) >= NEXT_GROUP_UNLOCK_RUNS) return '다음 그룹 개방됨'
  return '진행중'
}

function groupSubtitle(group) {
  if (!isGroupUnlocked(group)) return '이전 그룹 50회 달성 시 첫 슬롯 자동개방'
  if (isGroupMaster(group)) return customRoute(group.id).created ? '커스텀 노선 운행중' : '100회 달성 · 커스텀 노선 등록 가능'
  return '50회 다음 그룹 · 100회 커스텀'
}

function getGroupById(groupId) {
  return groups.find((group) => group.id === groupId)
}

function getNextGroup(groupId) {
  const group = getGroupById(groupId)
  if (!group) return null
  return groups.find((item) => item.order === group.order + 1) ?? null
}

function firstStageOfGroup(groupId) {
  return groupStages(groupId).find((stage) => stage.localOrder === 1) ?? null
}

function nextStageInGroup(stage) {
  return groupStages(stage.groupId).find((item) => item.localOrder === stage.localOrder + 1) ?? null
}

function customRoute(groupId) {
  return customRoutes.find((route) => route.groupId === groupId)
}

function unlockStage(stage) {
  if (!stage || stage.unlocked) return false
  stage.unlocked = true
  stage.phase = 'running'
  stage.remainingSeconds = stage.durationSeconds
  return true
}

function updateUnlocks() {
  let changed = false

  stages.forEach((stage) => {
    if (!stage.unlocked || stage.runs < SUB_STAGE_UNLOCK_RUNS) return
    const next = nextStageInGroup(stage)
    if (unlockStage(next)) {
      addLog(`${next.name} 자동개방`)
      changed = true
    }
  })

  groups.forEach((group) => {
    if (groupTotal(group) < NEXT_GROUP_UNLOCK_RUNS) return
    const nextGroup = getNextGroup(group.id)
    if (!nextGroup) return
    const firstStage = firstStageOfGroup(nextGroup.id)
    if (unlockStage(firstStage)) {
      addLog(`${group.name}그룹 50회 달성 · ${nextGroup.name}그룹 개방`)
      changed = true
    }
  })

  groups.forEach((group) => {
    if (!isGroupMaster(group)) return
    groupStages(group.id).forEach((stage) => {
      if (stage.unlocked && stage.phase !== 'master') {
        stage.phase = 'master'
        stage.remainingSeconds = 0
        changed = true
      }
    })
  })

  return changed
}

function tickGame() {
  const now = new Date()
  const prev = new Date(now.getTime() - SECOND)
  standardNow.value = now
  processDueTerrariaStepEffects()
  cleanupExpiredTerrariaStoryboards()
  applyPendingCustomUpdates(now)

  stages.forEach((stage) => {
    if (!stage.unlocked || stage.phase === 'locked' || stage.phase === 'master') return

    const tickAmount = getTickAmountForStage(stage, now, prev)
    if (tickAmount <= 0) return

    stage.remainingSeconds = Math.max(0, normalizeRemaining(stage) - tickAmount)
    if (stage.remainingSeconds <= 0) completeStageStep(stage)
  })

  processCustomRoutes(now, 1)
  updateUnlocks()
}

function completeStageStep(stage) {
  if (stage.phase === 'running') {
    const group = getGroupById(stage.groupId)
    if (group && !isGroupMaster(group)) {
      stage.runs += 1
      addLog(`${stage.name} ${stage.runs}회 완료`)
    }

    updateUnlocks()

    if (stage.phase !== 'master') {
      stage.phase = 'waiting'
      stage.remainingSeconds = getWaitSeconds(stage)
    }
    return
  }

  if (stage.phase === 'waiting') {
    stage.phase = 'running'
    stage.remainingSeconds = stage.durationSeconds
  }
}

function getWaitSeconds(stage) {
  return stage.runs >= SUB_STAGE_UNLOCK_RUNS ? AUTO_WAIT_SECONDS : MANUAL_WAIT_SECONDS
}

function getTickAmountForStage(stage, currentDate, previousDate) {
  if (stage.timeWindow === 'commuter') return countCommuterOperableSeconds(previousDate, currentDate)
  return 1
}

function processCustomRoutes(now, elapsedSeconds) {
  applyPendingCustomUpdates(now)

  customRoutes.forEach((route) => {
    if (!route.created || route.runs >= CUSTOM_MASTER_RUNS) return

    route.activeVehicles.forEach((vehicle) => {
      vehicle.remainingSeconds = Math.max(0, vehicle.remainingSeconds - elapsedSeconds)
    })

    const completed = route.activeVehicles.filter((vehicle) => vehicle.remainingSeconds <= 0)
    if (completed.length > 0) {
      const availableRuns = CUSTOM_MASTER_RUNS - route.runs
      const addRuns = Math.min(availableRuns, completed.length)
      route.runs += addRuns
      if (route.runs >= CUSTOM_MASTER_RUNS) addLog(`${getGroupById(route.groupId).name} 커스텀 마스터`)
    }
    route.activeVehicles = route.activeVehicles.filter((vehicle) => vehicle.remainingSeconds > 0)

    dispatchCustomVehicles(route, now)
  })
}

function dispatchCustomVehicles(route, now) {
  if (!route.created || route.runs >= CUSTOM_MASTER_RUNS) return
  if (!route.nextDispatchAt) route.nextDispatchAt = now.toISOString()

  let nextTime = new Date(route.nextDispatchAt)
  let guard = 0
  const headway = Math.max(MINUTE, route.dispatchIntervalSeconds || 30 * MINUTE)

  while (nextTime <= now && guard < 50 && route.runs < CUSTOM_MASTER_RUNS) {
    guard += 1
    if (isCustomServiceActive(route.groupId, nextTime)) {
      route.activeVehicles.push({
        id: cryptoRandomId(),
        label: `${route.routeName} ${route.activeVehicles.length + 1}호`,
        remainingSeconds: route.roundTripSeconds,
        startedAt: nextTime.toISOString(),
      })
    }
    nextTime = new Date(nextTime.getTime() + headway * SECOND)
  }

  route.nextDispatchAt = nextTime.toISOString()
}

function isCustomServiceActive(groupId, date) {
  if (groupId !== 'bus') return true
  if (!isStageUnlocked('commuter_charter')) return true
  const hour = date.getHours()
  return hour >= 6 && hour < 23
}

function createCustomRoute(groupId) {
  const route = customRoute(groupId)
  const draft = customDrafts[groupId]
  if (!route || !draft) return

  const name = draft.routeName?.trim() || `${getGroupById(groupId).name} 커스텀 노선`
  const roundTripSeconds = normalizeCustomRoundTrip(groupId, (
    (Number(draft.roundTripDays) || 0) * DAY
    + (Number(draft.roundTripHours) || 0) * HOUR
    + (Number(draft.roundTripMinutes) || 0) * MINUTE
  ))
  const dispatchIntervalSeconds = Math.max(MINUTE, (Number(draft.headwayMinutes) || 30) * MINUTE)

  route.created = true
  route.routeName = name
  route.roundTripSeconds = roundTripSeconds
  route.dispatchIntervalSeconds = dispatchIntervalSeconds
  route.nextDispatchAt = new Date().toISOString()
  route.activeVehicles = []
  route.runs = 1
  route.pendingUpdate = null
  setDraftFromRoute(groupId)

  addLog(`${getGroupById(groupId).name} 커스텀 노선 등록 · ${name}`)
  saveSoon()
}

function reserveCustomRouteUpdate(groupId) {
  const route = customRoute(groupId)
  const draft = customDrafts[groupId]
  if (!route?.created || !draft) return

  const routeName = draft.routeName?.trim() || route.routeName
  const roundTripSeconds = normalizeCustomRoundTrip(groupId, (
    (Number(draft.roundTripDays) || 0) * DAY
    + (Number(draft.roundTripHours) || 0) * HOUR
    + (Number(draft.roundTripMinutes) || 0) * MINUTE
  ))
  const dispatchIntervalSeconds = Math.max(MINUTE, (Number(draft.headwayMinutes) || 30) * MINUTE)
  const applyAt = nextDayStart(new Date()).toISOString()

  route.pendingUpdate = {
    routeName,
    roundTripSeconds,
    dispatchIntervalSeconds,
    applyAt,
  }

  addLog(`${getGroupById(groupId).name} 커스텀 수정 예약 · 다음날 적용`)
  saveSoon()
}

function applyPendingCustomUpdates(now) {
  customRoutes.forEach((route) => {
    if (!route.pendingUpdate?.applyAt) return
    const applyAt = new Date(route.pendingUpdate.applyAt)
    if (applyAt > now) return

    route.routeName = route.pendingUpdate.routeName || route.routeName
    route.roundTripSeconds = normalizeCustomRoundTrip(route.groupId, route.pendingUpdate.roundTripSeconds)
    route.dispatchIntervalSeconds = Math.max(MINUTE, route.pendingUpdate.dispatchIntervalSeconds || route.dispatchIntervalSeconds)
    route.nextDispatchAt = now.toISOString()
    route.pendingUpdate = null
    setDraftFromRoute(route.groupId)
    addLog(`${getGroupById(route.groupId).name} 커스텀 수정 적용 · 다음날 반영 완료`)
  })
}

function nextDayStart(date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  next.setDate(next.getDate() + 1)
  return next
}

function setDraftFromRoute(groupId) {
  const route = customRoute(groupId)
  const draft = customDrafts[groupId]
  if (!route || !draft) return
  const days = Math.floor(route.roundTripSeconds / DAY)
  const hours = Math.floor((route.roundTripSeconds % DAY) / HOUR)
  const minutes = Math.floor((route.roundTripSeconds % HOUR) / MINUTE)
  draft.routeName = route.routeName
  draft.roundTripDays = days
  draft.roundTripHours = hours
  draft.roundTripMinutes = minutes
  draft.headwayMinutes = Math.max(1, Math.round(route.dispatchIntervalSeconds / MINUTE))
}

function normalizeCustomRoundTrip(groupId, seconds) {
  let value = Math.max(10 * MINUTE, seconds || HOUR)
  if (groupId === 'space') value = Math.max(30 * DAY, value)
  return value
}

function isStageUnlocked(stageId) {
  return stages.find((stage) => stage.id === stageId)?.unlocked ?? false
}

function customSummary(group) {
  const route = customRoute(group.id)
  if (!route?.created) return '노선명 · 왕복시간 · 배차간격 등록'
  if (route.runs >= CUSTOM_MASTER_RUNS) return '커스텀 마스터'
  return '배차간격에 따라 차량 생성 · 운행 완료 후 소멸'
}

function customTimerText(groupId) {
  const route = customRoute(groupId)
  if (!route?.created) return '준비'
  if (route.runs >= CUSTOM_MASTER_RUNS) return 'MASTER'
  const soonest = route.activeVehicles.reduce((min, vehicle) => Math.min(min, vehicle.remainingSeconds), Infinity)
  if (Number.isFinite(soonest)) return formatDuration(soonest)
  if (!route.nextDispatchAt) return '배차 대기'
  const diff = Math.max(0, Math.floor((new Date(route.nextDispatchAt).getTime() - Date.now()) / SECOND))
  return `배차 ${formatDuration(diff)}`
}

function applyOfflineProgress(elapsedSeconds, savedAtDate) {
  if (elapsedSeconds <= 0) return

  let remainingElapsed = elapsedSeconds
  let cursor = new Date(savedAtDate)
  let completedRuns = 0
  let guard = 0

  while (remainingElapsed > 0 && guard < 20000) {
    guard += 1
    updateUnlocks()

    const activeStages = stages.filter((stage) => (
      stage.unlocked && stage.phase !== 'locked' && stage.phase !== 'master'
    ))

    if (activeStages.length === 0) break

    let nextEventSeconds = Infinity
    activeStages.forEach((stage) => {
      const seconds = realSecondsUntilStageEvent(stage, cursor, remainingElapsed)
      if (seconds > 0 && seconds < nextEventSeconds) nextEventSeconds = seconds
    })

    if (!Number.isFinite(nextEventSeconds) || nextEventSeconds > remainingElapsed) {
      advanceStagesByRealSeconds(activeStages, cursor, remainingElapsed)
      remainingElapsed = 0
      break
    }

    advanceStagesByRealSeconds(activeStages, cursor, nextEventSeconds)
    cursor = new Date(cursor.getTime() + nextEventSeconds * SECOND)
    remainingElapsed -= nextEventSeconds

    activeStages.forEach((stage) => {
      if (stage.remainingSeconds <= 0 && stage.phase === 'running') completedRuns += 1
      if (stage.remainingSeconds <= 0) completeStageStep(stage)
    })
  }

  applyPendingCustomUpdates(new Date())
  const customRuns = applyCustomOfflineProgress(elapsedSeconds)

  if (guard >= 20000 && remainingElapsed > 0) {
    addLog('오프라인 진행 일부 반영 · 장기 방치 보정 필요')
  }

  updateUnlocks()

  if (completedRuns > 0 || customRuns > 0) {
    offlineReport.value = {
      elapsedText: formatLongDuration(elapsedSeconds),
      completedRuns,
      customRuns,
    }
    addLog(`오프라인 진행 기본 ${completedRuns}회 · 커스텀 ${customRuns}회 반영`)
  }
}

function applyCustomOfflineProgress(elapsedSeconds) {
  let customRuns = 0
  const now = new Date()

  customRoutes.forEach((route) => {
    if (!route.created || route.runs >= CUSTOM_MASTER_RUNS) return

    route.activeVehicles.forEach((vehicle) => {
      vehicle.remainingSeconds = Math.max(0, vehicle.remainingSeconds - elapsedSeconds)
    })

    const completed = route.activeVehicles.filter((vehicle) => vehicle.remainingSeconds <= 0).length
    if (completed > 0) {
      const addRuns = Math.min(CUSTOM_MASTER_RUNS - route.runs, completed)
      route.runs += addRuns
      customRuns += addRuns
    }
    route.activeVehicles = route.activeVehicles.filter((vehicle) => vehicle.remainingSeconds > 0)

    if (!route.nextDispatchAt) route.nextDispatchAt = now.toISOString()
    let nextTime = new Date(route.nextDispatchAt)
    const headway = Math.max(MINUTE, route.dispatchIntervalSeconds || 30 * MINUTE)
    let guard = 0

    while (nextTime <= now && route.runs < CUSTOM_MASTER_RUNS && guard < 1000) {
      guard += 1
      if (isCustomServiceActive(route.groupId, nextTime)) {
        const ageSeconds = Math.floor((now.getTime() - nextTime.getTime()) / SECOND)
        if (ageSeconds >= route.roundTripSeconds) {
          route.runs += 1
          customRuns += 1
        } else {
          route.activeVehicles.push({
            id: cryptoRandomId(),
            label: `${route.routeName} ${route.activeVehicles.length + 1}호`,
            remainingSeconds: route.roundTripSeconds - ageSeconds,
            startedAt: nextTime.toISOString(),
          })
        }
      }
      nextTime = new Date(nextTime.getTime() + headway * SECOND)
    }
    route.nextDispatchAt = nextTime.toISOString()
  })

  return customRuns
}

function realSecondsUntilStageEvent(stage, cursor, maxSeconds) {
  const remaining = normalizeRemaining(stage)
  if (stage.timeWindow !== 'commuter') return Math.min(remaining, maxSeconds)
  return realSecondsToAccumulateCommuter(cursor, remaining, maxSeconds)
}

function realSecondsToAccumulateCommuter(startDate, needOperableSeconds, maxRealSeconds) {
  if (needOperableSeconds <= 0) return 0

  let accumulated = 0
  let elapsed = 0
  const cursor = new Date(startDate)

  while (elapsed < maxRealSeconds && accumulated < needOperableSeconds) {
    const nextBoundary = nextCommuterBoundary(cursor)
    const step = Math.max(1, Math.min(
      maxRealSeconds - elapsed,
      Math.floor((nextBoundary.getTime() - cursor.getTime()) / SECOND) || 1,
      needOperableSeconds - accumulated || 1,
    ))

    if (isCommuterWindow(cursor)) accumulated += step
    cursor.setTime(cursor.getTime() + step * SECOND)
    elapsed += step
  }

  return accumulated >= needOperableSeconds ? elapsed : maxRealSeconds + 1
}

function nextCommuterBoundary(date) {
  const candidates = []
  for (let offset = 0; offset <= 8; offset += 1) {
    const base = new Date(date)
    base.setDate(base.getDate() + offset)
    base.setHours(0, 0, 0, 0)
    ;[6, 10, 17, 21, 24].forEach((hour) => {
      const candidate = new Date(base)
      candidate.setHours(hour, 0, 0, 0)
      if (candidate > date) candidates.push(candidate)
    })
  }
  return candidates.sort((a, b) => a - b)[0] ?? new Date(date.getTime() + HOUR * SECOND)
}

function advanceStagesByRealSeconds(activeStages, cursor, realSeconds) {
  const end = new Date(cursor.getTime() + realSeconds * SECOND)
  activeStages.forEach((stage) => {
    const effective = stage.timeWindow === 'commuter'
      ? countCommuterOperableSeconds(cursor, end)
      : realSeconds
    stage.remainingSeconds = Math.max(0, normalizeRemaining(stage) - effective)
  })
}

function normalizeRemaining(stage) {
  if (!Number.isFinite(stage.remainingSeconds) || stage.remainingSeconds <= 0) {
    if (stage.phase === 'waiting') return getWaitSeconds(stage)
    return stage.durationSeconds
  }
  return stage.remainingSeconds
}

function countCommuterOperableSeconds(startDate, endDate) {
  if (endDate <= startDate) return 0

  let total = 0
  const cursor = new Date(startDate)
  cursor.setHours(0, 0, 0, 0)

  while (cursor < endDate) {
    const day = cursor.getDay()
    const isWeekday = day >= 1 && day <= 5

    if (isWeekday) {
      total += overlapSeconds(startDate, endDate, withHour(cursor, 6), withHour(cursor, 10))
      total += overlapSeconds(startDate, endDate, withHour(cursor, 17), withHour(cursor, 21))
    }

    cursor.setDate(cursor.getDate() + 1)
  }

  return total
}

function withHour(baseDate, hour) {
  const date = new Date(baseDate)
  date.setHours(hour, 0, 0, 0)
  return date
}

function overlapSeconds(rangeStart, rangeEnd, windowStart, windowEnd) {
  const start = Math.max(rangeStart.getTime(), windowStart.getTime())
  const end = Math.min(rangeEnd.getTime(), windowEnd.getTime())
  return Math.max(0, Math.floor((end - start) / SECOND))
}

function stageStateLabel(stage) {
  if (!stage.unlocked) return '대기'
  if (stage.phase === 'master') return '기본 완료'
  const mode = stage.runs >= SUB_STAGE_UNLOCK_RUNS ? '자동' : `${stage.runs}/${SUB_STAGE_UNLOCK_RUNS}회`
  if (stage.phase === 'waiting') return `${mode} · 대기중`
  if (stage.phase === 'running') return `${mode} · 운행중`
  return mode
}

function timerText(stage) {
  if (!stage.unlocked) return '대기'
  if (stage.phase === 'master') return '완료'
  if (stage.timeWindow === 'commuter' && !isCommuterWindow(standardNow.value)) return `휴식 · ${formatDuration(stage.remainingSeconds)}`
  return formatDuration(stage.remainingSeconds)
}

function stageDurationLabel(stage) {
  if (stage.timeWindow === 'commuter') return '월~금 06~10 / 17~21'
  return `1회 ${formatLongDuration(stage.durationSeconds)}`
}

function isCommuterWindow(date) {
  const day = date.getDay()
  const hour = date.getHours()
  return day >= 1 && day <= 5 && ((hour >= 6 && hour < 10) || (hour >= 17 && hour < 21))
}



const availableStoryActors = computed(() => {
  const npcActors = storyboardDraft.npcIds
    .map((id) => getNpcById(id))
    .filter(Boolean)
    .map((npc) => ({ key: `npc:${npc.id}`, label: npc.name }))

  const returningActors = storyboardDraft.returningExtraIds
    .map((id) => getExtraById(id))
    .filter(Boolean)
    .map((extra) => ({ key: `extra:${extra.id}`, label: extraLabel(extra) }))

  const newExtraActors = parseNewExtraLines(storyboardDraft.newExtrasText)
    .map((line, index) => ({ key: `new-extra:${index}`, label: `새 엑스트라 ${index + 1} · ${line}` }))

  const seen = new Set()
  return [...npcActors, ...returningActors, ...newExtraActors].filter((actor) => {
    if (!actor.label || seen.has(actor.label)) return false
    seen.add(actor.label)
    return true
  })
})

function createEmptyStoryStepDraft() {
  return {
    id: cryptoRandomId(),
    time: '',
    actorLabels: [],
    action: '',
    effectType: 'none',
    deathNpcIds: [],
    birthName: '',
    birthGender: '기타/미정',
    birthNpcId: '',
  }
}

function addStoryStepRow() {
  storyboardStepDrafts.push(createEmptyStoryStepDraft())
}

function removeStoryStepRow(index) {
  if (storyboardStepDrafts.length <= 1) return
  storyboardStepDrafts.splice(index, 1)
}

function resetStoryStepRows(rows = null) {
  storyboardStepDrafts.splice(0, storyboardStepDrafts.length)
  const nextRows = Array.isArray(rows) && rows.length ? rows : [createEmptyStoryStepDraft()]
  nextRows.forEach((row) => {
    storyboardStepDrafts.push({
      id: row.id || cryptoRandomId(),
      time: normalizeDateTimeText(row.time || ''),
      actorLabels: Array.isArray(row.actorLabels) ? [...row.actorLabels] : [],
      action: row.action || row.text || '',
      effectType: ['death', 'birth'].includes(row.effectType) ? row.effectType : 'none',
      deathNpcIds: Array.isArray(row.deathNpcIds) ? [...row.deathNpcIds] : [],
      birthName: row.birthName || '',
      birthGender: row.birthGender || '기타/미정',
      birthNpcId: row.birthNpcId || '',
    })
  })
}

function toggleStepActor(step, actorLabel) {
  if (!step || !actorLabel) return
  const index = step.actorLabels.indexOf(actorLabel)
  if (index >= 0) step.actorLabels.splice(index, 1)
  else step.actorLabels.push(actorLabel)
}

function formatStepPreview(step) {
  const actors = step.actorLabels?.length ? `${step.actorLabels.join(', ')} · ` : ''
  return `${actors}${step.action || '내용을 입력하세요.'}`
}

function prepareStoryStepRows() {
  return storyboardStepDrafts
    .map((step) => ({
      id: step.id || cryptoRandomId(),
      time: normalizeDateTimeText(step.time || ''),
      actorLabels: Array.isArray(step.actorLabels) ? [...step.actorLabels] : [],
      text: String(step.action || '').trim(),
      effectType: ['death', 'birth'].includes(step.effectType) ? step.effectType : 'none',
      deathNpcIds: Array.isArray(step.deathNpcIds) ? [...step.deathNpcIds] : [],
      birthName: String(step.birthName || '').trim(),
      birthGender: step.birthGender || '기타/미정',
      birthNpcId: step.birthNpcId || '',
    }))
    .filter((step) => step.time || step.text || step.actorLabels.length)
}

function parseNewExtraLines(text) {
  return String(text || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

const sortedTerrariaStoryboards = computed(() => {
  return [...terrariaStoryboards].sort((a, b) => storyboardDateValue(a.start) - storyboardDateValue(b.start))
})

function submitTerrariaStoryboard() {
  if (editingStoryboardId.value) {
    updateTerrariaStoryboard()
    return
  }
  createTerrariaStoryboard()
}

function createTerrariaStoryboard() {
  const prepared = prepareStoryboardPayload()
  if (!prepared) return

  const { board, npcIds, returningExtraIds, deathNpcIds, title } = prepared
  const newExtraIds = createExtrasFromText(storyboardDraft.newExtrasText, title)
  returningExtraIds.forEach((extraId) => registerExtraAppearance(extraId, title))
  board.extraIds = Array.from(new Set([...newExtraIds, ...returningExtraIds]))

  terrariaStoryboards.unshift(board)
  syncNpcBoardLinks(board.id, npcIds)
  ensureFutureBirthNpcsForBoard(board)
  processDueTerrariaStepEffects()
  ensureExtraPromotionDrafts()
  resetStoryboardDraft()
  addLog(`테라리아 스토리보드 등록 · ${title}`)
  saveSoon()
}

function updateTerrariaStoryboard() {
  const index = terrariaStoryboards.findIndex((board) => board.id === editingStoryboardId.value)
  if (index < 0) {
    cancelStoryboardEdit()
    return
  }

  const prepared = prepareStoryboardPayload({ existingId: editingStoryboardId.value, keepExistingExtras: true })
  if (!prepared) return

  const oldBoard = terrariaStoryboards[index]
  const { board, npcIds, returningExtraIds, deathNpcIds, title } = prepared
  const newExtraIds = createExtrasFromText(storyboardDraft.newExtrasText, title)
  returningExtraIds.forEach((extraId) => {
    if (!(oldBoard.extraIds || []).includes(extraId)) registerExtraAppearance(extraId, title)
  })
  board.extraIds = Array.from(new Set([...(oldBoard.extraIds || []), ...newExtraIds, ...returningExtraIds]))
  board.createdAt = oldBoard.createdAt || board.createdAt
  board.updatedAt = new Date().toISOString()

  removeStoryboardLinks(oldBoard.id)
  terrariaStoryboards.splice(index, 1, board)
  syncNpcBoardLinks(board.id, npcIds)
  ensureFutureBirthNpcsForBoard(board)
  processDueTerrariaStepEffects()
  ensureExtraPromotionDrafts()
  resetStoryboardDraft()
  addLog(`테라리아 스토리보드 수정 · ${title}`)
  saveSoon()
}

function prepareStoryboardPayload(options = {}) {
  storyboardFormError.value = ''
  const title = storyboardDraft.title.trim()
  const boardType = storyboardDraft.boardType || 'story'
  const npcIds = [...storyboardDraft.npcIds]
  const returningExtraIds = [...storyboardDraft.returningExtraIds]
  const deathNpcIds = [...storyboardDraft.deathNpcIds]
  const steps = prepareStoryStepRows()

  if (!title) {
    storyboardFormError.value = '보드명을 입력해야 합니다.'
    return null
  }
  if (steps.length === 0) {
    storyboardFormError.value = '스토리 단계는 1개 이상 필요합니다.'
    return null
  }
  if (steps.some((step) => !isValidDateTimeText(step.time) || !step.text)) {
    storyboardFormError.value = '모든 스토리 단계는 시간과 내용을 입력해야 합니다.'
    return null
  }
  if (steps.some((step) => step.effectType === 'death' && step.deathNpcIds.length === 0)) {
    storyboardFormError.value = '사망 처리 단계에는 사망 대상 NPC를 1명 이상 선택해야 합니다.'
    return null
  }
  if (steps.some((step) => step.effectType === 'birth' && !step.birthName)) {
    storyboardFormError.value = '출생 처리 단계에는 출생 예정 이름을 입력해야 합니다.'
    return null
  }

  const sortedSteps = [...steps].sort((a, b) => dateTimeValue(a.time) - dateTimeValue(b.time))
  const start = sortedSteps[0].time
  const end = sortedSteps[sortedSteps.length - 1].time

  const participantNames = npcIds.map((id) => getNpcById(id)?.name).filter(Boolean)
  const stepDeathNpcIds = Array.from(new Set(sortedSteps.flatMap((step) => step.effectType === 'death' ? step.deathNpcIds : [])))
  const deathNames = stepDeathNpcIds.map((id) => getNpcById(id)?.name).filter(Boolean)
  const birthNames = sortedSteps.filter((step) => step.effectType === 'birth').map((step) => step.birthName).filter(Boolean)

  return {
    title,
    npcIds,
    returningExtraIds,
    deathNpcIds,
    board: {
      id: options.existingId || cryptoRandomId(),
      title,
      boardType,
      start,
      end,
      npcIds,
      participantNames,
      extraIds: [],
      deathNpcIds: stepDeathNpcIds,
      deathNames,
      birthNames,
      summary: storyboardDraft.summary.trim(),
      steps: sortedSteps,
      createdAt: new Date().toISOString(),
    },
  }
}

function startEditTerrariaStoryboard(boardId) {
  const board = getBoard(boardId)
  if (!board) return
  editingStoryboardId.value = board.id
  storyboardFormError.value = ''
  Object.assign(storyboardDraft, {
    title: board.title || '',
    boardType: board.boardType || 'story',
    npcIds: [...(board.npcIds || [])].filter((id) => getNpcById(id)),
    returningExtraIds: [...(board.extraIds || [])].filter((id) => getExtraById(id)),
    deathNpcIds: [],
    summary: board.summary || '',
    newExtrasText: '',
  })
  resetStoryStepRows((board.steps || []).map((step) => ({
    id: step.id || cryptoRandomId(),
    time: normalizeDateTimeText(step.time || ''),
    actorLabels: Array.isArray(step.actorLabels) ? [...step.actorLabels] : [],
    action: step.text || '',
    effectType: step.effectType || 'none',
    deathNpcIds: Array.isArray(step.deathNpcIds) ? [...step.deathNpcIds] : [],
    birthName: step.birthName || '',
    birthGender: step.birthGender || '기타/미정',
    birthNpcId: step.birthNpcId || '',
  })))
}

function cancelStoryboardEdit() {
  resetStoryboardDraft()
}

function resetStoryboardDraft() {
  editingStoryboardId.value = ''
  storyboardFormError.value = ''
  Object.assign(storyboardDraft, { ...defaultStoryboardDraft, npcIds: [], returningExtraIds: [], deathNpcIds: [] })
  resetStoryStepRows()
}

function deleteTerrariaStoryboard(boardId, options = {}) {
  const index = terrariaStoryboards.findIndex((board) => board.id === boardId)
  if (index < 0) return
  const [removed] = terrariaStoryboards.splice(index, 1)
  removeStoryboardLinks(boardId, removed)
  if (editingStoryboardId.value === boardId) resetStoryboardDraft()
  addLog(options.expired ? `테라리아 스토리보드 자동 종료 삭제 · ${removed.title}` : `테라리아 스토리보드 삭제 · ${removed.title}`)
  if (!options.skipSave) saveSoon()
}

function removeStoryboardLinks(boardId, removedBoard = getBoard(boardId)) {
  const names = removedBoard ? boardNpcNames(removedBoard) : []
  terrariaNpcs.forEach((npc) => {
    npc.boardIds = (npc.boardIds || []).filter((id) => id !== boardId)
    if (names.length) npc.links = (npc.links || []).filter((name) => !names.includes(name))
  })
}

function cleanupExpiredTerrariaStoryboards() {
  const nowValue = standardNow.value.getTime()
  const expiredIds = terrariaStoryboards
    .filter((board) => dateTimeValue(board.end) < nowValue)
    .map((board) => board.id)
  if (!expiredIds.length) return false
  expiredIds.forEach((boardId) => deleteTerrariaStoryboard(boardId, { expired: true, skipSave: true }))
  saveSoon()
  return true
}

function syncNpcBoardLinks(boardId, npcIds) {
  const participantNames = npcIds.map((id) => getNpcById(id)?.name).filter(Boolean)
  terrariaNpcs.forEach((npc) => {
    if (!npcIds.includes(npc.id)) return
    if (!npc.boardIds.includes(boardId)) npc.boardIds.push(boardId)
    const otherNames = participantNames.filter((name) => name !== npc.name)
    npc.links = Array.from(new Set([...(npc.links || []), ...otherNames]))
  })
}

function createExtrasFromText(text, boardTitle) {
  return parseNewExtraLines(text)
    .map((line) => {
      const extra = {
        id: cryptoRandomId(),
        code: nextExtraCode(),
        origin: line,
        appearances: 1,
        firstBoardTitle: boardTitle,
        lastBoardTitle: boardTitle,
        createdAt: new Date().toISOString(),
      }
      terrariaExtras.push(extra)
      extraPromotionDrafts[extra.id] = { ...defaultExtraPromotionDraft }
      return extra.id
    })
}

function nextExtraCode() {
  return `EX-${String(terrariaExtras.length + 1).padStart(3, '0')}`
}

function registerExtraAppearance(extraId, boardTitle) {
  const extra = getExtraById(extraId)
  if (!extra) return
  extra.appearances = (Number(extra.appearances) || 0) + 1
  extra.lastBoardTitle = boardTitle
  if (!extraPromotionDrafts[extra.id]) extraPromotionDrafts[extra.id] = { ...defaultExtraPromotionDraft }
}

function getExtraById(extraId) {
  return terrariaExtras.find((extra) => extra.id === extraId)
}

function extraLabel(extra) {
  if (!extra) return '알 수 없는 엑스트라'
  return extra.name || `${extra.code} · 무명 엑스트라`
}

function boardExtraLabels(board) {
  return (board.extraIds || []).map((id) => extraLabel(getExtraById(id))).filter(Boolean)
}

function stepEffectKey(boardId, stepId, effectType) {
  return `${boardId}:${stepId}:${effectType}`
}

function hasProcessedStepEffect(key) {
  return processedTerrariaStepEffects.includes(key)
}

function markProcessedStepEffect(key) {
  if (!processedTerrariaStepEffects.includes(key)) processedTerrariaStepEffects.push(key)
}

function ensureFutureBirthNpcsForBoard(board) {
  if (!board?.steps?.length) return
  board.steps.forEach((step) => {
    if (step.effectType !== 'birth' || !step.birthName) return
    if (step.birthNpcId && getNpcById(step.birthNpcId)) return

    const birth = normalizeBirthText((step.time || '').split(' ')[0] || '')
    if (!isValidBirthText(birth)) return

    const child = {
      id: cryptoRandomId(),
      name: step.birthName,
      birth,
      gender: step.birthGender || '기타/미정',
      memo: `${board.title}에서 출생 예정 · ${step.time}`,
      focus: dateTimeValue(step.time) > standardNow.value.getTime() ? '출생 예정' : '출생',
      futureBirth: dateTimeValue(step.time) > standardNow.value.getTime(),
      boardIds: [board.id],
      links: Array.isArray(step.actorLabels) ? [...step.actorLabels] : [],
      originBoardId: board.id,
      originStepId: step.id,
    }
    terrariaNpcs.unshift(child)
    step.birthNpcId = child.id
    if (!board.npcIds.includes(child.id)) board.npcIds.push(child.id)
    board.birthNames = Array.from(new Set([...(board.birthNames || []), child.name]))
    addLog(`미래 NPC 등록 · ${child.name} · ${birth} 출생 예정`)
  })
}

function processDueTerrariaStepEffects() {
  const nowValue = standardNow.value.getTime()
  let changed = false

  terrariaStoryboards.forEach((board) => {
    ;(board.steps || []).forEach((step) => {
      if (!['death', 'birth'].includes(step.effectType)) return
      if (!isValidDateTimeText(step.time) || dateTimeValue(step.time) > nowValue) return

      const key = stepEffectKey(board.id, step.id, step.effectType)
      if (hasProcessedStepEffect(key)) return

      if (step.effectType === 'death') {
        ;(step.deathNpcIds || []).forEach((npcId) => {
          const npc = getNpcById(npcId)
          if (!npc) return
          removeTerrariaNpcById(npcId, { reason: 'death', boardTitle: board.title })
          changed = true
        })
      }

      if (step.effectType === 'birth') {
        ensureFutureBirthNpcsForBoard(board)
        const child = getNpcById(step.birthNpcId)
        if (child) {
          child.futureBirth = false
          child.focus = '출생'
          child.memo = child.memo || `${board.title}에서 태어남`
          addLog(`테라리아 NPC 출생 · ${child.name}`)
          changed = true
        }
      }

      markProcessedStepEffect(key)
    })
  })

  if (changed) saveSoon()
  return changed
}

function removeTerrariaNpcById(npcId, options = {}) {
  const index = terrariaNpcs.findIndex((npc) => npc.id === npcId)
  if (index < 0) return null
  const [removed] = terrariaNpcs.splice(index, 1)
  terrariaStoryboards.forEach((board) => {
    board.npcIds = (board.npcIds || []).filter((id) => id !== npcId)
    board.deathNpcIds = (board.deathNpcIds || []).filter((id) => id !== npcId)
    ;(board.steps || []).forEach((step) => {
      step.deathNpcIds = (step.deathNpcIds || []).filter((id) => id !== npcId)
    })
  })
  if (options.reason === 'death') addLog(`테라리아 NPC 사망 · ${removed.name} · ${options.boardTitle || '스토리보드'}`)
  else addLog(`테라리아 NPC 삭제 · ${removed.name}`)
  return removed
}

function applyStoryboardDeaths(deathNpcIds, boardId) {
  // 사망 처리는 보드 저장 즉시 실행하지 않습니다.
  // 각 스토리 단계 시간이 표준시간에 도달하면 processDueTerrariaStepEffects()에서 처리합니다.
}

function promoteExtraToNpc(extraId) {
  const extra = getExtraById(extraId)
  const draft = extraPromotionDrafts[extraId]
  if (!extra || !draft?.name?.trim()) return

  const age = Math.max(0, Math.min(120, Number(draft.age) || 0))
  const birthYear = standardNow.value.getFullYear() - age
  const birth = `${birthYear}/01/01`
  const newNpcId = cryptoRandomId()

  terrariaNpcs.unshift({
    id: newNpcId,
    name: draft.name.trim(),
    birth,
    gender: draft.gender || '기타/미정',
    memo: `${extra.code}에서 승격 · ${extra.appearances}회 등장`,
    focus: '엑스트라 승격',
    boardIds: boardsByExtra(extraId).map((board) => board.id),
    links: [],
  })

  boardsByExtra(extraId).forEach((board) => {
    if (!board.npcIds.includes(newNpcId)) board.npcIds.push(newNpcId)
  })

  const index = terrariaExtras.findIndex((item) => item.id === extraId)
  if (index >= 0) terrariaExtras.splice(index, 1)
  delete extraPromotionDrafts[extraId]
  addLog(`엑스트라 NPC 승격 · ${draft.name.trim()}`)
  saveSoon()
}

function boardsByExtra(extraId) {
  return terrariaStoryboards.filter((board) => (board.extraIds || []).includes(extraId))
}

function ensureExtraPromotionDrafts() {
  terrariaExtras.forEach((extra) => {
    if (!extraPromotionDrafts[extra.id]) extraPromotionDrafts[extra.id] = { ...defaultExtraPromotionDraft }
  })
}

function parseStorySteps(text) {
  return parseNewExtraLines(text)
    .map((line) => {
      const match = line.match(/^(\d{4}[\/.-]\d{1,2}[\/.-]\d{1,2})\s+(\d{1,2}:\d{2})\s*[-–—:]\s*(.+)$/)
      if (!match) return { id: cryptoRandomId(), time: '', text: line }
      return {
        id: cryptoRandomId(),
        time: normalizeDateTimeText(`${match[1]} ${match[2]}`),
        text: match[3].trim(),
      }
    })
}

function boardNpcNames(board) {
  const liveNames = (board.npcIds || board.npcs || [])
    .map((idOrName) => getNpcById(idOrName)?.name || '')
    .filter(Boolean)
  const snapshotNames = Array.isArray(board.participantNames) ? board.participantNames : []
  return Array.from(new Set([...liveNames, ...snapshotNames]))
}

function getNpcById(npcId) {
  return terrariaNpcs.find((npc) => npc.id === npcId)
}

function dateTimeValue(dateTimeText) {
  const normalized = normalizeDateTimeText(dateTimeText)
  if (!isValidDateTimeText(normalized)) return 0
  const [datePart, timePart] = normalized.split(' ')
  const [year, month, day] = datePart.split('/').map(Number)
  const [hour, minute] = timePart.split(':').map(Number)
  return new Date(year, month - 1, day, hour, minute, 0, 0).getTime()
}

function storyboardDateValue(dateText) {
  return dateTimeValue(dateText)
}

function storyboardStatus(board) {
  const now = standardNow.value.getTime()
  const start = dateTimeValue(board.start)
  const end = dateTimeValue(board.end)
  if (now < start) return '예정'
  if (now > end) return '종료됨'
  return '진행 중'
}

function storyboardDurationLabel(board) {
  const days = Math.max(1, Math.round((storyboardDateValue(board.end) - storyboardDateValue(board.start)) / (DAY * SECOND)) + 1)
  if (days <= 1) return '하루 보드'
  if (days <= 31) return '단기 보드'
  if (days <= 365) return '장기 보드'
  return '장시간 프로젝트 보드'
}

function npcHasFutureStoryboard(npc) {
  return (npc.boardIds || []).some((boardId) => {
    const board = getBoard(boardId)
    return board && dateTimeValue(board.end) > standardNow.value.getTime()
  })
}

function startOfTodayValue() {
  return new Date(standardNow.value.getFullYear(), standardNow.value.getMonth(), standardNow.value.getDate()).getTime()
}

function createTerrariaNpc() {
  const name = npcDraft.name.trim()
  const birth = normalizeBirthText(npcDraft.birth)
  if (!name || !isValidBirthText(birth)) return

  terrariaNpcs.unshift({
    id: cryptoRandomId(),
    name,
    birth,
    gender: npcDraft.gender,
    memo: npcDraft.memo.trim(),
    focus: '',
    futureBirth: false,
    boardIds: [],
    links: [],
  })

  Object.assign(npcDraft, { ...defaultNpcDraft })
  addLog(`테라리아 NPC 등록 · ${name}`)
  saveSoon()
}

function deleteTerrariaNpc(npcId) {
  const removed = removeTerrariaNpcById(npcId)
  if (removed) saveSoon()
}

function normalizeDateTimeText(dateTimeText) {
  const raw = String(dateTimeText || '').trim().replace(/\s+/, ' ')
  if (!raw) return ''
  const [datePart, timePart = ''] = raw.split(' ')
  const normalizedDate = normalizeBirthText(datePart)
  const timeMatch = timePart.match(/^(\d{1,2}):(\d{2})$/)
  if (!timeMatch) return `${normalizedDate} ${timePart}`.trim()
  const hour = timeMatch[1].padStart(2, '0')
  const minute = timeMatch[2].padStart(2, '0')
  return `${normalizedDate} ${hour}:${minute}`
}

function isValidDateTimeText(dateTimeText) {
  const normalized = normalizeDateTimeText(dateTimeText)
  if (!/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}$/.test(normalized)) return false
  const [datePart, timePart] = normalized.split(' ')
  if (!isValidBirthText(datePart)) return false
  const [hour, minute] = timePart.split(':').map(Number)
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59
}

function normalizeBirthText(birthText) {
  const raw = String(birthText || '').trim().replaceAll('.', '/').replaceAll('-', '/')
  const parts = raw.split('/').map((part) => part.padStart(2, '0'))
  if (parts.length !== 3) return raw
  return `${parts[0].padStart(4, '0')}/${parts[1]}/${parts[2]}`
}

function isValidBirthText(birthText) {
  if (!/^\d{4}\/\d{2}\/\d{2}$/.test(birthText)) return false
  const [year, month, day] = birthText.split('/').map(Number)
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}

function formatBirth(birthText) {
  return normalizeBirthText(birthText)
}

function npcCurrentState(npc) {
  if (!npc.boardIds?.length) return '스토리보드 대기'
  const firstBoard = getBoard(npc.boardIds[0])
  return firstBoard?.status ? `${firstBoard.status} · ${firstBoard.title}` : '보드 연결됨'
}

function boardRangeText(board) {
  if (!board) return ''
  return `${board.start} ~ ${board.end}`
}

function getBoard(boardId) {
  return terrariaStoryboards.find((board) => board.id === boardId)
}

function npcAgeText(birthText) {
  const birthValue = birthDateValue(birthText)
  if (!birthValue) return '나이 미정'
  if (birthValue > standardNow.value.getTime()) return '출생 예정'
  return `${getAge(birthText)}세`
}

function birthDateValue(birthText) {
  const birth = normalizeBirthText(birthText)
  if (!isValidBirthText(birth)) return 0
  const [year, month, day] = birth.split('/').map(Number)
  return new Date(year, month - 1, day, 0, 0, 0, 0).getTime()
}

function getAge(birthText) {
  const normalized = normalizeBirthText(birthText)
  if (!isValidBirthText(normalized)) return '-'
  const [year, month, day] = normalized.split('/').map(Number)
  if (!year || !month || !day) return 0
  const birth = new Date(year, month - 1, day)
  let age = standardNow.value.getFullYear() - birth.getFullYear()
  const birthdayThisYear = new Date(standardNow.value.getFullYear(), birth.getMonth(), birth.getDate())
  if (standardNow.value < birthdayThisYear) age -= 1
  return age
}

function addLog(text) {
  logs.value = [
    { id: cryptoRandomId(), time: formatLogTime(new Date()), text },
    ...logs.value,
  ].slice(0, 20)
}

function isLegacyDemoNpc(npc) {
  return legacyDemoNpcIds.has(npc?.id) && (npc?.role || npc?.asset || npc?.traits)
}

function normalizeSavedNpc(npc) {
  return {
    id: npc.id || cryptoRandomId(),
    name: npc.name || '이름 없는 NPC',
    birth: normalizeBirthText(npc.birth || ''),
    gender: npc.gender || '기타/미정',
    memo: npc.memo || '',
    focus: npc.focus || '',
    futureBirth: Boolean(npc.futureBirth),
    originBoardId: npc.originBoardId || '',
    originStepId: npc.originStepId || '',
    boardIds: Array.isArray(npc.boardIds) ? npc.boardIds : [],
    links: Array.isArray(npc.links) ? npc.links : [],
  }
}

function normalizeSavedStoryboard(board) {
  const steps = Array.isArray(board.steps)
    ? board.steps.map((step) => ({
        id: step.id || cryptoRandomId(),
        time: normalizeDateTimeText(step.time || ''),
        actorLabels: Array.isArray(step.actorLabels) ? step.actorLabels : [],
        text: step.text || '',
        effectType: ['death', 'birth'].includes(step.effectType) ? step.effectType : 'none',
        deathNpcIds: Array.isArray(step.deathNpcIds) ? step.deathNpcIds : [],
        birthName: step.birthName || '',
        birthGender: step.birthGender || '기타/미정',
        birthNpcId: step.birthNpcId || '',
      })).filter((step) => step.text)
    : []
  const sortedSteps = [...steps].sort((a, b) => dateTimeValue(a.time) - dateTimeValue(b.time))
  const start = sortedSteps[0]?.time || normalizeDateTimeText(board.start || '')
  const end = sortedSteps[sortedSteps.length - 1]?.time || normalizeDateTimeText(board.end || board.start || '')

  return {
    id: board.id || cryptoRandomId(),
    title: board.title || '이름 없는 스토리보드',
    boardType: board.boardType || 'story',
    start,
    end,
    npcIds: Array.isArray(board.npcIds) ? board.npcIds : [],
    participantNames: Array.isArray(board.participantNames) ? board.participantNames : [],
    extraIds: Array.isArray(board.extraIds) ? board.extraIds : [],
    deathNpcIds: Array.isArray(board.deathNpcIds) ? board.deathNpcIds : [],
    deathNames: Array.isArray(board.deathNames) ? board.deathNames : [],
    birthNames: Array.isArray(board.birthNames) ? board.birthNames : [],
    summary: board.summary || '',
    steps: sortedSteps,
    createdAt: board.createdAt || new Date().toISOString(),
  }
}

function normalizeSavedExtra(extra, index = 0) {
  return {
    id: extra.id || cryptoRandomId(),
    code: extra.code || `EX-${String(index + 1).padStart(3, '0')}`,
    name: extra.name || '',
    origin: extra.origin || '',
    appearances: Math.max(1, Number(extra.appearances) || 1),
    firstBoardTitle: extra.firstBoardTitle || '',
    lastBoardTitle: extra.lastBoardTitle || '',
    createdAt: extra.createdAt || new Date().toISOString(),
  }
}

function getSavePayload() {
  return {
    savedAt: new Date().toISOString(),
    standardTime: standardNow.value.toISOString(),
    activePage: activePage.value,
    stages: stages.map((stage) => ({
      id: stage.id,
      unlocked: stage.unlocked,
      phase: stage.phase,
      runs: stage.runs,
      remainingSeconds: stage.remainingSeconds,
    })),
    customRoutes: customRoutes.map((route) => ({
      groupId: route.groupId,
      created: route.created,
      routeName: route.routeName,
      roundTripSeconds: route.roundTripSeconds,
      dispatchIntervalSeconds: route.dispatchIntervalSeconds,
      nextDispatchAt: route.nextDispatchAt,
      activeVehicles: route.activeVehicles,
      runs: route.runs,
      pendingUpdate: route.pendingUpdate,
    })),
    customDrafts: JSON.parse(JSON.stringify(customDrafts)),
    terrariaNpcs: JSON.parse(JSON.stringify(terrariaNpcs)),
    terrariaStoryboards: JSON.parse(JSON.stringify(terrariaStoryboards)),
    terrariaExtras: JSON.parse(JSON.stringify(terrariaExtras)),
    processedTerrariaStepEffects: JSON.parse(JSON.stringify(processedTerrariaStepEffects)),
    logs: logs.value,
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
  if (!record?.payload) {
    updateUnlocks()
    return
  }

  const payload = record.payload
  if (payload.activePage === 'terraria' || payload.activePage === 'rcts') activePage.value = payload.activePage

  if (Array.isArray(payload.stages)) {
    payload.stages.forEach((savedStage) => {
      const stage = stages.find((item) => item.id === savedStage.id)
      if (!stage) return
      stage.unlocked = Boolean(savedStage.unlocked)
      stage.phase = ['running', 'waiting', 'master'].includes(savedStage.phase) ? savedStage.phase : (stage.unlocked ? 'running' : 'locked')
      stage.runs = Number(savedStage.runs) || 0
      stage.remainingSeconds = Number(savedStage.remainingSeconds) || stage.durationSeconds
    })
  }

  if (Array.isArray(payload.customRoutes)) {
    payload.customRoutes.forEach((savedRoute) => {
      const route = customRoute(savedRoute.groupId)
      if (!route) return
      route.created = Boolean(savedRoute.created)
      route.routeName = savedRoute.routeName || ''
      route.roundTripSeconds = Number(savedRoute.roundTripSeconds) || HOUR
      route.dispatchIntervalSeconds = Number(savedRoute.dispatchIntervalSeconds) || 30 * MINUTE
      route.nextDispatchAt = savedRoute.nextDispatchAt || null
      route.activeVehicles = Array.isArray(savedRoute.activeVehicles) ? savedRoute.activeVehicles : []
      route.runs = Math.min(CUSTOM_MASTER_RUNS, Number(savedRoute.runs) || 0)
      route.pendingUpdate = savedRoute.pendingUpdate ?? null
      if (route.created) setDraftFromRoute(route.groupId)
    })
  }

  if (payload.customDrafts && typeof payload.customDrafts === 'object') {
    Object.keys(customDrafts).forEach((groupId) => {
      Object.assign(customDrafts[groupId], payload.customDrafts[groupId] ?? {})
    })
  }

  if (Array.isArray(payload.terrariaStoryboards)) {
    const savedBoards = payload.terrariaStoryboards.map(normalizeSavedStoryboard)
    terrariaStoryboards.splice(0, terrariaStoryboards.length, ...savedBoards)
  }

  if (Array.isArray(payload.terrariaExtras)) {
    const savedExtras = payload.terrariaExtras.map(normalizeSavedExtra)
    terrariaExtras.splice(0, terrariaExtras.length, ...savedExtras)
    ensureExtraPromotionDrafts()
  }

  if (Array.isArray(payload.terrariaNpcs)) {
    const savedNpcs = payload.terrariaNpcs
      .filter((npc) => !isLegacyDemoNpc(npc))
      .map(normalizeSavedNpc)
    terrariaNpcs.splice(0, terrariaNpcs.length, ...savedNpcs)
  }

  if (Array.isArray(payload.processedTerrariaStepEffects)) {
    processedTerrariaStepEffects.splice(0, processedTerrariaStepEffects.length, ...payload.processedTerrariaStepEffects.filter(Boolean))
  }

  ensureExtraPromotionDrafts()

  if (Array.isArray(payload.logs)) logs.value = payload.logs.slice(0, 20)

  const savedAtIso = payload.savedAt ?? record.savedAt
  if (savedAtIso) {
    const savedAt = new Date(savedAtIso)
    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - savedAt.getTime()) / SECOND))
    applyOfflineProgress(elapsedSeconds, savedAt)
  }

  terrariaStoryboards.forEach((board) => ensureFutureBirthNpcsForBoard(board))
  processDueTerrariaStepEffects()
  updateUnlocks()
}

function scheduleTimers() {
  secondTimer = window.setInterval(tickGame, SECOND)
  autoSaveTimer = window.setInterval(saveSoon, AUTO_SAVE_INTERVAL_MS)
  scheduleStandardTick()
}

function scheduleStandardTick() {
  standardNow.value = new Date()
  const delay = 1000 - standardNow.value.getMilliseconds()
  standardTimer = window.setTimeout(scheduleStandardTick, delay)
}

function handleVisibilityChange() {
  if (document.visibilityState === 'hidden') saveSoon()
}

function formatApplyDate(value) {
  const date = new Date(value)
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${mm}.${dd} 00:00`
}

function formatStandardClock(date) {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mi = String(date.getMinutes()).padStart(2, '0')
  return `${yyyy}.${mm}.${dd} ${hh}:${mi}`
}

function formatLogTime(date) {
  const hh = String(date.getHours()).padStart(2, '0')
  const mi = String(date.getMinutes()).padStart(2, '0')
  return `${hh}:${mi}`
}

function formatDuration(seconds) {
  const total = Math.max(0, Math.floor(seconds))
  const days = Math.floor(total / DAY)
  const hours = Math.floor((total % DAY) / HOUR)
  const minutes = Math.floor((total % HOUR) / MINUTE)
  const secs = total % MINUTE

  if (days > 0) return `${days}일 ${hours}시간`
  if (hours > 0) return `${hours}시간 ${minutes}분`
  if (minutes > 0) return `${minutes}분 ${secs}초`
  return `${secs}초`
}

function formatLongDuration(seconds) {
  const total = Math.max(0, Math.floor(seconds))
  const months = Math.floor(total / (30 * DAY))
  const days = Math.floor((total % (30 * DAY)) / DAY)
  const hours = Math.floor((total % DAY) / HOUR)
  const minutes = Math.floor((total % HOUR) / MINUTE)

  if (months > 0) return days > 0 ? `${months}개월 ${days}일` : `${months}개월`
  if (days > 0) return hours > 0 ? `${days}일 ${hours}시간` : `${days}일`
  if (hours > 0) return minutes > 0 ? `${hours}시간 ${minutes}분` : `${hours}시간`
  if (minutes > 0) return `${minutes}분`
  return `${total}초`
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
