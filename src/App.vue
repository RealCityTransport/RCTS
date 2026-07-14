<template>
  <div class="facility-page">
    <header class="hero simple-hero">
      <div class="title-block compact title-row">
        <h1>RCTS</h1>
        <time class="standard-clock">{{ standardClockText }}</time>
      </div>
    </header>

    <p v-if="noticeText" class="notice-line">{{ noticeText }}</p>

    <main class="deck" aria-label="시설행정 카드덱">
      <section class="deck-section" v-if="activeCards.length">
        <div class="card-list">
          <article
            v-for="project in activeCards"
            :key="project.id"
            class="project-card"
            :class="project.status"
          >
            <span class="project-title">{{ project.title }}</span>
            <span class="progress-inline">
              <b aria-hidden="true" :style="{ '--progress': `${project.progress}%` }"></b>
              <strong>{{ project.progress }}%</strong>
            </span>
            <span class="time-inline">{{ project.timeLabel }} {{ project.remainingText }}</span>
          </article>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { loadRctsAutoSave, saveRctsAutoSave } from './storage/rctsSaveStorage.js'

const SAVE_SCHEMA_VERSION = 34
const SECOND_MS = 1000
const MINUTE_MS = 60 * SECOND_MS
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS
const TICK_MS = 1000
const AUTO_SAVE_INTERVAL_MS = 60 * SECOND_MS
const MAX_COMPLETED_HISTORY = 80
const MISSION_START_HOUR = 9
const NEXT_TRIGGER_REMAINING_MS = 2 * DAY_MS
const NEXT_APPEAR_MIN_MS = 2 * HOUR_MS
const NEXT_APPEAR_MAX_MS = 36 * HOUR_MS

const cityName = ''
const facilityGroups = ['bus', 'rail', 'air', 'ship']
const facilityTitleByGroup = {
  bus: '버스시설',
  rail: '철도시설',
  air: '항공시설',
  ship: '선박시설',
}

const templates = {
  bus: [
    template('정류장 표지판 정비', 6 * HOUR_MS, 2 * DAY_MS),
    template('정류장 승강장 개선', 2 * DAY_MS, 14 * DAY_MS),
    template('버스전용차로 노면 보수', 3 * DAY_MS, 20 * DAY_MS),
    template('회차지 포장 보수', 7 * DAY_MS, 30 * DAY_MS),
    template('회차지 신설', 30 * DAY_MS, 180 * DAY_MS),
    template('공영차고지 확장', 60 * DAY_MS, 365 * DAY_MS),
  ],
  rail: [
    template('철도역 승강장 안전시설', 90 * DAY_MS, 365 * DAY_MS),
    template('환승통로 확장', 180 * DAY_MS, 720 * DAY_MS),
    template('선로 유지보수', 30 * DAY_MS, 180 * DAY_MS),
    template('차량기지 확장', 365 * DAY_MS, 1080 * DAY_MS),
    template('철도신설', 720 * DAY_MS, 2400 * DAY_MS),
  ],
  air: [
    template('공항 접근도로 개선', 180 * DAY_MS, 720 * DAY_MS),
    template('공항버스 터미널 개선', 120 * DAY_MS, 540 * DAY_MS),
    template('공항 환승센터 건설', 720 * DAY_MS, 1800 * DAY_MS),
    template('여객터미널 기반공사', 1080 * DAY_MS, 2520 * DAY_MS),
    template('화물터미널 기반공사', 720 * DAY_MS, 2160 * DAY_MS),
    template('활주로 지원시설 건설', 720 * DAY_MS, 2520 * DAY_MS),
  ],
  ship: [
    template('선착장 개선', 30 * DAY_MS, 180 * DAY_MS),
    template('여객터미널 확장', 180 * DAY_MS, 720 * DAY_MS),
    template('항만 접속도로 개선', 180 * DAY_MS, 720 * DAY_MS),
    template('항만 물류시설 정비', 90 * DAY_MS, 365 * DAY_MS),
    template('도서 여객선 터미널 개선', 180 * DAY_MS, 900 * DAY_MS),
  ],
}

function template(title, minMs, maxMs) {
  return { title, minMs, maxMs }
}

