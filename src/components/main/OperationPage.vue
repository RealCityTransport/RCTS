<!--
RCTS FILE CONTEXT
파일 역할:
- 운행 메뉴의 기본 페이지.
- 노선 생성, 노선 수정, 차량 배차, 운행개시, 자동운행 설정을 담당한다.

수정 사항:
- 입력칸 겹침 방지를 위해 신규 노선 입력 영역과 기존 노선 수정 영역을 단일 컬럼 중심으로 정리했다.
- 모든 input/select/button에 min-width:0, width:100%, box-sizing:border-box를 적용했다.
- 운행중 노선에서도 자동운행 OFF만 가능하다.
- 이동중/정차중 상태를 분리해서 표시한다.
-->

<template>
  <BaseMainPage
    eyebrow="OPERATION"
    title="운행"
    description="노선명을 정하고, 시설을 순서대로 연결한 뒤 차량을 1대 배차해 1회 왕복 운행을 시작합니다."
    badge="기초 메뉴"
  >
    <section class="operation-page-shell">
      <section class="notice-box">
        <strong>운행중인 노선은 왕복 완료 전까지 일반 수정이 잠깁니다.</strong>
        <p>
          단, 자동운행이 켜진 상태라면 운행중에도 자동운행만 끌 수 있습니다.
          자동운행을 끄면 현재 왕복까지만 마치고 수동 운행 상태로 돌아갑니다.
        </p>
      </section>

      <section class="panel-card">
        <div class="panel-title">
          <div>
            <span>ROUTE CREATE</span>
            <h3>신규 노선 만들기</h3>
          </div>

          <strong>{{ routeDraft.orderedFacilityIds.length }}개 시설 선택</strong>
        </div>

        <div class="route-create-form">
          <label class="form-field">
            <span>노선명</span>
            <input
              type="text"
              maxlength="32"
              placeholder="예: 1번 순환버스"
              :value="routeDraft.name"
              @input="updateDraft({ name: $event.target.value })"
            />
          </label>

          <label v-if="isDwellTimeUnlocked" class="form-field">
            <span>정차시간</span>
            <input
              type="number"
              min="0"
              step="1"
              placeholder="초 단위"
              :value="routeDraft.dwellSeconds || 0"
              @input="updateDraft({ dwellSeconds: $event.target.value })"
            />
          </label>

          <section v-else class="locked-option">
            <span>정차시간</span>
            <strong>버스 운행 2단계 연구 필요</strong>
            <p>현재는 거리와 차량속도만으로 운행시간을 계산합니다.</p>
          </section>

          <section v-if="isAutoDispatchUnlocked" class="auto-form-box">
            <label class="check-field">
              <input
                type="checkbox"
                :checked="Boolean(routeDraft.autoDispatchEnabled)"
                @change="updateDraft({ autoDispatchEnabled: $event.target.checked })"
              />
              <span>자동운행 사용</span>
            </label>

            <label class="form-field">
              <span>재출발 대기시간</span>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="초 단위"
                :disabled="!routeDraft.autoDispatchEnabled"
                :value="routeDraft.autoDispatchIntervalSeconds || 0"
                @input="updateDraft({ autoDispatchIntervalSeconds: $event.target.value })"
              />
            </label>
          </section>

          <section v-else class="locked-option">
            <span>자동운행</span>
            <strong>버스 운행 3단계 연구 필요</strong>
            <p>왕복 완료 후 자동 재출발 기능은 아직 잠겨 있습니다.</p>
          </section>
        </div>
      </section>

      <section class="operation-grid">
        <section class="panel-card">
          <div class="panel-title">
            <div>
              <span>FACILITY SOURCE</span>
              <h3>등록된 시설</h3>
            </div>

            <strong>{{ activeFacilities.length }}개 사용 가능</strong>
          </div>

          <div v-if="activeFacilities.length" class="facility-source-list">
            <article
              v-for="facility in activeFacilities"
              :key="facility.id"
              class="source-card"
            >
              <div>
                <strong>{{ facility.name }}</strong>
                <span>{{ facility.transportTypeName }} · {{ facility.facilityTypeName }}</span>
              </div>

              <button
                type="button"
                :disabled="isFacilitySelected(facility.id)"
                @click="addFacilityToDraft(facility)"
              >
                {{ isFacilitySelected(facility.id) ? '선택됨' : '추가' }}
              </button>
            </article>
          </div>

          <div v-else class="empty-box">
            <strong>사용 가능한 시설이 없습니다.</strong>
            <span>시설 메뉴에서 먼저 시설을 추가해야 운행 구성을 시작할 수 있습니다.</span>
          </div>
        </section>

        <section class="panel-card">
          <div class="panel-title">
            <div>
              <span>ROUTE ORDER</span>
              <h3>노선 시설 순서</h3>
            </div>

            <strong>{{ orderedFacilities.length }}개 선택</strong>
          </div>

          <div v-if="orderedFacilities.length" class="route-order-list">
            <article
              v-for="(facility, index) in orderedFacilities"
              :key="facility.id"
              class="order-card"
            >
              <b>{{ index + 1 }}</b>

              <div>
                <strong>{{ facility.name }}</strong>
                <span>{{ facility.transportTypeName }} · {{ facility.facilityTypeName }}</span>
              </div>

              <div class="order-actions">
                <button
                  type="button"
                  :disabled="index === 0"
                  @click="moveFacility(index, -1)"
                >
                  ↑
                </button>

                <button
                  type="button"
                  :disabled="index === orderedFacilities.length - 1"
                  @click="moveFacility(index, 1)"
                >
                  ↓
                </button>

                <button
                  type="button"
                  @click="removeFacilityFromDraft(facility.id)"
                >
                  삭제
                </button>
              </div>
            </article>
          </div>

          <div v-else class="empty-box">
            <strong>아직 선택된 시설이 없습니다.</strong>
            <span>왼쪽 등록 시설에서 운행에 사용할 시설을 순서대로 추가하세요.</span>
          </div>
        </section>
      </section>

      <section class="panel-card">
        <div class="panel-title">
          <div>
            <span>DISTANCE SETTINGS</span>
            <h3>정류장 간 거리 설정</h3>
          </div>

          <strong>{{ segmentRows.length }}개 구간</strong>
        </div>

        <div v-if="segmentRows.length" class="segment-list">
          <article
            v-for="segment in segmentRows"
            :key="segment.key"
            class="segment-card"
          >
            <div>
              <strong>{{ segment.from.name }} → {{ segment.to.name }}</strong>
              <span>인접 시설 사이의 거리입니다. 왕복 시간은 이 거리의 왕복 기준으로 계산됩니다.</span>
            </div>

            <label class="distance-input">
              <input
                type="number"
                min="0"
                step="0.1"
                :value="getSegmentDistance(segment.key)"
                @input="updateSegmentDistance(segment.key, $event.target.value)"
              />
              <small>km</small>
            </label>
          </article>
        </div>

        <div v-else class="empty-box">
          <strong>거리 설정을 위해서는 시설이 2개 이상 필요합니다.</strong>
          <span>노선 시설 순서에 시설을 2개 이상 추가하면 구간 거리 입력칸이 생성됩니다.</span>
        </div>

        <button
          type="button"
          class="create-route-button"
          @click="emitCreateRoute"
        >
          노선 생성
        </button>
      </section>

      <section class="panel-card">
        <div class="panel-title">
          <div>
            <span>ROUTE LIST</span>
            <h3>운행 노선</h3>
          </div>

          <strong>{{ operationRoutes.length }}개 노선</strong>
        </div>

        <div v-if="operationRoutes.length" class="route-list">
          <article
            v-for="route in operationRoutes"
            :key="route.id"
            class="route-card"
            :class="route.status"
          >
            <div class="route-card-top">
              <div class="route-title-box">
                <span>{{ getRouteStatusLabel(route.status) }}</span>
                <h4>{{ route.name }}</h4>
                <p>{{ getRouteFacilityNames(route).join(' → ') }}</p>
              </div>

              <div class="route-side-actions">
                <div class="route-summary">
                  <strong>{{ getRouteDistanceText(route) }}</strong>
                  <small>정차 {{ route.dwellSeconds || 0 }}초</small>
                  <small v-if="route.autoDispatchEnabled">
                    자동 {{ route.autoDispatchIntervalSeconds || 0 }}초
                  </small>
                </div>

                <button
                  type="button"
                  class="delete-route-button"
                  :disabled="route.status === 'running'"
                  @click="deleteRoute(route)"
                >
                  노선 삭제
                </button>
              </div>
            </div>

            <section
              v-if="route.status === 'running'"
              class="running-control-box"
            >
              <div>
                <strong>운행중 수정 잠김</strong>
                <p>현재 왕복이 완료될 때까지 노선명, 거리, 정차시간은 수정할 수 없습니다.</p>
              </div>

              <button
                v-if="isAutoDispatchUnlocked && route.autoDispatchEnabled"
                type="button"
                class="stop-auto-button"
                @click="updateExistingRoute(route.id, { autoDispatchEnabled: false })"
              >
                자동운행 끄기
              </button>
            </section>

            <section
              v-else
              class="route-edit-box"
            >
              <div class="route-edit-fields">
                <label class="form-field">
                  <span>노선명 수정</span>
                  <input
                    type="text"
                    maxlength="32"
                    :value="route.name"
                    @change="updateExistingRoute(route.id, { name: $event.target.value })"
                  />
                </label>

                <label v-if="isDwellTimeUnlocked" class="form-field">
                  <span>정차시간 수정</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    :value="route.dwellSeconds || 0"
                    @change="updateExistingRoute(route.id, { dwellSeconds: $event.target.value })"
                  />
                </label>
              </div>

              <section v-if="isAutoDispatchUnlocked" class="route-auto-edit">
                <label class="check-field">
                  <input
                    type="checkbox"
                    :checked="Boolean(route.autoDispatchEnabled)"
                    @change="updateExistingRoute(route.id, { autoDispatchEnabled: $event.target.checked })"
                  />
                  <span>자동운행 사용</span>
                </label>

                <label class="form-field">
                  <span>재출발 대기시간</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    :disabled="!route.autoDispatchEnabled"
                    :value="route.autoDispatchIntervalSeconds || 0"
                    @change="updateExistingRoute(route.id, { autoDispatchIntervalSeconds: $event.target.value })"
                  />
                </label>
              </section>

              <div class="route-segment-edit">
                <article
                  v-for="segment in getRouteSegmentRows(route)"
                  :key="segment.key"
                >
                  <span>{{ segment.from.name }} → {{ segment.to.name }}</span>
                  <label class="distance-input">
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      :value="route.segmentDistances?.[segment.key] || ''"
                      @change="updateExistingRouteDistance(route, segment.key, $event.target.value)"
                    />
                    <small>km</small>
                  </label>
                </article>
              </div>
            </section>

            <div class="dispatch-row">
              <label class="form-field">
                <span>배차 차량</span>
                <select
                  :value="route.assignedVehicleId || ''"
                  :disabled="route.status === 'running'"
                  @change="assignVehicle(route.id, $event.target.value)"
                >
                  <option value="">차량 선택</option>
                  <option
                    v-for="vehicle in getAssignableVehicles(route)"
                    :key="vehicle.id"
                    :value="vehicle.id"
                  >
                    {{ vehicle.name }} / {{ vehicle.capacity }}명 / {{ vehicle.maxSpeedKmh }}km/h
                  </option>
                </select>
              </label>

              <button
                type="button"
                :disabled="!canStartRoute(route)"
                @click="emit('start-route', route.id)"
              >
                운행개시
              </button>
            </div>

            <div v-if="route.status === 'running'" class="runtime-box">
              <div>
                <span>{{ getRuntimeInfo(route).phaseLabel }}</span>
                <strong>{{ getLivePositionText(route) }}</strong>
                <small>{{ getLiveRemainingText(route) }}</small>
              </div>

              <div>
                <span>1회 왕복</span>
                <strong>{{ formatTicks(getRuntimeInfo(route).remainingRoundTripTicks) }} 남음</strong>
                <small>{{ getRuntimeInfo(route).progressPercent }}% 진행</small>
              </div>
            </div>

            <div v-else-if="route.status === 'auto-waiting'" class="runtime-box">
              <div>
                <span>자동 재출발</span>
                <strong>{{ formatTicks(getAutoDispatchRemainingTicks(route)) }} 남음</strong>
                <small>같은 차량으로 다시 출발합니다.</small>
              </div>

              <div>
                <span>자동운행</span>
                <strong>ON</strong>
                <small>{{ route.autoDispatchIntervalSeconds || 0 }}초 대기 후 출발</small>
              </div>
            </div>

            <div v-else class="route-help">
              {{ getRouteHelpText(route) }}
            </div>
          </article>
        </div>

        <div v-else class="empty-box">
          <strong>아직 생성된 운행 노선이 없습니다.</strong>
          <span>노선명, 시설 순서, 거리 설정을 마친 뒤 노선을 생성하세요.</span>
        </div>
      </section>
    </section>
  </BaseMainPage>
