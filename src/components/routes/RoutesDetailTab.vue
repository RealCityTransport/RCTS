<!-- src/components/routes/RoutesDetailTab.vue -->
<template>
  <div class="routes-tab-root">
    <!-- 상단: 노선 · 정류장 상세 메인 -->
    <section class="routes-panel routes-panel-main">
      <header class="routes-main-header">
        <div class="routes-main-header-left">
          <h4 class="panel-title">노선 · 정류장 상세</h4>
          <p class="panel-desc">
            이 탭은 개별 노선과 정류장의 상세 정보를 집중적으로 보는 화면입니다.
            왼쪽에서 노선을 선택하면, 오른쪽에서 노선 단위 요약과
            정류장 목록, 선택한 정류장의 상세 정보를 한 번에 확인할 수 있습니다.
          </p>
        </div>
      </header>

      <div class="detail-layout">
        <!-- 왼쪽: 노선 선택 영역 -->
        <aside class="detail-panel detail-panel-left">
          <h5 class="detail-panel-title">노선 선택</h5>

          <p v-if="loading" class="detail-helper-text">
            노선 목록을 불러오는 중입니다…
          </p>
          <p
            v-else-if="!loading && routes.length === 0"
            class="detail-helper-text"
          >
            아직 등록된 노선이 없습니다.
            <strong>노선 목록</strong> 탭에서 먼저 노선을 생성해 주세요.
          </p>

          <ul
            v-else
            class="detail-routes-list"
          >
            <li
              v-for="route in routes"
              :key="route.id"
              :class="[
                'detail-routes-item',
                { 'is-active': route.id === selectedRouteId }
              ]"
            >
              <button
                type="button"
                class="detail-routes-button"
                @click="selectedRouteId = route.id"
              >
                <span
                  class="detail-routes-color-dot"
                  :style="{ backgroundColor: route.color || '#888888' }"
                ></span>
                <div class="detail-routes-text">
                  <span class="detail-routes-name">
                    {{ route.name || '(이름 없음)' }}
                  </span>
                  <span class="detail-routes-meta">
                    {{ route.lineCode || '코드 없음' }} ·
                    {{ route.transport || '수단 미지정' }}
                  </span>
                  <span
                    class="detail-routes-status"
                    :data-status="route.status"
                  >
                    {{ route.status || '—' }}
                  </span>
                </div>
              </button>
            </li>
          </ul>
        </aside>

        <!-- 오른쪽: 선택한 노선 요약 + 정류장 목록 + 정류장 상세 -->
        <section class="detail-panel detail-panel-right">
          <h5 class="detail-panel-title">선택한 노선 · 정류장 상세</h5>

          <template v-if="!selectedRoute">
            <p class="detail-helper-text">
              왼쪽에서 상세 정보를 보고 싶은 노선을 선택해 주세요.
            </p>
          </template>

          <template v-else>
            <!-- 노선 요약 카드 -->
            <div class="route-summary-card">
              <div class="route-summary-header">
                <div class="route-summary-main">
                  <span
                    class="route-summary-color-dot"
                    :style="{ backgroundColor: selectedRoute.color || '#888888' }"
                  ></span>
                  <div class="route-summary-text">
                    <div class="route-summary-name">
                      <template v-if="isEditingRouteName">
                        <input
                          v-model="routeNameDraft"
                          type="text"
                          class="route-name-input"
                          placeholder="노선 이름 입력"
                          @keyup.enter="saveRouteName"
                        />
                        <div class="route-name-edit-actions">
                          <button
                            type="button"
                            class="route-name-btn route-name-btn--primary"
                            :disabled="isSavingRouteName || !routeNameDraft.trim()"
                            @click="saveRouteName"
                          >
                            저장
                          </button>
                          <button
                            type="button"
                            class="route-name-btn"
                            :disabled="isSavingRouteName"
                            @click="cancelEditRouteName"
                          >
                            취소
                          </button>
                        </div>
                      </template>
                      <template v-else>
                        <span class="route-name-label">
                          {{ selectedRoute.name || '(이름 없음)' }}
                        </span>
                        <button
                          type="button"
                          class="route-name-edit-button"
                          @click="startEditRouteName"
                        >
                          이름 수정
                        </button>
                      </template>
                    </div>
                    <div class="route-summary-meta">
                      {{ selectedRoute.lineCode || '코드 없음' }} ·
                      {{ selectedRoute.transport || '수단 미지정' }} ·
                      {{ selectedRoute.shape || '형태 미지정' }}
                    </div>
                  </div>
                </div>

                <div class="route-summary-right">
                  <span
                    class="route-summary-status-pill"
                    :data-status="selectedRoute.status"
                  >
                    {{ selectedRoute.status || '—' }}
                  </span>
                  <button
                    type="button"
                    class="route-confirm-button"
                    :disabled="isConfirmingRoute || isRouteConfirmed"
                    @click="confirmRoute"
                  >
                    <span v-if="isRouteConfirmed">
                      이미 확정된 노선
                    </span>
                    <span v-else>
                      이 노선 확정하기
                    </span>
                  </button>
                </div>
              </div>

              <dl class="route-summary-stats">
                <div class="route-stat-row">
                  <dt>정류장 수</dt>
                  <dd>{{ routeStats.stationCount }}</dd>
                </div>
                <div class="route-stat-row">
                  <dt>총 구간 거리</dt>
                  <dd>
                    <span v-if="routeStats.hasDistance">
                      약 {{ routeStats.totalDistanceKm?.toFixed(1) }} km
                    </span>
                    <span v-else>
                      (거리 정보 없음)
                    </span>
                  </dd>
                </div>
                <div class="route-stat-row">
                  <dt>생성 시각</dt>
                  <dd>{{ formatDate(selectedRoute.createdAt) }}</dd>
                </div>
                <div class="route-stat-row">
                  <dt>마지막 수정</dt>
                  <dd>{{ formatDate(selectedRoute.updatedAt || selectedRoute.createdAt) }}</dd>
                </div>
              </dl>

              <p
                v-if="selectedRoute.description"
                class="route-summary-desc"
              >
                {{ selectedRoute.description }}
              </p>
            </div>

            <!-- 정류장 영역 -->
            <div
              v-if="stationItems.length === 0"
              class="detail-helper-text station-empty-helper"
            >
              이 노선에는 아직 정류장·역 정보가 없습니다.
              <strong>정류장·역 편집</strong> 탭에서 먼저 정류장을 추가해 주세요.
            </div>

            <div
              v-else
              class="station-detail-layout"
            >
              <!-- 정류장 목록 -->
              <div class="station-list-panel">
                <div class="station-list-header">
                  <span>정류장 목록</span>
                  <span class="station-count">
                    {{ stationItems.length }}개
                  </span>
                </div>

                <ul class="station-list">
                  <li
                    v-for="station in stationItems"
                    :key="station.key"
                    :class="[
                      'station-list-item',
                      { 'is-active': station.key === selectedStationKey }
                    ]"
                  >
                    <button
                      type="button"
                      class="station-list-button"
                      @click="selectedStationKey = station.key"
                    >
                      <span class="station-order">
                        {{ station.orderDisplay }}
                      </span>
                      <span class="station-name">
                        {{ station.name }}
                      </span>
                      <span
                        v-if="station.isTerminal"
                        class="station-tag station-tag--terminal"
                      >
                        종점
                      </span>
                      <span
                        v-else-if="station.isMajor"
                        class="station-tag station-tag--major"
                      >
                        주요
                      </span>
                    </button>
                  </li>
                </ul>
              </div>

              <!-- 선택된 정류장 상세 -->
              <div class="station-detail-panel">
                <template v-if="!selectedStation">
                  <p class="detail-helper-text">
                    왼쪽 정류장 목록에서 상세 정보를 보고 싶은 정류장을 선택해 주세요.
                  </p>
                </template>

                <template v-else>
                  <div class="station-detail-header">
                    <h6 class="station-detail-name">
                      <template v-if="isEditingStationName">
                        <input
                          v-model="stationNameDraft"
                          type="text"
                          class="route-name-input station-name-input"
                          placeholder="정류장 이름 입력"
                          @keyup.enter="saveStationName"
                        />
                        <div class="route-name-edit-actions station-name-edit-actions">
                          <button
                            type="button"
                            class="route-name-btn route-name-btn--primary"
                            :disabled="isSavingStationName || !stationNameDraft.trim()"
                            @click="saveStationName"
                          >
                            저장
                          </button>
                          <button
                            type="button"
                            class="route-name-btn"
                            :disabled="isSavingStationName"
                            @click="cancelEditStationName"
                          >
                            취소
                          </button>
                        </div>
                      </template>
                      <template v-else>
                        <span class="station-name-label">
                          {{ selectedStation.name }}
                        </span>
                        <button
                          type="button"
                          class="route-name-edit-button station-name-edit-button"
                          @click="startEditStationName"
                        >
                          이름 수정
                        </button>
                      </template>
                    </h6>
                    <div class="station-detail-tags">
                      <span
                        v-if="selectedStation.isTerminal"
                        class="station-tag station-tag--terminal"
                      >
                        종점
                      </span>
                      <span
                        v-else-if="selectedStation.isMajor"
                        class="station-tag station-tag--major"
                      >
                        주요 정류장
                      </span>
                      <span
                        v-else
                        class="station-tag station-tag--normal"
                      >
                        일반 정류장
                      </span>
                    </div>
                  </div>

                  <dl class="station-detail-stats">
                    <div class="station-stat-row">
                      <dt>정렬 순서</dt>
                      <dd>{{ selectedStation.order ?? '—' }}</dd>
                    </div>
                    <div class="station-stat-row">
                      <dt>이전 구간 거리</dt>
                      <dd>
                        <span v-if="selectedStation.distanceFromPrevKm != null">
                          {{ selectedStation.distanceFromPrevKm }} km
                        </span>
                        <span v-else>—</span>
                      </dd>
                    </div>
                    <div class="station-stat-row">
                      <dt>건설 여부</dt>
                      <dd>
                        <template v-if="isRouteConfirmed">
                          확정 정류장
                        </template>
                        <template v-else>
                          <span v-if="selectedStation.isBuilt">건설 완료</span>
                          <span v-else>미건설 / 계획</span>
                        </template>
                      </dd>
                    </div>
                  </dl>

                  <p class="station-detail-note">
                    아직 승하차 인원, 환승 연결, 주변 노선 정보 등은
                    연동 전 단계입니다. 이후 관제 화면과 연결되면
                    이 영역에서 통합된 정류장 정보를 확인할 수 있습니다.
                  </p>
                </template>
              </div>
            </div>
          </template>
        </section>
      </div>
    </section>

    <!-- 하단: 설명/향후 기능 패널 -->
    <section class="routes-panel routes-panel-sub">
      <div class="sub-grid">
        <article class="sub-card">
          <h4 class="sub-card-title">관제 화면과의 연동</h4>
          <p class="sub-card-text">
            상세 패널에서 특정 노선이나 정류장을 선택하면,
            관제 화면에서도 동일 대상이 하이라이트되도록
            상호 연동되는 구조를 목표로 합니다.
            이후에는 이 탭에서 선택한 대상이 관제 탭의 포커스에도 그대로 반영됩니다.
          </p>
        </article>

        <article class="sub-card">
          <h4 class="sub-card-title">즐겨찾기 &amp; 바로가기</h4>
          <p class="sub-card-text">
            자주 확인하는 노선이나 정류장을 즐겨찾기로 지정해 두고,
            운영 센터나 다른 화면에서 바로 이 상세 탭으로 넘어올 수 있는
            바로가기 역할도 이 영역이 담당하게 됩니다.
          </p>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { usePlayerRoutes, type RouteRecord } from '@/composables/usePlayerRoutes'