const now = ref(Date.now())
const noticeText = ref('')
let tickTimer = null
let saveTimer = null
let noticeTimer = null

const state = reactive(createFreshSave())

const standardNowMs = computed(() => state.standardBaseMs + (now.value - state.realBaseMs))
const standardClockText = computed(() => formatStandardClock(standardNowMs.value))

const activeCards = computed(() => state.activeProjects
  .map((project) => decorateActiveProject(project))
  .sort((a, b) => {
    const aRemain = Number(a.sortRemainMs)
    const bRemain = Number(b.sortRemainMs)
    if (aRemain !== bRemain) return aRemain - bRemain
    return (Number(b.createdAtMs) || 0) - (Number(a.createdAtMs) || 0)
  }))

function createFreshSave() {
  const baseMs = Date.now()
  return {
    schemaVersion: SAVE_SCHEMA_VERSION,
    mode: 'facility_admin',
    cityName,
    realBaseMs: baseMs,
    standardBaseMs: baseMs,
    activeProjects: [],
    completedProjects: [],
    nextProjectAtMsByGroup: createEmptyGroupSchedule(),
  }
}

function createEmptyGroupSchedule() {
  return facilityGroups.reduce((result, group) => {
    result[group] = 0
    return result
  }, {})
}

function applyLoadedSave(payload) {
  if (!payload || payload.mode !== 'facility_admin') return false

  const fresh = createFreshSave()
  Object.assign(state, fresh, payload)
  state.mode = 'facility_admin'
  state.schemaVersion = SAVE_SCHEMA_VERSION
  state.activeProjects = normalizeProjectList(payload.activeProjects, 'active')
  state.completedProjects = normalizeProjectList(payload.completedProjects, 'completed')
  state.availableProjects = []
  state.realBaseMs = Number(payload.realBaseMs) || fresh.realBaseMs
  state.standardBaseMs = Number(payload.standardBaseMs) || fresh.standardBaseMs
  state.nextProjectAtMsByGroup = normalizeGroupSchedule(payload.nextProjectAtMsByGroup)
  return true
}

function normalizeProjectList(projects, fallbackStatus) {
  if (!Array.isArray(projects)) return []
  return projects.map((project) => normalizeProject(project, fallbackStatus)).filter(Boolean)
}

function normalizeProject(project, fallbackStatus) {
  if (!project || !project.id) return null
  const group = facilityGroups.includes(project.group) ? project.group : inferGroup(project)
  const templateItem = pickTemplateForProject(group, project.title)
  const startedAtMs = Number(project.startedAtMs) || Number(project.createdAtMs) || state.standardBaseMs
  const durationMs = Number(project.durationMs) || 0
  const status = normalizeStatus(project.status || fallbackStatus, startedAtMs, durationMs)
  const endsAtMs = Number(project.endsAtMs) || (durationMs ? startedAtMs + durationMs : 0)

  return {
    ...project,
    group,
    title: project.title || templateItem.title,
    status,
    createdAtMs: Number(project.createdAtMs) || state.standardBaseMs,
    startedAtMs,
    endsAtMs,
    durationMs,
    minDurationMs: Number(project.minDurationMs) || Number(project.minMs) || templateItem.minMs,
    maxDurationMs: Number(project.maxDurationMs) || Number(project.maxMs) || templateItem.maxMs,
    newUntilMs: Number(project.newUntilMs) || 0,
  }
}

function normalizeStatus(status, startedAtMs, durationMs) {
  if (status === 'completed') return 'completed'
  if (status === 'scheduled') return 'scheduled'
  if (!durationMs && Number(startedAtMs) > 0) return 'scheduled'
  return 'active'
}

function normalizeGroupSchedule(schedule) {
  const normalized = createEmptyGroupSchedule()
  if (!schedule || typeof schedule !== 'object') return normalized

  for (const group of facilityGroups) {
    normalized[group] = Number(schedule[group]) || 0
  }

  return normalized
}

function tick() {
  now.value = Date.now()
  startScheduledProjects()
  settleProjects()
  planNextProjectsForEndingGroups()
  generateDueProjects()
  ensureInitialGroupProjects()
}

