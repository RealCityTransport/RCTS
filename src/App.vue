<template>
  <div class="facility-page">
    <header class="hero simple-hero">
      <div class="title-block compact title-row">
        <h1>RCTS</h1>
        <strong>행정예산 {{ formatWon(state.budgetWon) }}</strong>
      </div>
    </header>

    <p v-if="noticeText" class="notice-line">{{ noticeText }}</p>

    <main class="deck" aria-label="시설행정 카드덱">
      <section class="deck-section" v-if="activeCards.length">
        <header class="section-head">
          <span>진행 중 시설사업</span>
          <strong>{{ activeCards.length }}건</strong>
        </header>

        <div class="card-list">
          <article
            v-for="project in activeCards"
            :key="project.id"
            class="project-card active"
            :class="[project.method, project.scale, project.status]"
          >
            <div class="card-topline">
              <span>{{ methodLabel(project) }}.{{ groupLabel(project.group) }}</span>
              <em>{{ scaleLabel(project.scale) }}</em>
            </div>

            <h2>{{ project.title }}</h2>

            <div class="info-grid compact-info">
              <div class="info-row progress-inline">
                <span>진행률</span>
                <b aria-hidden="true" :style="{ '--progress': `${project.progress}%` }"></b>
                <strong>{{ project.progress }}%</strong>
              </div>
              <div class="info-row">
                <span>남은시간</span>
                <strong>{{ project.status === 'payment_waiting' ? '정산 대기' : project.remainingText }}</strong>
              </div>
              <div class="info-row">
                <span>위탁비용</span>
                <strong>{{ formatWon(contractFeeAmount(project)) }}</strong>
              </div>
              <div class="info-row">
                <span>전체사업비</span>
                <strong>{{ formatWon(project.totalCostWon) }}</strong>
              </div>
            </div>

            <button
              v-if="project.status === 'payment_waiting'"
              class="action-button primary"
              :disabled="state.budgetWon < project.contractFeeWon"
              @click="payContractProject(project.id)"
            >
              위탁비 지급
            </button>
          </article>
        </div>
      </section>

    </main>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { loadRctsAutoSave, saveRctsAutoSave } from './storage/rctsSaveStorage.js'

const SAVE_SCHEMA_VERSION = 26
const SECOND_MS = 1000
const MINUTE_MS = 60 * SECOND_MS
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS
const TICK_MS = 1000
const AUTO_SAVE_INTERVAL_MS = 60 * SECOND_MS
const MAX_MISSION_CATCH_UP = 80
const MAX_AVAILABLE_PROJECTS = 18
const MAX_ACTIVE_PROJECTS = 80
const MAX_COMPLETED_HISTORY = 80

const cityName = ''

const facilityGroups = ['bus', 'rail', 'air', 'ship']

const groupLabels = {
  bus: '버스시설',
  rail: '철도시설',
  air: '항공시설',
  ship: '선박시설',
}

const scaleLabels = {
  small: '소형',
  medium: '중형',
  large: '대형',
  mega: '초대형',
}

const contractFeeRates = {
  small: 0.32,
  medium: 0.26,
  large: 0.16,
  mega: 0.08,
}

const directAllowedScales = new Set(['small', 'medium'])

const generationRules = {
  small: { minMs: 6 * HOUR_MS, maxMs: 18 * HOUR_MS, catchUp: 24 },
  medium: { minMs: 18 * HOUR_MS, maxMs: 3 * DAY_MS, catchUp: 18 },
  large: { minMs: 7 * DAY_MS, maxMs: 21 * DAY_MS, catchUp: 8 },
  mega: { minMs: 30 * DAY_MS, maxMs: 90 * DAY_MS, catchUp: 3 },
}