const { routes, loading, updateRoute } = usePlayerRoutes()

const selectedRouteId = ref<string | null>(null)

const selectedRoute = computed<RouteRecord | null>(() =>
  routes.value.find((r) => r.id === selectedRouteId.value) ?? null
)

const isRouteConfirmed = computed(() => selectedRoute.value?.status === '확정')

type StationItem = {
  key: string
  name: string
  id?: string
  order?: number
  orderDisplay: string
  distanceFromPrevKm: number | null
  isTerminal: boolean
  isMajor: boolean
  isBuilt: boolean
}

const stationItems = computed<StationItem[]>(() => {
  return normalizeStationsFromRoute(selectedRoute.value)
})

function normalizeStationsFromRoute(route: RouteRecord | null): StationItem[] {
  if (!route || !route.stations) return []

  const raw = route.stations as any

  const normalize = (entry: any, idx: number): StationItem => {
    const order =
      typeof entry?.order === 'number'
        ? entry.order
        : (typeof entry?.sequence === 'number' ? entry.sequence : idx + 1)

    return {
      key: (entry?.id as string) ?? String(idx),
      name:
        (entry?.name as string) ??
        (entry?.title as string) ??
        `정류장 ${idx + 1}`,
      id: entry?.id,
      order,
      orderDisplay: `${order}`,
      distanceFromPrevKm:
        typeof entry?.distanceFromPrevKm === 'number'
          ? entry.distanceFromPrevKm
          : null,
      isTerminal: !!entry?.isTerminal,
      isMajor: !!entry?.isMajor,
      isBuilt: !!entry?.isBuilt,
    }
  }

  if (Array.isArray(raw)) {
    const sorted = [...raw].sort((a: any, b: any) => {
      const ao = typeof a?.order === 'number' ? a.order : 999999
      const bo = typeof b?.order === 'number' ? b.order : 999999
      return ao - bo
    })
    return sorted.map(normalize)
  }

  if (typeof raw === 'object') {
    const entries = Object.values(raw)
    return (entries as any[]).map(normalize)
  }

  return []
}

