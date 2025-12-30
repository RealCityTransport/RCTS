<!-- src/views/MainView.vue -->
<template>
  <div class="main-view">
    <!-- 배경 레이어: 낮 -->
    <div
      class="bg-layer bg-day"
      :class="{ 'is-active': !isNight }"
      :style="{ backgroundImage: `url(${dayImage})` }"
    ></div>

    <!-- 배경 레이어: 밤 -->
    <div
      class="bg-layer bg-night"
      :class="{ 'is-active': isNight }"
      :style="{ backgroundImage: `url(${nightImage})` }"
    ></div>

    <!-- 실제 게임 콘텐츠 영역 -->
    <div class="main-content">
      <!-- 헤더 -->
      <header class="game-header">
        <div class="header-left">
          <h1 class="game-title">RCTS</h1>
        </div>

        <div class="header-center">
          <MainGameClock :now="kstNow" />
        </div>

        <div class="header-right">
          <template v-if="!isLoggedIn">
            <button
              type="button"
              class="login-button"
              @click="signInWithGoogle"
            >
              Google 로그인
            </button>
          </template>

          <template v-else>
            <span class="login-user">
              {{ displayName }} 접속 중
            </span>
            <button
              type="button"
              class="logout-button"
              @click="logout"
            >
              로그아웃
            </button>
          </template>
        </div>
      </header>

      <!-- 전역 메인 메뉴: PLAY | WIKI | DEVLOG | ABOUT -->
      <nav class="global-menu">
        <button
          v-for="item in globalMenus"
          :key="item.key"
          type="button"
          class="global-menu-button"
          :class="{ active: globalMenu === item.key }"
          @click="globalMenu = item.key"
        >
          {{ item.label }}
        </button>
      </nav>

      <!-- PLAY 영역 전용 상단 메뉴 (대시보드 / 노선 / 차량 / 운행 / 로그 / 설정) -->
      <MainTopMenu
        v-if="globalMenu === 'play'"
        v-model="activeMenu"
      />

      <!-- 본문 -->
      <main class="game-body">
        <!-- 1) PLAY 영역 -->
        <template v-if="globalMenu === 'play'">
          <!-- 대시보드 -->
          <section
            v-if="activeMenu === 'dashboard'"
            class="dashboard-page"
          >
            <section class="dashboard-grid">
              <MainStatusSummary class="dashboard-card" />

              <MainRouteSummary
                class="dashboard-card"
                @open-route="handleOpenRouteFromSummary"
              />

              <MainVehicleSummary class="dashboard-card" />
            </section>

            <section class="log-section">
              <MainLogPanel />
            </section>
          </section>

          <!-- 노선 (Lines) -->
          <section
            v-else-if="activeMenu === 'routes'"
            class="routes-page-wrapper"
          >
            <MainRoutesPage />
          </section>

          <!-- 차량 · 편성 (Trains) -->
          <section
            v-else-if="activeMenu === 'trains'"
            class="trains-page-wrapper simple-page"
          >
            <h2 class="page-title">차량 · 편성 관리</h2>
            <p class="page-desc">
              DTS 기반 차량과 편성을 관리하는 화면입니다.<br />
              차량 목록, 편성 에디터, 저장된 편성 리스트 등을 이 영역에서 확장할 수 있습니다.
            </p>
          </section>

          <!-- 운행 · 배차 (Operations) -->
          <section
            v-else-if="activeMenu === 'operations'"
            class="operations-page-wrapper simple-page"
          >
            <h2 class="page-title">운행 · 배차 관리</h2>
            <p class="page-desc">
              노선별 운행 스케줄과 배차 간격을 설정하는 화면입니다.<br />
              특정 노선/편성 조합의 운행 계획, 반복 패턴, 피크 타임 운행 등을 이 영역에서 구성할 수 있습니다.
            </p>
          </section>

          <!-- 로그 전용 화면 (Logs) -->
          <section
            v-else-if="activeMenu === 'logs'"
            class="logs-page-wrapper"
          >
            <section class="logs-card">
              <h2 class="page-title">운행 로그</h2>
              <p class="page-desc">
                열차 운행 기록, 도착/지연 정보, 이벤트 로그 등을 한눈에 확인하는 화면입니다.
              </p>
              <div class="logs-panel-wrapper">
                <MainLogPanel />
              </div>
            </section>
          </section>

          <!-- 설정 -->
          <section
            v-else-if="activeMenu === 'settings'"
            class="settings-page-wrapper simple-page"
          >
            <h2 class="page-title">설정</h2>
            <p class="page-desc">
              게임 환경과 옵션을 설정할 수 있습니다.<br />
              표시 옵션, 시간 흐름, 알림 설정 등을 이 영역에서 확장할 수 있습니다.
            </p>
          </section>
        </template>

        <!-- 3) WIKI 영역 -->
        <template v-else-if="globalMenu === 'wiki'">
          <section class="wiki-page-wrapper">
            <MainWikiPage />
          </section>
        </template>

        <!-- 4) DEVLOG 영역 -->
        <template v-else-if="globalMenu === 'devlog'">
          <section class="simple-page devlog-page">
            <MainDevlogPage />
          </section>
        </template>

        <!-- 5) ABOUT 영역 -->
        <template v-else-if="globalMenu === 'about'">
          <section class="simple-page about-page">
            <MainAboutPage />
          </section>
        </template>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useKstTime } from '@/composables/useKstTime'
