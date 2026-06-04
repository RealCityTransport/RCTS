<!--
  파일 주소:
  src/views/SettingsView.vue

  적용 내용:
  - 설정 / 데이터 관리 메뉴 페이지
  - 자동저장을 기본 상태로 표시
  - 기술적인 저장소명, 스키마 버전, 내부 모듈명은 화면에 노출하지 않음
  - 유저에게는 저장 상태, 현재 데이터 요약, 불러오기/백업/초기화만 압축 표시
  - 수동 저장 버튼은 보조 기능으로 작게 유지

  연결된 파일:
  - src/router/index.js
  - src/modules/save.js
  - src/modules/gameState.js
  - src/App.vue

  수정 시 주의:
  - 유저 화면에는 IndexedDB, schemaVersion, gameState 같은 내부 기술 용어를 표시하지 않음
  - 정보는 최대한 압축해서 표시
-->

<template>
  <main class="settings-layout">
    <section class="page-hero panel">
      <div>
        <p>SETTINGS</p>
        <h1>설정</h1>
      </div>

      <span class="hero-note">
        진행 상태는 자동으로 저장됩니다. 백업 파일은 필요할 때만 따로 보관하세요.
      </span>
    </section>

    <section class="content-grid">
      <article class="panel main-panel">
        <div class="section-header compact">
          <div>
            <h2>저장 관리</h2>
            <span>{{ publicMessage }}</span>
          </div>

          <span
            class="status-badge"
            :class="{
              ready: saveState.isReady && !saveState.error,
              error: saveState.error
            }"
          >
            {{ statusText }}
          </span>
        </div>

        <div class="summary-grid">
          <article class="summary-card highlight">
            <span>자금</span>
            <strong>{{ formatMoney(gameState.finance.funds) }}</strong>
          </article>

          <article class="summary-card">
            <span>차량</span>
            <strong>{{ gameState.vehicles.length }}대</strong>
          </article>

          <article class="summary-card">
            <span>슬롯</span>
            <strong>{{ gameState.operationSlots.length }}개</strong>
          </article>

          <article class="summary-card">
            <span>자동저장</span>
            <strong>{{ saveState.autoSaveEnabled ? 'ON' : '준비중' }}</strong>
          </article>
        </div>

        <div class="save-strip" :class="{ error: saveState.error }">
          <div>
            <span>마지막 자동저장</span>
            <strong>{{ formatDateTime(saveState.lastAutoSavedAt || saveState.lastSavedAt) }}</strong>
          </div>

          <div>
            <span>마지막 불러오기</span>
            <strong>{{ formatDateTime(saveState.lastLoadedAt) }}</strong>
          </div>

          <div>
            <span>저장 상태</span>
            <strong>{{ saveState.hasSave ? '저장됨' : '저장 전' }}</strong>
          </div>
        </div>

        <div class="action-grid">
          <button
            type="button"
            class="primary"
            :disabled="saveState.isLoading"
            @click="handleSave"
          >
            즉시 저장
          </button>

          <button
            type="button"
            :disabled="saveState.isLoading || !saveState.hasSave"
            @click="handleLoad"
          >
            불러오기
          </button>

          <button
            type="button"
            :disabled="saveState.isLoading"
            @click="handleExport"
          >
            백업 만들기
          </button>

          <button
            type="button"
            :disabled="saveState.isLoading"
            @click="openImportDialog"
          >
            백업 가져오기
          </button>

          <button
            type="button"
            class="danger"
            :disabled="saveState.isLoading || !saveState.hasSave"
            @click="handleClear"
          >
            저장 삭제
          </button>
        </div>

        <input
          ref="fileInputRef"
          class="hidden-file"
          type="file"
          accept="application/json"
          @change="handleImportFile"
        />
      </article>

      <aside class="panel side-panel">
        <div class="section-header compact">
          <div>
            <h2>데이터</h2>
            <span>저장 항목</span>
          </div>
        </div>

        <ul class="info-list">
          <li>
            <strong>회사 / 자금</strong>
            <span>회사명, 보유 자금, 수익 상태</span>
          </li>

          <li>
            <strong>차량 / 슬롯</strong>
            <span>보유 차량, 운행 슬롯, 진행 상태</span>
          </li>

          <li>
            <strong>정산 기록</strong>
            <span>최근 수익 기록과 상태 알림</span>
          </li>

          <li>
            <strong>백업</strong>
            <span>내보낸 파일은 직접 보관</span>
          </li>
        </ul>
      </aside>
    </section>
  </main>
</template>

<script setup>
import { computed, ref } from 'vue'
import {
  clearSave,
  exportSaveFile,
  importSaveFile,
  loadGame,
  saveGame,
  saveState
} from '../modules/save'
import { gameState } from '../modules/gameState'

const fileInputRef = ref(null)

const statusText = computed(() => {
  if (saveState.error) {
    return '문제'
  }

  if (saveState.isLoading) {
    return '처리중'
  }

  if (saveState.autoSaveEnabled) {
    return '자동저장'
  }

  if (saveState.isReady) {
    return '정상'
  }

  return '준비중'
})