const templates = {
  bus: [
    template('정류장 표지판 정비', 'small', 6 * HOUR_MS, 2 * DAY_MS, 5_000_000, 30_000_000, '정류장 안내성과 보행 접근성이 개선됩니다.'),
    template('정류장 승강장 개선', 'small', 2 * DAY_MS, 14 * DAY_MS, 50_000_000, 500_000_000, '승하차 안전성과 시민 이용 만족도가 개선됩니다.'),
    template('버스전용차로 노면 보수', 'medium', 3 * DAY_MS, 20 * DAY_MS, 200_000_000, 2_000_000_000, '버스 통행 안정성과 정시성이 개선됩니다.'),
    template('회차지 포장 보수', 'medium', 7 * DAY_MS, 30 * DAY_MS, 300_000_000, 1_500_000_000, '회차 안정성과 기사 휴게 여건이 개선됩니다.'),
    template('회차지 신설', 'large', 30 * DAY_MS, 180 * DAY_MS, 3_000_000_000, 30_000_000_000, '노선 회전율과 배차 안정성이 크게 개선됩니다.'),
    template('공영차고지 확장', 'large', 60 * DAY_MS, 365 * DAY_MS, 8_000_000_000, 80_000_000_000, '차량 수용 능력과 장기 시설 여력이 증가합니다.'),
  ],
  rail: [
    template('철도역 승강장 안전시설', 'large', 90 * DAY_MS, 365 * DAY_MS, 10_000_000_000, 100_000_000_000, '철도역 안전성과 승객 처리 능력이 개선됩니다.'),
    template('환승통로 확장', 'large', 180 * DAY_MS, 720 * DAY_MS, 30_000_000_000, 300_000_000_000, '환승 혼잡이 줄고 광역교통 연결성이 개선됩니다.'),
    template('선로 유지보수', 'large', 30 * DAY_MS, 180 * DAY_MS, 5_000_000_000, 50_000_000_000, '철도시설 안전도와 안정성이 개선됩니다.'),
    template('차량기지 확장', 'large', 365 * DAY_MS, 1080 * DAY_MS, 100_000_000_000, 1_000_000_000_000, '철도 운영 기반시설의 수용 능력이 증가합니다.'),
    template('철도신설', 'mega', 720 * DAY_MS, 2400 * DAY_MS, 500_000_000_000, 5_000_000_000_000, '장기 광역교통 축이 신설됩니다. 세부 노선도는 추상화됩니다.'),
  ],
  air: [
    template('공항 접근도로 개선', 'large', 180 * DAY_MS, 720 * DAY_MS, 50_000_000_000, 500_000_000_000, '공항 접근성과 광역교통 연결성이 개선됩니다.'),
    template('공항버스 터미널 개선', 'large', 120 * DAY_MS, 540 * DAY_MS, 30_000_000_000, 250_000_000_000, '공항 대중교통 환승 여건이 개선됩니다.'),
    template('공항 환승센터 건설', 'mega', 720 * DAY_MS, 1800 * DAY_MS, 500_000_000_000, 3_000_000_000_000, '공항과 도시교통의 환승 기반이 완성됩니다.'),
    template('여객터미널 기반공사', 'mega', 1080 * DAY_MS, 2520 * DAY_MS, 1_000_000_000_000, 10_000_000_000_000, '대규모 항공 여객시설 기반이 구축됩니다.'),
    template('화물터미널 기반공사', 'mega', 720 * DAY_MS, 2160 * DAY_MS, 800_000_000_000, 6_000_000_000_000, '항공 물류 처리 기반이 구축됩니다.'),
    template('활주로 지원시설 건설', 'mega', 720 * DAY_MS, 2520 * DAY_MS, 800_000_000_000, 8_000_000_000_000, '공항 운항 기반시설이 확장됩니다.'),
  ],
  ship: [
    template('선착장 개선', 'medium', 30 * DAY_MS, 180 * DAY_MS, 3_000_000_000, 50_000_000_000, '연안 교통시설 접근성과 안전성이 개선됩니다.'),
    template('여객터미널 확장', 'large', 180 * DAY_MS, 720 * DAY_MS, 50_000_000_000, 500_000_000_000, '여객 처리 능력과 항만 접근성이 개선됩니다.'),
    template('항만 접속도로 개선', 'large', 180 * DAY_MS, 720 * DAY_MS, 30_000_000_000, 300_000_000_000, '항만과 도시 교통망의 연결성이 개선됩니다.'),
    template('항만 물류시설 정비', 'large', 90 * DAY_MS, 365 * DAY_MS, 20_000_000_000, 200_000_000_000, '물류 처리 안정성과 항만 운영 기반이 개선됩니다.'),
    template('도서 여객선 터미널 개선', 'large', 180 * DAY_MS, 900 * DAY_MS, 80_000_000_000, 800_000_000_000, '도서지역 공공교통 연결성이 개선됩니다.'),
  ],
}

