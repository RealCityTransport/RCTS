<!-- src/views/Home.vue -->
<!--
RCTS FILE CONTEXT
파일 역할:
- 현재 RCTS의 메인 레이아웃 페이지.
- Header, 좌측 사이트 메뉴, 메인 컨텐츠 영역, 하단 TIP을 조립한다.

현재 운행 규칙:
- 운행중 노선은 왕복 완료 전까지 일반 수정/삭제 불가.
- 운행중이어도 자동운행 OFF만 허용한다.
- 자동운행 OFF 후에는 현재 왕복까지만 마치고 차량이 대기중으로 복귀한다.
- 자동운행 ON이면 왕복 완료 후 설정한 재출발 대기시간 뒤 같은 차량으로 자동 재출발한다.
- 기존 저장 데이터는 로드 시 누락 필드를 보정한다.

차량 규칙:
- 기본 중형버스는 정원 25명, 최고속도 50km/h다.
- 기존 저장된 bus-medium 차량도 로드 시 50km/h로 보정한다.
- 기존 운행중 노선의 vehicleSnapshot도 중형버스라면 50km/h로 보정한다.
-->

<template>
  <main class="app-shell">
    <Header />

    <section class="layout">
      <aside class="sidebar">
        <SiteMenu
          :menu-items="menuItems"
          :active-menu="activeMenu"
          @select-menu="selectMenu"
        />

        <section class="side-card">
          <h3>사이트 상태</h3>

          <dl>
            <dt>회사 상태</dt>
            <dd>{{ hasCompany ? '생성됨' : '없음' }}</dd>

            <dt>회사명</dt>
            <dd>{{ company?.name || '-' }}</dd>

            <dt>선택 메뉴</dt>
            <dd>{{ activeMenuName }}</dd>

            <dt>메뉴 상태</dt>
            <dd>{{ hasCompany ? '연구 기반 개방' : '대시보드만 공개' }}</dd>
          </dl>
        </section>

        <section v-if="hasCompany" class="side-card">
          <h3>연구 상태</h3>

          <dl>
            <dt>진행 중</dt>
            <dd>{{ activeResearchName }}</dd>

            <dt>완료 연구</dt>
            <dd>{{ completedResearch.length }}개</dd>
          </dl>
        </section>

        <section v-if="hasCompany" class="side-card">
          <h3>월드 데이터</h3>

          <dl>
            <dt>등록 시설</dt>
            <dd>{{ facilities.length }}개</dd>

            <dt>보유 차량</dt>
            <dd>{{ vehicles.length }}대</dd>

            <dt>운행 노선</dt>
            <dd>{{ operationRoutes.length }}개</dd>

            <dt>운행중</dt>
            <dd>{{ runningRouteCount }}개</dd>
          </dl>
        </section>

        <section v-if="hasCompany" class="side-card">
          <h3>저장 상태</h3>

          <dl>
            <dt>저장 데이터</dt>
            <dd>{{ storageInfo.hasSavedData ? '있음' : '없음' }}</dd>

            <dt>저장 시각</dt>
            <dd>{{ savedAtText }}</dd>
          </dl>
        </section>

        <section v-if="hasCompany" class="side-card">
          <h3>완료 연구</h3>

          <ul class="research-list">
            <li v-for="research in completedResearchLabels" :key="research">
              {{ research }}
            </li>
          </ul>
        </section>
      </aside>

      <section class="main-area">
        <DashboardPage
          v-if="activeMenu === 'dashboard'"
          :company="company"
          :facilities="facilities"
          :vehicles="vehicles"
          :operation-routes="operationRoutes"
          :current-tick="standardTime.state.tick"
          @create-company="handleCreateCompany"
        />

        <CompanyPage
          v-else-if="activeMenu === 'company'"
          :company="company"
          :completed-research="completedResearch"
          :active-research="activeResearch"
          :current-tick="standardTime.state.tick"
          :storage-info="storageInfo"
          :storage-message="storageMessage"
          :storage-busy="storageBusy"
          @start-research="startResearch"
          @save-world="handleSaveWorld"
          @load-world="handleLoadWorld"
          @delete-world="handleDeleteWorld"
        />

        <FacilityPage
          v-else-if="activeMenu === 'facility'"
          :completed-research="completedResearch"
          :facilities="facilities"
          @add-facility="handleAddFacility"
          @rename-facility="handleRenameFacility"
          @delete-facility="handleDeleteFacility"
        />

        <OperationPage
          v-else-if="activeMenu === 'operation'"
          :completed-research="completedResearch"
          :facilities="facilities"
          :vehicles="vehicles"
          :route-draft="routeDraft"
          :operation-routes="operationRoutes"
          :current-tick="standardTime.state.tick"
          @update-route-draft="handleUpdateRouteDraft"
          @create-operation-route="handleCreateOperationRoute"
          @update-operation-route="handleUpdateOperationRoute"
          @delete-operation-route="handleDeleteOperationRoute"
          @assign-vehicle-to-route="handleAssignVehicleToRoute"
          @start-route="handleStartRoute"
        />

        <VehiclePage
          v-else-if="activeMenu === 'vehicle'"
          :vehicles="vehicles"
          @add-vehicle="handleAddVehicle"
        />

        <FinancePage
          v-else-if="activeMenu === 'finance'"
        />

        <AdministrationPage
          v-else-if="activeMenu === 'administration'"
        />

        <ComingSoonPage
          v-else
          :menu-name="activeMenuName"
        />
      </section>
    </section>

    <footer class="footer-tip">
      <strong>TIP</strong>
      <span>
        기본 중형버스는 25명 / 50km/h 기준이며, 운행중에는 자동운행 OFF만 가능합니다.
      </span>
    </footer>
  </main>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'