/** 선택된 정류장 key */
const selectedStationKey = ref<string | null>(null)

const selectedStation = computed<StationItem | null>(() => {
  if (!stationItems.value.length) return null

  if (!selectedStationKey.value) {
    return stationItems.value[0]
  }

  return stationItems.value.find(
    (s) => s.key === selectedStationKey.value
  ) ?? stationItems.value[0]
})

/** 노선 스탯: 정류장 수, 거리 합 등 */
const routeStats = computed(() => {
  const stations = stationItems.value

  let totalDistance = 0
  let hasDistance = false

  for (const s of stations) {
    if (typeof s.distanceFromPrevKm === 'number') {
      totalDistance += s.distanceFromPrevKm
      hasDistance = true
    }
  }

  return {
    stationCount: stations.length,
    totalDistanceKm: hasDistance ? totalDistance : null,
    hasDistance,
  }
})

/**
 * 노선 이름 수정 관련 상태
 */
const isEditingRouteName = ref(false)
const routeNameDraft = ref('')
const isSavingRouteName = ref(false)

/**
 * 노선 이름 수정 시작
 */
const startEditRouteName = () => {
  if (!selectedRoute.value) return
  isEditingRouteName.value = true
  routeNameDraft.value = selectedRoute.value.name ?? ''
}