function startScheduledProjects() {
  for (const project of state.activeProjects) {
    if (project.status !== 'scheduled') continue
    if (standardNowMs.value < Number(project.startedAtMs)) continue

    const durationMs = randomInt(project.minDurationMs, project.maxDurationMs)
    project.durationMs = durationMs
    project.endsAtMs = Number(project.startedAtMs) + durationMs
    project.status = 'active'
    project.newUntilMs = standardNowMs.value + 2 * MINUTE_MS
  }
}

function settleProjects() {
  for (const project of [...state.activeProjects]) {
    if (project.status !== 'active') continue
    if (!project.endsAtMs || standardNowMs.value < project.endsAtMs) continue
    completeProject(project)
  }
}

function completeProject(project) {
  project.status = 'completed'
  project.completedAtMs = standardNowMs.value
  state.completedProjects.unshift({ ...project })
  state.completedProjects = state.completedProjects.slice(0, MAX_COMPLETED_HISTORY)
  state.activeProjects = state.activeProjects.filter((item) => item.id !== project.id)
  showNotice(`${project.title} 완료`)
}

function planNextProjectsForEndingGroups() {
  for (const group of facilityGroups) {
    const groupProjects = state.activeProjects.filter((project) => project.group === group && project.status !== 'completed')
    if (!groupProjects.length) continue
    if (Number(state.nextProjectAtMsByGroup[group]) > standardNowMs.value) continue

    const endingProject = groupProjects
      .filter((project) => project.status === 'active' && Number(project.endsAtMs) > standardNowMs.value)
      .sort((a, b) => Number(a.endsAtMs) - Number(b.endsAtMs))[0]

    if (!endingProject) continue
    const remainingMs = Number(endingProject.endsAtMs) - standardNowMs.value
    if (remainingMs > NEXT_TRIGGER_REMAINING_MS) continue

    state.nextProjectAtMsByGroup[group] = standardNowMs.value + randomInt(NEXT_APPEAR_MIN_MS, NEXT_APPEAR_MAX_MS)
  }
}

function generateDueProjects() {
  for (const group of facilityGroups) {
    const groupProjects = state.activeProjects.filter((project) => project.group === group && project.status !== 'completed')
    if (groupProjects.length) continue

    const dueAtMs = Number(state.nextProjectAtMsByGroup[group]) || 0
    if (!dueAtMs || standardNowMs.value < dueAtMs) continue

    state.activeProjects.unshift(createScheduledProjectForGroup(group, dueAtMs))
    state.nextProjectAtMsByGroup[group] = 0
  }
}

function ensureInitialGroupProjects() {
  const hasAnyProject = state.activeProjects.length || state.completedProjects.length
  for (const group of facilityGroups) {
    const groupProjects = state.activeProjects.filter((project) => project.group === group && project.status !== 'completed')
    if (groupProjects.length) continue

    if (!hasAnyProject) {
      state.activeProjects.unshift(createInitialProjectForGroup(group))
      continue
    }

    if (!Number(state.nextProjectAtMsByGroup[group])) {
      state.nextProjectAtMsByGroup[group] = standardNowMs.value + randomInt(NEXT_APPEAR_MIN_MS, NEXT_APPEAR_MAX_MS)
    }
  }
}

function createInitialProjectForGroup(group) {
  const appearedAtMs = startOfDayMs(standardNowMs.value)
  const project = createScheduledProjectForGroup(group, appearedAtMs)

  if (standardNowMs.value >= project.startedAtMs) {
    const durationMs = randomInt(project.minDurationMs, project.maxDurationMs)
    project.durationMs = durationMs
    project.status = 'active'
    project.endsAtMs = project.startedAtMs + durationMs
    project.newUntilMs = 0
  }

  return project
}

function createScheduledProjectForGroup(group, appearedAtMs) {
  const base = choice(templates[group] || templates.bus)
  const createdAtMs = Number(appearedAtMs) || standardNowMs.value
  const startedAtMs = nextNineAmAtOrAfter(createdAtMs)

  return {
    id: `facility_${group}_${createdAtMs}_${Math.random().toString(36).slice(2, 8)}`,
    group,
    title: facilityTitleByGroup[group] || base.title,
    status: 'scheduled',
    createdAtMs,
    startedAtMs,
    endsAtMs: 0,
    durationMs: 0,
    minDurationMs: base.minMs,
    maxDurationMs: base.maxMs,
    newUntilMs: Math.max(startedAtMs, standardNowMs.value + 2 * MINUTE_MS),
  }
}