import Header from '../components/Header.vue'
import SiteMenu from '../components/layout/SiteMenu.vue'

import DashboardPage from '../components/main/DashboardPage.vue'
import CompanyPage from '../components/main/CompanyPage.vue'
import FacilityPage from '../components/main/FacilityPage.vue'
import OperationPage from '../components/main/OperationPage.vue'
import VehiclePage from '../components/main/VehiclePage.vue'
import FinancePage from '../components/main/FinancePage.vue'
import AdministrationPage from '../components/main/AdministrationPage.vue'
import ComingSoonPage from '../components/main/ComingSoonPage.vue'

import {
  canStartResearch,
  getResearchItem,
  getResearchName,
} from '../data/researchItems'

import {
  getSiteMenuName,
  getVisibleSiteMenus,
  isSiteMenuUnlocked,
} from '../data/siteMenus'

import { standardTime } from '../modules/standardTime'

import {
  calculateRoundTripTicks,
  getSegmentKey,
} from '../modules/routeRuntime'

import {
  deleteWorldState,
  getWorldStorageInfo,
  loadWorldState,
  saveWorldState,
} from '../modules/worldStorage'

const company = ref(null)
const activeMenu = ref('dashboard')
const completedResearch = ref([])
const activeResearch = ref(null)

const facilities = ref([])
const vehicles = ref([])

const routeDraft = ref(createEmptyRouteDraft())
const operationRoutes = ref([])

const storageBusy = ref(false)
const storageMessage = ref('')
const storageInfo = ref({
  hasSavedData: false,
  savedAt: null,
  version: null,
})

const hasCompany = computed(() => {
  return Boolean(company.value)
})

const runningRouteCount = computed(() => {
  return operationRoutes.value.filter((route) => route.status === 'running').length
})

const menuItems = computed(() => {
  return getVisibleSiteMenus({
    hasCompany: hasCompany.value,
  }).map((menu) => {
    return {
      ...menu,
      locked: hasCompany.value && !isSiteMenuUnlocked(menu, completedResearch.value),
    }
  })
})

const activeMenuName = computed(() => {
  return getSiteMenuName(activeMenu.value)
})

const completedResearchLabels = computed(() => {
  if (completedResearch.value.length === 0) {
    return ['완료된 연구 없음']
  }

  return completedResearch.value.map((id) => getResearchName(id))
})

const activeResearchName = computed(() => {
  if (!activeResearch.value) {
    return '없음'
  }

  return getResearchName(activeResearch.value.id)
})

const savedAtText = computed(() => {
  if (!storageInfo.value.savedAt) {
    return '-'
  }

  return formatDateTime(storageInfo.value.savedAt)
})

onMounted(() => {
  restoreSavedWorldOnStart()
})

watch(hasCompany, (value) => {
  if (!value) {
    activeMenu.value = 'dashboard'
  }
})

watch(
  () => standardTime.state.tick,
  () => {
    completeActiveResearchIfReady()
    completeFacilityPermitsIfReady()
    completeOperationRoutesIfReady()
    startAutoDispatchRoutesIfReady()
  },
)

function isResearchDone(researchId) {
  return completedResearch.value.includes(researchId)
}

function selectMenu(menu) {
  if (menu.locked) {
    return
  }

  activeMenu.value = menu.id
}

function startResearch(researchId) {
  const research = getResearchItem(researchId)

  if (!canStartResearch(research, completedResearch.value)) {
    return
  }

  if (activeResearch.value) {
    return
  }

  activeResearch.value = {
    id: research.id,
    startedAtTick: standardTime.state.tick,
    durationTicks: research.durationTicks,
  }
}

function completeActiveResearchIfReady() {
  if (!activeResearch.value) {
    return
  }

  const elapsedTicks = standardTime.state.tick - activeResearch.value.startedAtTick

  if (elapsedTicks < activeResearch.value.durationTicks) {
    return
  }

  if (!isResearchDone(activeResearch.value.id)) {
    completedResearch.value.push(activeResearch.value.id)
  }

  activeResearch.value = null
}

function handleCreateCompany(payload) {
  const id = createId('company')

  company.value = {
    id,
    name: payload.name,
    createdAt: new Date().toISOString(),
  }

  completedResearch.value = []
  activeResearch.value = null
  facilities.value = []
  vehicles.value = []
  routeDraft.value = createEmptyRouteDraft()
  operationRoutes.value = []
  activeMenu.value = 'dashboard'
}