import { useFirebaseAuth } from '@/composables/useFirebaseAuth'
import { useRoutesStore } from '@/composables/useRoutesStore'

import dayImage from '@/assets/bg-city-day.png'
import nightImage from '@/assets/bg-city-night.png'

import MainTopMenu from '@/components/main/MainTopMenu.vue'
import MainGameClock from '@/components/main/MainGameClock.vue'

import MainStatusSummary from '@/components/main/MainStatusSummary.vue'
import MainRouteSummary from '@/components/main/MainRouteSummary.vue'
import MainVehicleSummary from '@/components/main/MainVehicleSummary.vue'
import MainLogPanel from '@/components/main/MainLogPanel.vue'
import MainRoutesPage from '@/components/main/MainRoutesPage.vue'
import MainWikiPage from '@/components/main/MainWikiPage.vue'
import MainAboutPage from '@/components/main/MainAboutPage.vue'
import MainDevlogPage from '@/components/main/MainDevlogPage.vue'

// 시계
const { now: kstNow } = useKstTime(1000)

// 낮/밤 전환
const isNight = computed(() => {
  const hour = kstNow.value.getHours()
  return hour >= 18 || hour < 6
})

// 전역 메인 메뉴 상태: play | wiki | devlog | about
const globalMenus = [
  { key: 'play', label: 'PLAY' },
  { key: 'wiki', label: 'WIKI' },
  { key: 'devlog', label: 'DEVLOG' },
  { key: 'about', label: 'ABOUT' },
]
const globalMenu = ref('play')

// PLAY 내부 메뉴 상태
// MainTopMenu 에서 'dashboard' | 'routes' | 'trains' | 'operations' | 'logs' | 'settings'
// 값을 넘겨주도록 맞춰두었음.
const activeMenu = ref('dashboard')

// 로그인 상태
const { user, isLoggedIn, signInWithGoogle, logout } = useFirebaseAuth()
const displayName = computed(() => {
  return user.value?.displayName || '게스트'
})

// 노선 요약에서 특정 노선 열기
const { selectRoute } = useRoutesStore()

function handleOpenRouteFromSummary(routeId) {
  if (!routeId) return
  selectRoute(routeId)
  globalMenu.value = 'play'
  activeMenu.value = 'routes'
}
</script>

<style scoped>
.main-view {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  color: #f9fafb;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'SUIT', sans-serif;
}

/* 배경 레이어 */

