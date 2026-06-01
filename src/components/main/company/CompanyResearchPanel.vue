<!--
RCTS FILE CONTEXT
파일 역할:
- 회사 메뉴 내부의 연구 패널.
- 연구 목록을 카테고리별로 표시한다.
- 연구 시작 이벤트를 부모로 전달한다.
- 진행 중인 연구의 남은 시간과 진행률을 표시한다.

현재 연결:
- CompanyPage.vue에서 activeTab === 'research'일 때 표시된다.
- completedResearch props를 받는다.
- activeResearch props를 받는다.
- currentTick props를 받는다.
- start-research 이벤트를 emit한다.
- data/researchItems.js의 researchItems를 출력한다.

현재 규칙:
- 완료된 연구는 연구 목록에서 사라진다.
- 메뉴 해금 연구는 상단에 표시된다.
- 해금 가능한 메뉴 연구가 먼저 보인다.
- 미개발 메뉴 연구는 잠김 상태로 남겨둔다.
- settings-basic 완료 후 설정 메뉴 연구가 표시된다.
- save-local-basic 완료 후 설정 > 데이터 > 수동 저장 기능이 해금된다.
- 외부저장, 자동저장, 서버저장은 아직 미제공이다.

주의:
- 이 컴포넌트는 연구 UI만 담당한다.
- 연구 완료 상태 저장은 Home.vue에서 관리한다.
- currentTick은 표준시간 tick이다.

다음 작업 방향:
- 연구 카테고리를 더 늘릴 수 있다.
- 시설 내부 연구, 노선 내부 연구, 운행 내부 연구 등을 데이터 기반으로 확장할 수 있다.
-->

<template>
  <section class="company-section">
    <div class="section-heading">
      <div>
        <span>COMPANY RESEARCH</span>
        <h3>기본 연구</h3>
      </div>

      <strong>완료 {{ completedResearch.length }}개</strong>
    </div>

    <p>
      연구는 카테고리별로 표시됩니다.
      완료된 연구는 목록에서 사라지고, 아직 개발되지 않은 연구는 미개발 상태로 남겨둡니다.
    </p>

    <div v-if="activeResearch" class="active-research-box">
      <div>
        <span>진행 중인 연구</span>
        <strong>{{ getResearchName(activeResearch.id) }}</strong>
      </div>

      <div class="active-time">
        <b>{{ formatRemainingTime(getRemainingTicks(activeResearch)) }}</b>
        <small>남음</small>
      </div>

      <div class="progress-track">
        <div
          class="progress-bar"
          :style="{ width: `${getProgressPercent(activeResearch)}%` }"
        ></div>
      </div>
    </div>

    <section class="research-category">
      <div class="category-title">
        <div>
          <span>MENU UNLOCK</span>
          <h4>메뉴 해금</h4>
        </div>

        <strong>{{ menuUnlockResearch.length }}개 남음</strong>
      </div>

      <p>
        현재 해금 가능한 연구가 먼저 표시됩니다.
        완료된 연구는 사라지고, 미개발 연구는 아래에 잠긴 상태로 표시됩니다.
      </p>

      <div v-if="availableMenuUnlockResearch.length" class="unlock-list">
        <article
          v-for="research in availableMenuUnlockResearch"
          :key="research.id"
          class="unlock-card"
          :class="{ active: isResearchActive(research.id) }"
        >
          <div>
            <span>해금 가능</span>
            <strong>{{ research.targetName }}</strong>
            <small>{{ research.name }}</small>
          </div>

          <button
            type="button"
            :disabled="isButtonDisabled(research)"
            @click="emit('start-research', research.id)"
          >
            {{ getButtonText(research) }}
          </button>
        </article>
      </div>

      <div v-if="unavailableMenuUnlockResearch.length" class="research-grid muted-grid">
        <article
          v-for="research in unavailableMenuUnlockResearch"
          :key="research.id"
          class="research-card unavailable"
        >
          <div class="research-info">
            <strong>{{ research.targetName }}</strong>
            <span>{{ research.description }}</span>
            <small>{{ getResearchStatusText(research) }}</small>
          </div>

          <button type="button" disabled>
            {{ getButtonText(research) }}
          </button>
        </article>
      </div>

      <div
        v-if="!availableMenuUnlockResearch.length && !unavailableMenuUnlockResearch.length"
        class="empty-box"
      >
        <strong>현재 남은 메뉴 해금 연구가 없습니다.</strong>
        <span>새 메뉴 연구가 추가되면 이 영역에 표시됩니다.</span>
      </div>
    </section>

    <section class="research-category">
      <div class="category-title">
        <div>
          <span>SETTINGS RESEARCH</span>
          <h4>설정 메뉴 연구</h4>
        </div>

        <strong>{{ settingsResearch.length }}개 남음</strong>
      </div>

      <p>
        설정 메뉴가 해금되면 회사 설정 내부 기능 연구가 이곳에 표시됩니다.
      </p>

      <div v-if="!isSettingsUnlocked" class="locked-box">
        <strong>설정 메뉴가 아직 잠겨 있습니다.</strong>
        <span>먼저 기초 회사 설정 연구를 완료해야 설정 메뉴 연구가 표시됩니다.</span>
      </div>

      <div v-else-if="settingsResearch.length" class="research-grid">
        <article
          v-for="research in settingsResearch"
          :key="research.id"
          class="research-card"
          :class="{ active: isResearchActive(research.id) }"
        >
          <div class="research-info">
            <strong>{{ research.name }}</strong>
            <span>{{ research.description }}</span>
            <small>{{ getResearchStatusText(research) }}</small>
          </div>

          <button
            type="button"
            :disabled="isButtonDisabled(research)"
            @click="emit('start-research', research.id)"
          >
            {{ getButtonText(research) }}
          </button>
        </article>
      </div>

      <div v-else class="empty-box">
        <strong>현재 남은 설정 연구가 없습니다.</strong>
        <span>설정 관련 연구가 추가되면 이 영역에 표시됩니다.</span>
      </div>
    </section>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import {
  canStartResearch,
  getMissingRequiredResearch,
  getResearchName,
  researchItems,
} from '../../../data/researchItems'

