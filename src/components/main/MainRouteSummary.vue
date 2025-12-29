<!-- src/components/main/MainRouteSummary.vue -->
<template>
  <section class="route-summary-card">
    <header class="card-header">
      <div>
        <h3 class="card-title">주요 노선 요약</h3>
        <p class="card-sub">
          수익과 혼잡도가 높은 주요 노선들을 한눈에 확인하고,
          노선 편집 화면으로 바로 진입할 수 있습니다.
        </p>
      </div>
    </header>

    <div
      v-if="!routes.length"
      class="empty"
    >
      아직 등록된 노선이 없습니다.
      <br />
      노선 관리 화면에서 새 노선을 생성해 보세요.
    </div>

    <ul
      v-else
      class="route-list"
    >
      <li
        v-for="route in topRoutes"
        :key="route.id"
        class="route-item"
        @click="openRoute(route.id)"
      >
        <div class="route-main">
          <div class="route-name-row">
            <span class="route-name">{{ route.name }}</span>
            <span
              class="status-chip"
              :data-status="route.status"
            >
              {{ statusLabel(route.status) }}
            </span>
          </div>

          <div class="meta-row">
            <!-- 운송 수단 -->
            <span
              v-if="route.transport"
              class="meta-chip transport-chip"
            >
              {{ transportLabel(route.transport) }}
            </span>

            <!-- 노선 유형 -->
            <span class="meta-chip">
              {{ typeLabel(route.type) }}
            </span>

            <!-- 정류장 수 -->
            <span class="meta-chip">
              정류장 {{ stopsCount(route) }}개
            </span>
          </div>

          <div class="metrics-row">
            <div class="metric-block">
              <div class="metric-label">평균 탑승률</div>
              <div class="metric-value">
                {{ congestionText(route) }}
              </div>
            </div>
            <div class="metric-block">
              <div class="metric-label">최근 1시간 수익</div>
              <div class="metric-value">
                {{ formatCurrency(route.revenueSummary?.lastHour) }}
              </div>
            </div>
            <div class="metric-block hide-on-narrow">
              <div class="metric-label">최근 1일 수익</div>
              <div class="metric-value">
                {{ formatCurrency(route.revenueSummary?.lastDay) }}
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          class="open-button"
          @click.stop="openRoute(route.id)"
        >
          편집
        </button>
      </li>
    </ul>

    <footer
      v-if="routes.length"
      class="card-footer"
    >
      <button
        type="button"
        class="footer-button"
        @click="openDefaultRoute"
      >
        노선 관리 전체 보기
      </button>
    </footer>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useRoutesStore } from '@/composables/useRoutesStore'

const emit = defineEmits(['open-route'])

const { routes } = useRoutesStore()

/**
 * 상위 노선 선정 기준:
 * - 최근 1시간 수익(desc) 우선
 * - 그게 같으면 평균 탑승률(desc)
 * - 최대 3개까지
 */
const topRoutes = computed(() => {
  const list = [...routes.value]
  list.sort((a, b) => {
    const aLast = a.revenueSummary?.lastHour ?? 0
    const bLast = b.revenueSummary?.lastHour ?? 0
    if (bLast !== aLast) return bLast - aLast

    const aLf = typeof a.avgLoadFactor === 'number' ? a.avgLoadFactor : 0
    const bLf = typeof b.avgLoadFactor === 'number' ? b.avgLoadFactor : 0
    return bLf - aLf
  })
  return list.slice(0, 3)
})

function stopsCount(route) {
  if (!route) return 0
  if (Array.isArray(route.stops)) return route.stops.length
  return route.stopsCount ?? 0
}

function statusLabel(status) {
  switch (status) {
    case 'active':
    case '운영중':
      return '운행 중'
    case 'paused':
      return '일시 중지'
    case 'draft':
    case '설계중':
      return '설계 중'
    case '건설중':
      return '건설 중'
    default:
      return status || '알 수 없음'
  }
}

function typeLabel(type) {
  switch (type) {
    case 'virtual':
    case '가상':
      return '가상 노선'
    case 'facility':
    case '시설':
      return '시설 노선'
    case 'real':
    case '현실':
      return '실제 기반'
    default:
      return type || '기타'
  }
}

