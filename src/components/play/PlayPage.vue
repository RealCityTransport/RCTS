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

      <!-- ✅ 모바일 메뉴 패널 (햄버거 클릭 시 표시) -->
      <transition name="mobile-menu">
        <aside
          v-if="isMobileMenuOpen"
          class="play-mobile-menu-panel"
          @click.stop
        >
          <PlaySideMenu
            class="play-mobile-sidebar"
            :active-menu="activeMenu"
            :active-global="activeGlobal"
            :is-mobile-menu-open="false"
            @select-play="handleSelectPlayMenu"
            @select-global="handleSelectGlobalMenu"
          />
        </aside>
      </transition>

      <!-- 본문 -->
      <main class="play-body">
        <section class="play-layout">
          <!-- ✅ 사이드 메뉴 영역 -->
          <PlaySideMenu
            class="play-sidebar"
            :active-menu="activeMenu"
            :active-global="activeGlobal"
            :is-mobile-menu-open="false"
            @select-play="handleSelectPlayMenu"
            @select-global="handleSelectGlobalMenu"
          />

          <!-- ✅ 본문 영역 -->
          <section class="play-main">
            <div class="play-main-inner">
              <PlayContentHost
                :active-menu="activeMenu"
                :active-global="activeGlobal"
                :current-title="currentTitle"
              />
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
import PlaySideMenu from '@/components/play/menu/PlaySideMenu.vue'
import PlayContentHost from '@/components/play/content/PlayContentHost.vue'

const router = useRouter()
const route = useRoute()

const isMobileMenuOpen = ref(false)

// ✅ PLAY 메뉴 키
const playMenuKeys = ['company', 'operations', 'routes', 'vehicles', 'settings']
// ✅ GLOBAL 메뉴 키 (about 제거)
const globalMenuKeys = ['wiki', 'devlog', 'community']

const activeMenu = computed(() => {
  const tab = route.query.tab
  const key = typeof tab === 'string' ? tab : ''
  return playMenuKeys.includes(key) ? key : 'company'
})

// ✅ /play 본문에서 GLOBAL 컨텐츠 렌더링용
const activeGlobal = computed(() => {
  const section = route.query.section
  const key = typeof section === 'string' ? section : ''
  return globalMenuKeys.includes(key) ? key : ''
})

const currentTitle = computed(() => {
  if (activeGlobal.value) {
    const globalMap = {
      wiki: '위키',
      devlog: '개발로그',
      community: '커뮤니티',
    }
    return globalMap[activeGlobal.value] ?? 'GLOBAL'
  }

  const playMap = {
    company: '회사',
    operations: '운영',
    routes: '노선',
    vehicles: '차량',
    settings: '설정',
  }
  return playMap[activeMenu.value] ?? '플레이'
})

const handleSelectPlayMenu = async (key) => {
  // ✅ PLAY 메뉴를 누르면 GLOBAL section은 제거 (본문이 play로 돌아옴)
  if (activeMenu.value === key && !activeGlobal.value) {
    isMobileMenuOpen.value = false
    return
  }

  await router.push({
    path: '/play',
    query: { ...route.query, tab: key, section: undefined },
  })

  isMobileMenuOpen.value = false
}

const handleSelectGlobalMenu = async (key) => {
  // ✅ GLOBAL 메뉴는 /play 내부에서 section으로만 교체
  if (activeGlobal.value === key) {
    isMobileMenuOpen.value = false
    return
  }

  await router.push({
    path: '/play',
    query: { ...route.query, section: key },
  })

  isMobileMenuOpen.value = false
}

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}
</script>

<style scoped>
/* ✅ 페이지 전체 배경: 플랫 다크 (그라데이션 제거) */
.play-page-root {
  width: 100%;
  min-height: 100vh;
  box-sizing: border-box;
  padding: 12px 8px 16px;
  display: flex;
  justify-content: center;
  background: #070b14;
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
  background: transparent;
}

