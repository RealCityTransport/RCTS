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

      <!-- ✅ 하단 고정 운영 알림 (끊김없는 무한: 2블록 재활용, "왼쪽 완전 이탈 후"에만 교체) -->
      <div class="play-bottom-notice" aria-label="운영 알림">
        <div ref="noticeMarqueeEl" class="notice-marquee">
          <div ref="noticeTrackEl" class="notice-track">
            <!-- 블록 A -->
            <div
              ref="blockAEl"
              class="notice-content"
              :style="{ transform: `translateX(${blockAX}px)` }"
            >
              <template v-if="groupsA.length">
                <template v-for="(g, gi) in groupsA" :key="`a:${g.status}`">
                  <span class="notice-tag" :class="tagClass(g.status)">
                    {{ tagText(g.status) }}
                  </span>

                  <template v-for="(it, ii) in g.items" :key="it.key">
                    <span class="notice-item" :class="{ 'is-last': ii === g.items.length - 1 }">
                      <span class="notice-text">{{ it.title }}</span>
                    </span>
                  </template>

                  <span v-if="gi !== groupsA.length - 1" class="notice-gap" aria-hidden="true"></span>
                </template>
              </template>

              <template v-else>
                <span class="notice-tag is-doing">[진행]</span>
                <span class="notice-item is-last">
                  <span class="notice-text">운영 알림 준비 중</span>
                </span>
              </template>
            </div>

            <!-- 블록 B -->
            <div
              ref="blockBEl"
              class="notice-content"
              :style="{ transform: `translateX(${blockBX}px)` }"
            >
              <template v-if="groupsB.length">
                <template v-for="(g, gi) in groupsB" :key="`b:${g.status}`">
                  <span class="notice-tag" :class="tagClass(g.status)">
                    {{ tagText(g.status) }}
                  </span>

                  <template v-for="(it, ii) in g.items" :key="it.key">
                    <span class="notice-item" :class="{ 'is-last': ii === g.items.length - 1 }">
                      <span class="notice-text">{{ it.title }}</span>
                    </span>
                  </template>

                  <span v-if="gi !== groupsB.length - 1" class="notice-gap" aria-hidden="true"></span>
                </template>
              </template>

              <template v-else>
                <span class="notice-tag is-doing">[진행]</span>
                <span class="notice-item is-last">
                  <span class="notice-text">운영 알림 준비 중</span>
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
// ✅ GLOBAL 메뉴 키
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

/* ✅ 데스크톱 전환 시 모바일 메뉴 자동 닫기 */
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

/* =========================
   ✅ 하단 알림: 2블록 재활용 무한 마퀴
   - 세트 간격은 "항상 50px"로만 배치(패딩으로 간격 늘리지 않음)
   - 교체는 "왼쪽 완전 이탈 후"에만
   ========================= */
const { start: startDevlogs, tickerTrainItems } = useDevlogsTicker()
onMounted(() => startDevlogs())

const DONE_N = 10
const DOING_N = 2
const PLAN_N = 5

const noticeMarqueeEl = ref(null)
const noticeTrackEl = ref(null)
const blockAEl = ref(null)
const blockBEl = ref(null)

const NOTICE_SPEED_PX_PER_SEC = 30

// ✅ 너가 지정한 고정값들
const NOTICE_TAG_GAP_PX = 20              // (CSS) 태그↔첫내용
const NOTICE_ITEM_GAP_PX = 30             // (CSS) 내용↔내용
const NOTICE_GROUP_GAP_PX = 40            // (CSS) 그룹↔그룹
const NOTICE_BLOCK_GAP_PX = 50            // (JS) 세트↔세트 (A<->B)
const NOTICE_RIGHT_OFFSCREEN_PAD_PX = 80  // (JS) "오른쪽 오프스크린" 판정용 패드(간격에 사용 금지)

let raf = 0
let ro = null
let lastTs = 0

// 블록 좌표
const blockAX = ref(0)
const blockBX = ref(0)

// 블록별 스냅샷(보이는 동안 절대 안 바뀜)
const snapA = ref([])
const snapB = ref([])

// 다음에 "재활용될 블록"에만 주입할 대기 스냅샷
const pendingSnapshot = ref([])

const tagClass = (status) => {
  if (status === 'done') return 'is-done'
  if (status === 'doing') return 'is-doing'
  return 'is-plan'
}

