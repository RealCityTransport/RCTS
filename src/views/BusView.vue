<!--
  파일 주소:
  src/views/BusView.vue

  적용 내용:
  - 버스 메뉴 실제 작동 페이지
  - 상단 버스 운영 센터 우측 공간에 차량구입 / 진행작업 / 운행방식을 가로 배치
  - 차량구입 버튼은 운행 슬롯 위쪽에서 항상 보이도록 배치
  - 슬롯 1개 = 차량 1대
  - 운행 슬롯은 남은 시간이 적은 순서대로 자동 정렬
  - 슬롯 클릭 시 해당 슬롯 바로 아래에 수정 확장 행 표시
  - 기본 select 대신 어두운 커스텀 드롭다운 사용
  - 차량명 수정 가능
  - 노선번호 / 노선명 수정 가능
  - 운행 중 변경은 즉시 적용하지 않고 귀환 후 적용 예약
  - 스타터 차량 포함 모든 차량 판매 가능
  - 노선 해금은 해당 노선 운행시간과 동일한 시간이 지난 뒤 완료
  - 자동 배차 연구는 24시간 후 완료
  - 연구/해금 작업은 한 번에 1개만 진행 가능
  - 수동 출발 기본
  - 자동운행은 자동 배차 연구 완료 후 가능

  연결된 파일:
  - src/router/index.js
  - src/modules/bus.js
  - src/modules/finance.js
  - src/modules/gameState.js
  - src/App.vue

  수정 시 주의:
  - 자금은 직접 수정하지 않음
  - 수익 발생은 bus.js → finance.js addIncome() 흐름으로 처리
-->

