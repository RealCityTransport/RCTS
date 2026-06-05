<!--
  파일명: src/views/OperationsView.vue

  역할:
  - 운영 슬롯 화면입니다.
  - 차량 운행, 진행 중 연구, 차량 업그레이드, 슬롯 판매를 표시합니다.
  - 버스 운행은 정류장 정차/이동 단계로 표시합니다.
  - 버스 Lv.4 이후 시간표 버튼과 슬롯별 시간표 드롭다운을 표시합니다.
-->

<template>
  <section class="operations-page">
    <div
      v-if="operationDashboardItems.length === 0"
      class="empty-panel"
    >
      <strong>진행 중인 항목이 없습니다.</strong>
      <p>차량을 구입하거나 연구를 시작하면 이곳에 표시됩니다.</p>
    </div>

    <div
      v-else
      class="slot-list"
    >
      <article
        v-for="item in operationDashboardItems"
        :key="`${item.kind}-${item.id}`"
        class="slot-card"
        :class="[item.status, item.kind, { route: item.slotType === 'route' }]"
      >
        <div class="slot-left">
          <div class="slot-icon">
            {{ item.icon }}
          </div>

          <div class="slot-main">
            <div class="slot-title-row">
              <h3>{{ getDisplayTitle(item) }}</h3>

              <span
                class="status-badge"
                :class="[item.status, item.kind]"
              >
                {{ getSlotStatusText(item) }}
              </span>
            </div>

            <p class="slot-description">
              {{ getDisplayDescription(item) }}
            </p>

            <div class="slot-meta">
              <div class="meta-item">
                <span>{{ item.kind === 'research' ? '남은연구' : getRemainLabel(item) }}</span>
                <strong>{{ getSlotRemainText(item) }}</strong>
              </div>

              <div class="meta-item">
                <span>{{ item.kind === 'research' ? '진행률' : getProgressLabel(item) }}</span>
                <strong>{{ getSlotProgressText(item) }}</strong>
              </div>

              <div class="meta-item meta-wide">
                <span>구분</span>
                <strong>{{ getItemTypeText(item) }}</strong>
              </div>
            </div>

            <div
              v-if="getBusOperationDetailText(item)"
              class="bus-detail-panel"
            >
              <strong>{{ getBusOperationDetailText(item) }}</strong>

              <ul
                v-if="getRouteVehicleRunLines(item).length > 0"
                class="route-run-list"
              >
                <li
                  v-for="line in getRouteVehicleRunLines(item)"
                  :key="line"
                >
                  {{ line }}
                </li>
              </ul>
            </div>

            <div
              v-if="item.status === 'running'"
              class="progress-track"
            >
              <div
                class="progress-bar"
                :class="item.kind"
                :style="{ width: `${getProgressPercent(item)}%` }"
              ></div>
            </div>
          </div>
        </div>

        <div class="slot-actions">
          <button
            class="slot-action-button"
            :class="[item.status, item.kind]"
            :disabled="!canHandleOperationSlotAction(item)"
            @click="handleOperationSlotAction(item)"
          >
            {{ getSlotButtonText(item) }}
          </button>

          <button
            v-if="canShowTimetableButton(item)"
            class="slot-timetable-button"
            @click="toggleSlotTimetable(item.id)"
          >
            {{ item.timetableOpen ? '시간표 ▲' : '시간표 ▼' }}
          </button>

          <button
            v-for="upgradeVehicle in getNextUpgradeVehicles(item)"
            :key="upgradeVehicle.type"
            class="slot-upgrade-button"
            :disabled="!canUpgradeOperationSlot(item, upgradeVehicle.type)"
            @click="upgradeOperationSlot(item.id, upgradeVehicle.type)"
          >
            {{ getSlotUpgradeButtonText(item, upgradeVehicle.type) }}
          </button>

          <button
            v-if="item.kind === 'vehicle' && canSellOperationSlot(item)"
            class="slot-sell-button"
            @click="sellOperationSlot(item.id)"
          >
            {{ getSlotSellButtonText(item) }}
          </button>
        </div>

        <div
          v-if="canShowTimetableButton(item) && item.timetableOpen"
          class="timetable-panel"
        >
          <div class="timetable-header">
            <div>
              <strong>시간표 설정</strong>
              <p>{{ getTimetablePanelNotice(item) }}</p>
            </div>

            <span>{{ getSlotTimetableInfo(item).modeText }}</span>
          </div>

          <div class="route-form-grid">
            <label>
              <span>노선번호</span>
              <input
                type="text"
                :value="item.route?.number ?? ''"
                placeholder="예: 21"
                @change="updateSlotRouteField(item.id, 'number', $event.target.value)"
              />
            </label>

            <label>
              <span>노선명</span>
              <input
                type="text"
                :value="item.route?.name ?? ''"
                placeholder="예: 수원역 ↔ 영통순환"
                @change="updateSlotRouteField(item.id, 'name', $event.target.value)"
              />
            </label>
          </div>

          <div class="timetable-meta">
            <div>
              <span>노선 운행시간</span>
              <strong>{{ getSlotTimetableInfo(item).routeCycleText }}</strong>
            </div>

            <div>
              <span>배정 차량</span>
              <strong>{{ getSlotTimetableInfo(item).assignedVehicleCount }}대</strong>
            </div>

            <div>
              <span>현재 배차</span>
              <strong>{{ getSlotTimetableInfo(item).headwayText }}</strong>
            </div>

            <div>
              <span>필요 차량</span>
              <strong>{{ getSlotTimetableInfo(item).requiredVehicleCount }}대</strong>
            </div>

            <div>
              <span>부족 차량</span>
              <strong>{{ getSlotTimetableInfo(item).shortageVehicleCount }}대</strong>
            </div>
          </div>

          <div
            v-if="isBusTimetable2Unlocked"
            class="target-headway-panel"
          >
            <label>
              <span>목표 배차간격</span>
              <div class="headway-input-row">
                <input
                  type="number"
                  min="1"
                  :value="getSlotTimetableInfo(item).targetHeadwayMinutes"
                  placeholder="예: 10"
                  @change="updateSlotTargetHeadwayMinutes(item.id, $event.target.value)"
                />
                <strong>분</strong>
              </div>
            </label>

            <p>
              목표 배차간격을 설정하면 필요한 차량 수와 부족 차량 수가 계산됩니다.
            </p>
          </div>

          <div
            v-if="isBusTimetable3Unlocked"
            class="future-panel"
          >
            <strong>버스 시간표 3 해금됨</strong>
            <p>첫차, 막차, 출근/퇴근 배차 설정 UI는 다음 단계에서 확장하면 됩니다.</p>
          </div>

          <div
            v-if="isBusTimetable4Unlocked"
            class="future-panel"
          >
            <strong>버스 시간표 4 해금됨</strong>
            <p>심야시간 배차 설정 UI는 다음 단계에서 확장하면 됩니다.</p>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup>
