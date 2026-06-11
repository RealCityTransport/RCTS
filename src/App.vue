<template>
  <div class="rcts-shell">
    <header class="top-header">
      <div class="brand">
        <strong>RCTS</strong>
        <span>One Page Idle Transport</span>
      </div>

      <nav class="top-menu" aria-label="교통 단계 이동 메뉴">
        <button v-for="group in stageGroups" :key="group.id" type="button" @click="scrollToGroup(group.id)">
          {{ group.name }}
        </button>
      </nav>

      <div class="clock-box">
        <span>표준시간</span>
        <strong>{{ standardClock }}</strong>
      </div>
    </header>

    <main class="page-body">
      <section v-if="offlineReport" class="offline-card">
        <div>
          <p class="eyebrow">Offline Progress</p>
          <h2>오프라인 진행 반영</h2>
          <p>{{ offlineReport.elapsedText }} 동안 진행된 운행을 반영했습니다.</p>
        </div>
        <div class="offline-results">
          <span>완료 운행 {{ offlineReport.completedRuns }}회</span>
          <span>자동 운행 {{ offlineReport.autoRuns }}회</span>
        </div>
        <button type="button" @click="offlineReport = null">확인</button>
      </section>

      <section class="hero-panel">
        <div>
          <p class="eyebrow">RCTS Progression</p>
          <h1>운행 횟수로 교통수단을 하나씩 확장합니다.</h1>
          <p class="hero-text">
            각 슬롯은 처음 10회까지 수동 운행합니다. 10회를 채우면 다음 슬롯을 유저가 직접 개방하고,
            기존 슬롯은 11회차부터 자동 반복 운행으로 전환됩니다.
          </p>
        </div>
        <div class="hero-stats">
          <article>
            <span>개방 슬롯</span>
            <strong>{{ unlockedCount }} / {{ stages.length }}</strong>
          </article>
          <article>
            <span>총 운행 횟수</span>
            <strong>{{ totalRuns }}회</strong>
          </article>
          <article>
            <span>자동 운행</span>
            <strong>{{ autoStageCount }}개</strong>
          </article>
        </div>
      </section>

      <section class="current-panel">
        <div class="section-title-row">
          <div>
            <p class="eyebrow">Active Slots</p>
            <h2>현재 진행 슬롯</h2>
          </div>
          <span>가장 빨리 끝나는 운행이 먼저 보입니다</span>
        </div>

        <div v-if="activeStages.length === 0" class="empty-state">
          아직 진행 중인 운행이 없습니다. 개방된 슬롯에서 수동 운행을 시작하세요.
        </div>

        <div v-else class="active-list">
          <article v-for="stage in activeStages" :key="stage.id" class="active-card">
            <div>
              <strong>{{ stage.name }}</strong>
              <span>{{ stageStatusText(stage) }}</span>
            </div>
            <div class="active-time">{{ timerText(stage) }}</div>
          </article>
        </div>
      </section>

      <section
        v-for="group in stageGroups"
        :id="`group-${group.id}`"
        :key="group.id"
        class="group-section"
      >
        <div class="section-title-row">
          <div>
            <p class="eyebrow">{{ group.label }}</p>
            <h2>{{ group.name }}</h2>
          </div>
          <span>{{ group.description }}</span>
        </div>

        <div class="stage-list">
          <article
            v-for="stage in stagesByGroup(group.id)"
            :key="stage.id"
            class="stage-card"
            :class="{
              locked: !stage.unlocked,
              running: stage.status === 'running',
              auto: stage.auto,
              ready: canOpenNext(stage),
            }"
          >
            <div class="stage-top-row">
              <div class="stage-title">
                <span class="stage-number">{{ stage.order }}</span>
                <div>
                  <h3>{{ stage.name }}</h3>
                  <p>{{ stage.description }}</p>
                </div>
              </div>
              <span class="stage-badge">{{ stageBadge(stage) }}</span>
            </div>

            <div class="stage-progress-row">
              <div class="progress-info">
                <strong>{{ progressTitle(stage) }}</strong>
                <span>{{ stageDurationLabel(stage) }}</span>
              </div>
              <div class="progress-track">
                <div class="progress-fill" :style="{ width: `${progressPercent(stage)}%` }"></div>
              </div>
            </div>

            <div class="stage-bottom-row">
              <div class="stage-meta">
                <span>누적 {{ stage.runs }}회</span>
                <span v-if="stage.unlocked">{{ timerText(stage) }}</span>
                <span v-else>이전 슬롯 개방 필요</span>
              </div>

              <div class="stage-actions">
                <button
                  v-if="canManualStart(stage)"
                  type="button"
                  class="primary-action"
                  @click="startManualRun(stage)"
                >
                  운행 시작
                </button>

                <button
                  v-if="canOpenNext(stage)"
                  type="button"
                  class="unlock-action"
                  @click="openNextStage(stage)"
                >
                  다음 슬롯 개방
                </button>

                <span v-if="stage.auto" class="auto-chip">자동 반복중</span>
                <span v-else-if="stage.status === 'running'" class="run-chip">운행중</span>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section class="log-panel">
        <div class="section-title-row">
          <div>
            <p class="eyebrow">Operation Log</p>
            <h2>최근 진행 기록</h2>
          </div>
          <button type="button" class="ghost-button" @click="resetProgress">진행 초기화</button>
        </div>
        <div class="log-list">
          <p v-for="log in logs" :key="log.id">
            <span>{{ log.time }}</span>
            {{ log.text }}
          </p>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { loadRctsAutoSave, saveRctsAutoSave } from './storage/rctsSaveStorage.js'

