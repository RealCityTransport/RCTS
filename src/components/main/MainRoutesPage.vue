<!-- src/components/main/MainRoutesPage.vue -->
<template>
  <div class="routes-page">
    <!-- 상단 헤더 카드 -->
    <section class="page-header-card">
      <header class="page-header">
        <h2 class="page-title">노선 관리</h2>
        <p class="page-desc">
          도시 전체의 주요 노선들을 설계·편집하고, 혼잡도와 수익성을 관리하는 영역입니다.
        </p>
      </header>
    </section>

    <!-- 상단 툴바 (검색/필터/추가) -->
    <RoutesToolbar
      :search-text="searchText"
      :status-filter="statusFilter"
      :sort-key="sortKey"
      :total-count="filteredRoutes.length"
      @update:search-text="val => (searchText = val)"
      @update:status-filter="val => (statusFilter = val)"
      @update:sort-key="val => (sortKey = val)"
      @create-route="handleCreateRoute"
    />

    <!-- 메인 3열 레이아웃 카드 -->
    <section class="routes-layout-card">
      <section class="routes-layout">
        <!-- 1️⃣ 좌측: 노선 목록 -->
        <RoutesListPanel
          :routes="filteredRoutes"
          :selected-route-id="selectedRouteId"
          @select-route="handleSelectRoute"
        />

        <!-- 2️⃣ 가운데: 정류장 & 역 리스트 -->
        <RoutesStopsPanel
          :route="selectedRoute"
          :selected-stop-id="selectedStopId"
          @request-add-stop="handleAddStop"
          @reorder-stops="handleReorderStops"
          @select-stop="handleSelectStop"
        />

        <!-- 3️⃣ 우측: 노선 상세 + 정류장 상세 -->
        <section class="right-column">
          <RouteDetailPanel
            :route="selectedRoute"
            @update-route="handleUpdateRoute"
          />

          <StopDetailPanel
            :route="selectedRoute"
            :stop="selectedStop"
            @update-stop="handleUpdateStop"
          />
        </section>
      </section>
    </section>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

import RoutesToolbar from '@/components/routes/RoutesToolbar.vue'
import RoutesListPanel from '@/components/routes/RoutesListPanel.vue'
import RoutesStopsPanel from '@/components/routes/RoutesStopsPanel.vue'
import RouteDetailPanel from '@/components/routes/RouteDetailPanel.vue'
import StopDetailPanel from '@/components/routes/StopDetailPanel.vue'

/**
 * 더미 노선 데이터
 * 나중에 Firebase Realtime Database 연동으로 대체 예정
 */
