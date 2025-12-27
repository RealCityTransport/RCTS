<!-- src/views/GamePlayView.vue -->
<template>
  <div class="game-ui-page">
    <!-- 상단: 도시 / 자원 요약 -->
    <header class="top-summary">
      <div class="summary-left">
        <h1 class="city-name">신도시 1구역</h1>
        <p class="city-sub">
          기본 테스트 구역 · 노선/연구 UI만으로 운영하는 웹 게임 화면이야.
        </p>
      </div>

      <div class="summary-right">
        <div class="summary-chip">
          <span class="label">자금</span>
          <span class="value">₩ {{ money.toLocaleString() }}</span>
        </div>
        <div class="summary-chip">
          <span class="label">일일 승객</span>
          <span class="value">{{ dailyPassengers.toLocaleString() }} 명</span>
        </div>
        <div class="summary-chip">
          <span class="label">게임 시간</span>
          <span class="value">Y1 · 1월 1일 · AM 08:00</span>
        </div>
      </div>
    </header>

    <!-- 중앙: 노선 / 연구 / 상태 패널 -->
    <main class="main-panels">
      <!-- 패널 1: 운행 중인 노선 -->
      <section class="panel">
        <header class="panel-header">
          <h2 class="panel-title">운행 중인 노선</h2>
          <button class="panel-btn" @click="addDummyRoute">
            노선 추가(샘플)
          </button>
        </header>

        <p class="panel-desc">
          각 노선의 상태를 여기서 관리해. 지금은 샘플 데이터로만 동작해.
        </p>

        <div class="table">
          <div class="table-header">
            <span class="col col-name">노선명</span>
            <span class="col col-type">종류</span>
            <span class="col col-status">상태</span>
            <span class="col col-action">조작</span>
          </div>

          <div
            v-for="route in routes"
            :key="route.id"
            class="table-row"
          >
            <span class="col col-name">
              {{ route.name }}
            </span>
            <span class="col col-type">
              {{ route.type }}
            </span>
            <span class="col col-status">
              <span
                class="status-pill"
                :class="route.running ? 'status-on' : 'status-off'"
              >
                {{ route.running ? '운행 중' : '정지' }}
              </span>
            </span>
            <span class="col col-action">
              <button
                class="row-btn"
                @click="toggleRoute(route)"
              >
                {{ route.running ? '일시 정지' : '운행 시작' }}
              </button>
            </span>
          </div>

          <div v-if="routes.length === 0" class="table-empty">
            아직 노선이 없어. 위의 버튼으로 샘플 노선을 만들어서 느낌만 먼저 봐줘.
          </div>
        </div>
      </section>

      <!-- 패널 2: 연구 / 개발 -->
      <section class="panel">
        <header class="panel-header">
          <h2 class="panel-title">연구 / 개발</h2>
        </header>

        <p class="panel-desc">
          연구 슬롯별로 하나씩 선택해서 진행하는 구조를 상상하고 있어. 지금은
          버튼을 눌러 상태만 바뀌는 정도로 동작해.
        </p>

        <div class="research-list">
          <article
            v-for="slot in researchSlots"
            :key="slot.id"
            class="research-card"
          >
            <header class="research-header">
              <h3 class="research-name">{{ slot.name }}</h3>
              <span
                class="status-pill"
                :class="{
                  'status-on': slot.status === 'in-progress',
                  'status-off': slot.status === 'ready',
                  'status-done': slot.status === 'done',
                }"
              >
                {{
                  slot.status === 'ready'
                    ? '대기 중'
                    : slot.status === 'in-progress'
                      ? '진행 중'
                      : '완료'
                }}
              </span>
            </header>

            <p class="research-desc">
              {{ slot.desc }}
            </p>

            <div class="research-footer">
              <span class="hint">
                예상 소요: {{ slot.eta }} / 비용: ₩ {{ slot.cost.toLocaleString() }}
              </span>
              <button
                class="row-btn"
                :disabled="slot.status !== 'ready'"
                @click="startResearch(slot)"
              >
                {{
                  slot.status === 'ready'
                    ? '연구 시작'
                    : slot.status === 'in-progress'
                      ? '진행 중...'
                      : '완료됨'
                }}
              </button>
            </div>
          </article>
        </div>
      </section>

      <!-- 패널 3: 로그 / 이벤트 -->
      <section class="panel">
        <header class="panel-header">
          <h2 class="panel-title">최근 이벤트 로그</h2>
        </header>

        <p class="panel-desc">
          여기에는 나중에 수익 변동, 연구 완료, 노선 변경 같은 이벤트를 쌓을 수 있어.
          지금은 버튼으로 발생한 것만 간단히 기록해.
        </p>

        <ul class="log-list">
          <li
            v-for="(item, index) in logs"
            :key="index"
            class="log-item"
          >
            • {{ item }}
          </li>
          <li v-if="logs.length === 0" class="log-item empty">
            아직 로그가 없어. 노선 상태를 바꾸거나, 연구를 시작해 보면 여기에 기록돼.
          </li>
        </ul>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const money = ref(1_000_000)
