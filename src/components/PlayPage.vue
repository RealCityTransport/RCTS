<template>
  <main class="page">
    <header class="hero">
      <div>
        <p class="eyebrow">RCTS NETWORK</p>
        <h1>REALTIME CONTROL HUB</h1>
        <p class="desc">
          Firebase 기준 데이터를 읽고, 모든 접속자가 같은 표준시간 기반 공항 흐름을 봅니다.
        </p>
      </div>

      <div class="time-card">
        <span>STANDARD TIME</span>
        <strong>{{ worldTime }}</strong>
        <small>{{ worldStatusText }}</small>
      </div>
    </header>

    <nav class="main-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </nav>

    <section v-if="activeTab === 'operation'" class="operation-layout">
      <aside class="side-panel">
        <button
          v-for="menu in operationMenus"
          :key="menu.id"
          :class="{ active: activeOperationMenu === menu.id }"
          @click="activeOperationMenu = menu.id"
        >
          <strong>{{ menu.label }}</strong>
          <small>{{ menu.desc }}</small>
        </button>
      </aside>

      <section class="content-panel">
        <div class="section-head">
          <div>
            <p class="eyebrow">{{ currentOperation.label }}</p>
            <h2>{{ currentOperation.title }}</h2>
          </div>
          <span class="badge">READ ONLY</span>
        </div>

        <div v-if="activeOperationMenu === 'staff'" class="card-grid">
          <article v-for="dept in departments" :key="dept.id" class="manage-card">
            <span>{{ dept.label }}</span>
            <strong>{{ dept.staff }}명</strong>
            <p>{{ dept.effect }}</p>
            <button disabled>읽기 전용</button>
          </article>
        </div>

        <div v-if="activeOperationMenu === 'upgrade'" class="card-grid">
          <article v-for="upgrade in upgrades" :key="upgrade.id" class="manage-card">
            <span>{{ upgrade.label }}</span>
            <strong>Lv.{{ upgrade.level }}</strong>
            <p>{{ upgrade.effect }}</p>
            <button disabled>읽기 전용</button>
          </article>
        </div>

        <div v-if="activeOperationMenu === 'research'" class="card-grid">
          <article v-for="research in researches" :key="research.id" class="manage-card">
            <span>{{ research.label }}</span>
            <strong>{{ research.done ? '완료' : '대기' }}</strong>
            <p>{{ research.effect }}</p>
            <button disabled>읽기 전용</button>
          </article>
        </div>
      </section>
    </section>

    <section v-if="activeTab === 'facility'" class="dashboard">
      <article class="wide-card">
        <span>FACILITY SETUP</span>
        <strong>공용 세계 설정</strong>
        <p>
          시설 값은 Firebase의 airportWorld 기준 데이터를 읽어 표시합니다.
          사이트 접속자는 수정할 수 없습니다.
        </p>
      </article>

      <div class="card-grid">
        <article class="manage-card">
          <span>AIRPORT</span>
          <strong>{{ airport.gates }} Gates</strong>
          <p>활주로 {{ airport.runways }}개 · 지상차량 {{ airport.groundVehicles }}대</p>
          <button disabled>읽기 전용</button>
        </article>

        <article class="manage-card">
          <span>TRANSPORT LINE</span>
          <strong>{{ transportLines }} Lines</strong>
          <p>교통 메뉴에 표시되는 공용 이동 라인 수입니다.</p>
          <button disabled>읽기 전용</button>
        </article>

        <article class="manage-card">
          <span>PRIVATE FLIGHT</span>
          <strong>{{ privateFlights }} Flights</strong>
          <p>항공관제에 반영되는 공용 기준 편성입니다.</p>
          <button disabled>읽기 전용</button>
        </article>
      </div>
    </section>

    <section v-if="activeTab === 'transport'" class="dashboard">
      <div class="transport-tabs">
        <button
          v-for="mode in transportModes"
          :key="mode.id"
          :class="{ active: activeTransport === mode.id }"
          @click="activeTransport = mode.id"
        >
          {{ mode.label }}
        </button>
      </div>

      <article class="line-card">
        <div class="line-head">
          <div>
            <span>{{ currentTransport.type }}</span>
            <strong>{{ currentTransport.name }}</strong>
          </div>
          <p>{{ currentTransport.time }}</p>
        </div>

        <div class="line">
          <b>{{ currentTransport.from }}</b>
          <div class="track">
            <i
              v-for="item in currentTransport.count"
              :key="item"
              class="vehicle"
              :style="{
                animationDuration: currentTransport.speed,
                animationDelay: `-${item * 2}s`,
              }"
            />
          </div>
          <b>{{ currentTransport.to }}</b>
        </div>

        <p class="note">{{ currentTransport.note }}</p>
      </article>
    </section>

    <section v-if="activeTab === 'atc'" class="atc-page">
      <section class="atc-message">
        <span>LIVE ATC TRANSMISSION</span>
        <strong>{{ towerMessage.channel }}</strong>
        <p>{{ towerMessage.text }}</p>
      </section>

      <section class="atc-columns">
        <article v-for="zone in atcZones" :key="zone.id" class="atc-zone">
          <header>
            <span>{{ zone.code }}</span>
            <strong>{{ zone.label }}</strong>
          </header>

          <div class="flight-stack">
            <div
              v-for="flight in flightsByZone(zone.id)"
              :key="flight.id"
              class="flight-card"
              :class="{ fadeout: flight.fadeout }"
            >
              <div class="flight-top">
                <strong>{{ flight.code }}</strong>

                <span v-if="zone.id !== 'departure'">
                  {{ formatRemain(flight.remainingSeconds) }}
                </span>

                <span v-else>
                  {{ flight.altitude }}FT
                </span>
              </div>

              <p>{{ flight.status }}</p>
              <small>{{ flight.detail }}</small>

              <div v-if="zone.id === 'departure'" class="departure-info">
                SPD {{ flight.speed }}KT
              </div>
            </div>

            <div v-if="flightsByZone(zone.id).length === 0" class="empty-zone">
              NO TRAFFIC
            </div>
          </div>
        </article>
      </section>
    </section>
  </main>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { onValue, ref as dbRef } from 'firebase/database'
