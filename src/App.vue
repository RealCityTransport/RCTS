<template>
  <div class="rcts-shell">
    <header class="top-header">
      <div class="brand">
        <strong>RCTS</strong>
        <span>자동 교통 슬롯</span>
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
          <span>{{ offlineReport.elapsedText }} · 완료 {{ offlineReport.completedRuns }}회</span>
        </div>
        <button type="button" @click="offlineReport = null">닫기</button>
      </section>

      <section class="custom-area" aria-label="커스텀 영역 준비 현황">
        <article v-for="group in groupSummaries" :key="group.id" class="custom-pill" :class="{ ready: group.count >= CUSTOM_UNLOCK_RUNS }">
          <strong>{{ group.name }}</strong>
          <span>{{ Math.min(group.count, CUSTOM_UNLOCK_RUNS) }}/{{ CUSTOM_UNLOCK_RUNS }}회</span>
          <em>{{ group.count >= CUSTOM_UNLOCK_RUNS ? '커스텀 영역 준비중' : '커스텀 준비중' }}</em>
        </article>
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
            automated: stage.runs >= STAGE_UNLOCK_RUNS,
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

const STAGE_UNLOCK_RUNS = 10
const CUSTOM_UNLOCK_RUNS = 100
const BEFORE_UNLOCK_WAIT_SECONDS = 30 * 60
const AFTER_UNLOCK_WAIT_SECONDS = 10 * 60
const AUTO_SAVE_INTERVAL_MS = 10 * 60 * 1000
const SECOND = 1000
const MINUTE = 60
const HOUR = 3600
const DAY = 86400

const groupDefinitions = [
  { id: 'bus', name: '버스' },
  { id: 'rail', name: '철도' },
  { id: 'air', name: '항공' },
  { id: 'ship', name: '선박' },
  { id: 'space', name: '우주선' },
]