const publicMessage = computed(() => {
  if (saveState.error) {
    return '요청을 처리하지 못했습니다.'
  }

  if (saveState.isLoading) {
    return '처리 중입니다.'
  }

  if (saveState.autoSaveEnabled) {
    return '변경 사항은 자동으로 저장됩니다.'
  }

  return '저장 기능을 준비 중입니다.'
})

async function handleSave() {
  try {
    await saveGame()
  } catch (error) {
    applyError(error)
  }
}

async function handleLoad() {
  try {
    await loadGame()
  } catch (error) {
    applyError(error)
  }
}

async function handleExport() {
  try {
    await exportSaveFile()
  } catch (error) {
    applyError(error)
  }
}

function openImportDialog() {
  fileInputRef.value?.click()
}

async function handleImportFile(event) {
  const file = event.target.files?.[0]

  if (!file) {
    return
  }

  try {
    await importSaveFile(file)
  } catch (error) {
    applyError(error)
  } finally {
    event.target.value = ''
  }
}

async function handleClear() {
  const confirmed = window.confirm('저장 데이터를 삭제할까요? 백업 파일이 없다면 복구할 수 없습니다.')

  if (!confirmed) {
    return
  }

  try {
    await clearSave()
  } catch (error) {
    applyError(error)
  }
}

function applyError(error) {
  saveState.error = error instanceof Error ? error.message : String(error)
}

function formatMoney(value) {
  return `${new Intl.NumberFormat('ko-KR').format(value)}R`
}

function formatDateTime(value) {
  if (!value) {
    return '없음'
  }

  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(new Date(value))
}
</script>

<style scoped>
.settings-layout {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
}

.panel {
  border: 1px solid rgba(120, 190, 255, 0.16);
  border-radius: 16px;
  background: rgba(8, 20, 34, 0.78);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.24);
}

.page-hero {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: end;
  padding: 20px;
}

.page-hero p {
  margin: 0 0 6px;
  color: #4bcaff;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.15em;
}

.page-hero h1 {
  margin: 0;
  font-size: 30px;
}

.hero-note {
  max-width: 520px;
  color: #a8bacb;
  line-height: 1.5;
  text-align: right;
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(680px, 1fr) 300px;
  gap: 12px;
}

.main-panel,
.side-panel {
  padding: 14px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.section-header.compact {
  margin-bottom: 12px;
}

.section-header h2 {
  margin: 0;
  font-size: 18px;
}

.section-header span {
  color: #7f92a4;
  font-size: 12px;
}

.status-badge {
  padding: 6px 10px;
  color: #ffbf62;
  border-radius: 999px;
  background: rgba(255, 191, 98, 0.1);
  font-size: 12px;
  font-weight: 900;
}

.status-badge.ready {
  color: #7eff8f;
  background: rgba(83, 255, 124, 0.1);
}

.status-badge.error {
  color: #ff8b82;
  background: rgba(255, 120, 112, 0.12);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.summary-card {
  padding: 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.035);
}

.summary-card.highlight {
  border: 1px solid rgba(229, 211, 90, 0.2);
  background: rgba(229, 211, 90, 0.06);
}

.summary-card span {
  display: block;
  color: #8ea2b4;
  font-size: 12px;
}

.summary-card strong {
  display: block;
  margin-top: 4px;
  font-size: 17px;
}

.summary-card.highlight strong {
  color: #e5d35a;
}

.save-strip {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 10px;
  padding: 10px;
  border: 1px solid rgba(120, 190, 255, 0.12);
  border-radius: 12px;
  background: rgba(80, 198, 255, 0.045);
}

.save-strip.error {
  border-color: rgba(255, 120, 112, 0.25);
  background: rgba(255, 120, 112, 0.08);
}

.save-strip span {
  display: block;
  color: #8ea2b4;
  font-size: 11px;
}

.save-strip strong {
  display: block;
  margin-top: 4px;
  font-size: 12px;
}

.action-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.action-grid button {
  min-width: 118px;
  padding: 10px 12px;
  color: #b8c8d8;
  border: 1px solid rgba(120, 190, 255, 0.18);
  border-radius: 11px;
  background: rgba(255, 255, 255, 0.035);
}

.action-grid button.primary {
  color: #eaf9ff;
  border-color: rgba(80, 205, 255, 0.42);
  background: rgba(45, 176, 255, 0.18);
}

.action-grid button.danger {
  color: #ffaaa4;
  border-color: rgba(255, 120, 112, 0.3);
  background: rgba(255, 120, 112, 0.08);
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.hidden-file {
  display: none;
}

.info-list {
  padding: 0;
  margin: 0;
  list-style: none;
}

.info-list li {
  padding: 11px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
}

.info-list li:last-child {
  border-bottom: 0;
}

.info-list strong {
  display: block;
}

.info-list span {
  display: block;
  margin-top: 4px;
  color: #8fa2b5;
  font-size: 12px;
  line-height: 1.4;
}

@media (max-width: 1100px) {
  .page-hero {
    align-items: flex-start;
    flex-direction: column;
  }

  .hero-note {
    text-align: left;
  }

  .content-grid,
  .summary-grid,
  .save-strip {
    grid-template-columns: 1fr;
  }
}
</style>