import { database } from '../firebase'

const KST_TIME_ZONE = 'Asia/Seoul'
const KST_OFFSET_MS = 9 * 60 * 60 * 1000
const MINUTE_MS = 60 * 1000
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS

const DEFAULT_AIRPORT_WORLD = {
  meta: {
    worldId: 'main-airport',
    startedAt: Date.parse('2026-05-28T00:00:00+09:00'),
    seed: 20260528,
    timeZone: 'Asia/Seoul',
    timeMode: 'readonly-standard-time',
  },
  facility: {
    transportLines: 4,
    privateFlights: 1,
    airport: {
      gates: 300,
      runways: 10,
      groundVehicles: 180,
    },
  },
  towerMessage: {
    channel: 'ATC',
    text: '공용 읽기 전용 관제 시스템 운행중.',
  },
  scheduleRule: {
    nightSpawnIntervalMinutes: 60,
    daySpawnIntervalMinutes: 30,
    scheduledCountdownMinutes: 30,
    approachMinutes: 30,
    calculationWindowHours: 12,
  },
  phaseRule: {
    arrivalMinutes: 15,
    approachControlMinutes: 10,
    towerBeforeLandingMinutes: 5,
    landingStartBeforeTouchdownMinutes: 1,
    landingMinutes: 1,
    taxiToGateMinutes: 5,
    gateApproachMinutes: 1,
    disembarkMinMinutes: 30,
    disembarkMaxMinutes: 60,
    crewDisembarkMinutes: 5,
    cleaningMinMinutes: 30,
    cleaningMaxMinutes: 60,
    crewBoardingMinutes: 5,
    boardingMinMinutes: 30,
    boardingMaxMinutes: 60,
    pushbackMinutes: 3,
    taxiToRunwayMinutes: 5,
    climbRateFtPerSecond: 250,
    nextTakeoffAltitudeFt: 5000,
    departureExitAltitudeFt: 13000,
  },
}

const activeTab = ref('operation')
const activeOperationMenu = ref('staff')
const activeTransport = ref('rail')
const worldTime = ref('')
const worldStatusText = ref('Firebase 연결중')
const airportWorld = ref(null)
const serverTimeOffset = ref(0)
const activeFlights = ref([])

let timeTimer = null
let unsubscribeWorld = null
let unsubscribeServerOffset = null

const tabs = [
  { id: 'operation', label: '운영' },
  { id: 'facility', label: '시설' },
  { id: 'transport', label: '교통' },
  { id: 'atc', label: '항공관제' },
]

const operationMenus = [
  {
    id: 'staff',
    label: '직원 배치',
    title: 'Staff Assignment',
    desc: '공용 기준 상태',
    badge: 'READ',
  },
  {
    id: 'upgrade',
    label: '업글',
    title: 'Operation Upgrade',
    desc: '읽기 전용 설정',
    badge: 'LOCKED',
  },
  {
    id: 'research',
    label: '연구',
    title: 'Research Lab',
    desc: '개발환경 수정 전용',
    badge: 'CONFIG',
  },
]

const departments = [
  {
    id: 'airport',
    label: '공항 관제',
    staff: 0,
    effect: '도착예정, 도착, 접근, 착륙, 게이트, 출발 흐름을 표준시간 기준으로 표시합니다.',
  },
  {
    id: 'ground',
    label: '지상 운영',
    staff: 0,
    effect: '지상이동, 게이트 접근, 푸시백, 택싱 흐름을 계산해 표시합니다.',
  },
  {
    id: 'rail',
    label: '철도 운영',
    staff: 0,
    effect: '교통 라인은 관람형 이동 흐름으로 표시됩니다.',
  },
  {
    id: 'system',
    label: '시스템',
    staff: 0,
    effect: 'Firebase 읽기 전용 기준 데이터와 서버 시간 보정을 사용합니다.',
  },
]

