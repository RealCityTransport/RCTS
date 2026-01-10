<!-- src/components/play/PlayPage.vue -->
<template>
  <div class="play-page-root">
    <section class="play-shell">
      <!-- 상단 헤더 -->
      <header class="play-header">
        <!-- LEFT -->
        <div class="play-header-left">
          <p class="play-badge">PLAY · HUB</p>
          <h2 class="play-title">RCTS</h2>
        </div>

        <!-- RIGHT: 로그인 + 모바일 햄버거 -->
        <div class="play-header-right">
          <button
            type="button"
            class="play-auth-button"
            :class="{ 'is-logged-in': isLoggedIn }"
            @click="handleAuthClick"
            :disabled="authLoading"
            :title="authTitle"
          >
            {{ authButtonText }}
          </button>

          <!-- 모바일용 햄버거 메뉴 버튼 -->
          <button
            type="button"
            class="play-mobile-menu-toggle"
            :class="[{ 'is-open': isMobileMenuOpen }, `menu-theme--${menuTheme}`]"
            @click="toggleMobileMenu"
            aria-label="모바일 메뉴"
          >
            <span class="hamburger-line" :class="{ 'is-open': isMobileMenuOpen }"></span>
            <span class="hamburger-line" :class="{ 'is-open': isMobileMenuOpen }"></span>
            <span class="hamburger-line" :class="{ 'is-open': isMobileMenuOpen }"></span>
          </button>
        </div>
      </header>

      <!-- 본문 -->
      <main class="play-body">
        <section class="play-layout">
          <!-- ✅ 사이드 메뉴 영역 (데스크톱용) + (모바일 메뉴 패널은 Teleport로 body에 뜸) -->
          <PlaySideMenu
            class="play-sidebar"
            :active-menu="activeMenu"
            :active-global="activeGlobal"
            :is-mobile-menu-open="isMobileMenuOpen"
            :kst-date="kstDate"
            :kst-weekday="kstWeekday"
            :kst-time="kstTime"
            :menu-theme="menuTheme"
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

      <!-- ✅ 하단 고정 운영 알림(하드코딩 1회 + 자동 반복) -->
      <div class="play-bottom-notice" aria-label="운영 알림">
        <div ref="noticeMarqueeEl" class="notice-marquee">
          <div ref="noticeTrackEl" class="notice-track">
            <div ref="noticeContentEl" class="notice-content">
              <span class="notice-text">[완료] KST 표준시간</span>
              <span class="notice-text">[완료] 구글로그인</span>
              <span class="notice-text">[완료] 설정->계정영역 로그인으로 인한 로직 연결.</span>
              <span class="notice-text">[예정] 개발로그 로직 연결</span>
              <span class="notice-text">[예정] 회사생성. 계정 연결</span>
              <span class="notice-text">[예정] 초기 운송 (버스) 로직 순차적용 </span>
              <span class="notice-text">[예정] 노선메뉴 계정에 연결하여 연동. </span>
              <span class="notice-text">[예정] 차량메뉴 게정에 연결하여 연동. </span>
              <span class="notice-text">[예정] 운영메뉴 게정에 연결하여 연동. </span>
              <span class="notice-text">[예정] 위키메뉴 게정에 연결하여 연동. </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PlaySideMenu from '@/components/play/menu/PlaySideMenu.vue'
import PlayContentHost from '@/components/play/content/PlayContentHost.vue'
import { useKstClock } from '@/composables/useKstClock.js'
import { useAuth } from '@/composables/useAuth.js'

const router = useRouter()
const route = useRoute()

const isMobileMenuOpen = ref(false)

/* ✅ Firebase Auth */
const {
  isLoggedIn,
  loading: authLoading,
  loginWithGoogle,
  logout,
} = useAuth()

const authButtonText = computed(() => {
  if (authLoading.value) return '로딩...'
  return isLoggedIn.value ? '로그아웃' : '로그인'
})

const authTitle = computed(() => {
  if (authLoading.value) return '인증 상태 확인 중'
  return isLoggedIn.value ? '로그아웃' : 'Google 로그인'
})

