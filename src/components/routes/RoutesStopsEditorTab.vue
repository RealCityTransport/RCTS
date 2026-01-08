<!-- src/components/routes/RoutesStopsEditorTab.vue -->
<template>
  <section class="routes-section">
    <!-- 메인 패널: 정류장/역 시퀀스 편집 -->
    <section class="routes-panel routes-panel-main">
      <header class="routes-main-header">
        <div class="routes-main-header-left">
          <h4 class="panel-title">정류장·역 편집</h4>
        </div>
      </header>

      <div class="routes-stops-layout">
        <!-- 정류장/역 시퀀스 전체 영역 -->
        <section class="stops-main">
          <template v-if="!selectedRoute">
            <p class="stops-helper-text">
              노선 목록에서 편집할 노선을 먼저 선택해 주세요.
            </p>
          </template>

          <template v-else>
            <!-- 선택된 노선 요약: 배지 + 정류장 수 우측 배치 -->
            <div
              class="stops-route-summary"
              :style="{ borderColor: selectedRoute.color || 'rgba(148, 163, 184, 0.55)' }"
            >
              <div class="stops-route-header-row">
                <div class="stops-route-header-left">
                  <div class="stops-route-title-row">
                    <span
                      class="stops-route-color-dot"
                      :style="{ backgroundColor: selectedRoute.color || '#888888' }"
                    ></span>
                    <span class="stops-route-name">
                      {{ selectedRoute.name || '(이름 없음)' }}
                    </span>
                  </div>

                  <div class="stops-route-tags">
                    <span class="routes-badge">
                      {{ selectedRoute.transport || '수단 미지정' }}
                    </span>
                    <span class="routes-badge routes-badge--soft">
                      {{ selectedRoute.shape || '형태 미지정' }}
                    </span>
                    <span
                      class="routes-status-pill"
                      :data-status="selectedRoute.status"
                    >
                      {{ selectedRoute.status || '상태 미지정' }}
                    </span>
                    <span class="routes-badge routes-badge--outline">
                      {{ selectedRoute.type || '타입 미지정' }}
                    </span>
                  </div>
                </div>

                <div class="stops-route-count">
                  정류장 수:
                  <strong>{{ stationItems.length }}</strong>
                </div>
              </div>
            </div>

            <!-- 1) 정류장 리스트 영역: 카드형 리스트 -->
            <div
              v-if="stationItems.length === 0"
              class="stops-helper-text"
            >
              이 노선에는 아직 연결된 정류장·역 정보가 없습니다.
              아래 <strong>새 정류장·역 만들기</strong> 버튼으로
              첫 정류장을 등록해 보세요.
            </div>

            <div
              v-else
              class="stops-list"
            >
              <button
                v-for="(station, idx) in stationItems"
                :key="station.key"
                type="button"
                class="stops-list-item"
                :class="{ 'is-active': idx === selectedStationIndex }"
                :style="
                  idx === selectedStationIndex
                    ? { borderColor: selectedRoute?.color || 'rgba(129, 140, 248, 1)' }
                    : {}
                "
                @click="handleSelectStation(idx)"
              >
                <!-- 상단: 순번 배지 + 정류장 이름 -->
                <div class="stops-list-top">
                  <div class="stops-list-top-left">
                    <span class="stops-index-pill">
                      {{ idx + 1 }}
                    </span>
                    <span class="stops-name-main">
                      {{ station.name }}
                    </span>
                  </div>
                </div>

                <!-- 하단: 거리/출발 정보 + 순서 화살표 -->
                <div class="stops-list-bottom">
                  <div class="stops-bottom-left">
                    <template v-if="idx === 0">
                      <span class="stops-chip stops-chip--origin">
                        출발 정류장
                      </span>
                    </template>
                    <template v-else>
                      <span class="stops-chip">
                        앞 정류장까지
                        {{
                          station.distanceFromPrevKm != null
                            ? station.distanceFromPrevKm.toFixed(1)
                            : '미설정'
                        }} km
                      </span>
                    </template>
                  </div>

                  <div class="stops-actions">
                    <button
                      type="button"
                      class="stops-order-btn"
                      :disabled="idx === 0 || !selectedRoute"
                      @click.stop="moveStation(idx, idx - 1)"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      class="stops-order-btn"
                      :disabled="idx === stationItems.length - 1 || !selectedRoute"
                      @click.stop="moveStation(idx, idx + 1)"
                    >
                      ▼
                    </button>
                  </div>
                </div>
              </button>
            </div>

            <!-- 2) 리스트 아래: 새 정류장 만들기 / 삭제 버튼 줄 -->
            <div class="stops-header-actions stops-actions-row">
              <button
                type="button"
                class="stops-add-toggle"
                :disabled="!selectedRoute"
                @click="handleAddStation"
              >
                새 정류장·역 만들기
              </button>

              <button
                type="button"
                class="stops-delete-btn"
                :disabled="!selectedRoute || selectedStationIndex === null"
                @click="handleDeleteStation"
              >
                정류장 삭제
              </button>
            </div>

            <!-- 3) 버튼 아래: 선택 정류장 상세 -->
            <div class="stops-detail-body">
              <div
                v-if="selectedStationIndex === null || !stationItems[selectedStationIndex]"
                class="stops-detail-empty"
              >
                위 목록에서 상세 정보를 수정할 정류장·역을 선택해 주세요.
              </div>

              <div
                v-else
                class="stops-detail-form"
              >
                <div class="stops-detail-row">
                  <div class="stops-detail-field stops-detail-field-full">
                    <label class="stops-detail-label">
                      정류장·역 이름
                    </label>
                    <input
                      class="stops-detail-input"
                      type="text"
                      v-model="stationNameDraft"
                      placeholder="정류장·역 이름"
                    />
                  </div>
                </div>

                <div class="stops-detail-row">
                  <div class="stops-detail-field">
                    <label class="stops-detail-label">
                      앞 정류장·역까지 거리 (km)
                    </label>
                    <input
                      class="stops-detail-input"
                      type="number"
                      min="0"
                      step="0.1"
                      v-model.number="stationDistanceDraft"
                      :disabled="selectedStationIndex === 0"
                      :placeholder="selectedStationIndex === 0 ? '첫 정류장은 거리를 입력하지 않습니다.' : '예: 1.5'"
                    />
                    <p
                      v-if="selectedStationIndex === 0"
                      class="stops-detail-hint"
                    >
                      출발 정류장은 앞 정류장이 없으므로 거리를 입력하지 않습니다.
                    </p>
                  </div>
                </div>

                <div class="stops-detail-actions">
                  <button
                    type="button"
                    class="stops-save-btn"
                    :disabled="savingStation || !stationNameDraft.trim()"
                    @click="handleSaveStation"
                  >
                    {{ savingStation ? '저장 중…' : '변경 내용 저장' }}
                  </button>
                </div>
              </div>
            </div>
          </template>
        </section>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { usePlayerRoutes } from '@/composables/usePlayerRoutes'

