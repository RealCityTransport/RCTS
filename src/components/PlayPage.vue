<template>
  <main class="page">
    <header class="hero">
      <div>
        <p class="eyebrow">RCTS NETWORK</p>
        <h1>REALTIME CONTROL HUB</h1>
        <p class="desc">운영에서 세계를 조정하고, 교통과 항공관제는 그 결과를 보여줍니다.</p>
      </div>

      <div class="time-card">
        <span>STANDARD TIME</span>
        <strong>{{ worldTime }}</strong>
        <small>1초 = 1틱</small>
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
          <span class="badge">{{ currentOperation.badge }}</span>
        </div>

        <div v-if="activeOperationMenu === 'staff'" class="card-grid">
          <article v-for="dept in departments" :key="dept.id" class="manage-card">
            <span>{{ dept.label }}</span>
            <strong>{{ dept.staff }}명</strong>
            <p>{{ dept.effect }}</p>
            <button @click="assignStaff(dept.id)">직원 배치</button>
          </article>
        </div>

        <div v-if="activeOperationMenu === 'upgrade'" class="card-grid">
          <article v-for="upgrade in upgrades" :key="upgrade.id" class="manage-card">
            <span>{{ upgrade.label }}</span>
            <strong>Lv.{{ upgrade.level }}</strong>
            <p>{{ upgrade.effect }}</p>
            <button @click="upgrade.level++">업글</button>
          </article>
        </div>

        <div v-if="activeOperationMenu === 'research'" class="card-grid">
          <article v-for="research in researches" :key="research.id" class="manage-card">
            <span>{{ research.label }}</span>
            <strong>{{ research.done ? '완료' : '대기' }}</strong>
            <p>{{ research.effect }}</p>
            <button :disabled="research.done" @click="research.done = true">
              연구 시작
            </button>
          </article>
        </div>
      </section>
    </section>

    <section v-if="activeTab === 'facility'" class="dashboard">
      <article class="wide-card">
        <span>FACILITY SETUP</span>
        <strong>사용자 전용 세계 설정</strong>
        <p>교통 라인, 공항 규모, 사용자 전용 항공편성을 여기서 늘립니다.</p>
      </article>

      <div class="card-grid">
        <article class="manage-card">
          <span>AIRPORT</span>
          <strong>{{ airport.gates }} Gates</strong>
          <p>활주로 {{ airport.runways }}개 · 지상차량 {{ airport.groundVehicles }}대</p>
          <button @click="airport.gates += 10">게이트 +10</button>
        </article>

        <article class="manage-card">
          <span>TRANSPORT LINE</span>
          <strong>{{ transportLines }} Lines</strong>
          <p>교통 메뉴에 표시되는 이동 라인 수입니다.</p>
          <button @click="transportLines++">라인 추가</button>
        </article>

        <article class="manage-card">
          <span>PRIVATE FLIGHT</span>
          <strong>{{ privateFlights }} Flights</strong>
          <p>항공관제에 투입될 사용자 전용 항공편성입니다.</p>
          <button @click="addPrivateFlight">편성 추가</button>
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
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'

const SAVE_KEY = 'airport-observer-local-save-v1'

const activeTab = ref('operation')
const activeOperationMenu = ref('staff')
const activeTransport = ref('rail')
const worldTime = ref('')

const towerMessage = ref({
  channel: 'ATC',
  text: '공항관제 자동 시스템 대기중.',
})

const transportLines = ref(4)
const privateFlights = ref(1)
const activeFlights = ref([])

let timeTimer = null
let flightTimer = null
let spawnTimer = null
let autoSaveTimer = null
let flightId = 0

const tabs = [
  { id: 'operation', label: '운영' },
  { id: 'facility', label: '시설' },
  { id: 'transport', label: '교통' },
  { id: 'atc', label: '항공관제' },
]