const handleAuthClick = async () => {
  if (authLoading.value) return

  if (!isLoggedIn.value) {
    await loginWithGoogle()
    return
  }

  await logout()
}

// ✅ PLAY 메뉴 키
const playMenuKeys = ['company', 'operations', 'routes', 'vehicles', 'settings']
// ✅ GLOBAL 메뉴 키 (about 제거)
const globalMenuKeys = ['wiki', 'devlog', 'community']

const activeMenu = computed(() => {
  const tab = route.query.tab
  const key = typeof tab === 'string' ? tab : ''
  return playMenuKeys.includes(key) ? key : 'company'
})

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

/* ✅ 표준시간(KST) */
const { kstDate, kstWeekday, kstTime } = useKstClock({
  intervalMs: 1000,
  timeZone: 'Asia/Seoul',
  locale: 'ko-KR',
})

/* ✅ Depot 고정 */
const menuTheme = computed(() => 'depot')

/* ✅ 데스크톱 전환 시 “모바일 메뉴 자동 닫기” (중복/유령 패널 방지) */
let mq = null
const handleMqChange = (e) => {
  if (e.matches) {
    // (min-width: 860px) => desktop
    isMobileMenuOpen.value = false
  }
}

onMounted(() => {
  if ('matchMedia' in window) {
    mq = window.matchMedia('(min-width: 860px)')
    // 초기 1회
    if (mq.matches) isMobileMenuOpen.value = false
    // 리스너
    if ('addEventListener' in mq) mq.addEventListener('change', handleMqChange)
    else mq.addListener(handleMqChange)
  }
})

onBeforeUnmount(() => {
  if (mq) {
    if ('removeEventListener' in mq) mq.removeEventListener('change', handleMqChange)
    else mq.removeListener(handleMqChange)
  }
})

/* ✅ 하단 알림 */
const noticeMarqueeEl = ref(null)
const noticeTrackEl = ref(null)
const noticeContentEl = ref(null)

const NOTICE_SPEED_PX_PER_SEC = 30
const NOTICE_GAP_PX = 64

let noticeRaf = 0
let noticeRO = null

const ensureNoticeLoop = () => {
  const track = noticeTrackEl.value
  const content = noticeContentEl.value
  if (!track || !content) return
  if (track.dataset.loopReady === 'true') return

  const clone = content.cloneNode(true)
  clone.setAttribute('aria-hidden', 'true')
  clone.classList.add('notice-content-clone')

  track.appendChild(clone)
  track.dataset.loopReady = 'true'
}

const updateNoticeMotion = () => {
  const marquee = noticeMarqueeEl.value
  const content = noticeContentEl.value
  if (!marquee || !content) return

  const contentW = content.scrollWidth || 0
  if (contentW <= 0) return

  const distance = contentW + NOTICE_GAP_PX
  const duration = Math.max(6, distance / NOTICE_SPEED_PX_PER_SEC)

  marquee.style.setProperty('--notice-gap', `${NOTICE_GAP_PX}px`)
  marquee.style.setProperty('--notice-shift', `-${distance}px`)
  marquee.style.setProperty('--notice-duration', `${duration}s`)
}

onMounted(() => {
  noticeRaf = window.requestAnimationFrame(() => {
    ensureNoticeLoop()
    updateNoticeMotion()
  })

  if ('ResizeObserver' in window) {
    noticeRO = new ResizeObserver(() => {
      window.cancelAnimationFrame(noticeRaf)
      noticeRaf = window.requestAnimationFrame(updateNoticeMotion)
    })

    if (noticeMarqueeEl.value) noticeRO.observe(noticeMarqueeEl.value)
    if (noticeContentEl.value) noticeRO.observe(noticeContentEl.value)
  } else {
    window.addEventListener('resize', updateNoticeMotion, { passive: true })
  }
})

onBeforeUnmount(() => {
  window.cancelAnimationFrame(noticeRaf)
  if (noticeRO) noticeRO.disconnect()
  if (!('ResizeObserver' in window)) {
    window.removeEventListener('resize', updateNoticeMotion)
  }
})
</script>

