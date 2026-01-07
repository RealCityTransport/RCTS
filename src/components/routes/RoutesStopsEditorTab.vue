<!-- src/components/routes/RoutesStopsEditorTab.vue -->
<template>
  <section class="routes-section">
    <!-- 메인 패널: 노선 선택 + 정류장/역 시퀀스 -->
    <section class="routes-panel routes-panel-main">
      <header class="routes-main-header">
        <div class="routes-main-header-left">
          <h4 class="panel-title">정류장·역 편집</h4>
          <p class="panel-desc">
            이 화면에서는 내 계정의 노선 중 하나를 선택하고,
            해당 노선에 연결된 정류장·역 목록(시퀀스)을 한눈에 확인합니다.
            현재는 기본 조회와 새 정류장 추가, 순서 조정 및 구간 거리 설정까지만
            구현되어 있으며, 이후 정류장 마스터 연동 기능을 단계적으로 추가할 예정입니다.
          </p>
        </div>
      </header>

      <div class="routes-stops-layout">
        <!-- 왼쪽: 노선 선택 리스트 -->
        <aside class="stops-panel stops-panel-left">
          <h5 class="stops-panel-title">노선 선택</h5>

          <p v-if="loading" class="stops-helper-text">
            노선 목록을 불러오는 중입니다…
          </p>
          <p
            v-else-if="!loading && routes.length === 0"
            class="stops-helper-text"
          >
            아직 등록된 노선이 없습니다.
            먼저 <strong>노선 목록</strong> 탭에서 노선을 생성해 주세요.
          </p>

          <ul
            v-else
            class="routes-list"
          >
            <li
              v-for="(route, idx) in routes"
              :key="route.id"
              :class="[
                'routes-list-item',
                { 'is-active': route.id === selectedRouteId }
              ]"
            >
              <button
                type="button"
                class="routes-list-button"
                @click="selectedRouteId = route.id"
              >
                <div class="routes-list-top">
                  <div class="routes-list-name-row">
                    <span class="routes-list-index">
                      {{ idx + 1 }}
                    </span>
                    <span
                      class="routes-list-color-dot"
                      :style="{ backgroundColor: route.color || '#888888' }"
                    ></span>
                    <span class="routes-list-name">
                      {{ route.name || '(이름 없음)' }}
                    </span>
                  </div>
                  <span
                    class="routes-list-status"
                    :data-status="route.status"
                  >
                    {{ route.status || '—' }}
                  </span>
                </div>

                <div class="routes-list-bottom">
                  <span class="routes-list-code">
                    {{ route.lineCode || '코드 없음' }}
                  </span>
                  <span class="routes-list-dot">·</span>
                  <span class="routes-list-transport">
                    {{ route.transport || '수단 미지정' }}
                  </span>
                </div>
              </button>
            </li>
          </ul>
        </aside>

        <!-- 오른쪽: 선택된 노선의 정류장/역 시퀀스 -->
        <section class="stops-panel stops-panel-right">
          <div class="stops-panel-header">
            <h5 class="stops-panel-title">정류장·역 시퀀스</h5>

            <button
              type="button"
              class="stops-add-toggle"
              :disabled="!selectedRoute"
              @click="toggleAddStationForm"
            >
              {{ showAddStationForm ? '입력 닫기' : '새 정류장 추가' }}
            </button>
          </div>

          <!-- 인라인 정류장 추가 폼 -->
          <div
            v-if="selectedRoute && showAddStationForm"
            class="stops-add-form"
          >
            <label class="stops-add-label">
              정류장·역 이름
            </label>
            <div class="stops-add-fields">
              <input
                v-model="newStationName"
                type="text"
                class="stops-add-input"
                placeholder="예: 중앙역 / ○○주공아파트 / ○○공단 앞"
                @keyup.enter="handleAddStation"
              />
              <button
                type="button"
                class="stops-add-submit"
                :disabled="addingStation || !newStationName.trim()"
                @click="handleAddStation"
              >
                추가
              </button>
            </div>
          </div>

          <template v-if="!selectedRoute">
            <p class="stops-helper-text">
              왼쪽 목록에서 정류장·역 시퀀스를 확인할 노선을 선택해 주세요.
            </p>
          </template>

          <template v-else>
            <div class="stops-route-summary">
              <div class="stops-route-main">
                <span
                  class="stops-route-color-dot"
                  :style="{ backgroundColor: selectedRoute.color || '#888888' }"
                ></span>
                <div class="stops-route-text">
                  <div class="stops-route-name">
                    {{ selectedRoute.name || '(이름 없음)' }}
                  </div>
                  <div class="stops-route-meta">
                    {{ selectedRoute.lineCode || '코드 없음' }} ·
                    {{ selectedRoute.transport || '수단 미지정' }} ·
                    {{ selectedRoute.shape || '형태 미지정' }}
                  </div>
                </div>
              </div>
              <div class="stops-route-count">
                정류장 수:
                <strong>{{ stationItems.length }}</strong>
              </div>
            </div>

            <div
              v-if="stationItems.length === 0"
              class="stops-helper-text"
            >
              이 노선에는 아직 연결된 정류장·역 정보가 없습니다.
              상단의 <strong>새 정류장 추가</strong> 버튼으로
              첫 정류장을 등록해 보세요.
            </div>

            <div
              v-else
              class="stops-table-wrapper"
            >
              <table class="stops-table">
                <thead>
                  <tr>
                    <th class="col-index">#</th>
                    <th class="col-name">정류장·역 이름</th>
                    <th class="col-distance">앞 정류장까지 거리 (km)</th>
                    <th class="col-actions">순서</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(station, idx) in stationItems"
                    :key="station.key"
                    class="stops-row"
                  >
                    <td class="col-index">
                      {{ idx + 1 }}
                    </td>
                    <td class="col-name">
                      <div
                        v-if="editingIndex === idx"
                        class="name-edit-wrap"
                      >
                        <input
                          v-model="editingNameDraft"
                          type="text"
                          class="name-edit-input"
                          placeholder="정류장·역 이름"
                          @keyup.enter="saveStationName(idx)"
                        />
                        <div class="name-edit-actions">
                          <button
                            type="button"
                            class="name-edit-btn name-edit-btn--primary"
                            :disabled="savingName || !editingNameDraft.trim()"
                            @click="saveStationName(idx)"
                          >
                            저장
                          </button>
                          <button
                            type="button"
                            class="name-edit-btn"
                            :disabled="savingName"
                            @click="cancelEditName"
                          >
                            취소
                          </button>
                        </div>
                      </div>
                      <div
                        v-else
                        class="name-display-wrap"
                      >
                        <span class="name-text">
                          {{ station.name }}
                        </span>
                        <button
                          type="button"
                          class="name-inline-edit-btn"
                          @click="startEditName(idx)"
                        >
                          이름 수정
                        </button>
                      </div>
                    </td>
                    <td class="col-distance">
                      <div
                        v-if="idx === 0"
                        class="distance-first"
                      >
                        —
                      </div>
                      <div
                        v-else
                        class="distance-input-wrap"
                      >
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          class="distance-input"
                          :value="station.distanceFromPrevKm ?? ''"
                          @change="onDistanceChange(idx, $event)"
                        />
                      </div>
                    </td>
                    <td class="col-actions">
                      <div class="stops-actions">
                        <button
                          type="button"
                          class="stops-order-btn"
                          :disabled="idx === 0 || !selectedRoute"
                          @click="moveStation(idx, idx - 1)"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          class="stops-order-btn"
                          :disabled="idx === stationItems.length - 1 || !selectedRoute"
                          @click="moveStation(idx, idx + 1)"
                        >
                          ▼
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>
        </section>
      </div>
    </section>

    <!-- 하단: 설명/향후 기능 패널 -->
    <section class="routes-panel routes-panel-sub">
      <div class="sub-grid">
        <article class="sub-card">
          <h4 class="sub-card-title">정류장 마스터 &amp; 초안 관리</h4>
          <p class="sub-card-text">
            정류장 이름, 내부 코드, 위치 설명, 유형 등을 관리하는
            정류장 마스터 데이터와,
            아직 확정되지 않은 시퀀스를 초안으로 저장해 두는 기능은
            앞으로 이 탭에 단계적으로 추가될 예정입니다.
            현재는 선택한 노선에 연결된 정류장 정보를
            간단히 추가·조회하고, 순서를 조정하는 역할에
            초점을 맞추고 있습니다.
          </p>
        </article>

        <article class="sub-card">
          <h4 class="sub-card-title">운영 반영 전 검증</h4>
          <p class="sub-card-text">
            향후에는 정류장 수, 구간 수, 예상 소요 시간 등의 기본 지표를 기준으로
            노선 설계에 문제가 없는지 간단히 점검하는 검증 기능이 추가됩니다.
            이 검증 정보는 운영 센터에서 사용할 계획·실적 비교의 기반이 됩니다.
          </p>
        </article>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { usePlayerRoutes, type RouteRecord } from '@/composables/usePlayerRoutes'