const stageDefinitions = [
  { id: 'village_bus', groupId: 'bus', order: 1, name: '마을버스', durationSeconds: 30 * MINUTE },
  { id: 'city_bus', groupId: 'bus', order: 2, name: '시내버스', durationSeconds: 1 * HOUR },
  { id: 'express_bus', groupId: 'bus', order: 3, name: '광역버스', durationSeconds: 2 * HOUR },
  { id: 'commuter_charter', groupId: 'bus', order: 4, name: '전세통근', durationSeconds: 8 * HOUR, timeWindow: 'commuter' },
  { id: 'charter_bus', groupId: 'bus', order: 5, name: '전세버스', durationSeconds: 3 * DAY },
  { id: 'tram', groupId: 'rail', order: 6, name: '트램', durationSeconds: 1 * HOUR },
  { id: 'light_rail', groupId: 'rail', order: 7, name: '경전철', durationSeconds: 1 * HOUR },
  { id: 'metro_rail', groupId: 'rail', order: 8, name: '광역전철', durationSeconds: 2 * HOUR },
  { id: 'general_train', groupId: 'rail', order: 9, name: '일반열차', durationSeconds: 4 * HOUR },
  { id: 'domestic_hsr', groupId: 'rail', order: 10, name: '국내고속열차', durationSeconds: 2 * HOUR },
  { id: 'international_hsr', groupId: 'rail', order: 11, name: '국제고속열차', durationSeconds: 6 * HOUR },
  { id: 'domestic_flight', groupId: 'air', order: 12, name: '국내선 항공', durationSeconds: 2 * HOUR },
  { id: 'international_flight', groupId: 'air', order: 13, name: '국제선 항공', durationSeconds: 10 * HOUR },
  { id: 'domestic_ship', groupId: 'ship', order: 14, name: '국내선 선박', durationSeconds: 1 * DAY },
  { id: 'short_international_ship', groupId: 'ship', order: 15, name: '국제선 단거리 선박', durationSeconds: 15 * DAY },
  { id: 'long_international_ship', groupId: 'ship', order: 16, name: '국제선 장거리 선박', durationSeconds: 30 * DAY },
  { id: 'space_station_shuttle', groupId: 'space', order: 17, name: '우주정거장 셔틀', durationSeconds: 3 * HOUR },
  { id: 'stellar_shuttle', groupId: 'space', order: 18, name: '성계 셔틀', durationSeconds: 60 * DAY },
  { id: 'galaxy_shuttle', groupId: 'space', order: 19, name: '은하 셔틀', durationSeconds: 180 * DAY },
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

const groupSummaries = computed(() => groupDefinitions.map((group) => ({
  ...group,
  count: stages
    .filter((stage) => stage.groupId === group.id)
    .reduce((sum, stage) => sum + stage.runs, 0),
})))

function getNextStage(stage) {
  return stages.find((item) => item.order === stage.order + 1)
}

function waitSecondsForStage(stage) {
  return stage.runs >= STAGE_UNLOCK_RUNS ? AFTER_UNLOCK_WAIT_SECONDS : BEFORE_UNLOCK_WAIT_SECONDS
}

function tickGame() {
  const now = new Date()
  const prev = new Date(now.getTime() - SECOND)
  standardNow.value = now

  stages.forEach((stage) => {
    if (!stage.unlocked || stage.status === 'locked') return

    const tickAmount = getTickAmountForStage(stage, now, prev)
    if (tickAmount <= 0) return

    stage.remainingSeconds = Math.max(0, normalizeRemaining(stage) - tickAmount)

    if (stage.remainingSeconds <= 0) {
      if (stage.status === 'running') completeStageRun(stage)
      else if (stage.status === 'waiting') startNextRun(stage)
    }
  })
}

function completeStageRun(stage) {
  stage.runs += 1

  if (stage.runs === STAGE_UNLOCK_RUNS) {
    openNextStageAutomatically(stage)
  }

  stage.status = 'waiting'
  stage.remainingSeconds = waitSecondsForStage(stage)
}

function startNextRun(stage) {
  stage.status = 'running'
  stage.remainingSeconds = stage.durationSeconds
}

function openNextStageAutomatically(stage) {
  const next = getNextStage(stage)
  if (!next || next.unlocked) return

  next.unlocked = true
  next.status = 'running'
  next.remainingSeconds = next.durationSeconds
  addLog(`${stage.name} 10회 완료 · ${next.name} 자동개방`)
}

function getTickAmountForStage(stage, currentDate, previousDate) {
  if (stage.status !== 'running') return 1
  if (stage.timeWindow === 'commuter') return countCommuterOperableSeconds(previousDate, currentDate)
  return 1
}

function applyOfflineProgress(elapsedSeconds, savedAtDate) {
  if (elapsedSeconds <= 0) return

  const start = savedAtDate
  const end = new Date(start.getTime() + elapsedSeconds * SECOND)
  let completedRuns = 0

  stages.forEach((stage) => {
    if (!stage.unlocked || stage.status === 'locked') return

    let effectiveElapsed = stage.status === 'running' && stage.timeWindow === 'commuter'
      ? countCommuterOperableSeconds(start, end)
      : elapsedSeconds

    let guard = 0
    while (effectiveElapsed > 0 && guard < 5000) {
      guard += 1
      const remaining = normalizeRemaining(stage)

      if (effectiveElapsed < remaining) {
        stage.remainingSeconds = remaining - effectiveElapsed
        effectiveElapsed = 0
        break
      }

      effectiveElapsed -= remaining

      if (stage.status === 'running') {
        stage.runs += 1
        completedRuns += 1
        if (stage.runs === STAGE_UNLOCK_RUNS) openNextStageAutomatically(stage)
        stage.status = 'waiting'
        stage.remainingSeconds = waitSecondsForStage(stage)
      } else if (stage.status === 'waiting') {
        stage.status = 'running'
        stage.remainingSeconds = stage.durationSeconds
      }
    }
  })

  if (completedRuns > 0) {
    offlineReport.value = {
      elapsedText: formatLongDuration(elapsedSeconds),
      completedRuns,
    }
    addLog(`오프라인 진행 ${completedRuns}회 반영`)
  }
}

function normalizeRemaining(stage) {
  if (!Number.isFinite(stage.remainingSeconds) || stage.remainingSeconds <= 0) {
    return stage.status === 'waiting' ? waitSecondsForStage(stage) : stage.durationSeconds
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
  if (stage.runs < STAGE_UNLOCK_RUNS) return `${stage.runs}/${STAGE_UNLOCK_RUNS}회 · ${stage.status === 'waiting' ? '대기중' : '운행중'}`
  return stage.status === 'waiting' ? '자동 · 대기중' : '자동 · 운행중'
}

function timerText(stage) {
  if (!stage.unlocked) return '대기'
  if (stage.status === 'running' && stage.timeWindow === 'commuter' && !isCommuterWindow(standardNow.value)) {
    return `휴식 ${formatDuration(stage.remainingSeconds)}`
  }
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
  if (!record?.payload) {
    stages[0].unlocked = true
    stages[0].status = 'running'
    return
  }

  const payload = record.payload
  if (Array.isArray(payload.stages)) {
    payload.stages.forEach((savedStage) => {
      const stage = stages.find((item) => item.id === savedStage.id)
      if (!stage) return
      stage.unlocked = Boolean(savedStage.unlocked)
      stage.status = savedStage.status === 'waiting' ? 'waiting' : savedStage.status === 'running' ? 'running' : stage.unlocked ? 'running' : 'locked'
      stage.runs = Number(savedStage.runs) || 0
      stage.remainingSeconds = Number(savedStage.remainingSeconds) || normalizeRemaining(stage)
    })
  }

  if (Array.isArray(payload.logs)) logs.value = payload.logs.slice(0, 20)

  if (!stages.some((stage) => stage.unlocked)) {
    stages[0].unlocked = true
    stages[0].status = 'running'
  }

  const savedAtIso = payload.savedAt ?? record.savedAt
  if (savedAtIso) {
    const savedAt = new Date(savedAtIso)
    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - savedAt.getTime()) / SECOND))
    applyOfflineProgress(elapsedSeconds, savedAt)
  }
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
button { font-family: inherit; }

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
  padding: 72px 0 28px;
  display: grid;
  gap: 8px;
}
.offline-card,
.slot-card,
.custom-pill {
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
  padding: 6px 10px;
  background: rgba(148, 163, 184, 0.18);
  color: var(--text);
  font-weight: 800;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
}

