<!-- src/components/play/PlayPage.vue -->
<template>
  <div class="play-page-root">
    <section class="play-shell">
      <!-- 상단 헤더 -->
      <header class="play-header">
        <div class="play-header-left">
          <p class="play-badge">PLAY · HUB</p>
          <h2 class="play-title">RCTS</h2>
        </div>

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

      <main class="play-body">
        <section class="play-layout">
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

      <!-- ✅ 하단 고정 알림 -->
      <div class="play-bottom-notice" aria-label="운영 알림">
        <div ref="noticeMarqueeEl" class="notice-marquee">
          <div ref="noticeTrackEl" class="notice-track">
            <div ref="noticeContentEl" class="notice-content">
              <template v-if="hasAnyItems">
                <!-- DONE -->
                <span class="notice-engine status--done" aria-label="완료">완료</span>
                <span
                  v-for="item in doneCars"
                  :key="`done-${item.id}`"
                  class="notice-card status--done"
                >
                  <span class="notice-title">{{ item.title }}</span>
                </span>

                <span class="notice-gap" aria-hidden="true"></span>

                <!-- DOING -->
                <span class="notice-engine status--doing" aria-label="진행">진행</span>
                <span
                  v-for="item in doingCars"
                  :key="`doing-${item.id}`"
                  class="notice-card status--doing"
                >
                  <span class="notice-title">{{ item.title }}</span>
                </span>

                <span class="notice-gap" aria-hidden="true"></span>

                <!-- PLAN -->
                <span class="notice-engine status--plan" aria-label="예정">예정</span>
                <span
                  v-for="item in planCars"
                  :key="`plan-${item.id}`"
                  class="notice-card status--plan"
                >
                  <span class="notice-title">{{ item.title }}</span>
                </span>
              </template>

              <template v-else>
                <span class="notice-engine status--plan">예정</span>
                <span class="notice-card status--plan">
                  <span class="notice-title">개발로그 연결 준비 중</span>
                </span>
              </template>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PlaySideMenu from '@/components/play/menu/PlaySideMenu.vue'
import PlayContentHost from '@/components/play/content/PlayContentHost.vue'
import { useKstClock } from '@/composables/useKstClock.js'
import { useAuth } from '@/composables/useAuth.js'
import { useDevlogsTicker } from '@/composables/useDevlogsTicker.js'

const router = useRouter()
const route = useRoute()

const isMobileMenuOpen = ref(false)

/* Auth */
const { isLoggedIn, loading: authLoading, loginWithGoogle, logout } = useAuth()

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

/* menus */
const playMenuKeys = ['company', 'operations', 'routes', 'vehicles', 'settings']
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
    const globalMap = { wiki: '위키', devlog: '개발로그', community: '커뮤니티' }
    return globalMap[activeGlobal.value] ?? 'GLOBAL'
  }
  const playMap = { company: '회사', operations: '운영', routes: '노선', vehicles: '차량', settings: '설정' }
  return playMap[activeMenu.value] ?? '플레이'
})

const handleSelectPlayMenu = async (key) => {
  if (activeMenu.value === key && !activeGlobal.value) {
    isMobileMenuOpen.value = false
    return
  }
  await router.push({ path: '/play', query: { ...route.query, tab: key, section: undefined } })
  isMobileMenuOpen.value = false
}

const handleSelectGlobalMenu = async (key) => {
  if (activeGlobal.value === key) {
    isMobileMenuOpen.value = false
    return
  }
  await router.push({ path: '/play', query: { ...route.query, section: key } })
  isMobileMenuOpen.value = false
}

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

/* KST clock */
const { kstDate, kstWeekday, kstTime } = useKstClock({
  intervalMs: 1000,
  timeZone: 'Asia/Seoul',
  locale: 'ko-KR',
})

const menuTheme = computed(() => 'depot')

/* desktop mq */
let mq = null
const handleMqChange = (e) => {
  if (e.matches) isMobileMenuOpen.value = false
}