import {
  canHandleOperationSlotAction,
  canSellOperationSlot,
  canShowTimetableButton,
  canUpgradeOperationSlot,
  formatRemainTime,
  getBusOperationDetailText,
  getNextUpgradeVehicles,
  getRouteVehicleRunLines,
  getSlotButtonText,
  getSlotProgressText,
  getSlotRemainText,
  getSlotSellButtonText,
  getSlotSettlementText,
  getSlotStatusText,
  getSlotTimetableInfo,
  getSlotUpgradeButtonText,
  getTimetablePanelNotice,
  handleOperationSlotAction,
  isBusTimetable2Unlocked,
  isBusTimetable3Unlocked,
  isBusTimetable4Unlocked,
  isFundingUnlocked,
  operationDashboardItems,
  sellOperationSlot,
  toggleSlotTimetable,
  updateSlotRouteField,
  updateSlotTargetHeadwayMinutes,
  upgradeOperationSlot,
} from '../stores/gameStore'

const getProgressPercent = (item) => {
  if (item.kind === 'research') {
    return Math.max(0, Math.min(100, item.progress ?? 0))
  }

  if (item.durationMode === 'parcel_count') {
    const total = item.totalParcels ?? item.durationSeconds ?? 0
    const processed = item.processedParcels ?? 0

    if (total <= 0) return 0

    return Math.max(0, Math.min(100, (processed / total) * 100))
  }

  if (item.slotType === 'route' && Array.isArray(item.routeVehicleRuns)) {
    const total = item.routeVehicleRuns.reduce((sum, run) => {
      return sum + (run.durationSeconds ?? 0)
    }, 0)

    const remain = item.routeVehicleRuns.reduce((sum, run) => {
      if (run.status === 'completed') return sum
      return sum + (run.remainingSeconds ?? 0)
    }, 0)

    if (total <= 0) return 0

    return Math.max(0, Math.min(100, ((total - remain) / total) * 100))
  }

  if (!item.durationSeconds) return 0

  const percent = ((item.durationSeconds - item.remainingSeconds) / item.durationSeconds) * 100

  return Math.max(0, Math.min(100, percent))
}