const props = defineProps({
  completedResearch: {
    type: Array,
    default: () => [],
  },
  activeResearch: {
    type: Object,
    default: null,
  },
  currentTick: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits(['start-research'])

const menuUnlockResearch = computed(() => {
  return researchItems.filter((research) => {
    return research.category === 'menu-unlock' && !isResearchDone(research.id)
  })
})

const availableMenuUnlockResearch = computed(() => {
  return menuUnlockResearch.value.filter((research) => {
    return canStartResearch(research, props.completedResearch)
  })
})

const unavailableMenuUnlockResearch = computed(() => {
  return menuUnlockResearch.value.filter((research) => {
    return !canStartResearch(research, props.completedResearch)
  })
})

const settingsResearch = computed(() => {
  return researchItems.filter((research) => {
    return (
      research.category === 'settings' &&
      !isResearchDone(research.id) &&
      canDisplayResearch(research)
    )
  })
})

const isSettingsUnlocked = computed(() => {
  return props.completedResearch.includes('settings-basic')
})

function isResearchDone(researchId) {
  return props.completedResearch.includes(researchId)
}

function isResearchActive(researchId) {
  return props.activeResearch?.id === researchId
}

function canDisplayResearch(research) {
  if (!research.requiredResearch?.length) {
    return true
  }

  return research.requiredResearch.every((researchId) => {
    return props.completedResearch.includes(researchId)
  })
}

function getElapsedTicks(research) {
  if (!research) {
    return 0
  }

  return Math.max(0, props.currentTick - research.startedAtTick)
}

function getRemainingTicks(research) {
  if (!research) {
    return 0
  }

  const elapsedTicks = getElapsedTicks(research)

  return Math.max(0, research.durationTicks - elapsedTicks)
}

function getProgressPercent(research) {
  if (!research) {
    return 0
  }

  const elapsedTicks = getElapsedTicks(research)

  if (research.durationTicks <= 0) {
    return 100
  }

  return Math.min(100, (elapsedTicks / research.durationTicks) * 100)
}

function formatRemainingTime(totalTicks) {
  const safeTicks = Math.max(0, Number(totalTicks) || 0)
  const minutes = Math.floor(safeTicks / 60)
  const seconds = safeTicks % 60

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function isButtonDisabled(research) {
  if (!canStartResearch(research, props.completedResearch)) {
    return true
  }

  if (isResearchActive(research.id)) {
    return true
  }

  if (props.activeResearch) {
    return true
  }

  return false
}

function getButtonText(research) {
  if (!research.isAvailable) {
    return '미개발'
  }

  if (isResearchDone(research.id)) {
    return '완료됨'
  }

  if (isResearchActive(research.id)) {
    return '진행 중'
  }

  if (props.activeResearch) {
    return '대기'
  }

  const missingRequiredResearch = getMissingRequiredResearch(
    research,
    props.completedResearch,
  )

  if (missingRequiredResearch.length > 0) {
    return '선행 필요'
  }

  return '연구 시작'
}

function getResearchStatusText(research) {
  if (!research.isAvailable) {
    return research.disabledReason || '아직 미개발 상태입니다.'
  }

  if (isResearchActive(research.id)) {
    return `연구 진행 중 · 남은 시간 ${formatRemainingTime(getRemainingTicks(props.activeResearch))}`
  }

  const missingRequiredResearch = getMissingRequiredResearch(
    research,
    props.completedResearch,
  )

  if (missingRequiredResearch.length > 0) {
    const names = missingRequiredResearch.map((id) => getResearchName(id)).join(', ')

    return `선행 연구 필요 · ${names}`
  }

  return `예상 소요 시간 ${formatRemainingTime(research.durationTicks)}`
}
</script>

<style scoped>
.company-section {
  padding: 20px;
  border: 1px solid #dbe3ef;
  border-radius: 12px;
  background: #ffffff;
}

.section-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}

.section-heading span {
  display: block;
  color: var(--blue);
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 1px;
}

.section-heading h3 {
  margin: 6px 0 0;
  color: #111827;
  font-size: 24px;
}

.section-heading strong {
  color: #1e3a8a;
  font-size: 16px;
  font-weight: 900;
}

.company-section > p {
  max-width: 760px;
  margin: 10px 0 22px;
  color: #475569;
  font-size: 15px;
  line-height: 1.7;
}

.active-research-box {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 14px;
  margin-bottom: 18px;
  padding: 16px;
  border: 1px solid #93c5fd;
  border-radius: 12px;
  background: #eff6ff;
}

.active-research-box span {
  display: block;
  color: #2563eb;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 1px;
}

.active-research-box strong {
  display: block;
  margin-top: 5px;
  color: #111827;
  font-size: 18px;
}

.active-time {
  text-align: right;
}

.active-time b {
  display: block;
  color: #1e3a8a;
  font-size: 24px;
}

.active-time small {
  color: #475569;
  font-size: 12px;
  font-weight: 900;
}

.progress-track {
  grid-column: 1 / -1;
  height: 10px;
  border-radius: 999px;
  background: #dbeafe;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  border-radius: inherit;
  background: var(--blue);
  transition: width 1s linear;
}

.research-category {
  margin-top: 18px;
  padding: 18px;
  border: 1px solid #dbe3ef;
  border-radius: 12px;
  background: #f8fafc;
}

.category-title {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 14px;
}

.category-title span {
  display: block;
  color: #2563eb;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 1px;
}

.category-title h4 {
  margin: 5px 0 0;
  color: #111827;
  font-size: 21px;
}

.category-title strong {
  color: #334155;
  font-size: 14px;
  font-weight: 900;
}

.research-category > p {
  max-width: 760px;
  margin: 8px 0 16px;
  color: #64748b;
  font-size: 14px;
  line-height: 1.65;
}

.unlock-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 14px;
}

.unlock-card {
  display: grid;
  grid-template-columns: 1fr 108px;
  align-items: center;
  gap: 14px;
  padding: 18px;
  border: 1px solid #93c5fd;
  border-radius: 12px;
  background: #eff6ff;
}

.unlock-card.active {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.unlock-card span {
  display: block;
  color: #2563eb;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 1px;
}

.unlock-card strong {
  display: block;
  margin-top: 5px;
  color: #111827;
  font-size: 24px;
}

.unlock-card small {
  display: block;
  margin-top: 6px;
  color: #475569;
  font-size: 13px;
  font-weight: 800;
}

.unlock-card button {
  height: 40px;
  border: 0;
  border-radius: 9px;
  background: var(--blue);
  color: white;
  font-size: 13px;
  font-weight: 900;
  cursor: pointer;
}

.unlock-card button:disabled {
  background: #94a3b8;
  cursor: default;
}

.research-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.muted-grid {
  margin-top: 8px;
}

.research-card {
  display: grid;
  grid-template-columns: 1fr 104px;
  align-items: center;
  gap: 14px;
  padding: 16px;
  border: 1px solid #dbe3ef;
  border-radius: 12px;
  background: white;
}

.research-card.active {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.research-card.unavailable {
  opacity: 0.58;
  filter: grayscale(0.35);
}

.research-info strong {
  display: block;
  color: #111827;
  font-size: 15px;
}

.research-info span {
  display: block;
  margin-top: 5px;
  color: #64748b;
  font-size: 13px;
  line-height: 1.5;
}

.research-info small {
  display: block;
  margin-top: 8px;
  color: #1e3a8a;
  font-size: 12px;
  font-weight: 900;
  line-height: 1.5;
}

.research-card.unavailable .research-info small {
  color: #64748b;
}

.research-card button {
  height: 38px;
  border: 0;
  border-radius: 9px;
  background: var(--blue);
  color: white;
  font-size: 13px;
  font-weight: 900;
  cursor: pointer;
}

.research-card button:disabled {
  background: #94a3b8;
  cursor: default;
}

.locked-box,
.empty-box {
  min-height: 104px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
  padding: 20px;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
  background: white;
}

.locked-box strong,
.empty-box strong {
  color: #111827;
  font-size: 18px;
}

.locked-box span,
.empty-box span {
  color: #64748b;
  font-size: 14px;
  line-height: 1.6;
}

@media (max-width: 1100px) {
  .unlock-list,
  .research-grid {
    grid-template-columns: 1fr;
  }

  .unlock-card,
  .research-card {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 820px) {
  .section-heading,
  .category-title {
    align-items: flex-start;
    flex-direction: column;
  }

  .active-research-box {
    grid-template-columns: 1fr;
  }

  .active-time {
    text-align: left;
  }
}
</style>