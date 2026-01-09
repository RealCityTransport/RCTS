<!-- src/components/play/PlayPage.vue -->
<template>
  <div class="play-page-root">
    <section class="play-shell">
      <!-- 상단 헤더 -->
      <header class="play-header">
        <div class="play-header-left">
          <p class="play-badge">PLAY · HUB</p>
          <h2 class="play-title">RCTS 플레이 허브</h2>
        </div>

        <!-- 모바일용 햄버거 메뉴 버튼 -->
        <button
          type="button"
          class="play-mobile-menu-toggle"
          :class="{ 'is-open': isMobileMenuOpen }"
          @click="toggleMobileMenu"
        >
          <span class="hamburger-line" :class="{ 'is-open': isMobileMenuOpen }"></span>
          <span class="hamburger-line" :class="{ 'is-open': isMobileMenuOpen }"></span>
          <span class="hamburger-line" :class="{ 'is-open': isMobileMenuOpen }"></span>
        </button>
      </header>

      <!-- 모바일 메뉴 배경 오버레이 -->
      <transition name="mobile-backdrop">
        <div
          v-if="isMobileMenuOpen"
          class="play-mobile-backdrop"
          @click="toggleMobileMenu"
        />
      </transition>

      <!-- 본문 -->
      <main class="play-body">
        <section class="play-layout">
          <!-- LEFT: 데스크톱용 사이드 메뉴 -->
          <nav class="play-sidebar" aria-label="플레이 메뉴">
            <div class="sidebar-header">
              <span class="sidebar-label">플레이 메뉴</span>
            </div>

            <button
              v-for="item in menuItems"
              :key="item.key"
              type="button"
              class="sidebar-item"
              :class="{ 'is-active': activeMenu === item.key }"
              @click="handleSelectMenu(item.key)"
            >
              <span class="sidebar-item-main">
                <span class="sidebar-dot" />
                <span class="sidebar-text">{{ item.label }}</span>
              </span>
              <span v-if="item.badge" class="sidebar-badge">{{ item.badge }}</span>
            </button>
          </nav>

          <!-- 모바일용 햄버거 메뉴 패널 -->
          <transition name="mobile-menu">
            <nav
              v-if="isMobileMenuOpen"
              class="play-mobile-menu"
              aria-label="플레이 메뉴 (모바일)"
            >
              <div class="mobile-menu-header">
                <span class="mobile-menu-title">플레이 메뉴</span>
              </div>

              <button
                v-for="item in menuItems"
                :key="item.key"
                type="button"
                class="mobile-menu-item"
                :class="{ 'is-active': activeMenu === item.key }"
                @click="handleSelectMenu(item.key)"
              >
                <span class="mobile-menu-item-main">
                  <span class="mobile-menu-dot" />
                  <span class="mobile-menu-text">{{ item.label }}</span>
                </span>
                <span v-if="item.badge" class="mobile-menu-badge">{{ item.badge }}</span>
              </button>
            </nav>
          </transition>

          <!-- RIGHT: 메인 영역 -->
          <section class="play-main">
            <div class="play-main-inner">
              <!-- ✅ 회사 페이지 -->
              <CompanyPage v-if="activeMenu === 'company'" />

              <!-- ✅ 운영 페이지 -->
              <OperationsPage v-else-if="activeMenu === 'operations'" />

              <!-- ✅ 노선 페이지 -->
              <RoutesPage v-else-if="activeMenu === 'routes'" />

              <!-- ✅ 차량 페이지 -->
              <VehiclesPage v-else-if="activeMenu === 'vehicles'" />

              <!-- ✅ 설정 페이지 -->
              <SettingsPage v-else-if="activeMenu === 'settings'" />

              <!-- 나머지는 더미 -->
              <div v-else class="section-panel">
                <h3 class="section-title">{{ currentTitle }}</h3>
                <p class="section-desc">
                  이 메뉴는 아직 더미 상태야. 회사 → 운영 → 노선 → 차량 → 설정 순서대로 실제 페이지를 붙일 거고,
                  지금은 UI 구조를 통일하는 단계!
                </p>

                <div class="section-grid">
                  <div class="section-card">
                    <h4 class="section-card-title">현재 메뉴</h4>
                    <p class="section-card-text">
                      {{ currentTitle }} (더미)
                    </p>
                  </div>
                  <div class="section-card">
                    <h4 class="section-card-title">상태</h4>
                    <p class="section-card-text">
                      로직 비활성화 · UI만 표시
                    </p>
                  </div>
                  <div class="section-card">
                    <h4 class="section-card-title">다음 작업</h4>
                    <p class="section-card-text">
                      각 메뉴를 components/play 하위 페이지로 분리해서 연결
                    </p>
                  </div>
                </div>

                <div class="section-actions">
                  <router-link to="/" class="home-link">← Home</router-link>
                </div>
              </div>
            </div>
          </section>
        </section>
      </main>
    </section>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import CompanyPage from '@/components/play/company/CompanyPage.vue'