const TARGET_RUNS = 10
const AUTO_SAVE_INTERVAL_MS = 10 * 60 * 1000
const SECOND = 1000
const MINUTE = 60
const HOUR = 3600
const DAY = 86400

const stageDefinitions = [
  { id: 'village_bus', group: 'bus', order: 1, name: '마을버스', description: '생활권을 연결하는 첫 운행 슬롯', durationSeconds: 30 * MINUTE },
  { id: 'city_bus', group: 'bus', order: 2, name: '시내버스', description: '도심 주요 정류장을 연결하는 기본 노선', durationSeconds: 1 * HOUR },
  { id: 'express_bus', group: 'bus', order: 3, name: '광역버스', description: '고속도로를 달리는 장거리 버스 운행', durationSeconds: 2 * HOUR },
  { id: 'commuter_charter', group: 'bus', order: 4, name: '전세통근', description: '월~금 06~10시, 17~21시에만 운행', durationSeconds: 8 * HOUR, timeWindow: 'commuter' },
  { id: 'charter_bus', group: 'bus', order: 5, name: '전세버스', description: '표준시간 기준 3일 운행', durationSeconds: 3 * DAY },
  { id: 'tram', group: 'rail', order: 6, name: '트램', description: '도심 도로와 연결되는 노면 교통', durationSeconds: 1 * HOUR },
  { id: 'light_rail', group: 'rail', order: 7, name: '경전철', description: '중소 규모 도시권을 연결하는 철도 슬롯', durationSeconds: 1 * HOUR },
  { id: 'metro_rail', group: 'rail', order: 8, name: '광역전철', description: '도시권을 넓게 연결하는 대량 수송', durationSeconds: 2 * HOUR },
  { id: 'general_train', group: 'rail', order: 9, name: '일반열차', description: '지역 간 이동을 담당하는 장거리 열차', durationSeconds: 4 * HOUR },
  { id: 'domestic_hsr', group: 'rail', order: 10, name: '국내고속열차', description: '국내 주요 도시를 빠르게 연결', durationSeconds: 2 * HOUR },
  { id: 'international_hsr', group: 'rail', order: 11, name: '국제고속열차', description: '국경을 넘어 연결되는 고속철도', durationSeconds: 6 * HOUR },
  { id: 'domestic_flight', group: 'air', order: 12, name: '국내선 항공', description: '국내 공항을 연결하는 항공 운항', durationSeconds: 2 * HOUR },
  { id: 'international_flight', group: 'air', order: 13, name: '국제선 항공', description: '장거리 국제 항공 운항', durationSeconds: 10 * HOUR },
  { id: 'domestic_ship', group: 'ship', order: 14, name: '국내선 선박', description: '국내 항구와 섬을 연결하는 선박 운항', durationSeconds: 1 * DAY },
  { id: 'short_international_ship', group: 'ship', order: 15, name: '국제선 단거리 선박', description: '근거리 국제 항로 운항', durationSeconds: 15 * DAY },
  { id: 'long_international_ship', group: 'ship', order: 16, name: '국제선 장거리 선박', description: '장거리 국제 항로 운항', durationSeconds: 30 * DAY },
  { id: 'space_station_shuttle', group: 'space', order: 17, name: '우주정거장 셔틀', description: '우주정거장 왕복 셔틀 운항', durationSeconds: 3 * HOUR },
  { id: 'stellar_shuttle', group: 'space', order: 18, name: '성계 셔틀', description: '편도 30일, 기본 왕복 60일', durationSeconds: 60 * DAY },
  { id: 'galaxy_shuttle', group: 'space', order: 19, name: '은하 셔틀', description: '편도 3개월, 왕복 6개월', durationSeconds: 180 * DAY },
]

