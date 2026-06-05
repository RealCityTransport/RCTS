<!--
  파일명: src/views/ResearchView.vue

  역할:
  - 연구 시작 화면입니다.
  - 완료되지 않은 연구 전체를 보여줍니다.
  - 선행 조건 미충족 연구도 잠김 상태로 표시합니다.
  - 완료된 연구는 숨깁니다.
  - 진행 중인 연구는 상태만 표시하고, 실제 진행 확인은 운영 슬롯에서 합니다.

  핵심 구조:
  - 연구 페이지: 앞으로 연구할 내용 확인 + 연구 시작
  - 운영 슬롯 페이지: 진행 중 연구 확인
-->

<template>
  <section class="research-page">
    <div
      v-if="researchListForView.length === 0"
      class="empty-panel"
    >
      <strong>남은 연구가 없습니다.</strong>
      <p>현재 버전에서 진행 가능한 연구를 모두 완료했습니다.</p>
    </div>

    <div
      v-else
      class="research-list"
    >
      <article
        v-for="research in researchListForView"
        :key="research.id"
        class="research-card"
        :class="getResearchCardClass(research)"
      >
        <div class="research-left">
          <div class="research-icon">
            {{ research.icon }}
          </div>

          <div class="research-main">
            <div class="research-title-row">
              <h3>{{ research.name }}</h3>

              <span
                class="status-badge"
                :class="getResearchCardClass(research)"
              >
                {{ getResearchStatusText(research) }}
              </span>
            </div>

            <p>{{ research.description }}</p>

            <div class="research-meta">
              <div>
                <span>소요시간</span>
                <strong>{{ formatRemainTime(research.durationSeconds) }}</strong>
              </div>

              <div>
                <span>비용</span>
                <strong>{{ research.cost.toLocaleString() }}R</strong>
              </div>

              <div>
                <span>선행연구</span>
                <strong>{{ getResearchPrerequisiteText(research) }}</strong>
              </div>
            </div>

            <div
              v-if="research.status === 'running'"
              class="progress-track"
            >
              <div
                class="progress-bar"
                :style="{ width: `${research.progress}%` }"
              ></div>
            </div>
          </div>
        </div>

        <button
          class="research-button"
          :class="getResearchCardClass(research)"
          :disabled="isResearchButtonDisabled(research)"
          @click="startResearch(research.id)"
        >
          {{ getResearchButtonText(research) }}
        </button>
      </article>
    </div>
  </section>
</template>

<script setup>
/*
  ResearchView 스크립트 영역
*/

import {
  formatRemainTime,
  getResearchButtonText,
  getResearchPrerequisiteText,
  getResearchStatusText,
  isResearchButtonDisabled,
  researchListForView,
  startResearch,
} from '../stores/gameStore'

const getResearchCardClass = (research) => {
  if (research.status === 'running') {
    return 'running'
  }

  if (!research.prerequisiteMet) {
    return 'locked'
  }

  return 'available'
}
</script>

<style scoped>
.research-page {
  display: grid;
  gap: 10px;
}

.empty-panel {
  padding: 22px;
  border: 1px dashed #b9c8dc;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.68);
  text-align: center;
}

.empty-panel strong {
  display: block;
  color: #142033;
  font-size: 18px;
}

.empty-panel p {
  margin: 8px 0 0;
  color: #6c7d92;
  font-size: 13px;
}

.research-list {
  display: grid;
  gap: 10px;
}

.research-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 118px;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 13px 14px;
  border: 1px solid #dce6f2;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 8px 18px rgba(24, 54, 94, 0.055);
}

.research-card.available {
  border-color: rgba(22, 119, 255, 0.32);
}

.research-card.running {
  border-color: rgba(136, 92, 255, 0.42);
  background: linear-gradient(180deg, #f7f3ff 0%, #ffffff 100%);
}

.research-card.locked {
  opacity: 0.78;
  background: rgba(246, 249, 252, 0.92);
}

.research-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.research-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 48px;
  width: 48px;
  height: 48px;
  border-radius: 16px;
  background: #f0eaff;
  font-size: 27px;
}

.research-card.locked .research-icon {
  background: #eef2f7;
  filter: grayscale(1);
}

.research-main {
  display: grid;
  gap: 7px;
  min-width: 0;
  flex: 1;
}

.research-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.research-title-row h3 {
  min-width: 0;
  margin: 0;
  color: #142033;
  font-size: 17px;
  font-weight: 900;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.research-main p {
  margin: 0;
  color: #607086;
  font-size: 12px;
  line-height: 1.35;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-badge {
  flex: 0 0 auto;
  display: inline-flex;
  padding: 5px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 900;
  white-space: nowrap;
}

.status-badge.available {
  background: #e8f1ff;
  color: #1677ff;
}

.status-badge.running {
  background: #efe8ff;
  color: #7547d8;
}

.status-badge.locked {
  background: #eef2f7;
  color: #7b8ba0;
}

.research-meta {
  display: grid;
  grid-template-columns: 110px 90px 140px;
  gap: 8px;
}

.research-meta div {
  min-width: 0;
  padding: 7px 9px;
  border-radius: 12px;
  background: #f5f8fc;
}

.research-card.locked .research-meta div {
  background: #eef2f7;
}

.research-meta span {
  display: block;
  color: #7b8ba0;
  font-size: 10px;
  font-weight: 800;
  line-height: 1;
}

.research-meta strong {
  display: block;
  margin-top: 4px;
  color: #142033;
  font-size: 13px;
  font-weight: 900;
  line-height: 1.1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.progress-track {
  overflow: hidden;
  height: 7px;
  border-radius: 999px;
  background: #e5edf6;
}

.progress-bar {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #885cff, #35d16f);
  transition: width 0.25s linear;
}

.research-button {
  width: 100%;
  min-height: 44px;
  border: 0;
  border-radius: 15px;
  background: #1677ff;
  color: #fff;
  font-size: 14px;
  font-weight: 900;
  cursor: pointer;
  transition: 0.2s ease;
}

.research-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 18px rgba(22, 119, 255, 0.2);
}

.research-button:disabled {
  background: #c8d2df;
  cursor: default;
  transform: none;
  box-shadow: none;
}

.research-button.running {
  background: #885cff;
}

.research-button.locked {
  background: #c8d2df;
}

@media (min-width: 1024px) {
  .research-card {
    grid-template-columns: minmax(0, 1fr) 132px;
    padding: 14px 16px;
  }

  .research-meta {
    grid-template-columns: 128px 110px 160px;
  }
}

@media (max-width: 640px) {
  .research-card {
    grid-template-columns: 1fr;
  }

  .research-left {
    align-items: flex-start;
  }

  .research-meta {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .research-meta div:nth-child(3) {
    grid-column: 1 / -1;
  }
}

@media (max-width: 420px) {
  .research-title-row {
    flex-wrap: wrap;
  }

  .research-main p {
    white-space: normal;
  }
}
</style>