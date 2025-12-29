<!-- src/components/main/MainLogPanel.vue -->
<template>
  <section class="log-panel">
    <header class="log-header">
      <div>
        <h3 class="log-title">시스템 로그</h3>
        <p class="log-sub">
          노선/정류장 편집 등 주요 작업 내역이 시간 순으로 기록됩니다.
        </p>
      </div>

      <div class="log-header-right">
        <span class="log-count">
          최근 {{ logs.length }}건
        </span>

        <button
          type="button"
          class="clear-button"
          :disabled="!logs.length"
          @click="handleClear"
        >
          로그 비우기
        </button>
      </div>
    </header>

    <div
      v-if="!logs.length"
      class="log-empty"
    >
      아직 기록된 로그가 없습니다.
      <br />
      노선 생성 · 이름 변경 · 정류장 추가/순서 변경 등을 하면
      <br />
      이 영역에 작업 내역이 쌓입니다.
    </div>

    <ul
      v-else
      class="log-list"
    >
      <li
        v-for="log in logs"
        :key="log.id"
        class="log-item"
      >
        <div class="log-main">
          <div class="log-meta">
            <span class="log-time">
              {{ formatTime(log.ts) }}
            </span>
            <span
              class="log-type-chip"
              :data-kind="chipKind(log.type)"
            >
              {{ typeLabel(log.type) }}
            </span>
          </div>

          <div class="log-message">
            {{ log.message }}
          </div>

          <div
            v-if="showPayload(log)"
            class="log-payload"
          >
            <span
              v-if="log.payload?.routeId"
              class="payload-chip"
            >
              노선: {{ log.payload.routeName || log.payload.routeId }}
            </span>
            <span
              v-if="log.payload?.stopName"
              class="payload-chip"
            >
              정류장: {{ log.payload.stopName }}
            </span>
          </div>
        </div>
      </li>
    </ul>
  </section>
</template>

<script setup>
import { useSystemLog } from '@/composables/useSystemLog'

const { logs, clearLogs } = useSystemLog()

function handleClear() {
  clearLogs()
}

function formatTime(isoString) {
  if (!isoString) return '-'
  const d = new Date(isoString)
  if (Number.isNaN(d.getTime())) return '-'

  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}

function typeLabel(type) {
  switch (type) {
    case 'route:create':
      return '노선 생성'
    case 'route:update':
      return '노선 수정'
    case 'stop:create':
      return '정류장 추가'
    case 'stop:update':
      return '정류장 수정'
    case 'stop:reorder':
      return '정류장 순서 변경'
    default:
      return '기록'
  }
}

function chipKind(type) {
  if (type?.startsWith('route:')) return 'route'
  if (type?.startsWith('stop:')) return 'stop'
  return 'other'
}

function showPayload(log) {
  return !!(log.payload?.routeId || log.payload?.stopName)
}
</script>

<style scoped>
.log-panel {
  padding: 10px 10px 12px;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.94);
  border: 1px solid rgba(148, 163, 184, 0.6);
  font-size: 0.82rem;
  display: flex;
  flex-direction: column;
  gap: 8px;
  /* 10개 정도까지 자연스럽게 보이도록 최소 높이만 */
  min-height: 120px;
}

.log-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.log-title {
  font-size: 0.9rem;
  font-weight: 600;
}

.log-sub {
  font-size: 0.76rem;
  opacity: 0.8;
}

.log-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.log-count {
  font-size: 0.74rem;
  opacity: 0.8;
  white-space: nowrap;
}

.clear-button {
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.8);
  background: rgba(15, 23, 42, 0.98);
  color: #e5e7eb;
  font-size: 0.74rem;
  cursor: pointer;
  white-space: nowrap;
}

.clear-button:disabled {
  opacity: 0.4;
  cursor: default;
}

.clear-button:not(:disabled):hover {
  filter: brightness(1.05);
}

/* 빈 상태 */
.log-empty {
  margin-top: 6px;
  padding: 10px;
  border-radius: 12px;
  border: 1px dashed rgba(148, 163, 184, 0.7);
  background: rgba(15, 23, 42, 0.96);
  text-align: center;
  line-height: 1.6;
}

/* 리스트 */
.log-list {
  list-style: none;
  margin: 6px 0 0;
  padding: 0;
  /* ✅ 스크롤 제거: max-height / overflow-y 제거 */
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.log-item {
  padding: 6px 8px;
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.98);
  border: 1px solid rgba(51, 65, 85, 0.9);
}

.log-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.log-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.log-time {
  font-size: 0.72rem;
  opacity: 0.78;
}

.log-type-chip {
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.9);
  white-space: nowrap;
}

.log-type-chip[data-kind='route'] {
  border-color: rgba(96, 165, 250, 0.95);
}

.log-type-chip[data-kind='stop'] {
  border-color: rgba(45, 212, 191, 0.95);
}

.log-type-chip[data-kind='other'] {
  border-color: rgba(148, 163, 184, 0.9);
  opacity: 0.9;
}

.log-message {
  font-size: 0.8rem;
}

.log-payload {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 2px;
}

.payload-chip {
  font-size: 0.7rem;
  padding: 1px 6px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.7);
  opacity: 0.9;
}
</style>