const stageGroups = [
  { id: 'bus', name: '버스', label: 'Bus', description: '초반 교통 성장 구간' },
  { id: 'rail', name: '철도', label: 'Rail', description: '도시권과 국가권 철도 확장' },
  { id: 'air', name: '항공', label: 'Air', description: '국내선과 국제선 항공 운항' },
  { id: 'ship', name: '선박', label: 'Ship', description: '국내외 해상 운송 구간' },
  { id: 'space', name: '우주', label: 'Space', description: '우주정거장부터 은하 셔틀까지' },
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
    auto: false,
    status: 'idle',
    runs: 0,
    remainingSeconds: stage.durationSeconds,
  }))
}

const stages = reactive(createInitialStages())
const logs = ref([
  { id: cryptoRandomId(), time: formatLogTime(new Date()), text: 'RCTS 원페이지 운행 진행을 시작했습니다.' },
])

const standardClock = computed(() => formatStandardClock(standardNow.value))
const totalRuns = computed(() => stages.reduce((sum, stage) => sum + stage.runs, 0))
const unlockedCount = computed(() => stages.filter((stage) => stage.unlocked).length)
const autoStageCount = computed(() => stages.filter((stage) => stage.auto).length)
const activeStages = computed(() => stages
  .filter((stage) => stage.unlocked && stage.status === 'running')
  .slice()
  .sort((a, b) => a.remainingSeconds - b.remainingSeconds))

function stagesByGroup(groupId) {
  return stages.filter((stage) => stage.group === groupId)
}