const operationMenus = [
  { id: 'staff', label: '직원 배치', title: 'Staff Assignment', desc: '자동 커버 범위', badge: 'CORE' },
  { id: 'upgrade', label: '업글', title: 'Operation Upgrade', desc: '처리 능력 향상', badge: 'LEVEL' },
  { id: 'research', label: '연구', title: 'Research Lab', desc: '새 운영 방식', badge: 'UNLOCK' },
]

const departments = reactive([
  { id: 'airport', label: '공항 관제', staff: 0, effect: '착륙/이륙/게이트 자동 처리 범위 증가' },
  { id: 'ground', label: '지상 운영', staff: 0, effect: '지상차량 이동, 게이트 회전율 안정화' },
  { id: 'rail', label: '철도 운영', staff: 0, effect: '플랫폼 갱신과 라인 흐름 안정화' },
  { id: 'system', label: '시스템', staff: 0, effect: '자동 처리 간격과 로그 안정화' },
])

const upgrades = reactive([
  { id: 'auto', label: '자동 처리', level: 1, effect: '관제 자동 처리 속도 증가' },
  { id: 'gate', label: '게이트 회전', level: 1, effect: '게이트 점유 지연 감소' },
  { id: 'ground', label: '지상차량 운용', level: 1, effect: '지원 차량 사전 이동 효율 증가' },
])

const researches = reactive([
  { id: 'predict', label: '예측 운영', done: false, effect: '항공기 도착 전 지상차량 사전 이동' },
  { id: 'density', label: '밀도 제어', done: false, effect: '교통 흐름 표시량 조정' },
  { id: 'radar', label: '관제 패널', done: false, effect: '항공관제 패널 강화' },
])

const airport = reactive({
  gates: 300,
  runways: 10,
  groundVehicles: 180,
})

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

function saveGame(showMessage = false) {
  try {
    const saveData = {
      activeTab: activeTab.value,
      activeOperationMenu: activeOperationMenu.value,
      activeTransport: activeTransport.value,
      towerMessage: towerMessage.value,
      transportLines: transportLines.value,
      privateFlights: privateFlights.value,
      activeFlights: activeFlights.value,
      flightId,
      departments: departments.map((item) => ({
        id: item.id,
        staff: item.staff,
      })),
      upgrades: upgrades.map((item) => ({
        id: item.id,
        level: item.level,
      })),
      researches: researches.map((item) => ({
        id: item.id,
        done: item.done,
      })),
      airport: {
        gates: airport.gates,
        runways: airport.runways,
        groundVehicles: airport.groundVehicles,
      },
      savedAt: Date.now(),
    }

    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData))

    if (showMessage) {
      updateTowerMessage('SAVE', '현재 진행 상황이 로컬에 저장되었습니다.')
    }

    return true
  } catch (error) {
    console.error('로컬 저장 실패:', error)

    if (showMessage) {
      updateTowerMessage('SAVE ERROR', '로컬 저장에 실패했습니다.')
    }

    return false
  }
}