function template(title, scale, minMs, maxMs, minCost, maxCost, effect) {
  return { title, scale, minMs, maxMs, minCost, maxCost, effect }
}

const now = ref(Date.now())
const noticeText = ref('')
let tickTimer = null
let saveTimer = null
let noticeTimer = null

const state = reactive(createFreshSave())

const standardNowMs = computed(() => state.standardBaseMs + (now.value - state.realBaseMs))
const clockTime = computed(() => formatTime(standardNowMs.value))
const clockDate = computed(() => formatDate(standardNowMs.value))
const unlockedGroups = computed(() => facilityGroups)
const directActiveCount = computed(() => state.activeProjects.filter((project) => project.method === 'direct' && project.status === 'active').length)
const contractActiveCount = computed(() => state.activeProjects.filter((project) => project.method === 'contract').length)
const activeCards = computed(() => state.activeProjects
  .map((project) => decorateActiveProject(project))
  .sort((a, b) => {
    const aIsNew = Number(a.newUntilMs) > standardNowMs.value
    const bIsNew = Number(b.newUntilMs) > standardNowMs.value
    if (aIsNew !== bIsNew) return aIsNew ? -1 : 1
    if (aIsNew && bIsNew) return (Number(b.createdAtMs) || 0) - (Number(a.createdAtMs) || 0)

    const aEnd = Number(a.endsAtMs) || Number.MAX_SAFE_INTEGER
    const bEnd = Number(b.endsAtMs) || Number.MAX_SAFE_INTEGER
    if (aEnd !== bEnd) return aEnd - bEnd
    return (Number(b.startedAtMs) || 0) - (Number(a.startedAtMs) || 0)
  }))

function createFreshSave() {
  const baseMs = Date.now()
  const standardBaseMs = baseMs
  return {
    schemaVersion: SAVE_SCHEMA_VERSION,
    mode: 'facility_admin',
    cityName,
    realBaseMs: baseMs,
    standardBaseMs,
    budgetWon: 500_000_000_000,
    directSlotLimit: 1,
    directCompletedCount: 0,
    completedCount: 0,
    nextProjectGeneratedAtMs: createInitialGenerationSchedule(standardBaseMs),
    availableProjects: [],
    activeProjects: [],
    completedProjects: [],
  }
}

function applyLoadedSave(payload) {
  if (!payload || payload.mode !== 'facility_admin') return false

  const fresh = createFreshSave()
  Object.assign(state, fresh, payload)
  state.mode = 'facility_admin'
  state.schemaVersion = SAVE_SCHEMA_VERSION
  state.availableProjects = []
  state.activeProjects = normalizeProjectList(payload.activeProjects, 'active')
  state.completedProjects = normalizeProjectList(payload.completedProjects, 'completed')
  state.directSlotLimit = Math.min(5, Math.max(1, Number(payload.directSlotLimit) || 1))
  state.directCompletedCount = Number(payload.directCompletedCount) || 0
  state.completedCount = Number(payload.completedCount) || state.completedProjects.length || 0
  state.budgetWon = Number(payload.budgetWon) || fresh.budgetWon
  state.realBaseMs = Number(payload.realBaseMs) || fresh.realBaseMs
  state.standardBaseMs = Number(payload.standardBaseMs) || fresh.standardBaseMs
  state.nextProjectGeneratedAtMs = normalizeGenerationSchedule(payload.nextProjectGeneratedAtMs, state.standardBaseMs)
  return true
}

function normalizeProjectList(projects, fallbackStatus) {
  if (!Array.isArray(projects)) return []
  return projects.map((project) => normalizeProject(project, fallbackStatus)).filter(Boolean)
}