.bg-layer {
  position: fixed;
  inset: 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  opacity: 0;
  transition: opacity 1.5s ease-in-out;
  pointer-events: none;
}

.bg-layer.is-active {
  opacity: 1;
}

.bg-night {
  filter: brightness(0.9);
}

/* 메인 컨텐츠 컨테이너 */

.main-content {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  padding: 16px 16px 24px;
  box-sizing: border-box;
  backdrop-filter: blur(4px);

  display: flex;
  flex-direction: column;
}

/* 헤더 */

.game-header {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;

  padding: 10px 14px;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.78);
  border: 1px solid rgba(148, 163, 184, 0.7);
  margin-bottom: 10px;
}

.header-left {
  display: flex;
  align-items: center;
}

.header-center {
  display: flex;
  justify-content: center;
}

.header-right {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
}

.game-title {
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

/* 로그인 버튼 */

.login-button,
.logout-button {
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.9);
  background: rgba(15, 23, 42, 0.9);
  color: #e5e7eb;
  font-size: 0.76rem;
  cursor: pointer;
}

.logout-button {
  border-color: rgba(248, 113, 113, 0.9);
}

.login-user {
  opacity: 0.9;
  font-size: 0.78rem;
}

/* 전역 메인 메뉴 */

.global-menu {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 6px 4px;
  margin: 8px 0;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.82);
  border: 1px solid rgba(148, 163, 184, 0.6);
}

.global-menu-button {
  padding: 5px 12px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.7);
  background: rgba(15, 23, 42, 0.7);
  color: #e5e7eb;
  font-size: 0.78rem;
  cursor: pointer;
  white-space: nowrap;
}

.global-menu-button.active {
  background: rgba(96, 165, 250, 0.4);
  border-color: rgba(96, 165, 250, 0.9);
}

/* 본문 영역 */

.game-body {
  margin-top: 8px;
  flex: 1;
  min-height: 0;
  display: flex;
}

/* 대시보드 */

.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.dashboard-card {
  padding: 14px 12px;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.86);
  border: 1px solid rgba(148, 163, 184, 0.55);
}

.log-section {
  margin-top: 4px;
}

/* 공통 카드 페이지 */

.simple-page {
  padding: 14px 12px;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.86);
  border: 1px solid rgba(148, 163, 184, 0.55);
}

.page-title {
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 6px;
}

.page-desc {
  font-size: 0.82rem;
  opacity: 0.9;
  line-height: 1.5;
}

/* 노선 페이지 래퍼 */

.routes-page-wrapper {
  flex: 1;
  min-height: 0;
}

/* 차량/편성 페이지 */

.trains-page-wrapper {
  flex: 1;
  min-height: 0;
}

/* 운행/배차 페이지 */

.operations-page-wrapper {
  flex: 1;
  min-height: 0;
}

/* 로그 페이지 */

.logs-page-wrapper {
  flex: 1;
  min-height: 0;
  display: flex;
}

.logs-card {
  flex: 1;
  padding: 14px 12px;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.86);
  border: 1px solid rgba(148, 163, 184, 0.55);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.logs-panel-wrapper {
  margin-top: 4px;
}

/* 설정 페이지 */

.settings-page-wrapper {
  flex: 1;
  min-height: 0;
}

/* WIKI / DEVLOG / ABOUT 래퍼 */

.wiki-page-wrapper,
.devlog-page,
.about-page,
.home-page {
  flex: 1;
  min-height: 0;
}

/* 메인 액션 버튼 */

.primary-button {
  margin-top: 12px;
  padding: 8px 16px;
  border-radius: 999px;
  border: 1px solid rgba(96, 165, 250, 0.9);
  background: rgba(37, 99, 235, 0.9);
  color: #e5e7eb;
  font-size: 0.84rem;
  cursor: pointer;
}

/* 반응형 */

@media (min-width: 768px) {
  .main-content {
    padding: 20px 28px 28px;
  }

  .dashboard-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
  }
}
</style>