<template>
  <main class="bus-page">
    <section class="bus-hero panel">
      <div class="hero-main">
        <p>BUS OPERATION</p>
        <h1>버스 운영 센터</h1>
        <span>
          슬롯은 남은 시간이 적은 차량부터 위로 정렬됩니다. 정산은 정류장 출발/도착마다 자동 발생합니다.
        </span>
      </div>

      <aside class="hero-side">
        <div class="hero-buy">
          <div class="hero-box-title">
            <strong>차량구입</strong>
            <span>구매 시 슬롯 자동 추가</span>
          </div>

          <div class="hero-buy-list">
            <button
              v-for="vehicle in vehicleCatalogList"
              :key="vehicle.key"
              type="button"
              class="hero-buy-button"
              @click="handleBuyVehicle(vehicle.key)"
            >
              <strong>{{ vehicle.label }}</strong>
              <span>{{ vehicle.capacity }}명 · {{ formatMoney(vehicle.price) }}</span>
            </button>
          </div>
        </div>

        <div class="hero-job">
          <div class="hero-box-title">
            <strong>진행작업</strong>
            <span v-if="safeSummary.activeJob">
              {{ safeSummary.activeJob.label }}
            </span>
            <span v-else>
              진행 중 없음
            </span>
          </div>

          <b v-if="safeSummary.activeJob">
            {{ safeSummary.activeJob.remainingText }}
          </b>
          <small v-else>
            연구/해금 대기
          </small>
        </div>

        <div class="hero-status">
          <div class="hero-box-title">
            <strong>운행방식</strong>
            <span>{{ busState.message || '버스 모듈 준비 중' }}</span>
          </div>

          <b>{{ safeSummary.autoDispatchUnlocked ? '자동운행 가능' : '수동운행' }}</b>
          <small>연구/해금은 1개씩 진행</small>
        </div>
      </aside>
    </section>

    <section class="kpi-grid">
      <article class="kpi-card highlight">
        <span>운행중</span>
        <strong>{{ safeSummary.runningSlots }} / {{ safeSummary.totalSlots }}</strong>
        <small>현재 출발한 차량</small>
      </article>

      <article class="kpi-card">
        <span>대기중</span>
        <strong>{{ safeSummary.waitingSlots }}대</strong>
        <small>출발 대기 차량</small>
      </article>

      <article class="kpi-card">
        <span>변경예약</span>
        <strong>{{ safeSummary.pendingSlots }}대</strong>
        <small>귀환 후 적용</small>
      </article>

      <article class="kpi-card income">
        <span>시간당 예상</span>
        <strong>{{ formatMoney(safeSummary.hourlyRevenue) }}</strong>
        <small>현재 배정 기준</small>
      </article>
    </section>

    <section class="panel operation-panel">
      <div class="section-head">
        <div>
          <p>LIVE SLOTS</p>
          <h2>운행 슬롯</h2>
        </div>

        <span class="head-note">남은 시간이 적은 차량이 위로 올라옵니다.</span>
      </div>

      <div class="slot-head">
        <span>차량</span>
        <span>구분</span>
        <span>노선</span>
        <span>상태</span>
        <span>진행</span>
        <span>최근 결과</span>
        <span>조작</span>
      </div>

      <div class="slot-list">
        <template
          v-for="slot in safeBusSlots"
          :key="slot.id"
        >
          <article
            class="slot-row"
            :class="{ selected: selectedSlotId === slot.id, pending: slot.hasPending }"
            @click="selectSlot(slot.id)"
          >
            <div class="slot-cell vehicle-cell">
              <small>{{ slot.id }}</small>
              <strong>{{ slot.vehicle }}</strong>
            </div>

            <div class="slot-cell">
              <small>차량 구분</small>
              <strong>{{ slot.categoryLabel }}</strong>
            </div>

            <div class="slot-cell">
              <small>배정 노선</small>
              <strong>{{ slot.route }}</strong>
            </div>

            <div class="slot-cell">
              <small>{{ slot.statusText }}</small>
              <strong>
                <span :class="['status-dot', slot.status === 'running' ? 'running' : 'idle']"></span>
                {{ slot.statusLabel }}
              </strong>
            </div>

            <div class="slot-cell progress-cell">
              <div class="progress-info">
                <span>{{ slot.progress }}%</span>
                <span>다음 정류장 {{ slot.nextStopText || '-' }}</span>
              </div>

              <div class="progress-bar">
                <div :style="{ width: `${slot.progress}%` }"></div>
              </div>

              <div class="progress-sub">
                전체 남은 시간 {{ slot.remaining }}
              </div>
            </div>

            <div class="slot-cell">
              <small>{{ slot.lastStopLabel || '정류장 정산 대기' }} · 승객 {{ slot.lastPassengerCount }}명</small>
              <strong class="money">{{ formatMoney(slot.lastSettlementAmount) }}</strong>
            </div>

            <div class="slot-actions" @click.stop>
              <button
                type="button"
                :disabled="slot.status === 'running'"
                @click="handleStart(slot.id)"
              >
                출발
              </button>

              <button
                type="button"
                :class="{ active: selectedSlotId === slot.id }"
                @click="selectSlot(slot.id)"
              >
                수정
              </button>
            </div>
          </article>

          <article
            v-if="selectedSlotId === slot.id"
            class="slot-edit-row"
          >
            <div class="edit-grid">
              <section class="edit-box">
                <h3>차량 수정</h3>

                <label>
                  <span>차량 이름</span>
                  <div class="inline-form">
                    <input v-model="vehicleNameDraft" type="text" />
                    <button type="button" @click="handleRenameVehicle">저장</button>
                  </div>
                </label>

                <div class="mini-info">
                  {{ isSelectedRunning ? '운행 중 변경은 귀환 후 적용됩니다.' : '대기 중 변경은 즉시 적용됩니다.' }}
                </div>
              </section>

              <section class="edit-box">
                <h3>노선 배정</h3>

                <label>
                  <span>배정 노선</span>
                  <div class="inline-form">
                    <div class="custom-select-wrap">
                      <button
                        type="button"
                        class="custom-select-button"
                        @click="toggleRouteDropdown"
                      >
                        <span>{{ selectedAssignRouteLabel }}</span>
                        <b>{{ routeDropdownOpen ? '▲' : '▼' }}</b>
                      </button>

                      <div
                        v-if="routeDropdownOpen"
                        class="custom-select-menu"
                      >
                        <button
                          v-for="route in assignableRoutes"
                          :key="route.id"
                          type="button"
                          class="custom-select-option"
                          :class="{ selected: selectedAssignRouteId === route.id }"
                          @click="chooseAssignRoute(route.id)"
                        >
                          <strong>{{ route.routeNumber }} {{ route.name }}</strong>
                          <small>{{ route.durationText }} · {{ formatMoney(route.fare) }}</small>
                        </button>

                        <div
                          v-if="assignableRoutes.length === 0"
                          class="custom-select-empty"
                        >
                          배정 가능한 해금 노선이 없습니다.
                        </div>
                      </div>
                    </div>

                    <button type="button" @click="handleAssignRoute">배정</button>
                  </div>
                </label>

                <div class="mini-info">
                  호환 가능한 해금 노선만 표시됩니다.
                </div>
              </section>

              <section class="edit-box">
                <h3>운행 방식</h3>

                <div class="action-pair">
                  <button
                    type="button"
                    class="primary-button"
                    :disabled="isSelectedRunning"
                    @click="handleStart(selectedSlot.id)"
                  >
                    출발
                  </button>

                  <button
                    type="button"
                    :class="{ active: selectedSlot?.operationMode === 'auto' }"
                    @click="handleAutoMode"
                  >
                    {{ selectedSlot?.operationMode === 'auto' ? '자동 ON' : '자동 OFF' }}
                  </button>
                </div>

                <div class="mini-info">
                  자동운행은 자동 배차 연구 완료 후 사용할 수 있습니다.
                </div>
              </section>

              <section class="edit-box">
                <h3>노선 이름 수정</h3>

                <label>
                  <span>노선번호</span>
                  <input v-model="routeNumberDraft" type="text" />
                </label>

                <label>
                  <span>노선명</span>
                  <input v-model="routeNameDraft" type="text" />
                </label>

                <button type="button" @click="handleUpdateRoute">
                  노선 저장
                </button>
              </section>

              <section class="edit-box danger-box">
                <h3>차량 판매</h3>

                <p>
                  운행 중이면 현재 왕복을 마친 뒤 판매됩니다.
                  스타터 차량도 판매할 수 있습니다.
                </p>

                <button type="button" class="danger-button" @click="handleSellSlot">
                  차량 판매
                </button>
              </section>

              <section class="edit-box pending-box">
                <h3>예약 변경</h3>

                <ul v-if="pendingMessages.length > 0">
                  <li v-for="message in pendingMessages" :key="message">
                    {{ message }}
                  </li>
                </ul>

                <p v-else>
                  예약된 변경이 없습니다.
                </p>
              </section>
            </div>
          </article>
        </template>
      </div>
    </section>

    <section class="bottom-grid">
      <section class="panel bottom-panel">
        <div class="section-head compact">
          <div>
            <p>ROUTE UNLOCK</p>
            <h2>노선 해금</h2>
          </div>
        </div>

        <div class="unlock-list">
          <article
            v-for="route in safeRouteCatalog"
            :key="route.key"
            class="unlock-row"
            :class="{ unlocked: route.unlocked, unlocking: route.unlocking }"
          >
            <div>
              <strong>{{ route.label }}</strong>
              <span>
                {{ route.displayName }} · 운행 {{ route.durationText }} · 해금 {{ route.unlockDurationText }}
              </span>
              <small v-if="route.unlocking">
                해금 진행 중 · 남은 시간 {{ route.unlockRemainingText }}
              </small>
              <small v-else-if="!route.unlocked">
                해당 노선 왕복 운행시간만큼 해금 시간이 필요합니다.
              </small>
            </div>

            <button
              type="button"
              :disabled="route.unlocked || route.unlocking || safeSummary.hasActiveJob"
              @click="handleUnlockRoute(route.key)"
            >
              {{ route.unlocked ? '해금됨' : route.unlocking ? route.unlockRemainingText : '해금 시작' }}
            </button>
          </article>
        </div>
      </section>

      <section class="panel bottom-panel">
        <div class="section-head compact">
          <div>
            <p>BUS RESEARCH</p>
            <h2>버스 연구</h2>
          </div>
        </div>

        <div class="research-list">
          <article
            class="research-row"
            :class="{
              unlocked: safeSummary.autoDispatchUnlocked,
              unlocking: safeSummary.autoDispatchResearching
            }"
          >
            <div>
              <strong>자동 배차 관리</strong>
              <span v-if="safeSummary.autoDispatchUnlocked">
                완료 후 슬롯별 자동운행을 사용할 수 있습니다.
              </span>
              <span v-else-if="safeSummary.autoDispatchResearching">
                연구 진행 중 · 남은 시간 {{ safeSummary.autoDispatchResearchRemainingText }}
              </span>
              <span v-else>
                연구 시간 {{ safeSummary.autoDispatchResearchDurationText }} · 완료 후 자동운행 기능 해금
              </span>
            </div>

            <button
              type="button"
              :disabled="safeSummary.autoDispatchUnlocked || safeSummary.autoDispatchResearching || safeSummary.hasActiveJob"
              @click="handleAutoResearch"
            >
              {{
                safeSummary.autoDispatchUnlocked
                  ? '완료'
                  : safeSummary.autoDispatchResearching
                    ? safeSummary.autoDispatchResearchRemainingText
                    : '연구 시작'
              }}
            </button>
          </article>

          <article class="research-row locked">
            <div>
              <strong>승객 수요 개선</strong>
              <span>승객 수요율을 올립니다.</span>
            </div>
            <b>준비중</b>
          </article>

          <article class="research-row locked">
            <div>
              <strong>운행 효율 개선</strong>
              <span>왕복 운행 시간을 줄입니다.</span>
            </div>
            <b>준비중</b>
          </article>
        </div>
      </section>
    </section>

    <section class="bottom-grid second">
      <section class="panel bottom-panel wide">
        <div class="section-head compact">
          <div>
            <p>ROUTE SUMMARY</p>
            <h2>노선 집계</h2>
          </div>
        </div>

        <div class="route-list">
          <article
            v-for="route in safeBusRoutes"
            :key="route.id"
            class="route-row"
          >
            <div>
              <strong>{{ route.routeNumber }} {{ route.name }}</strong>
              <span>{{ route.durationText }} · {{ route.fareText }}</span>
            </div>

            <div class="route-metrics">
              <b>슬롯 {{ route.slotCount }}개</b>
              <b>{{ route.headwayText }}</b>
              <b>{{ formatMoney(route.hourlyRevenue) }}/h</b>
            </div>
          </article>
        </div>
      </section>

      <section class="panel bottom-panel">
        <div class="section-head compact">
          <div>
            <p>SETTLEMENT</p>
            <h2>최근 정산</h2>
          </div>
        </div>

        <ul class="settlement-list">
          <li
            v-for="item in safeRecentSettlements"
            :key="item.id"
          >
            <div>
              <strong>{{ item.title }}</strong>
              <span>{{ item.detail }}</span>
            </div>

            <b>+{{ formatMoney(item.amount) }}</b>
          </li>

          <li v-if="safeRecentSettlements.length === 0">
            <div>
              <strong>정산 대기중</strong>
              <span>출발 후 정류장 도착 시 표시됩니다.</span>
            </div>

            <b>0R</b>
          </li>
        </ul>
      </section>
    </section>

    <section
      v-if="resultMessage"
      class="toast-panel"
      :class="{ error: !resultSuccess }"
    >
      {{ resultMessage }}
    </section>
  </main>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import {
  BUS_VEHICLE_CATALOG,
  assignRouteToSlot,
  busRouteCatalog,
  busRoutes,
  busSlots,
  busState,
  busSummary,
  buyBusVehicle,
  completeAutoDispatchResearch,
  getAssignableRoutesForSlot,
  getBusRoute,
  getBusSlot,
  getBusVehicle,
  renameBusVehicleBySlot,
  selectBusSlot,
  sellBusSlot,
  setSlotOperationMode,
  startBusSlot,
  unlockBusRoute,
  updateBusRouteIdentity
} from '../modules/bus'
import { formatMoney } from '../modules/finance'