const { routes, loading, updateRoute, activeRouteId } = usePlayerRoutes()

/** 현재 선택된 노선 (노선 탭의 activeRoute 기준) */
const selectedRoute = computed(() => {
  return routes.value.find((r: any) => r.id === activeRouteId.value) ?? null
})

/** order 기준 정렬 헬퍼 */
const sortByOrder = (a: any, b: any) => {
  const ao = typeof a?.order === 'number' ? a.order : 999999
  const bo = typeof b?.order === 'number' ? b.order : 999999
  return ao - bo
}

/** 선택된 노선의 stations를 화면용 리스트로 변환 */
const stationItems = computed(() => {
  return normalizeStationsFromRoute(selectedRoute.value)
})

function normalizeStationsFromRoute(route: any | null) {
  if (!route || !route.stations) return []

  const raw: any = route.stations

  const normalizeEntry = (entry: any, idx: number) => {
    const order =
      typeof entry?.order === 'number'
        ? entry.order
        : typeof entry?.sequence === 'number'
          ? entry.sequence
          : idx + 1

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

  if (Array.isArray(raw)) {
    const sorted = [...raw].sort(sortByOrder)
    return sorted.map(normalizeEntry)
  }

  if (typeof raw === 'object' && raw !== null) {
    const entries = Object.values(raw)
    return (entries as any[]).map(normalizeEntry)
  }

  return []
}

/** 정류장 선택 상태 & 상세 입력 드래프트 */
const selectedStationIndex = ref<number | null>(null)
const stationNameDraft = ref('')
const stationDistanceDraft = ref<number | null>(null)
const savingStation = ref(false)

/** 정류장 행 클릭 → 선택 & 드래프트 값 채우기 */
const handleSelectStation = (index: number) => {
  const s = stationItems.value[index]
  if (!s) return
  selectedStationIndex.value = index
  stationNameDraft.value = s.name ?? ''
  stationDistanceDraft.value =
    index === 0 ? null : (s.distanceFromPrevKm ?? null)
}

/** 노선이 바뀌면 선택 상태 초기화 */
watch(
  () => selectedRoute.value && (selectedRoute.value as any).id,
  () => {
    selectedStationIndex.value = null
    stationNameDraft.value = ''
    stationDistanceDraft.value = null
  }
)

/** 정류장 리스트가 바뀌면 선택 상태 보정 */
watch(
  stationItems,
  (items) => {
    if (selectedStationIndex.value == null) return
    const idx = selectedStationIndex.value
    if (idx < 0 || idx >= items.length) {
      selectedStationIndex.value = null
      stationNameDraft.value = ''
      stationDistanceDraft.value = null
      return
    }
    const s = items[idx]
    stationNameDraft.value = s.name ?? ''
    stationDistanceDraft.value =
      idx === 0 ? null : (s.distanceFromPrevKm ?? null)
  }
)

/** 새 정류장·역 만들기 (즉시 생성 후 마지막 정류장 선택) */
const handleAddStation = async () => {
  if (!selectedRoute.value) return

  try {
    const baseRaw = (selectedRoute.value as any).stations ?? []
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
      name: '새 정류장·역',
      order: nextOrder,
      distanceFromPrevKm: nextOrder === 1 ? null : 0,
      isBuilt: false,
      isMajor: false,
      isTerminal: false,
    }

    const next = [...sorted, newStation]

    await updateRoute((selectedRoute.value as any).id, {
      stations: next,
    })

    const newIndex = next.length - 1
    selectedStationIndex.value = newIndex
    stationNameDraft.value = newStation.name
    stationDistanceDraft.value =
      newIndex === 0 ? null : (newStation.distanceFromPrevKm as number | null)
  } catch (err) {
    console.error('[RoutesStopsEditorTab] handleAddStation error:', err)
  }
}