/* 헤더: 단색 다크 */
.play-header {
  padding: 10px 14px;
  border-radius: 14px;
  background: rgba(10, 14, 24, 0.92);
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
  background: rgba(15, 23, 42, 0.92);
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
  background: rgba(15, 23, 42, 0.98);
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

.hamburger-line.is-open:nth-child(1) { transform: translateY(4px) rotate(42deg); }
.hamburger-line.is-open:nth-child(2) { opacity: 0; width: 0; }
.hamburger-line.is-open:nth-child(3) { transform: translateY(-4px) rotate(-42deg); }

/* 모바일 메뉴 배경 오버레이 */
.play-mobile-backdrop {
  position: absolute;
  inset: 0;
  border-radius: 18px;
  background: rgba(2, 6, 23, 0.78);
  backdrop-filter: blur(2px);
  z-index: 15;
}

/* ✅ 모바일 메뉴 패널 */
.play-mobile-menu-panel {
  position: absolute;
  left: 10px;
  right: 10px;
  top: 64px;
  bottom: 10px;
  z-index: 20;
  border-radius: 14px;
  background: rgba(10, 14, 24, 0.96);
  border: 1px solid rgba(148, 163, 184, 0.75);
  backdrop-filter: blur(6px);
  box-shadow: 0 10px 30px rgba(2, 6, 23, 0.65);
  overflow: auto;
  padding: 10px;
  box-sizing: border-box;
}

.play-mobile-sidebar {
  width: 100%;
  min-height: 100%;
}

/* 오버레이 트랜지션 */
.mobile-backdrop-enter-active,
.mobile-backdrop-leave-active {
  transition: opacity 0.16s ease-out;
}
.mobile-backdrop-enter-from,
.mobile-backdrop-leave-to { opacity: 0; }
.mobile-backdrop-enter-to,
.mobile-backdrop-leave-from { opacity: 1; }

/* ✅ 모바일 메뉴 트랜지션 */
.mobile-menu-enter-active,
.mobile-menu-leave-active {
  transition:
    opacity 0.16s ease-out,
    transform 0.16s ease-out;
}
.mobile-menu-enter-from,
.mobile-menu-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
.mobile-menu-enter-to,
.mobile-menu-leave-from {
  opacity: 1;
  transform: translateY(0);
}

/* 본문 레이아웃 공통 */
.play-body {
  flex: 1;
  min-height: 0;
  display: flex;
}

.play-layout {
  flex: 1;
  min-height: 0;
  display: flex;
  gap: 10px;
}

/* ✅ 데스크톱 사이드바는 PlaySideMenu가 class="play-sidebar"로 들어오니 여기서 폭만 */
.play-sidebar {
  flex: 0 0 210px;
  min-height: 0;
}

/* RIGHT: 메인 영역 (투명/유리 유지) */
.play-main {
  flex: 1 1 auto;
  min-height: 0;
  border-radius: 14px;
  background: rgba(2, 6, 23, 0.18);
  border: 1px solid rgba(148, 163, 184, 0.55);
  backdrop-filter: blur(6px);
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

  /* ✅ 스크롤은 유지 + 스크롤바만 숨김 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge legacy */
}
.play-main-inner::-webkit-scrollbar {
  width: 0;
  height: 0;
}

/* 반응형: PC */
@media (min-width: 860px) {
  .play-body { padding-left: 2px; padding-right: 2px; }
}

/* 반응형: 모바일 */
@media (max-width: 859px) {
  .play-page-root { padding: 8px 6px 10px; }
  .play-shell { gap: 10px; }
  .play-header { padding: 8px 10px; }
  .play-title { font-size: 0.96rem; }
  .play-mobile-menu-toggle { display: inline-flex; }

  .play-sidebar { display: none; }
  .play-layout { flex-direction: column; }
  .play-main { padding: 8px 8px; }

  .play-mobile-menu-panel {
    left: 8px;
    right: 8px;
    top: 56px;
    bottom: 8px;
    padding: 8px;
  }
}
</style>