import OperationsPage from '@/components/play/operations/OperationsPage.vue'
import RoutesPage from '@/components/play/routes/RoutesPage.vue'
import VehiclesPage from '@/components/play/vehicles/VehiclesPage.vue'
import SettingsPage from '@/components/play/settings/SettingsPage.vue'

const router = useRouter()
const route = useRoute()

const menuItems = [
  { key: 'company', label: '회사' },
  { key: 'operations', label: '운영' },
  { key: 'routes', label: '노선' },
  { key: 'vehicles', label: '차량' },
  { key: 'settings', label: '설정' },
]

const isMobileMenuOpen = ref(false)

const activeMenu = computed(() => {
  const tab = route.query.tab
  const key = typeof tab === 'string' ? tab : ''
  return menuItems.some((m) => m.key === key) ? key : 'company'
})

const currentTitle = computed(() => {
  const found = menuItems.find((m) => m.key === activeMenu.value)
  return found ? found.label : '플레이'
})

const handleSelectMenu = async (key) => {
  if (activeMenu.value === key) {
    isMobileMenuOpen.value = false
    return
  }

  await router.push({
    path: '/play',
    query: { ...route.query, tab: key },
  })

  isMobileMenuOpen.value = false
}

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}
</script>

<style scoped>
.play-page-root {
  width: 100%;
  min-height: 100vh;
  box-sizing: border-box;
  padding: 12px 8px 16px;
  display: flex;
  justify-content: center;
}

.play-shell {
  width: 100%;
  max-width: 1800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: calc(100vh - 28px);
  position: relative;
}

/* 헤더 */

.play-header {
  padding: 10px 14px;
  border-radius: 14px;
  background: radial-gradient(
      circle at top left,
      rgba(37, 99, 235, 0.28),
      rgba(15, 23, 42, 0.96)
    );
  border: 1px solid rgba(148, 163, 184, 0.8);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.play-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.play-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 999px;
  border: 1px solid rgba(129, 140, 248, 0.9);
  background: rgba(15, 23, 42, 0.96);
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(248, 250, 252, 0.96);
}

.play-title {
  font-size: 1.02rem;
  font-weight: 800;
  color: rgba(248, 250, 252, 0.96);
}

/* 모바일 햄버거 버튼 */

.play-mobile-menu-toggle {
  display: none;
  width: 40px;
  height: 30px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.9);
  background: radial-gradient(
    circle at center,
    rgba(51, 65, 85, 0.9),
    rgba(15, 23, 42, 1)
  );
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: 0 8px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.9);
  transition:
    transform 0.12s ease-out,
    box-shadow 0.12s ease-out,
    border-color 0.12s ease-out,
    background 0.12s ease-out;
}

.play-mobile-menu-toggle.is-open {
  transform: scale(1.05);
  border-color: rgba(129, 140, 248, 1);
  box-shadow: 0 0 18px rgba(96, 165, 250, 0.9);
  background: radial-gradient(
    circle at center,
    rgba(59, 130, 246, 0.25),
    rgba(15, 23, 42, 1)
  );
}

.hamburger-line {
  width: 18px;
  height: 2px;
  border-radius: 999px;
  background: rgba(226, 232, 240, 0.95);
  transform-origin: center;
  transition:
    transform 0.16s cubic-bezier(0.33, 1, 0.68, 1),
    opacity 0.12s ease-out,
    width 0.16s ease-out,
    box-shadow 0.16s ease-out,
    background 0.16s ease-out;
  box-shadow: 0 0 6px rgba(148, 163, 184, 0.8);
}

