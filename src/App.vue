<template>
  <div class="rcts-shell">
    <header class="top-header">
      <div class="brand">
        <strong>RCTS</strong>
        <span>교통 슬롯 진행</span>
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
          <span>{{ offlineReport.elapsedText }} · {{ offlineReport.completedRuns }}회 진행</span>
        </div>
        <button type="button" @click="offlineReport = null">닫기</button>
      </section>

      <section class="slot-list" aria-label="교통 운행 슬롯 목록">
        <article
          v-for="stage in stages"
          :key="stage.id"
          class="slot-card"
          :class="{
            locked: !stage.unlocked,
            running: stage.status === 'running',
            waiting: stage.status === 'waiting',
            auto: isAutoStage(stage),
          }"
        >
          <div class="slot-title">
            <span class="slot-order">{{ stage.order }}</span>
            <div>
              <h2>{{ stage.name }}</h2>
              <p>{{ stageDurationLabel(stage) }}</p>
            </div>
          </div>

          <div class="slot-timer">
            <strong>{{ timerText(stage) }}</strong>
          </div>

          <div class="slot-side">
            <span class="slot-state">{{ stageStateLabel(stage) }}</span>
          </div>
        </article>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { loadRctsAutoSave, saveRctsAutoSave } from './storage/rctsSaveStorage.js'

const TARGET_RUNS = 10
const BEFORE_TARGET_WAIT_SECONDS = 30 * 60
const AFTER_TARGET_WAIT_SECONDS = 10 * 60
const AUTO_SAVE_INTERVAL_MS = 10 * 60 * 1000
const SECOND_MS = 1000
const MINUTE = 60
const HOUR = 3600
const DAY = 86400

const stageDefinitions = [
  { id: 'village_bus', order: 1, name: '마을버스', durationSeconds: 30 * MINUTE },
  { id: 'city_bus', order: 2, name: '시내버스', durationSeconds: 1 * HOUR },
  { id: 'express_bus', order: 3, name: '광역버스', durationSeconds: 2 * HOUR },
  { id: 'commuter_charter', order: 4, name: '전세통근', durationSeconds: 8 * HOUR, timeWindow: 'commuter' },
  { id: 'charter_bus', order: 5, name: '전세버스', durationSeconds: 3 * DAY },
  { id: 'tram', order: 6, name: '트램', durationSeconds: 1 * HOUR },
  { id: 'light_rail', order: 7, name: '경전철', durationSeconds: 1 * HOUR },
  { id: 'metro_rail', order: 8, name: '광역전철', durationSeconds: 2 * HOUR },
  { id: 'general_train', order: 9, name: '일반열차', durationSeconds: 4 * HOUR },
  { id: 'domestic_hsr', order: 10, name: '국내고속열차', durationSeconds: 2 * HOUR },
  { id: 'international_hsr', order: 11, name: '국제고속열차', durationSeconds: 6 * HOUR },
  { id: 'domestic_flight', order: 12, name: '국내선 항공', durationSeconds: 2 * HOUR },
  { id: 'international_flight', order: 13, name: '국제선 항공', durationSeconds: 10 * HOUR },
  { id: 'domestic_ship', order: 14, name: '국내선 선박', durationSeconds: 1 * DAY },
  { id: 'short_international_ship', order: 15, name: '국제선 단거리 선박', durationSeconds: 15 * DAY },
  { id: 'long_international_ship', order: 16, name: '국제선 장거리 선박', durationSeconds: 30 * DAY },
  { id: 'space_station_shuttle', order: 17, name: '우주정거장 셔틀', durationSeconds: 3 * HOUR },
  { id: 'stellar_shuttle', order: 18, name: '성계 셔틀', durationSeconds: 60 * DAY },
  { id: 'galaxy_shuttle', order: 19, name: '은하 셔틀', durationSeconds: 180 * DAY },
]

