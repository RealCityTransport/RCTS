<!-- src/components/play/menu/PlaySideMenu.vue -->
<template>
  <!-- ✅ 단일 루트(중요): PlayPage에서 class="play-sidebar"가 여기로 붙음 -->
  <div class="play-side-root">
    <!-- LEFT: 데스크톱용 사이드 메뉴 -->
    <nav class="play-sidebar-inner" aria-label="플레이 메뉴">
      <div class="sidebar-header">
        <span class="sidebar-label">PLAY</span>
      </div>

      <button
        v-for="item in playMenuItems"
        :key="item.key"
        type="button"
        class="sidebar-item"
        :class="{ 'is-active': !activeGlobal && activeMenu === item.key }"
        @click="$emit('select-play', item.key)"
      >
        <span class="sidebar-item-main">
          <span class="sidebar-dot" />
          <span class="sidebar-text">{{ item.label }}</span>
        </span>
        <span v-if="item.badge" class="sidebar-badge">{{ item.badge }}</span>
      </button>

      <div class="sidebar-sep" />

      <div class="sidebar-header">
        <span class="sidebar-label">GLOBAL</span>
      </div>

      <button
        v-for="item in globalMenuItems"
        :key="item.key"
        type="button"
        class="sidebar-item sidebar-item--global"
        :class="{ 'is-active': activeGlobal === item.key }"
        @click="$emit('select-global', item.key)"
      >
        <span class="sidebar-item-main">
          <span class="sidebar-dot sidebar-dot--global" />
          <span class="sidebar-text">{{ item.label }}</span>
        </span>
      </button>

      <!-- ✅ KST: GLOBAL 아래 -->
      <div class="sidebar-kst">
        <div class="sidebar-kst-label">표준시간 (KST)</div>
        <div class="sidebar-kst-date">{{ kstDate }}</div>
        <div class="sidebar-kst-time-row">
          <span class="sidebar-kst-weekday">{{ kstWeekday }}</span>
          <span class="sidebar-kst-time">{{ kstTime }}</span>
        </div>
      </div>
    </nav>

    <!-- ✅ 모바일 메뉴는 body에 직접 띄움 -->
    <teleport to="body">
      <transition name="mm-depot">
        <div v-if="isMobileMenuOpen" class="mm-wrap" aria-hidden="false">
          <div class="mm-backdrop"></div>

          <nav class="play-mobile-menu" aria-label="플레이 메뉴 (모바일)">
            <div class="mobile-menu-header">
              <span class="mobile-menu-title">PLAY</span>
            </div>

            <!-- ✅ 정류장 순차 등장: PLAY -->
            <button
              v-for="(item, idx) in playMenuItems"
              :key="item.key"
              type="button"
              class="mobile-menu-item mobile-stagger"
              :class="{ 'is-active': !activeGlobal && activeMenu === item.key }"
              :style="{ '--stagger': idx }"
              @click="$emit('select-play', item.key)"
            >
              <span class="mobile-menu-item-main">
                <span class="mobile-menu-dot" />
                <span class="mobile-menu-text">{{ item.label }}</span>
              </span>
              <span v-if="item.badge" class="mobile-menu-badge">{{ item.badge }}</span>
            </button>

            <div class="mobile-menu-sep" />

            <div class="mobile-menu-header">
              <span class="mobile-menu-title">GLOBAL</span>
            </div>

            <!-- ✅ 정류장 순차 등장: GLOBAL -->
            <button
              v-for="(item, gIdx) in globalMenuItems"
              :key="item.key"
              type="button"
              class="mobile-menu-item mobile-menu-item--global mobile-stagger"
              :class="{ 'is-active': activeGlobal === item.key }"
              :style="{ '--stagger': playMenuItems.length + gIdx }"
              @click="$emit('select-global', item.key)"
            >
              <span class="mobile-menu-item-main">
                <span class="mobile-menu-dot mobile-menu-dot--global" />
                <span class="mobile-menu-text">{{ item.label }}</span>
              </span>
            </button>

            <!-- ✅ 모바일 KST -->
            <div
              class="mobile-kst mobile-stagger"
              :style="{ '--stagger': playMenuItems.length + globalMenuItems.length }"
            >
              <div class="mobile-kst-label">표준시간 (KST)</div>
              <div class="mobile-kst-date">{{ kstDate }}</div>
              <div class="mobile-kst-time-row">
                <span class="mobile-kst-weekday">{{ kstWeekday }}</span>
                <span class="mobile-kst-time">{{ kstTime }}</span>
              </div>
            </div>
          </nav>
        </div>
      </transition>
    </teleport>
  </div>
