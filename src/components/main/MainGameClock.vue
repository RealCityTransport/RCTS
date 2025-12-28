<!-- src/components/main/MainGameClock.vue -->
<template>
  <section class="clock-wrapper">
    <div class="clock-chip">
      <span class="chip-label">KSTS</span>
      <span class="chip-time">{{ timeText }}</span>
      <span class="chip-date">{{ dateShortText }}</span>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  // useKstTime().now 에서 넘어오는 값 (Date)
  now: {
    type: Object,
    required: true,
  },
})

const dayNames = ['일', '월', '화', '수', '목', '금', '토']

const timeText = computed(() => {
  const d = props.now
  const hour = String(d.getHours()).padStart(2, '0')
  const minute = String(d.getMinutes()).padStart(2, '0')
  return `${hour}:${minute}`
})

const dateShortText = computed(() => {
  const d = props.now
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const dow = dayNames[d.getDay()]
  return `${month}.${day} · ${dow}`
})
</script>

<style scoped>
.clock-wrapper {
  margin-bottom: 8px;
  display: flex;
  justify-content: flex-end;
}

/* 작지만 눈에 딱 들어오는 디지털 칩 스타일 */
.clock-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;

  /* 작은데 존재감 있는 느낌을 위해 약한 네온 + 얇은 보더 */
  background:
    radial-gradient(circle at top left, rgba(56, 189, 248, 0.25), transparent),
    radial-gradient(circle at bottom right, rgba(129, 140, 248, 0.25), transparent),
    rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(148, 163, 184, 0.9);
  box-shadow: 0 0 12px rgba(15, 23, 42, 0.9);
  box-sizing: border-box;

  font-family: 'SUIT', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
}

.chip-label {
  font-size: 0.65rem;
  padding: 2px 6px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.9);
  text-transform: uppercase;
  opacity: 0.9;
}

.chip-time {
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  font-variant-numeric: tabular-nums;
}

.chip-date {
  font-size: 0.7rem;
  opacity: 0.85;
}
</style>