function normalizeProject(project, fallbackStatus) {
  if (!project || !project.id) return null
  const scale = project.scale || 'small'
  const totalCostWon = Number(project.totalCostWon ?? project.costWon ?? project.directBudgetWon) || 0
  const method = project.method === 'direct' ? 'direct' : 'contract'
  return {
    ...project,
    scale,
    method,
    status: project.status || fallbackStatus,
    totalCostWon,
    directBudgetWon: Number(project.directBudgetWon) || totalCostWon,
    contractFeeWon: Number(project.contractFeeWon) || calculateContractFee(totalCostWon, scale),
    costWon: Number(project.costWon) || totalCostWon,
    durationMs: Number(project.durationMs) || DAY_MS,
    createdAtMs: Number(project.createdAtMs) || state.standardBaseMs,
    startedAtMs: Number(project.startedAtMs) || Number(project.createdAtMs) || state.standardBaseMs,
    endsAtMs: Number(project.endsAtMs) || ((Number(project.startedAtMs) || Number(project.createdAtMs) || state.standardBaseMs) + (Number(project.durationMs) || DAY_MS)),
    newUntilMs: Number(project.newUntilMs) || 0,
    expiresAtMs: Number(project.expiresAtMs) || state.standardBaseMs + expireDurationForScale(scale),
  }
}

function tick() {
  now.value = Date.now()
  settleProjects()
  expireAvailableProjects()
  generateProjectCatchUp()
  ensureMinimumActiveProjects()
  updateDirectSlotLimit()
}

function settleProjects() {
  for (const project of state.activeProjects) {
    if (project.status !== 'active') continue
    if (standardNowMs.value < project.endsAtMs) continue

    if (project.method === 'contract') {
      project.status = 'payment_waiting'
      project.progress = 100
      continue
    }

    completeProject(project)
  }
}

function completeProject(project) {
  project.status = 'completed'
  project.completedAtMs = standardNowMs.value
  state.completedCount += 1

  if (project.method === 'direct') {
    state.directCompletedCount += 1
  }

  state.completedProjects.unshift({ ...project })
  state.completedProjects = state.completedProjects.slice(0, MAX_COMPLETED_HISTORY)
  state.activeProjects = state.activeProjects.filter((item) => item.id !== project.id)
  showNotice(`${project.title} 사업이 완료되었습니다.`)
}

function payContractProject(projectId) {
  const project = state.activeProjects.find((item) => item.id === projectId)
  if (!project || project.status !== 'payment_waiting') return
  if (state.budgetWon < project.contractFeeWon) return

  state.budgetWon -= project.contractFeeWon
  completeProject(project)
}

function expireAvailableProjects() {
  state.availableProjects = state.availableProjects.filter((project) => project.expiresAtMs > standardNowMs.value)
}

function generateProjectCatchUp() {
  state.nextProjectGeneratedAtMs = normalizeGenerationSchedule(state.nextProjectGeneratedAtMs, standardNowMs.value)

  for (const scale of Object.keys(generationRules)) {
    const rule = generationRules[scale]
    let generated = 0

    while (standardNowMs.value >= state.nextProjectGeneratedAtMs[scale] && generated < Math.min(rule.catchUp, MAX_MISSION_CATCH_UP)) {
      const createdAtMs = state.nextProjectGeneratedAtMs[scale]
      state.nextProjectGeneratedAtMs[scale] += randomInt(rule.minMs, rule.maxMs)
      generated += 1

      if (state.activeProjects.length >= MAX_ACTIVE_PROJECTS) continue
      const project = createRandomProject(createdAtMs, scale)
      state.activeProjects.unshift(activateGeneratedProject(project, createdAtMs))
    }
  }
}

function createRandomProject(createdAtMs, forcedScale = null) {
  const pool = []

  for (const group of unlockedGroups.value.length ? unlockedGroups.value : ['bus']) {
    for (const item of templates[group] || []) {
      if (!forcedScale || item.scale === forcedScale) pool.push({ group, base: item })
    }
  }

  const selected = pool.length ? choice(pool) : { group: 'bus', base: choice(templates.bus) }
  const { group, base } = selected
  const durationMs = randomInt(base.minMs, base.maxMs)
  const totalCostWon = roundCost(randomInt(base.minCost, base.maxCost))
  const method = chooseProjectMethod(base.scale, totalCostWon)

  return {
    id: `facility_${createdAtMs}_${Math.random().toString(36).slice(2, 8)}`,
    group,
    title: base.title,
    scale: base.scale,
    effect: base.effect,
    durationMs,
    totalCostWon,
    directBudgetWon: totalCostWon,
    contractFeeWon: calculateContractFee(totalCostWon, base.scale),
    costWon: totalCostWon,
    createdAtMs,
    expiresAtMs: createdAtMs + expireDurationForScale(base.scale),
    status: 'available',
    method,
  }
}


