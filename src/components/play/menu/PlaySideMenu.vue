<!-- src/components/play/menu/PlaySideMenu.vue -->
<template>
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

    <!-- 구분선 -->
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

    <!-- 모바일 메뉴 패널 -->
    <transition name="mobile-menu">
      <nav
        v-if="isMobileMenuOpen"
        class="play-mobile-menu"
        aria-label="플레이 메뉴 (모바일)"
      >
        <div class="mobile-menu-header">
          <span class="mobile-menu-title">PLAY</span>
        </div>

        <button
          v-for="item in playMenuItems"
          :key="item.key"
          type="button"
          class="mobile-menu-item"
          :class="{ 'is-active': !activeGlobal && activeMenu === item.key }"
          @click="$emit('select-play', item.key)"
        >
          <span class="mobile-menu-item-main">
            <span class="mobile-menu-dot" />
            <span class="mobile-menu-text">{{ item.label }}</span>
          </span>
          <span v-if="item.badge" class="mobile-menu-badge">{{ item.badge }}</span>
        </button>

        <!-- 구분선 -->
        <div class="mobile-menu-sep" />

        <div class="mobile-menu-header">
          <span class="mobile-menu-title">GLOBAL</span>
        </div>

        <button
          v-for="item in globalMenuItems"
          :key="item.key"
          type="button"
          class="mobile-menu-item mobile-menu-item--global"
          :class="{ 'is-active': activeGlobal === item.key }"
          @click="$emit('select-global', item.key)"
        >
          <span class="mobile-menu-item-main">
            <span class="mobile-menu-dot mobile-menu-dot--global" />
            <span class="mobile-menu-text">{{ item.label }}</span>
          </span>
        </button>
      </nav>
    </transition>
  </nav>
</template>

<script setup>
defineProps({
  activeMenu: { type: String, required: true },
  activeGlobal: { type: String, required: true },
  isMobileMenuOpen: { type: Boolean, required: true },
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
/* 데스크톱 사이드바(유리 느낌) */
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

.sidebar-header {
  padding: 2px 10px 6px;
}

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

.sidebar-text {
  white-space: nowrap;
}

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

/* ✅ 모바일 메뉴 패널 */
.play-mobile-menu {
  position: absolute;
  top: 64px;
  left: 8px;
  right: 8px;
  border-radius: 14px;

  background: rgba(2, 6, 23, 0.62);
  border: 1px solid rgba(148, 163, 184, 0.6);
  backdrop-filter: blur(8px);

  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.95);
  padding: 8px 8px 10px;
  box-sizing: border-box;
  z-index: 20;

  max-height: calc(100vh - 120px);
  overflow: auto;
}

.mobile-menu-header {
  padding: 2px 6px 6px;
}

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

  transition:
    background 0.16s ease-out,
    border-color 0.16s ease-out,
    box-shadow 0.16s ease-out,
    transform 0.08s ease-out;
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

.mobile-menu-text {
  white-space: nowrap;
}

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
</style>