.hamburger-line:nth-child(1) { transform-origin: left center; }
.hamburger-line:nth-child(3) { transform-origin: right center; }

.hamburger-line.is-open {
  background: #f8fafc;
  box-shadow: 0 0 10px rgba(248, 250, 252, 1);
}

.hamburger-line.is-open:nth-child(1) {
  transform: translateY(4px) rotate(42deg);
}

.hamburger-line.is-open:nth-child(2) {
  opacity: 0;
  width: 0;
}

.hamburger-line.is-open:nth-child(3) {
  transform: translateY(-4px) rotate(-42deg);
}

/* 모바일 메뉴 배경 오버레이 */

.play-mobile-backdrop {
  position: absolute;
  inset: 0;
  border-radius: 18px;
  background: radial-gradient(
      circle at top,
      rgba(15, 23, 42, 0.6),
      rgba(15, 23, 42, 0.95)
    );
  backdrop-filter: blur(2px);
  z-index: 15;
}

/* 오버레이 트랜지션 */

.mobile-backdrop-enter-active,
.mobile-backdrop-leave-active {
  transition: opacity 0.16s ease-out;
}

.mobile-backdrop-enter-from,
.mobile-backdrop-leave-to {
  opacity: 0;
}

.mobile-backdrop-enter-to,
.mobile-backdrop-leave-from {
  opacity: 1;
}

/* 본문 레이아웃 공통 */

.play-body {
  flex: 1;
  min-height: 0;
  display: flex;
}

/* 3단계 레이아웃 */

.play-layout {
  flex: 1;
  min-height: 0;
  display: flex;
  gap: 10px;
}

/* LEFT: 데스크톱용 사이드바 */

.play-sidebar {
  flex: 0 0 210px;
  border-radius: 14px;
  background: radial-gradient(
      circle at top left,
      rgba(56, 189, 248, 0.18),
      rgba(15, 23, 42, 0.98)
    );
  border: 1px solid rgba(148, 163, 184, 0.85);
  padding: 10px 8px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sidebar-header { padding: 2px 10px 6px; }

.sidebar-label {
  font-size: 0.76rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  opacity: 0.9;
  color: rgba(226, 232, 240, 0.92);
}

.sidebar-item {
  width: 100%;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.75);
  background: radial-gradient(
    circle at left,
    rgba(37, 99, 235, 0.4),
    rgba(15, 23, 42, 0.96)
  );
  padding: 7px 10px;
  margin-bottom: 2px;

  font-size: 0.8rem;
  color: rgba(226, 232, 240, 0.95);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  cursor: pointer;

  transition:
    background 0.16s ease-out,
    border-color 0.16s ease-out,
    box-shadow 0.16s ease-out,
    transform 0.08s ease-out;
}

.sidebar-item-main { display: inline-flex; align-items: center; gap: 8px; }

.sidebar-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 1);
  box-shadow: 0 0 8px rgba(191, 219, 254, 0.8);
}

.sidebar-text { white-space: nowrap; }

.sidebar-badge {
  font-size: 0.72rem;
  padding: 1px 6px;
  border-radius: 999px;
  border: 1px solid rgba(191, 219, 254, 0.9);
  background: rgba(15, 23, 42, 0.88);
}

.sidebar-item:hover {
  border-color: rgba(191, 219, 254, 1);
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.9);
  transform: translateY(-1px);
}

.sidebar-item.is-active {
  border-color: rgba(129, 140, 248, 1);
  background: linear-gradient(
    135deg,
    rgba(79, 70, 229, 0.98),
    rgba(30, 64, 175, 0.95)
  );
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.95);
}

.sidebar-item.is-active .sidebar-dot {
  background: #fbbf24;
  box-shadow: 0 0 10px rgba(251, 191, 36, 1);
}

/* 모바일 메뉴 패널 */

.play-mobile-menu {
  position: absolute;
  top: 64px;
  left: 8px;
  right: 8px;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.98);
  border: 1px solid rgba(148, 163, 184, 0.85);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.95);
  padding: 8px 8px 10px;
  box-sizing: border-box;
  display: none;
  z-index: 20;
}

.mobile-menu-header { padding: 2px 6px 6px; }