/** 정류장 삭제 */
const handleDeleteStation = async () => {
  if (!selectedRoute.value) return
  if (selectedStationIndex.value == null) return

  const index = selectedStationIndex.value
  const baseRaw = (selectedRoute.value as any).stations ?? []
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

  sorted.splice(index, 1)

  const reindexed = sorted.map((s, idx) => ({
    ...s,
    order: idx + 1,
  }))

  try {
    await updateRoute((selectedRoute.value as any).id, {
      stations: reindexed,
    })

    if (reindexed.length === 0) {
      selectedStationIndex.value = null
      stationNameDraft.value = ''
      stationDistanceDraft.value = null
    } else if (index >= reindexed.length) {
      const newIndex = reindexed.length - 1
      selectedStationIndex.value = newIndex
      const s: any = reindexed[newIndex]
      stationNameDraft.value = s.name ?? ''
      stationDistanceDraft.value =
        newIndex === 0 ? null : (s.distanceFromPrevKm ?? null)
    } else {
      const s: any = reindexed[index]
      selectedStationIndex.value = index
      stationNameDraft.value = s.name ?? ''
      stationDistanceDraft.value =
        index === 0 ? null : (s.distanceFromPrevKm ?? null)
    }
  } catch (err) {
    console.error('[RoutesStopsEditorTab] handleDeleteStation error:', err)
  }
}