const routes = ref([
  {
    id: 'route-001',
    name: '도심 순환 A',
    type: 'virtual',
    status: 'active',
    tags: ['가상', '기본'],
    stopsCount: 8,
    stops: [
      { id: 'r1-s01', seq: 1, name: '시청광장', kind: 'station', role: 'hub' },
      { id: 'r1-s02', seq: 2, name: '중앙로입구', kind: 'stop', role: 'normal' },
      { id: 'r1-s03', seq: 3, name: '오피스지구', kind: 'stop', role: 'normal' },
      { id: 'r1-s04', seq: 4, name: '하천공원', kind: 'stop', role: 'normal' },
      { id: 'r1-s05', seq: 5, name: '주거1구역', kind: 'stop', role: 'normal' },
      { id: 'r1-s06', seq: 6, name: '주거2구역', kind: 'stop', role: 'normal' },
      { id: 'r1-s07', seq: 7, name: '상업지구', kind: 'stop', role: 'normal' },
      { id: 'r1-s08', seq: 8, name: '환승센터', kind: 'station', role: 'hub' },
    ],
    lastUpdatedAt: '2025-12-29 09:30',
    createdAt: '2025-12-28 21:10',
    avgLoadFactor: 0.78,
    revenueSummary: {
      lastHour: 1250000,
      lastDay: 8450000,
      total: 18250000,
    },
  },
  {
    id: 'route-002',
    name: '시설 연계 셔틀 B',
    type: 'facility',
    status: 'paused',
    tags: ['시설', '셔틀'],
    stopsCount: 4,
    stops: [
      { id: 'r2-s01', seq: 1, name: '환승센터', kind: 'station', role: 'hub' },
      { id: 'r2-s02', seq: 2, name: '산업단지입구', kind: 'stop', role: 'normal' },
      { id: 'r2-s03', seq: 3, name: '물류센터', kind: 'stop', role: 'facility' },
      { id: 'r2-s04', seq: 4, name: '연구단지', kind: 'stop', role: 'facility' },
    ],
    lastUpdatedAt: '2025-12-28 23:05',
    createdAt: '2025-12-28 19:42',
    avgLoadFactor: 0.92,
    revenueSummary: {
      lastHour: 0,
      lastDay: 2130000,
      total: 9100000,
    },
  },
  {
    id: 'route-003',
    name: '도심 – 외곽 직통 C',
    type: 'real',
    status: 'draft',
    tags: ['직통', '고정'],
    stopsCount: 3,
    stops: [
      { id: 'r3-s01', seq: 1, name: '도심역', kind: 'station', role: 'hub' },
      { id: 'r3-s02', seq: 2, name: '순환외곽선 환승', kind: 'station', role: 'transfer' },
      { id: 'r3-s03', seq: 3, name: '외곽터미널', kind: 'station', role: 'terminal' },
    ],
    lastUpdatedAt: '2025-12-27 17:20',
    createdAt: '2025-12-27 15:03',
    avgLoadFactor: 0.61,
    revenueSummary: {
      lastHour: 340000,
      lastDay: 5200000,
      total: 13200000,
    },
  },
])

/* 검색/필터/정렬 상태 */
const searchText = ref('')
const statusFilter = ref('all')
const sortKey = ref('updated-desc')

/* 선택 상태 */
const selectedRouteId = ref(routes.value[0]?.id ?? null)
const selectedStopId = ref(null)

/* 필터링된 노선 리스트 */
const filteredRoutes = computed(() => {
  let list = [...routes.value]

  // 검색
  const keyword = searchText.value.trim().toLowerCase()
  if (keyword) {
    list = list.filter((r) => {
      const name = (r.name ?? '').toLowerCase()
      const tags = (r.tags ?? []).join(' ').toLowerCase()
      return name.includes(keyword) || tags.includes(keyword)
    })
  }

  // 상태 필터
  if (statusFilter.value !== 'all') {
    list = list.filter((r) => r.status === statusFilter.value)
  }

  // 정렬
  switch (sortKey.value) {
    case 'name-asc':
      list.sort((a, b) => a.name.localeCompare(b.name))
      break
    case 'name-desc':
      list.sort((a, b) => b.name.localeCompare(a.name))
      break
    case 'updated-desc':
    default:
      list.sort((a, b) => (b.lastUpdatedAt || '').localeCompare(a.lastUpdatedAt || ''))
      break
  }

  return list
})

/* 선택된 노선/정류장 계산 */
const selectedRoute = computed(() => {
  return filteredRoutes.value.find((r) => r.id === selectedRouteId.value) ?? null
})

const selectedStop = computed(() => {
  const route = selectedRoute.value
  if (!route || !Array.isArray(route.stops)) return null
  return route.stops.find((s) => s.id === selectedStopId.value) ?? null
})

/* 새 노선 생성 */
function handleCreateRoute() {
  const nextIndex = routes.value.length + 1
  const newId = `route-${String(nextIndex).padStart(3, '0')}`
  const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ')

  const newRoute = {
    id: newId,
    name: `새 노선 ${nextIndex}`,
    type: 'virtual',
    status: 'draft',
    tags: ['초기', '미완성'],
    stopsCount: 0,
    stops: [],
    createdAt: nowStr,
    lastUpdatedAt: nowStr,
    avgLoadFactor: 0,
    revenueSummary: {
      lastHour: 0,
      lastDay: 0,
      total: 0,
    },
  }

  routes.value.unshift(newRoute)
  selectedRouteId.value = newId
  selectedStopId.value = null
}

/* 노선 선택 */
function handleSelectRoute(routeId) {
  selectedRouteId.value = routeId
  selectedStopId.value = null
}