function nextNineAmAtOrAfter(ms) {
  const date = new Date(ms)
  date.setHours(MISSION_START_HOUR, 0, 0, 0)
  const todayStart = date.getTime()
  if (ms <= todayStart) return todayStart
  return todayStart + DAY_MS
}

function startOfDayMs(ms) {
  const date = new Date(ms)
  date.setHours(0, 0, 0, 0)
  return date.getTime()
}

function inferGroup(project) {
  const title = String(project.title || '')
  if (title.includes('철도') || title.includes('선로') || title.includes('환승통로') || title.includes('차량기지')) return 'rail'
  if (title.includes('공항') || title.includes('터미널 기반') || title.includes('활주로')) return 'air'
  if (title.includes('항만') || title.includes('선착장') || title.includes('여객선')) return 'ship'
  return 'bus'
}

function pickTemplateForProject(group, title) {
  const items = templates[group] || templates.bus
  return items.find((item) => item.title === title) || choice(items)
}

function decorateActiveProject(project) {
  const hasStarted = project.status === 'active' && standardNowMs.value >= Number(project.startedAtMs)
  const durationMs = Number(project.durationMs) || 0
  const elapsed = hasStarted ? Math.max(0, standardNowMs.value - Number(project.startedAtMs)) : 0
  const progress = hasStarted && durationMs ? Math.min(100, Math.floor((elapsed / durationMs) * 100)) : 0

  const targetMs = hasStarted ? Number(project.endsAtMs) : Number(project.startedAtMs)

  return {
    ...project,
    progress,
    timeLabel: hasStarted ? '남은시간' : '시작까지',
    remainingText: remainUntilText(targetMs),
    sortRemainMs: Number.isFinite(targetMs) && targetMs > 0
      ? Math.max(0, targetMs - standardNowMs.value)
      : Number.MAX_SAFE_INTEGER,
  }
}

function remainUntilText(targetMs) {
  return formatDurationText(Math.max(0, Number(targetMs) - standardNowMs.value), { showSecondsUnderTwoHours: true })
}

function formatStandardClock(ms) {
  const date = new Date(Number(ms) || Date.now())
  return `${date.getFullYear()}/${pad2(date.getMonth() + 1)}/${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`
}

function pad2(value) {
  return String(value).padStart(2, '0')
}

function formatDurationText(ms, options = {}) {
  const showSecondsUnderTwoHours = Boolean(options.showSecondsUnderTwoHours)
  const totalSeconds = Math.max(0, Math.floor(Number(ms) / SECOND_MS))

  if (showSecondsUnderTwoHours && totalSeconds <= 2 * 3600) {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    const parts = []
    if (hours) parts.push(`${hours}시간`)
    if (minutes || hours) parts.push(`${minutes}분`)
    parts.push(`${seconds}초`)
    return parts.join(' ')
  }

  let remainMinutes = Math.max(1, Math.ceil(totalSeconds / 60))
  const years = Math.floor(remainMinutes / (365 * 24 * 60))
  remainMinutes %= 365 * 24 * 60
  const days = Math.floor(remainMinutes / (24 * 60))
  remainMinutes %= 24 * 60
  const hours = Math.floor(remainMinutes / 60)
  const minutes = remainMinutes % 60

  const parts = []
  if (years) parts.push(`${years}년`)
  if (days) parts.push(`${days}일`)
  if (hours) parts.push(`${hours}시간`)
  if (minutes || !parts.length) parts.push(`${minutes}분`)

  return parts.join(' ')
}

function randomInt(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1))
}

function choice(items) {
  return items[Math.floor(Math.random() * items.length)]
}

function showNotice(message) {
  noticeText.value = message
  window.clearTimeout(noticeTimer)
  noticeTimer = window.setTimeout(() => {
    noticeText.value = ''
  }, 2400)
}

async function saveNow() {
  try {
    await saveRctsAutoSave(state)
  } catch (error) {
    console.error(error)
  }
}