const standardNow = ref(new Date())
const offlineReport = ref(null)
let secondTimer = null
let autoSaveTimer = null
let standardTimer = null
let isSaving = false

function createInitialStages() {
  return stageDefinitions.map((stage, index) => ({
    ...stage,
    unlocked: index === 0,
    status: index === 0 ? 'running' : 'locked',
    runs: 0,
    remainingSeconds: stage.durationSeconds,
  }))
}

const stages = reactive(createInitialStages())
const logs = ref([])

const standardClock = computed(() => formatStandardClock(standardNow.value))

function isAutoStage(stage) {
  return stage.unlocked && stage.runs >= TARGET_RUNS
}

function getWaitSeconds(stage) {
  return isAutoStage(stage) ? AFTER_TARGET_WAIT_SECONDS : BEFORE_TARGET_WAIT_SECONDS
}

function getNextStage(stage) {
  return stages.find((item) => item.order === stage.order + 1)
}

function unlockNextStage(stage) {
  const next = getNextStage(stage)
  if (!next || next.unlocked) return

  next.unlocked = true
  next.status = 'running'
  next.runs = 0
  next.remainingSeconds = next.durationSeconds
  addLog(`${next.name} 자동 개방`)
}

function tickGame() {
  const now = new Date()
  const prev = new Date(now.getTime() - SECOND_MS)
  standardNow.value = now

  stages.forEach((stage) => {
    if (!stage.unlocked) return
    tickStage(stage, 1, prev, now)
  })
}

function tickStage(stage, elapsedSeconds, startDate, endDate) {
  if (elapsedSeconds <= 0) return

  if (stage.status === 'waiting') {
    stage.remainingSeconds = Math.max(0, normalizeRemaining(stage, getWaitSeconds(stage)) - elapsedSeconds)
    if (stage.remainingSeconds <= 0) {
      stage.status = 'running'
      stage.remainingSeconds = stage.durationSeconds
    }
    return
  }

  if (stage.status !== 'running') return

  const effectiveElapsed = stage.timeWindow === 'commuter'
    ? countCommuterOperableSeconds(startDate, endDate)
    : elapsedSeconds

  if (effectiveElapsed <= 0) return

  stage.remainingSeconds = Math.max(0, normalizeRemaining(stage, stage.durationSeconds) - effectiveElapsed)
  if (stage.remainingSeconds <= 0) completeStageRun(stage)
}

function completeStageRun(stage) {
  stage.runs += 1

  if (stage.runs === TARGET_RUNS) {
    unlockNextStage(stage)
    addLog(`${stage.name} 10회 완료`)
  }

  stage.status = 'waiting'
  stage.remainingSeconds = getWaitSeconds(stage)
}

function applyOfflineProgress(elapsedSeconds, savedAtDate) {
  if (elapsedSeconds <= 0) return

  let cursor = new Date(savedAtDate)
  let restSeconds = elapsedSeconds
  let completedRuns = 0
  let guard = 0

  while (restSeconds > 0 && guard < 50000) {
    guard += 1
    const activeStages = stages.filter((stage) => stage.unlocked && (stage.status === 'running' || stage.status === 'waiting'))
    if (activeStages.length === 0) break

    const nextSeconds = Math.max(1, Math.min(restSeconds, ...activeStages.map((stage) => secondsToNextEvent(stage, cursor))))
    const nextDate = new Date(cursor.getTime() + nextSeconds * SECOND_MS)

    activeStages.forEach((stage) => {
      const beforeRuns = stage.runs
      tickStage(stage, nextSeconds, cursor, nextDate)
      completedRuns += Math.max(0, stage.runs - beforeRuns)
    })

    restSeconds -= nextSeconds
    cursor = nextDate
  }

  standardNow.value = new Date(savedAtDate.getTime() + elapsedSeconds * SECOND_MS)

  if (completedRuns > 0) {
    offlineReport.value = {
      elapsedText: formatLongDuration(elapsedSeconds),
      completedRuns,
    }
    addLog(`오프라인 진행 ${completedRuns}회 반영`)
  }
}

