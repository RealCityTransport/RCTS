<template>
  <div class="app-shell">
    <header class="app-header">
      <RouterLink class="brand" to="/headquarters">
        <strong>RCTS Lite</strong>
        <span>가상 운송회사</span>
      </RouterLink>

      <div class="header-info">
        <span>{{ clockText }}</span>
        <strong>{{ moneyText }}</strong>
      </div>
    </header>

    <main class="app-main">
      <RouterView />
    </main>

    <nav class="bottom-nav">
      <RouterLink v-for="item in navItems" :key="item.path" :to="item.path">
        <span>{{ item.icon }}</span>
        <strong>{{ item.label }}</strong>
      </RouterLink>
    </nav>
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { rctsLiteManager } from './stores/rctsLiteManager'
import { formatClock, formatMoney } from './modules/time'

const navItems = [
  { path: '/headquarters', label: '본부', icon: '🏢' },
  { path: '/vehicles', label: '차량', icon: '🚌' },
  { path: '/operations', label: '운영', icon: '▶' },
  { path: '/rail', label: '철도', icon: '🚆' },
  { path: '/aviation', label: '항공', icon: '✈️' },
  { path: '/settlement', label: '정산', icon: '💰' },
]

const clockText = computed(() => formatClock(new Date(rctsLiteManager.state.tickNow)))
const moneyText = computed(() => formatMoney(rctsLiteManager.state.money))

onMounted(() => {
  rctsLiteManager.startTicker()
})

onBeforeUnmount(() => {
  rctsLiteManager.stopTicker()
})
</script>

<style scoped>
:global(*) {
  box-sizing: border-box;
}

:global(html),
:global(body),
:global(#app) {
  width: 100%;
  min-height: 100%;
  margin: 0;
  background: #0b1020;
  color: #e5e7eb;
  font-family: Inter, Pretendard, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

:global(body) {
  overflow-y: auto;
  scrollbar-width: none;
}

:global(body::-webkit-scrollbar),
:global(*::-webkit-scrollbar) {
  display: none;
}

:global(*) {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

:global(button),
:global(input),
:global(select) {
  font: inherit;
}

:global(button) {
  touch-action: manipulation;
}

:global(a) {
  color: inherit;
  text-decoration: none;
}

.app-shell {
  min-height: 100vh;
  padding-bottom: 78px;
  background:
    radial-gradient(circle at top left, rgba(37, 99, 235, 0.22), transparent 34rem),
    radial-gradient(circle at bottom right, rgba(20, 184, 166, 0.16), transparent 34rem),
    #0b1020;
}

.app-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 22px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(11, 16, 32, 0.88);
  backdrop-filter: blur(16px);
}

.brand {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.brand strong {
  font-size: 20px;
  letter-spacing: -0.02em;
}

.brand span,
.header-info span {
  color: #94a3b8;
  font-size: 12px;
}

.header-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 3px;
}

.header-info strong {
  color: #bfdbfe;
}

.app-main {
  width: min(1180px, 100%);
  margin: 0 auto;
  padding: 24px;
}

.bottom-nav {
  position: fixed;
  left: 50%;
  bottom: 14px;
  z-index: 20;
  display: grid;
  grid-template-columns: repeat(6, minmax(62px, 1fr));
  gap: 8px;
  width: min(760px, calc(100% - 28px));
  padding: 8px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 22px;
  background: rgba(15, 23, 42, 0.92);
  backdrop-filter: blur(16px);
  transform: translateX(-50%);
  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.28);
}

.bottom-nav a {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-height: 52px;
  border-radius: 16px;
  color: #94a3b8;
}

.bottom-nav a.router-link-active {
  color: #e0f2fe;
  background: rgba(59, 130, 246, 0.18);
}

.bottom-nav span {
  font-size: 18px;
}

.bottom-nav strong {
  font-size: 12px;
}

@media (max-width: 640px) {
  .app-header {
    padding: 14px 16px;
  }

  .brand strong {
    font-size: 17px;
  }

  .header-info span {
    display: none;
  }

  .app-main {
    padding: 18px 14px;
  }

  .bottom-nav {
    bottom: 10px;
    grid-template-columns: repeat(6, 1fr);
    gap: 4px;
    width: calc(100% - 18px);
    border-radius: 18px;
  }

  .bottom-nav a {
    min-height: 48px;
    border-radius: 13px;
  }

  .bottom-nav strong {
    font-size: 10px;
  }
}
</style>