const selectedSlotId = ref('')
const selectedAssignRouteId = ref('')
const vehicleNameDraft = ref('')
const routeNumberDraft = ref('')
const routeNameDraft = ref('')
const routeDropdownOpen = ref(false)

const resultMessage = ref('')
const resultSuccess = ref(true)

const safeSummary = computed(() => {
  const summary = busSummary.value ?? {}

  return {
    runningSlots: safeNumber(summary.runningSlots),
    waitingSlots: safeNumber(summary.waitingSlots),
    pendingSlots: safeNumber(summary.pendingSlots),
    totalSlots: safeNumber(summary.totalSlots),
    vehicleCount: safeNumber(summary.vehicleCount),
    hourlyRevenue: safeNumber(summary.hourlyRevenue),
    autoDispatchUnlocked: Boolean(summary.autoDispatchUnlocked),
    autoDispatchResearching: Boolean(summary.autoDispatchResearching),
    autoDispatchResearchRemainingText: summary.autoDispatchResearchRemainingText ?? '0초',
    autoDispatchResearchDurationText: summary.autoDispatchResearchDurationText ?? '24시간',
    hasActiveJob: Boolean(summary.hasActiveJob),
    activeJob: summary.activeJob ?? null
  }
})

const selectedSlot = computed(() => {
  if (!selectedSlotId.value) {
    return null
  }

  return getBusSlot(selectedSlotId.value) ?? null
})

