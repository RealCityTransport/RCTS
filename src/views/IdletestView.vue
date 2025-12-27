<!-- src/views/IdletestView.vue -->
<template>
  <div class="idle-page">
    <!-- 상단 헤더 -->
    <header class="idle-header">
      <div class="idle-header-top">
        <div class="idle-header-main">
          <h1 class="idle-title">RCTS-테스트환경임.</h1>
        </div>

        <!-- 환경 선택 허브 링크 + 로그인/저장 영역 -->
        <div class="idle-header-actions">
          <RouterLink
            to="/entry-connector"
            class="env-link"
          >
            환경 선택 허브로 이동
          </RouterLink>

          <div class="login-inline">
            <!-- 로그인 전 -->
            <template v-if="!isLoggedIn">
              <button
                type="button"
                class="login-button"
                @click="handleLogin"
              >
                로그인
              </button>
            </template>

            <!-- 로그인 후 -->
            <template v-else>
              <span class="login-user">
                테스트 계정 접속 중
              </span>
              <button
                type="button"
                class="login-logout"
                @click="handleLogout"
              >
                로그아웃
              </button>
            </template>
          </div>

          <!-- 수동 저장 버튼 (로그인 + 리더 전용) -->
          <button
            v-if="isLoggedIn"
            type="button"
            class="manual-save-button"
            :disabled="!isLeader"
            @click="handleManualSave"
          >
            상태 저장
          </button>

          <!-- 기존 데이터 삭제 버튼 (로그인 + 리더 전용) -->
          <button
            v-if="isLoggedIn"
            type="button"
            class="manual-reset-button"
            :disabled="!isLeader"
            @click="handleResetIdleState"
          >
            기존 데이터 삭제
          </button>
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
                :disabled="item.done || idleFunds < item.cost || !isLeader"
                @click="handleClickBusResearch(item.key)"
              >
                <template v-if="item.done">
                  연구 완료
                </template>
                <template v-else-if="idleFunds < item.cost">
                  자금 부족
                </template>
                <template v-else-if="!isLeader">
                  리더 기기에서만 가능
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
              {{ busUniqueStops }}개 (왕복 기준)
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
                :disabled="!!busReconfigMeta || !isLeader"
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

            <!-- 버스일 때: 정류장 N개 + 물방울(왕복) 트랙 + 상태 텍스트 -->
            <div
              v-if="slot.state === 'active' && activeMenu === 'bus'"
              class="slot-mini-move"
            >
              <!-- 정류장 점 + 선 + 물방울 -->
              <div class="slot-stop-track">
                <div class="slot-stop-line">
                  <div
                    v-for="n in busUniqueStops"
                    :key="n"
                    class="slot-stop-node"
                    :class="{
                      active: n === slot.currentStopIndex && slot.inDwell,
                    }"
                    :style="{
                      left:
                        busUniqueStops > 1
                          ? ((n - 1) / (busUniqueStops - 1)) * 100 + '%'
                          : '50%',
                    }"
                  />
                  <div
                    class="slot-stop-droplet"
                    :style="{
                      left:
                        busUniqueStops > 1
                          ? (slot.trackPositionRatio * 100).toFixed(2) + '%'
                          : '50%',
                    }"
                  />
                </div>
                <div class="slot-stop-meta">
                  <span class="slot-stop-route-label">
                    마을버스 왕복 노선
                  </span>
                  <span class="slot-stop-index">
                    정류장 {{ busUniqueStops }}개
                  </span>
                </div>
              </div>

              <!-- 정류장/이동 텍스트 -->
              <template v-if="slot.currentStopIndex > 0">
                <!-- 정차 시간 -->
                <span
                  v-if="slot.inDwell"
                  class="slot-mini-text"
                >
                  정류장 정차
                  {{ formatPhaseRemaining(slot.dwellRemainingSec) }} 남음 ·
                  승차 {{ busLastStopInfo.board }}명 ·
                  하차 {{ busLastStopInfo.deboard }}명 ·
                  탑승
                  {{ busLastStopInfo.passengers }}/{{ busLastStopInfo.capacity }}명
                </span>

                <!-- 이동 시간 -->
                <span
                  v-else
                  class="slot-mini-text"
                >
                  이동중
                  {{ formatPhaseRemaining(slot.travelRemainingSec) }} 남음 ·
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
                  :disabled="!isLeader"
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
                  :disabled="slot.isRunning || !isLeader"
                  @click="handleClickRunSlot(activeMenu, slot.id)"
                >
                  <template v-if="!isLeader">
                    리더 기기에서만 가능
                  </template>
                  <template v-else>
                    {{ slot.isRunning ? '운행 중...' : '수동 운행 시작' }}
                  </template>
                </button>

                <button
                  type="button"
                  class="slot-action-button secondary"
                  :disabled="!canAffordAutoRun || !isLeader"
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
                  :disabled="!isLeader"
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
                :disabled="!canAffordSlotActivation || !isLeader"
                @click="handleClickActivateEmptySlot(activeMenu, slot.id)"
              >
                <template v-if="!isLeader">
                  리더 기기에서만 가능
                </template>
                <template v-else>
                  슬롯 활성화 준비 시작
                  <span class="btn-cost">
                    (₩ {{ getSlotActivationCost(activeMenu).toLocaleString('ko-KR') }})
                  </span>
                </template>
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
                  1번 정류장에서 {{ busUniqueStops }}번 정류장까지 갔다가,
                  다시 1번 정류장으로 돌아오는 왕복 1루프를 반복 운행합니다.
                  각 정류장에서 30초 동안 승·하차를 처리하고 수익을 정산한 뒤,
                  5분 동안 다음 정류장으로 이동합니다.
                </template>
                <template v-else>
                  수동으로 운행을 시작해야 수익이 발생하는 슬롯입니다.
                  [수동 운행 시작] 버튼을 누르면 1번 정류장에서 출발해
                  {{ busUniqueStops }}번 정류장까지 이동한 뒤, 다시 1번 정류장으로 돌아오는
                  왕복 운행을 1루프로 처리합니다.
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
            :disabled="!canAffordTransportUnlock || !isLeader"
            @click="unlockTransport(activeMenu)"
          >
            <template v-if="!isLeader">
              리더 기기에서만 가능
            </template>
            <template v-else-if="isCurrentStarterFree">
              {{ currentTransportLabel }} 무상 해금
            </template>
            <template v-else>
              {{ currentTransportLabel }} 해금
            </template>

            <span
              class="btn-cost"
              v-if="!isCurrentStarterFree && isLeader"
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
import { RouterLink } from 'vue-router'
import { useIdletestView } from '@/features/idle/pages/useIdletestView'