function secondsToNextEvent(stage, fromDate) {
  if (stage.status === 'waiting') return Math.max(1, normalizeRemaining(stage, getWaitSeconds(stage)))
  if (stage.timeWindow === 'commuter') return actualSecondsForCommuterWork(fromDate, normalizeRemaining(stage, stage.durationSeconds))
  return Math.max(1, normalizeRemaining(stage, stage.durationSeconds))
}

function actualSecondsForCommuterWork(fromDate, requiredOperableSeconds) {
  if (requiredOperableSeconds <= 0) return 1

  let worked = 0
  let actual = 0
  const cursor = new Date(fromDate)

  while (worked < requiredOperableSeconds && actual < 370 * DAY) {
    const nextBoundary = getNextCommuterBoundary(cursor)
    const stepSeconds = Math.max(1, Math.floor((nextBoundary.getTime() - cursor.getTime()) / SECOND_MS))
    const nextDate = new Date(cursor.getTime() + stepSeconds * SECOND_MS)
    const operable = countCommuterOperableSeconds(cursor, nextDate)

    if (operable > 0) {
      const need = requiredOperableSeconds - worked
      if (operable >= need) return actual + need
      worked += operable
    }

    actual += stepSeconds
    cursor.setTime(nextDate.getTime())
  }

  return Math.max(1, actual)
}

function getNextCommuterBoundary(date) {
  const candidates = []
  for (let offset = 0; offset <= 8; offset += 1) {
    const base = new Date(date)
    base.setDate(date.getDate() + offset)
    base.setHours(0, 0, 0, 0)
    candidates.push(withHour(base, 6), withHour(base, 10), withHour(base, 17), withHour(base, 21))
  }
  return candidates.find((candidate) => candidate > date) ?? new Date(date.getTime() + HOUR * SECOND_MS)
}

function normalizeRemaining(stage, fallbackSeconds) {
  if (!Number.isFinite(stage.remainingSeconds) || stage.remainingSeconds <= 0) return fallbackSeconds
  return Math.floor(stage.remainingSeconds)
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
  return Math.max(0, Math.floor((end - start) / SECOND_MS))
}

function stageStateLabel(stage) {
  if (!stage.unlocked) return '대기'
  if (isAutoStage(stage)) return stage.status === 'waiting' ? '자동 · 대기' : '자동 · 운행중'
  if (stage.status === 'waiting') return `${stage.runs}/${TARGET_RUNS}회 · 대기`
  return `${stage.runs}/${TARGET_RUNS}회 · 운행중`
}

function timerText(stage) {
  if (!stage.unlocked) return '대기'
  if (stage.status === 'waiting') return formatDuration(stage.remainingSeconds)
  if (stage.timeWindow === 'commuter' && !isCommuterWindow(standardNow.value)) return `휴식 ${formatDuration(stage.remainingSeconds)}`
  return formatDuration(stage.remainingSeconds)
}

function stageDurationLabel(stage) {
  if (!stage.unlocked) return '이전 슬롯 자동 완료 후 개방'
  if (stage.timeWindow === 'commuter') return '1회 8시간 · 월~금 06~10 / 17~21'
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
      status: stage.status,
      runs: stage.runs,
      remainingSeconds: stage.remainingSeconds,
    })),
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
  if (!record?.payload) return

  const payload = record.payload
  if (Array.isArray(payload.stages)) {
    payload.stages.forEach((savedStage) => {
      const stage = stages.find((item) => item.id === savedStage.id)
      if (!stage) return
      stage.unlocked = Boolean(savedStage.unlocked)
      stage.status = savedStage.status === 'waiting' ? 'waiting' : savedStage.status === 'running' ? 'running' : stage.unlocked ? 'running' : 'locked'
      stage.runs = Number(savedStage.runs) || 0
      stage.remainingSeconds = Number(savedStage.remainingSeconds) || (stage.status === 'waiting' ? getWaitSeconds(stage) : stage.durationSeconds)
    })
  }

  if (Array.isArray(payload.logs)) logs.value = payload.logs.slice(0, 20)

  const first = stages[0]
  if (first && !first.unlocked) {
    first.unlocked = true
    first.status = 'running'
    first.remainingSeconds = first.durationSeconds
  }

  const savedAtIso = payload.savedAt ?? record.savedAt
  if (savedAtIso) {
    const savedAt = new Date(savedAtIso)
    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - savedAt.getTime()) / SECOND_MS))
    applyOfflineProgress(elapsedSeconds, savedAt)
  }
}