</template>

<script setup>
defineProps({
  activeMenu: { type: String, required: true },
  activeGlobal: { type: String, required: true },
  isMobileMenuOpen: { type: Boolean, required: true },

  kstDate: { type: String, required: true },
  kstWeekday: { type: String, required: true },
  kstTime: { type: String, required: true },

  menuTheme: { type: String, required: true },
})

defineEmits(['select-play', 'select-global'])

const playMenuItems = [
  { key: 'company', label: '회사' },
  { key: 'operations', label: '운영' },
  { key: 'routes', label: '노선' },
  { key: 'vehicles', label: '차량' },
  { key: 'settings', label: '설정' },
]

const globalMenuItems = [
  { key: 'wiki', label: '위키' },
  { key: 'devlog', label: '개발로그' },
  { key: 'community', label: '커뮤니티' },
]
</script>

<style scoped>
/* ✅ 단일 루트는 레이아웃만 잡고, 실제 UI는 내부 nav가 담당 */
.play-side-root {
  height: 100%;
  min-height: 0;
}

/* 데스크톱 사이드바 */
.play-sidebar-inner {
  height: 100%;
  border-radius: 14px;
  background: rgba(2, 6, 23, 0.18);
  border: 1px solid rgba(148, 163, 184, 0.55);
  backdrop-filter: blur(6px);

  padding: 10px 8px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 6px;

  min-height: 0;
  overflow: auto;
}

.sidebar-header { padding: 2px 10px 6px; }

.sidebar-label {
  font-size: 0.76rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  opacity: 0.9;
  color: rgba(226, 232, 240, 0.92);
}

.sidebar-sep {
  height: 1px;
  margin: 8px 8px 6px;
  background: rgba(148, 163, 184, 0.35);
}

.sidebar-item {
  width: 100%;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.6);
  background: rgba(15, 23, 42, 0.35);
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

.sidebar-item-main {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.sidebar-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 1);
  box-shadow: 0 0 8px rgba(191, 219, 254, 0.8);
}

.sidebar-dot--global {
  background: rgba(96, 165, 250, 1);
  box-shadow: 0 0 10px rgba(96, 165, 250, 0.9);
}

.sidebar-text { white-space: nowrap; }

.sidebar-badge {
  font-size: 0.72rem;
  padding: 1px 6px;
  border-radius: 999px;
  border: 1px solid rgba(191, 219, 254, 0.9);
  background: rgba(15, 23, 42, 0.45);
}

.sidebar-item:hover {
  border-color: rgba(191, 219, 254, 1);
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.9);
  transform: translateY(-1px);
  background: rgba(15, 23, 42, 0.55);
}

.sidebar-item.is-active {
  border-color: rgba(129, 140, 248, 1);
  background: rgba(79, 70, 229, 0.55);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.95);
}

.sidebar-item.is-active .sidebar-dot {
  background: #fbbf24;
  box-shadow: 0 0 10px rgba(251, 191, 36, 1);
}

/* KST 패널 */
.sidebar-kst {
  margin-top: 10px;
  border-radius: 14px;
  border: 1px solid rgba(251, 191, 36, 0.35);
  background: rgba(15, 23, 42, 0.30);
  padding: 10px 10px 9px;
  box-shadow: 0 10px 22px rgba(2, 6, 23, 0.35);
}

.sidebar-kst-label {
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.9;
  color: rgba(203, 213, 225, 0.9);
  margin-bottom: 6px;
}

.sidebar-kst-date {
  font-size: 0.74rem;
  color: rgba(203, 213, 225, 0.92);
  letter-spacing: 0.02em;
}

.sidebar-kst-time-row {
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
  margin-top: 2px;
}

.sidebar-kst-weekday {
  font-size: 0.86rem;
  font-weight: 800;
  color: rgba(226, 232, 240, 0.96);
}

.sidebar-kst-time {
  font-size: 1.08rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  color: rgba(248, 250, 252, 0.98);
  font-variant-numeric: tabular-nums;
}

/* ===== 모바일 메뉴(Body Teleport) ===== */
.mm-wrap {
  position: fixed;
  inset: 0;
  z-index: 10050;
  pointer-events: none;
}

.mm-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(2, 6, 23, 0.35);
  backdrop-filter: blur(2px);
  pointer-events: none;
}