onMounted(async () => {
  const saved = await loadRctsAutoSave()
  applyLoadedSave(saved?.payload)

  ensureInitialGroupProjects()
  tick()
  tickTimer = window.setInterval(tick, TICK_MS)
  saveTimer = window.setInterval(saveNow, AUTO_SAVE_INTERVAL_MS)
})

onBeforeUnmount(() => {
  window.clearInterval(tickTimer)
  window.clearInterval(saveTimer)
  window.clearTimeout(noticeTimer)
  saveNow()
})
</script>

<style scoped>
:global(*) {
  box-sizing: border-box;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

:global(*::-webkit-scrollbar) {
  display: none;
  width: 0;
  height: 0;
}

:global(html),
:global(body),
:global(#app) {
  min-height: 100%;
  margin: 0;
}

:global(body) {
  background: #0f141d;
  color: #edf2f7;
  font-family: Inter, Pretendard, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  overflow-y: auto;
  scrollbar-width: none;
}

:global(body::-webkit-scrollbar) {
  display: none;
}

.facility-page {
  min-height: 100vh;
  width: 100%;
  padding: 18px;
  background:
    radial-gradient(circle at top left, rgba(80, 120, 180, 0.24), transparent 32rem),
    linear-gradient(180deg, #151b25 0%, #0f141d 100%);
}

.hero {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
  align-items: stretch;
  width: 100%;
  margin-bottom: 12px;
}

.title-block,
.project-card,
.notice-line {
  border: 1px solid rgba(255, 255, 255, 0.09);
  background: rgba(255, 255, 255, 0.055);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.22);
  backdrop-filter: blur(16px);
}

.title-block {
  border-radius: 22px;
  padding: 14px 16px;
}

.title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.title-block h1 {
  margin: 0;
  font-size: clamp(26px, 7vw, 42px);
  line-height: 1;
  letter-spacing: -0.07em;
}

.standard-clock {
  flex: 0 0 auto;
  color: rgba(237, 242, 247, 0.92);
  font-family: 'SFMono-Regular', 'Cascadia Code', 'Roboto Mono', Consolas, monospace;
  font-size: clamp(13px, 3.4vw, 18px);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.035em;
  white-space: nowrap;
}

.notice-line {
  width: 100%;
  margin: 0 0 12px;
  border-radius: 16px;
  padding: 12px 14px;
  color: rgba(237, 242, 247, 0.86);
  font-size: 13px;
}

.deck,
.deck-section,
.card-list {
  display: grid;
  width: 100%;
}

.deck {
  gap: 18px;
}

.deck-section {
  gap: 10px;
}

.card-list {
  grid-template-columns: 1fr;
  gap: 10px;
}

.project-card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) max-content;
  gap: 10px;
  align-items: center;
  min-width: 0;
  border-radius: 16px;
  padding: 10px 12px;
}

.project-title {
  min-width: 0;
  max-width: 34vw;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 15px;
  font-weight: 760;
  line-height: 1.1;
  letter-spacing: -0.045em;
}

.progress-inline {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 7px;
  align-items: center;
  min-width: 0;
}

.progress-inline b {
  --progress: 0%;
  position: relative;
  display: block;
  width: 100%;
  min-width: 0;
  height: 7px;
  border-radius: 999px;
  background: rgba(237, 242, 247, 0.15);
  overflow: hidden;
}

.progress-inline b::after {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: var(--progress);
  border-radius: inherit;
  background: rgba(237, 242, 247, 0.9);
}

.progress-inline strong {
  min-width: 34px;
  font-size: 12px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.time-inline {
  min-width: 0;
  overflow: hidden;
  color: rgba(237, 242, 247, 0.78);
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

@media (max-width: 820px) {
  .facility-page {
    padding: 12px;
  }
}

@media (max-width: 520px) {
  .project-card {
    grid-template-columns: auto minmax(0, 1fr) max-content;
    gap: 7px;
    padding: 9px 10px;
  }

  .project-title {
    max-width: 28vw;
    font-size: 13px;
  }

  .progress-inline {
    gap: 5px;
  }

  .progress-inline b {
    height: 6px;
  }

  .progress-inline strong,
  .time-inline {
    font-size: 11px;
  }
}

@media (max-width: 420px) {
  .title-block,
  .project-card {
    border-radius: 18px;
  }

  .title-row {
    align-items: flex-end;
  }
}
</style>