.mobile-menu-title {
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  opacity: 0.92;
  color: rgba(226, 232, 240, 0.94);
}

.mobile-menu-item {
  width: 100%;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.75);
  background: radial-gradient(
    circle at left,
    rgba(37, 99, 235, 0.4),
    rgba(15, 23, 42, 0.96)
  );
  padding: 7px 10px;
  margin-bottom: 4px;

  font-size: 0.8rem;
  color: rgba(226, 232, 240, 0.95);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  cursor: pointer;

  transition:
    background 0.16s ease-out,
    border-color 0.16s ease-out,
    box-shadow 0.16s ease-out,
    transform 0.08s ease-out;
}

.mobile-menu-item-main { display: inline-flex; align-items: center; gap: 8px; }

.mobile-menu-dot {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 1);
  box-shadow: 0 0 7px rgba(191, 219, 254, 0.8);
}

.mobile-menu-text { white-space: nowrap; }

.mobile-menu-badge {
  font-size: 0.72rem;
  padding: 1px 6px;
  border-radius: 999px;
  border: 1px solid rgba(191, 219, 254, 0.9);
  background: rgba(15, 23, 42, 0.88);
}

.mobile-menu-item.is-active {
  border-color: rgba(129, 140, 248, 1);
  background: linear-gradient(
    135deg,
    rgba(79, 70, 229, 0.98),
    rgba(30, 64, 175, 0.95)
  );
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.95);
}

.mobile-menu-item.is-active .mobile-menu-dot {
  background: #fbbf24;
  box-shadow: 0 0 10px rgba(251, 191, 36, 1);
}

/* 모바일 메뉴 트랜지션 */

.mobile-menu-enter-active,
.mobile-menu-leave-active {
  transition:
    opacity 0.16s ease-out,
    transform 0.16s ease-out;
  transform-origin: top center;
}

.mobile-menu-enter-from,
.mobile-menu-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.96);
}

.mobile-menu-enter-to,
.mobile-menu-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}

/* RIGHT: 메인 영역 */

.play-main {
  flex: 1 1 auto;
  min-height: 0;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.7);
  padding: 10px 12px;
  box-sizing: border-box;
  display: flex;

  color: rgba(226, 232, 240, 0.94);
}

.play-main-inner {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: auto;
}

/* 공통 섹션 */

.section-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section-title {
  font-size: 0.95rem;
  font-weight: 900;
  color: rgba(248, 250, 252, 0.96);
}

.section-desc {
  font-size: 0.8rem;
  color: rgba(226, 232, 240, 0.9);
  line-height: 1.6;
}

.section-grid {
  margin-top: 2px;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 8px;
}

.section-card {
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.6);
  background: rgba(15, 23, 42, 0.96);
  padding: 8px 10px;
  font-size: 0.78rem;
}

.section-card-title {
  font-size: 0.82rem;
  font-weight: 900;
  color: rgba(248, 250, 252, 0.96);
  margin-bottom: 4px;
}

.section-card-text {
  font-size: 0.78rem;
  color: rgba(226, 232, 240, 0.9);
  line-height: 1.5;
}

.section-actions {
  margin-top: 6px;
  display: flex;
}

.home-link {
  text-decoration: none;
  font-weight: 900;
  letter-spacing: 0.04em;
  color: rgba(248, 250, 252, 0.96);
  padding: 8px 10px;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.45);
  background: rgba(15, 23, 42, 0.62);
}

.home-link:hover {
  border-color: rgba(191, 219, 254, 0.95);
}

/* 반응형: PC */

@media (min-width: 860px) {
  .play-body {
    padding-left: 2px;
    padding-right: 2px;
  }

  .section-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

/* 반응형: 모바일 */

@media (max-width: 859px) {
  .play-page-root {
    padding: 8px 6px 10px;
  }

  .play-shell {
    gap: 10px;
  }

  .play-header {
    padding: 8px 10px;
  }

  .play-title {
    font-size: 0.96rem;
  }

  .play-mobile-menu-toggle {
    display: inline-flex;
  }

  .play-sidebar {
    display: none;
  }

  .play-mobile-menu {
    display: block;
  }

  .play-layout {
    flex-direction: column;
  }

  .play-main {
    padding: 8px 8px;
  }
}
</style>