function activateGeneratedProject(project, startedAtMs) {
  const activeProject = prepareProjectForStart(project)
  const startMs = Number(startedAtMs) || standardNowMs.value

  if (activeProject.method === 'direct') {
    state.budgetWon -= activeProject.directBudgetWon
  }

  return {
    ...activeProject,
    status: 'active',
    startedAtMs: startMs,
    endsAtMs: startMs + activeProject.durationMs,
    newUntilMs: standardNowMs.value + 2 * MINUTE_MS,
  }
}

function chooseProjectMethod(scale, totalCostWon) {
  const directReserved = countDirectReservedProjects()
  if (directAllowedScales.has(scale) && directReserved < state.directSlotLimit && state.budgetWon >= totalCostWon) return 'direct'
  return 'contract'
}

function countDirectReservedProjects() {
  return state.activeProjects.filter((project) => project.method === 'direct' && project.status === 'active').length
}

function calculateContractFee(totalCostWon, scale) {
  const rate = contractFeeRates[scale] || 0.2
  return roundCost(Math.max(1_000_000, totalCostWon * rate))
}

function createInitialGenerationSchedule(baseMs) {
  return Object.fromEntries(Object.entries(generationRules).map(([scale, rule]) => [
    scale,
    baseMs + randomInt(rule.minMs, rule.maxMs),
  ]))
}

function normalizeGenerationSchedule(schedule, baseMs) {
  const normalized = {}
  for (const [scale, rule] of Object.entries(generationRules)) {
    const value = Number(schedule?.[scale])
    normalized[scale] = Number.isFinite(value) && value > 0
      ? value
      : baseMs + randomInt(rule.minMs, rule.maxMs)
  }
  return normalized
}

function expireDurationForScale(scale) {
  if (scale === 'mega') return 180 * DAY_MS
  if (scale === 'large') return 60 * DAY_MS
  if (scale === 'medium') return 21 * DAY_MS
  return 7 * DAY_MS
}

function createAutoActiveProject(createdAtMs) {
  const project = createRandomProject(createdAtMs)
  const progressMs = randomInt(0, Math.floor(project.durationMs * 0.55))
  const startedAtMs = standardNowMs.value - progressMs
  const activeProject = activateGeneratedProject(project, startedAtMs)
  activeProject.newUntilMs = 0
  return activeProject
}

function ensureMinimumActiveProjects() {
  while (state.activeProjects.filter((project) => project.status === 'active').length < 4 && state.activeProjects.length < MAX_ACTIVE_PROJECTS) {
    state.activeProjects.unshift(createAutoActiveProject(standardNowMs.value))
  }
}


function startProject(projectId) {
  const project = state.availableProjects.find((item) => item.id === projectId)
  if (!project) return

  const activeProject = prepareProjectForStart(project)
  if (!canStartProject(activeProject)) return

  if (activeProject.method === 'direct') {
    state.budgetWon -= activeProject.directBudgetWon
  }

  const startedAtMs = standardNowMs.value
  state.availableProjects = state.availableProjects.filter((item) => item.id !== projectId)
  state.activeProjects.unshift({
    ...activeProject,
    status: 'active',
    startedAtMs,
    endsAtMs: startedAtMs + activeProject.durationMs,
  })
  showNotice(`${project.title} 사업을 ${activeProject.method === 'direct' ? '직영' : '위탁'}으로 착수했습니다.`)
}

function prepareProjectForStart(project) {
  return normalizeProject(project, project.status || 'available')
}

function canStartProject(project) {
  if (!project) return false
  if (project.method === 'direct') return canStartDirect(project)
  return canStartContract(project)
}

function canStartDirect(project) {
  if (!project) return false
  if (!directAllowedScales.has(project.scale)) return false
  if (directActiveCount.value >= state.directSlotLimit) return false
  return state.budgetWon >= project.directBudgetWon
}

function canStartContract(project) {
  if (!project) return false
  return true
}

