<!-- src/views/IdleView.vue -->
<template>
  <div class="idle-page">
    <!-- 상단 헤더 -->
    <header class="idle-header">
      <div class="idle-header-top">
        <div class="idle-header-main">
          <h1 class="idle-title">RCTS</h1>
        </div>
      </div>

      <!-- 표준시간 + 운송수단 + 방치형 총 자금 -->
      <div class="idle-header-controls">
        <!-- 현재 게임 시간 (표준시간 기반 게임 시간 표시) -->
        <div class="control-block control-time">
          <div class="control-label">현재 표준시간</div>
          <div class="time-value">
            {{ formattedGameTime }}
          </div>
        </div>

        <!-- 운송수단 메뉴 -->
        <div class="control-block control-transport">
          <div class="control-label">운송수단 선택</div>
          <div class="transport-menu">
            <button
              v-for="t in transportConfigs"
              :key="t.key"
              type="button"
              class="transport-button"
              :class="{ active: activeMenu === t.key }"
              @click="setActiveMenu(t.key)"
            >
              {{ t.label }}
            </button>
          </div>
        </div>

        <!-- 방치형 총 자금 -->
        <div class="control-block control-funds">
          <div class="control-label">방치형 총 자금</div>
          <div class="funds-value">
            ₩ {{ formattedIdleFunds }}
          </div>
        </div>
      </div>
    </header>

    <!-- 운송수단별 패널 -->
    <section class="panel panel-transport">
      <h2 class="panel-title">
        운송 슬롯 · {{ currentTransportLabel }}
      </h2>

      <!-- 슬롯/자동운행 비용 요약 (해금된 운송수단일 때만) -->
      <template v-if="isCurrentTransportUnlocked">
        <p class="panel-desc">
          선택한 운송수단에 대해 최대 {{ currentSlotCount }}개의 방치형 운행 슬롯을 사용할 수 있습니다.
          첫 번째 슬롯은 기본 운행 슬롯으로, 수동 운행 또는 자동 운행으로 수익을 발생시킵니다.
          나머지 빈 슬롯은 활성화 준비 시간을 거쳐 추가 운행 슬롯으로 확장할 수 있습니다.
        </p>
        <p class="panel-cost-hint">
          슬롯 활성화 비용:
          <strong>₩ {{ getSlotActivationCost(activeMenu).toLocaleString('ko-KR') }}</strong>,
          자동운행 설정 비용:
          <strong>₩ {{ getAutoRunCost(activeMenu).toLocaleString('ko-KR') }}</strong>
        </p>
      </template>

      <!-- 운송수단별 연구/업그레이드 서브 영역 (슬롯 위) -->
      <div class="panel-research">
        <h3 class="research-title">
          {{ currentTransportLabel }} 연구 / 업그레이드
        </h3>

        <p class="research-desc">
          {{ currentResearchDescription }}
        </p>

        <!-- 버스 전용 연구/구성 -->
        <template v-if="activeMenu === 'bus'">
          <!-- 연구 목록 -->
          <ul class="research-list">
            <li
              v-for="item in busResearchList"
              :key="item.id"
              class="research-item"
            >
              <div class="research-item-main">
                <div class="research-item-title">
                  {{ item.name }}
                  <span
                    v-if="item.done"
                    class="research-badge done"
                  >
                    완료
                  </span>
                </div>
                <div class="research-item-desc">
                  {{ item.desc }}
                </div>
              </div>

              <div class="research-item-meta">
                <div class="research-meta-line">
                  비용: ₩ {{ item.cost.toLocaleString('ko-KR') }}
                </div>
                <div class="research-meta-line">
                  연구 시간(개념): {{ item.timeLabel }}
                </div>
              </div>

              <button
                type="button"
                class="research-item-button"
                :disabled="item.done || idleFunds < item.cost"
                @click="handleClickBusResearch(item.key)"
              >
                <template v-if="item.done">
                  연구 완료
                </template>
                <template v-else-if="idleFunds < item.cost">
                  자금 부족
                </template>
                <template v-else>
                  연구하기
                </template>
              </button>
            </li>
          </ul>

          <!-- 현재 적용 구성 + 노선 조정 -->
          <div class="bus-config-panel">
            <div class="bus-config-line">
              현재 적용 중: 정원
              {{ villageBusState.capacity }}명 · 정류장
              {{ villageBusState.stopsPerLoop }}개
            </div>

            <div
              v-if="busHasUnappliedUpgrade"
              class="bus-config-line"
            >
              업그레이드된 구성이 대기 중입니다.
              노선 조정을 통해 다음 운행부터 적용됩니다.
            </div>

            <div
              v-if="busHasUnappliedUpgrade"
              class="bus-config-actions"
            >
              <button
                type="button"
                class="bus-config-button"
                :disabled="!!busReconfigMeta"
                @click="handleStartBusReconfig"
              >
                버스 교체 / 노선 조정
                <span class="btn-cost">
                  (~{{ Math.round(BUS_RECONFIG_SEC / 60) }}분)
                </span>
              </button>

              <p class="bus-config-hint-small">
                진행 중인 운행은 기존 설정으로 마무리되고,
                <br />
                이후 시작하는 운행부터 업그레이드가 반영됩니다.
                자동운행 슬롯은 다음 루프부터 새 설정으로 계속 운행합니다.
              </p>
            </div>

            <p
              v-if="busReconfigMeta"
              class="bus-config-hint"
            >
              버스 교체 / 노선 조정 진행 중입니다.
              잠시 후 마을버스 라인에
              업그레이드된 정원/정류장 구성이 적용됩니다.
            </p>
          </div>

          <p class="research-hint">
            지금은 연구 완료 시 바로 효과를 적용하지 않고,
            위의 [버스 교체 / 노선 조정]을 통해 실제 운행 라인에 반영합니다.
          </p>
        </template>

        <!-- 다른 운송수단: 아직 샘플 상태 -->
        <template v-else>
          <button
            type="button"
            class="research-button"
            disabled
          >
            연구 시스템 준비 중
          </button>
          <p class="research-hint">
            이 운송수단의 방치형 연구는 아직 UI만 준비된 상태입니다.
            나중에 전용 연구 트리와 연동해줄 수 있습니다.
          </p>
        </template>
      </div>

      <!-- 현재 운송수단 해금 여부에 따라 슬롯 영역 분기 -->
      <template v-if="isCurrentTransportUnlocked">
        <div class="slot-list">
          <div
            v-for="slot in transportSlots[activeMenu]"
            :key="slot.id"
            class="slot-card"
            :data-state="slot.state"
          >
            <div class="slot-header">
              <span class="slot-index">
                슬롯 {{ slot.id }}
              </span>

              <span class="slot-state">
                <template v-if="slot.state === 'active'">
                  <template v-if="slot.autoEnabled">
                    자동 운행 슬롯
                  </template>
                  <template v-else>
                    운행 슬롯
                  </template>
                </template>
                <template v-else-if="slot.state === 'empty'">
                  빈 슬롯
                </template>
                <template v-else-if="slot.state === 'unlocking'">
                  활성화 준비 중
                </template>
                <template v-else>
                  연구 필요
                </template>
              </span>
            </div>

            <!-- 활성 슬롯: 노선명 + 남은 시간(전체 운행) -->
            <div
              v-if="slot.state === 'active'"
              class="slot-route"
            >
              <span class="slot-route-name">
                {{ slot.routeName }}
              </span>
              <span class="slot-timer">
                {{ slot.remainingText }}
              </span>
            </div>

            <!-- 활성 슬롯: 전체 진행 바 -->
            <div
              v-if="slot.state === 'active'"
              class="slot-progress"
            >
              <div class="slot-progress-bar">
                <div
                  class="slot-progress-fill"
                  :style="{ width: (slot.progress * 100).toFixed(0) + '%' }"
                />
              </div>
            </div>

            <!-- 버스일 때: 정류장 단위 이동 정보 -->
            <div
              v-if="slot.state === 'active' && activeMenu === 'bus'"
              class="slot-mini-move"
            >
              <template v-if="slot.currentStopIndex > 0">
                <!-- 정차 시간(승차중) -->
                <span
                  v-if="slot.inDwell"
                  class="slot-mini-text"
                >
                  현위치
                  {{ slot.currentStopIndex }}/{{ busLastStopInfo.stopsPerLoop }}
                  정류장 승차중
                  {{ formatPhaseRemaining(slot.dwellRemainingSec) }} 남음
                </span>

                <!-- 이동 시간 -->
                <span
                  v-else
                  class="slot-mini-text"
                >
                  다음 정류장
                  {{
                    Math.min(
                      slot.currentStopIndex + 1,
                      busLastStopInfo.stopsPerLoop,
                    )
                  }}/{{ busLastStopInfo.stopsPerLoop }}
                  이동중 {{ formatPhaseRemaining(slot.travelRemainingSec) }} 남음 ·
                  승차 {{ busLastStopInfo.board }}명 ·
                  하차 {{ busLastStopInfo.deboard }}명 ·
                  탑승
                  {{ busLastStopInfo.passengers }}/{{ busLastStopInfo.capacity }}명
                </span>
              </template>

              <template v-else>
                <span class="slot-mini-text">
                  아직 첫 정류장을 출발하지 않았습니다.
                </span>
              </template>
            </div>

            <!-- 활성 슬롯: 수동 운행 / 자동운행 / 삭제 -->
            <div
              v-if="slot.state === 'active'"
              class="slot-actions"
            >
              <!-- 자동운행 켜진 이후: 운행중 + 삭제만 표시 -->
              <template v-if="slot.autoEnabled">
                <button
                  type="button"
                  class="slot-action-button"
                  disabled
                >
                  자동 운행 중
                </button>

                <button
                  v-if="slot.id !== 1"
                  type="button"
                  class="slot-action-button danger"
                  @click="handleDeleteActiveSlot(activeMenu, slot.id)"
                >
                  슬롯 삭제
                </button>
              </template>

              <!-- 자동운행 이전: 수동 운행 + 자동운행 + 삭제 -->
              <template v-else>
                <button
                  type="button"
                  class="slot-action-button"
                  :disabled="slot.isRunning"
                  @click="handleClickRunSlot(activeMenu, slot.id)"
                >
                  {{ slot.isRunning ? '운행 중...' : '수동 운행 시작' }}
                </button>

                <button
                  type="button"
                  class="slot-action-button secondary"
                  :disabled="!canAffordAutoRun"
                  @click="handleToggleAuto(activeMenu, slot.id)"
                >
                  자동운행
                  <span class="btn-cost">
                    (₩ {{ getAutoRunCost(activeMenu).toLocaleString('ko-KR') }})
                  </span>
                </button>

                <!-- 1번 슬롯은 기본 슬롯이라 삭제 불가 -->
                <button
                  v-if="slot.id !== 1"
                  type="button"
                  class="slot-action-button danger"
                  @click="handleDeleteActiveSlot(activeMenu, slot.id)"
                >
                  슬롯 삭제
                </button>
              </template>
            </div>

            <!-- 빈 슬롯: 활성화 준비 버튼 -->
            <div
              v-if="slot.state === 'empty'"
              class="slot-actions"
            >
              <button
                type="button"
                class="slot-action-button secondary"
                :disabled="!canAffordSlotActivation"
                @click="handleClickActivateEmptySlot(activeMenu, slot.id)"
              >
                슬롯 활성화 준비 시작
                <span class="btn-cost">
                  (₩ {{ getSlotActivationCost(activeMenu).toLocaleString('ko-KR') }})
                </span>
              </button>
            </div>

            <!-- 빈 슬롯 활성화 진행 중: 진행 바 + 남은 시간 -->
            <div
              v-if="slot.state === 'unlocking'"
              class="slot-unlock"
            >
              <div class="slot-unlock-header">
                <span class="slot-unlock-label">슬롯 활성화 준비 중</span>
                <span class="slot-unlock-timer">
                  {{ slot.unlockRemainingText }}
                </span>
              </div>
              <div class="slot-unlock-bar">
                <div
                  class="slot-unlock-fill"
                  :style="{ width: (slot.unlockProgress * 100).toFixed(0) + '%' }"
                />
              </div>
            </div>

            <!-- 설명 영역 -->
            <p class="slot-desc">
              <template v-if="slot.state === 'active'">
                <template v-if="slot.autoEnabled">
                  자동으로 반복 운행되는 슬롯입니다.
                  각 정류장에서 30초 동안 승·하차를 처리하고 수익을 정산한 뒤,
                  5분 동안 다음 정류장으로 이동합니다.
                  한 바퀴 운행이 끝나면 바로 다음 루프를 시작합니다.
                </template>
                <template v-else>
                  수동으로 운행을 시작해야 수익이 발생하는 슬롯입니다.
                  [수동 운행 시작] 버튼을 누르면 1번 정류장부터 승차를 시작하고,
                  정류장마다 승·하차 인원에 따라 수익이 바로 추가됩니다.
                </template>
              </template>

              <template v-else-if="slot.state === 'empty'">
                아직 아무 운행도 배치되지 않은 슬롯입니다.
                [슬롯 활성화 준비 시작] 버튼을 눌러 일정 시간이 지나면
                이 슬롯을 추가 운행 슬롯으로 개방할 수 있습니다.
                슬롯 활성화에는 방치형 자금이 소모되며, 슬롯을 삭제해도 사용한 비용은 되돌아오지 않습니다.
              </template>

              <template v-else-if="slot.state === 'unlocking'">
                슬롯을 활성화하는 준비 단계입니다.
                준비 시간이 모두 지나면 자동으로 운행 슬롯으로 전환되며,
                이후 이 슬롯에서도 수동/자동 운행을 설정할 수 있습니다.
              </template>

              <template v-else>
                이 슬롯은 아직 개방되지 않았습니다.
                추가 연구를 통해 슬롯 개수나 효율을 늘릴 때 사용할 수 있습니다.
              </template>
            </p>
          </div>
        </div>
      </template>

      <!-- 아직 해금되지 않은 운송수단일 때 -->
      <template v-else>
        <div class="slot-locked-panel">
          <h3 class="slot-locked-title">
            {{ currentTransportLabel }} 운송수단이 아직 해금되지 않았습니다.
          </h3>

          <!-- 스타터 0단계 무상 해금 상태 -->
          <p
            v-if="isCurrentStarterFree"
            class="slot-locked-desc"
          >
            버스, 트럭, 철도는 0단계 스타터 운송수단입니다.
            이 중 한 종류는 한 번에 한해
            <strong>무상으로 해금</strong>할 수 있습니다.
            이미 한 종류를 무상 해금한 뒤에는,
            나머지 스타터 운송수단은 1단계 비용을 지불해 해금해야 합니다.
          </p>

          <!-- 일반 단계 설명 -->
          <p
            v-else
            class="slot-locked-desc"
          >
            {{ currentUnlockStage }}단계 운송수단입니다.
            단계가 높을수록 해금 비용이 커지지만, 잠재 수익과 성장 여지도 함께 커집니다.
          </p>

          <p class="slot-locked-desc">
            해금 비용:
            <strong>
              <template v-if="isCurrentStarterFree">
                무상 (₩ 0)
              </template>
              <template v-else>
                ₩ {{ currentTransportUnlockCost.toLocaleString('ko-KR') }}
              </template>
            </strong>
          </p>

          <p
            v-if="isCurrentStarterFree"
            class="slot-locked-desc"
          >
            자금이 없어도 무상 해금이 가능합니다.
            한 번만 사용할 수 있는 0단계 스타터 해금 기회이므로,
            어떤 운송수단을 먼저 열지 신중히 선택해도 좋습니다.
          </p>
          <p
            v-else
            class="slot-locked-desc"
          >
            해금에 필요한 자금이 충분할 때 아래 버튼을 눌러 운송수단을 개방할 수 있습니다.
            해금 이후에는 첫 번째 슬롯이 기본 운행 슬롯으로 열리고, 이후 슬롯은 추가 비용을 들여 확장하게 됩니다.
          </p>

          <button
            type="button"
            class="unlock-button"
            :disabled="!canAffordTransportUnlock"
            @click="unlockTransport(activeMenu)"
          >
            <template v-if="isCurrentStarterFree">
              {{ currentTransportLabel }} 무상 해금
            </template>
            <template v-else>
              {{ currentTransportLabel }} 해금
            </template>

            <span
              class="btn-cost"
              v-if="!isCurrentStarterFree"
            >
              (₩ {{ currentTransportUnlockCost.toLocaleString('ko-KR') }})
            </span>
          </button>

          <p class="slot-locked-hint">
            해금된 운송수단은 상단 운송수단 버튼에서 언제든 다시 선택해
            슬롯 구성과 운행 상태를 확인할 수 있습니다.
          </p>
        </div>
      </template>
    </section>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useGameTime } from '@/composables/useGameTime'