const upgrades = [
  {
    id: 'auto',
    label: '자동 처리',
    level: 1,
    effect: '표준시간 기준으로 항공기 위치와 단계를 자동 계산합니다.',
  },
  {
    id: 'gate',
    label: '게이트 회전',
    level: 1,
    effect: '하차, 청소, 보딩 시간을 seed 기반으로 고정 계산합니다.',
  },
  {
    id: 'ground',
    label: '지상차량 운용',
    level: 1,
    effect: '게이트 이동과 활주로 이동 시간이 공용 규칙으로 적용됩니다.',
  },
]

const researches = [
  {
    id: 'predict',
    label: '예측 운영',
    done: false,
    effect: '현재 시간 기준으로 필요한 항공기 흐름만 표시합니다.',
  },
  {
    id: 'density',
    label: '밀도 제어',
    done: false,
    effect: '00~05시는 1시간, 그 외 시간은 30분 간격으로 도착예정을 생성합니다.',
  },
  {
    id: 'radar',
    label: '관제 패널',
    done: false,
    effect: '도착 예정, 도착, 접근, 착륙, 지상, 게이트, 출발 구역을 분리 표시합니다.',
  },
]

const transportModes = [
  { id: 'rail', label: '철도' },
  { id: 'bus', label: '버스' },
  { id: 'air', label: '항공' },
  { id: 'ship', label: '선박' },
]

const transportData = {
  rail: {
    type: 'RAIL LINE',
    name: 'SEOUL ↔ BUSAN',
    from: 'SEOUL',
    to: 'BUSAN',
    time: '이동시간 2시간 40분',
    note: '시간에 따라 차량이 라인 위를 왕복하는 교통 흐름입니다.',
    count: 2,
    speed: '9s',
  },
  bus: {
    type: 'BUS LINE',
    name: 'CITY LOOP',
    from: 'STOP A',
    to: 'STOP B',
    time: '이동시간 38분',
    note: '정류장 순서와 거리 기반으로 흐르는 도로 교통입니다.',
    count: 3,
    speed: '7s',
  },
  air: {
    type: 'AIR ROUTE',
    name: 'ICN ↔ NRT',
    from: 'ICN',
    to: 'NRT',
    time: '이동시간 2시간 10분',
    note: '항공관제와 별개로 공항 간 이동 흐름만 표시합니다.',
    count: 1,
    speed: '12s',
  },
  ship: {
    type: 'SHIP ROUTE',
    name: 'INCHEON ↔ JEJU',
    from: 'INCHEON',
    to: 'JEJU',
    time: '이동시간 2일',
    note: '선박은 느린 이동과 접안 대기 흐름이 중심입니다.',
    count: 1,
    speed: '18s',
  },
}

const atcZones = [
  { id: 'scheduled', code: 'SCHEDULED', label: '도착 예정' },
  { id: 'arrival', code: 'ARRIVAL', label: '도착 흐름' },
  { id: 'approach', code: 'APPROACH', label: '접근 관제' },
  { id: 'tower', code: 'TOWER', label: '관제탑' },
  { id: 'landing', code: 'LANDING', label: '착륙' },
  { id: 'ground', code: 'GROUND', label: '지상 관제' },
  { id: 'gate', code: 'GATE', label: '게이트' },
  { id: 'departure', code: 'DEPARTURE', label: '출발 관제' },
]

const currentOperation = computed(() => {
  return operationMenus.find((menu) => menu.id === activeOperationMenu.value) || operationMenus[0]
})

const currentTransport = computed(() => transportData[activeTransport.value])

const worldConfig = computed(() => {
  return deepMerge(DEFAULT_AIRPORT_WORLD, airportWorld.value || {})
})

const airport = computed(() => {
  return worldConfig.value.facility.airport
})

const transportLines = computed(() => {
  return worldConfig.value.facility.transportLines
})

const privateFlights = computed(() => {
  return worldConfig.value.facility.privateFlights
})

const towerMessage = computed(() => {
  const priorityFlight =
    activeFlights.value.find((flight) => flight.zone === 'landing') ||
    activeFlights.value.find((flight) => flight.zone === 'departure') ||
    activeFlights.value.find((flight) => flight.zone === 'tower') ||
    activeFlights.value.find((flight) => flight.zone === 'approach') ||
    activeFlights.value.find((flight) => flight.zone === 'scheduled') ||
    activeFlights.value.find((flight) => flight.zone === 'gate')

  if (priorityFlight) {
    return {
      channel: priorityFlight.channel,
      text: `${priorityFlight.code} ${priorityFlight.status} · ${priorityFlight.detail}`,
    }
  }

  return worldConfig.value.towerMessage
})