function scrollToGroup(groupId) {
  const element = document.getElementById(`group-${groupId}`)
  if (!element) return
  element.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function canManualStart(stage) {
  return stage.unlocked && !stage.auto && stage.status !== 'running' && stage.runs < TARGET_RUNS
}

function canOpenNext(stage) {
  const next = getNextStage(stage)
  return Boolean(stage.unlocked && stage.runs >= TARGET_RUNS && !stage.auto && next && !next.unlocked)
}

function getNextStage(stage) {
  return stages.find((item) => item.order === stage.order + 1)
}

function startManualRun(stage) {
  if (!canManualStart(stage)) return
  stage.status = 'running'
  stage.remainingSeconds = stage.durationSeconds
  addLog(`${stage.name} 수동 운행을 시작했습니다.`)
  saveSoon()
}

function openNextStage(stage) {
  const next = getNextStage(stage)
  if (!canOpenNext(stage) || !next) return

  stage.auto = true
  stage.status = 'running'
  stage.remainingSeconds = stage.durationSeconds

  next.unlocked = true
  next.auto = false
  next.status = 'idle'
  next.remainingSeconds = next.durationSeconds

  addLog(`${next.name} 슬롯을 개방했습니다. ${stage.name}은 자동 반복 운행으로 전환되었습니다.`)
  saveSoon()
}

function resetProgress() {
  const fresh = createInitialStages()
  stages.splice(0, stages.length, ...fresh)
  logs.value = [{ id: cryptoRandomId(), time: formatLogTime(new Date()), text: '진행 상태를 초기화했습니다.' }]
  saveSoon()
}

function tickGame() {
  const now = new Date()
  standardNow.value = now

  stages.forEach((stage) => {
    if (!stage.unlocked || stage.status !== 'running') return
    const tickAmount = getTickAmountForStage(stage, now, new Date(now.getTime() - SECOND))
    if (tickAmount <= 0) return
    stage.remainingSeconds = Math.max(0, stage.remainingSeconds - tickAmount)
    if (stage.remainingSeconds <= 0) completeStageRun(stage)
  })
}

function completeStageRun(stage) {
  stage.runs += 1

  if (stage.auto) {
    stage.remainingSeconds = stage.durationSeconds
    stage.status = 'running'
    return
  }

  stage.status = 'idle'
  stage.remainingSeconds = stage.durationSeconds

  if (stage.runs >= TARGET_RUNS) {
    const next = getNextStage(stage)
    if (next) addLog(`${stage.name} 10회 운행 완료. ${next.name} 슬롯을 개방할 수 있습니다.`)
    else addLog(`${stage.name} 최종 단계 10회 운행을 완료했습니다.`)
  } else {
    addLog(`${stage.name} 운행 완료. 진행 ${stage.runs} / ${TARGET_RUNS}회.`)
  }
}

function getTickAmountForStage(stage, currentDate, previousDate) {
  if (stage.timeWindow === 'commuter') {
    return countCommuterOperableSeconds(previousDate, currentDate)
  }
  return 1
}

function applyOfflineProgress(elapsedSeconds, savedAtDate) {
  if (elapsedSeconds <= 0) return

  const start = savedAtDate
  const end = new Date(start.getTime() + elapsedSeconds * SECOND)
  let completedRuns = 0
  let autoRuns = 0

  stages.forEach((stage) => {
    if (!stage.unlocked || stage.status !== 'running') return

    const effectiveElapsed = stage.timeWindow === 'commuter'
      ? countCommuterOperableSeconds(start, end)
      : elapsedSeconds

    if (effectiveElapsed <= 0) return

    if (stage.auto) {
      const currentRemaining = normalizeRemaining(stage)
      if (effectiveElapsed >= currentRemaining) {
        const rest = effectiveElapsed - currentRemaining
        const addedRuns = 1 + Math.floor(rest / stage.durationSeconds)
        stage.runs += addedRuns
        stage.remainingSeconds = stage.durationSeconds - (rest % stage.durationSeconds)
        if (stage.remainingSeconds === stage.durationSeconds && rest > 0) {
          stage.remainingSeconds = stage.durationSeconds
        }
        completedRuns += addedRuns
        autoRuns += addedRuns
      } else {
        stage.remainingSeconds = currentRemaining - effectiveElapsed
      }
      stage.status = 'running'
      return
    }

    if (effectiveElapsed >= normalizeRemaining(stage)) {
      stage.runs += 1
      stage.status = 'idle'
      stage.remainingSeconds = stage.durationSeconds
      completedRuns += 1
    } else {
      stage.remainingSeconds = normalizeRemaining(stage) - effectiveElapsed
    }
  })

  if (completedRuns > 0) {
    offlineReport.value = {
      elapsedText: formatLongDuration(elapsedSeconds),
      completedRuns,
      autoRuns,
    }
    addLog(`오프라인 동안 운행 ${completedRuns}회를 반영했습니다.`)
  }
}

function normalizeRemaining(stage) {
  if (!Number.isFinite(stage.remainingSeconds) || stage.remainingSeconds <= 0) return stage.durationSeconds
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

function stageBadge(stage) {
  if (!stage.unlocked) return '대기'
  if (stage.auto) return '자동'
  if (canOpenNext(stage)) return '개방 가능'
  if (stage.status === 'running') return '운행중'
  return '수동'
}

function stageStatusText(stage) {
  if (stage.timeWindow === 'commuter' && !isCommuterWindow(standardNow.value)) return '표준시간 휴식 · 월~금 06~10시 / 17~21시 운행'
  if (stage.auto) return '자동 반복 운행'
  return '수동 운행 진행'
}

function progressTitle(stage) {
  if (!stage.unlocked) return `이전 단계 완료 후 개방`
  if (stage.auto) return `자동 반복 · 누적 ${stage.runs}회`
  return `${Math.min(stage.runs, TARGET_RUNS)} / ${TARGET_RUNS}회 수동 운행`
}

function progressPercent(stage) {
  if (!stage.unlocked) return 0
  if (stage.auto) return 100
  return Math.min(100, (stage.runs / TARGET_RUNS) * 100)
}

function timerText(stage) {
  if (!stage.unlocked) return '잠김'
  if (stage.status !== 'running') return stage.auto ? '자동 대기' : '대기중'
  if (stage.timeWindow === 'commuter' && !isCommuterWindow(standardNow.value)) return `휴식 · 남은 운행 ${formatDuration(stage.remainingSeconds)}`
  return `남은 시간 ${formatDuration(stage.remainingSeconds)}`
}

function stageDurationLabel(stage) {
  if (stage.timeWindow === 'commuter') return '월~금 06~10시, 17~21시만 카운트'
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
      auto: stage.auto,
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
      stage.auto = Boolean(savedStage.auto)
      stage.status = savedStage.status === 'running' ? 'running' : 'idle'
      stage.runs = Number(savedStage.runs) || 0
      stage.remainingSeconds = Number(savedStage.remainingSeconds) || stage.durationSeconds
    })
  }

  if (Array.isArray(payload.logs)) logs.value = payload.logs.slice(0, 20)

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

  if (days > 0) return `${days}일 ${hours}시간 ${minutes}분`
  if (hours > 0) return `${hours}시간 ${minutes}분 ${secs}초`
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
  --panel: rgba(15, 28, 48, 0.92);
  --panel-soft: rgba(23, 41, 68, 0.76);
  --line: rgba(148, 163, 184, 0.18);
  --text: #e8f1ff;
  --muted: #92a4bd;
  --blue: #38bdf8;
  --blue-deep: #2563eb;
  --green: #22c55e;
  --yellow: #f59e0b;
  --danger: #fb7185;
  --shadow: 0 24px 70px rgba(0, 0, 0, 0.32);
}