const {
  // 리더 여부 + 수동 저장 + 리셋
  isLeader,
  handleManualSave,
  handleResetIdleState,

  // 시간/자금/로그인
  formattedGameTime,
  idleFunds,
  formattedIdleFunds,
  isLoggedIn,
  handleLogin,
  handleLogout,

  // 운송수단/해금
  transportConfigs,
  activeMenu,
  setActiveMenu,
  currentTransportLabel,
  currentSlotCount,
  isCurrentTransportUnlocked,
  isCurrentStarterFree,
  currentUnlockStage,
  currentTransportUnlockCost,
  currentResearchDescription,
  canAffordSlotActivation,
  canAffordAutoRun,
  canAffordTransportUnlock,
  getSlotActivationCost,
  getAutoRunCost,
  unlockTransport,

  // 버스 관련
  villageBusState,
  busLastStopInfo,
  busUniqueStops,
  busResearchList,
  busHasUnappliedUpgrade,
  BUS_RECONFIG_SEC,
  busReconfigMeta,
  formatPhaseRemaining,
  handleClickBusResearch,
  handleStartBusReconfig,

  // 슬롯/운행
  transportSlots,
  handleClickRunSlot,
  handleToggleAuto,
  handleClickActivateEmptySlot,
  handleDeleteActiveSlot,
} = useIdletestView()
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

.idle-header-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

/* 환경 선택 허브 링크 스타일 */
.env-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 5px 12px;
  border-radius: 999px;
  border: 1px solid rgba(129, 140, 248, 0.9);
  background: rgba(15, 23, 42, 0.9);
  font-size: 0.78rem;
  text-decoration: none;
  color: #e5e7eb;
  letter-spacing: 0.04em;
  cursor: pointer;
  white-space: nowrap;
}

.env-link:hover {
  background: rgba(129, 140, 248, 0.16);
  box-shadow: 0 0 12px rgba(129, 140, 248, 0.7);
}

/* 로그인 영역 */
.login-inline {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(148, 163, 184, 0.8);
  font-size: 0.78rem;
}

.login-button,
.login-logout {
  padding: 3px 10px;
  border-radius: 999px;
  border: 1px solid rgba(96, 165, 250, 0.9);
  background: rgba(37, 99, 235, 0.24);
  color: #e5e7eb;
  font-size: 0.76rem;
  cursor: pointer;
  white-space: nowrap;
}

.login-button[disabled] {
  opacity: 0.4;
  cursor: default;
}

