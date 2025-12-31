<!-- src/mobile/MainView.vue -->
<template>
  <div class="mobile-main-view">
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
    <div class="mobile-main-content">
      <!-- 상단 헤더 -->
      <header class="mobile-header">
        <div class="header-left">
          <h1 class="game-title">RCTS</h1>
        </div>

        <div class="header-right">
          <template v-if="!isLoggedIn">
            <button
              type="button"
              class="icon-button"
              @click="signInWithGoogle"
            >
              로그인
            </button>
          </template>

          <template v-else>
            <span class="login-user">
              {{ displayName }} 접속 중
            </span>
            <button
              type="button"
              class="icon-button ghost"
              @click="logout"
            >
              로그아웃
            </button>
          </template>
        </div>
      </header>

      <!-- 상단 시간 바 + PLAY 내부 메뉴 햄버거 -->
      <section class="mobile-time-bar">
        <div class="time-left">
          <MainGameClock :now="kstNow" />
        </div>

        <!-- PLAY 내부 탭용 햄버거 -->
        <button
          v-if="globalMenu === 'play'"
          type="button"
          class="hamburger-button"
          @click="isPlayMenuOpen = !isPlayMenuOpen"
        >
          ☰
        </button>
      </section>

      <!-- PLAY 내부 상단 탭 -->
      <div
        v-if="globalMenu === 'play' && isPlayMenuOpen"
        class="mobile-play-top-menu"
      >
        <MainTopMenu v-model="activeMenu" />
      </div>

      <!-- 본문 -->
      <main class="mobile-body">
        <!-- 1) PLAY 영역 -->
        <template v-if="globalMenu === 'play'">
          <!-- 노선 (Routes) -->
          <section
            v-if="activeMenu === 'routes'"
            class="page-wrapper"
          >
            <MainRoutesMobilePage />
          </section>

          <!-- 차량 · 장비 (Vehicles) -->
          <section
            v-else-if="activeMenu === 'vehicles'"
            class="page-wrapper"
          >
            <MainVehiclesPage />
          </section>

          <!-- 운행 · 배차 (Operations) -->
          <section
            v-else-if="activeMenu === 'operations'"
            class="page-wrapper simple-page"
          >
            <h2 class="page-title">운행 · 배차 관리</h2>
            <p class="page-desc">
              노선별 운행 스케줄과 배차 간격을 설정하는 화면입니다.<br />
              모바일에서는 요약/핵심 기능 위주로 먼저 구성하고,
              상세 편집은 이후 단계에서 확장할 수 있습니다.
            </p>
          </section>

          <!-- 설정 -->
          <section
            v-else-if="activeMenu === 'settings'"
            class="page-wrapper simple-page"
          >
            <h2 class="page-title">설정</h2>
            <p class="page-desc">
              게임 환경과 옵션을 설정할 수 있습니다.<br />
              모바일 인터페이스에서 자주 사용하는 옵션을 우선 배치하고,
              세부 설정은 PC 전용 화면에 더 두텁게 배치하는 구조로 가져갈 수 있습니다.
            </p>
          </section>
        </template>

        <!-- 2) WIKI 영역 -->
        <template v-else-if="globalMenu === 'wiki'">
          <section class="page-wrapper">
            <MainWikiPage />
          </section>
        </template>

        <!-- 3) DEVLOG 영역 -->
        <template v-else-if="globalMenu === 'devlog'">
          <section class="page-wrapper">
            <MainDevlogPage />
          </section>
        </template>

        <!-- 4) ABOUT 영역 -->
        <template v-else-if="globalMenu === 'about'">
          <section class="page-wrapper simple-page">
            <MainAboutPage />
          </section>
        </template>
      </main>
    </div>

    <!-- 하단 전역 메뉴: PLAY / WIKI / DEVLOG / ABOUT -->
    <nav class="mobile-bottom-nav">
      <button
        v-for="item in globalMenus"
        :key="item.key"
        type="button"
        class="bottom-nav-button"
        :class="{ active: globalMenu === item.key }"
        @click="handleBottomNavClick(item.key)"
      >
        <span class="bottom-nav-label">
          {{ item.label }}
        </span>
      </button>
    </nav>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useKstTime } from '@/composables/useKstTime'
import { useFirebaseAuth } from '@/composables/useFirebaseAuth'
import { useRoutesStore } from '@/composables/useRoutesStore'

import dayImage from '@/assets/bg-city-day.png'
import nightImage from '@/assets/bg-city-night.png'

import MainTopMenu from '@/components/main/MainTopMenu.vue'
import MainGameClock from '@/components/main/MainGameClock.vue'

import MainRoutesMobilePage from '@/components/main/MainRoutesMobilePage.vue'
import MainWikiPage from '@/components/main/MainWikiPage.vue'
import MainAboutPage from '@/components/main/MainAboutPage.vue'
import MainDevlogPage from '@/components/main/MainDevlogPage.vue'
import MainVehiclesPage from '@/components/main/MainVehiclesPage.vue'

// 시계
const { now: kstNow } = useKstTime(1000)

// 낮/밤 전환
const isNight = computed(() => {
  const hour = kstNow.value.getHours()
  return hour >= 18 || hour < 6
})