/* 정류장 선택 */
function handleSelectStop(stopId) {
  selectedStopId.value = stopId
}

/* 정류장 추가 */
function handleAddStop() {
  const route = selectedRoute.value
  if (!route) return

  const routeIndex = routes.value.findIndex((r) => r.id === route.id)
  if (routeIndex === -1) return

  const currentStops = Array.isArray(routes.value[routeIndex].stops)
    ? [...routes.value[routeIndex].stops]
    : []

  const nextSeq =
    currentStops.reduce((max, s) => Math.max(max, s.seq || 0), 0) + 1

  const newStopId = `${route.id}-s${String(nextSeq).padStart(2, '0')}`

  const newStop = {
    id: newStopId,
    seq: nextSeq,
    name: `새 정류장 ${nextSeq}`,
    kind: 'stop',
    role: 'normal',
  }

  currentStops.push(newStop)

  const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ')

  routes.value[routeIndex] = {
    ...routes.value[routeIndex],
    stops: currentStops,
    stopsCount: currentStops.length,
    lastUpdatedAt: nowStr,
  }

  selectedStopId.value = newStopId
}

/* 정류장 순서 재정렬 (드래그) */
function handleReorderStops(newStops) {
  const route = selectedRoute.value
  if (!route) return

  const routeIndex = routes.value.findIndex((r) => r.id === route.id)
  if (routeIndex === -1) return

  const safeStops = Array.isArray(newStops) ? newStops : []
  const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ')

  routes.value[routeIndex] = {
    ...routes.value[routeIndex],
    stops: safeStops,
    stopsCount: safeStops.length,
    lastUpdatedAt: nowStr,
  }
}

/* 노선 정보 업데이트 (이름 변경 등) */
function handleUpdateRoute(updatedRoute) {
  const route = selectedRoute.value
  if (!route || !updatedRoute) return

  const routeIndex = routes.value.findIndex((r) => r.id === route.id)
  if (routeIndex === -1) return

  const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ')

  routes.value[routeIndex] = {
    ...routes.value[routeIndex],
    ...updatedRoute,
    lastUpdatedAt: nowStr,
  }

  selectedRouteId.value = routes.value[routeIndex].id
}

/* 정류장 정보 업데이트 (이름 변경 등) */
function handleUpdateStop(updatedStop) {
  const route = selectedRoute.value
  if (!route || !updatedStop) return

  const routeIndex = routes.value.findIndex((r) => r.id === route.id)
  if (routeIndex === -1) return

  const oldStops = Array.isArray(routes.value[routeIndex].stops)
    ? [...routes.value[routeIndex].stops]
    : []

  const stopIndex = oldStops.findIndex((s) => s.id === updatedStop.id)
  if (stopIndex === -1) return

  oldStops[stopIndex] = {
    ...oldStops[stopIndex],
    ...updatedStop,
  }

  const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ')

  routes.value[routeIndex] = {
    ...routes.value[routeIndex],
    stops: oldStops,
    stopsCount: oldStops.length,
    lastUpdatedAt: nowStr,
  }

  selectedStopId.value = updatedStop.id
}
</script>

<style scoped>
.routes-page {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 상단 헤더 카드 틀 */
.page-header-card {
  padding: 12px;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.86);
  border: 1px solid rgba(148, 163, 184, 0.55);
}

.page-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.page-title {
  font-size: 1rem;
  font-weight: 700;
}

.page-desc {
  font-size: 0.82rem;
  opacity: 0.9;
}

/* 메인 3열 레이아웃 카드 */
.routes-layout-card {
  padding: 10px 10px;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.86);
  border: 1px solid rgba(148, 163, 184, 0.55);
}

/* 실제 3열 그리드: 노선 / 정류장 / 우측 상세 */
.routes-layout {
  display: grid;
  grid-template-columns: minmax(0, 30%) minmax(0, 32%) minmax(0, 38%);
  gap: 10px;
  align-items: stretch;
}

/* 우측 컬럼: 노선 상세 + 정류장 상세 */
.right-column {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 반응형 (모바일/좁은 화면) */
@media (max-width: 1024px) {
  .routes-layout {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