* { box-sizing: border-box; }
html, body, #app { min-height: 100%; margin: 0; }
body {
  font-family: Inter, Pretendard, Apple SD Gothic Neo, Noto Sans KR, system-ui, sans-serif;
  background: radial-gradient(circle at top left, rgba(56, 189, 248, 0.18), transparent 34%), var(--bg);
  color: var(--text);
  overflow-y: auto;
  scrollbar-width: none;
}
body::-webkit-scrollbar, .top-menu::-webkit-scrollbar { display: none; }
button { font-family: inherit; }

.rcts-shell { min-height: 100vh; }
.top-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 18px;
  align-items: center;
  padding: 12px clamp(14px, 3vw, 28px);
  background: rgba(6, 15, 28, 0.9);
  border-bottom: 1px solid var(--line);
  backdrop-filter: blur(18px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.26);
}
.brand { display: grid; gap: 1px; min-width: max-content; }
.brand strong { font-size: 24px; letter-spacing: 0.08em; color: var(--blue); }
.brand span { font-size: 11px; color: var(--muted); }
.top-menu {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  scrollbar-width: none;
  padding: 4px;
}
.top-menu button {
  flex: 0 0 auto;
  border: 1px solid var(--line);
  background: rgba(15, 23, 42, 0.75);
  color: var(--text);
  border-radius: 999px;
  padding: 8px 13px;
  font-size: 13px;
  cursor: pointer;
}
.clock-box {
  min-width: max-content;
  display: grid;
  justify-items: end;
  gap: 2px;
}
.clock-box span { color: var(--muted); font-size: 11px; }
.clock-box strong { color: var(--blue); font-size: 15px; font-variant-numeric: tabular-nums; }