import { formatKstTimeYYYYMMDDHHMM } from '@/utils/timeFormat'

/**
 * 마을버스 기본 작동 데이터
 * - 기본요금 1,500원
 * - 승차 정원: 25명 (연구로 40명)
 * - 정류장 수: 기본 20개 (연구로 40개)
 * - 정류장 정차 시간: 30초
 * - 정류장 간 이동 시간: 5분(300초)
 */
const VILLAGE_BUS_BASE_CONFIG = {
  id: 'village_bus_basic',
  name: '마을버스',
  fare: 1500,
  baseCapacity: 25,
  maxCapacity: 40,
  baseStopsPerLoop: 20,
  extendedStopsPerLoop: 40,
}

const VILLAGE_BUS_DEMAND_PARAMS = {
  targetLoadRatio: 0.6,
  extraBoardLeeway: 3,
  rushEventChance: 0.05,
  rushFillMinRatio: 0.7,
}

// 시간 상수
const BUS_DWELL_SEC = 30
const BUS_TRAVEL_SEC = 5 * 60
const BUS_CYCLE_SEC = BUS_DWELL_SEC + BUS_TRAVEL_SEC

// 노선 조정(버스 교체) 시간: 10분
const BUS_RECONFIG_SEC = 10 * 60

// 마을버스 연구 카탈로그
const VILLAGE_BUS_RESEARCH_CATALOG = {
  capacityUpgrade: {
    key: 'capacityUpgrade',
    id: 'village_bus_capacity_upgrade',
    name: '정원 확장: 40석 마을버스',
    desc: '좌석 배치와 차량 규격을 확장해 승차 정원을 40명까지 늘립니다.',
    type: 'capacity',
    effect: {
      capacity: VILLAGE_BUS_BASE_CONFIG.maxCapacity,
    },
    cost: 250_000,
    timeSec: 1_800,
  },
  lineExtension: {
    key: 'lineExtension',
    id: 'village_bus_line_extension',
    name: '노선 연장: 40개 정류장',
    desc: '노선을 연장해 1루프당 40개 정류장을 운행합니다.',
    type: 'line',
    effect: {
      baseStopsPerLoop: VILLAGE_BUS_BASE_CONFIG.extendedStopsPerLoop,
    },
    cost: 220_000,
    timeSec: 2_400,
  },
  peakRush: {
    key: 'peakRush',
    id: 'village_bus_peak_rush',
    name: '러시아워 수요 분석',
    desc: '러시아워/이벤트 구간에 만차에 가까운 승객이 몰려드는 이벤트가 발생합니다.',
    type: 'rush',
    effect: {
      enableRushEvent: true,
    },
    cost: 180_000,
    timeSec: 1_500,
  },
}

