<!-- src/components/routes/RoutesListTab.vue -->
<template>
  <div class="routes-tab-root">
    <section class="routes-panel routes-panel-main">
      <!-- 메인 레이아웃: 위(목록) / 아래(상세) -->
      <div class="routes-main-layout">
        <!-- 위: 노선 목록 -->
        <div class="routes-list-area">
          <div class="routes-section-header">
            <h5 class="routes-section-title">노선 목록</h5>
          </div>

          <!-- 카드형 노선 리스트 -->
          <div
            v-if="!loading && routes.length > 0"
            class="routes-list"
          >
            <button
              v-for="route in routes"
              :key="route.id"
              type="button"
              class="routes-list-item"
              :class="{ 'is-active': route.id === activeRouteId }"
              @click="handleSelect(route.id)"
            >
              <!-- 1줄: 색 점 + 노선 이름 -->
              <div class="routes-list-top">
                <span
                  class="routes-color-dot"
                  :style="{ backgroundColor: route.color || '#888888' }"
                ></span>
                <span class="routes-name-main">
                  {{ route.name || '(이름 없음)' }}
                </span>
              </div>

              <!-- 선택적으로 설명 한 줄 (있을 때만) -->
              <div
                v-if="route.description"
                class="routes-name-sub"
              >
                {{ route.description }}
              </div>

              <!-- 2줄: 태그들을 작은 카드(칩) 형태로 -->
              <div class="routes-list-bottom">
                <span class="routes-chip">
                  {{ route.transport || '수단 미지정' }}
                </span>
                <span class="routes-chip">
                  {{ route.shape || '형태 미지정' }}
                </span>
                <span
                  class="routes-chip routes-chip--status"
                  :data-status="route.status || ''"
                >
                  {{ route.status || '상태 미지정' }}
                </span>
                <span class="routes-chip">
                  {{ route.type || '타입 미지정' }}
                </span>
                <span class="routes-chip routes-chip--date">
                  {{ formatDate(route.updatedAt || route.createdAt) }}
                </span>
              </div>
            </button>
          </div>

          <!-- 로딩/에러/빈 상태 -->
          <p v-if="loading" class="routes-state-text">
            노선 목록을 불러오는 중입니다…
          </p>
          <p
            v-else-if="hasError"
            class="routes-state-text routes-state-text--error"
          >
            노선 데이터를 불러오는 중 문제가 발생했습니다.
          </p>
          <p
            v-else-if="!loading && routes.length === 0"
            class="routes-state-text"
          >
            아직 등록된 노선이 없습니다.
          </p>
        </div>

        <!-- 아래: 새 노선 버튼 + 노선 삭제 + 노선 상세 -->
        <div class="routes-detail-area">
          <div class="routes-detail-header">
            <div class="detail-header-main">
              <button
                type="button"
                class="new-route-button"
                @click="handleCreateNewRoute"
              >
                새 노선 만들기
              </button>

              <button
                type="button"
                class="delete-route-button"
                :disabled="!activeRoute"
                @click="handleDeleteRoute"
              >
                노선 삭제
              </button>
            </div>
          </div>

          <div class="routes-detail-body">
            <!-- 선택 안 된 경우 안내 -->
            <div
              v-if="!activeRoute"
              class="routes-detail-empty"
            >
              위 목록에서 노선을 선택하거나 새 노선을 만들어 주세요.
            </div>

            <!-- 선택된 노선 기본 정보 편집 -->
            <div
              v-else
              class="routes-detail-form"
            >
              <!-- 이름 -->
              <div class="detail-form-row">
                <div class="detail-field detail-field-full">
                  <label class="detail-label">
                    노선 이름
                  </label>
                  <input
                    class="detail-input"
                    type="text"
                    :value="activeRoute?.name || ''"
                    @input="handleFieldChange('name', $event)"
                  />
                </div>
              </div>

              <!-- 수단 / 타입 -->
              <div class="detail-form-row">
                <div class="detail-field">
                  <label class="detail-label">
                    수단
                  </label>
                  <select
                    class="detail-select"
                    :value="activeRoute?.transport || ''"
                    @change="handleFieldChange('transport', $event)"
                  >
                    <option value="">선택 없음</option>
                    <option value="bus">버스</option>
                    <option value="rail">철도</option>
                  </select>
                </div>

                <div class="detail-field">
                  <label class="detail-label">
                    타입
                  </label>
                  <select
                    class="detail-select"
                    :value="activeRoute?.type || ''"
                    @change="handleFieldChange('type', $event)"
                  >
                    <option value="">선택 없음</option>
                    <option value="가상">가상</option>
                    <option value="현실">현실</option>
                  </select>
                </div>
              </div>

              <!-- 상태 / 형태 -->
              <div class="detail-form-row">
                <div class="detail-field">
                  <label class="detail-label">
                    상태
                  </label>
                  <select
                    class="detail-select"
                    :value="activeRoute?.status || ''"
                    @change="handleFieldChange('status', $event)"
                  >
                    <option value="">선택 없음</option>
                    <option value="설계중">설계중</option>
                    <option value="운행중">운행중</option>
                    <option value="중단">중단</option>
                  </select>
                </div>

                <div class="detail-field">
                  <label class="detail-label">
                    형태
                  </label>
                  <input
                    class="detail-input"
                    type="text"
                    :value="activeRoute?.shape || ''"
                    @input="handleFieldChange('shape', $event)"
                  />
                </div>
              </div>

              <!-- 색상 -->
              <div class="detail-form-row">
                <div class="detail-field">
                  <label class="detail-label">
                    색상
                  </label>
                  <div class="detail-color-row">
                    <input
                      class="detail-color-input"
                      type="color"
                      :value="activeRoute?.color || '#888888'"
                      @input="handleFieldChange('color', $event)"
                    />
                    <span class="detail-color-code">
                      {{ activeRoute?.color || '#888888' }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- 저장 버튼 -->
              <div class="detail-actions-row">
                <button
                  type="button"
                  class="save-route-button"
                  :disabled="!activeRoute || savingRoute"
                  @click="handleSaveRoute"
                >
                  {{ savingRoute ? '저장 중…' : '변경 내용 저장' }}
                </button>
              </div>
            </div>
          </div>
        </div>
        <!-- // 상세 영역 끝 -->
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { usePlayerRoutes } from '@/composables/usePlayerRoutes'

const savingRoute = ref(false)

const {
  routes,
  loading,
  hasError,
  activeRouteId,
  selectRoute,
  createRoute,
  deleteRoute,
  updateRoute,
} = usePlayerRoutes()

const activeRoute = computed(() =>
  routes.value.find((r) => r.id === activeRouteId.value) || null,
)

const handleSelect = (id: string) => {
  selectRoute(id)
}

const handleCreateNewRoute = async () => {
  try {
    const id = await createRoute({
      name: '새 노선',
      lineCode: '',
      transport: 'bus',
      type: '가상',
      status: '설계중',
      shape: '순환',
      color: '#888888',
      description: '',
    })
    if (id) {
      selectRoute(id)
    }
  } catch (err) {
    console.error('[RoutesListTab] 새 노선 생성 오류:', err)
  }
}

const handleDeleteRoute = async () => {
  if (!activeRoute.value) return
  try {
    await deleteRoute(activeRoute.value.id)
  } catch (err) {
    console.error('[RoutesListTab] 노선 삭제 오류:', err)
  }
}

type RouteEditableKey =
  | 'name'
  | 'transport'
  | 'type'
  | 'status'
  | 'shape'
  | 'color'

const handleFieldChange = (key: RouteEditableKey, event: Event) => {
  if (!activeRoute.value) return
  const target = event.target as HTMLInputElement | HTMLSelectElement
  const value = target.value
  ;(activeRoute.value as any)[key] = value
}

/**
 * 상세 패널에서 수정한 내용을 계정 데이터에 저장
 */
const handleSaveRoute = async () => {
  if (!activeRoute.value) return

  try {
    savingRoute.value = true

    const payload = {
      name: activeRoute.value.name ?? '',
      transport: activeRoute.value.transport ?? '',
      type: activeRoute.value.type ?? '',
      status: activeRoute.value.status ?? '',
      shape: activeRoute.value.shape ?? '',
      color: activeRoute.value.color ?? '#888888',
    }

    await updateRoute(activeRoute.value.id, payload)
  } catch (err) {
    console.error('[RoutesListTab] 노선 저장 오류:', err)
  } finally {
    savingRoute.value = false
  }
}

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

/* 바깥 카드 */
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

/* 메인 레이아웃: 위(목록) / 아래(상세) */
.routes-main-layout {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 각 섹션 헤더 */
.routes-section-header {
  margin-bottom: 4px;
}

.routes-section-title {
  font-size: 0.82rem;
  font-weight: 600;
  opacity: 0.9;
}

/* 위: 노선 목록 영역 */
.routes-list-area {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* 상태 전용 텍스트 */
.routes-state-text {
  font-size: 0.78rem;
  opacity: 0.9;
}

.routes-state-text--error {
  color: #fecaca;
}

/* 카드형 노선 리스트 */
.routes-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.routes-list-item {
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

.routes-list-item:hover {
  border-color: rgba(129, 140, 248, 0.9);
  background: rgba(15, 23, 42, 0.98);
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

/* 상단: 색 점 + 이름 */
.routes-list-top {
  display: flex;
  align-items: center;
  gap: 6px;
}

.routes-color-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  border: 1px solid rgba(15, 23, 42, 0.9);
}

.routes-name-main {
  font-weight: 600;
  font-size: 0.82rem;
}

.routes-name-sub {
  font-size: 0.7rem;
  opacity: 0.8;
}

/* 하단 태그 칩들 */
.routes-list-bottom {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}

/* 공통 칩 스타일 */
.routes-chip {
  padding: 2px 6px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.7);
  background: rgba(15, 23, 42, 0.98);
  font-size: 0.7rem;
  white-space: nowrap;
  opacity: 0.95;
}

/* 상태 칩 색감 약간만 차별화 */
.routes-chip--status[data-status='설계중'] {
  background: rgba(148, 163, 184, 0.25);
}

.routes-chip--status[data-status='운행중'] {
  background: rgba(34, 197, 94, 0.2);
  border-color: rgba(34, 197, 94, 0.8);
}

.routes-chip--status[data-status='중단'] {
  background: rgba(248, 113, 113, 0.2);
  border-color: rgba(248, 113, 113, 0.8);
}

/* 날짜 칩은 살짝 옅게 */
.routes-chip--date {
  opacity: 0.85;
}

/* 아래: 상세 영역 */
.routes-detail-area {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.routes-detail-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-header-main {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

/* 새 노선 버튼: 글자색 또렷하게 */
.new-route-button {
  align-self: flex-start;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.8rem;
  cursor: pointer;
  border: 1px solid rgba(96, 165, 250, 0.9);
  background: rgba(37, 99, 235, 0.25);
  color: #e5edff;
  font-weight: 600;
}

.new-route-button:hover {
  background: rgba(37, 99, 235, 0.4);
}

/* 노선 삭제 버튼 */
.delete-route-button {
  align-self: flex-start;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.8rem;
  cursor: pointer;
  border: 1px solid rgba(239, 68, 68, 0.9);
  background: rgba(127, 29, 29, 0.4);
  color: #fee2e2;
  font-weight: 600;
}

.delete-route-button:hover:not(:disabled) {
  background: rgba(185, 28, 28, 0.6);
}

.delete-route-button:disabled {
  opacity: 0.4;
  cursor: default;
}

/* 상세 패널 */
.routes-detail-body {
  margin-top: 6px;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.5);
  background: rgba(15, 23, 42, 0.98);
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.routes-detail-empty {
  font-size: 0.78rem;
  opacity: 0.85;
}

.routes-detail-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-form-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.detail-field {
  flex: 1 1 140px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.detail-field-full {
  flex-basis: 100%;
}

.detail-label {
  font-size: 0.72rem;
  opacity: 0.85;
}

.detail-input,
.detail-select {
  border-radius: 6px;
  border: 1px solid rgba(148, 163, 184, 0.8);
  background: rgba(15, 23, 42, 0.96);
  padding: 4px 8px;
  font-size: 0.8rem;
  color: #e5e7eb;
}

.detail-input:focus,
.detail-select:focus {
  outline: 1px solid rgba(96, 165, 250, 0.9);
  outline-offset: 1px;
}

/* 색상 입력 */
.detail-color-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.detail-color-input {
  width: 40px;
  height: 24px;
  padding: 0;
  border-radius: 6px;
  border: 1px solid rgba(148, 163, 184, 0.8);
  background: transparent;
}

.detail-color-code {
  font-size: 0.76rem;
  opacity: 0.9;
}

/* 저장 버튼 */
.detail-actions-row {
  margin-top: 4px;
  display: flex;
  justify-content: flex-end;
}

.save-route-button {
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 0.8rem;
  border: 1px solid rgba(52, 211, 153, 0.9);
  background: rgba(5, 150, 105, 0.6);
  color: #ecfdf5;
  cursor: pointer;
  font-weight: 600;
}

.save-route-button:disabled {
  opacity: 0.5;
  cursor: default;
}

.save-route-button:not(:disabled):hover {
  background: rgba(5, 150, 105, 0.8);
}

/* 모바일 */
@media (max-width: 900px) {
  .routes-list-bottom {
    font-size: 0.7rem;
  }
}
</style>