onMounted(() => {
  if ('matchMedia' in window) {
    mq = window.matchMedia('(min-width: 860px)')
    if (mq.matches) isMobileMenuOpen.value = false
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

/* ✅ Devlogs ticker (실시간 원본) */
const { tickerTrainItems, start: startDevlogs } = useDevlogsTicker()
onMounted(() => startDevlogs())

/* ✅ 스냅샷 재생 */
const displayTickerItems = ref([])
const pendingTickerItems = ref([])

const doneCars = computed(() => (displayTickerItems.value || []).filter((x) => x.status === 'done'))
const doingCars = computed(() => (displayTickerItems.value || []).filter((x) => x.status === 'doing'))
const planCars = computed(() => (displayTickerItems.value || []).filter((x) => x.status === 'plan'))
const hasAnyItems = computed(() => displayTickerItems.value && displayTickerItems.value.length > 0)

const applyInitialSnapshotIfEmpty = () => {
  if (!displayTickerItems.value.length && (tickerTrainItems.value || []).length) {
    displayTickerItems.value = [...tickerTrainItems.value]
    pendingTickerItems.value = []
    rebuildTickerLoop()
  }
}

watch(
  () => (tickerTrainItems.value || []).map((x) => `${x.id}:${x.status}:${x.title}`).join('|'),
  () => {
    applyInitialSnapshotIfEmpty()
    if (displayTickerItems.value.length) {
      pendingTickerItems.value = [...tickerTrainItems.value]
    }
  },
  { immediate: true },
)

/* ✅ marquee */
const noticeMarqueeEl = ref(null)
const noticeTrackEl = ref(null)
const noticeContentEl = ref(null)

const NOTICE_SPEED_PX_PER_SEC = 30
const NOTICE_GAP_PX = 48

let noticeRaf = 0
let noticeRO = null
let onIter = null

const clearNoticeLoop = () => {
  const track = noticeTrackEl.value
  if (!track) return
  const clones = track.querySelectorAll('.notice-content-clone')
  clones.forEach((el) => el.remove())
  track.dataset.loopReady = 'false'
}

/**
 * ✅ 핵심 수정:
 * - PC에서 빈 구간이 생기는 이유는 clone이 부족해서임
 * - content 너비 + gap 기준으로, "화면을 충분히 채울 때까지" clone 여러 개 생성
 */
const ensureNoticeLoop = () => {
  const track = noticeTrackEl.value
  const content = noticeContentEl.value
  const marquee = noticeMarqueeEl.value
  if (!track || !content || !marquee) return

  // 이미 만들어둔 상태라도 rebuild 때마다 clone 수가 모자라면 보강해야 해서,
  // loopReady 체크를 단순 true로 막지 않고, 매번 필요한 개수 계산해서 붙임.
  const contentW = content.scrollWidth || 0
  const marqueeW = marquee.clientWidth || 0
  if (contentW <= 0 || marqueeW <= 0) return

  // 기존 클론 제거 후 다시 만드는 방식(스냅샷 교체 시에만 호출되어 빈번하지 않음)
  const existingClones = track.querySelectorAll('.notice-content-clone')
  existingClones.forEach((el) => el.remove())

  // 최소 1개는 필요, 그리고 (화면*2) 이상을 채울 만큼 반복
  const unit = contentW + NOTICE_GAP_PX
  const need = Math.max(1, Math.ceil((marqueeW * 2) / unit))

  for (let i = 0; i < need; i += 1) {
    const clone = content.cloneNode(true)
    clone.setAttribute('aria-hidden', 'true')
    clone.classList.add('notice-content-clone')
    track.appendChild(clone)
  }

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

const rebuildTickerLoop = () => {
  window.cancelAnimationFrame(noticeRaf)
  noticeRaf = window.requestAnimationFrame(() => {
    // ✅ content가 갱신되면 clone을 “충분히” 만들고 → 모션 계산
    clearNoticeLoop()
    ensureNoticeLoop()
    updateNoticeMotion()
  })
}

onMounted(() => {
  rebuildTickerLoop()

  if ('ResizeObserver' in window) {
    noticeRO = new ResizeObserver(() => rebuildTickerLoop())
    if (noticeMarqueeEl.value) noticeRO.observe(noticeMarqueeEl.value)
    if (noticeContentEl.value) noticeRO.observe(noticeContentEl.value)
  } else {
    window.addEventListener('resize', rebuildTickerLoop, { passive: true })
  }

  const track = noticeTrackEl.value
  if (track) {
    onIter = () => {
      if (pendingTickerItems.value.length) {
        displayTickerItems.value = [...pendingTickerItems.value]
        pendingTickerItems.value = []
        rebuildTickerLoop()
      }
    }
    track.addEventListener('animationiteration', onIter)
  }
})

watch(
  () => (displayTickerItems.value || []).map((x) => `${x.id}:${x.status}:${x.title}`).join('|'),
  () => rebuildTickerLoop(),
)

onBeforeUnmount(() => {
  window.cancelAnimationFrame(noticeRaf)
  if (noticeRO) noticeRO.disconnect()
  if (!('ResizeObserver' in window)) window.removeEventListener('resize', rebuildTickerLoop)

  const track = noticeTrackEl.value
  if (track && onIter) track.removeEventListener('animationiteration', onIter)
})
</script>

<style scoped>
/* 기존 스타일 유지(중간 생략 없이 전체) */
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
  transition: transform 0.12s ease-out, box-shadow 0.12s ease-out, border-color 0.12s ease-out, background 0.12s ease-out;
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
  transition: transform 0.12s ease-out, box-shadow 0.12s ease-out, border-color 0.12s ease-out, background 0.12s ease-out;
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
  transition: transform 0.16s cubic-bezier(0.33, 1, 0.68, 1), opacity 0.12s ease-out, width 0.16s ease-out, box-shadow 0.16s ease-out, background 0.16s ease-out;
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

.menu-theme--depot .hamburger-line { box-shadow: 0 0 10px rgba(251, 191, 36, 0.65); }

.play-body { flex: 1; min-height: 0; display: flex; }
.play-layout { flex: 1; min-height: 0; display: flex; gap: 10px; }
.play-sidebar { flex: 0 0 210px; min-height: 0; }

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
.play-main-inner::-webkit-scrollbar { width: 0; height: 0; }

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
  padding: 0 10px;
  box-sizing: border-box;

  --notice-duration: 20s;
  --notice-gap: 48px;
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

.notice-engine {
  display: inline-flex;
  align-items: center;
  padding: 7px 10px;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 1000;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(2, 6, 23, 0.22);
  margin-right: 10px;
}

.notice-card {
  display: inline-flex;
  align-items: center;
  padding: 7px 10px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(2, 6, 23, 0.22);
  margin-right: 10px;
}
.notice-card:last-child { margin-right: 0; }

.notice-title {
  font-size: 0.84rem;
  font-weight: 900;
  letter-spacing: 0.02em;
  color: rgba(226, 232, 240, 0.96);
}

.notice-gap {
  display: inline-block;
  width: 22px;
  height: 1px;
  margin: 0 14px;
  opacity: 0.7;
}

.status--plan {
  border-color: rgba(248, 113, 113, 0.55);
  background: rgba(248, 113, 113, 0.10);
  box-shadow: 0 0 14px rgba(248, 113, 113, 0.12);
}

.status--doing {
  border-color: rgba(251, 191, 36, 0.65);
  background: rgba(251, 191, 36, 0.10);
  box-shadow: 0 0 14px rgba(251, 191, 36, 0.12);
}

.status--done {
  border-color: rgba(34, 197, 94, 0.60);
  background: rgba(34, 197, 94, 0.10);
  box-shadow: 0 0 14px rgba(34, 197, 94, 0.12);
}

@keyframes notice-scroll {
  0% { transform: translateX(0); }
  100% { transform: translateX(var(--notice-shift)); }
}

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

  .play-sidebar { display: none; }
  .play-layout { flex-direction: column; }
  .play-main { padding: 8px 8px; }

  .notice-marquee { height: 44px; padding: 0 10px; }
}
</style>