.custom-area {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 6px;
}
.custom-pill {
  min-height: 54px;
  padding: 8px 9px;
  display: grid;
  gap: 2px;
}
.custom-pill strong { font-size: 12px; color: var(--text); }
.custom-pill span { font-size: 15px; font-weight: 950; color: var(--blue); font-variant-numeric: tabular-nums; }
.custom-pill em { font-size: 10px; color: var(--muted); font-style: normal; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.custom-pill.ready { border-color: rgba(34, 197, 94, 0.5); }
.custom-pill.ready span { color: var(--green); }

.slot-list { display: grid; gap: 8px; }
.slot-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(118px, 196px) minmax(74px, 1fr);
  gap: 8px;
  align-items: center;
  min-height: 56px;
  padding: 8px 10px;
}
.slot-card.locked { opacity: 0.43; }
.slot-card.running { border-color: rgba(56, 189, 248, 0.46); }
.slot-card.waiting { border-color: rgba(245, 158, 11, 0.34); }
.slot-card.automated { border-color: rgba(34, 197, 94, 0.38); }
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
.slot-timer { display: grid; place-items: center; min-width: 0; text-align: center; }
.slot-timer strong {
  color: var(--blue);
  font-size: clamp(20px, 4vw, 28px);
  line-height: 1;
  font-weight: 950;
  letter-spacing: -0.04em;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.slot-side { display: grid; justify-items: end; gap: 4px; min-width: 0; }
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
  .custom-area { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 5px; }
  .custom-pill { min-height: 48px; padding: 7px 8px; }
  .custom-pill span { font-size: 13px; }
  .slot-card {
    grid-template-columns: minmax(82px, 1fr) minmax(104px, 1.02fr) minmax(66px, 0.88fr);
    gap: 5px;
    min-height: 54px;
    padding: 7px 8px;
  }
  .slot-order { width: 22px; height: 22px; font-size: 10px; border-radius: 8px; }
  h2 { font-size: 13px; }
  p { font-size: 10px; }
  .slot-timer strong { font-size: clamp(19px, 7vw, 26px); }
  .slot-state { font-size: 10px; }
}
</style>