/**
 * 노선 이름 수정 취소
 */
const cancelEditRouteName = () => {
  if (!selectedRoute.value) {
    isEditingRouteName.value = false
    routeNameDraft.value = ''
    return
  }
  isEditingRouteName.value = false
  routeNameDraft.value = selectedRoute.value.name ?? ''
}

/**
 * 노선 이름 저장
 */
const saveRouteName = async () => {
  if (!selectedRoute.value) return
  const name = routeNameDraft.value.trim()
  if (!name || isSavingRouteName.value) return

  // 변경 없는 경우
  if ((selectedRoute.value.name ?? '') === name) {
    isEditingRouteName.value = false
    return
  }

  try {
    isSavingRouteName.value = true
    await updateRoute(selectedRoute.value.id, {
      name,
    })
    isEditingRouteName.value = false
  } catch (err) {
    console.error('[RoutesDetailTab] saveRouteName error:', err)
  } finally {
    isSavingRouteName.value = false
  }
}

/**
 * 노선 확정하기
 * - status 를 '확정' 으로 변경
 */
const isConfirmingRoute = ref(false)

const confirmRoute = async () => {
  if (!selectedRoute.value || isRouteConfirmed.value || isConfirmingRoute.value) return

  try {
    isConfirmingRoute.value = true
    await updateRoute(selectedRoute.value.id, {
      status: '확정',
    })
  } catch (err) {
    console.error('[RoutesDetailTab] confirmRoute error:', err)
  } finally {
    isConfirmingRoute.value = false
  }
}