.play-mobile-menu {
  position: fixed;
  top: 74px;
  left: 8px;
  right: 8px;
  border-radius: 14px;

  background: rgba(2, 6, 23, 0.62);
  border: 1px solid rgba(251, 191, 36, 0.45);
  backdrop-filter: blur(8px);

  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.95);
  padding: 8px 8px 10px;
  box-sizing: border-box;

  max-height: calc(100vh - 140px);
  overflow: auto;

  pointer-events: auto;
  z-index: 10060;
}

.mobile-menu-header { padding: 2px 6px 6px; }

.mobile-menu-title {
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  opacity: 0.92;
  color: rgba(226, 232, 240, 0.94);
}

.mobile-menu-sep {
  height: 1px;
  margin: 8px 6px 6px;
  background: rgba(148, 163, 184, 0.35);
}

.mobile-menu-item {
  width: 100%;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.6);
  background: rgba(15, 23, 42, 0.35);
  padding: 7px 10px;
  margin-bottom: 4px;

  font-size: 0.8rem;
  color: rgba(226, 232, 240, 0.95);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  cursor: pointer;
}

.mobile-menu-item-main {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.mobile-menu-dot {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 1);
  box-shadow: 0 0 7px rgba(191, 219, 254, 0.8);
}

.mobile-menu-dot--global {
  background: rgba(96, 165, 250, 1);
  box-shadow: 0 0 9px rgba(96, 165, 250, 0.85);
}

.mobile-menu-text { white-space: nowrap; }

.mobile-menu-badge {
  font-size: 0.72rem;
  padding: 1px 6px;
  border-radius: 999px;
  border: 1px solid rgba(191, 219, 254, 0.9);
  background: rgba(15, 23, 42, 0.45);
}

.mobile-menu-item.is-active {
  border-color: rgba(129, 140, 248, 1);
  background: rgba(79, 70, 229, 0.55);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.95);
}

.mobile-menu-item.is-active .mobile-menu-dot {
  background: #fbbf24;
  box-shadow: 0 0 10px rgba(251, 191, 36, 1);
}

/* ✅ 정류장 순차 등장 */
.mobile-stagger {
  --stagger: 0;
  opacity: 0;
  transform: translateX(-10px) scale(0.98);
  animation: station-in 0.26s cubic-bezier(0.2, 1.1, 0.2, 1) forwards;
  animation-delay: calc(var(--stagger) * 0.03s);
  will-change: transform, opacity;
}

@keyframes station-in {
  0% { opacity: 0; transform: translateX(-10px) scale(0.98); filter: blur(6px); }
  70% { opacity: 1; transform: translateX(2px) scale(1.01); filter: blur(0); }
  100% { opacity: 1; transform: translateX(0) scale(1); filter: blur(0); }
}

/* ✅ Depot 패널 트랜지션 */
.mm-depot-enter-active {
  transition:
    opacity 0.14s ease-out,
    transform 0.30s cubic-bezier(0.12, 1.1, 0.18, 1);
  transform-origin: top center;
}
.mm-depot-leave-active {
  transition:
    opacity 0.12s ease-in,
    transform 0.20s cubic-bezier(0.4, 0, 1, 1);
  transform-origin: top center;
}
.mm-depot-enter-from { opacity: 0; transform: translateY(-6px) scaleY(0.78); }
.mm-depot-enter-to   { opacity: 1; transform: translateY(0)   scaleY(1); }
.mm-depot-leave-from { opacity: 1; transform: translateY(0)   scaleY(1); }
.mm-depot-leave-to   { opacity: 0; transform: translateY(-4px) scaleY(0.88); }

/* 모바일 KST */
.mobile-kst {
  margin-top: 10px;
  border-radius: 14px;
  border: 1px solid rgba(251, 191, 36, 0.35);
  background: rgba(15, 23, 42, 0.30);
  padding: 10px 10px 9px;
}

.mobile-kst-label {
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.9;
  color: rgba(203, 213, 225, 0.9);
  margin-bottom: 6px;
}

.mobile-kst-date {
  font-size: 0.74rem;
  color: rgba(203, 213, 225, 0.92);
  letter-spacing: 0.02em;
}

.mobile-kst-time-row {
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
  margin-top: 2px;
}

.mobile-kst-weekday {
  font-size: 0.86rem;
  font-weight: 800;
  color: rgba(226, 232, 240, 0.96);
}

.mobile-kst-time {
  font-size: 1.08rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  color: rgba(248, 250, 252, 0.98);
  font-variant-numeric: tabular-nums;
}
</style>