const { routes, loading, updateRoute } = usePlayerRoutes()

const selectedRouteId = ref<string | null>(null)

const selectedRoute = computed<RouteRecord | null>(() =>
  routes.value.find((r) => r.id === selectedRouteId.value) ?? null
)

type StationItem = {
  key: string
  name: string
  id?: string
  order?: number
  distanceFromPrevKm: number | null
}

/**
 * 선택된 노선의 stations 필드를 그대로 사용해서
 * 화면용 정류장 리스트로 변환한다.
 */
const stationItems = computed<StationItem[]>(() => {
  return normalizeStationsFromRoute(selectedRoute.value)
})

/** order 기준 정렬용 헬퍼 */
const sortByOrder = (a: any, b: any) => {
  const ao = typeof a?.order === 'number' ? a.order : 999999
  const bo = typeof b?.order === 'number' ? b.order : 999999
  return ao - bo
}

function normalizeStationsFromRoute(route: RouteRecord | null): StationItem[] {
  if (!route || !route.stations) return []

  const raw = route.stations as any

  const normalizeEntry = (entry: any, idx: number): StationItem => {
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
      distanceFromPrevKm:
        typeof entry?.distanceFromPrevKm === 'number'
          ? entry.distanceFromPrevKm
          : null,
    }
  }

  // 배열 형태
  if (Array.isArray(raw)) {
    const sorted = [...raw].sort(sortByOrder)
    return sorted.map(normalizeEntry)
  }

  // 객체 맵 형태
  if (typeof raw === 'object' && raw !== null) {
    const entries = Object.values(raw)
    return (entries as any[]).map(normalizeEntry)
  }

  return []
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