function loadGame(showMessage = false) {
  try {
    const rawSave = localStorage.getItem(SAVE_KEY)

    if (!rawSave) {
      return false
    }

    const saveData = JSON.parse(rawSave)

    activeTab.value = saveData.activeTab || 'operation'
    activeOperationMenu.value = saveData.activeOperationMenu || 'staff'
    activeTransport.value = saveData.activeTransport || 'rail'

    towerMessage.value = saveData.towerMessage || {
      channel: 'ATC',
      text: '공항관제 자동 시스템 대기중.',
    }

    transportLines.value = Number.isFinite(saveData.transportLines) ? saveData.transportLines : 4
    privateFlights.value = Number.isFinite(saveData.privateFlights) ? saveData.privateFlights : 1
    activeFlights.value = Array.isArray(saveData.activeFlights) ? saveData.activeFlights : []
    flightId = Number.isFinite(saveData.flightId) ? saveData.flightId : activeFlights.value.length

    if (Array.isArray(saveData.departments)) {
      saveData.departments.forEach((savedItem) => {
        const target = departments.find((item) => item.id === savedItem.id)

        if (target && Number.isFinite(savedItem.staff)) {
          target.staff = savedItem.staff
        }
      })
    }

    if (Array.isArray(saveData.upgrades)) {
      saveData.upgrades.forEach((savedItem) => {
        const target = upgrades.find((item) => item.id === savedItem.id)

        if (target && Number.isFinite(savedItem.level)) {
          target.level = savedItem.level
        }
      })
    }

    if (Array.isArray(saveData.researches)) {
      saveData.researches.forEach((savedItem) => {
        const target = researches.find((item) => item.id === savedItem.id)

        if (target && typeof savedItem.done === 'boolean') {
          target.done = savedItem.done
        }
      })
    }

    if (saveData.airport) {
      airport.gates = Number.isFinite(saveData.airport.gates) ? saveData.airport.gates : airport.gates
      airport.runways = Number.isFinite(saveData.airport.runways) ? saveData.airport.runways : airport.runways
      airport.groundVehicles = Number.isFinite(saveData.airport.groundVehicles)
        ? saveData.airport.groundVehicles
        : airport.groundVehicles
    }

    if (showMessage) {
      updateTowerMessage('LOAD', '로컬 저장 데이터를 불러왔습니다.')
    }

    return true
  } catch (error) {
    console.error('로컬 불러오기 실패:', error)

    if (showMessage) {
      updateTowerMessage('LOAD ERROR', '로컬 저장 데이터를 불러오지 못했습니다.')
    }

    return false
  }
}

function resetSave() {
  localStorage.removeItem(SAVE_KEY)
  updateTowerMessage('RESET', '로컬 저장 데이터가 삭제되었습니다.')
}

function updateTime() {
  const now = new Date()

  worldTime.value = now.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatRemain(totalSeconds) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds))

  if (safeSeconds < 60) {
    return `${safeSeconds}S`
  }

  return `${Math.ceil(safeSeconds / 60)}M`
}

function toSeconds(minutes) {
  return minutes * 60
}

function randomSeconds(minMinutes, maxMinutes) {
  const min = toSeconds(minMinutes)
  const max = toSeconds(maxMinutes)

  return Math.floor(min + Math.random() * (max - min + 1))
}

function makeFlightCode() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const prefix =
    letters[Math.floor(Math.random() * letters.length)] +
    letters[Math.floor(Math.random() * letters.length)]
  const number = String(Math.floor(100 + Math.random() * 900))

  return `${prefix}${number}`
}

function updateTowerMessage(channel, text) {
  towerMessage.value = { channel, text }
}

function isLandingBusy() {
  return activeFlights.value.some((flight) => flight.zone === 'landing')
}

function isTakeoffBusy() {
  return activeFlights.value.some((flight) => {
    return (
      flight.zone === 'tower' &&
      flight.flow === 'departure' &&
      ['LINE UP AND WAIT', 'CLEARED FOR TAKEOFF'].includes(flight.status)
    )
  })
}

