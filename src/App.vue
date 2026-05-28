<!-- src/App.vue -->

<script setup>
import { computed, onMounted, onUnmounted, provide, readonly, ref } from 'vue'
import { useRctsStore } from './stores/rctsStore'

const { isTimeDisplayUnlocked, initRctsStore } = useRctsStore()

const worldStartedAt = ref(Date.now())
const worldNow = ref(Date.now())
const worldTick = ref(0)

let worldClockTimer = null

const worldRuntimeSeconds = computed(() => {
  return Math.floor((worldNow.value - worldStartedAt.value) / 1000)
})

const seoulDateText = computed(() => {
  const parts = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(worldNow.value)

  const year = parts.find((part) => part.type === 'year')?.value ?? '0000'
  const month = parts.find((part) => part.type === 'month')?.value ?? '00'
  const day = parts.find((part) => part.type === 'day')?.value ?? '00'

  return `${year}.${month}.${day}`
})

const seoulTimeText = computed(() => {
  const parts = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(worldNow.value)

  const hour = parts.find((part) => part.type === 'hour')?.value ?? '00'
  const minute = parts.find((part) => part.type === 'minute')?.value ?? '00'

  return `${hour}:${minute}`
})

function syncWorldClock() {
  worldNow.value = Date.now()
  worldTick.value = worldRuntimeSeconds.value
}

function startWorldClock() {
  if (worldClockTimer) return

  syncWorldClock()

  worldClockTimer = window.setInterval(() => {
    syncWorldClock()
  }, 1000)
}

function stopWorldClock() {
  if (!worldClockTimer) return

  window.clearInterval(worldClockTimer)
  worldClockTimer = null
}

provide('worldClock', {
  startedAt: readonly(worldStartedAt),
  now: readonly(worldNow),
  tick: readonly(worldTick),
  runtimeSeconds: readonly(worldRuntimeSeconds),
  seoulDateText: readonly(seoulDateText),
  seoulTimeText: readonly(seoulTimeText),
})

onMounted(() => {
  initRctsStore()
  startWorldClock()
})

onUnmounted(() => {
  stopWorldClock()
})
</script>

<template>
  <main class="app">
    <header class="app-header">
      <RouterLink to="/" class="brand">
        <span class="brand-mark">R</span>
        <div>
          <strong>RCTS</strong>
        </div>
      </RouterLink>

      <div
        v-if="isTimeDisplayUnlocked"
        class="header-clock"
      >
        <span>{{ seoulDateText }}</span>
        <strong>{{ seoulTimeText }}</strong>
      </div>
    </header>

    <RouterView />
  </main>
</template>

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
  padding: 0;
  background: #0f172a;
}

:global(html),
:global(body) {
  scrollbar-width: none;
}

:global(body) {
  overflow-x: hidden;
  overflow-y: auto;
}

:global(body::-webkit-scrollbar) {
  display: none;
}

.app {
  width: 100%;
  min-height: 100dvh;
  padding: 24px;
  background:
    radial-gradient(circle at top left, rgba(96, 165, 250, 0.2), transparent 34%),
    linear-gradient(135deg, #0f172a 0%, #111827 52%, #1e1b4b 100%);
  color: #f8fafc;
  font-family:
    Pretendard,
    Inter,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  color: inherit;
  text-decoration: none;
}

.brand-mark {
  width: 46px;
  height: 46px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  border-radius: 16px;
  background: #60a5fa;
  color: #0f172a;
  font-weight: 900;
  font-size: 24px;
}

.brand strong {
  display: block;
  font-size: 24px;
  letter-spacing: 0.04em;
}

.header-clock {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border: 1px solid rgba(96, 165, 250, 0.32);
  border-radius: 16px;
  background: rgba(96, 165, 250, 0.1);
}

.header-clock span {
  color: #cbd5e1;
  font-size: 13px;
  font-weight: 800;
}

.header-clock strong {
  color: #f8fafc;
  font-size: 16px;
  font-weight: 900;
  letter-spacing: 0.04em;
}

@media (max-width: 720px) {
  .app {
    padding: 16px;
  }

  .app-header {
    display: grid;
  }

  .header-clock {
    justify-content: center;
  }
}
</style>