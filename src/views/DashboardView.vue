<!-- src/views/DashboardView.vue -->
<template>
  <div class="dashboard-page">
    <header class="dashboard-header">
      <div>
        <h1 class="dashboard-title">RCTS 도시 운영 대시보드</h1>
        <p class="dashboard-subtitle">
          도시 현황과 노선·차량·건설·재정·연구·설정·로그를 한 화면에서 관리합니다.
        </p>
        <p class="dashboard-time">
          현재 시간 (KST 기준): {{ displayTime }}
        </p>
      </div>

      <!-- 상단 메뉴 -->
      <nav class="dashboard-nav">
        <!-- 방치형: 별도 페이지(/idle) 링크 -->
        <RouterLink
          to="/idle"
          class="nav-button nav-link"
        >
          방치형
        </RouterLink>

        <!-- 이하 대시보드 내부 섹션 스크롤 -->
        <button
          class="nav-button"
          :class="{ active: activeSection === 'route' }"
          type="button"
          @click="scrollTo('route')"
        >
          노선
        </button>
        <button
          class="nav-button"
          :class="{ active: activeSection === 'vehicle' }"
          type="button"
          @click="scrollTo('vehicle')"
        >
          차량
        </button>
        <button
          class="nav-button"
          :class="{ active: activeSection === 'construction' }"
          type="button"
          @click="scrollTo('construction')"
        >
          건설
        </button>
        <button
          class="nav-button"
          :class="{ active: activeSection === 'finance' }"
          type="button"
          @click="scrollTo('finance')"
        >
          재정
        </button>
        <button
          class="nav-button"
          :class="{ active: activeSection === 'research' }"
          type="button"
          @click="scrollTo('research')"
        >
          연구
        </button>
        <button
          class="nav-button"
          :class="{ active: activeSection === 'settings' }"
          type="button"
          @click="scrollTo('settings')"
        >
          설정
        </button>
        <button
          class="nav-button"
          :class="{ active: activeSection === 'log' }"
          type="button"
          @click="scrollTo('log')"
        >
          로그
        </button>
      </nav>
    </header>

    <main class="dashboard-grid">
      <!-- 요약 (메뉴는 없지만 최상단 패널로 유지) -->
      <section
        ref="statusRef"
        class="panel panel-status"
      >
        <StatusSummary />
      </section>

      <!-- 노선 -->
      <section
        ref="routeRef"
        class="panel panel-route"
      >
        <RouteSummary />
      </section>

      <!-- 차량 -->
      <section
        ref="vehicleRef"
        class="panel panel-vehicle"
      >
        <VehicleSummary />
      </section>

      <!-- 건설 -->
      <section
        ref="constructionRef"
        class="panel panel-construction"
      >
        <h2 class="panel-title">건설</h2>
        <p class="panel-placeholder">
          건설 관련 UI가 여기에 들어갈 예정입니다.
        </p>
      </section>

      <!-- 재정 -->
      <section
        ref="financeRef"
        class="panel panel-finance"
      >
        <h2 class="panel-title">재정</h2>
        <p class="panel-placeholder">
          도시 재정, 수입·지출, 요금/비용 구조 등을 표시하는 영역입니다.
        </p>
      </section>

      <!-- 연구 -->
      <section
        ref="researchRef"
        class="panel panel-research"
      >
        <h2 class="panel-title">연구</h2>
        <p class="panel-placeholder">
          연구 진행 상황, 연구 큐, 연구 속도 가속 등의 UI가 여기에 배치될 예정입니다.
        </p>
      </section>

      <!-- 설정 -->
      <section
        ref="settingsRef"
        class="panel panel-settings"
      >
        <h2 class="panel-title">설정</h2>
        <p class="panel-placeholder">
          플레이 옵션, 표시 설정, 디버그/테스트 관련 스위치 등을 둘 수 있는 영역입니다.
        </p>
      </section>

      <!-- 로그 -->
      <section
        ref="logRef"
        class="panel panel-log"
      >
        <LogPanel />
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'

import StatusSummary from '@/components/dashboard/StatusSummary.vue'
import RouteSummary from '@/components/dashboard/RouteSummary.vue'
import VehicleSummary from '@/components/dashboard/VehicleSummary.vue'
import LogPanel from '@/components/dashboard/LogPanel.vue'