/**
 * 정류장 이름 수정 관련 상태
 */
const isEditingStationName = ref(false)
const stationNameDraft = ref('')
const isSavingStationName = ref(false)

/**
 * 정류장 이름 수정 시작
 */
const startEditStationName = () => {
  if (!selectedStation.value) return
  isEditingStationName.value = true
  stationNameDraft.value = selectedStation.value.name ?? ''
}

/**
 * 정류장 이름 수정 취소
 */
const cancelEditStationName = () => {
  if (!selectedStation.value) {
    isEditingStationName.value = false
    stationNameDraft.value = ''
    return
  }
  isEditingStationName.value = false
  stationNameDraft.value = selectedStation.value.name ?? ''
}

/**
 * 정류장 이름 저장
 * - 현재 선택된 노선의 stations 배열/객체에서 해당 정류장만 name 업데이트
 */
const saveStationName = async () => {
  const route = selectedRoute.value
  const station = selectedStation.value

  if (!route || !station) return

  const name = stationNameDraft.value.trim()
  if (!name || isSavingStationName.value) return

  // 변경 없는 경우
  if ((station.name ?? '') === name) {
    isEditingStationName.value = false
    return
  }

  try {
    isSavingStationName.value = true

    const baseRaw = (route.stations ?? []) as any
    let next: any = baseRaw

    if (Array.isArray(baseRaw)) {
      next = baseRaw.map((entry: any, idx: number) => {
        const key =
          entry && typeof entry === 'object' && typeof entry.id === 'string'
            ? entry.id
            : String(idx)

        if (key === station.key) {
          return {
            ...entry,
            name,
          }
        }
        return entry
      })
    } else if (typeof baseRaw === 'object' && baseRaw !== null) {
      const newObj: any = {}
      Object.entries(baseRaw).forEach(([k, v], idx) => {
        const val: any = v
        const matchByKey = k === station.key
        const matchById =
          station.id &&
          val &&
          typeof val === 'object' &&
          val.id === station.id

        if (matchByKey || matchById) {
          newObj[k] = {
            ...val,
            name,
          }
        } else {
          newObj[k] = val
        }
      })
      next = newObj
    }

    await updateRoute(route.id, {
      stations: next,
    })

    isEditingStationName.value = false
  } catch (err) {
    console.error('[RoutesDetailTab] saveStationName error:', err)
  } finally {
    isSavingStationName.value = false
  }
}

/**
 * routes 목록이 변할 때:
 * - 아무 것도 선택 안 되어 있으면 첫 노선 자동 선택
 * - 선택된 노선이 사라지면 다시 첫 노선으로 보정
 */
watch(
  routes,
  (newRoutes) => {
    if (!newRoutes || newRoutes.length === 0) {
      selectedRouteId.value = null
      return
    }

    if (!selectedRouteId.value) {
      selectedRouteId.value = newRoutes[0].id
      return
    }

    const stillExists = newRoutes.some(
      (r) => r.id === selectedRouteId.value
    )
    if (!stillExists) {
      selectedRouteId.value = newRoutes[0].id
    }
  },
  { immediate: true }
)