// 마을버스 라인 상태
function createInitialVillageBusState() {
  return {
    lineId: VILLAGE_BUS_BASE_CONFIG.id,

    // 실제 운행에 적용 중인 값
    capacity: VILLAGE_BUS_BASE_CONFIG.baseCapacity,
    stopsPerLoop: VILLAGE_BUS_BASE_CONFIG.baseStopsPerLoop,

    // 연구 완료 상태 (하지만 곧바로 적용되진 않음)
    research: {
      capacityUpgradeDone: false,
      lineExtensionDone: false,
      peakRushDone: false,
    },

    currentPassengers: 0,
    totalIncome: 0,
    stopsProcessedInThisLoop: 0,

    lastStopIndex: 0,
    lastBoard: 0,
    lastDeboard: 0,
  }
}

const villageBusState = ref(createInitialVillageBusState())

/**
 * 연구 결과를 실제 라인 구성(capacity, stopsPerLoop)에 적용
 * - 버스 교체 / 노선 조정 완료 시점에만 호출
 */
function applyVillageBusResearchToState() {
  const state = { ...villageBusState.value }
  const base = VILLAGE_BUS_BASE_CONFIG
  const r = state.research || {}

  state.capacity = r.capacityUpgradeDone
    ? VILLAGE_BUS_RESEARCH_CATALOG.capacityUpgrade.effect.capacity
    : base.baseCapacity

  state.stopsPerLoop = r.lineExtensionDone
    ? VILLAGE_BUS_RESEARCH_CATALOG.lineExtension.effect.baseStopsPerLoop
    : base.baseStopsPerLoop

  villageBusState.value = state
}

/**
 * 랜덤 유틸
 */
function randomInt(min, max) {
  if (max <= min) return min
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * 마을버스 정류장 단위 시뮬레이션
 * - stopCount 개의 정류장만큼 처리
 * - 각 정류장에서:
 *   1) 하차 인원
 *   2) 탑승 인원
 *   3) 수익 = "승차 인원 × 요금"
 */