// 전역 메인 메뉴 상태: play | wiki | devlog | about (하단 탭)
const globalMenus = [
  { key: 'play', label: 'PLAY' },
  { key: 'wiki', label: 'WIKI' },
  { key: 'devlog', label: 'DEVLOG' },
  { key: 'about', label: 'ABOUT' },
]
const globalMenu = ref('play')

// PLAY 내부 메뉴: MainTopMenu 와 1:1 대응
// 기본값을 'routes'로
const activeMenu = ref('routes')

// 모바일 PLAY 내부 메뉴 펼침 상태
const isPlayMenuOpen = ref(false)

// 로그인 상태
const { user, isLoggedIn, signInWithGoogle, logout } = useFirebaseAuth()
const displayName = computed(() => {
  return user.value?.displayName || '게스트'
})

// 노선 요약에서 특정 노선 열기 (현재는 요약 패널을 안 쓰지만, 추후 확장용으로 남겨둠)
const { selectRoute } = useRoutesStore()

function handleOpenRouteFromSummary(routeId) {
  if (!routeId) return
  selectRoute(routeId)
  globalMenu.value = 'play'
  activeMenu.value = 'routes'
}

// 하단 전역 메뉴 클릭 처리
function handleBottomNavClick(key) {
  globalMenu.value = key

  // PLAY 외 다른 탭으로 이동 시, PLAY 내부 메뉴는 접어두기
  if (key !== 'play') {
    isPlayMenuOpen.value = false
  }

  // PLAY로 돌아오는데 activeMenu가 비어있으면 노선으로
  if (key === 'play' && !activeMenu.value) {
    activeMenu.value = 'routes'
  }
}

// 전역 메뉴가 바뀔 때도 PLAY가 아니면 내부 메뉴 접기
watch(globalMenu, value => {
  if (value !== 'play') {
    isPlayMenuOpen.value = false
  }
})
</script>

<style scoped>
.mobile-main-view {
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

/* 메인 컨텐츠 */

.mobile-main-content {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  padding: 12px 10px 72px; /* 하단 탭 높이만큼 패딩 확보 */
  box-sizing: border-box;

  display: flex;
  flex-direction: column;
}

/* 상단 헤더 */

.mobile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;

  padding: 8px 10px;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(148, 163, 184, 0.7);
}

.header-left {
  display: flex;
  align-items: center;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 6px;
}

.game-title {
  font-size: 1.2rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

/* 로그인 / 로그아웃 */

.icon-button {
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.9);
  background: rgba(15, 23, 42, 0.95);
  color: #e5e7eb;
  font-size: 0.75rem;
  cursor: pointer;
}

.icon-button.ghost {
  border-color: rgba(248, 113, 113, 0.9);
}

.login-user {
  max-width: 110px;
  font-size: 0.72rem;
  opacity: 0.9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 상단 시간 바 + 햄버거 */

.mobile-time-bar {
  margin-top: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.6);
  display: flex;
  align-items: center;
  gap: 8px;
}

.time-left {
  flex: 1;
  min-width: 0;
}

.hamburger-button {
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.8);
  background: rgba(15, 23, 42, 0.95);
  color: #e5e7eb;
  font-size: 0.9rem;
  cursor: pointer;
}

/* PLAY 내부 상단 메뉴 (펼침 영역) */

.mobile-play-top-menu {
  margin-top: 6px;
}

/* 본문 */

.mobile-body {
  margin-top: 10px;
  flex: 1;
  min-height: 0;

  display: flex;
  flex-direction: column;
}

/* 대시보드 관련 클래스는 남겨두지만 현재는 사용하지 않음 */

.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
}

.dashboard-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dashboard-card {
  padding: 12px 10px;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.6);
}

.log-section {
  margin-top: 2px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.section-title {
  font-size: 0.9rem;
  font-weight: 700;
}

.log-card {
  padding: 10px 8px;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.6);
}

/* 공통 페이지 래퍼 */

.page-wrapper {
  flex: 1;
  min-height: 0;
}

/* 공통 카드 스타일 페이지 */

.simple-page {
  padding: 12px 10px;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.6);
}

.page-title {
  font-size: 0.95rem;
  font-weight: 700;
  margin-bottom: 4px;
}

.page-desc {
  font-size: 0.8rem;
  opacity: 0.95;
  line-height: 1.5;
}

/* 로그 영역 */

.logs-panel-wrapper {
  margin-top: 6px;
}

/* 하단 전역 메뉴 (탭 바) */

.mobile-bottom-nav {
  position: fixed;
  z-index: 2;
  left: 0;
  right: 0;
  bottom: 0;

  padding: 6px 8px 10px;
  background: linear-gradient(
    to top,
    rgba(15, 23, 42, 0.96),
    rgba(15, 23, 42, 0.9)
  );
  border-top: 1px solid rgba(148, 163, 184, 0.7);

  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.bottom-nav-button {
  flex: 1;
  min-width: 0;
  padding: 6px 4px;
  border-radius: 999px;
  border: 1px solid transparent;
  background: transparent;
  color: #9ca3af;
  font-size: 0.72rem;
  text-align: center;
  cursor: pointer;
}

.bottom-nav-button.active {
  background: rgba(37, 99, 235, 0.9);
  border-color: rgba(96, 165, 250, 0.95);
  color: #e5e7eb;
}

.bottom-nav-label {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
