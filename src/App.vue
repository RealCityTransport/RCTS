<!-- src/App.vue -->

<script setup>
import { computed, onMounted, onUnmounted, provide, readonly, ref } from 'vue'

/**
 * RCTS GLOBAL RUNTIME CLOCK
 * - 앱 실행 시 자동 시작
 * - 1초 = 1틱
 * - 실제 현재 시간 기준
 * - 서울 시간 기준 표시
 * - 초는 내부에서 흐르지만 화면 표시는 YYYY.MM.DD / HH:MM까지만 사용
 * - 저장 기능이 없으므로 새로고침 시 초기화
 */

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

:global(body) {
  overflow-x: hidden;
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
  align-items: center;
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

@media (max-width: 720px) {
  .app {
    padding: 16px;
  }
}
</style>