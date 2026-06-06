<!--
  파일명: src/App.vue

  역할:
  - 테라리아 표준시간 비서 스케줄러의 전체 앱 레이아웃입니다.
  - 기존 RCTS 교통 시뮬레이션 메뉴를 제거하고,
    본부 / 비서실 / 스케줄 / 진행현황 / 가족 구조로 재구성합니다.

  수정:
  - template 닫힘 태그 누락으로 발생할 수 있는 Vite SFC 파싱 오류를 방지하기 위해
    App.vue 템플릿을 명확한 닫힘 태그 구조로 재작성했습니다.
-->

<template>
  <div class="app-shell">
    <header class="app-header">
      <div class="brand-area">
        <p class="brand-kicker">STANDARD TIME OFFICE</p>
        <h1>테라리아</h1>
        <span>카운터 임무 · 비서 표준시간 진행 · 업무 보고</span>
      </div>

      <div class="header-status">
        <article class="status-card">
          <span>표준시간</span>
          <strong>{{ standardTimeText }}</strong>
        </article>

        <article class="status-card">
          <span>회사 상태</span>
          <strong>{{ terrariaState.initialized ? '운영 중' : '설립 대기' }}</strong>
        </article>
      </div>
    </header>

    <nav class="desktop-nav">
      <RouterLink
        v-for="menu in menus"
        :key="menu.to"
        :to="menu.to"
        class="nav-item"
        :class="{ active: route.path === menu.to }"
      >
        <span class="nav-icon">{{ menu.icon }}</span>
        <span>{{ menu.label }}</span>
        <em v-if="menu.badge !== null">{{ menu.badge }}</em>
      </RouterLink>
    </nav>

    <main class="app-main">
      <RouterView></RouterView>
    </main>

    <nav class="mobile-tabbar">
      <RouterLink
        v-for="menu in menus"
        :key="`mobile-${menu.to}`"
        :to="menu.to"
        class="mobile-tab"
        :class="{ active: route.path === menu.to }"
      >
        <span>{{ menu.icon }}</span>
        <strong>{{ menu.label }}</strong>
      </RouterLink>
    </nav>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'

import {
  standardTimeText,
  startStandardTimeClock,
  stopStandardTimeClock,
} from './modules/time'

import {
  loadSaveData,
  saveDataNow,
  startAutoSave,
  stopAutoSave,
} from './modules/save'

import {
  getTerrariaSnapshot,
  restoreTerrariaSnapshot,
  stateSummary,
  terrariaState,
} from './stores/terrariaManager'

const route = useRoute()

const createSnapshot = () => ({
  terraria: getTerrariaSnapshot(),
  ui: {
    lastRoutePath: route.path,
  },
})

const menus = computed(() => [
  {
    label: '본부',
    to: '/headquarters',
    icon: '🏢',
    badge: null,
  },
  {
    label: '비서실',
    to: '/secretary-office',
    icon: '🗂️',
    badge: stateSummary.value.pendingReports,
  },
  {
    label: '스케줄',
    to: '/schedule',
    icon: '📅',
    badge: stateSummary.value.reservedTasks,
  },
  {
    label: '진행현황',
    to: '/progress',
    icon: '⏱️',
    badge: stateSummary.value.runningTasks,
  },
  {
    label: '가족',
    to: '/family',
    icon: '🏠',
    badge: null,
  },
])

onMounted(() => {
  startStandardTimeClock()

  const savePayload = loadSaveData()

  if (savePayload?.data?.terraria) {
    restoreTerrariaSnapshot(savePayload.data.terraria)
  }

  startAutoSave(createSnapshot)
})

onBeforeUnmount(() => {
  saveDataNow(createSnapshot())
  stopAutoSave()
  stopStandardTimeClock()
})
</script>

<style scoped>
:global(*) {
  box-sizing: border-box;
}

:global(body) {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(59, 130, 246, 0.22), transparent 34rem),
    linear-gradient(135deg, #07111f 0%, #101827 45%, #111827 100%);
  color: #e5edf7;
  font-family:
    Inter,
    Pretendard,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
}

:global(button),
:global(input),
:global(select) {
  font: inherit;
}

:global(button) {
  cursor: pointer;
}