function simulateVillageBusStops(stopCount) {
  if (stopCount <= 0) return 0

  const state = { ...villageBusState.value }
  const conf = VILLAGE_BUS_BASE_CONFIG
  const demand = VILLAGE_BUS_DEMAND_PARAMS

  const capacity = state.capacity
  const stopsPerLoop =
    state.stopsPerLoop || VILLAGE_BUS_BASE_CONFIG.baseStopsPerLoop

  let currentPassengers = state.currentPassengers
  let income = 0

  for (let i = 0; i < stopCount; i += 1) {
    const loopStopIndex =
      (state.stopsProcessedInThisLoop % stopsPerLoop) + 1

    // 하차
    const deboard = currentPassengers > 0 ? randomInt(0, currentPassengers) : 0
    currentPassengers -= deboard

    // 탑승
    const freeSeats = capacity - currentPassengers
    let board = 0

    if (freeSeats > 0) {
      const isRush =
        state.research.peakRushDone &&
        Math.random() < demand.rushEventChance

      if (isRush) {
        const minAfter = Math.round(capacity * demand.rushFillMinRatio)
        const targetAfter = randomInt(minAfter, capacity)
        const needed = Math.max(0, targetAfter - currentPassengers)
        board = Math.min(freeSeats, needed)
      } else {
        const targetAfter = Math.round(capacity * demand.targetLoadRatio)
        const desiredDiff = targetAfter - currentPassengers
        const maxBoardTowardTarget =
          desiredDiff > 0
            ? desiredDiff + demand.extraBoardLeeway
            : Math.max(1, Math.floor(capacity * 0.1))

        const maxBoard = Math.min(
          freeSeats,
          Math.max(0, maxBoardTowardTarget),
        )

        if (maxBoard > 0) {
          board = randomInt(0, maxBoard)
        }
      }

      currentPassengers += board
    }

    // 승차 인원 기준 수익 정산
    income += board * conf.fare

    state.stopsProcessedInThisLoop += 1
    state.lastStopIndex = loopStopIndex
    state.lastBoard = board
    state.lastDeboard = deboard
  }

  state.currentPassengers = currentPassengers
  state.totalIncome += income
  villageBusState.value = state

  return income
}

// 기본 운행/슬롯 시간
const DEFAULT_RUN_DURATION_SEC = 60
const SLOT_UNLOCK_DURATION_SEC = 30

// 노선 이름
const transportRouteNames = {
  bus: '마을버스 순환 노선',
  truck: '물류 허브 왕복 노선',
  rail: '광역 급행 열차',
  air: '국제선 허브 왕복 노선',
  ship: '대륙간 화물 항로',
  space: '궤도 정거장 셔틀',
}

// 운송수단 기본 정보
const transportConfigs = [
  {
    key: 'bus',
    label: '버스',
    isStarter: true,
    unlockStage: 1,
    baseUnlockCost: 20000,
    maxSlots: 10,
    baseSlots: 10,
    baseIncomePerSlot: 1500,
    researchDescription:
      '마을버스: 기본요금 1,500원, 정원 25명(연구 시 40명), 기본 20개 정류장(연구 시 40개) 운행. 정류장마다 30초 정차 후 5분 이동하며, 승차 인원 기준으로 수익을 정산합니다.',
  },
  {
    key: 'truck',
    label: '트럭',
    isStarter: true,
    unlockStage: 1,
    baseUnlockCost: 20000,
    maxSlots: 10,
    baseSlots: 10,
    baseIncomePerSlot: 1500,
    researchDescription:
      '트럭 적재량, 배송 속도, 물류 허브 효율을 올려 시간당 화물 처리량과 수익을 늘리는 연구입니다.',
  },
  {
    key: 'rail',
    label: '철도',
    isStarter: true,
    unlockStage: 1,
    baseUnlockCost: 20000,
    maxSlots: 10,
    baseSlots: 10,
    baseIncomePerSlot: 2000,
    researchDescription:
      '철도 수송량, 열차 편성, 신호 시스템을 개선해 고정 노선의 안정적인 수익원을 만드는 연구입니다.',
  },
  {
    key: 'air',
    label: '비행기',
    isStarter: false,
    unlockStage: 2,
    baseUnlockCost: 80000,
    maxSlots: 10,
    baseSlots: 10,
    baseIncomePerSlot: 3200,
    researchDescription:
      '공항 슬롯, 항로 효율, 탑승률 최적화를 통해 장거리 고수익 노선을 구축하는 연구입니다.',
  },
  {
    key: 'ship',
    label: '배',
    isStarter: false,
    unlockStage: 2,
    baseUnlockCost: 80000,
    maxSlots: 10,
    baseSlots: 10,
    baseIncomePerSlot: 2600,
    researchDescription:
      '항구 처리량, 선박 적재량, 항로 운영비를 개선해 대량 화물과 승객 운송에 특화된 연구입니다.',
  },
  {
    key: 'space',
    label: '우주선',
    isStarter: false,
    unlockStage: 3,
    baseUnlockCost: 250000,
    maxSlots: 10,
    baseSlots: 10,
    baseIncomePerSlot: 5000,
    researchDescription:
      '우주항, 궤도 노선, 연료 기술을 연구해 극단적인 고위험·고수익 노선을 개척하는 연구입니다.',
  },
]

const transportConfigMap = transportConfigs.reduce((map, cfg) => {
  map[cfg.key] = cfg
  return map
}, {})

const transportTypes = transportConfigs.map((t) => t.key)
const starterTransports = transportConfigs
  .filter((t) => t.isStarter)
  .map((t) => t.key)

// 게임 시간
const { gameTime } = useGameTime({
  initialSpeed: 1,
})

const formattedGameTime = computed(() =>
  formatKstTimeYYYYMMDDHHMM(gameTime.value),
)

const activeMenu = ref('bus')

// 자금
const idleFunds = ref(0)

const formattedIdleFunds = computed(() =>
  idleFunds.value.toLocaleString('ko-KR'),
)

// 현재 운송수단
const currentTransportConfig = computed(() => {
  return transportConfigMap[activeMenu.value] || null
})

const currentTransportLabel = computed(() =>
  currentTransportConfig.value ? currentTransportConfig.value.label : '',
)

const currentSlotCount = computed(() =>
  currentTransportConfig.value ? currentTransportConfig.value.maxSlots : 10,
)

const isCurrentStarterTransport = computed(
  () =>
    !!currentTransportConfig.value && currentTransportConfig.value.isStarter,
)

const currentUnlockStage = computed(() =>
  currentTransportConfig.value ? currentTransportConfig.value.unlockStage : 1,
)

const unlockedTransports = ref([])

const hasAnyStarterUnlocked = computed(() =>
  unlockedTransports.value.some((t) => starterTransports.includes(t)),
)

const isCurrentStarterFree = computed(
  () => isCurrentStarterTransport.value && !hasAnyStarterUnlocked.value,
)

const currentTransportUnlockCost = computed(() => {
  const cfg = currentTransportConfig.value
  if (!cfg) return 0
  if (cfg.isStarter && !hasAnyStarterUnlocked.value) return 0
  return cfg.baseUnlockCost
})

const isCurrentTransportUnlocked = computed(() =>
  unlockedTransports.value.includes(activeMenu.value),
)

const currentResearchDescription = computed(() => {
  return currentTransportConfig.value
    ? currentTransportConfig.value.researchDescription
    : '해당 운송수단의 효율과 수익을 서서히 올리는 연구입니다.'
})