</template>

<script setup>
import { computed } from 'vue'
import BaseMainPage from './BaseMainPage.vue'

import {
  createRouteRuntimeInfo,
  formatTicks,
  getOneWayDistanceKm,
  getRoundTripDistanceKm,
  getSegmentKey,
} from '../../modules/routeRuntime'

const props = defineProps({
  completedResearch: {
    type: Array,
    default: () => [],
  },
  facilities: {
    type: Array,
    default: () => [],
  },
  vehicles: {
    type: Array,
    default: () => [],
  },
  routeDraft: {
    type: Object,
    default: () => ({
      name: '',
      dwellSeconds: 0,
      autoDispatchEnabled: false,
      autoDispatchIntervalSeconds: 0,
      orderedFacilityIds: [],
      segmentDistances: {},
    }),
  },
  operationRoutes: {
    type: Array,
    default: () => [],
  },
  currentTick: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits([
  'update-route-draft',
  'create-operation-route',
  'update-operation-route',
  'delete-operation-route',
  'assign-vehicle-to-route',
  'start-route',
])

const isDwellTimeUnlocked = computed(() => {
  return props.completedResearch.includes('bus-dwell-time-basic')
})

const isAutoDispatchUnlocked = computed(() => {
  return props.completedResearch.includes('bus-auto-dispatch-basic')
})

const activeFacilities = computed(() => {
  return props.facilities.filter((facility) => {
    return facility.status === 'active'
  })
})

const orderedFacilityIds = computed(() => {
  return Array.isArray(props.routeDraft.orderedFacilityIds)
    ? props.routeDraft.orderedFacilityIds
    : []
})

const orderedFacilities = computed(() => {
  return orderedFacilityIds.value
    .map((facilityId) => {
      return props.facilities.find((facility) => facility.id === facilityId)
    })
    .filter(Boolean)
})

const segmentRows = computed(() => {
  const rows = []

  for (let index = 0; index < orderedFacilities.value.length - 1; index += 1) {
    const from = orderedFacilities.value[index]
    const to = orderedFacilities.value[index + 1]

    rows.push({
      key: getSegmentKey(from.id, to.id),
      from,
      to,
    })
  }

  return rows
})

function isFacilitySelected(facilityId) {
  return orderedFacilityIds.value.includes(facilityId)
}

function addFacilityToDraft(facility) {
  if (isFacilitySelected(facility.id)) {
    return
  }

  updateDraft({
    orderedFacilityIds: [...orderedFacilityIds.value, facility.id],
  })
}

function removeFacilityFromDraft(facilityId) {
  const nextIds = orderedFacilityIds.value.filter((id) => id !== facilityId)

  updateDraft({
    orderedFacilityIds: nextIds,
    segmentDistances: cleanDraftSegmentDistances(nextIds),
  })
}

function moveFacility(index, direction) {
  const nextIds = [...orderedFacilityIds.value]
  const targetIndex = index + direction

  if (targetIndex < 0 || targetIndex >= nextIds.length) {
    return
  }

  const current = nextIds[index]
  nextIds[index] = nextIds[targetIndex]
  nextIds[targetIndex] = current

  updateDraft({
    orderedFacilityIds: nextIds,
    segmentDistances: cleanDraftSegmentDistances(nextIds),
  })
}

function updateSegmentDistance(segmentKey, value) {
  updateDraft({
    segmentDistances: {
      ...props.routeDraft.segmentDistances,
      [segmentKey]: value,
    },
  })
}

function getSegmentDistance(segmentKey) {
  return props.routeDraft.segmentDistances?.[segmentKey] || ''
}

function updateDraft(partialDraft) {
  emit('update-route-draft', {
    name: partialDraft.name ?? props.routeDraft.name ?? '',
    dwellSeconds: partialDraft.dwellSeconds ?? props.routeDraft.dwellSeconds ?? 0,
    autoDispatchEnabled:
      partialDraft.autoDispatchEnabled ?? props.routeDraft.autoDispatchEnabled ?? false,
    autoDispatchIntervalSeconds:
      partialDraft.autoDispatchIntervalSeconds ??
      props.routeDraft.autoDispatchIntervalSeconds ??
      0,
    orderedFacilityIds: partialDraft.orderedFacilityIds || [...orderedFacilityIds.value],
    segmentDistances: partialDraft.segmentDistances || { ...props.routeDraft.segmentDistances },
  })
}

function cleanDraftSegmentDistances(nextIds) {
  const validKeys = new Set()

  for (let index = 0; index < nextIds.length - 1; index += 1) {
    validKeys.add(getSegmentKey(nextIds[index], nextIds[index + 1]))
  }

  const nextDistances = {}

  Object.entries(props.routeDraft.segmentDistances || {}).forEach(([key, value]) => {
    if (validKeys.has(key)) {
      nextDistances[key] = value
    }
  })

  return nextDistances
}

function emitCreateRoute() {
  emit('create-operation-route', {
    name: props.routeDraft.name,
    dwellSeconds: props.routeDraft.dwellSeconds || 0,
    autoDispatchEnabled: Boolean(props.routeDraft.autoDispatchEnabled),
    autoDispatchIntervalSeconds: props.routeDraft.autoDispatchIntervalSeconds || 0,
    orderedFacilityIds: [...orderedFacilityIds.value],
    segmentDistances: { ...props.routeDraft.segmentDistances },
  })
}

function updateExistingRoute(routeId, partial) {
  emit('update-operation-route', {
    routeId,
    ...partial,
  })
}

function updateExistingRouteDistance(route, segmentKey, value) {
  updateExistingRoute(route.id, {
    segmentDistances: {
      ...route.segmentDistances,
      [segmentKey]: value,
    },
  })
}

function deleteRoute(route) {
  emit('delete-operation-route', route.id)
}

function getRouteFacilityNames(route) {
  return route.orderedFacilityIds
    .map((facilityId) => {
      return props.facilities.find((facility) => facility.id === facilityId)?.name
    })
    .filter(Boolean)
}

function getRouteSegmentRows(route) {
  const orderedFacilities = route.orderedFacilityIds
    .map((facilityId) => {
      return props.facilities.find((facility) => facility.id === facilityId)
    })
    .filter(Boolean)

  const rows = []

  for (let index = 0; index < orderedFacilities.length - 1; index += 1) {
    const from = orderedFacilities[index]
    const to = orderedFacilities[index + 1]

    rows.push({
      key: getSegmentKey(from.id, to.id),
      from,
      to,
    })
  }

  return rows
}

function getRouteDistanceText(route) {
  const oneWay = getOneWayDistanceKm(route)
  const roundTrip = getRoundTripDistanceKm(route)

  return `편도 ${oneWay.toFixed(1)}km / 왕복 ${roundTrip.toFixed(1)}km`
}

function getAssignableVehicles(route) {
  return props.vehicles.filter((vehicle) => {
    if (route.assignedVehicleId === vehicle.id) {
      return true
    }

    return vehicle.status === 'standby'
  })
}

function assignVehicle(routeId, vehicleId) {
  emit('assign-vehicle-to-route', {
    routeId,
    vehicleId,
  })
}

function canStartRoute(route) {
  return route.status === 'ready' && Boolean(route.assignedVehicleId)
}

function getRuntimeInfo(route) {
  return createRouteRuntimeInfo(route, props.facilities, props.vehicles, props.currentTick)
}

function getLivePositionText(route) {
  const runtime = getRuntimeInfo(route)

  if (runtime.phase === 'dwell') {
    return `${runtime.stoppedFacility?.name || '정류장'} 정차중`
  }

  if (runtime.phase === 'moving') {
    return `${runtime.currentLeg?.from?.name || '-'} → ${runtime.currentLeg?.to?.name || '-'} 이동중`
  }

  return '도착 처리중'
}

function getLiveRemainingText(route) {
  const runtime = getRuntimeInfo(route)

  if (runtime.phase === 'dwell') {
    return `정차 ${formatTicks(runtime.remainingCurrentPhaseTicks)} 남음`
  }

  if (runtime.phase === 'moving') {
    return `다음 정류장까지 ${formatTicks(runtime.remainingToNextStopTicks)} 남음`
  }

  return '상태 갱신 대기'
}

function getAutoDispatchRemainingTicks(route) {
  if (route.nextAutoDispatchAtTick === null || route.nextAutoDispatchAtTick === undefined) {
    return 0
  }

  return Math.max(0, route.nextAutoDispatchAtTick - props.currentTick)
}

function getRouteStatusLabel(status) {
  if (status === 'waiting') {
    return '배차 대기'
  }

  if (status === 'ready') {
    return '운행 준비'
  }

  if (status === 'running') {
    return '운행중'
  }

  if (status === 'auto-waiting') {
    return '자동 재출발 대기'
  }

  if (status === 'completed') {
    return '왕복 완료'
  }

  return '상태 미확인'
}

function getRouteHelpText(route) {
  if (route.status === 'waiting') {
    return '차량을 선택해 배차하면 운행개시가 가능합니다.'
  }

  if (route.status === 'ready') {
    return '운행개시를 누르면 1회 왕복 운행이 시작됩니다.'
  }

  if (route.status === 'completed') {
    return '1회 왕복이 완료되었습니다. 다시 운행하려면 차량을 수동으로 재배차하세요.'
  }

  return ''
}
</script>

<style scoped>
*,
*::before,
*::after {
  box-sizing: border-box;
}

.operation-page-shell {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.notice-box,
.panel-card {
  min-width: 0;
  padding: 18px;
  border: 1px solid #dbe3ef;
  border-radius: 12px;
  background: #f8fafc;
}

.notice-box {
  border-color: #93c5fd;
  background: #eff6ff;
}

.notice-box strong {
  display: block;
  color: #111827;
  font-size: 20px;
}

.notice-box p {
  max-width: 860px;
  margin: 8px 0 0;
  color: #475569;
  font-size: 15px;
  line-height: 1.7;
}

.operation-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
  gap: 14px;
  min-width: 0;
}

.panel-title {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 14px;
  min-width: 0;
  margin-bottom: 14px;
}

.panel-title span,
.form-field span,
.locked-option span,
.route-card-top span,
.dispatch-row span,
.runtime-box span,
.route-edit-box span,
.route-auto-edit span,
.check-field span {
  display: block;
  color: #2563eb;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 1px;
}

.panel-title h3 {
  margin: 5px 0 0;
  color: #111827;
  font-size: 21px;
}

.panel-title strong {
  flex-shrink: 0;
  color: #334155;
  font-size: 14px;
  font-weight: 900;
}

.route-create-form {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  min-width: 0;
}

.form-field {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.form-field input,
.form-field select,
.route-edit-box input,
.route-auto-edit input,
.dispatch-row select {
  width: 100%;
  min-width: 0;
  height: 42px;
  padding: 0 12px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  color: #111827;
  font-size: 15px;
  font-weight: 900;
  outline: none;
  background: white;
}

.form-field input:disabled,
.route-auto-edit input:disabled,
.dispatch-row select:disabled {
  background: #e5e7eb;
  color: #94a3b8;
}

.locked-option,
.auto-form-box {
  min-width: 0;
  padding: 12px;
  border: 1px dashed #cbd5e1;
  border-radius: 10px;
  background: white;
}

.locked-option strong {
  display: block;
  margin-top: 5px;
  color: #111827;
  font-size: 14px;
}

.locked-option p {
  margin: 5px 0 0;
  color: #64748b;
  font-size: 12px;
  line-height: 1.45;
}

.auto-form-box {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.check-field {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  min-height: 38px;
}

.check-field input {
  flex: 0 0 auto;
  width: 16px;
  height: 16px;
}

.facility-source-list,
.route-order-list,
.segment-list,
.route-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.source-card,
.order-card,
.segment-card,
.route-card {
  min-width: 0;
  display: grid;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border: 1px solid #dbe3ef;
  border-radius: 12px;
  background: white;
}

.source-card {
  grid-template-columns: minmax(0, 1fr) 74px;
}

.order-card {
  grid-template-columns: 34px minmax(0, 1fr) auto;
}

.segment-card {
  grid-template-columns: minmax(0, 1fr) 160px;
}

.order-card b {
  width: 34px;
  height: 34px;
  display: inline-grid;
  place-items: center;
  border-radius: 999px;
  background: #eff6ff;
  color: #1e3a8a;
  font-size: 13px;
}

.source-card strong,
.order-card strong,
.segment-card strong {
  display: block;
  color: #111827;
  font-size: 15px;
}

.source-card span,
.order-card span,
.segment-card span {
  display: block;
  margin-top: 4px;
  color: #64748b;
  font-size: 13px;
}

.source-card button,
.order-actions button,
.create-route-button,
.dispatch-row button {
  height: 34px;
  border: 0;
  border-radius: 8px;
  background: var(--blue);
  color: white;
  font-size: 12px;
  font-weight: 900;
  cursor: pointer;
}

.source-card button:disabled,
.order-actions button:disabled,
.dispatch-row button:disabled {
  background: #94a3b8;
  cursor: default;
}

.order-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.order-actions button {
  min-width: 34px;
  padding: 0 9px;
}

.distance-input {
  min-width: 0;
  height: 38px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 34px;
  align-items: center;
  border: 1px solid #cbd5e1;
  border-radius: 9px;
  background: white;
  overflow: hidden;
}

.distance-input input {
  min-width: 0;
  width: 100%;
  height: 100%;
  padding: 0 10px;
  border: 0;
  outline: none;
  color: #111827;
  font-size: 14px;
  font-weight: 900;
}

.distance-input small {
  color: #64748b;
  font-size: 12px;
  font-weight: 900;
  text-align: center;
}

.create-route-button {
  width: 100%;
  height: 42px;
  margin-top: 14px;
  font-size: 14px;
}

.route-card {
  gap: 14px;
}

.route-card.running {
  border-color: #93c5fd;
  background: #eff6ff;
}

.route-card.auto-waiting {
  border-color: #f59e0b;
  background: #fff7ed;
}

.route-card.completed {
  opacity: 0.94;
}

.route-card-top {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: flex-start;
  gap: 14px;
  min-width: 0;
}

.route-title-box {
  min-width: 0;
}

.route-card-top h4 {
  margin: 6px 0 0;
  color: #111827;
  font-size: 20px;
  word-break: keep-all;
}

.route-card-top p {
  margin: 7px 0 0;
  color: #64748b;
  font-size: 14px;
  line-height: 1.55;
  word-break: keep-all;
}

.route-side-actions {
  display: grid;
  justify-items: end;
  gap: 10px;
}

.route-summary {
  text-align: right;
}

.route-summary strong {
  display: block;
  color: #334155;
  font-size: 13px;
  font-weight: 900;
  white-space: nowrap;
}

.route-summary small {
  display: block;
  margin-top: 5px;
  color: #64748b;
  font-size: 12px;
  font-weight: 900;
}

.delete-route-button,
.stop-auto-button {
  height: 34px;
  padding: 0 10px;
  border: 0;
  border-radius: 8px;
  color: white;
  font-size: 12px;
  font-weight: 900;
  cursor: pointer;
}

.delete-route-button {
  background: #dc2626;
}

.stop-auto-button {
  background: #f97316;
}

.delete-route-button:disabled {
  background: #94a3b8;
  cursor: default;
}

.route-edit-box,
.running-control-box {
  min-width: 0;
  display: grid;
  gap: 12px;
  padding: 12px;
  border-radius: 10px;
  background: #f8fafc;
}

.route-edit-fields {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  min-width: 0;
}

.route-auto-edit {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  min-width: 0;
  padding: 12px;
  border-radius: 10px;
  background: white;
  border: 1px dashed #cbd5e1;
}

.route-segment-edit {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
  min-width: 0;
}

.route-segment-edit article {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.running-control-box {
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  background: rgba(30, 58, 138, 0.08);
}

.running-control-box strong {
  display: block;
  color: #1e3a8a;
  font-size: 14px;
}

.running-control-box p {
  margin: 5px 0 0;
  color: #475569;
  font-size: 13px;
  line-height: 1.5;
}

.dispatch-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 110px;
  gap: 10px;
  align-items: end;
  min-width: 0;
}

.dispatch-row button {
  height: 42px;
}

.runtime-box {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  min-width: 0;
}

.runtime-box div {
  min-width: 0;
  padding: 12px;
  border-radius: 10px;
  background: white;
}

.runtime-box strong {
  display: block;
  margin-top: 6px;
  color: #111827;
  font-size: 16px;
  word-break: keep-all;
}

.runtime-box small {
  display: block;
  margin-top: 5px;
  color: #64748b;
  font-size: 12px;
  font-weight: 900;
}

.route-help {
  padding: 10px 12px;
  border-radius: 10px;
  background: #f8fafc;
  color: #64748b;
  font-size: 13px;
  font-weight: 800;
}

.empty-box {
  min-height: 96px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
  padding: 18px;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
  background: white;
}

.empty-box strong {
  color: #111827;
  font-size: 17px;
}

.empty-box span {
  color: #64748b;
  font-size: 14px;
  line-height: 1.6;
}

@media (max-width: 1100px) {
  .operation-grid,
  .runtime-box,
  .running-control-box {
    grid-template-columns: 1fr;
  }

  .source-card,
  .order-card,
  .segment-card,
  .dispatch-row {
    grid-template-columns: 1fr;
  }

  .order-actions {
    flex-wrap: wrap;
  }
}

@media (max-width: 760px) {
  .panel-title,
  .route-card-top {
    grid-template-columns: 1fr;
    align-items: flex-start;
  }

  .route-side-actions {
    justify-items: start;
    width: 100%;
  }

  .route-summary {
    text-align: left;
  }
}
</style>