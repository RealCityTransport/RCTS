<!--
  파일명: src/App.vue

  역할:
  - RCTS v2 전체 앱 공통 레이아웃입니다.
  - Vue Router 메뉴 3개를 관리합니다.
  - gameStore를 통해 저장 모듈과 시간 모듈을 부팅합니다.

  현재 구조:
  - 운영 슬롯
  - 차량 구입
  - 연구

  변경사항:
  - 헤더 부제 제거
  - 온라인 상태 표시 제거
  - 연구 → 구입 → 슬롯 추가 → 운행 흐름 라인 제거
  - 운영 슬롯 배지를 3/10, 12/∞ 형태로 표시합니다.
-->

<template>
  <div class="app-shell">
    <!-- 상단 헤더 -->
    <header class="app-header">
      <div class="brand-area">
        <h1 class="brand">RCTS</h1>
      </div>

      <div class="header-right">
        <!-- 표준시간 디지털 표시 -->
        <div class="digital-clock">
          <span>표준시간</span>
          <strong>{{ standardTimeText }}</strong>
        </div>

        <!-- 보유 자금 -->
        <div class="money-card">
          <span>보유 자금</span>
          <strong>{{ formattedMoney }}</strong>
        </div>
      </div>
    </header>

    <!-- PC 전용 상단 메뉴 -->
    <nav class="desktop-nav">
      <RouterLink
        v-for="menu in menus"
        :key="menu.to"
        :to="menu.to"
        class="desktop-nav-item"
        :class="{ active: isActive(menu.to) }"
      >
        <span class="menu-icon">{{ menu.icon }}</span>

        <span class="menu-label-wrap">
          <span>{{ menu.label }}</span>

          <span
            v-if="menu.badge !== null"
            class="menu-count-badge"
          >
            {{ menu.badge }}
          </span>
        </span>
      </RouterLink>
    </nav>

    <!-- 라우터 페이지 출력 영역 -->
    <main class="app-main">
      <RouterView />
    </main>

    <!-- 모바일 전용 하단 탭바 -->
    <nav class="mobile-tabbar">
      <RouterLink
        v-for="menu in menus"
        :key="menu.to"
        :to="menu.to"
        class="mobile-tab-item"
        :class="{ active: isActive(menu.to) }"
      >
        <span class="menu-icon">{{ menu.icon }}</span>

        <span class="menu-label-wrap">
          <span>{{ menu.label }}</span>

          <span
            v-if="menu.badge !== null"
            class="menu-count-badge"
          >
            {{ menu.badge }}
          </span>
        </span>
      </RouterLink>
    </nav>
  </div>
</template>

<script setup>
/*
  App.vue 스크립트 영역

  현재 역할:
  - gameStore 부팅
  - 시간 모듈 시작
  - 저장 모듈 시작
  - 라우터 메뉴 표시
  - 운영 슬롯 현황을 탭 메뉴에 표시
*/

import { computed, onBeforeUnmount, onMounted } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'

import {
  bootstrapGame,
  formattedMoney,
  handleGameBeforeUnload,
  handleGameVisibilityChange,
  operationSlotMenuBadge,
  shutdownGame,
  standardTimeText,
} from './stores/gameStore'

const route = useRoute()

/*
  App에서 노출하는 최상위 메뉴 3개

  badge:
  - null이면 배지 표시 안 함
  - 운영 슬롯은 현재 슬롯/최대 슬롯 표시
  - 예: 3/10
  - 무제한 해금 후: 12/∞
*/
const menus = computed(() => [
  {
    label: '운영 슬롯',
    to: '/operations',
    icon: '🚍',
    badge: operationSlotMenuBadge.value,
  },
  {
    label: '차량 구입',
    to: '/vehicles',
    icon: '🛒',
    badge: null,
  },
  {
    label: '연구',
    to: '/research',
    icon: '🧪',
    badge: null,
  },
])

/*
  현재 메뉴 활성화 판정
*/
const isActive = (path) => {
  if (path === '/operations') {
    return route.path === '/' || route.path === '/operations'
  }

  return route.path === path
}

/*
  App 시작
*/
onMounted(() => {
  bootstrapGame()

  document.addEventListener('visibilitychange', handleGameVisibilityChange)
  window.addEventListener('beforeunload', handleGameBeforeUnload)
})

/*
  App 종료
*/
onBeforeUnmount(() => {
  shutdownGame()

  document.removeEventListener('visibilitychange', handleGameVisibilityChange)
  window.removeEventListener('beforeunload', handleGameBeforeUnload)
})
</script>

<style scoped>
/*
  App.vue 스타일 영역

  기본 방향:
  - 모바일 우선
  - 1024px 이상부터 PC 레이아웃
  - 모바일에서는 하단 탭바 표시
  - PC에서는 상단 메뉴 표시
  - 표준시간은 헤더에서 디지털 시계처럼 표시
  - 스크롤은 허용하되 스크롤바는 숨김
*/

:global(*) {
  box-sizing: border-box;
}