const selectedRoute = computed(() => {
  if (!selectedSlot.value?.routeId) {
    return null
  }

  return getBusRoute(selectedSlot.value.routeId) ?? null
})

const isSelectedRunning = computed(() => selectedSlot.value?.status === 'running')

const assignableRoutes = computed(() => {
  if (!selectedSlotId.value) {
    return []
  }

  return getAssignableRoutesForSlot(selectedSlotId.value)
})

const selectedAssignRouteLabel = computed(() => {
  if (!selectedAssignRouteId.value) {
    return '노선 선택'
  }

  const route = assignableRoutes.value.find((item) => item.id === selectedAssignRouteId.value)

  if (!route) {
    return '노선 선택'
  }

  return `${route.routeNumber} ${route.name}`
})

const pendingMessages = computed(() => {
  const pending = selectedSlot.value?.pendingChanges

  if (!pending) {
    return []
  }

  const messages = []

  if (pending.vehicleName) {
    messages.push(`차량 이름 변경: ${pending.vehicleName}`)
  }

  if (pending.routeId) {
    const route = getBusRoute(pending.routeId)
    messages.push(`노선 변경: ${route ? `${route.routeNumber} ${route.name}` : pending.routeId}`)
  }

  if (pending.routeNumber || pending.routeName) {
    messages.push(`노선명 변경: ${pending.routeNumber || ''} ${pending.routeName || ''}`)
  }

  if (pending.operationMode) {
    messages.push(`운행방식 변경: ${pending.operationMode === 'auto' ? '자동' : '수동'}`)
  }

  if (pending.sellAfterReturn) {
    messages.push('귀환 후 차량 판매')
  }

  return messages
})