function handleAddFacility(payload) {
  if (!payload?.transportTypeId || !payload?.facilityTypeId) {
    return
  }

  const isFinanceUnlocked = completedResearch.value.includes('finance-basic')
  const isAdministrationUnlocked = completedResearch.value.includes('administration-basic')

  const sameTypeCount = facilities.value.filter((facility) => {
    return facility.facilityTypeId === payload.facilityTypeId
  }).length

  const baseName = `${payload.facilityTypeName} ${sameTypeCount + 1}`

  const permitMinutes = isAdministrationUnlocked ? payload.permitMinutes || 0 : 0
  const permitTicks = permitMinutes * 60
  const permitEndsAtTick = standardTime.state.tick + permitTicks

  const facility = {
    id: createId('facility'),
    name: baseName,
    transportTypeId: payload.transportTypeId,
    transportTypeName: payload.transportTypeName,
    facilityTypeId: payload.facilityTypeId,
    facilityTypeName: payload.facilityTypeName,
    status: isAdministrationUnlocked && permitTicks > 0 ? 'permit-pending' : 'active',
    cost: isFinanceUnlocked ? payload.cost || 0 : 0,
    costApplied: isFinanceUnlocked,
    permitMinutes,
    permitStartedAtTick: isAdministrationUnlocked ? standardTime.state.tick : null,
    permitEndsAtTick: isAdministrationUnlocked && permitTicks > 0 ? permitEndsAtTick : null,
    createdAtTick: standardTime.state.tick,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  facilities.value.push(facility)
}

function handleRenameFacility(payload) {
  const facilityId = payload?.id
  const nextName = String(payload?.name || '').trim()

  if (!facilityId || !nextName) {
    return
  }

  const target = facilities.value.find((facility) => {
    return facility.id === facilityId
  })

  if (!target) {
    return
  }

  target.name = nextName
  target.updatedAt = new Date().toISOString()
  target.updatedAtTick = standardTime.state.tick
}

function handleDeleteFacility(facilityId) {
  if (!facilityId) {
    return
  }

  const isUsedByRunningRoute = operationRoutes.value.some((route) => {
    return route.status === 'running' && route.orderedFacilityIds.includes(facilityId)
  })

  if (isUsedByRunningRoute) {
    storageMessage.value = '운행중인 노선에 포함된 시설은 삭제할 수 없습니다.'
    return
  }

  facilities.value = facilities.value.filter((facility) => {
    return facility.id !== facilityId
  })

  cleanRouteDraftAfterFacilityChange()
  cleanOperationRoutesAfterFacilityChange()
}

function handleAddVehicle(payload) {
  if (!payload?.transportTypeId || !payload?.vehicleTypeId) {
    return
  }

  const sameTypeCount = vehicles.value.filter((vehicle) => {
    return vehicle.vehicleTypeId === payload.vehicleTypeId
  }).length

  const isBasicMediumBus = payload.vehicleTypeId === 'bus-medium'

  const vehicle = {
    id: createId('vehicle'),
    name: `${payload.vehicleTypeName} ${sameTypeCount + 1}`,
    transportTypeId: payload.transportTypeId,
    transportTypeName: payload.transportTypeName,
    vehicleTypeId: payload.vehicleTypeId,
    vehicleTypeName: payload.vehicleTypeName,
    capacity: isBasicMediumBus ? 25 : Number(payload.capacity) || 0,
    maxSpeedKmh: isBasicMediumBus ? 50 : Number(payload.maxSpeedKmh) || 0,
    status: 'standby',
    assignedRouteId: null,
    createdAtTick: standardTime.state.tick,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  vehicles.value.push(vehicle)
}

function handleUpdateRouteDraft(payload) {
  const allowedFacilityIds = new Set(facilities.value.map((facility) => facility.id))

  const orderedFacilityIds = Array.isArray(payload?.orderedFacilityIds)
    ? payload.orderedFacilityIds.filter((facilityId) => allowedFacilityIds.has(facilityId))
    : []

  const isAutoUnlocked = completedResearch.value.includes('bus-auto-dispatch-basic')

  routeDraft.value = {
    name: String(payload?.name || ''),
    dwellSeconds: normalizeDwellSeconds(payload?.dwellSeconds),
    autoDispatchEnabled: isAutoUnlocked ? Boolean(payload?.autoDispatchEnabled) : false,
    autoDispatchIntervalSeconds: isAutoUnlocked
      ? normalizeAutoDispatchIntervalSeconds(payload?.autoDispatchIntervalSeconds)
      : 0,
    orderedFacilityIds,
    segmentDistances: payload?.segmentDistances
      ? cleanSegmentDistances(orderedFacilityIds, payload.segmentDistances)
      : {},
  }
}

function handleCreateOperationRoute(payload) {
  const name = String(payload?.name || '').trim()
  const orderedFacilityIds = Array.isArray(payload?.orderedFacilityIds)
    ? [...payload.orderedFacilityIds]
    : []
  const segmentDistances = payload?.segmentDistances ? { ...payload.segmentDistances } : {}

  const isDwellUnlocked = completedResearch.value.includes('bus-dwell-time-basic')
  const isAutoUnlocked = completedResearch.value.includes('bus-auto-dispatch-basic')

  const dwellSeconds = isDwellUnlocked ? normalizeDwellSeconds(payload?.dwellSeconds) : 0
  const autoDispatchEnabled = isAutoUnlocked ? Boolean(payload?.autoDispatchEnabled) : false
  const autoDispatchIntervalSeconds = isAutoUnlocked
    ? normalizeAutoDispatchIntervalSeconds(payload?.autoDispatchIntervalSeconds)
    : 0

  if (!name) {
    storageMessage.value = '노선명을 입력해야 합니다.'
    return
  }

  if (orderedFacilityIds.length < 2) {
    storageMessage.value = '노선에는 시설이 2개 이상 필요합니다.'
    return
  }

  const hasEveryDistance = orderedFacilityIds.every((facilityId, index) => {
    if (index >= orderedFacilityIds.length - 1) {
      return true
    }

    const nextFacilityId = orderedFacilityIds[index + 1]
    const key = getSegmentKey(facilityId, nextFacilityId)
    const distance = Number(segmentDistances[key] || 0)

    return Number.isFinite(distance) && distance > 0
  })

  if (!hasEveryDistance) {
    storageMessage.value = '모든 구간 거리를 0보다 크게 입력해야 합니다.'
    return
  }

  const route = {
    id: createId('route'),
    name,
    dwellSeconds,
    autoDispatchEnabled,
    autoDispatchIntervalSeconds,
    nextAutoDispatchAtTick: null,
    orderedFacilityIds,
    segmentDistances: cleanSegmentDistances(orderedFacilityIds, segmentDistances),
    assignedVehicleId: null,
    vehicleSnapshot: null,
    status: 'waiting',
    startedAtTick: null,
    completedAtTick: null,
    roundTripTicks: null,
    createdAtTick: standardTime.state.tick,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  operationRoutes.value.push(route)
  routeDraft.value = createEmptyRouteDraft()
  storageMessage.value = `${name} 노선을 생성했습니다.`
}

function handleUpdateOperationRoute(payload) {
  const routeId = payload?.routeId
  const route = operationRoutes.value.find((item) => item.id === routeId)

  if (!route) {
    return
  }

  const isDwellUnlocked = completedResearch.value.includes('bus-dwell-time-basic')
  const isAutoUnlocked = completedResearch.value.includes('bus-auto-dispatch-basic')

  if (route.status === 'running') {
    if (isAutoUnlocked && payload.autoDispatchEnabled === false) {
      route.autoDispatchEnabled = false
      route.nextAutoDispatchAtTick = null
      route.updatedAt = new Date().toISOString()
      route.updatedAtTick = standardTime.state.tick
      storageMessage.value = '자동운행을 해제했습니다. 현재 왕복 완료 후 수동 상태로 전환됩니다.'
      return
    }

    storageMessage.value = '운행중인 노선은 왕복 완료 전까지 수정할 수 없습니다.'
    return
  }

  if (typeof payload.name === 'string') {
    const nextName = payload.name.trim()

    if (nextName) {
      route.name = nextName
    }
  }

  if (payload.segmentDistances) {
    route.segmentDistances = cleanSegmentDistances(
      route.orderedFacilityIds,
      payload.segmentDistances,
    )
  }

  if (isDwellUnlocked && payload.dwellSeconds !== undefined) {
    route.dwellSeconds = normalizeDwellSeconds(payload.dwellSeconds)
  }

  if (isAutoUnlocked && payload.autoDispatchEnabled !== undefined) {
    route.autoDispatchEnabled = Boolean(payload.autoDispatchEnabled)
  }

  if (isAutoUnlocked && payload.autoDispatchIntervalSeconds !== undefined) {
    route.autoDispatchIntervalSeconds = normalizeAutoDispatchIntervalSeconds(
      payload.autoDispatchIntervalSeconds,
    )
  }

  if (!route.autoDispatchEnabled) {
    route.nextAutoDispatchAtTick = null

    if (route.status === 'auto-waiting') {
      route.status = route.assignedVehicleId ? 'ready' : 'completed'
    }
  }

  if (route.autoDispatchEnabled && route.status === 'auto-waiting') {
    route.nextAutoDispatchAtTick =
      standardTime.state.tick + normalizeAutoDispatchIntervalSeconds(route.autoDispatchIntervalSeconds)
  }

  route.updatedAt = new Date().toISOString()
  route.updatedAtTick = standardTime.state.tick
}

function handleDeleteOperationRoute(routeId) {
  if (!routeId) {
    return
  }

  const route = operationRoutes.value.find((item) => item.id === routeId)

  if (!route) {
    return
  }

  if (route.status === 'running') {
    storageMessage.value = '운행중인 노선은 왕복 완료 전까지 삭제할 수 없습니다.'
    return
  }

  if (route.assignedVehicleId) {
    releaseVehicle(route.assignedVehicleId)
  }

  operationRoutes.value = operationRoutes.value.filter((item) => {
    return item.id !== routeId
  })

  storageMessage.value = `${route.name} 노선을 삭제했습니다.`
}

function handleAssignVehicleToRoute(payload) {
  const routeId = payload?.routeId
  const vehicleId = payload?.vehicleId || null

  const route = operationRoutes.value.find((item) => item.id === routeId)

  if (!route || route.status === 'running') {
    return
  }

  if (route.assignedVehicleId) {
    releaseVehicle(route.assignedVehicleId)
  }

  if (!vehicleId) {
    route.assignedVehicleId = null
    route.nextAutoDispatchAtTick = null
    route.status = route.status === 'completed' ? 'completed' : 'waiting'
    route.updatedAt = new Date().toISOString()
    return
  }

  const vehicle = vehicles.value.find((item) => item.id === vehicleId)

  if (!vehicle) {
    return
  }

  const isUsedByOtherRoute = operationRoutes.value.some((item) => {
    return item.id !== route.id && item.assignedVehicleId === vehicle.id
  })

  if (isUsedByOtherRoute || vehicle.status === 'running') {
    storageMessage.value = '이미 다른 노선에서 사용 중인 차량입니다.'
    return
  }

  vehicle.status = 'assigned'
  vehicle.assignedRouteId = route.id
  vehicle.updatedAt = new Date().toISOString()
  vehicle.updatedAtTick = standardTime.state.tick

  route.assignedVehicleId = vehicle.id
  route.status = 'ready'
  route.nextAutoDispatchAtTick = null
  route.updatedAt = new Date().toISOString()
  route.updatedAtTick = standardTime.state.tick
}

function handleStartRoute(routeId) {
  const route = operationRoutes.value.find((item) => item.id === routeId)

  if (!route) {
    return
  }

  if (route.status === 'running') {
    return
  }

  if (!route.assignedVehicleId) {
    storageMessage.value = '배차된 차량이 없습니다.'
    return
  }

  startRouteInternal(route)
}

function startRouteInternal(route) {
  const vehicle = vehicles.value.find((item) => item.id === route.assignedVehicleId)

  if (!vehicle) {
    storageMessage.value = '배차된 차량을 찾을 수 없습니다.'
    return false
  }

  normalizeVehicle(vehicle)

  const roundTripTicks = calculateRoundTripTicks(route, facilities.value, vehicle)

  if (roundTripTicks <= 0) {
    storageMessage.value = '거리 또는 차량 속도 정보가 부족해 운행을 시작할 수 없습니다.'
    return false
  }

  route.status = 'running'
  route.startedAtTick = standardTime.state.tick
  route.completedAtTick = null
  route.nextAutoDispatchAtTick = null
  route.roundTripTicks = roundTripTicks
  route.vehicleSnapshot = {
    id: vehicle.id,
    name: vehicle.name,
    capacity: vehicle.capacity,
    maxSpeedKmh: vehicle.maxSpeedKmh,
    vehicleTypeName: vehicle.vehicleTypeName,
    transportTypeName: vehicle.transportTypeName,
  }
  route.updatedAt = new Date().toISOString()
  route.updatedAtTick = standardTime.state.tick

  vehicle.status = 'running'
  vehicle.assignedRouteId = route.id
  vehicle.updatedAt = new Date().toISOString()
  vehicle.updatedAtTick = standardTime.state.tick

  return true
}

function completeOperationRoutesIfReady() {
  operationRoutes.value.forEach((route) => {
    if (route.status !== 'running') {
      return
    }

    let roundTripTicks = Number(route.roundTripTicks || 0)
    const startedAtTick =
      route.startedAtTick === null || route.startedAtTick === undefined
        ? standardTime.state.tick
        : Number(route.startedAtTick)

    if (!route.startedAtTick && route.startedAtTick !== 0) {
      route.startedAtTick = standardTime.state.tick
    }

    if (roundTripTicks <= 0) {
      const vehicle =
        route.vehicleSnapshot ||
        vehicles.value.find((item) => item.id === route.assignedVehicleId)

      roundTripTicks = calculateRoundTripTicks(route, facilities.value, vehicle)
      route.roundTripTicks = roundTripTicks
    }

    if (roundTripTicks <= 0) {
      return
    }

    if (standardTime.state.tick < startedAtTick + roundTripTicks) {
      return
    }

    const completedVehicleId = route.assignedVehicleId

    route.completedAtTick = standardTime.state.tick
    route.lastRoundTripTicks = roundTripTicks
    route.startedAtTick = null
    route.roundTripTicks = null
    route.vehicleSnapshot = null
    route.updatedAt = new Date().toISOString()
    route.updatedAtTick = standardTime.state.tick

    if (route.autoDispatchEnabled && completedVehicleId) {
      route.status = 'auto-waiting'
      route.assignedVehicleId = completedVehicleId
      route.nextAutoDispatchAtTick =
        standardTime.state.tick + normalizeAutoDispatchIntervalSeconds(route.autoDispatchIntervalSeconds)

      const vehicle = vehicles.value.find((item) => item.id === completedVehicleId)

      if (vehicle) {
        vehicle.status = 'assigned'
        vehicle.assignedRouteId = route.id
        vehicle.updatedAt = new Date().toISOString()
        vehicle.updatedAtTick = standardTime.state.tick
      }

      return
    }

    route.status = 'completed'
    route.assignedVehicleId = null
    route.nextAutoDispatchAtTick = null

    if (completedVehicleId) {
      releaseVehicle(completedVehicleId)
    }
  })
}

function startAutoDispatchRoutesIfReady() {
  operationRoutes.value.forEach((route) => {
    if (route.status !== 'auto-waiting') {
      return
    }

    if (!route.autoDispatchEnabled || !route.assignedVehicleId) {
      return
    }

    if (route.nextAutoDispatchAtTick === null || route.nextAutoDispatchAtTick === undefined) {
      route.nextAutoDispatchAtTick =
        standardTime.state.tick + normalizeAutoDispatchIntervalSeconds(route.autoDispatchIntervalSeconds)
      return
    }

    if (standardTime.state.tick < route.nextAutoDispatchAtTick) {
      return
    }

    startRouteInternal(route)
  })
}

function releaseVehicle(vehicleId) {
  const vehicle = vehicles.value.find((item) => item.id === vehicleId)

  if (!vehicle) {
    return
  }

  vehicle.status = 'standby'
  vehicle.assignedRouteId = null
  vehicle.updatedAt = new Date().toISOString()
  vehicle.updatedAtTick = standardTime.state.tick
}

function completeFacilityPermitsIfReady() {
  facilities.value.forEach((facility) => {
    if (facility.status !== 'permit-pending') {
      return
    }

    if (!facility.permitEndsAtTick) {
      return
    }

    if (standardTime.state.tick < facility.permitEndsAtTick) {
      return
    }

    facility.status = 'active'
    facility.permitCompletedAtTick = standardTime.state.tick
    facility.updatedAt = new Date().toISOString()
    facility.updatedAtTick = standardTime.state.tick
  })
}

function cleanRouteDraftAfterFacilityChange() {
  const allowedFacilityIds = new Set(facilities.value.map((facility) => facility.id))

  const orderedFacilityIds = routeDraft.value.orderedFacilityIds.filter((facilityId) => {
    return allowedFacilityIds.has(facilityId)
  })

  routeDraft.value = {
    ...routeDraft.value,
    orderedFacilityIds,
    segmentDistances: cleanSegmentDistances(orderedFacilityIds, routeDraft.value.segmentDistances),
  }
}

function cleanOperationRoutesAfterFacilityChange() {
  const allowedFacilityIds = new Set(facilities.value.map((facility) => facility.id))

  operationRoutes.value = operationRoutes.value
    .map((route) => {
      const orderedFacilityIds = route.orderedFacilityIds.filter((facilityId) => {
        return allowedFacilityIds.has(facilityId)
      })

      return {
        ...route,
        orderedFacilityIds,
        segmentDistances: cleanSegmentDistances(orderedFacilityIds, route.segmentDistances),
      }
    })
    .filter((route) => route.orderedFacilityIds.length >= 2)
}

function cleanSegmentDistances(orderedFacilityIds, currentDistances = {}) {
  const validKeys = new Set()

  for (let index = 0; index < orderedFacilityIds.length - 1; index += 1) {
    validKeys.add(getSegmentKey(orderedFacilityIds[index], orderedFacilityIds[index + 1]))
  }

  const nextDistances = {}

  Object.entries(currentDistances || {}).forEach(([key, value]) => {
    if (validKeys.has(key)) {
      nextDistances[key] = value
    }
  })

  return nextDistances
}

function normalizeVehicle(vehicle) {
  if (!vehicle) {
    return null
  }

  if (vehicle.vehicleTypeId !== 'bus-medium') {
    return vehicle
  }

  vehicle.vehicleTypeName = vehicle.vehicleTypeName || '중형버스'
  vehicle.capacity = 25
  vehicle.maxSpeedKmh = 50

  return vehicle
}

function normalizeLoadedVehicles() {
  vehicles.value = vehicles.value.map((vehicle) => {
    if (vehicle.vehicleTypeId !== 'bus-medium') {
      return vehicle
    }

    return {
      ...vehicle,
      vehicleTypeName: vehicle.vehicleTypeName || '중형버스',
      capacity: 25,
      maxSpeedKmh: 50,
    }
  })
}

function normalizeRouteVehicleSnapshot(route) {
  if (!route?.vehicleSnapshot) {
    return route
  }

  const assignedVehicle = vehicles.value.find((vehicle) => {
    return vehicle.id === route.assignedVehicleId
  })

  const isMediumBusSnapshot =
    route.vehicleSnapshot.vehicleTypeName === '중형버스' ||
    assignedVehicle?.vehicleTypeId === 'bus-medium'

  if (!isMediumBusSnapshot) {
    return route
  }

  route.vehicleSnapshot = {
    ...route.vehicleSnapshot,
    vehicleTypeName: route.vehicleSnapshot.vehicleTypeName || '중형버스',
    capacity: 25,
    maxSpeedKmh: 50,
  }

  return route
}

function normalizeLoadedRoutes() {
  operationRoutes.value = operationRoutes.value.map((route) => {
    const normalizedRoute = {
      ...route,
      name: route.name || '이름 없는 노선',
      dwellSeconds: normalizeDwellSeconds(route.dwellSeconds),
      autoDispatchEnabled: Boolean(route.autoDispatchEnabled),
      autoDispatchIntervalSeconds: normalizeAutoDispatchIntervalSeconds(
        route.autoDispatchIntervalSeconds,
      ),
      nextAutoDispatchAtTick:
        route.nextAutoDispatchAtTick === undefined ? null : route.nextAutoDispatchAtTick,
      orderedFacilityIds: Array.isArray(route.orderedFacilityIds)
        ? [...route.orderedFacilityIds]
        : [],
      segmentDistances: route.segmentDistances ? { ...route.segmentDistances } : {},
      assignedVehicleId: route.assignedVehicleId || null,
      vehicleSnapshot: route.vehicleSnapshot || null,
      status: route.status || 'waiting',
      startedAtTick:
        route.startedAtTick === undefined ? null : route.startedAtTick,
      completedAtTick:
        route.completedAtTick === undefined ? null : route.completedAtTick,
      roundTripTicks:
        route.roundTripTicks === undefined ? null : route.roundTripTicks,
    }

    normalizeRouteVehicleSnapshot(normalizedRoute)

    if (!['waiting', 'ready', 'running', 'auto-waiting', 'completed'].includes(normalizedRoute.status)) {
      normalizedRoute.status = normalizedRoute.assignedVehicleId ? 'ready' : 'waiting'
    }

    if (normalizedRoute.status === 'running') {
      if (!normalizedRoute.assignedVehicleId) {
        normalizedRoute.status = 'completed'
        normalizedRoute.startedAtTick = null
        normalizedRoute.roundTripTicks = null
      } else {
        const vehicle =
          normalizedRoute.vehicleSnapshot ||
          vehicles.value.find((item) => item.id === normalizedRoute.assignedVehicleId)

        normalizedRoute.roundTripTicks = calculateRoundTripTicks(
          normalizedRoute,
          facilities.value,
          vehicle,
        )

        if (normalizedRoute.startedAtTick === null || normalizedRoute.startedAtTick === undefined) {
          normalizedRoute.startedAtTick = standardTime.state.tick
        }
      }
    }

    if (normalizedRoute.status === 'auto-waiting') {
      if (!normalizedRoute.autoDispatchEnabled) {
        normalizedRoute.status = normalizedRoute.assignedVehicleId ? 'ready' : 'completed'
        normalizedRoute.nextAutoDispatchAtTick = null
      } else if (!normalizedRoute.assignedVehicleId) {
        normalizedRoute.status = 'completed'
        normalizedRoute.nextAutoDispatchAtTick = null
      } else if (
        normalizedRoute.nextAutoDispatchAtTick === null ||
        normalizedRoute.nextAutoDispatchAtTick === undefined
      ) {
        normalizedRoute.nextAutoDispatchAtTick =
          standardTime.state.tick +
          normalizeAutoDispatchIntervalSeconds(normalizedRoute.autoDispatchIntervalSeconds)
      }
    }

    return normalizedRoute
  })

  vehicles.value.forEach((vehicle) => {
    const route = operationRoutes.value.find((item) => item.assignedVehicleId === vehicle.id)

    if (!route) {
      if (vehicle.status === 'running' || vehicle.status === 'assigned') {
        vehicle.status = 'standby'
        vehicle.assignedRouteId = null
      }

      return
    }

    vehicle.status = route.status === 'running' ? 'running' : 'assigned'
    vehicle.assignedRouteId = route.id
  })
}

function createWorldSnapshot() {
  return {
    version: 7,
    savedAtTick: standardTime.state.tick,
    company: company.value,
    activeMenu: activeMenu.value,
    completedResearch: [...completedResearch.value],
    activeResearch: activeResearch.value ? { ...activeResearch.value } : null,
    facilities: facilities.value.map((facility) => ({ ...facility })),
    vehicles: vehicles.value.map((vehicle) => ({ ...vehicle })),
    routeDraft: {
      name: routeDraft.value.name,
      dwellSeconds: normalizeDwellSeconds(routeDraft.value.dwellSeconds),
      autoDispatchEnabled: Boolean(routeDraft.value.autoDispatchEnabled),
      autoDispatchIntervalSeconds: normalizeAutoDispatchIntervalSeconds(
        routeDraft.value.autoDispatchIntervalSeconds,
      ),
      orderedFacilityIds: [...routeDraft.value.orderedFacilityIds],
      segmentDistances: { ...routeDraft.value.segmentDistances },
    },
    operationRoutes: operationRoutes.value.map((route) => ({ ...route })),
  }
}

function applyWorldSnapshot(snapshot) {
  if (!snapshot) {
    return
  }

  company.value = snapshot.company || null
  activeMenu.value = snapshot.activeMenu || 'dashboard'
  completedResearch.value = Array.isArray(snapshot.completedResearch)
    ? [...snapshot.completedResearch]
    : []
  activeResearch.value = snapshot.activeResearch ? { ...snapshot.activeResearch } : null
  facilities.value = Array.isArray(snapshot.facilities)
    ? snapshot.facilities.map((facility) => ({ ...facility }))
    : []
  vehicles.value = Array.isArray(snapshot.vehicles)
    ? snapshot.vehicles.map((vehicle) => ({ ...vehicle }))
    : []

  normalizeLoadedVehicles()

  const savedDraft = snapshot.routeDraft || snapshot.operationDraft || createEmptyRouteDraft()

  routeDraft.value = {
    name: savedDraft.name || '',
    dwellSeconds: normalizeDwellSeconds(savedDraft.dwellSeconds),
    autoDispatchEnabled: Boolean(savedDraft.autoDispatchEnabled),
    autoDispatchIntervalSeconds: normalizeAutoDispatchIntervalSeconds(
      savedDraft.autoDispatchIntervalSeconds,
    ),
    orderedFacilityIds: Array.isArray(savedDraft.orderedFacilityIds)
      ? [...savedDraft.orderedFacilityIds]
      : [],
    segmentDistances: savedDraft.segmentDistances
      ? { ...savedDraft.segmentDistances }
      : {},
  }

  operationRoutes.value = Array.isArray(snapshot.operationRoutes)
    ? snapshot.operationRoutes.map((route) => ({ ...route }))
    : []

  normalizeLoadedRoutes()
  completeActiveResearchIfReady()
  completeFacilityPermitsIfReady()
  completeOperationRoutesIfReady()
  startAutoDispatchRoutesIfReady()
  cleanRouteDraftAfterFacilityChange()
  cleanOperationRoutesAfterFacilityChange()
}

async function restoreSavedWorldOnStart() {
  storageBusy.value = true

  try {
    const record = await loadWorldState()

    if (!record) {
      storageInfo.value = await getWorldStorageInfo()
      return
    }

    applyWorldSnapshot(record.data)

    storageInfo.value = {
      hasSavedData: true,
      savedAt: record.savedAt,
      version: record.version,
    }

    storageMessage.value = '저장된 월드를 불러왔습니다.'
  } catch (error) {
    console.error(error)
    storageMessage.value = '저장 데이터를 불러오지 못했습니다.'
  } finally {
    storageBusy.value = false
  }
}

async function handleSaveWorld() {
  if (!company.value) {
    storageMessage.value = '저장할 회사가 없습니다.'
    return
  }

  if (!completedResearch.value.includes('save-local-basic')) {
    storageMessage.value = '기초 저장 기능 연구가 필요합니다.'
    return
  }

  storageBusy.value = true

  try {
    const record = await saveWorldState(createWorldSnapshot())

    storageInfo.value = {
      hasSavedData: true,
      savedAt: record.savedAt,
      version: record.version,
    }

    storageMessage.value = '현재 상태를 IndexedDB에 수동 저장했습니다.'
  } catch (error) {
    console.error(error)
    storageMessage.value = '저장에 실패했습니다.'
  } finally {
    storageBusy.value = false
  }
}

async function handleLoadWorld() {
  if (!completedResearch.value.includes('save-local-basic')) {
    storageMessage.value = '기초 저장 기능 연구가 필요합니다.'
    return
  }

  storageBusy.value = true

  try {
    const record = await loadWorldState()

    if (!record) {
      storageMessage.value = '불러올 저장 데이터가 없습니다.'
      storageInfo.value = await getWorldStorageInfo()
      return
    }

    applyWorldSnapshot(record.data)

    storageInfo.value = {
      hasSavedData: true,
      savedAt: record.savedAt,
      version: record.version,
    }

    storageMessage.value = '저장된 월드를 불러왔습니다.'
  } catch (error) {
    console.error(error)
    storageMessage.value = '불러오기에 실패했습니다.'
  } finally {
    storageBusy.value = false
  }
}

async function handleDeleteWorld() {
  if (!completedResearch.value.includes('save-local-basic')) {
    storageMessage.value = '기초 저장 기능 연구가 필요합니다.'
    return
  }

  storageBusy.value = true

  try {
    await deleteWorldState()

    storageInfo.value = {
      hasSavedData: false,
      savedAt: null,
      version: null,
    }

    storageMessage.value = 'IndexedDB 저장 데이터를 삭제했습니다.'
  } catch (error) {
    console.error(error)
    storageMessage.value = '저장 데이터 삭제에 실패했습니다.'
  } finally {
    storageBusy.value = false
  }
}

function createEmptyRouteDraft() {
  return {
    name: '',
    dwellSeconds: 0,
    autoDispatchEnabled: false,
    autoDispatchIntervalSeconds: 0,
    orderedFacilityIds: [],
    segmentDistances: {},
  }
}

function normalizeDwellSeconds(value) {
  const dwellSeconds = Number(value || 0)

  if (!Number.isFinite(dwellSeconds) || dwellSeconds < 0) {
    return 0
  }

  return Math.floor(dwellSeconds)
}

function normalizeAutoDispatchIntervalSeconds(value) {
  const seconds = Number(value || 0)

  if (!Number.isFinite(seconds) || seconds < 0) {
    return 0
  }

  return Math.floor(seconds)
}

function createId(prefix) {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function formatDateTime(value) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')

  return `${year}.${month}.${day} ${hour}:${minute}`
}
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.app-shell {
  --header-bg: #172033;
  --header-card-bg: #26334d;
  --news-bg: #0f172a;
  --news-label-bg: #2563eb;
  --workspace-bg: #d8e0ec;
  --sidebar-bg: #101827;
  --sidebar-card-bg: #1c2940;
  --main-bg: #edf2f7;
  --panel-bg: #ffffff;
  --panel-border: #cfd8e5;
  --text-main: #111827;
  --text-soft: #64748b;
  --blue: #2563eb;
  --blue-dark: #1e3a8a;
  --green: #15803d;
  --orange: #f97316;

  min-height: 100vh;
  background: var(--workspace-bg);
  color: var(--text-main);
  font-family:
    Pretendard,
    Inter,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    sans-serif;
}

.layout {
  min-height: calc(100vh - 150px);
  display: grid;
  grid-template-columns: 232px minmax(0, 1fr);
  gap: 0;
  background: var(--workspace-bg);
}

.sidebar {
  padding: 18px 14px;
  color: white;
  background:
    linear-gradient(180deg, rgba(37, 99, 235, 0.1), transparent 32%),
    var(--sidebar-bg);
  border-right: 1px solid rgba(255, 255, 255, 0.08);
}

.side-card {
  margin-top: 28px;
  padding: 14px;
  border-radius: 10px;
  background: var(--sidebar-card-bg);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.side-card h3 {
  margin: 0 0 12px;
  font-size: 15px;
}

.side-card dl {
  margin: 0;
}

.side-card dt {
  margin-top: 12px;
  color: #cbd5e1;
  font-size: 12px;
}

.side-card dd {
  margin: 4px 0 0;
  color: white;
  font-size: 14px;
  word-break: keep-all;
}

.research-list {
  display: flex;
  flex-direction: column;
  gap: 7px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.research-list li {
  color: #dbeafe;
  font-size: 13px;
  line-height: 1.45;
}

.main-area {
  min-width: 0;
  padding: 18px;
  background: var(--main-bg);
}

.footer-tip {
  min-height: 38px;
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 0 24px;
  color: #dbeafe;
  font-size: 13px;
  background: #111827;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.footer-tip strong {
  color: #93c5fd;
}

@media (max-width: 820px) {
  .layout {
    grid-template-columns: 1fr;
  }

  .sidebar {
    padding: 14px;
    border-right: 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .main-area {
    padding: 10px;
  }

  .footer-tip {
    height: auto;
    padding: 12px 16px;
    align-items: flex-start;
  }
}
</style>