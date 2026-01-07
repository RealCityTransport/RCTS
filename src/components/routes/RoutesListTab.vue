<!-- src/components/routes/RoutesListTab.vue -->
<template>
  <div class="routes-tab-root">
    <!-- 메인: 내 노선 목록 테이블 -->
    <section class="routes-panel routes-panel-main">
      <header class="routes-main-header">
        <div class="routes-main-header-left">
          <h4 class="panel-title">노선 목록</h4>
          <p class="panel-desc">
            현재 로그인된 계정 기준으로 작성된 노선들을 한눈에 정리해서 보여줍니다.
            노선 이름, 코드, 교통수단, 상태, 타입, 마지막 수정 시각 등을 기준으로
            운영 중인 노선을 관리할 수 있습니다.
          </p>
        </div>

        <div class="routes-main-header-right">
          <button
            type="button"
            class="routes-main-button"
            @click="openCreateForm"
          >
            새 노선 만들기
          </button>
        </div>
      </header>

      <!-- 상태 메시지 -->
      <div class="routes-state">
        <p v-if="loading" class="routes-state-text">
          노선 목록을 불러오는 중입니다…
        </p>
        <p
          v-else-if="hasError"
          class="routes-state-text routes-state-text--error"
        >
          노선 데이터를 불러오는 중 문제가 발생했습니다.
          잠시 후 다시 시도해 주세요.
        </p>
        <p
          v-else-if="!loading && routes.length === 0"
          class="routes-state-text"
        >
          아직 등록된 노선이 없습니다.
          <strong>우측 상단의 버튼</strong>으로 첫 노선을 생성해 보세요.
        </p>
      </div>

      <!-- 인라인 새 노선 생성 폼 -->
      <div
        v-if="showCreateForm"
        class="routes-create-form"
      >
        <!-- 노선 이름 -->
        <label class="routes-create-label">
          새 노선 이름
        </label>
        <div class="routes-create-fields">
          <input
            v-model="newRouteName"
            type="text"
            class="routes-create-input"
            placeholder="예: 100번 순환버스 / 1호선 외선"
            @keyup.enter="handleCreateRoute"
          />
          <button
            type="button"
            class="routes-create-submit"
            :disabled="creating || !newRouteName.trim()"
            @click="handleCreateRoute"
          >
            저장
          </button>
          <button
            type="button"
            class="routes-create-cancel"
            :disabled="creating"
            @click="cancelCreateRoute"
          >
            취소
          </button>
        </div>

        <!-- 운송수단 / 노선 형태 옵션 -->
        <div class="routes-create-options">
          <!-- 운송수단 -->
          <div class="routes-field-group">
            <div class="routes-field-label">
              운송수단
            </div>
            <div class="routes-toggle-group">
              <button
                type="button"
                class="routes-toggle-button"
                :class="{ 'is-active': newRouteTransport === '버스' }"
                :disabled="creating"
                @click="newRouteTransport = '버스'"
              >
                버스
              </button>
              <button
                type="button"
                class="routes-toggle-button"
                :class="{ 'is-active': newRouteTransport === '철도' }"
                :disabled="creating"
                @click="newRouteTransport = '철도'"
              >
                철도
              </button>
            </div>
          </div>

          <!-- 노선 형태(타입) -->
          <div class="routes-field-group">
            <div class="routes-field-label">
              노선 형태 (타입)
            </div>
            <div class="routes-toggle-group">
              <button
                type="button"
                class="routes-toggle-button"
                :class="{ 'is-active': newRouteType === '가상' }"
                :disabled="creating"
                @click="newRouteType = '가상'"
              >
                가상
              </button>
              <button
                type="button"
                class="routes-toggle-button"
                :class="{ 'is-active': newRouteType === '현실' }"
                :disabled="creating"
                @click="newRouteType = '현실'"
              >
                현실
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 노선 목록 테이블 -->
      <div
        v-if="!loading && routes.length > 0"
        class="routes-table-wrapper"
      >
        <table class="routes-table">
          <thead>
            <tr>
              <th class="col-color"></th>
              <th class="col-name">노선 이름</th>
              <th class="col-code">코드</th>
              <th class="col-transport">수단</th>
              <th class="col-shape">형태</th>
              <th class="col-status">상태</th>
              <th class="col-type">타입</th>
              <th class="col-updated">마지막 수정</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="route in routes"
              :key="route.id"
              class="routes-table-row"
            >
              <td class="col-color">
                <span
                  class="routes-color-dot"
                  :style="{ backgroundColor: route.color || '#888888' }"
                ></span>
              </td>

              <td class="col-name">
                <div class="routes-name-main">
                  {{ route.name || '(이름 없음)' }}
                </div>
                <div
                  v-if="route.description"
                  class="routes-name-sub"
                >
                  {{ route.description }}
                </div>
              </td>

              <td class="col-code">
                <span class="routes-code">
                  {{ route.lineCode || '—' }}
                </span>
              </td>

              <td class="col-transport">
                <span class="routes-badge">
                  {{ route.transport || '—' }}
                </span>
              </td>

              <td class="col-shape">
                <span class="routes-badge routes-badge--soft">
                  {{ route.shape || '—' }}
                </span>
              </td>

              <td class="col-status">
                <span
                  class="routes-status-pill"
                  :data-status="route.status"
                >
                  {{ route.status || '—' }}
                </span>
              </td>

              <td class="col-type">
                <span class="routes-badge routes-badge--outline">
                  {{ route.type || '—' }}
                </span>
              </td>

              <td class="col-updated">
                {{ formatDate(route.updatedAt || route.createdAt) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- 보조 패널: 최근 수정 노선 등 -->
    <section class="routes-panel routes-panel-sub">
      <div class="sub-grid">
        <article class="sub-card">
          <h4 class="sub-card-title">최근에 수정한 노선</h4>

          <ul
            v-if="hasRoutes"
            class="recent-list"
          >
            <li
              v-for="route in recentRoutes"
              :key="route.id"
              class="recent-item"
            >
              <div class="recent-item-main">
                <span
                  class="recent-color-dot"
                  :style="{ backgroundColor: route.color || '#888888' }"
                ></span>
                <span class="recent-name">
                  {{ route.name || '(이름 없음)' }}
                </span>
              </div>
              <div class="recent-meta">
                <span
                  class="recent-status"
                  :data-status="route.status"
                >
                  {{ route.status || '—' }}
                </span>
                <span class="recent-updated">
                  {{ formatDate(route.updatedAt || route.createdAt) }}
                </span>
              </div>
            </li>
          </ul>

          <p
            v-else
            class="sub-card-text"
          >
            아직 노선이 없어서 최근 수정 내역이 없습니다.
            노선을 한 개 이상 생성하면 이 영역에서 최근 작업한 노선을
            빠르게 다시 찾아볼 수 있습니다.
          </p>
        </article>

        <article class="sub-card">
          <h4 class="sub-card-title">노선 기획 메모</h4>
          <p class="sub-card-text">
            향후 추가를 검토 중인 노선이나 시범 운행 노선을 메모해 두는 용도로
            사용할 서브 패널입니다.
            나중에는 가벼운 입력 UI를 붙여서
            정식 노선으로 등록하기 전까지 간단한 아이디어를 적어둘 수 있도록
            확장할 예정입니다.
          </p>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { usePlayerRoutes } from '@/composables/usePlayerRoutes'

const {
  routes,
  loading,
  hasError,
  createRoute,
} = usePlayerRoutes()

const hasRoutes = computed(() => !loading.value && routes.value.length > 0)

const recentRoutes = computed(() => {
  if (!routes.value) return []
  // 이미 updatedAt 기준으로 정렬된 상태라 가정하고 상위 5개만 노출
  return routes.value.slice(0, 5)
})

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

/** 인라인 새 노선 생성 UI 상태 */
const showCreateForm = ref(false)
const newRouteName = ref('')
const creating = ref(false)

/** 새 노선 기본 옵션 */
const newRouteTransport = ref<'버스' | '철도'>('버스')
const newRouteType = ref<'가상' | '현실'>('가상')

const openCreateForm = () => {
  showCreateForm.value = true
  newRouteName.value = ''
  // 새 폼 열 때 기본값으로 리셋
  newRouteTransport.value = '버스'
  newRouteType.value = '가상'
}

const cancelCreateRoute = () => {
  showCreateForm.value = false
  newRouteName.value = ''
}

const handleCreateRoute = async () => {
  const name = newRouteName.value.trim()
  if (!name || creating.value) return

  try {
    creating.value = true
    await createRoute({
      name,
      transport: newRouteTransport.value,
      type: newRouteType.value,
    })
    // 성공 후 초기화
    newRouteName.value = ''
    showCreateForm.value = false
  } catch (err) {
    console.error('[RoutesListTab] createRoute error:', err)
  } finally {
    creating.value = false
  }
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

.routes-main-header-right {
  display: flex;
  align-items: center;
}

.routes-main-button {
  padding: 6px 12px;
  font-size: 0.78rem;
  border-radius: 999px;
  border: 1px solid rgba(129, 140, 248, 1);
  background: linear-gradient(
    135deg,
    rgba(79, 70, 229, 0.95),
    rgba(30, 64, 175, 0.95)
  );
  color: #e5e7eb;
  cursor: pointer;
  transition:
    background 0.15s ease-out,
    transform 0.05s ease-out,
    box-shadow 0.1s ease-out;
}

.routes-main-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(15, 23, 42, 0.6);
}

/* 상태 메시지 */

.routes-state {
  min-height: 16px;
}

.routes-state-text {
  font-size: 0.78rem;
  opacity: 0.9;
}

.routes-state-text--error {
  color: #fecaca;
}

/* 인라인 새 노선 생성 폼 */

.routes-create-form {
  margin-top: 4px;
  padding: 6px 8px;
  border-radius: 8px;
  border: 1px dashed rgba(148, 163, 184, 0.7);
  background: rgba(15, 23, 42, 0.98);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.routes-create-label {
  font-size: 0.78rem;
  opacity: 0.9;
}

.routes-create-fields {
  display: flex;
  gap: 6px;
  align-items: center;
}

.routes-create-input {
  flex: 1;
  min-width: 0;
  padding: 5px 8px;
  border-radius: 6px;
  border: 1px solid rgba(148, 163, 184, 0.8);
  background: rgba(15, 23, 42, 0.95);
  color: #e5e7eb;
  font-size: 0.78rem;
}

.routes-create-input::placeholder {
  color: rgba(148, 163, 184, 0.9);
}

.routes-create-submit,
.routes-create-cancel {
  padding: 4px 10px;
  font-size: 0.74rem;
  border-radius: 999px;
  cursor: pointer;
  transition:
    background 0.15s ease-out,
    transform 0.05s ease-out,
    opacity 0.1s ease-out;
}

.routes-create-submit {
  border: 1px solid rgba(129, 140, 248, 1);
  background: rgba(30, 64, 175, 0.9);
  color: #e5e7eb;
}

.routes-create-cancel {
  border: 1px solid rgba(148, 163, 184, 0.7);
  background: transparent;
  color: #e5e7eb;
}

.routes-create-submit:disabled,
.routes-create-cancel:disabled {
  opacity: 0.5;
  cursor: default;
  transform: none;
}

.routes-create-submit:not(:disabled):hover,
.routes-create-cancel:not(:disabled):hover {
  transform: translateY(-1px);
}

/* 운송수단 / 타입 옵션 */

.routes-create-options {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 8px;
}

.routes-field-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.routes-field-label {
  font-size: 0.76rem;
  opacity: 0.9;
}

.routes-toggle-group {
  display: inline-flex;
  gap: 4px;
  padding: 2px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(55, 65, 81, 0.9);
}

.routes-toggle-button {
  padding: 4px 10px;
  font-size: 0.74rem;
  border-radius: 999px;
  border: none;
  background: transparent;
  color: #e5e7eb;
  cursor: pointer;
  transition:
    background 0.15s ease-out,
    color 0.15s ease-out,
    transform 0.05s ease-out,
    box-shadow 0.1s ease-out;
}

.routes-toggle-button.is-active {
  background: radial-gradient(
      circle at top left,
      rgba(96, 165, 250, 0.4),
      rgba(37, 99, 235, 0.95)
    );
  color: #f9fafb;
  box-shadow: 0 0 0 1px rgba(129, 140, 248, 0.9);
}

.routes-toggle-button:disabled {
  opacity: 0.6;
  cursor: default;
}

.routes-toggle-button:not(:disabled):hover {
  transform: translateY(-1px);
}

/* 테이블 */

.routes-table-wrapper {
  margin-top: 4px;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.55);
  background: rgba(15, 23, 42, 0.98);
  overflow: hidden;
}

.routes-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.78rem;
}

.routes-table thead {
  background: rgba(15, 23, 42, 0.96);
}

.routes-table th,
.routes-table td {
  padding: 6px 8px;
  text-align: left;
  border-bottom: 1px solid rgba(30, 41, 59, 0.9);
}

/* 컬럼 대략적인 너비 */

.col-color {
  width: 24px;
}

.col-code {
  width: 80px;
}

.col-transport,
.col-shape,
.col-status,
.col-type {
  width: 80px;
}

.col-updated {
  width: 130px;
}

/* 행 배경 */

.routes-table-row:nth-child(odd) {
  background: rgba(15, 23, 42, 0.7);
}

.routes-table-row:nth-child(even) {
  background: rgba(15, 23, 42, 0.5);
}

/* 컬러 점 */

.routes-color-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 999px;
  border: 1px solid rgba(15, 23, 42, 0.9);
}