.login-button:not([disabled]):hover,
.login-logout:hover {
  background: rgba(59, 130, 246, 0.36);
}

.login-logout {
  border-color: rgba(248, 250, 252, 0.9);
  background: rgba(15, 23, 42, 0.9);
}

.login-user {
  font-size: 0.78rem;
  color: #e5e7eb;
  white-space: nowrap;
}

/* 수동 저장 버튼 */
.manual-save-button {
  padding: 4px 12px;
  border-radius: 999px;
  border: 1px solid rgba(34, 197, 94, 0.9);
  background: rgba(22, 101, 52, 0.85);
  color: #e5e7eb;
  font-size: 0.78rem;
  cursor: pointer;
  white-space: nowrap;
}

.manual-save-button[disabled] {
  opacity: 0.4;
  cursor: default;
  border-color: rgba(148, 163, 184, 0.8);
  background: rgba(30, 41, 59, 0.9);
}

.manual-save-button:not([disabled]):hover {
  background: rgba(22, 163, 74, 0.9);
}

/* 기존 데이터 삭제 버튼 */
.manual-reset-button {
  padding: 4px 12px;
  border-radius: 999px;
  border: 1px solid rgba(248, 113, 113, 0.95);
  background: rgba(127, 29, 29, 0.9);
  color: #fee2e2;
  font-size: 0.78rem;
  cursor: pointer;
  white-space: nowrap;
}

.manual-reset-button[disabled] {
  opacity: 0.4;
  cursor: default;
  border-color: rgba(148, 163, 184, 0.8);
  background: rgba(30, 41, 59, 0.9);
}

.manual-reset-button:not([disabled]):hover {
  background: rgba(185, 28, 28, 0.95);
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

/* 버스 정류장 트랙 (선 + 점 + 물방울) */
.slot-mini-move {
  margin-top: 2px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.slot-stop-track {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.slot-stop-line {
  position: relative;
  display: block;
  margin-top: 4px;
  min-height: 22px;
}

/* 선 (정류장 연결 라인) */
.slot-stop-line::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 2px;
  transform: translateY(-50%);
  background: linear-gradient(
    to right,
    rgba(148, 163, 184, 0.3),
    rgba(148, 163, 184, 0.7),
    rgba(148, 163, 184, 0.3)
  );
  pointer-events: none;
  z-index: 0;
}

/* 정류장 점: 선 위에 정확한 위치로 배치 */
.slot-stop-node {
  position: absolute;
  top: 50%;
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.6);
  transform: translate(-50%, -50%);
  z-index: 1;
  transition:
    transform 0.16s ease-out,
    background-color 0.16s ease-out,
    box-shadow 0.16s ease-out;
}

.slot-stop-node.active {
  background: rgba(96, 165, 250, 1);
  box-shadow: 0 0 6px rgba(96, 165, 250, 0.9);
  transform: translate(-50%, -50%) scale(1.4);
}

/* 물방울 (현재 위치) – 점과 정확히 같은 레일을 따라 이동 */
.slot-stop-droplet {
  position: absolute;
  top: calc(50% - 5px); /* 전체 위치 위로 5px */
  width: 18px;
  height: 18px;
  border-radius: 999px;
  border: 2px solid rgba(96, 165, 250, 0.9);
  background: radial-gradient(
    circle at 30% 30%,
    rgba(191, 219, 254, 1),
    rgba(37, 99, 235, 0.5)
  );
  transform: translate(-50%, -90%);
  transition:
    left 0.18s linear,
    transform 0.18s ease-out;
  box-shadow: 0 0 8px rgba(37, 99, 235, 0.9);
  z-index: 2;
}

/* 물방울 끝 삼각형 – 아래 선 쪽을 향하도록 */
.slot-stop-droplet::before {
  content: '';
  position: absolute;
  left: 50%;
  bottom: -6px;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 8px solid rgba(37, 99, 235, 0.95);
}

/* 안쪽 하이라이트 */
.slot-stop-droplet::after {
  content: '';
  position: absolute;
  inset: 3px;
  border-radius: inherit;
  background: radial-gradient(
    circle at 30% 30%,
    rgba(248, 250, 252, 0.95),
    rgba(191, 219, 254, 0.2)
  );
  opacity: 0.9;
}

/* 메타 정보 */
.slot-stop-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.72rem;
  opacity: 0.85;
  margin-top: 2px;
}

.slot-stop-route-label {
  font-weight: 600;
}

.slot-stop-index {
  font-variant-numeric: tabular-nums;
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

  .idle-header-actions {
    justify-content: flex-end;
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