function transportLabel(mode) {
  switch (mode) {
    case 'bus':
      return '버스 노선'
    case 'truck':
      return '트럭 노선'
    case 'rail':
      return '철도 노선'
    case 'air':
      return '항공 노선'
    case 'ship':
      return '해상 노선'
    case 'space':
      return '우주선 노선'
    default:
      return '운송 수단 미지정'
  }
}

function congestionText(route) {
  if (!route) return '-'
  const lf = route.avgLoadFactor
  if (typeof lf !== 'number') return '-'
  const pct = Math.round(lf * 100)
  return `${pct}%`
}

function formatCurrency(value) {
  if (typeof value !== 'number') return '-'
  return value.toLocaleString('ko-KR') + ' 크레딧'
}

function openRoute(routeId) {
  if (!routeId) return
  emit('open-route', routeId)
}

function openDefaultRoute() {
  const first = topRoutes.value[0] ?? routes.value[0]
  if (!first) return
  openRoute(first.id)
}
</script>

<style scoped>
.route-summary-card {
  padding: 14px 12px;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.86);
  border: 1px solid rgba(148, 163, 184, 0.55);
  font-size: 0.82rem;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.card-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.card-title {
  font-size: 0.9rem;
  font-weight: 600;
}

.card-sub {
  font-size: 0.76rem;
  opacity: 0.85;
}

/* 빈 상태 */
.empty {
  margin-top: 6px;
  padding: 10px;
  border-radius: 10px;
  border: 1px dashed rgba(148, 163, 184, 0.8);
  background: rgba(15, 23, 42, 0.96);
  text-align: center;
  line-height: 1.6;
}

/* 리스트 */
.route-list {
  list-style: none;
  margin: 6px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.route-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
  padding: 8px 8px;
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.98);
  border: 1px solid rgba(51, 65, 85, 0.9);
  cursor: pointer;
  transition:
    border-color 0.12s ease,
    background 0.12s ease,
    transform 0.05s ease;
}

.route-item:hover {
  border-color: rgba(56, 189, 248, 0.9);
  background: radial-gradient(
    circle at 0% 0%,
    rgba(56, 189, 248, 0.12),
    rgba(15, 23, 42, 0.98)
  );
  transform: translateY(-1px);
}

.route-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.route-name-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 6px;
}

.route-name {
  font-size: 0.86rem;
  font-weight: 600;
}

/* 상태 칩 */
.status-chip {
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.9);
  white-space: nowrap;
}

.status-chip[data-status='active'],
.status-chip[data-status='운영중'] {
  border-color: rgba(52, 211, 153, 0.95);
}

.status-chip[data-status='paused'] {
  border-color: rgba(248, 250, 109, 0.95);
}

.status-chip[data-status='draft'],
.status-chip[data-status='설계중'] {
  border-color: rgba(148, 163, 184, 0.95);
}

.status-chip[data-status='건설중'] {
  border-color: rgba(96, 165, 250, 0.95);
}

/* 메타 */
.meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.meta-chip {
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 999px;
  border: 1px solid rgba(71, 85, 105, 0.9);
  opacity: 0.9;
}

/* 운송 수단 칩 살짝 강조 */
.transport-chip {
  font-weight: 600;
}

/* 지표 */
.metrics-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
  margin-top: 4px;
}

.metric-block {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.metric-label {
  font-size: 0.7rem;
  opacity: 0.78;
}

.metric-value {
  font-size: 0.8rem;
}

/* 편집 버튼 */
.open-button {
  align-self: center;
  padding: 5px 9px;
  border-radius: 999px;
  border: 1px solid rgba(56, 189, 248, 0.95);
  background: radial-gradient(
    circle at 0% 0%,
    rgba(56, 189, 248, 0.24),
    rgba(15, 23, 42, 0.98)
  );
  color: #e5e7eb;
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

/* 푸터 */
.card-footer {
  margin-top: 6px;
  display: flex;
  justify-content: flex-end;
}

.footer-button {
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.9);
  background: rgba(15, 23, 42, 0.98);
  color: #e5e7eb;
  font-size: 0.76rem;
  cursor: pointer;
}

/* 반응형 */
@media (max-width: 768px) {
  .metrics-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .hide-on-narrow {
    display: none;
  }
}
</style>