/** 순서 변경 (위/아래 이동) */
const moveStation = async (fromIndex: number, toIndex: number) => {
  if (!selectedRoute.value) return

  const baseRaw = (selectedRoute.value as any).stations ?? []
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

  const reindexed = sorted.map((s, idx) => ({
    ...s,
    order: idx + 1,
  }))

  try {
    await updateRoute((selectedRoute.value as any).id, {
      stations: reindexed,
    })

    if (selectedStationIndex.value != null) {
      if (selectedStationIndex.value === fromIndex) {
        selectedStationIndex.value = toIndex
      } else if (
        selectedStationIndex.value > fromIndex &&
        selectedStationIndex.value <= toIndex
      ) {
        selectedStationIndex.value -= 1
      } else if (
        selectedStationIndex.value < fromIndex &&
        selectedStationIndex.value >= toIndex
      ) {
        selectedStationIndex.value += 1
      }
    }
  } catch (err) {
    console.error('[RoutesStopsEditorTab] moveStation error:', err)
  }
}

/** 선택된 정류장 이름·거리 저장 */
const handleSaveStation = async () => {
  if (!selectedRoute.value) return
  if (selectedStationIndex.value == null) return

  const index = selectedStationIndex.value
  const name = stationNameDraft.value.trim()
  if (!name) return

  try {
    savingStation.value = true

    const baseRaw = (selectedRoute.value as any).stations ?? []
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

    const original: any = sorted[index]
    if (!original || typeof original !== 'object') return

    let nextDistance: number | null
    if (index === 0) {
      nextDistance = null
    } else if (typeof stationDistanceDraft.value === 'number') {
      nextDistance = Math.max(0, stationDistanceDraft.value)
    } else {
      nextDistance = null
    }

    const updated = {
      ...original,
      name,
      distanceFromPrevKm: nextDistance,
    }

    sorted.splice(index, 1, updated)

    const reindexed = sorted.map((s, idx) => ({
      ...s,
      order: typeof (s as any).order === 'number' ? (s as any).order : idx + 1,
    }))

    await updateRoute((selectedRoute.value as any).id, {
      stations: reindexed,
    })
  } catch (err) {
    console.error('[RoutesStopsEditorTab] handleSaveStation error:', err)
  } finally {
    savingStation.value = false
  }
}
</script>

<style scoped>
.routes-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 바깥 카드: 노선 목록 탭과 동일 스타일 */
.routes-panel {
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.55);
  background: rgba(15, 23, 42, 0.96);
  padding: 10px 12px;
}

