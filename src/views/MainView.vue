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

      <!-- 상단 메뉴 -->
      <MainTopMenu v-model="activeMenu" />

      <!-- 본문 -->
      <main class="game-body">
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

        <!-- 노선 -->
        <section
          v-else-if="activeMenu === 'routes'"
          class="routes-page-wrapper"
        >
          <MainRoutesPage />
        </section>

        <!-- 지도 -->
        <section
          v-else-if="activeMenu === 'map'"
          class="map-page-wrapper"
        >
          <MainMapPage />
        </section>

        <!-- 건설 -->
        <section
          v-else-if="activeMenu === 'construction'"
          class="simple-page"
        >
          <h2 class="page-title">건설</h2>
          <p class="page-desc">
            역, 정류장, 차량기지, 노선 인프라 등을 배치·업그레이드하는 화면입니다.<br />
            이후 타일/구역 기반 건설 UI와 자금·시간 소모 로직을 이 영역부터 확장할 수 있습니다.
          </p>
        </section>

        <!-- 연구 -->
        <section
          v-else-if="activeMenu === 'research'"
          class="simple-page"
        >
          <h2 class="page-title">연구 · 개발</h2>
          <p class="page-desc">
            연구 트리와 효과 해금 화면입니다.
          </p>
        </section>

        <!-- 재정 -->
        <section
          v-else-if="activeMenu === 'finance'"
          class="simple-page"
        >
          <h2 class="page-title">재정 · 수익 관리</h2>
          <p class="page-desc">
            수익/비용 흐름을 관리하는 화면입니다.
          </p>
        </section>

        <!-- 위키 -->
        <section v-else-if="activeMenu === 'wiki'">
          <MainWikiPage />
        </section>

        <!-- 커뮤니티 -->
        <section v-else-if="activeMenu === 'community'">
          <MainCommunityPage />
        </section>

        <!-- 설정 -->
        <section
          v-else-if="activeMenu === 'settings'"
          class="simple-page"
        >
          <h2 class="page-title">설정</h2>
          <p class="page-desc">
            게임 환경/옵션을 설정할 수 있습니다.
          </p>
        </section>
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

import MainCommunityPage from '@/components/main/MainCommunityPage.vue'
import MainWikiPage from '@/components/main/MainWikiPage.vue'

import MainMapPage from '@/components/main/MainMapPage.vue'

const { now: kstNow } = useKstTime(1000)

const isNight = computed(() => {
  const hour = kstNow.value.getHours()
  return hour >= 18 || hour < 6
})

const activeMenu = ref('dashboard')

const { user, isLoggedIn, signInWithGoogle, logout } = useFirebaseAuth()
const displayName = computed(() => {
  return user.value?.displayName || '게스트'
})

const { selectRoute } = useRoutesStore()

function handleOpenRouteFromSummary(routeId) {
  if (!routeId) return
  selectRoute(routeId)
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

/* 본문 영역 */

.game-body {
  margin-top: 12px;
  flex: 1;
  min-height: 0;
  display: flex; /* flex-direction 없음 */
}

/* 대시보드 */

.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
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
}

/* 지도 페이지 래퍼: 남은 세로를 모두 사용 */

.map-page-wrapper {
  flex: 1;
  min-height: 0;
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