/*
  스크롤바 숨김

  핵심:
  - 스크롤 동작은 유지합니다.
  - 화면에 보이는 스크롤바만 숨깁니다.
  - html/body뿐 아니라 내부 스크롤 영역에도 적용합니다.
*/
:global(html),
:global(body),
:global(*) {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

:global(html::-webkit-scrollbar),
:global(body::-webkit-scrollbar),
:global(*::-webkit-scrollbar) {
  display: none;
  width: 0;
  height: 0;
}

:global(body) {
  margin: 0;
  font-family:
    Pretendard,
    'Noto Sans KR',
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    sans-serif;
  background: #eef3f8;
  color: #142033;
  overflow-x: hidden;
}

:global(a) {
  color: inherit;
  text-decoration: none;
}

/* 전체 앱 배경 */
.app-shell {
  min-height: 100vh;
  padding-bottom: 82px;
  background:
    radial-gradient(circle at top left, rgba(22, 119, 255, 0.12), transparent 34%),
    linear-gradient(180deg, #f7fbff 0%, #eef3f8 100%);
}

/* 상단 헤더 */
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px;
  background: linear-gradient(135deg, #0d1b2f 0%, #15345d 100%);
  color: #fff;
  box-shadow: 0 10px 28px rgba(7, 20, 38, 0.18);
}

.brand-area {
  min-width: 0;
}

.brand {
  margin: 0;
  font-size: 32px;
  font-weight: 900;
  line-height: 1;
  letter-spacing: 0.02em;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 표준시간 디지털 시계 */
.digital-clock {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  min-width: 148px;
  padding: 8px 12px;
  border: 1px solid rgba(167, 203, 255, 0.18);
  border-radius: 14px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06)),
    rgba(0, 0, 0, 0.14);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.04),
    0 6px 16px rgba(0, 0, 0, 0.12);
}

.digital-clock span {
  margin-bottom: 3px;
  color: #9fb8d8;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.digital-clock strong {
  color: #d7ecff;
  font-family:
    'JetBrains Mono',
    'Consolas',
    'SFMono-Regular',
    monospace;
  font-size: 16px;
  font-weight: 900;
  letter-spacing: 0.02em;
  white-space: nowrap;
}

/* 보유 자금 표시 */
.money-card {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.money-card span {
  font-size: 11px;
  opacity: 0.72;
}

.money-card strong {
  color: #ffd45a;
  font-size: 20px;
  font-weight: 900;
  white-space: nowrap;
}

/* PC 메뉴는 모바일에서 숨김 */
.desktop-nav {
  display: none;
}

/* 메뉴 내부 라벨 + 배지 */
.menu-label-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 0;
}

.menu-count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 21px;
  height: 21px;
  padding: 0 7px;
  border-radius: 999px;
  background: rgba(22, 119, 255, 0.12);
  color: #1677ff;
  font-size: 12px;
  font-weight: 900;
  line-height: 1;
}

.desktop-nav-item.active .menu-count-badge,
.mobile-tab-item.active .menu-count-badge {
  background: rgba(255, 255, 255, 0.22);
  color: #fff;
}

/* 라우터 화면 영역 */
.app-main {
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 14px 16px 16px;
}

/* 모바일 하단 탭바 */
.mobile-tabbar {
  position: fixed;
  z-index: 50;
  left: 0;
  right: 0;
  bottom: 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 10px 12px calc(10px + env(safe-area-inset-bottom));
  background: rgba(13, 27, 47, 0.96);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(16px);
}

.mobile-tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  min-height: 54px;
  border-radius: 16px;
  color: #cfe0f7;
  font-size: 12px;
  font-weight: 800;
  transition: 0.2s ease;
}

.mobile-tab-item .menu-count-badge {
  min-width: 18px;
  height: 18px;
  padding: 0 6px;
  background: rgba(255, 255, 255, 0.1);
  color: #d7e6ff;
  font-size: 11px;
}

.mobile-tab-item.active {
  background: #1677ff;
  color: #fff;
  box-shadow: 0 8px 18px rgba(22, 119, 255, 0.32);
}

.menu-icon {
  font-size: 18px;
  line-height: 1;
}

/* 작은 모바일 화면 대응 */
@media (max-width: 520px) {
  .app-header {
    align-items: flex-start;
  }

  .header-right {
    flex-direction: column;
    align-items: flex-end;
    gap: 6px;
  }

  .digital-clock {
    min-width: 138px;
    padding: 7px 10px;
  }

  .digital-clock strong {
    font-size: 14px;
  }

  .money-card strong {
    font-size: 17px;
  }
}

/* PC 레이아웃 */
@media (min-width: 1024px) {
  .app-shell {
    padding-bottom: 0;
  }

  .app-header {
    padding: 20px 32px;
  }

  .digital-clock {
    min-width: 184px;
    padding: 10px 14px;
  }

  .digital-clock span {
    font-size: 11px;
  }

  .digital-clock strong {
    font-size: 19px;
  }

  .desktop-nav {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
    max-width: 1280px;
    margin: 0 auto;
    padding: 18px 32px 0;
  }

  .desktop-nav-item {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    min-height: 56px;
    border: 1px solid #d7e2ee;
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.86);
    color: #1c3557;
    font-size: 16px;
    font-weight: 900;
    box-shadow: 0 8px 20px rgba(24, 54, 94, 0.08);
    transition: 0.2s ease;
  }

  .desktop-nav-item.active {
    background: #1677ff;
    color: #fff;
    border-color: #1677ff;
    box-shadow: 0 12px 24px rgba(22, 119, 255, 0.24);
  }

  .desktop-nav-item:hover {
    transform: translateY(-1px);
  }

  .app-main {
    padding: 18px 32px 32px;
  }

  .mobile-tabbar {
    display: none;
  }
}
</style>