.page-body {
  width: min(1180px, calc(100% - 24px));
  margin: 0 auto;
  padding: 96px 0 60px;
  display: grid;
  gap: 18px;
}
.hero-panel, .current-panel, .group-section, .log-panel, .offline-card {
  border: 1px solid var(--line);
  background: linear-gradient(145deg, rgba(15, 28, 48, 0.94), rgba(10, 20, 36, 0.92));
  border-radius: 24px;
  box-shadow: var(--shadow);
  padding: clamp(16px, 3vw, 28px);
}
.hero-panel {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 22px;
  align-items: end;
}
.eyebrow {
  margin: 0 0 6px;
  color: var(--blue);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
h1, h2, h3, p { margin-top: 0; }
h1 { margin-bottom: 10px; font-size: clamp(28px, 5vw, 52px); line-height: 1.08; }
h2 { margin-bottom: 0; font-size: clamp(20px, 3vw, 28px); }
h3 { margin-bottom: 3px; font-size: 18px; }
.hero-text { color: var(--muted); line-height: 1.7; margin-bottom: 0; max-width: 760px; }
.hero-stats { display: grid; grid-template-columns: repeat(3, minmax(110px, 1fr)); gap: 10px; }
.hero-stats article, .active-card {
  border: 1px solid var(--line);
  background: rgba(9, 18, 32, 0.68);
  border-radius: 18px;
  padding: 14px;
}
.hero-stats span, .active-card span, .stage-meta span { color: var(--muted); font-size: 12px; }
.hero-stats strong { display: block; margin-top: 5px; font-size: 22px; }
.section-title-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 16px;
}
.section-title-row > span { color: var(--muted); font-size: 13px; text-align: right; }
.active-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 10px; }
.active-card { display: flex; justify-content: space-between; gap: 12px; align-items: center; }
.active-card strong { display: block; margin-bottom: 3px; }
.active-time { color: var(--blue); font-weight: 800; font-variant-numeric: tabular-nums; }
.empty-state { color: var(--muted); border: 1px dashed var(--line); border-radius: 16px; padding: 18px; }
.group-section { scroll-margin-top: 92px; }
.stage-list { display: grid; gap: 10px; }
.stage-card {
  border: 1px solid var(--line);
  background: rgba(9, 18, 32, 0.74);
  border-radius: 18px;
  padding: 14px;
  display: grid;
  gap: 12px;
}
.stage-card.locked { opacity: 0.48; }
.stage-card.running { border-color: rgba(56, 189, 248, 0.48); }
.stage-card.auto { border-color: rgba(34, 197, 94, 0.42); }
.stage-card.ready { border-color: rgba(245, 158, 11, 0.72); }
.stage-top-row, .stage-bottom-row, .stage-progress-row {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: center;
}
.stage-title { display: flex; gap: 12px; align-items: center; min-width: 0; }
.stage-title p { margin: 0; color: var(--muted); font-size: 13px; }
.stage-number {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: rgba(56, 189, 248, 0.14);
  color: var(--blue);
  font-weight: 900;
}
.stage-badge, .auto-chip, .run-chip {
  flex: 0 0 auto;
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 12px;
  color: var(--text);
  background: rgba(15, 23, 42, 0.8);
}
.auto-chip { color: var(--green); border-color: rgba(34, 197, 94, 0.4); }
.run-chip { color: var(--blue); border-color: rgba(56, 189, 248, 0.4); }
.progress-info { min-width: 180px; display: grid; gap: 3px; }
.progress-info span { color: var(--muted); font-size: 12px; }
.progress-track {
  flex: 1;
  height: 8px;
  border-radius: 999px;
  overflow: hidden;
  background: rgba(148, 163, 184, 0.16);
}
.progress-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--blue-deep), var(--blue));
  transition: width 0.3s ease;
}
.stage-meta { display: flex; flex-wrap: wrap; gap: 8px; }
.stage-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; justify-content: flex-end; }
.primary-action, .unlock-action, .ghost-button, .offline-card button {
  border: 0;
  border-radius: 999px;
  padding: 9px 14px;
  color: white;
  font-weight: 800;
  cursor: pointer;
}
.primary-action { background: linear-gradient(135deg, #2563eb, #38bdf8); }
.unlock-action { background: linear-gradient(135deg, #f59e0b, #f97316); }
.ghost-button { background: rgba(148, 163, 184, 0.12); color: var(--muted); border: 1px solid var(--line); }
.log-list { display: grid; gap: 8px; }
.log-list p { margin: 0; color: var(--muted); padding: 10px 0; border-bottom: 1px solid var(--line); }
.log-list span { color: var(--blue); font-weight: 800; margin-right: 8px; font-variant-numeric: tabular-nums; }
.offline-card { display: flex; justify-content: space-between; gap: 14px; align-items: center; border-color: rgba(56, 189, 248, 0.42); }
.offline-card p { color: var(--muted); margin-bottom: 0; }
.offline-results { display: flex; gap: 8px; flex-wrap: wrap; }
.offline-results span { border: 1px solid var(--line); border-radius: 999px; padding: 8px 10px; color: var(--blue); }
.offline-card button { background: var(--blue-deep); }

@media (max-width: 780px) {
  .top-header { grid-template-columns: 1fr; gap: 8px; padding: 10px 12px; }
  .brand { display: flex; gap: 8px; align-items: baseline; }
  .top-menu { order: 3; margin-inline: -4px; }
  .clock-box { justify-items: start; }
  .page-body { padding-top: 132px; width: min(100% - 16px, 1180px); }
  .hero-panel { grid-template-columns: 1fr; }
  .hero-stats { grid-template-columns: 1fr 1fr 1fr; }
  .section-title-row, .stage-top-row, .stage-bottom-row, .stage-progress-row, .offline-card { align-items: stretch; flex-direction: column; }
  .section-title-row > span { text-align: left; }
  .stage-actions { justify-content: flex-start; }
  .progress-info { min-width: 0; }
  h1 { font-size: 30px; }
}

@media (max-width: 460px) {
  .hero-stats { grid-template-columns: 1fr; }
  .stage-title { align-items: flex-start; }
  .stage-badge { align-self: flex-start; }
  .active-card { align-items: flex-start; flex-direction: column; }
}
</style>