import { useGameTime } from '@/composables/useGameTime'
import { formatKstTimeYYYYMMDDHHMM } from '@/utils/timeFormat'

// 게임 시간 (표준시간 기반, 초당 갱신 / 분 단위 표시)
const { gameTime } = useGameTime({
  initialSpeed: 1,
})

const displayTime = computed(() =>
  formatKstTimeYYYYMMDDHHMM(gameTime.value),
)

const activeSection = ref('route')

const statusRef = ref(null)
const routeRef = ref(null)
const vehicleRef = ref(null)
const constructionRef = ref(null)
const financeRef = ref(null)
const researchRef = ref(null)
const settingsRef = ref(null)
const logRef = ref(null)

const sectionMap = {
  route: routeRef,
  vehicle: vehicleRef,
  construction: constructionRef,
  finance: financeRef,
  research: researchRef,
  settings: settingsRef,
  log: logRef,
}

function scrollTo(key) {
  const targetRef = sectionMap[key]
  if (!targetRef?.value) return

  activeSection.value = key

  targetRef.value.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  })
}
</script>

<style scoped>
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  box-sizing: border-box;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  min-height: 100vh;

  background: var(--main-bg-color, transparent);
  color: var(--text-color, #fff);
}

.dashboard-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dashboard-title {
  font-size: 1.5rem;
  font-weight: 700;
}

.dashboard-subtitle {
  font-size: 0.875rem;
  opacity: 0.8;
}

.dashboard-time {
  margin-top: 4px;
  font-size: 0.8rem;
  opacity: 0.8;
}

/* 상단 메뉴 */
.dashboard-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
}

.nav-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(0, 0, 0, 0.25);
  color: inherit;
  font-size: 0.875rem;
  cursor: pointer;
  outline: none;
  white-space: nowrap;
  text-decoration: none; /* RouterLink에도 적용 */
}

/* RouterLink 전용 추가 클래스(필요 시 확장용) */
.nav-link {
  /* 현재는 nav-button 스타일을 그대로 공유 */
}

.nav-button:hover {
  background: rgba(255, 255, 255, 0.06);
}

.nav-button.active {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.4);
}

/* 기본: 모바일(1열) */
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: auto;
  grid-template-areas:
    "status"
    "route"
    "vehicle"
    "construction"
    "finance"
    "research"
    "settings"
    "log";
  gap: 12px;
}

.panel {
  background: rgba(0, 0, 0, 0.25);
  border-radius: 12px;
  padding: 12px;
  box-sizing: border-box;
  overflow: hidden;
}

.panel-title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 8px;
}

.panel-placeholder {
  font-size: 0.875rem;
  opacity: 0.8;
}

/* grid-area 지정 */
.panel-status {
  grid-area: status;
}

.panel-route {
  grid-area: route;
}

.panel-vehicle {
  grid-area: vehicle;
}

.panel-construction {
  grid-area: construction;
}

.panel-finance {
  grid-area: finance;
}

.panel-research {
  grid-area: research;
}

.panel-settings {
  grid-area: settings;
}

.panel-log {
  grid-area: log;
}

/* 태블릿 이상 (>= 768px): 2열 구성 */
@media (min-width: 768px) {
  .dashboard-page {
    gap: 20px;
    padding: 20px;
  }

  .dashboard-title {
    font-size: 1.75rem;
  }

  .dashboard-header {
    flex-direction: row;
    align-items: flex-end;
    justify-content: space-between;
  }

  .dashboard-nav {
    justify-content: flex-end;
  }

  .dashboard-grid {
    grid-template-columns: 2fr 1.5fr;
    grid-template-areas:
      "status status"
      "route vehicle"
      "construction finance"
      "research settings"
      "log log";
  }
}

/* 데스크톱 이상 (>= 1024px): 3단 + 전체폭 로그 */
@media (min-width: 1024px) {
  .dashboard-page {
    padding: 24px;
    max-width: 1400px;
  }

  .dashboard-title {
    font-size: 2rem;
  }

  .dashboard-grid {
    grid-template-columns: 2fr 1.5fr 1.5fr;
    grid-template-areas:
      "status route vehicle"
      "construction finance research"
      "settings log log";
  }

  .panel-log {
    max-height: 360px;
    overflow-y: auto;
  }
}
</style>
