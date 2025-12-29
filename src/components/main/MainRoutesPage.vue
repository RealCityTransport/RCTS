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
      @create-route="createRoute"
    />

    <!-- 메인 3열 레이아웃 카드 -->
    <section class="routes-layout-card">
      <section class="routes-layout">
        <!-- 1️⃣ 좌측: 노선 목록 -->
        <RoutesListPanel
          :routes="filteredRoutes"
          :selected-route-id="selectedRouteId"
          @select-route="selectRoute"
        />

        <!-- 2️⃣ 가운데: 정류장 & 역 리스트 -->
        <RoutesStopsPanel
          :route="selectedRoute"
          :selected-stop-id="selectedStopId"
          @request-add-stop="addStop"
          @reorder-stops="reorderStops"
          @select-stop="selectStop"
        />

        <!-- 3️⃣ 우측: 노선 상세 + 정류장 상세 -->
        <section class="right-column">
          <RouteDetailPanel
            :route="selectedRoute"
            @update-route="updateRoute"
            @request-delete-route="handleRequestDeleteRoute"
          />

          <StopDetailPanel
            :route="selectedRoute"
            :stop="selectedStop"
            @update-stop="updateStop"
            @delete-stop="handleDeleteStop"
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
import { useRoutesStore } from '@/composables/useRoutesStore'

const {
  routes,
  selectedRouteId,
  selectedStopId,
  selectedRoute,
  selectedStop,
  createRoute,
  selectRoute,
  selectStop,
  addStop,
  reorderStops,
  updateRoute,
  updateStop,
  deleteRoute,
  deleteStop,
} = useRoutesStore()

/* 검색/필터/정렬 상태 (이건 이 화면 전용) */
const searchText = ref('')

/**
 * statusFilter는 툴바에서 어떤 값을 보내더라도
 * 내부에서 설계중/건설중/운영중 3단계로 정규화해서 사용
 * - 'all' 그대로 사용
 * - 'draft' / '설계중' → '설계중'
 * - 'construction' / 'building' / '건설중' → '건설중'
 * - 'active' / '운영중' → '운영중'
 */
const statusFilter = ref('all')
const sortKey = ref('updated-desc')

function normalizePhase(value) {
  if (!value) return null
  switch (value) {
    case 'all':
      return 'all'
    // 설계중
    case 'draft':
    case '설계중':
      return '설계중'
    // 건설중
    case 'construction':
    case 'building':
    case '건설중':
      return '건설중'
    // 운영중
    case 'active':
    case '운영중':
      return '운영중'
    default:
      return null
  }
}

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

  // 상태 필터 (설계중 / 건설중 / 운영중 3단계만)
  const phaseFilter = normalizePhase(statusFilter.value)
  if (phaseFilter && phaseFilter !== 'all') {
    list = list.filter((r) => normalizePhase(r.status) === phaseFilter)
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
      list.sort((a, b) =>
        (b.lastUpdatedAt || '').localeCompare(a.lastUpdatedAt || ''),
      )
      break
  }

  return list
})

/**
 * 노선 삭제 요청 핸들러
 * - 자식에서 id 또는 { routeId, ... } 형태로 넘겨와도 여기서 routeId만 추출해서 스토어로 전달
 */
function handleRequestDeleteRoute(payload) {
  const routeId =
    typeof payload === 'string'
      ? payload
      : payload?.routeId ?? payload?.id ?? null

  if (!routeId) return
  deleteRoute(routeId)
}

/**
 * 정류장 삭제 핸들러
 * - 자식에서 stopId 또는 { routeId, stopId } 형태로 넘겨와도 여기서 stopId만 추출
 */
function handleDeleteStop(payload) {
  const stopId =
    typeof payload === 'string'
      ? payload
      : payload?.stopId ?? payload?.id ?? null

  if (!stopId) return
  deleteStop(stopId)
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