// 슬롯 상태들
const slotAutomation = ref({})
const slotRunMeta = ref({})
const slotUnlockMeta = ref({})
const slotActiveFlag = ref({})

// 버스 노선 조정 상태
const busReconfigMeta = ref(null)

// gameTime → ms
function getGameTimeMs(v = gameTime.value) {
  if (!v) return 0
  if (v instanceof Date) return v.getTime()
  const n = Number(v)
  return Number.isNaN(n) ? 0 : n
}

function slotKey(type, id) {
  return `${type}-${id}`
}

function formatRemainingText(remainingSec, isRunning) {
  if (!isRunning) return '대기 중'
  const s = Math.max(0, Math.floor(remainingSec))
  const m = Math.floor(s / 60)
  const r = s % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(r).padStart(2, '0')
  return `${mm}:${ss} 남음`
}

function formatUnlockRemainingText(remainingSec) {
  const s = Math.max(0, Math.floor(remainingSec))
  const m = Math.floor(s / 60)
  const r = s % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(r).padStart(2, '0')
  return `${mm}:${ss} 후 활성화`
}

function formatResearchTime(sec) {
  const minutes = Math.max(1, Math.round(sec / 60))
  return `${minutes}분`
}

// 정류장/이동 구간용 짧은 시간 포맷 (MM:SS)
function formatPhaseRemaining(sec) {
  const s = Math.max(0, Math.floor(sec))
  const m = Math.floor(s / 60)
  const r = s % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(r).padStart(2, '0')
  return `${mm}:${ss}`
}

// 운행 시간 계산: 버스는 정류장 수 × (정차+이동)
function getRunDurationSec(type) {
  if (type === 'bus') {
    const state = villageBusState.value
    const stops =
      state.stopsPerLoop || VILLAGE_BUS_BASE_CONFIG.baseStopsPerLoop
    return stops * BUS_CYCLE_SEC
  }

  const cfg = transportConfigMap[type]
  return cfg?.baseRunDurationSec || DEFAULT_RUN_DURATION_SEC
}

// 비용 계산 (크게 상향)
function getSlotActivationCost(type) {
  const cfg = transportConfigMap[type]
  const base = cfg?.baseIncomePerSlot || 1000
  // 슬롯 하나당: 기본 수익의 200배
  return base * 200
}

function getAutoRunCost(type) {
  const cfg = transportConfigMap[type]
  const base = cfg?.baseIncomePerSlot || 1000
  // 자동운행: 기본 수익의 500배
  return base * 500
}

function getTransportUnlockCost(type) {
  const cfg = transportConfigMap[type]
  if (!cfg) return 0
  if (cfg.isStarter && !hasAnyStarterUnlocked.value) return 0
  return cfg.baseUnlockCost
}

const canAffordSlotActivation = computed(() => {
  const type = activeMenu.value
  const cost = getSlotActivationCost(type)
  return idleFunds.value >= cost
})

const canAffordAutoRun = computed(() => {
  const type = activeMenu.value
  const cost = getAutoRunCost(type)
  return idleFunds.value >= cost
})

const canAffordTransportUnlock = computed(() => {
  const type = activeMenu.value
  const cfg = transportConfigMap[type]
  if (cfg?.isStarter && !hasAnyStarterUnlocked.value) return true
  const cost = getTransportUnlockCost(type)
  return idleFunds.value >= cost
})

// 최근 정류장 정보
const busLastStopInfo = computed(() => {
  const state = villageBusState.value
  return {
    index: state.lastStopIndex || 0,
    board: state.lastBoard || 0,
    deboard: state.lastDeboard || 0,
    passengers: state.currentPassengers || 0,
    stopsPerLoop:
      state.stopsPerLoop || VILLAGE_BUS_BASE_CONFIG.baseStopsPerLoop,
    capacity: state.capacity || VILLAGE_BUS_BASE_CONFIG.baseCapacity,
  }
})

// 버스 연구 리스트 (정원/정류장 위주)
const busResearchList = computed(() => {
  const r = villageBusState.value.research
  const items = [
    VILLAGE_BUS_RESEARCH_CATALOG.capacityUpgrade,
    VILLAGE_BUS_RESEARCH_CATALOG.lineExtension,
  ]

  return items.map((cfg) => {
    let done = false
    if (cfg.key === 'capacityUpgrade') done = !!r.capacityUpgradeDone
    if (cfg.key === 'lineExtension') done = !!r.lineExtensionDone
    return {
      ...cfg,
      done,
      timeLabel: formatResearchTime(cfg.timeSec),
    }
  })
})

// 연구 완료 상태와 실제 적용 상태 비교 → 미적용 업그레이드 존재 여부
const busHasUnappliedUpgrade = computed(() => {
  const state = villageBusState.value
  const base = VILLAGE_BUS_BASE_CONFIG
  const r = state.research || {}

  const targetCapacity = r.capacityUpgradeDone
    ? VILLAGE_BUS_RESEARCH_CATALOG.capacityUpgrade.effect.capacity
    : base.baseCapacity

  const targetStops = r.lineExtensionDone
    ? VILLAGE_BUS_RESEARCH_CATALOG.lineExtension.effect.baseStopsPerLoop
    : base.baseStopsPerLoop

  return (
    targetCapacity !== state.capacity || targetStops !== state.stopsPerLoop
  )
})