function createFlight(startMinutes = 60) {
  const remainingSeconds = toSeconds(startMinutes)

  const flight = {
    id: flightId++,
    code: makeFlightCode(),
    flow: 'arrival',
    zone: 'scheduled',
    remainingSeconds,
    status: 'FLIGHT PLAN REGISTERED',
    detail: 'ETA 등록',
    disembarkSeconds: 0,
    cleaningSeconds: 0,
    altitude: 0,
    speed: 0,
    goodDay: false,
    fadeout: false,
  }

  if (startMinutes <= 30 && startMinutes > 15) {
    flight.zone = 'arrival'
    flight.status = 'ARRIVAL FLOW ACTIVE'
    flight.detail = '도착 흐름 활성화'
  }

  if (startMinutes <= 15 && startMinutes > 10) {
    flight.zone = 'approach'
    flight.status = 'CONTACT APPROACH'
    flight.detail = '접근 관제 연결'
  }

  if (startMinutes <= 10 && startMinutes > 2) {
    flight.zone = 'tower'
    flight.status = 'CLEARED FOR LANDING'
    flight.detail = '최종 접근'
  }

  activeFlights.value.push(flight)
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

function assignStaff(id) {
  const target = departments.find((item) => item.id === id)

  if (target) {
    target.staff++
    updateTowerMessage('STAFF', `${target.label} 직원 배치. 자동 커버 범위가 증가합니다.`)
    saveGame()
  }
}

function addPrivateFlight() {
  privateFlights.value++
  createFlight(60)
  updateTowerMessage('FACILITY', '사용자 전용 항공편성이 도착 예정 목록에 추가되었습니다.')
  saveGame()
}

function progressDeparture(flight) {
  flight.altitude += 250
  flight.speed = Math.min(480, flight.speed + 8)

  if (flight.altitude >= 6000 && !flight.goodDay) {
    flight.goodDay = true
    flight.status = 'GOOD DAY'
    flight.detail = 'CONTROL TRANSFERRED'
    updateTowerMessage('DEPARTURE', `${flight.code} GOOD DAY`)
    return
  }

  if (flight.altitude >= 13000 && !flight.fadeout) {
    flight.fadeout = true
    flight.status = 'LEAVING TERMINAL AIRSPACE'
    flight.detail = '공항 관제권 이탈'
    updateTowerMessage('DEPARTURE', `${flight.code} LEAVING TERMINAL AIRSPACE`)

    setTimeout(() => {
      activeFlights.value = activeFlights.value.filter((item) => item.id !== flight.id)
    }, 2500)
  }
}

function processFlight(flight) {
  if (flight.zone === 'departure') {
    progressDeparture(flight)
    return
  }

  if (flight.remainingSeconds > 0) {
    flight.remainingSeconds--
  }

  if (flight.zone === 'scheduled' && flight.remainingSeconds <= toSeconds(30)) {
    flight.zone = 'arrival'
    flight.status = 'ARRIVAL FLOW ACTIVE'
    flight.detail = '도착 흐름 활성화'
    updateTowerMessage('ARRIVAL', `${flight.code} ARRIVAL FLOW ACTIVE`)
    return
  }

  if (flight.zone === 'arrival' && flight.remainingSeconds <= toSeconds(15)) {
    flight.zone = 'approach'
    flight.status = 'CONTACT APPROACH'
    flight.detail = '접근 관제 연결'
    updateTowerMessage('APPROACH', `${flight.code} CONTACT APPROACH`)
    return
  }

  if (flight.zone === 'approach' && flight.remainingSeconds <= toSeconds(10)) {
    flight.zone = 'tower'
    flight.status = 'CLEARED FOR LANDING'
    flight.detail = '최종 접근'
    updateTowerMessage('TOWER', `${flight.code} CLEARED FOR LANDING`)
    return
  }

  if (
    flight.zone === 'tower' &&
    flight.flow === 'arrival' &&
    flight.remainingSeconds <= toSeconds(2)
  ) {
    if (isLandingBusy()) {
      flight.status = 'LANDING SEQUENCE HOLD'
      flight.detail = '착륙 순번 대기'
      return
    }

    flight.zone = 'landing'
    flight.remainingSeconds = toSeconds(1)
    flight.status = 'RUNWAY DECELERATION'
    flight.detail = '활주로 감속'
    updateTowerMessage('TOWER', `${flight.code} RUNWAY DECELERATION`)
    return
  }

  if (flight.zone === 'landing' && flight.remainingSeconds <= 0) {
    flight.zone = 'ground'
    flight.remainingSeconds = toSeconds(10)
    flight.status = 'TAXI TO GATE'
    flight.detail = '활주로에서 게이트 이동'
    updateTowerMessage('GROUND', `${flight.code} CONTACT GROUND`)
    return
  }

  if (
    flight.zone === 'ground' &&
    flight.flow === 'arrival' &&
    flight.status === 'TAXI TO GATE' &&
    flight.remainingSeconds <= toSeconds(2)
  ) {
    flight.zone = 'gate'
    flight.remainingSeconds = toSeconds(2)
    flight.status = 'APPROACHING GATE'
    flight.detail = '게이트 접근중'
    updateTowerMessage('RAMP', `${flight.code} APPROACHING GATE`)
    return
  }

  if (
    flight.zone === 'gate' &&
    flight.status === 'APPROACHING GATE' &&
    flight.remainingSeconds <= 0
  ) {
    flight.disembarkSeconds = randomSeconds(60, 180)
    flight.cleaningSeconds = Math.max(toSeconds(20), Math.floor(flight.disembarkSeconds / 3))
    flight.remainingSeconds = flight.disembarkSeconds
    flight.status = 'PASSENGER DISEMBARKING'
    flight.detail = 'ENGINE CUT OFF · JET BRIDGE CONNECTED'
    updateTowerMessage('GATE', `${flight.code} ENGINE CUT OFF · JET BRIDGE CONNECTED`)
    return
  }

  if (
    flight.zone === 'gate' &&
    flight.status === 'PASSENGER DISEMBARKING' &&
    flight.remainingSeconds <= 0
  ) {
    flight.remainingSeconds = toSeconds(10)
    flight.status = 'CREW CHECK'
    flight.detail = '승무원 체크'
    updateTowerMessage('GATE', `${flight.code} CREW CHECK`)
    return
  }

  if (
    flight.zone === 'gate' &&
    flight.status === 'CREW CHECK' &&
    flight.remainingSeconds <= 0
  ) {
    flight.code = 'MT'
    flight.remainingSeconds = flight.cleaningSeconds
    flight.status = 'AIRCRAFT CLEANING'
    flight.detail = '빈 항공기 청소 진행'
    updateTowerMessage('GATE', 'MT AIRCRAFT CLEANING')
    return
  }

  if (
    flight.zone === 'gate' &&
    flight.status === 'AIRCRAFT CLEANING' &&
    flight.remainingSeconds <= 0
  ) {
    flight.code = makeFlightCode()
    flight.remainingSeconds = toSeconds(10)
    flight.status = 'CREW BOARDING'
    flight.detail = '다음 출발편 승무원 탑승'
    updateTowerMessage('GATE', `${flight.code} CREW BOARDING`)
    return
  }

  if (
    flight.zone === 'gate' &&
    flight.status === 'CREW BOARDING' &&
    flight.remainingSeconds <= 0
  ) {
    flight.remainingSeconds = randomSeconds(60, 180)
    flight.status = 'PASSENGER BOARDING'
    flight.detail = 'BOARDING READY · 승객 보딩중'
    updateTowerMessage('GATE', `${flight.code} BOARDING READY`)
    return
  }

  if (
    flight.zone === 'gate' &&
    flight.status === 'PASSENGER BOARDING' &&
    flight.remainingSeconds <= 0
  ) {
    flight.remainingSeconds = toSeconds(1)
    flight.status = 'READY FOR PUSHBACK'
    flight.detail = 'DOOR CLOSED · PUSHBACK REQUEST'
    updateTowerMessage('GATE', `${flight.code} READY FOR PUSHBACK`)
    return
  }

  if (
    flight.zone === 'gate' &&
    flight.status === 'READY FOR PUSHBACK' &&
    flight.remainingSeconds <= 0
  ) {
    flight.remainingSeconds = toSeconds(10)
    flight.status = 'PUSHBACK ACTIVE'
    flight.detail = '푸시백 진행중'
    updateTowerMessage('RAMP', `${flight.code} PUSHBACK ACTIVE`)
    return
  }

  if (
    flight.zone === 'gate' &&
    flight.status === 'PUSHBACK ACTIVE' &&
    flight.remainingSeconds <= 0
  ) {
    flight.zone = 'ground'
    flight.flow = 'departure'
    flight.remainingSeconds = toSeconds(10)
    flight.status = 'TAXI TO RWY'
    flight.detail = 'REQUEST TAXI · 활주로 이동'
    updateTowerMessage('GROUND', `${flight.code} REQUEST TAXI`)
    return
  }

  if (
    flight.zone === 'ground' &&
    flight.flow === 'departure' &&
    flight.status === 'TAXI TO RWY' &&
    flight.remainingSeconds <= toSeconds(10)
  ) {
    flight.status = 'CONTACTING TOWER'
    flight.detail = '타워 연결중'
    updateTowerMessage('GROUND', `${flight.code} CONTACTING TOWER`)
    return
  }

  if (
    flight.zone === 'ground' &&
    flight.flow === 'departure' &&
    flight.remainingSeconds <= 0
  ) {
    flight.zone = 'tower'
    flight.remainingSeconds = 0
    flight.status = 'HOLD SHORT RWY'
    flight.detail = '활주로 앞 대기'
    updateTowerMessage('TOWER', `${flight.code} HOLD SHORT RWY`)
    return
  }

  if (
    flight.zone === 'tower' &&
    flight.flow === 'departure' &&
    flight.status === 'LINE UP AND WAIT' &&
    flight.remainingSeconds <= toSeconds(2)
  ) {
    flight.remainingSeconds = toSeconds(2)
    flight.status = 'CLEARED FOR TAKEOFF'
    flight.detail = '이륙 활주중'
    updateTowerMessage('TOWER', `${flight.code} CLEARED FOR TAKEOFF`)
    return
  }

  if (
    flight.zone === 'tower' &&
    flight.flow === 'departure' &&
    flight.status === 'CLEARED FOR TAKEOFF' &&
    flight.remainingSeconds <= 0
  ) {
    flight.zone = 'departure'
    flight.altitude = 1000
    flight.speed = 180
    flight.status = 'AIRBORNE'
    flight.detail = '출발 상승중'
    updateTowerMessage('DEPARTURE', `${flight.code} AIRBORNE`)
  }
}

function processTakeoffQueue() {
  if (isLandingBusy() || isTakeoffBusy()) {
    return
  }

  const holdingFlights = activeFlights.value
    .filter((flight) => {
      return (
        flight.zone === 'tower' &&
        flight.flow === 'departure' &&
        flight.status === 'HOLD SHORT RWY'
      )
    })
    .sort((a, b) => a.id - b.id)

  const nextFlight = holdingFlights[0]

  if (!nextFlight) {
    return
  }

  nextFlight.remainingSeconds = toSeconds(4)
  nextFlight.status = 'LINE UP AND WAIT'
  nextFlight.detail = '활주로 진입'
  updateTowerMessage('TOWER', `${nextFlight.code} LINE UP AND WAIT`)
}

onMounted(() => {
  updateTime()

  const hasSaveData = loadGame()

  if (!hasSaveData) {
    createFlight(60)
    createFlight(42)
    createFlight(22)
    createFlight(12)
  }

  timeTimer = setInterval(updateTime, 1000)

  flightTimer = setInterval(() => {
    activeFlights.value.forEach(processFlight)
    processTakeoffQueue()
  }, 1000)

  spawnTimer = setInterval(() => {
    const wave = Math.random()

    if (wave > 0.82) {
      createFlight(60)
      createFlight(58)
      createFlight(55)
      updateTowerMessage('ARRIVAL', 'ARRIVAL WAVE DETECTED')
      return
    }

    if (wave > 0.45) {
      createFlight(60)
    }
  }, 20000)

  autoSaveTimer = setInterval(() => {
    saveGame()
  }, 5000)
})

onUnmounted(() => {
  saveGame()

  clearInterval(timeTimer)
  clearInterval(flightTimer)
  clearInterval(spawnTimer)
  clearInterval(autoSaveTimer)
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
  opacity: 0.45;
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