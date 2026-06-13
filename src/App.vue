<template>
  <div class="rcts-shell">
    <header class="top-header">
      <div class="brand">
        <strong>RCTS</strong>
        <span>그룹 자동 진행 · 커스텀 노선</span>
      </div>
      <div class="clock-box">
        <span>표준시간</span>
        <strong>{{ standardClock }}</strong>
      </div>
    </header>

    <main class="page-body">
      <section v-if="offlineReport" class="offline-card">
        <div>
          <strong>오프라인 반영</strong>
          <span>{{ offlineReport.elapsedText }} · 기본 {{ offlineReport.completedRuns }}회 · 커스텀 {{ offlineReport.customRuns }}회</span>
        </div>
        <button type="button" @click="offlineReport = null">닫기</button>
      </section>

      <section class="group-list" aria-label="교통 그룹별 자동 진행 슬롯">
        <article
          v-for="group in groups"
          :key="group.id"
          class="group-card"
          :class="{ locked: !isGroupUnlocked(group), master: isGroupMaster(group) }"
        >
          <header class="group-header">
            <div>
              <h2>{{ group.name }}그룹</h2>
              <p>{{ groupSubtitle(group) }}</p>
            </div>
            <div class="group-state">
              <strong>{{ groupTotal(group) }}/100회</strong>
              <span>{{ groupStateLabel(group) }}</span>
            </div>
          </header>

          <div class="slot-list">
            <section
              v-for="stage in groupStages(group.id)"
              :key="stage.id"
              class="slot-card"
              :class="{
                locked: !stage.unlocked,
                running: stage.phase === 'running',
                waiting: stage.phase === 'waiting',
                auto: stage.runs >= SUB_STAGE_UNLOCK_RUNS,
                master: isGroupMaster(group),
              }"
            >
              <div class="slot-title">
                <span class="slot-order">{{ stage.localOrder }}</span>
                <div>
                  <h3>{{ stage.name }}</h3>
                  <p>{{ stageDurationLabel(stage) }}</p>
                </div>
              </div>

              <div class="slot-timer">
                <strong>{{ timerText(stage) }}</strong>
              </div>

              <div class="slot-side">
                <span>{{ stageStateLabel(stage) }}</span>
              </div>
            </section>
          </div>

          <section v-if="isGroupMaster(group)" class="custom-area">
            <header class="custom-head">
              <strong>{{ group.name }} 커스텀</strong>
              <span>{{ customSummary(group) }}</span>
            </header>

            <form v-if="!customRoute(group.id).created" class="custom-form" @submit.prevent="createCustomRoute(group.id)">
              <label>
                <span>노선명</span>
                <input v-model.trim="customDrafts[group.id].routeName" type="text" placeholder="예: 수원역 순환선" maxlength="24" />
              </label>
              <label>
                <span>왕복시간</span>
                <div class="time-inputs">
                  <input v-model.number="customDrafts[group.id].roundTripDays" type="number" min="0" max="365" inputmode="numeric" />
                  <em>일</em>
                  <input v-model.number="customDrafts[group.id].roundTripHours" type="number" min="0" max="23" inputmode="numeric" />
                  <em>시간</em>
                  <input v-model.number="customDrafts[group.id].roundTripMinutes" type="number" min="0" max="59" inputmode="numeric" />
                  <em>분</em>
                </div>
              </label>
              <label>
                <span>배차간격</span>
                <div class="time-inputs short">
                  <input v-model.number="customDrafts[group.id].headwayMinutes" type="number" min="1" max="1440" inputmode="numeric" />
                  <em>분</em>
                </div>
              </label>

              <div v-if="group.id === 'bus' && isStageUnlocked('commuter_charter')" class="timetable-note">
                전세통근 개방됨 · 표준시간 시간표형 커스텀 준비
                <small>첫차 06:00 · 막차 23:00 · 출퇴근/심야/주말 배차는 다음 설계에서 확장</small>
              </div>

              <button type="submit">커스텀 노선 등록</button>
            </form>

            <div v-else class="custom-slot" :class="{ complete: customRoute(group.id).runs >= CUSTOM_MASTER_RUNS }">
              <div class="custom-title">
                <h3>{{ customRoute(group.id).routeName }}</h3>
                <p>왕복 {{ formatLongDuration(customRoute(group.id).roundTripSeconds) }} · 배차 {{ formatLongDuration(customRoute(group.id).dispatchIntervalSeconds) }}</p>
              </div>
              <div class="custom-timer">
                <strong>{{ customTimerText(group.id) }}</strong>
                <span>운행차량 {{ customRoute(group.id).activeVehicles.length }}대</span>
              </div>
              <div class="custom-side">
                <strong>{{ customRoute(group.id).runs }}/100</strong>
                <span>{{ customRoute(group.id).runs >= CUSTOM_MASTER_RUNS ? '마스터' : '커스텀 운행중' }}</span>
              </div>

              <p v-if="customRoute(group.id).pendingUpdate" class="pending-update">
                수정 예약 · {{ formatApplyDate(customRoute(group.id).pendingUpdate.applyAt) }} 적용
              </p>

              <div v-if="customRoute(group.id).activeVehicles.length" class="vehicle-strip">
                <span
                  v-for="vehicle in customRoute(group.id).activeVehicles.slice(0, 4)"
                  :key="vehicle.id"
                >
                  {{ vehicle.label }} · {{ formatDuration(vehicle.remainingSeconds) }}
                </span>
                <span v-if="customRoute(group.id).activeVehicles.length > 4">
                  +{{ customRoute(group.id).activeVehicles.length - 4 }}대
                </span>
              </div>
              <p v-else class="vehicle-empty">배차 대기중 · 배차간격에 따라 차량이 생성됩니다</p>
            </div>

            <form v-if="customRoute(group.id).created && customRoute(group.id).runs < CUSTOM_MASTER_RUNS" class="custom-form custom-edit-form" @submit.prevent="reserveCustomRouteUpdate(group.id)">
              <label>
                <span>다음날 수정 노선명</span>
                <input v-model.trim="customDrafts[group.id].routeName" type="text" :placeholder="customRoute(group.id).routeName" maxlength="24" />
              </label>
              <label>
                <span>다음날 왕복시간</span>
                <div class="time-inputs">
                  <input v-model.number="customDrafts[group.id].roundTripDays" type="number" min="0" max="365" inputmode="numeric" />
                  <em>일</em>
                  <input v-model.number="customDrafts[group.id].roundTripHours" type="number" min="0" max="23" inputmode="numeric" />
                  <em>시간</em>
                  <input v-model.number="customDrafts[group.id].roundTripMinutes" type="number" min="0" max="59" inputmode="numeric" />
                  <em>분</em>
                </div>
              </label>
              <label>
                <span>다음날 배차간격</span>
                <div class="time-inputs short">
                  <input v-model.number="customDrafts[group.id].headwayMinutes" type="number" min="1" max="1440" inputmode="numeric" />
                  <em>분</em>
                </div>
              </label>
              <button type="submit">다음날 적용 예약</button>
            </form>
          </section>
        </article>
      </section>
    </main>
  </div>