:global(html),
:global(body),
:global(.app-shell),
:global(.desktop-nav),
:global(.app-main),
:global(.panel),
:global(.mobile-tabbar) {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

:global(*::-webkit-scrollbar) {
  width: 0;
  height: 0;
}

.app-shell {
  min-height: 100vh;
  padding-bottom: 0;
}

.app-header {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.5rem clamp(1rem, 3vw, 2.5rem);
  border-bottom: 1px solid rgba(148, 163, 184, 0.2);
  background: rgba(15, 23, 42, 0.82);
  backdrop-filter: blur(16px);
  position: sticky;
  top: 0;
  z-index: 20;
}

.brand-area {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.brand-kicker {
  margin: 0;
  color: #38bdf8;
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.22em;
}

.brand-area h1 {
  margin: 0;
  font-size: clamp(1.75rem, 4vw, 2.6rem);
  letter-spacing: -0.04em;
}

.brand-area span {
  color: #94a3b8;
  font-size: 0.92rem;
}

.header-status {
  display: flex;
  gap: 0.75rem;
  align-items: stretch;
}

.status-card {
  min-width: 13rem;
  padding: 0.85rem 1rem;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 1rem;
  background: rgba(15, 23, 42, 0.7);
}

.status-card span {
  display: block;
  margin-bottom: 0.35rem;
  color: #94a3b8;
  font-size: 0.78rem;
}

.status-card strong {
  display: block;
  color: #f8fafc;
  font-size: 0.98rem;
}

.desktop-nav {
  display: flex;
  gap: 0.65rem;
  padding: 1rem clamp(1rem, 3vw, 2.5rem) 0;
  overflow-x: auto;
}

.nav-item {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.85rem 1rem;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.55);
  color: #cbd5e1;
  text-decoration: none;
  white-space: nowrap;
  transition: 0.18s ease;
}

.nav-item.active,
.nav-item:hover {
  border-color: rgba(56, 189, 248, 0.7);
  background: rgba(14, 165, 233, 0.17);
  color: #f8fafc;
}

.nav-item em {
  min-width: 1.35rem;
  padding: 0.12rem 0.38rem;
  border-radius: 999px;
  background: rgba(56, 189, 248, 0.22);
  color: #bae6fd;
  font-size: 0.74rem;
  font-style: normal;
  text-align: center;
}

.app-main {
  width: min(1440px, 100%);
  margin: 0 auto;
  padding: 1.2rem clamp(1rem, 3vw, 2.5rem) 2.5rem;
}

.mobile-tabbar {
  display: none;
}

:global(.page) {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

:global(.page-title) {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 1rem;
  padding: 1.25rem;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 1.25rem;
  background: rgba(15, 23, 42, 0.62);
}

:global(.page-title p) {
  margin: 0 0 0.4rem;
  color: #38bdf8;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.14em;
}

:global(.page-title h2) {
  margin: 0;
  font-size: clamp(1.45rem, 3vw, 2rem);
}

:global(.page-title span) {
  color: #94a3b8;
  line-height: 1.6;
}

:global(.grid) {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 1rem;
}

:global(.panel) {
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 1.25rem;
  background: rgba(15, 23, 42, 0.68);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.18);
  overflow: hidden;
}

:global(.panel-inner) {
  padding: 1.1rem;
}

:global(.panel-head) {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem 1.1rem;
  border-bottom: 1px solid rgba(148, 163, 184, 0.14);
}

:global(.panel-head p) {
  margin: 0 0 0.35rem;
  color: #94a3b8;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.12em;
}

:global(.panel-head h3) {
  margin: 0;
  color: #f8fafc;
}

:global(.empty) {
  padding: 1.3rem;
  border: 1px dashed rgba(148, 163, 184, 0.28);
  border-radius: 1rem;
  color: #94a3b8;
  text-align: center;
  line-height: 1.6;
}

:global(.button-row) {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

:global(.primary-button),
:global(.ghost-button),
:global(.danger-button) {
  border: 0;
  border-radius: 0.8rem;
  padding: 0.72rem 0.95rem;
  font-weight: 800;
}

:global(.primary-button) {
  background: linear-gradient(135deg, #38bdf8, #2563eb);
  color: white;
}

:global(.ghost-button) {
  border: 1px solid rgba(148, 163, 184, 0.24);
  background: rgba(15, 23, 42, 0.55);
  color: #dbeafe;
}

:global(.danger-button) {
  background: rgba(239, 68, 68, 0.18);
  color: #fecaca;
}

:global(.field) {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

:global(.field span) {
  color: #cbd5e1;
  font-size: 0.82rem;
  font-weight: 800;
}

:global(.field input),
:global(.field select) {
  width: 100%;
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 0.85rem;
  padding: 0.75rem 0.85rem;
  background: rgba(2, 6, 23, 0.45);
  color: #f8fafc;
}

:global(.mini-grid) {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.75rem;
}

:global(.stat-card) {
  padding: 1rem;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 1rem;
  background: rgba(2, 6, 23, 0.26);
}

:global(.stat-card span) {
  display: block;
  margin-bottom: 0.35rem;
  color: #94a3b8;
  font-size: 0.78rem;
}

:global(.stat-card strong) {
  font-size: 1.45rem;
  color: #f8fafc;
}

:global(.list) {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

:global(.item-card) {
  padding: 1rem;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 1rem;
  background: rgba(2, 6, 23, 0.24);
}

:global(.item-card h4) {
  margin: 0 0 0.35rem;
  color: #f8fafc;
}

:global(.item-card p) {
  margin: 0;
  color: #cbd5e1;
  line-height: 1.55;
}

:global(.meta-row) {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.75rem;
}

:global(.pill) {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  border-radius: 999px;
  padding: 0.3rem 0.55rem;
  background: rgba(148, 163, 184, 0.14);
  color: #cbd5e1;
  font-size: 0.78rem;
}

:global(.progress-bar) {
  height: 0.7rem;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.18);
  overflow: hidden;
}

:global(.progress-bar > span) {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #38bdf8, #22c55e);
}

@media (max-width: 860px) {
  .app-header {
    position: static;
    flex-direction: column;
  }

  .header-status {
    flex-direction: column;
  }

  .status-card {
    min-width: 0;
  }

  .desktop-nav {
    display: none;
  }

  .app-main {
    padding-bottom: 6rem;
  }

  .mobile-tabbar {
    position: fixed;
    z-index: 30;
    left: 0;
    right: 0;
    bottom: 0;
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 0.15rem;
    padding: 0.5rem;
    border-top: 1px solid rgba(148, 163, 184, 0.22);
    background: rgba(15, 23, 42, 0.94);
    backdrop-filter: blur(16px);
  }

  .mobile-tab {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.15rem;
    padding: 0.45rem 0.2rem;
    border-radius: 0.8rem;
    color: #94a3b8;
    text-decoration: none;
    font-size: 0.75rem;
  }

  .mobile-tab.active {
    background: rgba(56, 189, 248, 0.16);
    color: #f8fafc;
  }

  :global(.page-title) {
    flex-direction: column;
    align-items: stretch;
  }

  :global(.grid) {
    grid-template-columns: 1fr;
  }
}
</style>
