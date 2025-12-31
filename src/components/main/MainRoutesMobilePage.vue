<!-- src/components/main/MainRoutesMobilePage.vue -->
<template>
  <div class="routes-mobile-page">
    <!-- 상단 헤더 카드 -->
    <section class="page-header-card">
      <header class="page-header">
        <h2 class="page-title">노선 관리</h2>
        <p class="page-desc">
          도시 전체의 주요 노선들을 설계·편집하고, 혼잡도와 수익성을 관리하는 영역입니다.
        </p>
      </header>
    </section>

    <!-- 상단 툴바 (검색/필터/정렬/추가) -->
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

    <!-- 본문: 목록 / 상세 전환 -->
    <section class="routes-mobile-body">
      <!-- 1️⃣ 노선 목록 모드 -->
      <template v-if="viewMode === 'list'">
        <RoutesListPanel
          :routes="filteredRoutes"
          :selected-route-id="selectedRouteId"
          @select-route="handleSelectRoute"
        />
      </template>

      <!-- 2️⃣ 상세 모드: 정류장 리스트 + 노선 상세 + 정류장 상세 -->
      <template v-else>
        <section class="mobile-detail-header">
          <button
            type="button"
            class="back-button"
            @click="goBackToList"
          >
            ← 노선 목록
          </button>
        </section>

        <section class="mobile-detail-column">
          <!-- 정류장 & 역 리스트 -->
          <RoutesStopsPanel
            :route="selectedRoute"
            :selected-stop-id="selectedStopId"
            @request-add-stop="addStop"
            @reorder-stops="reorderStops"
            @select-stop="handleSelectStop"
          />

          <!-- 노선 상세 -->
          <RouteDetailPanel
            :route="selectedRoute"
            @update-route="updateRoute"
            @request-delete-route="handleRequestDeleteRoute"
            @confirm-reconstruction="handleConfirmReconstruction"
          />

          <!-- 정류장 상세 -->
          <StopDetailPanel
            :route="selectedRoute"
            :stop="selectedStop"
            @update-stop="updateStop"
            @delete-stop="handleDeleteStop"
          />
        </section>
      </template>
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
  selectRoute: selectRouteInStore,
  selectStop: selectStopInStore,
  addStop,
  reorderStops,
  updateRoute,
  updateStop,
  deleteRoute,
  deleteStop,
  confirmReconstruction,
} = useRoutesStore()

/* 모바일 뷰 모드: 목록 / 상세 */
const viewMode = ref(selectedRouteId.value ? 'detail' : 'list') // 'list' | 'detail'

/* 검색/필터/정렬 상태 (PC와 동일 로직) */
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

/* 필터링된 노선 리스트 (PC와 동일) */
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

/* 노선 선택 → 스토어 + 상세 화면으로 전환 */
function handleSelectRoute(routeId) {
  if (!routeId) return
  selectRouteInStore(routeId)
  viewMode.value = 'detail'
}

/* 정류장 선택 → 스토어로 위임 */
function handleSelectStop(stopId) {
  if (!stopId) return
  selectStopInStore(stopId)
}

/* 목록으로 돌아가기 */
function goBackToList() {
  viewMode.value = 'list'
}

/**
 * 노선 삭제 요청 핸들러
 */
function handleRequestDeleteRoute(payload) {
  const routeId =
    typeof payload === 'string'
      ? payload
      : payload?.routeId ?? payload?.id ?? null

  if (!routeId) return
  deleteRoute(routeId)

  // 현재 보고 있던 노선을 삭제했다면 목록 화면으로 복귀
  if (routeId === selectedRouteId.value) {
    viewMode.value = 'list'
  }
}

/**
 * 정류장 삭제 핸들러
 */
function handleDeleteStop(payload) {
  const stopId =
    typeof payload === 'string'
      ? payload
      : payload?.stopId ?? payload?.id ?? null

  if (!stopId) return
  deleteStop(stopId)
}

/**
 * 시설 변경 확정 → 2시간 변경 시공 시작
 */
function handleConfirmReconstruction(routeId) {
  if (!routeId) return
  confirmReconstruction(routeId)
}
</script>

<style scoped>
.routes-mobile-page {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 상단 헤더 카드 (PC와 거의 동일 틀) */
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

/* 본문 전체 래퍼 */
.routes-mobile-body {
  padding: 10px 10px;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.86);
  border: 1px solid rgba(148, 163, 184, 0.55);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 상세 모드 상단 뒤로가기 */
.mobile-detail-header {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 4px;
}

.back-button {
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.9);
  background: rgba(15, 23, 42, 0.95);
  color: #e5e7eb;
  font-size: 0.76rem;
  cursor: pointer;
}

/* 상세 모드: 정류장 리스트 + 노선 상세 + 정류장 상세를 세로로 쌓기 */
.mobile-detail-column {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