</template>

<script setup>
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

function addLog(text) {
  logs.value = [
    { id: cryptoRandomId(), time: formatLogTime(new Date()), text },
    ...logs.value,
  ].slice(0, 20)
}

function getSavePayload() {
  return {
    savedAt: new Date().toISOString(),
    standardTime: standardNow.value.toISOString(),
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

  if (Array.isArray(payload.logs)) logs.value = payload.logs.slice(0, 20)

  const savedAtIso = payload.savedAt ?? record.savedAt
  if (savedAtIso) {
    const savedAt = new Date(savedAtIso)
    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - savedAt.getTime()) / SECOND))
    applyOfflineProgress(elapsedSeconds, savedAt)
  }

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
</script>

<style>
:root {
  color-scheme: dark;
  --bg: #07111f;
  --panel: rgba(15, 28, 48, 0.94);
  --panel-soft: rgba(15, 28, 48, 0.62);
  --line: rgba(148, 163, 184, 0.18);
  --text: #e8f1ff;
  --muted: #92a4bd;
  --blue: #38bdf8;
  --green: #22c55e;
  --yellow: #f59e0b;
}

* { box-sizing: border-box; }
html, body, #app { min-height: 100%; margin: 0; }
html { overflow-y: scroll; scrollbar-width: none; -ms-overflow-style: none; }
body {
  font-family: Inter, Pretendard, Apple SD Gothic Neo, Noto Sans KR, system-ui, sans-serif;
  background: radial-gradient(circle at top left, rgba(56, 189, 248, 0.16), transparent 32%), var(--bg);
  color: var(--text);
  overflow-x: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
html::-webkit-scrollbar,
body::-webkit-scrollbar,
#app::-webkit-scrollbar,
.rcts-shell::-webkit-scrollbar { width: 0; height: 0; display: none; }
button, input { font-family: inherit; }

.rcts-shell { min-height: 100vh; overflow: visible; }
.top-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  padding: 10px clamp(12px, 3vw, 24px);
  background: rgba(6, 15, 28, 0.92);
  border-bottom: 1px solid var(--line);
  backdrop-filter: blur(18px);
}
.brand { display: flex; align-items: baseline; gap: 8px; min-width: 0; }
.brand strong { font-size: 22px; letter-spacing: 0.08em; color: var(--blue); }
.brand span { color: var(--muted); font-size: 12px; white-space: nowrap; }
.clock-box { display: grid; justify-items: end; gap: 1px; min-width: max-content; }
.clock-box span { color: var(--muted); font-size: 10px; }
.clock-box strong { color: var(--blue); font-size: 14px; font-variant-numeric: tabular-nums; }