const safeBusSlots = computed(() => {
  const list = Array.isArray(busSlots.value) ? busSlots.value : []

  return list
    .map((slot) => {
      const vehicle = getBusVehicle(slot.vehicleId)
      const sortRemainingSeconds = getSlotSortRemainingSeconds(slot)

      return {
        id: slot.id ?? 'BUS-000',
        vehicle: slot.vehicle ?? vehicle?.name ?? '버스',
        categoryLabel: vehicle?.categoryLabel ?? '버스',
        route: slot.route ?? '미배정',
        status: slot.status ?? 'idle',
        statusLabel: getStatusLabel(slot.status),
        statusText: slot.statusText ?? '출발 대기',
        operationMode: slot.operationMode ?? 'manual',
        progress: clamp(safeNumber(slot.progress), 0, 100),
        remaining: slot.remaining ?? formatSeconds(safeNumber(slot.remainingSeconds)),
        nextStopText: slot.nextStopText ?? '',
        lastStopLabel: slot.lastStopLabel ?? '',
        lastPassengerCount: safeNumber(slot.lastPassengerCount),
        lastSettlementAmount: safeNumber(slot.lastSettlementAmount),
        hasPending: hasPendingChanges(slot),
        sortRemainingSeconds
      }
    })
    .sort((a, b) => {
      if (a.sortRemainingSeconds !== b.sortRemainingSeconds) {
        return a.sortRemainingSeconds - b.sortRemainingSeconds
      }

      return a.id.localeCompare(b.id)
    })
})

const safeRouteCatalog = computed(() => busRouteCatalog.value ?? [])

const safeBusRoutes = computed(() => {
  const list = Array.isArray(busRoutes.value) ? busRoutes.value : []

  return list.map((route) => ({
    id: route.id,
    routeNumber: route.routeNumber ?? '노선',
    name: route.name ?? '버스 노선',
    durationText: route.durationText ?? formatSeconds(safeNumber(route.durationSeconds)),
    fareText: formatMoney(safeNumber(route.fare)),
    slotCount: safeNumber(route.slotCount),
    headwayText: route.headwayText ?? '운행 없음',
    hourlyRevenue: safeNumber(route.hourlyRevenue)
  }))
})

const safeRecentSettlements = computed(() => {
  const list = Array.isArray(busSummary.value?.recentBusSettlements)
    ? busSummary.value.recentBusSettlements
    : []

  return list.map((item) => ({
    id: item.id ?? `settlement-${Math.random()}`,
    title: item.title ?? '버스 정산',
    detail: item.detail ?? '정산 정보 없음',
    amount: safeNumber(item.amount)
  }))
})

const vehicleCatalogList = computed(() =>
  Object.values(BUS_VEHICLE_CATALOG).map((item) => ({
    key: item.key,
    label: item.label,
    capacity: item.capacity,
    price: item.price,
    services: item.compatibleServices
      .map((service) => {
        if (service === 'village') return '마을'
        if (service === 'city') return '시내'
        if (service === 'metro') return '광역'
        return service
      })
      .join(', ')
  }))
)

watch(selectedSlot, (slot) => {
  routeDropdownOpen.value = false

  if (!slot) {
    vehicleNameDraft.value = ''
    selectedAssignRouteId.value = ''
    routeNumberDraft.value = ''
    routeNameDraft.value = ''
    return
  }

  vehicleNameDraft.value = slot.pendingChanges?.vehicleName || slot.vehicle || ''
  selectedAssignRouteId.value = slot.pendingChanges?.routeId || slot.routeId || ''

  const route = slot.routeId ? getBusRoute(slot.routeId) : null

  routeNumberDraft.value = slot.pendingChanges?.routeNumber || route?.routeNumber || ''
  routeNameDraft.value = slot.pendingChanges?.routeName || route?.name || ''
})

function selectSlot(slotId) {
  selectedSlotId.value = selectedSlotId.value === slotId ? '' : slotId
  selectBusSlot(slotId)
}

function toggleRouteDropdown() {
  routeDropdownOpen.value = !routeDropdownOpen.value
}

function chooseAssignRoute(routeId) {
  selectedAssignRouteId.value = routeId
  routeDropdownOpen.value = false
}

function handleStart(slotId) {
  showResult(startBusSlot(slotId))
}

function handleAssignRoute() {
  if (!selectedSlotId.value || !selectedAssignRouteId.value) {
    showResult({
      success: false,
      message: '슬롯과 노선을 선택해야 합니다.'
    })
    return
  }

  showResult(assignRouteToSlot(selectedSlotId.value, selectedAssignRouteId.value))
}

function handleRenameVehicle() {
  if (!selectedSlotId.value) {
    return
  }

  showResult(renameBusVehicleBySlot(selectedSlotId.value, vehicleNameDraft.value))
}

function handleUpdateRoute() {
  if (!selectedRoute.value) {
    showResult({
      success: false,
      message: '수정할 노선이 없습니다.'
    })
    return
  }

  showResult(updateBusRouteIdentity(selectedRoute.value.id, {
    routeNumber: routeNumberDraft.value,
    name: routeNameDraft.value
  }))
}

function handleAutoMode() {
  if (!selectedSlot.value) {
    return
  }

  const nextMode = selectedSlot.value.operationMode === 'auto' ? 'manual' : 'auto'

  showResult(setSlotOperationMode(selectedSlot.value.id, nextMode))
}