const getRemainLabel = (item) => {
  if (item.durationMode === 'parcel_count') return '남은건수'
  if (item.slotType === 'route') return '다음출발'
  if (item.durationMode === 'bus_stops' || item.durationMode === 'bus_metro') return '단계남은'
  return '남은시간'
}

const getProgressLabel = (item) => {
  if (item.durationMode === 'parcel_count') return '처리건수'
  if (item.durationMode === 'bus_stops' || item.durationMode === 'bus_metro') return '승객'
  return '정산금'
}

const getItemTypeText = (item) => {
  if (item.kind === 'research') return '연구 진행'

  if (item.slotType === 'route') {
    return item.settlementLabel ?? '노선 슬롯'
  }

  if (isFundingUnlocked.value) return item.settlementLabel

  return '자금추가 연구 필요'
}

const getDisplayTitle = (item) => {
  if (item.kind === 'research') return item.name

  if (item.slotType === 'route') {
    const number = item.route?.number ? `[${item.route.number}] ` : ''
    const name = item.route?.name ?? item.name

    return `${number}${name}`
  }

  return item.name
}

const getDisplayDescription = (item) => {
  if (item.kind === 'research') return item.description

  if (item.slotType === 'route') {
    return `${item.busServiceName ?? item.name} / ${getSlotSettlementText(item)}`
  }

  return item.description
}
</script>

<style scoped>
.operations-page {
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

.slot-list {
  display: grid;
  gap: 10px;
}

.slot-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 160px;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 13px 14px;
  border: 1px solid #dce6f2;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 8px 18px rgba(24, 54, 94, 0.055);
}

.slot-card.route {
  border-color: rgba(22, 119, 255, 0.28);
}

.slot-card.running.vehicle {
  border-color: rgba(22, 119, 255, 0.38);
}