.page-body {
  width: min(980px, calc(100% - 16px));
  margin: 0 auto;
  padding: 70px 0 28px;
  display: grid;
  gap: 8px;
}
.offline-card,
.group-card,
.slot-card,
.custom-area,
.custom-slot {
  border: 1px solid var(--line);
  background: var(--panel);
  border-radius: 14px;
}
.offline-card {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
  padding: 10px 12px;
  border-color: rgba(56, 189, 248, 0.42);
}
.offline-card div { display: grid; gap: 2px; }
.offline-card strong { color: var(--blue); font-size: 13px; }
.offline-card span { color: var(--muted); font-size: 12px; }
.offline-card button,
.custom-form button {
  border: 0;
  border-radius: 999px;
  padding: 7px 10px;
  background: rgba(56, 189, 248, 0.22);
  color: var(--text);
  font-weight: 900;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
}

.group-list { display: grid; gap: 10px; }
.group-card { padding: 9px; display: grid; gap: 8px; }
.group-card.locked { opacity: 0.54; }
.group-card.master { border-color: rgba(34, 197, 94, 0.48); }
.group-header {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
  padding: 0 2px;
}
.group-header h2 { margin: 0; font-size: 15px; line-height: 1.1; }
.group-header p { margin: 3px 0 0; color: var(--muted); font-size: 11px; }
.group-state { display: grid; justify-items: end; gap: 2px; min-width: max-content; }
.group-state strong { color: var(--blue); font-size: 15px; font-variant-numeric: tabular-nums; }
.group-state span { color: var(--muted); font-size: 10px; }