/** 노선이 바뀔 때는 정류장 선택, 이름 편집 상태도 초기화 */
watch(
  selectedRoute,
  (route) => {
    selectedStationKey.value = null
    isEditingRouteName.value = false
    routeNameDraft.value = route?.name ?? ''
    isEditingStationName.value = false
    stationNameDraft.value = ''
  }
)

/** 선택된 정류장이 바뀔 때도 정류장 이름 편집 상태 초기화 */
watch(
  selectedStation,
  (station) => {
    isEditingStationName.value = false
    stationNameDraft.value = station?.name ?? ''
  }
)

/** 날짜 포맷 */
const formatDate = (value?: number | null) => {
  if (!value) return '—'
  const d = new Date(value)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${yyyy}.${mm}.${dd} ${hh}:${mi}`
}
</script>

<style scoped>
.routes-tab-root {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 공통 패널 */

.routes-panel {
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.55);
  background: rgba(15, 23, 42, 0.96);
  padding: 8px 10px;
}

/* 메인 패널 */

.routes-panel-main {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.routes-main-header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.routes-main-header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.panel-title {
  font-size: 0.9rem;
  font-weight: 700;
}

.panel-desc {
  font-size: 0.8rem;
  opacity: 0.9;
  line-height: 1.6;
}

/* 상세 레이아웃: 좌(노선 선택) / 우(요약+정류장) */

.detail-layout {
  margin-top: 6px;
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.8fr);
  gap: 8px;
}

.detail-panel {
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.6);
  background: rgba(15, 23, 42, 0.98);
  padding: 8px 10px;
  font-size: 0.78rem;
}

.detail-panel-title {
  font-size: 0.82rem;
  font-weight: 600;
  margin-bottom: 4px;
}

.detail-helper-text {
  font-size: 0.78rem;
  opacity: 0.9;
  line-height: 1.5;
}

/* 왼쪽: 노선 선택 */

.detail-routes-list {
  list-style: none;
  margin: 4px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  /* 내부 스크롤 제거: 전체 화면 스크롤 사용 */
}

.detail-routes-item {
  border-radius: 6px;
  border: 1px solid rgba(30, 41, 59, 0.9);
  background: rgba(15, 23, 42, 0.95);
  transition:
    border-color 0.12s ease-out,
    background 0.12s ease-out,
    transform 0.05s ease-out,
    box-shadow 0.1s ease-out;
}

.detail-routes-item.is-active {
  border-color: rgba(129, 140, 248, 1);
  background: radial-gradient(
      circle at top left,
      rgba(56, 189, 248, 0.22),
      rgba(15, 23, 42, 0.98)
    );
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(15, 23, 42, 0.9);
}

.detail-routes-button {
  width: 100%;
  border: none;
  background: transparent;
  padding: 6px 8px;
  display: flex;
  align-items: flex-start;
  gap: 6px;
  cursor: pointer;
  text-align: left;
  color: #e5e7eb; /* 기본 텍스트 밝게 */
}

.detail-routes-color-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  border: 1px solid rgba(15, 23, 42, 0.9);
  margin-top: 3px;
}

.detail-routes-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.detail-routes-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: #f9fafb; /* 노선 이름 가장 밝게 */
}

.detail-routes-meta {
  font-size: 0.72rem;
  opacity: 0.95;
  color: #cbd5f5;
}

.detail-routes-status {
  align-self: flex-start;
  padding: 1px 6px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.8);
  font-size: 0.7rem;
  background: rgba(15, 23, 42, 0.96);
  color: #e5e7eb;
}

.detail-routes-status[data-status='설계중'] {
  border-color: rgba(148, 163, 184, 0.9);
}

.detail-routes-status[data-status='운행중'] {
  border-color: rgba(34, 197, 94, 0.9);
}

.detail-routes-status[data-status='중단'] {
  border-color: rgba(248, 113, 113, 0.9);
}

.detail-routes-status[data-status='확정'] {
  border-color: rgba(59, 130, 246, 0.9);
}

/* 오른쪽: 노선 요약 카드 */

.route-summary-card {
  margin-top: 2px;
  border-radius: 6px;
  border: 1px solid rgba(30, 41, 59, 0.9);
  background: rgba(15, 23, 42, 0.96);
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.route-summary-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 6px;
}

.route-summary-main {
  display: flex;
  align-items: center;
  gap: 6px;
}

.route-summary-color-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  border: 1px solid rgba(15, 23, 42, 0.9);
}

.route-summary-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.route-summary-name {
  font-size: 0.84rem;
  font-weight: 600;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.route-name-label {
  font-size: 0.84rem;
  font-weight: 600;
}

.route-name-input {
  width: 100%;
  padding: 4px 6px;
  border-radius: 4px;
  border: 1px solid rgba(148, 163, 184, 0.9);
  background: rgba(15, 23, 42, 0.98);
  color: #e5e7eb;
  font-size: 0.78rem;
}

.route-name-edit-actions {
  display: flex;
  gap: 4px;
  margin-top: 2px;
}

.route-name-btn {
  padding: 3px 8px;
  font-size: 0.72rem;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.8);
  background: transparent;
  color: #e5e7eb;
  cursor: pointer;
  transition:
    background 0.15s ease-out,
    transform 0.05s ease-out,
    opacity 0.1s ease-out;
}

.route-name-btn--primary {
  border-color: rgba(129, 140, 248, 1);
  background: rgba(30, 64, 175, 0.9);
}

.route-name-btn:disabled {
  opacity: 0.5;
  cursor: default;
  transform: none;
}

.route-name-btn:not(:disabled):hover {
  transform: translateY(-1px);
}

.route-name-edit-button {
  margin-left: 6px;
  padding: 2px 8px;
  font-size: 0.7rem;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.8);
  background: transparent;
  color: #e5e7eb;
  cursor: pointer;
  transition:
    background 0.15s ease-out,
    transform 0.05s ease-out,
    opacity 0.1s ease-out;
}

.route-name-edit-button:hover {
  background: rgba(30, 64, 175, 0.35);
  transform: translateY(-1px);
}

.route-summary-meta {
  font-size: 0.72rem;
  opacity: 0.85;
}

.route-summary-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.route-summary-status-pill {
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.7rem;
  border: 1px solid rgba(148, 163, 184, 0.7);
}

.route-summary-status-pill[data-status='설계중'] {
  background: rgba(148, 163, 184, 0.25);
  color: #e5e7eb;
}

.route-summary-status-pill[data-status='운행중'] {
  background: rgba(34, 197, 94, 0.25);
  color: #bbf7d0;
}

.route-summary-status-pill[data-status='중단'] {
  background: rgba(248, 113, 113, 0.25);
  color: #fecaca;
}

.route-summary-status-pill[data-status='확정'] {
  background: rgba(59, 130, 246, 0.25);
  color: #bfdbfe;
}

.route-confirm-button {
  padding: 3px 10px;
  font-size: 0.7rem;
  border-radius: 999px;
  border: 1px solid rgba(59, 130, 246, 1);
  background: rgba(37, 99, 235, 0.9);
  color: #e5e7eb;
  cursor: pointer;
  transition:
    background 0.15s ease-out,
    transform 0.05s ease-out,
    opacity 0.1s ease-out;
}

.route-confirm-button:disabled {
  opacity: 0.6;
  cursor: default;
  transform: none;
}

.route-confirm-button:not(:disabled):hover {
  transform: translateY(-1px);
}

.route-summary-stats {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 4px;
  margin: 0;
}

.route-stat-row {
  display: flex;
  justify-content: space-between;
  gap: 6px;
  font-size: 0.76rem;
}

.route-stat-row dt {
  opacity: 0.85;
}

.route-stat-row dd {
  margin: 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
}

.route-summary-desc {
  font-size: 0.76rem;
  opacity: 0.9;
  line-height: 1.5;
}

/* 오른쪽: 정류장 목록 + 상세 */

.station-empty-helper {
  margin-top: 8px;
}

.station-detail-layout {
  margin-top: 8px;
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 1.4fr);
  gap: 6px;
  align-items: stretch;
}

/* 정류장 목록 */

.station-list-panel {
  border-radius: 6px;
  border: 1px solid rgba(30, 41, 59, 0.9);
  background: rgba(15, 23, 42, 0.96);
  padding: 6px 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.station-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.76rem;
  opacity: 0.9;
}

.station-count {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
}

.station-list {
  list-style: none;
  margin: 0;
  margin-top: 2px;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
  /* 내부 스크롤 제거 */
}

.station-list-item {
  border-radius: 4px;
  border: 1px solid rgba(30, 41, 59, 0.9);
  background: rgba(15, 23, 42, 0.9);
  transition:
    border-color 0.12s ease-out,
    background 0.12s ease-out,
    transform 0.05s ease-out;
}

.station-list-item.is-active {
  border-color: rgba(129, 140, 248, 1);
  background: rgba(30, 64, 175, 0.45);
  transform: translateY(-1px);
}

.station-list-button {
  width: 100%;
  border: none;
  background: transparent;
  padding: 4px 6px;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  text-align: left;
  color: #e5e7eb; /* 기본 텍스트 밝게 */
}

.station-order {
  min-width: 26px;
  font-size: 0.72rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
  opacity: 0.95;
}

.station-name {
  flex: 1;
  min-width: 0;
  font-size: 0.78rem;
  color: #f9fafb;
}

.station-tag {
  font-size: 0.7rem;
  padding: 1px 6px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.7);
}

.station-tag--terminal {
  border-color: rgba(248, 113, 113, 0.9);
}

.station-tag--major {
  border-color: rgba(129, 140, 248, 0.9);
}

/* 정류장 상세 */

.station-detail-panel {
  border-radius: 6px;
  border: 1px solid rgba(30, 41, 59, 0.9);
  background: rgba(15, 23, 42, 0.96);
  padding: 6px 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.station-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 6px;
}

.station-detail-name {
  font-size: 0.84rem;
  font-weight: 600;
  margin: 0;
}

.station-detail-tags {
  display: flex;
  gap: 4px;
}

.station-tag--normal {
  border-color: rgba(148, 163, 184, 0.7);
}

/* 정류장 이름 수정 스타일 (노선 이름 스타일 재사용 + 약간의 보정) */
.station-name-input {
  /* route-name-input 과 동일 스타일 사용 */
}

.station-name-edit-actions {
  /* route-name-edit-actions 과 동일 스타일 사용 */
}

.station-name-label {
  font-size: 0.84rem;
  font-weight: 600;
}

.station-name-edit-button {
  /* route-name-edit-button 과 동일 스타일 사용 */
}

.station-detail-stats {
  margin: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 4px;
  font-size: 0.76rem;
}

.station-stat-row {
  display: flex;
  justify-content: space-between;
  gap: 6px;
}

.station-stat-row dt {
  opacity: 0.85;
}

.station-stat-row dd {
  margin: 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
}

.station-detail-note {
  font-size: 0.74rem;
  opacity: 0.9;
  line-height: 1.5;
}

/* 하단 서브 패널 */

.routes-panel-sub {
  display: flex;
  flex-direction: column;
}

.sub-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 8px;
}

.sub-card {
  border-radius: 8px;
  border: 1px dashed rgba(148, 163, 184, 0.7);
  background: rgba(15, 23, 42, 0.96);
  padding: 8px 10px;
  font-size: 0.78rem;
}

.sub-card-title {
  font-size: 0.84rem;
  font-weight: 600;
  margin-bottom: 4px;
}

.sub-card-text {
  font-size: 0.78rem;
  opacity: 0.9;
  line-height: 1.5;
}

/* 반응형 */

@media (max-width: 1023px) {
  .detail-layout {
    grid-template-columns: minmax(0, 1fr);
  }

  .station-detail-layout {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (min-width: 1040px) {
  .sub-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