.routes-panel-main {
  display: flex;
  flex-direction: column;
  gap: 10px;
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

/* 레이아웃 */
.routes-stops-layout {
  margin-top: 6px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stops-main {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* 공통 텍스트 */
.stops-helper-text {
  font-size: 0.78rem;
  opacity: 0.9;
  line-height: 1.5;
}

/* 선택 노선 요약 박스 */
.stops-route-summary {
  display: flex;
  flex-direction: column;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.55);
  background: rgba(15, 23, 42, 0.98);
}

.stops-route-header-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}

.stops-route-header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stops-route-title-row {
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

.stops-route-name {
  font-size: 0.86rem;
  font-weight: 600;
}

.stops-route-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.stops-route-count {
  font-size: 0.76rem;
  opacity: 0.9;
  white-space: nowrap;
}

/* 정류장 카드 리스트 */
.stops-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stops-list-item {
  width: 100%;
  padding: 6px 8px;
  border-radius: 8px;
  border: 1px solid rgba(30, 41, 59, 0.9);
  background: rgba(15, 23, 42, 0.9);
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.12s ease-out,
    background 0.12s ease-out,
    transform 0.05s ease-out,
    box-shadow 0.1s ease-out;
  color: #e5e7eb;
}

.stops-list-item:hover {
  border-color: rgba(129, 140, 248, 0.9);
  background: rgba(15, 23, 42, 0.98);
}

.stops-list-item.is-active {
  background: radial-gradient(
    circle at top left,
    rgba(56, 189, 248, 0.22),
    rgba(15, 23, 42, 0.98)
  );
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(15, 23, 42, 0.9);
}

/* 상단: 순번 + 이름 */
.stops-list-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.stops-list-top-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.stops-index-pill {
  min-width: 20px;
  padding: 2px 6px;
  border-radius: 999px;
  background: rgba(30, 64, 175, 0.5);
  border: 1px solid rgba(129, 140, 248, 0.9);
  font-size: 0.7rem;
  text-align: center;
}

.stops-name-main {
  font-size: 0.82rem;
  font-weight: 600;
}

/* 하단: 거리/출발 칩 + 순서 버튼 */
.stops-list-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  flex-wrap: wrap;
}

.stops-bottom-left {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 칩 스타일 */
.stops-chip {
  padding: 2px 6px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.7);
  background: rgba(15, 23, 42, 0.98);
  font-size: 0.7rem;
  white-space: nowrap;
  opacity: 0.95;
}

.stops-chip--origin {
  background: rgba(56, 189, 248, 0.18);
  border-color: rgba(56, 189, 248, 0.9);
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

/* 버튼 줄 (새 정류장 / 삭제) */
.stops-header-actions {
  display: flex;
  gap: 6px;
}

.stops-actions-row {
  margin-top: 6px;
}

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

.stops-delete-btn {
  padding: 4px 10px;
  font-size: 0.74rem;
  border-radius: 999px;
  border: 1px solid rgba(248, 113, 113, 0.9);
  background: rgba(127, 29, 29, 0.65);
  color: #fee2e2;
  cursor: pointer;
  transition:
    background 0.15s ease-out,
    transform 0.05s ease-out,
    opacity 0.1s.ease-out;
}

.stops-delete-btn:disabled {
  opacity: 0.5;
  cursor: default;
  transform: none;
}

.stops-delete-btn:not(:disabled):hover {
  background: rgba(185, 28, 28, 0.85);
  transform: translateY(-1px);
}

/* 하단 정류장 상세 편집 */
.stops-detail-body {
  margin-top: 8px;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.5);
  background: rgba(15, 23, 42, 0.98);
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stops-detail-empty {
  font-size: 0.78rem;
  opacity: 0.9;
}

.stops-detail-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stops-detail-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.stops-detail-field {
  flex: 1 1 140px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.stops-detail-field-full {
  flex-basis: 100%;
}

.stops-detail-label {
  font-size: 0.72rem;
  opacity: 0.85;
}

.stops-detail-input {
  border-radius: 6px;
  border: 1px solid rgba(148, 163, 184, 0.8);
  background: rgba(15, 23, 42, 0.96);
  padding: 4px 8px;
  font-size: 0.8rem;
  color: #e5e7eb;
}

.stops-detail-input:focus {
  outline: 1px solid rgba(96, 165, 250, 0.9);
  outline-offset: 1px;
}

.stops-detail-hint {
  margin-top: 2px;
  font-size: 0.7rem;
  opacity: 0.8;
}

.stops-detail-actions {
  display: flex;
  justify-content: flex-end;
}

.stops-save-btn {
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 0.8rem;
  border: 1px solid rgba(52, 211, 153, 0.9);
  background: rgba(5, 150, 105, 0.6);
  color: #ecfdf5;
  cursor: pointer;
  font-weight: 600;
}

.stops-save-btn:disabled {
  opacity: 0.5;
  cursor: default;
}

.stops-save-btn:not(:disabled):hover {
  background: rgba(5, 150, 105, 0.8);
}

/* 노선 목록 배지 스타일 재사용 */
.routes-badge {
  padding: 2px 6px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.7);
  font-size: 0.7rem;
}

.routes-badge--soft {
  background: rgba(30, 64, 175, 0.3);
}

.routes-badge--outline {
  background: transparent;
}

.routes-status-pill {
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.7rem;
}

.routes-status-pill[data-status='설계중'] {
  background: rgba(148, 163, 184, 0.3);
}

.routes-status-pill[data-status='운행중'] {
  background: rgba(34, 197, 94, 0.25);
}

.routes-status-pill[data-status='중단'] {
  background: rgba(248, 113, 113, 0.25);
}

/* 반응형 */
@media (min-width: 1040px) {
  .routes-stops-layout {
    flex-direction: column;
  }
}
</style>