.slot-list { display: grid; gap: 6px; }
.slot-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(118px, 190px) minmax(74px, 0.72fr);
  gap: 8px;
  align-items: center;
  min-height: 52px;
  padding: 7px 9px;
  background: var(--panel-soft);
}
.slot-card.locked { opacity: 0.45; }
.slot-card.running { border-color: rgba(56, 189, 248, 0.46); }
.slot-card.waiting { border-color: rgba(245, 158, 11, 0.36); }
.slot-card.auto { border-color: rgba(34, 197, 94, 0.36); }
.slot-card.master { border-color: rgba(34, 197, 94, 0.5); }
.slot-title { display: flex; gap: 8px; align-items: center; min-width: 0; }
.slot-order {
  width: 23px;
  height: 23px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: rgba(56, 189, 248, 0.14);
  color: var(--blue);
  font-size: 10px;
  font-weight: 900;
  flex: 0 0 auto;
}
h3 { margin: 0; font-size: 13px; line-height: 1.15; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
p { margin: 1px 0 0; color: var(--muted); font-size: 10px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.slot-timer { display: grid; place-items: center; min-width: 0; text-align: center; }
.slot-timer strong {
  color: var(--blue);
  font-size: clamp(20px, 3.4vw, 28px);
  line-height: 1;
  font-weight: 950;
  letter-spacing: -0.045em;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.slot-side { display: grid; justify-items: end; min-width: 0; }
.slot-side span {
  color: var(--muted);
  font-size: 10px;
  line-height: 1.1;
  text-align: right;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.custom-area {
  display: grid;
  gap: 8px;
  padding: 9px;
  border-color: rgba(34, 197, 94, 0.28);
  background: rgba(34, 197, 94, 0.055);
}
.custom-head {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
}
.custom-head strong { color: #86efac; font-size: 13px; }
.custom-head span { color: var(--muted); font-size: 10px; text-align: right; }
.custom-form {
  display: grid;
  grid-template-columns: minmax(130px, 1.1fr) minmax(160px, 1.5fr) minmax(90px, 0.7fr) auto;
  gap: 8px;
  align-items: end;
}
.custom-form label { display: grid; gap: 4px; color: var(--muted); font-size: 10px; }
.custom-form input {
  min-width: 0;
  width: 100%;
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 8px 9px;
  background: rgba(6, 15, 28, 0.72);
  color: var(--text);
  font-weight: 800;
}
.time-inputs { display: grid; grid-template-columns: 1fr auto 1fr auto 1fr auto; gap: 4px; align-items: center; }
.time-inputs.short { grid-template-columns: 1fr auto; }
.time-inputs em { color: var(--muted); font-style: normal; font-size: 10px; }
.timetable-note {
  grid-column: 1 / -1;
  padding: 7px 9px;
  border: 1px solid rgba(56, 189, 248, 0.24);
  border-radius: 10px;
  color: var(--blue);
  font-size: 11px;
  font-weight: 900;
  background: rgba(56, 189, 248, 0.07);
}
.timetable-note small { display: block; margin-top: 3px; color: var(--muted); font-weight: 700; }
.custom-slot {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(118px, 190px) minmax(84px, 0.6fr);
  gap: 8px;
  align-items: center;
  padding: 8px 9px;
  background: rgba(15, 28, 48, 0.74);
}
.custom-slot.complete { border-color: rgba(34, 197, 94, 0.58); }
.custom-title { min-width: 0; }
.custom-timer { display: grid; justify-items: center; gap: 3px; text-align: center; }
.custom-timer strong {
  color: #86efac;
  font-size: clamp(18px, 3vw, 24px);
  line-height: 1;
  font-weight: 950;
  font-variant-numeric: tabular-nums;
}
.custom-timer span,
.custom-side span { color: var(--muted); font-size: 10px; }
.custom-side { display: grid; justify-items: end; gap: 2px; }
.custom-side strong { color: #86efac; font-size: 14px; font-variant-numeric: tabular-nums; }
.pending-update {
  grid-column: 1 / -1;
  margin: 0;
  padding: 5px 7px;
  border-radius: 999px;
  background: rgba(245, 158, 11, 0.12);
  color: #fbbf24;
  font-size: 10px;
  font-weight: 900;
  width: fit-content;
}
.custom-edit-form {
  border-top: 1px solid var(--line);
  padding-top: 8px;
}

.vehicle-strip,
.vehicle-empty {
  grid-column: 1 / -1;
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
  margin: 0;
}
.vehicle-strip span,
.vehicle-empty {
  padding: 5px 7px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.12);
  color: var(--muted);
  font-size: 10px;
  font-weight: 800;
}

@media (max-width: 760px) {
  .custom-form { grid-template-columns: 1fr; }
}

@media (max-width: 640px) {
  .top-header { padding: 9px 10px; }
  .brand span { display: none; }
  .page-body { width: min(100% - 10px, 980px); padding-top: 64px; }
  .group-card { padding: 7px; gap: 7px; }
  .group-header h2 { font-size: 14px; }
  .group-header p { font-size: 10px; }
  .group-state strong { font-size: 13px; }
  .slot-card {
    grid-template-columns: minmax(76px, 1fr) minmax(106px, 1.02fr) minmax(62px, 0.72fr);
    gap: 5px;
    min-height: 50px;
    padding: 6px 7px;
  }
  .slot-order { width: 21px; height: 21px; font-size: 9px; border-radius: 7px; }
  h3 { font-size: 12px; }
  p { font-size: 9px; }
  .slot-timer strong { font-size: clamp(18px, 6.5vw, 25px); }
  .slot-side span { font-size: 9px; }
  .custom-head { align-items: start; }
  .custom-head span { max-width: 48%; }
  .custom-slot {
    grid-template-columns: minmax(86px, 1fr) minmax(100px, 1fr) minmax(58px, 0.6fr);
    gap: 5px;
    padding: 7px;
  }
  .custom-timer strong { font-size: clamp(17px, 6vw, 23px); }
}
</style>
