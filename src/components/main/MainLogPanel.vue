<!-- src/components/main/MainLogPanel.vue -->
<template>
  <div class="log-panel">
    <header class="log-header">
      <h2 class="log-title">시스템 로그</h2>
      <span class="log-subtitle">운영 / 이벤트 / 알림</span>
    </header>

    <div class="log-body">
      <ul class="log-list">
        <li
          v-for="log in logs"
          :key="log.id"
          class="log-item"
        >
          <span class="time">{{ log.time }}</span>
          <span class="message">{{ log.message }}</span>
        </li>
      </ul>

      <p class="log-note">
        이 영역은 게임 내에서 발생하는 각종 이벤트, 운행 결과, 연구 완료, 경고 메시지 등을 순차적으로 보여주는 패널입니다.
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// 임시 더미 로그
const logs = ref([
  { id: 1, time: 'KSTS 0001. 01. 01 08:00', message: '시뮬레이션이 시작되었습니다.' },
  { id: 2, time: 'KSTS 0001. 01. 01 08:10', message: '도심 순환선 기본 운행이 개시되었습니다.' },
  { id: 3, time: 'KSTS 0001. 01. 01 08:30', message: '마을 버스 노선 연구 준비 중입니다.' },
])
</script>

<style scoped>
.log-panel {
  padding: 12px 12px 10px;
  border-radius: 16px;
  background: rgba(15, 23, 42, 0.86);
  border: 1px solid rgba(148, 163, 184, 0.55);
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 6px;
}

.log-title {
  font-size: 0.95rem;
  font-weight: 700;
}

.log-subtitle {
  font-size: 0.7rem;
  opacity: 0.8;
}

.log-body {
  font-size: 0.78rem;
  max-height: 180px;
  overflow-y: auto;
}

.log-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.log-item {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 4px 8px;
  padding: 4px 0;
  border-bottom: 1px solid rgba(30, 41, 59, 0.9);
}

.log-item:last-child {
  border-bottom: none;
}

.time {
  font-family: 'SUIT', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 0.7rem;
  opacity: 0.75;
}

.message {
  font-size: 0.78rem;
}

.log-note {
  margin-top: 6px;
  font-size: 0.7rem;
  opacity: 0.7;
}
</style>