function handleUnlockRoute(routeKey) {
  showResult(unlockBusRoute(routeKey))
}

function handleAutoResearch() {
  showResult(completeAutoDispatchResearch())
}

function handleBuyVehicle(category) {
  showResult(buyBusVehicle(category))
}

function handleSellSlot() {
  if (!selectedSlot.value) {
    return
  }

  const confirmed = window.confirm('이 차량을 판매할까요? 운행 중이면 귀환 후 판매됩니다.')

  if (!confirmed) {
    return
  }

  showResult(sellBusSlot(selectedSlot.value.id))
}

function showResult(result) {
  resultSuccess.value = Boolean(result?.success)
  resultMessage.value = result?.message ?? '처리되었습니다.'

  window.setTimeout(() => {
    resultMessage.value = ''
  }, 2200)
}

function getSlotSortRemainingSeconds(slot) {
  if (slot.status === 'running') {
    return safeNumber(slot.remainingSeconds)
  }

  if (!slot.routeId) {
    return Number.MAX_SAFE_INTEGER
  }

  return safeNumber(slot.remainingSeconds)
}

function getStatusLabel(status) {
  if (status === 'running') return '운행중'
  if (status === 'unassigned') return '미배정'
  if (status === 'error') return '오류'
  return '대기중'
}

function hasPendingChanges(slot) {
  const pending = slot?.pendingChanges

  if (!pending) {
    return false
  }

  return Boolean(
    pending.vehicleName ||
    pending.routeId ||
    pending.routeNumber ||
    pending.routeName ||
    pending.operationMode ||
    pending.sellAfterReturn
  )
}

function safeNumber(value) {
  const number = Number(value)

  if (!Number.isFinite(number)) {
    return 0
  }

  return Math.floor(number)
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function formatSeconds(seconds) {
  const safeSeconds = Math.max(0, safeNumber(seconds))

  if (safeSeconds < 60) {
    return `${safeSeconds}초`
  }

  const minutes = Math.floor(safeSeconds / 60)
  const remainSeconds = safeSeconds % 60

  if (minutes < 60) {
    return remainSeconds > 0 ? `${minutes}분 ${remainSeconds}초` : `${minutes}분`
  }

  const hours = Math.floor(minutes / 60)
  const remainMinutes = minutes % 60

  return remainMinutes > 0 ? `${hours}시간 ${remainMinutes}분` : `${hours}시간`
}
</script>

<style scoped>
.bus-page {
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

.bus-hero {
  display: grid;
  grid-template-columns: minmax(0, 0.85fr) minmax(720px, 1.15fr);
  gap: 14px;
  padding: 16px;
}

.hero-main p,
.section-head p {
  margin: 0 0 6px;
  color: #4bcaff;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.15em;
}

.hero-main h1 {
  margin: 0 0 6px;
  font-size: 30px;
}

.hero-main span {
  color: #a8bacb;
  line-height: 1.45;
}

.hero-side {
  display: grid;
  grid-template-columns: minmax(300px, 1.4fr) minmax(150px, 0.75fr) minmax(150px, 0.75fr);
  gap: 8px;
  min-width: 0;
}

.hero-buy,
.hero-job,
.hero-status {
  min-width: 0;
  padding: 10px;
  border: 1px solid rgba(80, 205, 255, 0.16);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.035);
}

.hero-box-title {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
  margin-bottom: 8px;
}

.hero-box-title strong {
  color: #eaf4ff;
  font-size: 13px;
}

.hero-box-title span {
  overflow: hidden;
  color: #8fa2b5;
  font-size: 10px;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hero-buy-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
}

.hero-buy-button {
  display: flex;
  min-width: 0;
  min-height: 36px;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 2px;
  padding: 6px 8px;
  border-radius: 10px;
  background: rgba(45, 176, 255, 0.06);
}

.hero-buy-button strong {
  overflow: hidden;
  width: 100%;
  color: #eaf4ff;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hero-buy-button span {
  overflow: hidden;
  width: 100%;
  color: #8fa2b5;
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hero-job {
  border-color: rgba(255, 191, 98, 0.2);
  background: rgba(255, 191, 98, 0.045);
}

.hero-job b,
.hero-status b {
  display: block;
  color: #ffcf86;
  font-size: 18px;
}

.hero-status b {
  color: #7eff8f;
}

.hero-job small,
.hero-status small {
  display: block;
  margin-top: 6px;
  color: #9cafc1;
  font-size: 11px;
  line-height: 1.35;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.kpi-card {
  padding: 13px;
  border: 1px solid rgba(120, 190, 255, 0.12);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.035);
}

.kpi-card.highlight {
  border-color: rgba(229, 211, 90, 0.22);
  background: rgba(229, 211, 90, 0.065);
}

.kpi-card.income {
  border-color: rgba(117, 237, 130, 0.18);
  background: rgba(117, 237, 130, 0.055);
}

.kpi-card span {
  display: block;
  color: #8ea2b4;
  font-size: 12px;
}

.kpi-card strong {
  display: block;
  margin-top: 5px;
  font-size: 20px;
}

.kpi-card.highlight strong {
  color: #e5d35a;
}

.kpi-card.income strong {
  color: #75ed82;
}

.kpi-card small {
  display: block;
  margin-top: 4px;
  color: #6f8294;
  font-size: 11px;
}

.operation-panel,
.bottom-panel {
  padding: 14px;
}

.section-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
}

.section-head.compact {
  margin-bottom: 10px;
}

.section-head h2 {
  margin: 0;
  font-size: 18px;
}

.head-note {
  color: #8fa2b5;
  font-size: 12px;
}

.slot-head,
.slot-row {
  display: grid;
  grid-template-columns:
    minmax(150px, 1.1fr)
    minmax(90px, 0.65fr)
    minmax(150px, 1.1fr)
    minmax(120px, 0.85fr)
    minmax(190px, 1.4fr)
    minmax(110px, 0.8fr)
    minmax(140px, 0.9fr);
  gap: 10px;
  align-items: center;
}

.slot-head {
  padding: 0 12px 8px;
  color: #7f92a4;
  font-size: 11px;
  font-weight: 900;
}

.slot-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.slot-row {
  width: 100%;
  min-height: 78px;
  padding: 12px;
  border: 1px solid rgba(120, 190, 255, 0.12);
  border-left: 4px solid #45b7ff;
  border-radius: 14px;
  background:
    linear-gradient(90deg, rgba(69, 183, 255, 0.06), transparent 42%),
    rgba(255, 255, 255, 0.035);
}

.slot-row.selected {
  border-color: rgba(229, 211, 90, 0.32);
  border-left-color: #e5d35a;
  background:
    linear-gradient(90deg, rgba(229, 211, 90, 0.08), transparent 42%),
    rgba(255, 255, 255, 0.04);
}

.slot-row.pending {
  border-right: 4px solid #ffbf62;
}

.slot-cell {
  min-width: 0;
}

.slot-cell small,
.route-row span,
.settlement-list span,
.unlock-row span,
.research-row span {
  display: block;
  margin-bottom: 4px;
  color: #8fa2b5;
  font-size: 12px;
}

.slot-cell strong,
.route-row strong {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.money {
  color: #75ed82;
}

.status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  margin-right: 5px;
  border-radius: 50%;
}

.status-dot.running {
  background: #7eff8f;
  box-shadow: 0 0 10px rgba(126, 255, 143, 0.6);
}

.status-dot.idle {
  background: #ffbf62;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  color: #a7bacb;
  font-size: 12px;
}

.progress-sub {
  margin-top: 4px;
  color: #7f92a4;
  font-size: 11px;
}

.progress-bar {
  height: 9px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
}

.progress-bar div {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #45b7ff, rgba(255, 255, 255, 0.82));
}

.slot-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 7px;
}