function startButtonText(project) {
  return project.method === 'direct' ? '직영 착수' : '위탁 발주'
}

function projectCostLabel(project) {
  return project.method === 'direct' ? '사업비' : '위탁비용'
}

function projectCostAmount(project) {
  return project.method === 'direct' ? project.directBudgetWon : project.contractFeeWon
}

function updateDirectSlotLimit() {
  const completed = state.directCompletedCount
  let nextLimit = 1
  if (completed >= 150) nextLimit = 5
  else if (completed >= 70) nextLimit = 4
  else if (completed >= 30) nextLimit = 3
  else if (completed >= 10) nextLimit = 2

  if (nextLimit > state.directSlotLimit) {
    state.directSlotLimit = nextLimit
    showNotice(`직영 가능 수가 ${nextLimit}개로 확장되었습니다.`)
  }
}

function decorateActiveProject(project) {
  const elapsed = Math.max(0, standardNowMs.value - project.startedAtMs)
  const progress = project.status === 'payment_waiting'
    ? 100
    : Math.min(100, Math.floor((elapsed / project.durationMs) * 100))

  return {
    ...project,
    progress,
    remainingText: remainUntilText(project.endsAtMs),
  }
}

function methodLabel(project) {
  if (project.method === 'direct') return '직영'
  if (project.method === 'contract') return '위탁'
  return '시설'
}

function groupLabel(group) {
  return groupLabels[group] || '시설'
}

function scaleLabel(scale) {
  return scaleLabels[scale] || '사업'
}

function durationText(ms) {
  return formatDurationText(ms, { showSecondsUnderHour: false })
}

function remainUntilText(targetMs) {
  return formatDurationText(Math.max(0, targetMs - standardNowMs.value), { showSecondsUnderHour: true })
}

function formatDurationText(ms, options = {}) {
  const showSecondsUnderHour = Boolean(options.showSecondsUnderHour)
  const totalSeconds = Math.max(0, Math.floor(Number(ms) / SECOND_MS))

  if (showSecondsUnderHour && totalSeconds < 3600) {
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    if (minutes > 0) return `${minutes}분 ${seconds}초`
    return `${seconds}초`
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

function contractFeeAmount(project) {
  if (!project) return 0
  if (project.method === 'contract') return Number(project.contractFeeWon) || 0
  return 0
}

function formatWon(value) {
  const won = Math.round(Number(value) || 0)
  const jo = Math.floor(won / 1_0000_0000_0000)
  const eok = Math.floor((won % 1_0000_0000_0000) / 100_000_000)
  const man = Math.floor((won % 100_000_000) / 10_000)

  if (jo > 0) return eok > 0 ? `${jo}조 ${eok.toLocaleString()}억` : `${jo}조`
  if (eok > 0) return `${eok.toLocaleString()}억`
  if (man > 0) return `${man.toLocaleString()}만`
  return `${won.toLocaleString()}원`
}

function formatDate(ms) {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  }).format(new Date(ms))
}

function formatTime(ms) {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(ms))
}

function randomInt(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1))
}

function choice(items) {
  return items[Math.floor(Math.random() * items.length)]
}

function roundCost(value) {
  if (value >= 100_000_000_000) return Math.round(value / 10_000_000_000) * 10_000_000_000
  if (value >= 1_000_000_000) return Math.round(value / 100_000_000) * 100_000_000
  if (value >= 10_000_000) return Math.round(value / 1_000_000) * 1_000_000
  return Math.round(value / 100_000) * 100_000
}

function showNotice(message) {
  noticeText.value = message
  window.clearTimeout(noticeTimer)
  noticeTimer = window.setTimeout(() => {
    noticeText.value = ''
  }, 3200)
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

  if (!state.activeProjects.length) {
    for (let index = 0; index < 4; index += 1) {
      state.activeProjects.unshift(createAutoActiveProject(state.standardBaseMs + index * HOUR_MS))
    }
  }

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
  margin-bottom: 14px;
}

.title-block,
.clock-card,
.summary-card,
.project-card,
.empty-card,
.notice-line {
  border: 1px solid rgba(255, 255, 255, 0.09);
  background: rgba(255, 255, 255, 0.055);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.22);
  backdrop-filter: blur(16px);
}