const dailyPassengers = ref(1250)

let routeIdCounter = 3
const routes = ref([
  {
    id: 1,
    name: '기본 순환 노선 A',
    type: '버스',
    running: true,
  },
  {
    id: 2,
    name: '도심 급행 B',
    type: '철도',
    running: false,
  },
])

const researchSlots = ref([
  {
    id: 1,
    name: '차량 연비 개선 1단계',
    desc: '모든 버스 운행 비용을 소폭 감소시키는 연구.',
    eta: '3일',
    cost: 150_000,
    status: 'ready', // ready | in-progress | done
  },
  {
    id: 2,
    name: '도심 정류장 승하차 속도 개선',
    desc: '혼잡 시간대 승하차 시간을 줄여 일일 승객 처리량을 늘려.',
    eta: '5일',
    cost: 300_000,
    status: 'ready',
  },
])

const logs = ref([])

const addLog = (text) => {
  logs.value.unshift(text)
  if (logs.value.length > 20) {
    logs.value.pop()
  }
}

const toggleRoute = (route) => {
  route.running = !route.running
  addLog(
    `노선 "${route.name}"이(가) ${
      route.running ? '운행 시작' : '일시 정지'
    } 상태로 변경됨.`,
  )
}

const addDummyRoute = () => {
  const id = routeIdCounter++
  const newRoute = {
    id,
    name: `샘플 노선 ${id}`,
    type: id % 2 === 0 ? '버스' : '철도',
    running: false,
  }
  routes.value.push(newRoute)
  addLog(`새 노선 "${newRoute.name}"이(가) 추가됨.`)
}

const startResearch = (slot) => {
  if (slot.status !== 'ready') return
  if (money.value < slot.cost) {
    addLog(`연구 "${slot.name}"을(를) 시작하려 했지만 자금이 부족함.`)
    return
  }

  money.value -= slot.cost
  slot.status = 'in-progress'
  addLog(`연구 "${slot.name}"이(가) 시작됨. (-₩${slot.cost.toLocaleString()})`)

  // 지금은 단순 샘플: 바로 완료 상태로 넘기고 로그만 남겨도 됨.
  // 실제 게임에서는 시간/틱 시스템과 연결할 수 있어.
  setTimeout(() => {
    slot.status = 'done'
    addLog(`연구 "${slot.name}"이(가) 완료됨.`)
  }, 500) // 샘플이니까 짧게
}
</script>