function deepMerge(base, override) {
  const output = { ...base }

  Object.keys(override || {}).forEach((key) => {
    const baseValue = base?.[key]
    const overrideValue = override[key]

    if (
      baseValue &&
      overrideValue &&
      typeof baseValue === 'object' &&
      typeof overrideValue === 'object' &&
      !Array.isArray(baseValue) &&
      !Array.isArray(overrideValue)
    ) {
      output[key] = deepMerge(baseValue, overrideValue)
      return
    }

    output[key] = overrideValue
  })

  return output
}

function getStandardNow() {
  return Date.now() + serverTimeOffset.value
}

function updateTime() {
  const now = new Date(getStandardNow())

  worldTime.value = now.toLocaleTimeString('ko-KR', {
    timeZone: KST_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  worldStatusText.value = airportWorld.value ? '공용 기준 운행중' : '기본값 운행중'
}

function formatRemain(totalSeconds) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds))

  if (safeSeconds < 60) {
    return `${safeSeconds}S`
  }

  return `${Math.ceil(safeSeconds / 60)}M`
}

function toSeconds(minutes) {
  return Math.floor(Number(minutes || 0) * 60)
}

function toMs(minutes) {
  return Number(minutes || 0) * MINUTE_MS
}

function getKstParts(ms) {
  const date = new Date(ms + KST_OFFSET_MS)

  return {
    day: date.getUTCDay(),
    hour: date.getUTCHours(),
    minute: date.getUTCMinutes(),
  }
}

function getKstDayStartMs(ms) {
  return Math.floor((ms + KST_OFFSET_MS) / DAY_MS) * DAY_MS - KST_OFFSET_MS
}

function isNightArrivalHour(hour) {
  return hour >= 0 && hour < 6
}

function getSpawnIntervalMinutesByHour(hour) {
  const config = worldConfig.value
  const rule = config.scheduleRule

  if (isNightArrivalHour(hour)) {
    return Number(rule.nightSpawnIntervalMinutes || 60)
  }

  return Number(rule.daySpawnIntervalMinutes || rule.spawnIntervalMinutes || 30)
}