.title-block,
.clock-card {
  border-radius: 24px;
  padding: 18px;
}

.title-block.compact {
  padding: 16px 18px;
}

.title-block span,
.clock-card span,
.summary-card span,
.section-head span,
.card-topline,
.info-row span,
.empty-card span {
  color: rgba(237, 242, 247, 0.62);
  font-size: 12px;
  letter-spacing: -0.01em;
}

.title-block h1 {
  margin: 0;
  font-size: clamp(26px, 7vw, 44px);
  line-height: 1;
  letter-spacing: -0.07em;
}

.clock-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 156px;
  text-align: right;
}

.clock-card strong {
  display: block;
  margin-top: 4px;
  font-variant-numeric: tabular-nums;
  font-size: clamp(28px, 7vw, 44px);
  line-height: 1;
  letter-spacing: -0.07em;
}

.clock-card em,
.summary-card em {
  display: block;
  margin-top: 8px;
  color: rgba(237, 242, 247, 0.52);
  font-size: 12px;
  font-style: normal;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  width: 100%;
  margin-bottom: 12px;
}

.summary-card {
  min-height: 98px;
  border-radius: 20px;
  padding: 14px;
}

.summary-card.wide {
  grid-column: span 1;
}

.summary-card strong {
  display: block;
  margin-top: 10px;
  font-size: clamp(18px, 4.5vw, 26px);
  line-height: 1.05;
  letter-spacing: -0.05em;
}

.notice-line {
  width: 100%;
  margin: 0 0 12px;
  border-radius: 16px;
  padding: 12px 14px;
  color: rgba(237, 242, 247, 0.86);
  font-size: 13px;
}

.deck {
  display: grid;
  gap: 18px;
  width: 100%;
}

.deck-section {
  display: grid;
  gap: 10px;
  width: 100%;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 0 2px;
}

.section-head strong {
  font-size: 12px;
  color: rgba(237, 242, 247, 0.74);
}

.card-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  width: 100%;
}

.project-card,
.empty-card {
  display: grid;
  gap: 8px;
  min-width: 0;
  border-radius: 18px;
  padding: 12px;
}

.project-card h2 {
  margin: 0;
  font-size: 17px;
  line-height: 1.12;
  letter-spacing: -0.045em;
}

.card-topline,
.info-row,
.action-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.card-topline em {
  color: rgba(237, 242, 247, 0.5);
  font-style: normal;
}

.project-card p {
  margin: 0;
  color: rgba(237, 242, 247, 0.68);
  font-size: 13px;
  line-height: 1.45;
}

.progress-inline {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 8px;
  align-items: center;
}

.progress-inline b {
  --progress: 0%;
  min-width: 52px;
  height: 6px;
  border-radius: 999px;
  background:
    linear-gradient(90deg, rgba(237, 242, 247, 0.86) 0 var(--progress), transparent var(--progress) 100%),
    rgba(237, 242, 247, 0.14);
  overflow: hidden;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px 10px;
}

.info-grid .info-row {
  min-width: 0;
}

.info-row {
  min-height: 22px;
  padding-top: 2px;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
}

.info-row strong {
  font-size: 13px;
  text-align: right;
}

.action-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.action-button {
  width: 100%;
  min-height: 36px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.08);
  color: #edf2f7;
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
}

.action-button.primary {
  background: rgba(237, 242, 247, 0.9);
  color: #121722;
}

.action-button:disabled {
  cursor: not-allowed;
  opacity: 0.36;
}

.empty-card {
  grid-column: 1 / -1;
  align-items: center;
  min-height: 120px;
  text-align: center;
}

.empty-card strong {
  font-size: 18px;
}

.payment_waiting {
  border-color: rgba(255, 221, 120, 0.34);
}

@media (max-width: 820px) {
  .facility-page {
    padding: 12px;
  }

  .hero {
    grid-template-columns: 1fr;
  }

  .clock-card {
    min-width: 0;
    text-align: left;
  }

  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .card-list {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 420px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }

  .title-block,
  .clock-card,
  .summary-card,
  .project-card,
  .empty-card {
    border-radius: 18px;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .action-row {
    grid-template-columns: 1fr;
  }
}
</style>