.slot-card.running.research {
  border-color: rgba(136, 92, 255, 0.42);
  background: linear-gradient(180deg, #f7f3ff 0%, #ffffff 100%);
}

.slot-card.completed {
  border-color: rgba(255, 174, 0, 0.48);
  background: linear-gradient(180deg, #fffaf0 0%, #ffffff 100%);
}

.slot-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.slot-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 48px;
  width: 48px;
  height: 48px;
  border-radius: 16px;
  background: #eef5ff;
  font-size: 27px;
}

.slot-card.research .slot-icon {
  background: #f0eaff;
}

.slot-main {
  display: grid;
  gap: 7px;
  min-width: 0;
  flex: 1;
}

.slot-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.slot-title-row h3 {
  min-width: 0;
  margin: 0;
  color: #142033;
  font-size: 17px;
  font-weight: 900;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.slot-description {
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

.status-badge.waiting {
  background: #eef2f7;
  color: #607086;
}

.status-badge.running.vehicle {
  background: #e7f8ee;
  color: #149447;
}

.status-badge.running.research {
  background: #efe8ff;
  color: #7547d8;
}

.status-badge.completed {
  background: #fff0c2;
  color: #a66d00;
}

.slot-meta {
  display: grid;
  grid-template-columns: 92px 106px minmax(0, 1fr);
  gap: 8px;
  min-width: 0;
}

.meta-item {
  min-width: 0;
  padding: 7px 9px;
  border-radius: 12px;
  background: #f5f8fc;
}

.meta-item span {
  display: block;
  color: #7b8ba0;
  font-size: 10px;
  font-weight: 800;
  line-height: 1;
}

.meta-item strong {
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

.bus-detail-panel {
  display: grid;
  gap: 6px;
  padding: 9px 10px;
  border-radius: 14px;
  background: #f1f7ff;
  color: #1f4c7f;
  font-size: 12px;
  font-weight: 800;
}

.bus-detail-panel strong {
  font-size: 12px;
  line-height: 1.35;
}

.route-run-list {
  display: grid;
  gap: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
  color: #425166;
  font-size: 11px;
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
  background: linear-gradient(90deg, #1677ff, #35d16f);
  transition: width 0.25s linear;
}

.progress-bar.research {
  background: linear-gradient(90deg, #885cff, #35d16f);
}

.slot-actions {
  display: grid;
  gap: 7px;
}

.slot-action-button,
.slot-upgrade-button,
.slot-sell-button,
.slot-timetable-button {
  width: 100%;
  min-height: 40px;
  border: 0;
  border-radius: 15px;
  font-size: 13px;
  font-weight: 900;
  cursor: pointer;
  transition: 0.2s ease;
}

.slot-action-button {
  background: #1677ff;
  color: #fff;
}

.slot-action-button.completed {
  background: #ffae00;
  color: #2d2100;
}

.slot-action-button.research {
  background: #885cff;
}

.slot-timetable-button {
  background: #0d1b2f;
  color: #fff;
}

.slot-upgrade-button {
  background: #18a058;
  color: #fff;
}

.slot-sell-button {
  background: #f1f4f8;
  color: #425166;
}

.slot-action-button:hover,
.slot-upgrade-button:hover,
.slot-sell-button:hover,
.slot-timetable-button:hover {
  transform: translateY(-1px);
}

.slot-action-button:disabled,
.slot-upgrade-button:disabled {
  background: #c8d2df;
  color: #fff;
  cursor: default;
  transform: none;
  box-shadow: none;
}

.timetable-panel {
  grid-column: 1 / -1;
  display: grid;
  gap: 12px;
  padding: 14px;
  border: 1px solid #d7e6fb;
  border-radius: 18px;
  background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
}

.timetable-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.timetable-header strong {
  display: block;
  color: #142033;
  font-size: 15px;
  font-weight: 900;
}

.timetable-header p {
  margin: 5px 0 0;
  color: #607086;
  font-size: 12px;
  line-height: 1.4;
}

.timetable-header > span {
  flex: 0 0 auto;
  padding: 6px 9px;
  border-radius: 999px;
  background: #e8f1ff;
  color: #1677ff;
  font-size: 11px;
  font-weight: 900;
}

.route-form-grid {
  display: grid;
  grid-template-columns: 160px minmax(0, 1fr);
  gap: 10px;
}

.route-form-grid label,
.target-headway-panel label {
  display: grid;
  gap: 5px;
  min-width: 0;
}

.route-form-grid span,
.target-headway-panel span {
  color: #7b8ba0;
  font-size: 11px;
  font-weight: 900;
}

.route-form-grid input,
.target-headway-panel input {
  width: 100%;
  min-height: 40px;
  padding: 0 11px;
  border: 1px solid #d7e2ee;
  border-radius: 13px;
  background: #fff;
  color: #142033;
  font-size: 13px;
  font-weight: 800;
  outline: none;
}

.route-form-grid input:focus,
.target-headway-panel input:focus {
  border-color: #1677ff;
  box-shadow: 0 0 0 3px rgba(22, 119, 255, 0.1);
}

.timetable-meta {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
}

.timetable-meta div {
  min-width: 0;
  padding: 8px 9px;
  border-radius: 13px;
  background: #f5f8fc;
}

.timetable-meta span {
  display: block;
  color: #7b8ba0;
  font-size: 10px;
  font-weight: 900;
}

.timetable-meta strong {
  display: block;
  margin-top: 5px;
  color: #142033;
  font-size: 13px;
  font-weight: 900;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.target-headway-panel,
.future-panel {
  display: grid;
  gap: 7px;
  padding: 11px;
  border-radius: 15px;
  background: #f5f8fc;
}

.headway-input-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.headway-input-row input {
  max-width: 120px;
}

.headway-input-row strong {
  color: #142033;
  font-size: 13px;
  font-weight: 900;
}

.target-headway-panel p,
.future-panel p {
  margin: 0;
  color: #607086;
  font-size: 12px;
  line-height: 1.4;
}

.future-panel strong {
  color: #142033;
  font-size: 13px;
  font-weight: 900;
}

@media (min-width: 1024px) {
  .slot-card {
    grid-template-columns: minmax(0, 1fr) 170px;
    padding: 14px 16px;
  }

  .slot-icon {
    flex-basis: 52px;
    width: 52px;
    height: 52px;
  }

  .slot-title-row h3 {
    font-size: 18px;
  }

  .slot-description {
    font-size: 13px;
  }

  .slot-meta {
    grid-template-columns: 110px 128px minmax(0, 1fr);
  }
}

@media (max-width: 760px) {
  .timetable-meta {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .route-form-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .slot-card {
    grid-template-columns: 1fr;
    gap: 10px;
    padding: 13px;
  }

  .slot-left {
    align-items: flex-start;
  }

  .slot-icon {
    flex-basis: 44px;
    width: 44px;
    height: 44px;
    border-radius: 14px;
    font-size: 25px;
  }

  .slot-meta {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .meta-wide {
    grid-column: 1 / -1;
  }
}

@media (max-width: 420px) {
  .slot-title-row {
    flex-wrap: wrap;
  }

  .slot-description {
    white-space: normal;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
}
</style>