button {
  color: #b8c8d8;
  border: 1px solid rgba(120, 190, 255, 0.18);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.035);
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.slot-actions button {
  min-height: 36px;
}

.slot-actions button.active,
.action-pair button.active {
  color: #e5d35a;
  border-color: rgba(229, 211, 90, 0.3);
  background: rgba(229, 211, 90, 0.08);
}

.slot-edit-row {
  padding: 12px;
  margin-top: -4px;
  border: 1px solid rgba(229, 211, 90, 0.18);
  border-radius: 14px;
  background: rgba(229, 211, 90, 0.04);
}

.edit-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.edit-box {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.035);
}

.edit-box h3 {
  margin: 0;
  font-size: 15px;
}

.edit-box label {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.edit-box label span {
  color: #8fa2b5;
  font-size: 12px;
}

.inline-form {
  display: grid;
  grid-template-columns: 1fr 64px;
  gap: 6px;
}

.action-pair {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

input {
  min-width: 0;
  padding: 9px 10px;
  color: #eaf4ff;
  border: 1px solid rgba(120, 190, 255, 0.16);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
}

input:focus {
  outline: none;
  border-color: rgba(80, 205, 255, 0.5);
  box-shadow: 0 0 0 2px rgba(80, 205, 255, 0.12);
}

.custom-select-wrap {
  position: relative;
  min-width: 0;
}

.custom-select-button {
  display: flex;
  width: 100%;
  min-height: 38px;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding: 9px 10px;
  color: #eaf4ff;
  border: 1px solid rgba(120, 190, 255, 0.22);
  border-radius: 10px;
  background:
    linear-gradient(180deg, rgba(19, 42, 66, 0.98), rgba(8, 20, 34, 0.98));
  text-align: left;
}

.custom-select-button span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.custom-select-button b {
  color: #7fd8ff;
  font-size: 11px;
}

.custom-select-menu {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  z-index: 40;
  max-height: 260px;
  overflow-y: auto;
  padding: 6px;
  border: 1px solid rgba(120, 190, 255, 0.28);
  border-radius: 12px;
  background: #071522;
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.42);
}

.custom-select-option {
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
  padding: 10px;
  color: #eaf4ff;
  border: 1px solid transparent;
  border-radius: 10px;
  background: transparent;
  text-align: left;
}

.custom-select-option:hover {
  border-color: rgba(80, 205, 255, 0.24);
  background: rgba(80, 205, 255, 0.08);
}

.custom-select-option.selected {
  border-color: rgba(229, 211, 90, 0.32);
  background: rgba(229, 211, 90, 0.09);
}

.custom-select-option strong {
  color: #f4fbff;
  font-size: 13px;
}

.custom-select-option small {
  color: #8fa2b5;
  font-size: 11px;
}

.custom-select-empty {
  padding: 12px;
  color: #8fa2b5;
  font-size: 12px;
}

.primary-button {
  color: #eaf9ff;
  border-color: rgba(80, 205, 255, 0.42);
  background: rgba(45, 176, 255, 0.18);
}

.danger-box {
  border: 1px solid rgba(255, 120, 112, 0.18);
  background: rgba(255, 120, 112, 0.05);
}

.danger-box p,
.pending-box p,
.mini-info {
  margin: 0;
  color: #9cafc1;
  font-size: 12px;
  line-height: 1.4;
}

.danger-button {
  color: #ffaaa4;
  border-color: rgba(255, 120, 112, 0.3);
  background: rgba(255, 120, 112, 0.08);
}

.pending-box ul {
  padding-left: 18px;
  margin: 0;
  color: #ffcf86;
  font-size: 12px;
  line-height: 1.6;
}

.bottom-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.bottom-grid.second {
  grid-template-columns: 1.3fr 1fr;
}

.bottom-panel.wide {
  min-width: 0;
}

.unlock-list,
.research-list,
.route-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.unlock-row,
.research-row,
.route-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  padding: 12px;
  border-radius: 13px;
  background: rgba(255, 255, 255, 0.035);
}