function hashNumber(...parts) {
  const source = parts.join(':')
  let hash = 2166136261

  for (let index = 0; index < source.length; index++) {
    hash ^= source.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return hash >>> 0
}

function seededRandom(...parts) {
  return hashNumber(...parts) / 4294967295
}

function seededRangeSeconds(minMinutes, maxMinutes, ...parts) {
  const min = toSeconds(minMinutes)
  const max = toSeconds(maxMinutes)
  const value = seededRandom(...parts)

  return Math.floor(min + value * (max - min + 1))
}

function makeFlightCode(flightIndex) {
  const seed = worldConfig.value.meta.seed
  const prefixes = ['KE', 'OZ', '7C', 'TW', 'LJ', 'BX', 'ZE', 'RS', 'YP', 'RF']
  const prefix = prefixes[hashNumber(seed, flightIndex, 'prefix') % prefixes.length]
  const number = 100 + (hashNumber(seed, flightIndex, 'number') % 900)

  return `${prefix}${number}`
}

function secondsUntil(targetAt, now) {
  return Math.max(0, Math.ceil((targetAt - now) / 1000))
}

function generateSpawnTimes(windowStartAt, windowEndAt, startedAt) {
  const times = []
  const startDayAt = getKstDayStartMs(windowStartAt - DAY_MS)
  const endDayAt = getKstDayStartMs(windowEndAt + DAY_MS)

  for (let dayAt = startDayAt; dayAt <= endDayAt; dayAt += DAY_MS) {
    for (let hour = 0; hour < 24; hour++) {
      const intervalMinutes = getSpawnIntervalMinutesByHour(hour)
      const safeInterval = Math.max(1, Math.min(60, intervalMinutes))

      for (let minute = 0; minute < 60; minute += safeInterval) {
        const spawnAt = dayAt + hour * HOUR_MS + minute * MINUTE_MS

        if (spawnAt < startedAt) {
          continue
        }

        if (spawnAt < windowStartAt || spawnAt > windowEndAt) {
          continue
        }

        times.push(spawnAt)
      }
    }
  }

  return times.sort((a, b) => a - b)
}

function makeTimeline(flightIndex, spawnAt, runwayState) {
  const config = worldConfig.value
  const rule = config.phaseRule
  const seed = config.meta.seed

  const arrivalMinutes = Number(rule.arrivalMinutes || 15)
  const approachControlMinutes = Number(rule.approachControlMinutes || 10)
  const approachMinutes = Number(config.scheduleRule.approachMinutes || 30)
  const towerBeforeLandingMinutes = Number(rule.towerBeforeLandingMinutes || 5)
  const landingStartBeforeTouchdownMinutes = Number(rule.landingStartBeforeTouchdownMinutes || 1)

  const scheduledStartAt = spawnAt - toMs(
    config.scheduleRule.scheduledCountdownMinutes ||
      config.scheduleRule.scheduledWindowMinutes ||
      30,
  )
  const arrivalEndAt = spawnAt + toMs(arrivalMinutes)
  const approachEndAt = arrivalEndAt + toMs(approachControlMinutes)
  const plannedTouchdownAt = spawnAt + toMs(approachMinutes)
  const towerStartAt = plannedTouchdownAt - toMs(towerBeforeLandingMinutes)
  const landingStartAt = plannedTouchdownAt - toMs(landingStartBeforeTouchdownMinutes)
  const landingEndAt = landingStartAt + toMs(rule.landingMinutes)

  const taxiToGateStartAt = landingEndAt
  const gateApproachDelayMinutes = Math.max(
    0,
    Number(rule.taxiToGateMinutes || 5) - Number(rule.gateApproachMinutes || 1),
  )
  const gateApproachStartAt = taxiToGateStartAt + toMs(gateApproachDelayMinutes)
  const gateArrivalAt = taxiToGateStartAt + toMs(rule.taxiToGateMinutes)

  const disembarkSeconds = seededRangeSeconds(
    rule.disembarkMinMinutes,
    rule.disembarkMaxMinutes,
    seed,
    flightIndex,
    'disembark',
  )

  const cleaningSeconds = seededRangeSeconds(
    rule.cleaningMinMinutes,
    rule.cleaningMaxMinutes,
    seed,
    flightIndex,
    'cleaning',
  )

  const boardingSeconds = seededRangeSeconds(
    rule.boardingMinMinutes,
    rule.boardingMaxMinutes,
    seed,
    flightIndex,
    'boarding',
  )

  const disembarkEndAt = gateArrivalAt + disembarkSeconds * 1000
  const crewDisembarkEndAt = disembarkEndAt + toMs(rule.crewDisembarkMinutes)
  const cleaningEndAt = crewDisembarkEndAt + cleaningSeconds * 1000
  const crewBoardingEndAt = cleaningEndAt + toMs(rule.crewBoardingMinutes)
  const boardingEndAt = crewBoardingEndAt + boardingSeconds * 1000
  const pushbackEndAt = boardingEndAt + toMs(rule.pushbackMinutes)
  const taxiToRunwayEndAt = pushbackEndAt + toMs(rule.taxiToRunwayMinutes)

  const climbRate = Number(rule.climbRateFtPerSecond || 250)
  const nextTakeoffAltitude = Number(rule.nextTakeoffAltitudeFt || 5000)
  const departureExitAltitude = Number(rule.departureExitAltitudeFt || 13000)

  const takeoffStartAt = Math.max(taxiToRunwayEndAt, runwayState.nextTakeoffAvailableAt)
  const nextTakeoffAvailableAt = takeoffStartAt + Math.ceil(nextTakeoffAltitude / climbRate) * 1000
  const exitAt = takeoffStartAt + Math.ceil(departureExitAltitude / climbRate) * 1000

  runwayState.nextTakeoffAvailableAt = nextTakeoffAvailableAt

  return {
    id: `flight_${flightIndex}`,
    index: flightIndex,
    code: makeFlightCode(flightIndex),
    scheduledStartAt,
    spawnAt,
    arrivalEndAt,
    approachEndAt,
    towerStartAt,
    plannedTouchdownAt,
    landingStartAt,
    landingEndAt,
    taxiToGateStartAt,
    gateApproachStartAt,
    gateArrivalAt,
    disembarkEndAt,
    crewDisembarkEndAt,
    cleaningEndAt,
    crewBoardingEndAt,
    boardingEndAt,
    pushbackEndAt,
    taxiToRunwayEndAt,
    takeoffStartAt,
    nextTakeoffAvailableAt,
    exitAt,
  }
}

function makeFlightView(timeline, now) {
  const rule = worldConfig.value.phaseRule
  const climbRate = Number(rule.climbRateFtPerSecond || 250)
  const departureExitAltitude = Number(rule.departureExitAltitudeFt || 13000)

  const base = {
    id: timeline.id,
    code: timeline.code,
    flow: 'arrival',
    zone: 'arrival',
    remainingSeconds: 0,
    status: '',
    detail: '',
    altitude: 0,
    speed: 0,
    fadeout: false,
    channel: 'ATC',
  }

  if (now < timeline.scheduledStartAt || now >= timeline.exitAt) {
    return null
  }

  if (now < timeline.spawnAt) {
    return {
      ...base,
      zone: 'scheduled',
      status: 'SCHEDULED ARRIVAL',
      detail: '도착 예정 · 30분 카운트다운',
      remainingSeconds: secondsUntil(timeline.spawnAt, now),
      channel: 'SCHEDULED',
    }
  }

  if (now < timeline.arrivalEndAt) {
    return {
      ...base,
      zone: 'arrival',
      status: 'ARRIVAL FLOW ACTIVE',
      detail: '도착 흐름 15분',
      remainingSeconds: secondsUntil(timeline.arrivalEndAt, now),
      channel: 'ARRIVAL',
    }
  }

  if (now < timeline.approachEndAt) {
    return {
      ...base,
      zone: 'approach',
      status: 'CONTACT APPROACH',
      detail: '접근 관제 10분',
      remainingSeconds: secondsUntil(timeline.approachEndAt, now),
      channel: 'APPROACH',
    }
  }

  if (now < timeline.landingStartAt) {
    return {
      ...base,
      zone: 'tower',
      status: 'TOWER FINAL',
      detail: '관제탑 · 착륙 5분 전 구간',
      remainingSeconds: secondsUntil(timeline.landingStartAt, now),
      channel: 'TOWER',
    }
  }

  if (now < timeline.landingEndAt) {
    return {
      ...base,
      zone: 'landing',
      status: 'LANDING',
      detail: '관제탑 1분 시점 · 착륙 전환',
      remainingSeconds: secondsUntil(timeline.landingEndAt, now),
      channel: 'TOWER',
    }
  }

  if (now < timeline.gateApproachStartAt) {
    return {
      ...base,
      zone: 'ground',
      status: 'TAXI TO GATE',
      detail: '지상이동 5분 · 게이트 이동',
      remainingSeconds: secondsUntil(timeline.gateApproachStartAt, now),
      channel: 'GROUND',
    }
  }

  if (now < timeline.gateArrivalAt) {
    return {
      ...base,
      zone: 'gate',
      status: 'APPROACHING GATE',
      detail: '게이트 도착 1분 전 · 램프 이동',
      remainingSeconds: secondsUntil(timeline.gateArrivalAt, now),
      channel: 'RAMP',
    }
  }

  if (now < timeline.disembarkEndAt) {
    return {
      ...base,
      zone: 'gate',
      status: 'PASSENGER DISEMBARKING',
      detail: '게이트 도착 · 승객 하차 30~60분',
      remainingSeconds: secondsUntil(timeline.disembarkEndAt, now),
      channel: 'GATE',
    }
  }

  if (now < timeline.crewDisembarkEndAt) {
    return {
      ...base,
      zone: 'gate',
      status: 'CREW DISEMBARKING',
      detail: '승무원 하차 5분',
      remainingSeconds: secondsUntil(timeline.crewDisembarkEndAt, now),
      channel: 'GATE',
    }
  }

  if (now < timeline.cleaningEndAt) {
    return {
      ...base,
      zone: 'gate',
      status: 'AIRCRAFT CLEANING',
      detail: '청소 30~60분',
      remainingSeconds: secondsUntil(timeline.cleaningEndAt, now),
      channel: 'GATE',
    }
  }

  if (now < timeline.crewBoardingEndAt) {
    return {
      ...base,
      flow: 'departure',
      zone: 'gate',
      status: 'CREW BOARDING',
      detail: '다음 출발편 승무원 승차 5분',
      remainingSeconds: secondsUntil(timeline.crewBoardingEndAt, now),
      channel: 'GATE',
    }
  }

  if (now < timeline.boardingEndAt) {
    return {
      ...base,
      flow: 'departure',
      zone: 'gate',
      status: 'PASSENGER BOARDING',
      detail: '보딩 30~60분',
      remainingSeconds: secondsUntil(timeline.boardingEndAt, now),
      channel: 'GATE',
    }
  }

  if (now < timeline.pushbackEndAt) {
    return {
      ...base,
      flow: 'departure',
      zone: 'gate',
      status: 'PUSHBACK AND ENGINE START',
      detail: '푸시백 3분 · 엔진스타트',
      remainingSeconds: secondsUntil(timeline.pushbackEndAt, now),
      channel: 'RAMP',
    }
  }

  if (now < timeline.taxiToRunwayEndAt) {
    return {
      ...base,
      flow: 'departure',
      zone: 'ground',
      status: 'TAXI TO RWY',
      detail: '택싱 5분 · 활주로 이동',
      remainingSeconds: secondsUntil(timeline.taxiToRunwayEndAt, now),
      channel: 'GROUND',
    }
  }

  if (now < timeline.takeoffStartAt) {
    return {
      ...base,
      flow: 'departure',
      zone: 'ground',
      status: 'DEPARTURE SEQUENCE',
      detail: '선행기 5000FT 통과 후 즉시 가속',
      remainingSeconds: secondsUntil(timeline.takeoffStartAt, now),
      channel: 'GROUND',
    }
  }

  const airborneElapsedSeconds = Math.max(0, Math.floor((now - timeline.takeoffStartAt) / 1000))
  const altitude = Math.min(departureExitAltitude, airborneElapsedSeconds * climbRate)
  const speed = Math.min(480, 160 + airborneElapsedSeconds * 8)
  const leavingSoon = timeline.exitAt - now < 3000

  return {
    ...base,
    flow: 'departure',
    zone: 'departure',
    status: altitude < 1000 ? 'TAKEOFF ROLL' : 'CLIMBING',
    detail: '이륙 가속 · 13000FT 도달 시 관제 이탈',
    remainingSeconds: secondsUntil(timeline.exitAt, now),
    altitude,
    speed,
    fadeout: leavingSoon,
    channel: 'DEPARTURE',
  }
}

function rebuildAirportByStandardTime() {
  const now = getStandardNow()
  const config = worldConfig.value
  const startedAt = Number(config.meta.startedAt) || DEFAULT_AIRPORT_WORLD.meta.startedAt
  const scheduledCountdownMs = toMs(
    config.scheduleRule.scheduledCountdownMinutes ||
      config.scheduleRule.scheduledWindowMinutes ||
      30,
  )
  const windowHours = Number(config.scheduleRule.calculationWindowHours || 12)
  const windowStartAt = Math.max(startedAt, now - windowHours * HOUR_MS)
  const windowEndAt = now + scheduledCountdownMs

  if (windowEndAt < startedAt) {
    activeFlights.value = []
    return
  }

  const spawnTimes = generateSpawnTimes(windowStartAt, windowEndAt, startedAt)

  const runwayState = {
    nextTakeoffAvailableAt: windowStartAt,
  }

  const timelines = spawnTimes.map((spawnAt) => {
    const flightIndex = Math.floor(spawnAt / MINUTE_MS)
    return makeTimeline(flightIndex, spawnAt, runwayState)
  })

  activeFlights.value = timelines
    .map((timeline) => makeFlightView(timeline, now))
    .filter(Boolean)
}

function flightsByZone(zoneId) {
  return activeFlights.value
    .filter((flight) => flight.zone === zoneId)
    .sort((a, b) => {
      if (zoneId === 'departure') {
        return a.altitude - b.altitude
      }

      return a.remainingSeconds - b.remainingSeconds
    })
}

function subscribeAirportWorld() {
  const worldRef = dbRef(database, 'airportWorld')

  unsubscribeWorld = onValue(worldRef, (snapshot) => {
    airportWorld.value = snapshot.val()
    rebuildAirportByStandardTime()
  })
}

function subscribeServerTimeOffset() {
  const offsetRef = dbRef(database, '.info/serverTimeOffset')

  unsubscribeServerOffset = onValue(offsetRef, (snapshot) => {
    serverTimeOffset.value = snapshot.val() || 0
    updateTime()
    rebuildAirportByStandardTime()
  })
}

function runClockTick() {
  updateTime()
  rebuildAirportByStandardTime()
}

onMounted(() => {
  subscribeAirportWorld()
  subscribeServerTimeOffset()

  runClockTick()

  timeTimer = setInterval(() => {
    runClockTick()
  }, 1000)
})

onUnmounted(() => {
  if (typeof unsubscribeWorld === 'function') {
    unsubscribeWorld()
  }

  if (typeof unsubscribeServerOffset === 'function') {
    unsubscribeServerOffset()
  }

  clearInterval(timeTimer)
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  overflow-y: auto;
  padding: 28px;
  color: #edf8ff;
  background:
    radial-gradient(circle at 12% 8%, rgba(58, 179, 255, 0.2), transparent 34%),
    radial-gradient(circle at 92% 90%, rgba(90, 80, 255, 0.18), transparent 36%),
    #071018;
  font-family: Pretendard, Inter, system-ui, sans-serif;
}

.page,
.flight-stack,
.main-tabs,
.transport-tabs {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.page::-webkit-scrollbar,
.flight-stack::-webkit-scrollbar,
.main-tabs::-webkit-scrollbar,
.transport-tabs::-webkit-scrollbar {
  display: none;
}

.hero,
.content-panel,
.side-panel,
.manage-card,
.wide-card,
.line-card,
.time-card,
.atc-message,
.atc-zone {
  border: 1px solid rgba(132, 219, 255, 0.16);
  background: rgba(9, 23, 35, 0.78);
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.32);
  backdrop-filter: blur(18px);
}

.hero {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  padding: 28px;
  border-radius: 30px;
}

.eyebrow {
  margin: 0 0 8px;
  color: #76dfff;
  font-size: 12px;
  letter-spacing: 0.18em;
}

h1,
h2,
p {
  margin: 0;
}

h1 {
  max-width: 900px;
  font-size: clamp(38px, 6vw, 78px);
  line-height: 0.9;
  letter-spacing: -0.055em;
}

.desc {
  margin-top: 14px;
  color: #a4bfce;
}

.time-card {
  min-width: 170px;
  align-self: center;
  padding: 18px;
  border-radius: 22px;
  text-align: right;
}

.time-card span,
.time-card small,
.manage-card span,
.wide-card span,
.line-head span,
.atc-message span {
  display: block;
  color: #84aebe;
  font-size: 12px;
  letter-spacing: 0.13em;
}

.time-card strong {
  display: block;
  margin-top: 8px;
  font-size: 32px;
}

.time-card small {
  margin-top: 8px;
}

.main-tabs,
.transport-tabs {
  display: flex;
  gap: 10px;
  margin: 18px 0;
  overflow-x: auto;
}

button {
  cursor: pointer;
  border: 0;
  border-radius: 15px;
  padding: 12px 16px;
  color: #ddf6ff;
  background: rgba(255, 255, 255, 0.075);
  font-weight: 900;
}

button:hover,
button.active {
  color: #061018;
  background: #76dfff;
}

button:disabled {
  cursor: default;
  color: #9eb8c8;
  background: rgba(255, 255, 255, 0.045);
  opacity: 0.55;
}

.operation-layout {
  display: grid;
  grid-template-columns: 270px 1fr;
  gap: 18px;
}

.side-panel {
  display: grid;
  gap: 10px;
  padding: 14px;
  border-radius: 26px;
}

.side-panel button {
  text-align: left;
}

.side-panel small {
  display: block;
  margin-top: 4px;
  color: #8baabb;
}

.content-panel {
  min-height: 420px;
  padding: 22px;
  border-radius: 30px;
}

.section-head {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: center;
  margin-bottom: 18px;
}

.badge {
  border-radius: 999px;
  padding: 9px 13px;
  color: #061018;
  background: #76dfff;
  font-weight: 900;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
}

.manage-card,
.wide-card {
  padding: 20px;
  border-radius: 24px;
}

.manage-card strong,
.wide-card strong {
  display: block;
  margin: 10px 0;
  font-size: 30px;
}

.manage-card p,
.wide-card p,
.note {
  color: #a4bfce;
}

.manage-card button {
  margin-top: 16px;
}

.wide-card {
  margin-bottom: 16px;
}

.line-card {
  padding: 24px;
  border-radius: 28px;
}

.line-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 30px;
}

.line-head strong {
  display: block;
  margin-top: 6px;
  font-size: 30px;
}

.line {
  display: grid;
  grid-template-columns: 96px 1fr 96px;
  gap: 16px;
  align-items: center;
}

.line b {
  color: #76dfff;
  text-align: center;
}

.track {
  position: relative;
  height: 9px;
  border-radius: 999px;
  background: rgba(118, 223, 255, 0.16);
  overflow: hidden;
}

.vehicle {
  position: absolute;
  top: -7px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #76dfff;
  box-shadow: 0 0 22px rgba(118, 223, 255, 0.95);
  animation-name: move;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}

@keyframes move {
  from {
    left: -30px;
  }

  to {
    left: 100%;
  }
}

.note {
  margin-top: 24px;
}

.atc-page {
  display: grid;
  gap: 18px;
  padding-bottom: 80px;
}

.atc-message {
  padding: 18px 22px;
  border-radius: 24px;
}

.atc-message strong {
  display: block;
  margin: 8px 0;
  color: #76dfff;
  font-size: 22px;
}

.atc-message p {
  font-size: 18px;
}

.atc-columns {
  display: grid;
  grid-template-columns: repeat(4, minmax(190px, 1fr));
  gap: 12px;
}

.atc-zone {
  min-height: 300px;
  border-radius: 24px;
  overflow: hidden;
}

.atc-zone header {
  padding: 14px;
  border-bottom: 1px solid rgba(132, 219, 255, 0.12);
}

.atc-zone header span {
  display: block;
  color: #76dfff;
  font-size: 12px;
  letter-spacing: 0.12em;
}

.atc-zone header strong {
  display: block;
  margin-top: 4px;
}

.flight-stack {
  display: grid;
  gap: 10px;
  max-height: 520px;
  padding: 12px;
  overflow-y: auto;
}

.flight-card {
  padding: 12px;
  border: 1px solid rgba(118, 223, 255, 0.22);
  border-radius: 18px;
  background: rgba(118, 223, 255, 0.08);
  transition: 2.5s;
}

.flight-card.fadeout {
  opacity: 0;
  transform: translateY(90px);
}

.flight-top {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.flight-top strong {
  color: #ffffff;
  font-size: 18px;
}

.flight-top span {
  color: #76dfff;
  font-weight: 900;
}

.flight-card p {
  margin-top: 8px;
  font-weight: 900;
}

.flight-card small {
  display: block;
  margin-top: 4px;
  color: #9eb8c8;
}

.departure-info {
  margin-top: 8px;
  color: #76dfff;
  font-size: 13px;
}

.empty-zone {
  padding: 18px 10px;
  border-radius: 16px;
  color: #557184;
  background: rgba(255, 255, 255, 0.035);
  text-align: center;
  font-size: 12px;
  letter-spacing: 0.1em;
}

@media (max-width: 1100px) {
  .atc-columns {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 900px) {
  .page {
    padding: 14px;
  }

  .hero,
  .section-head,
  .line-head {
    flex-direction: column;
    align-items: stretch;
  }

  .time-card {
    text-align: left;
  }

  .operation-layout,
  .card-grid {
    grid-template-columns: 1fr;
  }

  .line {
    grid-template-columns: 72px 1fr 72px;
  }
}

@media (max-width: 680px) {
  .atc-columns {
    grid-template-columns: 1fr;
  }

  .flight-stack {
    max-height: 430px;
  }
}
</style>