/* 이름/설명 */

.routes-name-main {
  font-weight: 600;
}

.routes-name-sub {
  font-size: 0.7rem;
  opacity: 0.8;
}

/* 코드/배지/상태 */

.routes-code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
  font-size: 0.72rem;
  opacity: 0.9;
}

.routes-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 6px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.7);
  font-size: 0.7rem;
  opacity: 0.95;
}

.routes-badge--soft {
  background: rgba(30, 64, 175, 0.3);
}

.routes-badge--outline {
  background: transparent;
}

/* 상태 pill */

.routes-status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.7rem;
}

.routes-status-pill[data-status='설계중'] {
  background: rgba(148, 163, 184, 0.3);
  color: #e5e7eb;
}

.routes-status-pill[data-status='운행중'] {
  background: rgba(34, 197, 94, 0.25);
  color: #bbf7d0;
}

.routes-status-pill[data-status='중단'] {
  background: rgba(248, 113, 113, 0.25);
  color: #fecaca;
}

/* 보조 패널 */

.routes-panel-sub {
  display: flex;
  flex-direction: column;
  margin-top: 4px;
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

/* 최근 노선 리스트 */

.recent-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.recent-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 4px 6px;
  border-radius: 6px;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(30, 41, 59, 0.9);
}

.recent-item-main {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
}

.recent-color-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  border: 1px solid rgba(15, 23, 42, 0.9);
}

.recent-name {
  font-weight: 600;
}

.recent-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.7rem;
  opacity: 0.85;
}

.recent-status {
  padding: 1px 6px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.7);
}

.recent-status[data-status='설계중'] {
  border-color: rgba(148, 163, 184, 0.8);
}

.recent-status[data-status='운행중'] {
  border-color: rgba(34, 197, 94, 0.8);
}

.recent-status[data-status='중단'] {
  border-color: rgba(248, 113, 113, 0.8);
}

.recent-updated {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
}

/* 반응형 */

@media (min-width: 1040px) {
  .sub-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