// 슬롯 구성
const transportSlots = computed(() => {
  const result = {}
  const nowMs = getGameTimeMs()

  const busState = villageBusState.value
  const busStopsPerLoop =
    busState.stopsPerLoop || VILLAGE_BUS_BASE_CONFIG.baseStopsPerLoop

  for (const type of transportTypes) {
    const cfg = transportConfigMap[type]
    const isUnlocked = unlockedTransports.value.includes(type)
    const slotCount = cfg ? cfg.maxSlots : 10
    const routeName =
      transportRouteNames[type] || `${cfg?.label || type} 기본 노선`

    const slots = Array.from({ length: slotCount }, (_, index) => {
      const id = index + 1
      const key = slotKey(type, id)
      const autoEnabled = !!slotAutomation.value[key]
      const runMeta = slotRunMeta.value[key]
      const unlockInfo = slotUnlockMeta.value[key]
      const extraActive = !!slotActiveFlag.value[key]

      let isRunning = false
      let progress = 0
      let remainingSec = DEFAULT_RUN_DURATION_SEC
      let totalSec = runMeta?.durationSec || DEFAULT_RUN_DURATION_SEC

      if (type === 'bus') {
        totalSec = runMeta?.durationSec || getRunDurationSec('bus')
      }

      if (runMeta) {
        const elapsedSec = Math.max(0, (nowMs - runMeta.startedAtMs) / 1000)
        if (elapsedSec < totalSec) {
          isRunning = true
          progress = Math.min(1, elapsedSec / totalSec)
          remainingSec = Math.max(0, totalSec - elapsedSec)
        } else {
          isRunning = false
          progress = 1
          remainingSec = 0
        }
      }

      // 슬롯 활성화 준비 상태
      let isUnlocking = false
      let unlockProgress = 0
      let unlockRemainingSec = SLOT_UNLOCK_DURATION_SEC

      if (unlockInfo) {
        const unlockElapsed = Math.max(
          0,
          (nowMs - unlockInfo.startedAtMs) / 1000,
        )
        const unlockTotal = unlockInfo.durationSec || SLOT_UNLOCK_DURATION_SEC

        if (unlockElapsed < unlockTotal) {
          isUnlocking = true
          unlockProgress = Math.min(1, unlockElapsed / unlockTotal)
          unlockRemainingSec = Math.max(0, unlockTotal - unlockElapsed)
        } else {
          isUnlocking = false
          unlockProgress = 1
          unlockRemainingSec = 0
        }
      }

      let state = 'locked'
      if (isUnlocked) {
        const isBaseActiveSlot = id === 1
        const isLogicalActive = isBaseActiveSlot || extraActive

        if (isLogicalActive || autoEnabled || runMeta) {
          state = 'active'
        } else if (isUnlocking) {
          state = 'unlocking'
        } else {
          state = 'empty'
        }
      }

      // 버스 전용: 현재 정류장 index / dwell 여부 + 잔여 시간 계산
      let currentStopIndex = 0
      let inDwell = false
      let dwellRemainingSec = 0
      let travelRemainingSec = 0

      if (type === 'bus' && runMeta) {
        const elapsedSec = Math.max(0, (nowMs - runMeta.startedAtMs) / 1000)
        const clamped =
          totalSec > 0 ? Math.min(elapsedSec, totalSec - 0.001) : 0
        const stopIndexBase = Math.floor(clamped / BUS_CYCLE_SEC)
        currentStopIndex = Math.min(
          busStopsPerLoop,
          stopIndexBase + 1,
        )
        const withinStop = clamped % BUS_CYCLE_SEC
        inDwell = withinStop < BUS_DWELL_SEC

        if (inDwell) {
          dwellRemainingSec = BUS_DWELL_SEC - withinStop
          travelRemainingSec = 0
        } else {
          const travelElapsed = withinStop - BUS_DWELL_SEC
          travelRemainingSec = Math.max(0, BUS_TRAVEL_SEC - travelElapsed)
          dwellRemainingSec = 0
        }
      }

      return {
        id,
        state,
        autoEnabled,
        isRunning,
        progress,
        remainingSec,
        remainingText: formatRemainingText(remainingSec, isRunning),
        routeName,
        isUnlocking,
        unlockProgress,
        unlockRemainingSec,
        unlockRemainingText: formatUnlockRemainingText(unlockRemainingSec),
        currentStopIndex,
        inDwell,
        dwellRemainingSec,
        travelRemainingSec,
      }
    })

    result[type] = slots
  }

  return result
})

function setActiveMenu(key) {
  if (!transportTypes.includes(key)) return
  activeMenu.value = key
}

// 운송수단 해금
function unlockTransport(type) {
  if (!transportTypes.includes(type)) return
  if (unlockedTransports.value.includes(type)) return

  const cfg = transportConfigMap[type]
  const isFreeStarter = cfg?.isStarter && !hasAnyStarterUnlocked.value

  if (!isFreeStarter) {
    const cost = getTransportUnlockCost(type)
    if (idleFunds.value < cost) return
    idleFunds.value -= cost
  }

  unlockedTransports.value = [...unlockedTransports.value, type]
}

/**
 * 버스 운행 시작 공통 로직
 * - 시작 시점에 1번 정류장을 바로 처리(승·하차 + 수익)
 */
function createInitialBusRunMeta(nowMs) {
  const state = villageBusState.value
  const stops =
    state.stopsPerLoop || VILLAGE_BUS_BASE_CONFIG.baseStopsPerLoop
  const durationSec = stops * BUS_CYCLE_SEC

  const meta = {
    startedAtMs: nowMs,
    durationSec,
    stopsProcessed: 0,
  }

  const income = simulateVillageBusStops(1)
  meta.stopsProcessed = 1

  return { meta, income }
}

/**
 * 슬롯 수동 운행 시작
 */
function handleClickRunSlot(type, id) {
  if (!transportTypes.includes(type)) return
  if (!unlockedTransports.value.includes(type)) return

  const key = slotKey(type, id)
  const meta = slotRunMeta.value[key]
  if (meta) return

  const nowMs = getGameTimeMs()
  const nextMeta = { ...slotRunMeta.value }

  if (type === 'bus') {
    const { meta: busMeta, income } = createInitialBusRunMeta(nowMs)
    nextMeta[key] = busMeta
    slotRunMeta.value = nextMeta
    if (income > 0) idleFunds.value += income
    return
  }

  const durationSec = getRunDurationSec(type)
  nextMeta[key] = {
    startedAtMs: nowMs,
    durationSec,
  }
  slotRunMeta.value = nextMeta
}

/**
 * 슬롯 자동 운행 활성화
 */
function handleToggleAuto(type, id) {
  if (!transportTypes.includes(type)) return
  if (!unlockedTransports.value.includes(type)) return

  const key = slotKey(type, id)
  const current = !!slotAutomation.value[key]
  if (current) return

  const cost = getAutoRunCost(type)
  if (idleFunds.value < cost) return
  idleFunds.value -= cost

  const nextAuto = { ...slotAutomation.value, [key]: true }

  // 자동 해금 시 현재 운행 중이 아니면 즉시 1회 운행 시작
  if (!slotRunMeta.value[key]) {
    const nowMs = getGameTimeMs()
    const nextMeta = { ...slotRunMeta.value }

    if (type === 'bus') {
      const { meta: busMeta, income } = createInitialBusRunMeta(nowMs)
      nextMeta[key] = busMeta
      slotRunMeta.value = nextMeta
      if (income > 0) idleFunds.value += income
    } else {
      const durationSec = getRunDurationSec(type)
      nextMeta[key] = {
        startedAtMs: nowMs,
        durationSec,
      }
      slotRunMeta.value = nextMeta
    }
  }

  slotAutomation.value = nextAuto
}

/**
 * 빈 슬롯 활성화 준비 시작
 */
function handleClickActivateEmptySlot(type, id) {
  if (!transportTypes.includes(type)) return
  if (!unlockedTransports.value.includes(type)) return
  if (id === 1) return

  const key = slotKey(type, id)

  if (slotActiveFlag.value[key]) return
  if (slotUnlockMeta.value[key]) return

  const cost = getSlotActivationCost(type)
  if (idleFunds.value < cost) return
  idleFunds.value -= cost

  const nowMs = getGameTimeMs()

  slotUnlockMeta.value = {
    ...slotUnlockMeta.value,
    [key]: {
      startedAtMs: nowMs,
      durationSec: SLOT_UNLOCK_DURATION_SEC,
    },
  }
}

/**
 * 활성 슬롯 삭제
 */
function handleDeleteActiveSlot(type, id) {
  if (!transportTypes.includes(type)) return
  if (!unlockedTransports.value.includes(type)) return
  if (id === 1) return

  const key = slotKey(type, id)

  const nextActiveFlag = { ...slotActiveFlag.value }
  const nextAutomation = { ...slotAutomation.value }
  const nextRunMeta = { ...slotRunMeta.value }
  const nextUnlockMeta = { ...slotUnlockMeta.value }

  delete nextActiveFlag[key]
  delete nextAutomation[key]
  delete nextRunMeta[key]
  delete nextUnlockMeta[key]

  slotActiveFlag.value = nextActiveFlag
  slotAutomation.value = nextAutomation
  slotRunMeta.value = nextRunMeta
  slotUnlockMeta.value = nextUnlockMeta
}