function scheduleTimers() {
  secondTimer = window.setInterval(tickGame, SECOND_MS)
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
  --line: rgba(148, 163, 184, 0.18);
  --text: #e8f1ff;
  --muted: #92a4bd;
  --blue: #38bdf8;
  --green: #22c55e;
}

* { box-sizing: border-box; }
html, body, #app {
  min-height: 100%;
  margin: 0;
}
html {
  overflow-y: scroll;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
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
.rcts-shell::-webkit-scrollbar {
  width: 0;
  height: 0;
  display: none;
}
button { font-family: inherit; }

.rcts-shell {
  min-height: 100vh;
  overflow: visible;
}
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
  padding: 72px 0 28px;
  display: grid;
  gap: 8px;
}
.offline-card,
.slot-card {
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
.offline-card button {
  border: 0;
  border-radius: 999px;
  padding: 7px 10px;
  background: rgba(148, 163, 184, 0.18);
  color: var(--text);
  font-weight: 800;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
}

.slot-list { display: grid; gap: 8px; }
.slot-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(118px, 190px) minmax(84px, 1fr);
  gap: 8px;
  align-items: center;
  min-height: 56px;
  padding: 8px 10px;
}
.slot-card.locked { opacity: 0.42; }
.slot-card.running { border-color: rgba(56, 189, 248, 0.46); }
.slot-card.waiting { border-color: rgba(148, 163, 184, 0.26); }
.slot-card.auto { border-color: rgba(34, 197, 94, 0.42); }
.slot-title { display: flex; gap: 8px; align-items: center; min-width: 0; }
.slot-order {
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  border-radius: 9px;
  background: rgba(56, 189, 248, 0.14);
  color: var(--blue);
  font-size: 11px;
  font-weight: 900;
  flex: 0 0 auto;
}
h2 { margin: 0; font-size: 14px; line-height: 1.15; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
p { margin: 1px 0 0; color: var(--muted); font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.slot-timer {
  display: grid;
  place-items: center;
  min-width: 0;
  text-align: center;
}
.slot-timer strong {
  color: var(--blue);
  font-size: clamp(19px, 3.4vw, 28px);
  line-height: 1;
  font-weight: 950;
  letter-spacing: -0.04em;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.slot-side {
  display: grid;
  justify-items: end;
  gap: 4px;
  min-width: 0;
}
.slot-state {
  color: var(--muted);
  font-size: 11px;
  line-height: 1.1;
  text-align: right;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

@media (max-width: 640px) {
  .top-header { padding: 9px 10px; }
  .brand span { display: none; }
  .page-body { width: min(100% - 10px, 980px); padding-top: 66px; }
  .slot-card {
    grid-template-columns: minmax(78px, 1fr) minmax(98px, 1.05fr) minmax(70px, 0.9fr);
    gap: 5px;
    min-height: 54px;
    padding: 7px 8px;
  }
  .slot-order { width: 22px; height: 22px; font-size: 10px; border-radius: 8px; }
  h2 { font-size: 13px; }
  p { font-size: 10px; }
  .slot-timer strong { font-size: clamp(18px, 6.2vw, 25px); }
  .slot-state { font-size: 10px; }
}
</style>