const tagText = (status) => {
  if (status === 'done') return '[완료]'
  if (status === 'doing') return '[진행]'
  return '[예정]'
}

const normalizeTrain = (items) => {
  const arr = Array.isArray(items) ? items : []
  const mapped = arr.map((x, i) => {
    const title = String(x?.title ?? '').trim()
    const status = x?.status === 'done' ? 'done' : x?.status === 'doing' ? 'doing' : 'plan'
    const id = String(x?.id ?? '')
    const key = id ? `${status}:${id}` : `${status}:idx:${i}:${title}`
    return { key, id, status, title }
  })
  return mapped.filter((x) => x.title)
}

const toGroups = (snap) => {
  const list = Array.isArray(snap) ? snap : []
  const done = []
  const doing = []
  const plan = []

  for (const it of list) {
    if (it.status === 'done') done.push(it)
    else if (it.status === 'doing') doing.push(it)
    else plan.push(it)
  }

  const groups = [
    { status: 'done', items: done.slice(0, DONE_N) },
    { status: 'doing', items: doing.slice(0, DOING_N) },
    { status: 'plan', items: plan.slice(0, PLAN_N) },
  ]

  return groups.filter((g) => g.items.length)
}

const groupsA = computed(() => toGroups(snapA.value))
const groupsB = computed(() => toGroups(snapB.value))

const measured = {
  wA: 0,
  wB: 0,
  effA: 0,      // ✅ 유효폭(짧은 콘텐츠 튐 방지용)
  effB: 0,      // ✅ 유효폭(짧은 콘텐츠 튐 방지용)
  marqueeW: 0,
  ready: false,
}

const measureBlocks = () => {
  const a = blockAEl.value
  const b = blockBEl.value
  const marquee = noticeMarqueeEl.value
  if (!a || !b || !marquee) return false

  const wA = a.scrollWidth || 0
  const wB = b.scrollWidth || 0
  const marqueeW = marquee.clientWidth || 0
  if (wA <= 0 || wB <= 0 || marqueeW <= 0) return false

  measured.wA = wA
  measured.wB = wB
  measured.marqueeW = marqueeW

  // ✅ "오프스크린 80"은 '간격'이 아니라 '유효폭/판정'에만 반영
  const minEffective = marqueeW + NOTICE_RIGHT_OFFSCREEN_PAD_PX
  measured.effA = Math.max(wA, minEffective)
  measured.effB = Math.max(wB, minEffective)

  measured.ready = true
  return true
}

const applyPendingToRecycledBlock = (which) => {
  const next = pendingSnapshot.value
  if (!next || !next.length) return
  if (which === 'A') snapA.value = next
  else snapB.value = next
}

/**
 * ✅ 세트↔세트 간격은 무조건 50px "고정"
 * ✅ 툭 방지: 짧은 콘텐츠는 eff폭으로 취급해서 재배치 시점이 절대 화면 안으로 들어오지 않게 함
 */
const placeRecycledBlockAfterOtherWithFixedGap = (which) => {
  const effA = measured.effA
  const effB = measured.effB

  if (which === 'A') {
    // B 뒤에 딱 50px
    const target = blockBX.value + effB + NOTICE_BLOCK_GAP_PX
    blockAX.value = target
  } else {
    // A 뒤에 딱 50px
    const target = blockAX.value + effA + NOTICE_BLOCK_GAP_PX
    blockBX.value = target
  }
}

const tick = (ts) => {
  if (!lastTs) lastTs = ts
  const dt = Math.min(0.05, (ts - lastTs) / 1000)
  lastTs = ts

  if (!measured.ready) {
    if (!measureBlocks()) {
      raf = window.requestAnimationFrame(tick)
      return
    }
  }

  const dx = NOTICE_SPEED_PX_PER_SEC * dt
  blockAX.value -= dx
  blockBX.value -= dx

  const effA = measured.effA
  const effB = measured.effB

  // ✅ "유효폭" 기준으로 완전 이탈 후 재활용 (툭 제거)
  if (blockAX.value + effA <= 0) {
    placeRecycledBlockAfterOtherWithFixedGap('A')
    applyPendingToRecycledBlock('A')

    window.cancelAnimationFrame(raf)
    raf = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        measureBlocks()
        raf = window.requestAnimationFrame(tick)
      })
    })
    return
  }

  if (blockBX.value + effB <= 0) {
    placeRecycledBlockAfterOtherWithFixedGap('B')
    applyPendingToRecycledBlock('B')

    window.cancelAnimationFrame(raf)
    raf = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        measureBlocks()
        raf = window.requestAnimationFrame(tick)
      })
    })
    return
  }

  raf = window.requestAnimationFrame(tick)
}