// 버스 연구 버튼 클릭 (연구 완료만 표시, 실제 적용은 노선 조정 버튼으로)
function handleClickBusResearch(key) {
  const cfg = VILLAGE_BUS_RESEARCH_CATALOG[key]
  if (!cfg) return

  const research = { ...villageBusState.value.research }

  if (key === 'capacityUpgrade' && research.capacityUpgradeDone) return
  if (key === 'lineExtension' && research.lineExtensionDone) return
  if (key === 'peakRush' && research.peakRushDone) return

  if (idleFunds.value < cfg.cost) return

  idleFunds.value -= cfg.cost

  if (key === 'capacityUpgrade') research.capacityUpgradeDone = true
  if (key === 'lineExtension') research.lineExtensionDone = true
  if (key === 'peakRush') research.peakRushDone = true

  villageBusState.value = {
    ...villageBusState.value,
    research,
  }
}

/**
 * 버스 교체 / 노선 조정 시작
 * - 이미 연구 끝난 설정을 실제 라인에 반영하기 위한 준비 시간
 */
function handleStartBusReconfig() {
  if (!busHasUnappliedUpgrade.value) return
  if (busReconfigMeta.value) return

  const nowMs = getGameTimeMs()
  busReconfigMeta.value = {
    startedAtMs: nowMs,
    durationSec: BUS_RECONFIG_SEC,
  }
}

/**
 * 게임 시간 흐름
 */
watch(
  gameTime,
  () => {
    const nowMs = getGameTimeMs()

    let currentRunMeta = { ...slotRunMeta.value }
    let totalIncome = 0

    // 운행 완료/진행 처리
    for (const [key, meta] of Object.entries(currentRunMeta)) {
      const elapsedSec = Math.max(0, (nowMs - meta.startedAtMs) / 1000)
      const [type] = key.split('-')

      if (type === 'bus') {
        const state = villageBusState.value
        const totalStops =
          state.stopsPerLoop || VILLAGE_BUS_BASE_CONFIG.baseStopsPerLoop
        const durationSec =
          meta.durationSec || totalStops * BUS_CYCLE_SEC

        const alreadyProcessed = meta.stopsProcessed || 0
        const shouldProcessed = Math.min(
          totalStops,
          Math.floor(elapsedSec / BUS_CYCLE_SEC) + 1,
        )

        const newStops = shouldProcessed - alreadyProcessed

        if (newStops > 0) {
          const income = simulateVillageBusStops(newStops)
          totalIncome += income
          meta.stopsProcessed = shouldProcessed
        }

        if (elapsedSec >= durationSec) {
          const isAuto = !!slotAutomation.value[key]
          if (isAuto) {
            // 다음 루프 자동 시작 (새 루프의 1번 정류장 처리)
            const { meta: busMeta, income } = createInitialBusRunMeta(
              nowMs,
            )
            currentRunMeta[key] = busMeta
            totalIncome += income
          } else {
            delete currentRunMeta[key]
          }
        } else {
          currentRunMeta[key] = meta
        }

        continue
      }

      // 버스 외 운송수단
      const durationSec = meta.durationSec || DEFAULT_RUN_DURATION_SEC

      if (elapsedSec >= durationSec) {
        const cfg = transportConfigMap[type]
        const income = cfg?.baseIncomePerSlot || 0
        totalIncome += income

        const isAuto = !!slotAutomation.value[key]

        if (isAuto) {
          currentRunMeta[key] = {
            startedAtMs: nowMs,
            durationSec,
          }
        } else {
          delete currentRunMeta[key]
        }
      }
    }

    // 버스 교체 / 노선 조정 진행
    if (busReconfigMeta.value) {
      const info = busReconfigMeta.value
      const elapsedReconfig = Math.max(
        0,
        (nowMs - info.startedAtMs) / 1000,
      )
      const durationReconfig = info.durationSec || BUS_RECONFIG_SEC

      if (elapsedReconfig >= durationReconfig) {
        // 연구 결과를 실제 라인 구성에 적용
        applyVillageBusResearchToState()
        busReconfigMeta.value = null
      }
    }

    slotRunMeta.value = currentRunMeta

    if (totalIncome > 0) {
      idleFunds.value += totalIncome
    }

    // 슬롯 활성화 준비 완료 처리
    const currentUnlockMeta = { ...slotUnlockMeta.value }
    const nextActiveFlag = { ...slotActiveFlag.value }

    for (const [key, info] of Object.entries(currentUnlockMeta)) {
      const elapsedSec = Math.max(0, (nowMs - info.startedAtMs) / 1000)
      const durationSec = info.durationSec || SLOT_UNLOCK_DURATION_SEC

      if (elapsedSec >= durationSec) {
        nextActiveFlag[key] = true
        delete currentUnlockMeta[key]
      }
    }

    slotUnlockMeta.value = currentUnlockMeta
    slotActiveFlag.value = nextActiveFlag
  },
  { flush: 'sync' },
)
</script>

<style scoped>
.idle-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  box-sizing: border-box;
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
  min-height: 100vh;

  background: var(--main-bg-color, transparent);
  color: var(--text-color, #fff);

  overflow-y: auto;
  scrollbar-width: none;
}

.idle-page::-webkit-scrollbar {
  width: 0;
  height: 0;
}