/** 인라인 정류장 추가 UI 상태 */
const showAddStationForm = ref(false)
const newStationName = ref('')
const addingStation = ref(false)

const toggleAddStationForm = () => {
  if (!selectedRoute.value) return
  showAddStationForm.value = !showAddStationForm.value
  if (showAddStationForm.value) {
    newStationName.value = ''
  }
}

/**
 * 새 정류장 추가
 * - 현재 선택된 노선의 stations 배열을 기반으로 새 객체를 append
 * - updateRoute(id, { stations: nextArray }) 로 통째로 저장
 */
const handleAddStation = async () => {
  if (!selectedRoute.value) return

  const name = newStationName.value.trim()
  if (!name || addingStation.value) return

  try {
    addingStation.value = true

    const baseRaw = (selectedRoute.value.stations ?? []) as any
    let base: any[]

    if (Array.isArray(baseRaw)) {
      base = [...baseRaw]
    } else if (typeof baseRaw === 'object' && baseRaw !== null) {
      base = Object.values(baseRaw)
    } else {
      base = []
    }

    const sorted = [...base].sort(sortByOrder)
    const nextOrder = sorted.length + 1

    const newStation = {
      id: `st_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name,
      order: nextOrder,
      distanceFromPrevKm: 0,
      isBuilt: false,
      isMajor: false,
      isTerminal: false,
    }

    const next = [...sorted, newStation]

    await updateRoute(selectedRoute.value.id, {
      stations: next,
    })

    // 성공 후 입력값만 초기화 (폼은 열어둔 상태 유지)
    newStationName.value = ''
  } catch (err) {
    console.error('[RoutesStopsEditorTab] handleAddStation error:', err)
  } finally {
    addingStation.value = false
  }
}

/**
 * 정류장 순서 변경 (위/아래 이동)
 * - fromIndex, toIndex는 "정렬된 화면상 인덱스" 기준
 */
const moveStation = async (fromIndex: number, toIndex: number) => {
  if (!selectedRoute.value) return

  const baseRaw = (selectedRoute.value.stations ?? []) as any
  let base: any[]

  if (Array.isArray(baseRaw)) {
    base = [...baseRaw]
  } else if (typeof baseRaw === 'object' && baseRaw !== null) {
    base = Object.values(baseRaw)
  } else {
    base = []
  }

  if (!base.length) return

  const sorted = [...base].sort(sortByOrder)

  if (
    fromIndex < 0 ||
    fromIndex >= sorted.length ||
    toIndex < 0 ||
    toIndex >= sorted.length
  ) {
    return
  }

  const [moved] = sorted.splice(fromIndex, 1)
  sorted.splice(toIndex, 0, moved)

  // order 재부여
  const reindexed = sorted.map((s, idx) => ({
    ...s,
    order: idx + 1,
  }))

  try {
    await updateRoute(selectedRoute.value.id, {
      stations: reindexed,
    })
  } catch (err) {
    console.error('[RoutesStopsEditorTab] moveStation error:', err)
  }
}

/**
 * 앞 정류장까지 거리 변경
 * - index는 화면상 인덱스 (정렬 기준)
 * - 첫 번째 정류장(index 0)은 거리 입력을 받지 않는다.
 */
const onDistanceChange = async (index: number, event: Event) => {
  if (!selectedRoute.value) return
  if (index === 0) return

  const input = event.target as HTMLInputElement
  const rawValue = input.value

  if (rawValue === '') {
    // 빈 값이면 비움
    input.value = ''
  }

  let nextValue = Number.parseFloat(rawValue)
  if (Number.isNaN(nextValue)) {
    // 잘못된 값이면 기존 값으로 되돌림
    const current = stationItems.value[index]
    input.value =
      current && current.distanceFromPrevKm != null
        ? String(current.distanceFromPrevKm)
        : ''
    return
  }

  if (nextValue < 0) {
    nextValue = 0
  }

  const baseRaw = (selectedRoute.value.stations ?? []) as any
  let base: any[]

  if (Array.isArray(baseRaw)) {
    base = [...baseRaw]
  } else if (typeof baseRaw === 'object' && baseRaw !== null) {
    base = Object.values(baseRaw)
  } else {
    base = []
  }

  if (!base.length) return

  const sorted = [...base].sort(sortByOrder)

  if (index < 0 || index >= sorted.length) return

  const target = sorted[index] ?? null
  if (!target || typeof target !== 'object') return

  const updated = {
    ...target,
    distanceFromPrevKm: nextValue,
  }

  sorted.splice(index, 1, updated)

  // order 보정 (없으면 부여)
  const reindexed = sorted.map((s, idx) => ({
    ...s,
    order: typeof s.order === 'number' ? s.order : idx + 1,
  }))

  try {
    await updateRoute(selectedRoute.value.id, {
      stations: reindexed,
    })
  } catch (err) {
    console.error('[RoutesStopsEditorTab] onDistanceChange error:', err)
  }
}

/**
 * 정류장 이름 인라인 수정 상태
 */
const editingIndex = ref<number | null>(null)
const editingNameDraft = ref('')
const savingName = ref(false)

/** 이름 수정 시작 */
const startEditName = (index: number) => {
  const s = stationItems.value[index]
  if (!s) return
  editingIndex.value = index
  editingNameDraft.value = s.name ?? ''
}

/** 이름 수정 취소 */
const cancelEditName = () => {
  editingIndex.value = null
  editingNameDraft.value = ''
}

/**
 * 정류장 이름 저장
 * - index는 화면상 인덱스(정렬 기준)
 */
const saveStationName = async (index: number) => {
  if (!selectedRoute.value) return

  const station = stationItems.value[index]
  if (!station) return

  const name = editingNameDraft.value.trim()
  if (!name || savingName.value) return

  // 변경 없음
  if (station.name === name) {
    editingIndex.value = null
    return
  }

  try {
    savingName.value = true

    const baseRaw = (selectedRoute.value.stations ?? []) as any
    let base: any[]

    if (Array.isArray(baseRaw)) {
      base = [...baseRaw]
    } else if (typeof baseRaw === 'object' && baseRaw !== null) {
      base = Object.values(baseRaw)
    } else {
      base = []
    }

    if (!base.length) return

    const sorted = [...base].sort(sortByOrder)

    if (index < 0 || index >= sorted.length) return

    const target = sorted[index]
    if (!target || typeof target !== 'object') return

    const updated = {
      ...target,
      name,
    }

    sorted.splice(index, 1, updated)

    // order 유지/보정
    const reindexed = sorted.map((s, idx) => ({
      ...s,
      order: typeof s.order === 'number' ? s.order : idx + 1,
    }))

    await updateRoute(selectedRoute.value.id, {
      stations: reindexed,
    })

    editingIndex.value = null
  } catch (err) {
    console.error('[RoutesStopsEditorTab] saveStationName error:', err)
  } finally {
    savingName.value = false
  }
}

/** 노선이 바뀌면 이름 편집 상태 초기화 */
watch(
  selectedRoute,
  () => {
    editingIndex.value = null
    editingNameDraft.value = ''
  }
)
</script>

<style scoped>
.routes-section {
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

/* 좌우 레이아웃 */

.routes-stops-layout {
  margin-top: 6px;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 8px;
}

.stops-panel {
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.6);
  background: rgba(15, 23, 42, 0.98);
  padding: 8px 10px;
}

.stops-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.stops-panel-title {
  font-size: 0.82rem;
  font-weight: 600;
}

/* 정류장 추가 토글 버튼 */

.stops-add-toggle {
  padding: 4px 10px;
  font-size: 0.74rem;
  border-radius: 999px;
  border: 1px solid rgba(129, 140, 248, 1);
  background: rgba(30, 64, 175, 0.9);
  color: #e5e7eb;
  cursor: pointer;
  transition:
    background 0.15s ease-out,
    transform 0.05s ease-out,
    opacity 0.1s ease-out;
}

.stops-add-toggle:disabled {
  opacity: 0.5;
  cursor: default;
  transform: none;
}

.stops-add-toggle:not(:disabled):hover {
  transform: translateY(-1px);
}

/* 인라인 정류장 추가 폼 */

.stops-add-form {
  margin-bottom: 6px;
  padding: 6px 8px;
  border-radius: 6px;
  border: 1px dashed rgba(148, 163, 184, 0.7);
  background: rgba(15, 23, 42, 0.98);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stops-add-label {
  font-size: 0.78rem;
  opacity: 0.9;
}

.stops-add-fields {
  display: flex;
  gap: 6px;
  align-items: center;
}

.stops-add-input {
  flex: 1;
  min-width: 0;
  padding: 5px 8px;
  border-radius: 6px;
  border: 1px solid rgba(148, 163, 184, 0.8);
  background: rgba(15, 23, 42, 0.95);
  color: #e5e7eb;
  font-size: 0.78rem;
}

.stops-add-input::placeholder {
  color: rgba(148, 163, 184, 0.9);
}

.stops-add-submit {
  padding: 4px 10px;
  font-size: 0.74rem;
  border-radius: 999px;
  border: 1px solid rgba(129, 140, 248, 1);
  background: rgba(30, 64, 175, 0.9);
  color: #e5e7eb;
  cursor: pointer;
  transition:
    background 0.15s ease-out,
    transform 0.05s ease-out,
    opacity 0.1s ease-out;
}

.stops-add-submit:disabled {
  opacity: 0.5;
  cursor: default;
  transform: none;
}

.stops-add-submit:not(:disabled):hover {
  transform: translateY(-1px);
}

/* 공통 텍스트 */

.stops-helper-text {
  font-size: 0.78rem;
  opacity: 0.9;
  line-height: 1.5;
}

/* 왼쪽: 노선 리스트 */

.routes-list {
  list-style: none;
  margin: 0;
  margin-top: 4px;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 260px;
  overflow-y: auto;
  /* 스크롤바는 숨기되, 스크롤 동작은 유지 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
}

.routes-list::-webkit-scrollbar {
  display: none; /* Chrome/Safari */
}

.routes-list-item {
  border-radius: 8px;
  border: 1px solid rgba(30, 41, 59, 0.9);
  background: rgba(15, 23, 42, 0.98);
  transition:
    border-color 0.12s ease-out,
    background 0.12s ease-out,
    transform 0.05s ease-out,
    box-shadow 0.1s ease-out;
}

/* 비선택 상태에서도 글자 잘 보이도록 기본 텍스트 밝게 */
.routes-list-button {
  width: 100%;
  border: none;
  background: transparent;
  padding: 7px 8px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 3px;
  cursor: pointer;
  text-align: left;
  color: #e5e7eb;
}

.routes-list-item.is-active {
  border-color: rgba(129, 140, 248, 1);
  background: radial-gradient(
      circle at top left,
      rgba(56, 189, 248, 0.22),
      rgba(15, 23, 42, 0.98)
    );
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(15, 23, 42, 0.9);
}

/* 노선 리스트 상단/하단 레이아웃 */

.routes-list-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 6px;
}

.routes-list-name-row {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.routes-list-index {
  min-width: 18px;
  font-size: 0.7rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
  opacity: 0.9;
  color: #e5e7eb;
}

.routes-list-color-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  border: 1px solid rgba(15, 23, 42, 0.9);
}

.routes-list-name {
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  color: #f9fafb;
}

.routes-list-status {
  padding: 1px 7px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.7);
  font-size: 0.7rem;
  white-space: nowrap;
  background: rgba(15, 23, 42, 0.95);
  color: #e5e7eb;
}

.routes-list-status[data-status='설계중'] {
  border-color: rgba(148, 163, 184, 0.9);
}

.routes-list-status[data-status='운행중'] {
  border-color: rgba(34, 197, 94, 0.9);
}

.routes-list-status[data-status='중단'] {
  border-color: rgba(248, 113, 113, 0.9);
}

.routes-list-bottom {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.72rem;
  opacity: 0.9;
  color: #cbd5f5;
}

.routes-list-code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
}

.routes-list-dot {
  opacity: 0.7;
}

.routes-list-transport {
  white-space: nowrap;
}

/* 오른쪽: 선택된 노선 요약 + 정류장 테이블 */

.stops-route-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.stops-route-main {
  display: flex;
  align-items: center;
  gap: 6px;
}

.stops-route-color-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  border: 1px solid rgba(15, 23, 42, 0.9);
}

.stops-route-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stops-route-name {
  font-size: 0.82rem;
  font-weight: 600;
}

.stops-route-meta {
  font-size: 0.72rem;
  opacity: 0.85;
}

.stops-route-count {
  font-size: 0.76rem;
  opacity: 0.9;
}

/* 정류장 테이블 */

.stops-table-wrapper {
  margin-top: 4px;
  border-radius: 6px;
  border: 1px solid rgba(30, 41, 59, 0.9);
  overflow: hidden;
  background: rgba(15, 23, 42, 0.95);
  max-height: 260px;
  overflow-y: auto;
}

.stops-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.78rem;
}

.stops-table thead {
  background: rgba(15, 23, 42, 0.98);
}

.stops-table th,
.stops-table td {
  padding: 5px 8px;
  text-align: left;
  border-bottom: 1px solid rgba(30, 41, 59, 0.9);
}

.col-index {
  width: 40px;
}

.col-distance {
  width: 130px;
}

.col-actions {
  width: 72px;
}

/* 행 배경 */

.stops-row:nth-child(odd) {
  background: rgba(15, 23, 42, 0.7);
}

.stops-row:nth-child(even) {
  background: rgba(15, 23, 42, 0.5);
}

/* 이름 인라인 수정 */

.name-display-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}

.name-text {
  font-size: 0.78rem;
}

.name-inline-edit-btn {
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

.name-inline-edit-btn:hover {
  background: rgba(30, 64, 175, 0.35);
  transform: translateY(-1px);
}

.name-edit-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.name-edit-input {
  width: 100%;
  padding: 4px 6px;
  border-radius: 4px;
  border: 1px solid rgba(148, 163, 184, 0.9);
  background: rgba(15, 23, 42, 0.98);
  color: #e5e7eb;
  font-size: 0.76rem;
}

.name-edit-input::placeholder {
  color: rgba(148, 163, 184, 0.9);
}

.name-edit-actions {
  display: flex;
  gap: 4px;
}

.name-edit-btn {
  padding: 3px 8px;
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

.name-edit-btn--primary {
  border-color: rgba(129, 140, 248, 1);
  background: rgba(30, 64, 175, 0.9);
}

.name-edit-btn:disabled {
  opacity: 0.5;
  cursor: default;
  transform: none;
}

.name-edit-btn:not(:disabled):hover {
  transform: translateY(-1px);
}

/* 거리 입력 */

.distance-first {
  font-size: 0.76rem;
  opacity: 0.8;
}

.distance-input-wrap {
  display: flex;
  align-items: center;
}

.distance-input {
  width: 100%;
  padding: 3px 6px;
  border-radius: 4px;
  border: 1px solid rgba(148, 163, 184, 0.9);
  background: rgba(15, 23, 42, 0.98);
  color: #e5e7eb;
  font-size: 0.76rem;
}

/* 순서 조정 버튼 */

.stops-actions {
  display: inline-flex;
  gap: 4px;
}

.stops-order-btn {
  width: 28px;
  height: 22px;
  border-radius: 4px;
  border: 1px solid rgba(148, 163, 184, 0.8);
  background: rgba(15, 23, 42, 0.98);
  color: #e5e7eb;
  font-size: 0.7rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition:
    background 0.15s ease-out,
    transform 0.05s ease-out,
    opacity 0.1s ease-out;
}

.stops-order-btn:disabled {
  opacity: 0.4;
  cursor: default;
  transform: none;
}

.stops-order-btn:not(:disabled):hover {
  background: rgba(30, 64, 175, 0.8);
  transform: translateY(-1px);
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

@media (min-width: 1040px) {
  .routes-stops-layout {
    grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.3fr);
  }

  .sub-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