watch(
  () => tickerTrainItems.value,
  (v) => {
    const next = normalizeTrain(v)
    pendingSnapshot.value = next

    // 최초 1회: 둘 다 같은 스냅샷으로 시작
    if (!snapA.value.length && next.length) {
      snapA.value = next
      snapB.value = next

      window.cancelAnimationFrame(raf)
      raf = window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          if (measureBlocks()) {
            blockAX.value = 0
            // ✅ 초기 배치도 effA 기준으로 "딱 50px"
            blockBX.value = measured.effA + NOTICE_BLOCK_GAP_PX
          }
          lastTs = 0
          raf = window.requestAnimationFrame(tick)
        })
      })
    }
  },
  { immediate: true },
)

onMounted(() => {
  raf = window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      if (measureBlocks()) {
        blockAX.value = 0
        // ✅ 초기 배치도 effA 기준
        blockBX.value = measured.effA + NOTICE_BLOCK_GAP_PX
      }
      lastTs = 0
      raf = window.requestAnimationFrame(tick)
    })
  })

  if ('ResizeObserver' in window) {
    ro = new ResizeObserver(() => {
      const aLeft = blockAX.value
      const bLeft = blockBX.value

      if (!measureBlocks()) return

      // ✅ 리사이즈 시에도 세트 간격 50 고정(유효폭 기준)
      if (aLeft <= bLeft) {
        blockAX.value = aLeft
        blockBX.value = blockAX.value + measured.effA + NOTICE_BLOCK_GAP_PX
      } else {
        blockBX.value = bLeft
        blockAX.value = blockBX.value + measured.effB + NOTICE_BLOCK_GAP_PX
      }
    })

    if (noticeMarqueeEl.value) ro.observe(noticeMarqueeEl.value)
    if (blockAEl.value) ro.observe(blockAEl.value)
    if (blockBEl.value) ro.observe(blockBEl.value)
  } else {
    window.addEventListener('resize', measureBlocks, { passive: true })
  }
})

onBeforeUnmount(() => {
  window.cancelAnimationFrame(raf)
  if (ro) ro.disconnect()
  if (!('ResizeObserver' in window)) {
    window.removeEventListener('resize', measureBlocks)
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
}

.notice-track {
  position: relative;
  width: 100%;
  height: 100%;
}

.notice-content {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
  will-change: transform;
}

/* ✅ 내용↔내용: 30px 고정 */
.notice-item {
  display: inline-flex;
  align-items: center;
  margin-right: 30px;
}

/* ✅ 그룹/세트 경계에 끼는 추가 margin 제거(고정 간격 유지 핵심) */
.notice-item.is-last {
  margin-right: 0;
}

/* ✅ 그룹↔그룹: 40px 고정 */
.notice-gap {
  display: inline-block;
  width: 40px;
}

/* ✅ 태그↔첫내용: 20px 고정 */
.notice-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.02em;
  border: 1px solid rgba(148, 163, 184, 0.65);
  color: rgba(226, 232, 240, 0.96);
  background: rgba(15, 23, 42, 0.82);
  box-shadow: 0 0 12px rgba(2, 6, 23, 0.35);
  margin-right: 20px;
}

.notice-tag.is-plan {
  border-color: rgba(248, 113, 113, 0.75);
  box-shadow: 0 0 16px rgba(248, 113, 113, 0.18);
}

.notice-tag.is-doing {
  border-color: rgba(251, 191, 36, 0.75);
  box-shadow: 0 0 16px rgba(251, 191, 36, 0.18);
}

.notice-tag.is-done {
  border-color: rgba(34, 197, 94, 0.75);
  box-shadow: 0 0 16px rgba(34, 197, 94, 0.18);
}

.notice-text {
  font-size: 0.86rem;
  color: rgba(226, 232, 240, 0.96);
  letter-spacing: 0.02em;
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

  .play-sidebar { display: none; }

  .play-layout { flex-direction: column; }
  .play-main { padding: 8px 8px; }

  .notice-marquee {
    height: 44px;
    padding: 0 10px;
  }
}
</style>