.idle-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.idle-header-top {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.idle-header-main {
  display: flex;
  flex-direction: column;
}

.idle-title {
  font-size: 1.7rem;
  font-weight: 700;
}

.idle-header-controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control-block {
  padding: 8px 10px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.28);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.control-label {
  font-size: 0.8rem;
  opacity: 0.9;
}

.time-value {
  font-size: 1.1rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
}

.control-transport {
  gap: 6px;
}

.transport-menu {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.transport-button {
  padding: 5px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(0, 0, 0, 0.45);
  font-size: 0.8rem;
  cursor: pointer;
  color: inherit;
}

.transport-button:hover {
  background: rgba(255, 255, 255, 0.06);
}

.transport-button.active {
  background: rgba(255, 255, 255, 0.18);
  border-color: rgba(255, 255, 255, 0.5);
}

.control-funds {
  gap: 4px;
}

.funds-value {
  font-size: 1.05rem;
  font-weight: 600;
}

.panel {
  background: rgba(0, 0, 0, 0.25);
  border-radius: 12px;
  padding: 12px;
  box-sizing: border-box;
  overflow: hidden;
}

.panel-title {
  font-size: 1.05rem;
  font-weight: 600;
  margin-bottom: 8px;
}

.panel-desc {
  font-size: 0.8rem;
  opacity: 0.8;
  margin-bottom: 4px;
}

.panel-cost-hint {
  font-size: 0.78rem;
  opacity: 0.82;
  margin-bottom: 10px;
}

.panel-transport {
  margin-top: 4px;
}

.panel-research {
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.research-title {
  font-size: 0.95rem;
  font-weight: 600;
}

.research-desc {
  font-size: 0.8rem;
  opacity: 0.82;
}

.research-list {
  list-style: none;
  padding: 0;
  margin: 6px 0 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.research-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  border-radius: 10px;
  padding: 8px 10px;
  background: rgba(10, 20, 40, 0.55);
  border: 1px solid rgba(130, 180, 255, 0.5);
}

.research-item-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.research-item-title {
  font-size: 0.85rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.research-badge.done {
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 999px;
  background: rgba(0, 200, 140, 0.18);
  border: 1px solid rgba(0, 200, 140, 0.8);
}

.research-item-desc {
  font-size: 0.78rem;
  opacity: 0.86;
}

.research-item-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 0.76rem;
  opacity: 0.85;
}

.research-meta-line {
  white-space: nowrap;
}

.research-item-button {
  align-self: flex-start;
  margin-top: 2px;
  padding: 5px 11px;
  border-radius: 999px;
  border: 1px solid rgba(130, 180, 255, 0.9);
  background: rgba(130, 180, 255, 0.18);
  color: inherit;
  font-size: 0.78rem;
  cursor: pointer;
}

.research-item-button[disabled] {
  opacity: 0.55;
  cursor: default;
  border-color: rgba(180, 180, 180, 0.7);
  background: rgba(180, 180, 180, 0.16);
}

.research-item-button:not([disabled]):hover {
  background: rgba(130, 180, 255, 0.28);
}

.research-button {
  align-self: flex-start;
  margin-top: 2px;
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid rgba(130, 180, 255, 0.9);
  background: rgba(130, 180, 255, 0.18);
  color: inherit;
  font-size: 0.8rem;
  cursor: pointer;
}

.research-button[disabled] {
  opacity: 0.5;
  cursor: default;
  border-color: rgba(180, 180, 180, 0.7);
  background: rgba(180, 180, 180, 0.16);
}

.research-button:not([disabled]):hover {
  background: rgba(130, 180, 255, 0.28);
}

.research-hint {
  font-size: 0.75rem;
  opacity: 0.7;
}

/* 버스 구성/노선 조정 패널 */
.bus-config-panel {
  margin-top: 6px;
  padding: 8px 10px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(130, 180, 255, 0.5);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.bus-config-line {
  font-size: 0.78rem;
  opacity: 0.9;
}

.bus-config-actions {
  margin-top: 4px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.bus-config-button {
  align-self: flex-start;
  padding: 5px 11px;
  border-radius: 999px;
  border: 1px solid rgba(0, 200, 140, 0.8);
  background: rgba(0, 200, 140, 0.18);
  color: inherit;
  font-size: 0.78rem;
  cursor: pointer;
}

.bus-config-button[disabled] {
  opacity: 0.55;
  cursor: default;
}

.bus-config-button:not([disabled]):hover {
  background: rgba(0, 200, 140, 0.28);
}

.bus-config-hint {
  margin-top: 2px;
  font-size: 0.74rem;
  opacity: 0.8;
}

.bus-config-hint-small {
  font-size: 0.72rem;
  opacity: 0.78;
}

.slot-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.slot-card {
  width: 100%;
  padding: 8px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
  font-size: 0.8rem;
  display: flex;
  flex-direction: column;
  gap: 4px;
  border: 1px solid transparent;
}

.slot-card[data-state='active'] {
  border-color: rgba(0, 200, 140, 0.7);
  background: rgba(0, 200, 140, 0.14);
}

.slot-card[data-state='empty'] {
  border-color: rgba(255, 255, 255, 0.18);
}

.slot-card[data-state='unlocking'] {
  border-color: rgba(130, 180, 255, 0.8);
  background: rgba(130, 180, 255, 0.08);
}

.slot-card[data-state='locked'] {
  border-color: rgba(180, 180, 180, 0.3);
  background: rgba(255, 255, 255, 0.02);
  opacity: 0.9;
}

.slot-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.slot-index {
  font-weight: 600;
}

.slot-state {
  font-size: 0.75rem;
  opacity: 0.9;
}

.slot-route {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
}

.slot-route-name {
  font-size: 0.8rem;
  font-weight: 600;
}

.slot-timer {
  font-size: 0.75rem;
  opacity: 0.9;
}

.slot-progress {
  margin-top: 4px;
}

.slot-progress-bar {
  position: relative;
  width: 100%;
  height: 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

.slot-progress-fill {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  border-radius: 999px;
  background: rgba(0, 200, 140, 0.9);
  width: 0%;
  transition: width 0.9s linear;
}

.slot-mini-move {
  margin-top: 2px;
}

.slot-mini-text {
  font-size: 0.74rem;
  opacity: 0.86;
}

.slot-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}

.slot-action-button {
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid rgba(0, 200, 140, 0.8);
  background: rgba(0, 200, 140, 0.18);
  font-size: 0.75rem;
  cursor: pointer;
  color: inherit;
}

.slot-action-button[disabled] {
  opacity: 0.6;
  cursor: default;
}

.slot-action-button:not([disabled]):hover {
  background: rgba(0, 200, 140, 0.28);
}

.slot-action-button.secondary {
  border-color: rgba(130, 180, 255, 0.9);
  background: rgba(130, 180, 255, 0.16);
}

.slot-action-button.danger {
  border-color: rgba(255, 120, 120, 0.9);
  background: rgba(255, 120, 120, 0.14);
}

.slot-action-button.danger:hover {
  background: rgba(255, 120, 120, 0.22);
}

.btn-cost {
  margin-left: 4px;
  font-size: 0.7rem;
  opacity: 0.9;
}

.slot-unlock {
  margin-top: 4px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.slot-unlock-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.slot-unlock-label {
  font-size: 0.75rem;
  opacity: 0.9;
}

.slot-unlock-timer {
  font-size: 0.75rem;
  opacity: 0.9;
}

.slot-unlock-bar {
  position: relative;
  width: 100%;
  height: 5px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.09);
  overflow: hidden;
}

.slot-unlock-fill {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  border-radius: 999px;
  background: rgba(130, 180, 255, 0.9);
  width: 0%;
  transition: width 0.9s linear;
}

.slot-desc {
  font-size: 0.75rem;
  opacity: 0.82;
  margin-top: 4px;
}

.slot-locked-panel {
  padding: 14px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px dashed rgba(255, 255, 255, 0.3);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.slot-locked-title {
  font-size: 0.95rem;
  font-weight: 600;
}

.slot-locked-desc {
  font-size: 0.8rem;
  opacity: 0.85;
}

.unlock-button {
  align-self: flex-start;
  margin-top: 2px;
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid rgba(0, 200, 140, 0.8);
  background: rgba(0, 200, 140, 0.18);
  color: inherit;
  font-size: 0.8rem;
}

.unlock-button[disabled] {
  opacity: 0.5;
  cursor: default;
}

.unlock-button:hover:not([disabled]) {
  background: rgba(0, 200, 140, 0.28);
}

.slot-locked-hint {
  font-size: 0.75rem;
  opacity: 0.7;
}

@media (min-width: 768px) {
  .idle-page {
    gap: 18px;
    padding: 20px;
    max-width: 1024px;
  }

  .idle-header-top {
    flex-direction: row;
    align-items: flex-end;
    justify-content: space-between;
  }

  .idle-header-controls {
    flex-direction: row;
  }

  .control-block {
    flex: 1 1 0;
  }
}

@media (min-width: 1024px) {
  .idle-page {
    padding: 24px;
    max-width: 1120px;
  }

  .idle-title {
    font-size: 1.9rem;
  }
}
</style>