<style scoped>
.game-ui-page {
  min-height: 100vh;
  min-height: 100dvh;
  padding: 10px 10px 14px;
  box-sizing: border-box;
  background: #050711;

  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 상단 요약 */
.top-summary {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 8px 6px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: radial-gradient(circle at top left, rgba(79, 140, 255, 0.2), transparent 60%),
              rgba(0, 0, 0, 0.75);
}

.city-name {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.city-sub {
  margin: 0;
  font-size: 11px;
  opacity: 0.8;
}

.summary-right {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 11px;
}

.summary-chip {
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(0, 0, 0, 0.6);
}

.summary-chip .label {
  opacity: 0.7;
  margin-right: 4px;
}

.summary-chip .value {
  font-weight: 600;
}

/* 메인 패널들 */
.main-panels {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 공통 패널 */
.panel {
  padding: 10px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.78);
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.panel-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.panel-btn {
  margin-left: auto;
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: transparent;
  color: inherit;
  font-size: 11px;
  cursor: pointer;
  opacity: 0.85;
}

.panel-btn:hover {
  opacity: 1;
}

.panel-desc {
  margin: 0 0 8px;
  font-size: 11px;
  opacity: 0.82;
}

/* 상태 pill 공통 */
.status-pill {
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 10px;
  border: 1px solid rgba(255, 255, 255, 0.16);
}

.status-on {
  background: rgba(15, 180, 120, 0.18);
}

.status-off {
  background: rgba(255, 255, 255, 0.04);
  opacity: 0.78;
}

.status-done {
  background: rgba(255, 215, 0, 0.22);
}

/* 노선 테이블 스타일 */
.table {
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.6);
  overflow: hidden;
  font-size: 11px;
}

.table-header,
.table-row {
  display: grid;
  grid-template-columns: 1.6fr 0.9fr 0.9fr 1fr;
  gap: 4px;
  padding: 6px 8px;
  align-items: center;
}

.table-header {
  background: rgba(255, 255, 255, 0.05);
  font-weight: 600;
  opacity: 0.9;
}

.table-row:nth-child(even) {
  background: rgba(255, 255, 255, 0.02);
}

.table-empty {
  padding: 8px;
  font-size: 11px;
  opacity: 0.8;
}

.col {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.col-name {
  font-weight: 500;
}

.col-type {
  opacity: 0.85;
}

.col-status {
  display: flex;
  justify-content: flex-start;
}

.col-action {
  display: flex;
  justify-content: flex-end;
}

/* 공통 버튼(행 버튼) */
.row-btn {
  padding: 3px 8px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.24);
  background: transparent;
  color: inherit;
  font-size: 11px;
  cursor: pointer;
  opacity: 0.9;
}

.row-btn:disabled {
  opacity: 0.45;
  cursor: default;
}

.row-btn:not(:disabled):hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.06);
}

/* 연구 카드 리스트 */
.research-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.research-card {
  padding: 8px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.65);
}

.research-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.research-name {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
}

.research-desc {
  margin: 0 0 6px;
  font-size: 11px;
  opacity: 0.85;
}

.research-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 10px;
}

.research-footer .hint {
  opacity: 0.8;
}

.research-footer .row-btn {
  margin-left: auto;
}

/* 로그 리스트 */
.log-list {
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 11px;
  max-height: 160px;
  overflow-y: auto;
}

.log-item {
  padding: 3px 0;
  opacity: 0.9;
}

.log-item.empty {
  opacity: 0.7;
  font-style: italic;
}

/* 반응형 조정 */
@media (min-width: 768px) {
  .game-ui-page {
    padding: 12px 16px 16px;
  }

  .top-summary {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  .summary-right {
    justify-content: flex-end;
  }

  .main-panels {
    flex-direction: row;
    align-items: flex-start;
  }

  .panel {
    flex: 1;
  }

  .panel:nth-child(1) {
    max-width: 45%;
  }

  .panel:nth-child(2) {
    max-width: 35%;
  }

  .panel:nth-child(3) {
    max-width: 20%;
  }
}

@media (min-width: 1200px) {
  .game-ui-page {
    padding: 16px 24px 18px;
  }
}
</style>