.unlock-row.unlocked,
.research-row.unlocked {
  border: 1px solid rgba(126, 255, 143, 0.16);
  background: rgba(126, 255, 143, 0.045);
}

.unlock-row.unlocking,
.research-row.unlocking {
  border: 1px solid rgba(255, 191, 98, 0.18);
  background: rgba(255, 191, 98, 0.055);
}

.research-row.locked {
  opacity: 0.65;
}

.unlock-row strong,
.research-row strong {
  display: block;
}

.unlock-row small {
  display: block;
  margin-top: 4px;
  color: #ffcf86;
  font-size: 11px;
}

.unlock-row button,
.research-row button {
  min-width: 86px;
  min-height: 34px;
}

.route-metrics {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-end;
  white-space: nowrap;
}

.route-metrics b {
  color: #9fdcff;
  font-size: 12px;
}

.settlement-list {
  padding: 0;
  margin: 0;
  list-style: none;
}

.settlement-list li {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
}

.settlement-list li:last-child {
  border-bottom: 0;
}

.settlement-list strong {
  display: block;
}

.settlement-list b {
  color: #75ed82;
  white-space: nowrap;
}

.toast-panel {
  position: fixed;
  right: 18px;
  bottom: 18px;
  z-index: 50;
  padding: 12px 16px;
  color: #eaf9ff;
  border: 1px solid rgba(80, 205, 255, 0.32);
  border-radius: 14px;
  background: rgba(8, 28, 44, 0.96);
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.38);
}

.toast-panel.error {
  color: #ffaaa4;
  border-color: rgba(255, 120, 112, 0.3);
  background: rgba(44, 16, 20, 0.96);
}

@media (max-width: 1350px) {
  .bus-hero {
    grid-template-columns: 1fr;
  }

  .hero-side {
    grid-template-columns: 1.3fr 0.85fr 0.85fr;
  }
}

@media (max-width: 1250px) {
  .slot-head {
    display: none;
  }

  .slot-row {
    grid-template-columns: 1fr 1fr;
  }

  .progress-cell {
    grid-column: 1 / -1;
  }

  .slot-actions {
    grid-column: 1 / -1;
  }

  .edit-grid,
  .bottom-grid,
  .bottom-grid.second {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 840px) {
  .bus-hero,
  .kpi-grid,
  .slot-row,
  .hero-side,
  .hero-buy-list {
    grid-template-columns: 1fr;
  }

  .bus-page {
    padding: 10px;
  }

  .hero-main h1 {
    font-size: 26px;
  }

  .section-head,
  .unlock-row,
  .research-row,
  .route-row {
    align-items: flex-start;
    flex-direction: column;
  }

  .inline-form,
  .action-pair {
    grid-template-columns: 1fr;
  }

  .route-metrics {
    align-items: flex-start;
  }
}
</style>