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
            >
              <div class="flight-top">
                <strong>{{ flight.code }}</strong>
                <span>{{ flight.remain }}분</span>
              </div>
              <p>{{ flight.status }}</p>
              <small>{{ flight.detail }}</small>
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
let messageTimer = null
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
  { id: 'arrival', code: 'ARRIVAL', label: '도착 예정' },
  { id: 'approach', code: 'APPROACH', label: '접근 관제' },
  { id: 'tower', code: 'TOWER', label: '관제탑' },
  { id: 'ground', code: 'GROUND', label: '지상 관제' },
  { id: 'gate', code: 'GATE', label: '게이트' },
  { id: 'departure', code: 'DEPARTURE', label: '출발 관제' },
]

const atcSteps = [
  { zone: 'arrival', status: '도착 예정', detail: '공항 접근 전 항공 일정 대기', min: 8, max: 16, message: '도착 예정 항공편이 항공일정에 등록되었습니다.' },
  { zone: 'approach', status: '공항 접근', detail: '접근 관제 주파수 연결', min: 4, max: 8, message: 'CONTACT APPROACH. 공항 접근 절차를 시작합니다.' },
  { zone: 'tower', status: '착륙 허가 대기', detail: '활주로 슬롯 확인중', min: 3, max: 7, message: 'CONTACT TOWER. 착륙 순번을 배정합니다.' },
  { zone: 'ground', status: '지상 이동중', detail: '활주로 이탈 후 게이트 이동', min: 5, max: 12, message: 'CONTACT GROUND. 게이트까지 지상 이동합니다.' },
  { zone: 'gate', status: '승객 하차중', detail: '게이트 도착 후 하차 및 지상작업', min: 6, max: 14, message: 'GATE ARRIVAL. 승객 하차와 지상작업을 시작합니다.' },
  { zone: 'gate', status: '보딩중', detail: '승객 탑승 및 수하물 처리', min: 8, max: 18, message: 'BOARDING ACTIVE. 출발 준비가 진행중입니다.' },
  { zone: 'departure', status: '푸시백 대기', detail: '출발 허가 및 푸시백 대기', min: 4, max: 10, message: 'PUSHBACK STANDBY. 출발 관제 대기중입니다.' },
  { zone: 'tower', status: '이륙 대기', detail: '활주로 이륙 슬롯 대기', min: 3, max: 8, message: 'CONTACT TOWER. 이륙 허가를 대기합니다.' },
]

const currentOperation = computed(() => {
  return operationMenus.find((menu) => menu.id === activeOperationMenu.value) || operationMenus[0]
})

const currentTransport = computed(() => transportData[activeTransport.value])

const totalStaff = computed(() => departments.reduce((sum, item) => sum + item.staff, 0))
const autoInterval = computed(() => (totalStaff.value > 0 ? 10 : 30))

function updateTime() {
  const now = new Date()
  worldTime.value = now.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function makeFlightCode() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const prefix =
    letters[Math.floor(Math.random() * letters.length)] +
    letters[Math.floor(Math.random() * letters.length)]
  const number = String(Math.floor(100 + Math.random() * 900))

  return `${prefix}${number}`
}

function randomMinutes(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1))
}

function createFlight() {
  const firstStep = atcSteps[0]

  return {
    id: flightId++,
    code: makeFlightCode(),
    step: 0,
    zone: firstStep.zone,
    status: firstStep.status,
    detail: firstStep.detail,
    remain: randomMinutes(firstStep.min, firstStep.max),
  }
}

function updateTowerMessage(channel, text) {
  towerMessage.value = { channel, text }
}

function activeChannelByZone(zone) {
  const map = {
    arrival: 'ARRIVAL',
    approach: 'APPROACH',
    tower: 'TOWER',
    ground: 'GROUND',
    gate: 'GATE',
    departure: 'DEPARTURE',
  }

  return map[zone] || 'ATC'
}

function progressFlights() {
  if (activeFlights.value.length < Math.min(8, privateFlights.value + 2)) {
    const flight = createFlight()
    activeFlights.value.push(flight)
    updateTowerMessage('ARRIVAL', `${flight.code} 항공일정 등록. 도착 예정 ${flight.remain}분.`)
  }

  activeFlights.value = activeFlights.value
    .map((flight) => {
      const nextRemain = flight.remain - 1

      if (nextRemain > 0) {
        return { ...flight, remain: nextRemain }
      }

      const nextStep = flight.step + 1

      if (nextStep >= atcSteps.length) {
        updateTowerMessage('TOWER', `${flight.code} CLEARED FOR TAKEOFF. 이륙 완료.`)
        return null
      }

      const step = atcSteps[nextStep]
      const remain = randomMinutes(step.min, step.max)

      updateTowerMessage(activeChannelByZone(step.zone), `${flight.code} ${step.message}`)

      return {
        ...flight,
        step: nextStep,
        zone: step.zone,
        status: step.status,
        detail: step.detail,
        remain,
      }
    })
    .filter(Boolean)
}

function rotateMessage() {
  const samples = [
    ['ATC', `자동 처리 간격 ${autoInterval.value}분 기준으로 흐름을 유지합니다.`],
    ['RAMP', '지상작업차량이 원거리 게이트로 이동중입니다.'],
    ['GROUND', '지상 이동 대기열을 순차적으로 조정합니다.'],
    ['TOWER', '활주로 사용 슬롯을 재계산합니다.'],
  ]

  const sample = samples[Math.floor(Math.random() * samples.length)]
  updateTowerMessage(sample[0], sample[1])
}

function flightsByZone(zoneId) {
  return activeFlights.value.filter((flight) => flight.zone === zoneId)
}

function addPrivateFlight() {
  privateFlights.value++
  const flight = createFlight()
  activeFlights.value.push(flight)
  updateTowerMessage('FACILITY', `${flight.code} 사용자 전용 항공편성이 추가되었습니다.`)
}

function assignStaff(id) {
  const target = departments.find((item) => item.id === id)

  if (target) {
    target.staff++
    updateTowerMessage('STAFF', `${target.label} 직원 배치. 자동 커버 범위가 증가합니다.`)
  }
}

onMounted(() => {
  updateTime()
  activeFlights.value = [createFlight(), createFlight(), createFlight()]
  updateTowerMessage('ATC', '항공관제 패널이 활성화되었습니다.')

  timeTimer = setInterval(updateTime, 1000)
  flightTimer = setInterval(progressFlights, 4000)
  messageTimer = setInterval(rotateMessage, 7000)
})

onUnmounted(() => {
  clearInterval(timeTimer)
  clearInterval(flightTimer)
  clearInterval(messageTimer)
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  height: auto;
  overflow-y: visible;
  padding: 28px;
  color: #edf8ff;
  background:
    radial-gradient(circle at 12% 8%, rgba(58, 179, 255, 0.2), transparent 34%),
    radial-gradient(circle at 92% 90%, rgba(90, 80, 255, 0.18), transparent 36%),
    #071018;
  font-family: Pretendard, Inter, system-ui, sans-serif;
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
  grid-template-columns: repeat(6, minmax(150px, 1fr));
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
  padding: 12px;
}

.flight-card {
  padding: 12px;
  border: 1px solid rgba(118, 223, 255, 0.22);
  border-radius: 18px;
  background: rgba(118, 223, 255, 0.08);
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
    grid-template-columns: repeat(3, 1fr);
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
}
</style>