<style scoped>
.play-page-root {
  width: 100%;
  min-height: 100vh;
  box-sizing: border-box;
  padding: 12px 8px 16px;
  display: flex;
  justify-content: center;
  background: #070b14;

  padding-bottom: calc(16px + 54px);
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

.play-header {
  padding: 10px 14px;
  border-radius: 14px;
  background: rgba(10, 14, 24, 0.92);
  border: 1px solid rgba(148, 163, 184, 0.8);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.play-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 0 0 auto;
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

.play-header-right {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.play-auth-button {
  height: 34px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.9);
  background: rgba(15, 23, 42, 0.92);
  color: rgba(248, 250, 252, 0.96);
  font-size: 0.82rem;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.55);
  transition:
    transform 0.12s ease-out,
    box-shadow 0.12s ease-out,
    border-color 0.12s ease-out,
    background 0.12s ease-out;
}

.play-auth-button:hover {
  transform: translateY(-1px);
  border-color: rgba(129, 140, 248, 1);
  box-shadow: 0 10px 22px rgba(2, 6, 23, 0.55);
}

.play-auth-button:disabled {
  cursor: not-allowed;
  opacity: 0.72;
  transform: none;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.35);
}

.play-auth-button.is-logged-in {
  border-color: rgba(96, 165, 250, 0.95);
  box-shadow: 0 0 16px rgba(96, 165, 250, 0.35);
}

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
  border-color: rgba(251, 191, 36, 0.95);
  box-shadow: 0 0 18px rgba(251, 191, 36, 0.35);
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

/* ✅ Depot 고정 감성(버튼 라인) */
.menu-theme--depot .hamburger-line { box-shadow: 0 0 10px rgba(251, 191, 36, 0.65); }

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

.play-sidebar {
  flex: 0 0 210px;
  min-height: 0;
}

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
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.play-main-inner::-webkit-scrollbar {
  width: 0;
  height: 0;
}

/* ✅ 하단 고정 알림 */
.play-bottom-notice {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  padding: 10px 10px calc(10px + env(safe-area-inset-bottom));
  box-sizing: border-box;
  pointer-events: none;
}

.notice-marquee {
  width: min(1800px, calc(100% - 16px));
  margin: 0 auto;
  height: 44px;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.75);
  background: rgba(10, 14, 24, 0.96);
  box-shadow: 0 12px 30px rgba(2, 6, 23, 0.65);
  overflow: hidden;
  display: flex;
  align-items: center;
  padding: 0 12px;
  box-sizing: border-box;

  --notice-duration: 20s;
  --notice-gap: 64px;
  --notice-shift: -400px;
}

.notice-track {
  display: flex;
  align-items: center;
  gap: var(--notice-gap);
  will-change: transform;
  animation: notice-scroll var(--notice-duration) linear infinite;
}

.notice-content,
.notice-content-clone {
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
}

.notice-text {
  font-size: 0.86rem;
  color: rgba(226, 232, 240, 0.96);
  letter-spacing: 0.02em;
  margin-right: 32px;
}
.notice-text:last-child {
  margin-right: 0;
}

@keyframes notice-scroll {
  0% { transform: translateX(0); }
  100% { transform: translateX(var(--notice-shift)); }
}

/* 반응형 */
@media (min-width: 860px) {
  .play-body { padding-left: 2px; padding-right: 2px; }
}

@media (max-width: 859px) {
  .play-page-root {
    padding: 8px 6px 10px;
    padding-bottom: calc(10px + 54px);
  }

  .play-shell { gap: 10px; }
  .play-header { padding: 8px 10px; gap: 8px; }
  .play-title { font-size: 0.96rem; }
  .play-mobile-menu-toggle { display: inline-flex; }

  .play-auth-button {
    height: 32px;
    padding: 0 10px;
    font-size: 0.78rem;
  }

  /* ✅ 모바일에서 데스크톱 사이드바는 숨김 (모바일 메뉴는 Teleport로 body에 뜸) */
  .play-sidebar { display: none; }

  .play-layout { flex-direction: column; }
  .play-main { padding: 8px 8px; }

  .notice-marquee {
    height: 44px;
    padding: 0 10px;
  }
}
</style>
