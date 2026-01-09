<!-- src/components/play/vehicles/VehiclesPage.vue -->
<template>
  <div class="vehicles-root">
    <!-- 상단 헤더 -->
    <header class="vehicles-header">
      <div class="vehicles-header-left">
        <p class="vehicles-badge">VEHICLES · CENTER</p>
        <h3 class="vehicles-title">차량 센터</h3>
        <p class="vehicles-subtitle">차량 등록 · 상태 모니터링 · 정비 이력(더미 UI)</p>
      </div>

      <div class="vehicles-header-right">
        <button type="button" class="vehicles-cta" @click="handleCreateDummy">
          + 차량 등록
        </button>
      </div>
    </header>

    <!-- 상단 요약 -->
    <section class="vehicles-stats">
      <div class="stat-card">
        <div class="stat-top">
          <span class="stat-label">총 차량</span>
          <span class="stat-chip">Fleet</span>
        </div>
        <p class="stat-value">{{ stats.total }}</p>
        <p class="stat-desc">등록된 차량 수</p>
      </div>

      <div class="stat-card">
        <div class="stat-top">
          <span class="stat-label">가동</span>
          <span class="stat-chip chip-running">RUN</span>
        </div>
        <p class="stat-value">{{ stats.running }}</p>
        <p class="stat-desc">운행 또는 배차 상태</p>
      </div>

      <div class="stat-card">
        <div class="stat-top">
          <span class="stat-label">대기</span>
          <span class="stat-chip chip-standby">STBY</span>
        </div>
        <p class="stat-value">{{ stats.standby }}</p>
        <p class="stat-desc">차고지 대기 · 예비</p>
      </div>

      <div class="stat-card">
        <div class="stat-top">
          <span class="stat-label">정비</span>
          <span class="stat-chip chip-maint">MNT</span>
        </div>
        <p class="stat-value">{{ stats.maintenance }}</p>
        <p class="stat-desc">점검/수리 진행중</p>
      </div>
    </section>

    <!-- 컨트롤 바 -->
    <section class="vehicles-controls">
      <div class="control-left">
        <div class="segmented" role="tablist" aria-label="차량 상태 필터">
          <button
            v-for="f in filterOptions"
            :key="f.key"
            type="button"
            class="segmented-item"
            :class="{ 'is-active': statusFilter === f.key }"
            @click="statusFilter = f.key"
          >
            <span class="seg-dot" :class="`dot-${f.key}`"></span>
            <span class="seg-label">{{ f.label }}</span>
          </button>
        </div>
      </div>

      <div class="control-right">
        <div class="search-wrap">
          <span class="search-icon">⌕</span>
          <input
            v-model="query"
            class="search-input"
            type="text"
            placeholder="차량번호 / 모델 / 소속노선 검색"
            autocomplete="off"
          />
        </div>

        <button type="button" class="ghost-btn" @click="resetControls">
          초기화
        </button>
      </div>
    </section>

    <!-- 본문: 좌 리스트 / 우 상세 -->
    <section class="vehicles-layout">
      <!-- 좌: 차량 목록 -->
      <aside class="vehicles-left">
        <div class="panel">
          <div class="panel-head">
            <h4 class="panel-title">차량 목록</h4>
            <p class="panel-meta">표시: {{ filteredVehicles.length }} / {{ vehicles.length }}</p>
          </div>

          <div class="list">
            <button
              v-for="v in filteredVehicles"
              :key="v.id"
              type="button"
              class="list-item"
              :class="{ 'is-active': selectedId === v.id }"
              @click="selectedId = v.id"
            >
              <span class="list-main">
                <span class="status-dot" :class="`status-${v.status}`"></span>
                <span class="list-text">
                  <span class="list-title">{{ v.fleetNo }}</span>
                  <span class="list-sub">
                    {{ v.model }} · {{ v.depot }}
                  </span>
                </span>
              </span>

              <span class="list-right">
                <span class="status-pill" :class="`pill-${v.status}`">
                  {{ statusLabel(v.status) }}
                </span>
                <span class="list-mini">
                  노선 {{ v.route ?? '-' }}
                </span>
              </span>
            </button>

            <div v-if="filteredVehicles.length === 0" class="empty">
              <p class="empty-title">표시할 차량이 없어</p>
              <p class="empty-desc">필터/검색 조건을 바꿔줘.</p>
            </div>
          </div>
        </div>
      </aside>

      <!-- 우: 차량 상세 -->
      <section class="vehicles-right">
        <div class="panel panel-detail">
          <div class="panel-head detail-head">
            <div class="detail-title">
              <h4 class="panel-title">차량 상세</h4>
              <p class="panel-meta">
                선택된 차량의 현황/정비/부품 탭(더미)
              </p>
            </div>

            <div class="detail-actions">
              <button type="button" class="ghost-btn" :disabled="!selectedVehicle" @click="handleAssignDummy">
                노선 배정
              </button>
              <button type="button" class="ghost-btn" :disabled="!selectedVehicle" @click="handleMaintenanceDummy">
                정비 전환
              </button>
            </div>
          </div>

          <div v-if="!selectedVehicle" class="detail-empty">
            <p class="empty-title">차량을 선택해줘</p>
            <p class="empty-desc">왼쪽 목록에서 차량을 누르면 상세가 열려.</p>
          </div>

          <div v-else class="detail-body">
            <!-- 상단 요약 카드 -->
            <div class="detail-summary">
              <div class="summary-card">
                <span class="summary-label">차량번호</span>
                <p class="summary-value">{{ selectedVehicle.fleetNo }}</p>
              </div>
              <div class="summary-card">
                <span class="summary-label">상태</span>
                <p class="summary-value">
                  <span class="status-pill big" :class="`pill-${selectedVehicle.status}`">
                    {{ statusLabel(selectedVehicle.status) }}
                  </span>
                </p>
              </div>
              <div class="summary-card">
                <span class="summary-label">소속</span>
                <p class="summary-value">{{ selectedVehicle.depot }}</p>
              </div>
              <div class="summary-card">
                <span class="summary-label">배정 노선</span>
                <p class="summary-value">{{ selectedVehicle.route ?? '-' }}</p>
              </div>
            </div>

            <!-- 탭 -->
            <div class="tabs" role="tablist" aria-label="차량 상세 탭">
              <button
                v-for="t in detailTabs"
                :key="t.key"
                type="button"
                class="tab"
                :class="{ 'is-active': activeTab === t.key }"
                @click="activeTab = t.key"
              >
                {{ t.label }}
              </button>
            </div>

            <!-- 탭 컨텐츠 -->
            <div class="tab-panel">
              <!-- 개요 -->
              <div v-if="activeTab === 'overview'" class="grid">
                <div class="card">
                  <h5 class="card-title">기본 정보</h5>
                  <div class="kv">
                    <div class="kv-row">
                      <span class="kv-key">모델</span>
                      <span class="kv-val">{{ selectedVehicle.model }}</span>
                    </div>
                    <div class="kv-row">
                      <span class="kv-key">제조사</span>
                      <span class="kv-val">{{ selectedVehicle.maker }}</span>
                    </div>
                    <div class="kv-row">
                      <span class="kv-key">연식</span>
                      <span class="kv-val">{{ selectedVehicle.year }}</span>
                    </div>
                    <div class="kv-row">
                      <span class="kv-key">수용</span>
                      <span class="kv-val">{{ selectedVehicle.capacity }}명</span>
                    </div>
                  </div>
                </div>

                <div class="card">
                  <h5 class="card-title">운행 지표(더미)</h5>
                  <div class="kv">
                    <div class="kv-row">
                      <span class="kv-key">누적 거리</span>
                      <span class="kv-val">{{ selectedVehicle.km.toLocaleString() }} km</span>
                    </div>
                    <div class="kv-row">
                      <span class="kv-key">평균 가동률</span>
                      <span class="kv-val">{{ selectedVehicle.utilization }}%</span>
                    </div>
                    <div class="kv-row">
                      <span class="kv-key">최근 점검</span>
                      <span class="kv-val">{{ selectedVehicle.lastCheck }}</span>
                    </div>
                    <div class="kv-row">
                      <span class="kv-key">다음 점검</span>
                      <span class="kv-val">{{ selectedVehicle.nextCheck }}</span>
                    </div>
                  </div>
                </div>

                <div class="card card-wide">
                  <h5 class="card-title">메모</h5>
                  <p class="memo">
                    {{ selectedVehicle.note }}
                  </p>
                </div>
              </div>

              <!-- 정비 로그 -->
              <div v-else-if="activeTab === 'maintenance'" class="grid">
                <div class="card card-wide">
                  <h5 class="card-title">정비 이력(더미)</h5>

                  <div class="log">
                    <div v-for="(row, idx) in selectedVehicle.maintenanceLog" :key="idx" class="log-row">
                      <span class="log-date">{{ row.date }}</span>
                      <span class="log-text">{{ row.text }}</span>
                      <span class="log-tag" :class="`tag-${row.level}`">{{ row.level.toUpperCase() }}</span>
                    </div>

                    <div v-if="selectedVehicle.maintenanceLog.length === 0" class="empty slim">
                      <p class="empty-title">정비 로그가 없어</p>
                      <p class="empty-desc">아직 기록된 내역이 없는 상태야.</p>
                    </div>
                  </div>
                </div>

                <div class="card">
                  <h5 class="card-title">정비 상태</h5>
                  <p class="card-text">
                    현재 상태는 <b>{{ statusLabel(selectedVehicle.status) }}</b>로 표시 중이야.
                    (여긴 나중에 실제 정비/정산 로직 연결하면 딱 예쁠 자리!)
                  </p>
                </div>

                <div class="card">
                  <h5 class="card-title">정비 액션(더미)</h5>
                  <div class="btn-col">
                    <button type="button" class="ghost-btn" @click="handleAddLogDummy">
                      + 로그 추가
                    </button>
                    <button type="button" class="ghost-btn" @click="handleCompleteMaintenanceDummy">
                      정비 완료 처리
                    </button>
                  </div>
                </div>
              </div>

              <!-- 부품 -->
              <div v-else class="grid">
                <div class="card card-wide">
                  <h5 class="card-title">부품 상태(더미)</h5>

                  <div class="parts">
                    <div v-for="p in selectedVehicle.parts" :key="p.key" class="part-row">
                      <span class="part-name">{{ p.label }}</span>
                      <span class="part-bar">
                        <span class="part-fill" :style="{ width: `${p.hp}%` }"></span>
                      </span>
                      <span class="part-hp">{{ p.hp }}%</span>
                    </div>
                  </div>

                  <p class="card-hint">
                    * 추후 “부품 내구도/교체” 시스템 연결하면 이 섹션이 핵심이 될 거야.
                  </p>
                </div>

                <div class="card">
                  <h5 class="card-title">부품 액션(더미)</h5>
                  <div class="btn-col">
                    <button type="button" class="ghost-btn" @click="handleRepairDummy">
                      부품 수리
                    </button>
                    <button type="button" class="ghost-btn" @click="handleReplaceDummy">
                      부품 교체
                    </button>
                  </div>
                </div>

                <div class="card">
                  <h5 class="card-title">비용(더미)</h5>
                  <div class="kv">
                    <div class="kv-row">
                      <span class="kv-key">월 유지비</span>
                      <span class="kv-val">{{ selectedVehicle.monthlyCost.toLocaleString() }}</span>
                    </div>
                    <div class="kv-row">
                      <span class="kv-key">최근 정비비</span>
                      <span class="kv-val">{{ selectedVehicle.lastCost.toLocaleString() }}</span>
                    </div>
                    <div class="kv-row">
                      <span class="kv-key">예상 교체비</span>
                      <span class="kv-val">{{ selectedVehicle.replaceCost.toLocaleString() }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div> <!-- detail-body -->
        </div>
      </section>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

type VehicleStatus = 'running' | 'standby' | 'maintenance' | 'inactive'
type LogLevel = 'info' | 'warn' | 'crit'

type Vehicle = {
  id: string
  fleetNo: string
  maker: string
  model: string
  year: number
  capacity: number
  depot: string
  route?: string | null
  status: VehicleStatus

  km: number
  utilization: number
  lastCheck: string
  nextCheck: string
  note: string

  maintenanceLog: { date: string; text: string; level: LogLevel }[]
  parts: { key: string; label: string; hp: number }[]

  monthlyCost: number
  lastCost: number
  replaceCost: number
}

const vehicles = ref<Vehicle[]>([
  {
    id: 'v-1001',
    fleetNo: 'RCTS-1001',
    maker: 'RCTS Works',
    model: 'CityRunner 12',
    year: 2022,
    capacity: 74,
    depot: '운영센터 A',
    route: '12',
    status: 'running',
    km: 128_240,
    utilization: 78,
    lastCheck: '2026-01-03',
    nextCheck: '2026-01-17',
    note: '출근 피크에 자주 투입되는 주력 차량. 타이어 마모 체크 권장.',
    maintenanceLog: [
      { date: '2025-12-22', text: '엔진 오일 교체', level: 'info' },
      { date: '2026-01-03', text: '제동 계통 점검(정상)', level: 'info' },
    ],
    parts: [
      { key: 'engine', label: '엔진', hp: 92 },
      { key: 'brake', label: '브레이크', hp: 84 },
      { key: 'tire', label: '타이어', hp: 66 },
      { key: 'battery', label: '배터리', hp: 73 },
    ],
    monthlyCost: 1_200_000,
    lastCost: 380_000,
    replaceCost: 2_800_000,
  },
  {
    id: 'v-1007',
    fleetNo: 'RCTS-1007',
    maker: 'RCTS Works',
    model: 'MetroLink 10',
    year: 2021,
    capacity: 62,
    depot: '운영센터 A',
    route: '3',
    status: 'standby',
    km: 201_550,
    utilization: 41,
    lastCheck: '2025-12-28',
    nextCheck: '2026-01-25',
    note: '예비 차량. 배차 요청 시 즉시 투입 가능 상태로 유지.',
    maintenanceLog: [],
    parts: [
      { key: 'engine', label: '엔진', hp: 88 },
      { key: 'brake', label: '브레이크', hp: 81 },
      { key: 'tire', label: '타이어', hp: 79 },
      { key: 'battery', label: '배터리', hp: 70 },
    ],
    monthlyCost: 980_000,
    lastCost: 0,
    replaceCost: 2_200_000,
  },
  {
    id: 'v-1012',
    fleetNo: 'RCTS-1012',
    maker: 'RCTS Works',
    model: 'CityRunner 12',
    year: 2020,
    capacity: 74,
    depot: '운영센터 B',
    route: null,
    status: 'maintenance',
    km: 312_880,
    utilization: 54,
    lastCheck: '2026-01-06',
    nextCheck: '2026-01-14',
    note: '진동 이슈로 정비 투입. 브레이크 패드/타이어 우선 확인.',
    maintenanceLog: [
      { date: '2026-01-06', text: '진동 민원 접수 → 점검 착수', level: 'warn' },
      { date: '2026-01-07', text: '타이어 편마모 확인', level: 'warn' },
      { date: '2026-01-08', text: '브레이크 패드 교체 예정', level: 'crit' },
    ],
    parts: [
      { key: 'engine', label: '엔진', hp: 80 },
      { key: 'brake', label: '브레이크', hp: 38 },
      { key: 'tire', label: '타이어', hp: 22 },
      { key: 'battery', label: '배터리', hp: 64 },
    ],
    monthlyCost: 1_050_000,
    lastCost: 920_000,
    replaceCost: 3_400_000,
  },
  {
    id: 'v-1020',
    fleetNo: 'RCTS-1020',
    maker: 'RCTS Works',
    model: 'EcoShuttle 9',
    year: 2019,
    capacity: 48,
    depot: '운영센터 B',
    route: '7',
    status: 'inactive',
    km: 418_010,
    utilization: 12,
    lastCheck: '2025-11-19',
    nextCheck: '2026-02-01',
    note: '장기 비가동. 부품 수급/비용 검토 후 재투입 여부 판단.',
    maintenanceLog: [
      { date: '2025-11-19', text: '장기 비가동 전환(비용 최적화)', level: 'info' },
    ],
    parts: [
      { key: 'engine', label: '엔진', hp: 61 },
      { key: 'brake', label: '브레이크', hp: 57 },
      { key: 'tire', label: '타이어', hp: 52 },
      { key: 'battery', label: '배터리', hp: 44 },
    ],
    monthlyCost: 520_000,
    lastCost: 140_000,
    replaceCost: 1_600_000,
  },
])

const filterOptions = [
  { key: 'all', label: '전체' },
  { key: 'running', label: '가동' },
  { key: 'standby', label: '대기' },
  { key: 'maintenance', label: '정비' },
  { key: 'inactive', label: '비가동' },
] as const

const statusFilter = ref<(typeof filterOptions)[number]['key']>('all')
const query = ref('')

const selectedId = ref<string>('')
const selectedVehicle = computed(() => vehicles.value.find((v) => v.id === selectedId.value) ?? null)

const filteredVehicles = computed(() => {
  const q = query.value.trim().toLowerCase()
  return vehicles.value.filter((v) => {
    const statusOk = statusFilter.value === 'all' ? true : v.status === statusFilter.value
    if (!statusOk) return false
    if (!q) return true

    const hay = [
      v.fleetNo,
      v.maker,
      v.model,
      v.depot,
      v.route ?? '',
      statusLabel(v.status),
    ]
      .join(' ')
      .toLowerCase()

    return hay.includes(q)
  })
})

const stats = computed(() => {
  const total = vehicles.value.length
  const running = vehicles.value.filter((v) => v.status === 'running').length
  const standby = vehicles.value.filter((v) => v.status === 'standby').length
  const maintenance = vehicles.value.filter((v) => v.status === 'maintenance').length
  return { total, running, standby, maintenance }
})

const detailTabs = [
  { key: 'overview', label: '개요' },
  { key: 'maintenance', label: '정비 로그' },
  { key: 'parts', label: '부품' },
] as const

const activeTab = ref<(typeof detailTabs)[number]['key']>('overview')

const statusLabel = (s: VehicleStatus) => {
  if (s === 'running') return '가동'
  if (s === 'standby') return '대기'
  if (s === 'maintenance') return '정비'
  return '비가동'
}

const resetControls = () => {
  statusFilter.value = 'all'
  query.value = ''
}

const handleCreateDummy = () => {
  // 더미: UI 단계에서는 동작만 흉내
  const id = `v-${Math.floor(1000 + Math.random() * 9000)}`
  vehicles.value = [
    {
      id,
      fleetNo: `RCTS-${Math.floor(1000 + Math.random() * 9000)}`,
      maker: 'RCTS Works',
      model: 'NewFleet 11',
      year: 2026,
      capacity: 70,
      depot: '운영센터 A',
      route: null,
      status: 'standby',
      km: 0,
      utilization: 0,
      lastCheck: '2026-01-09',
      nextCheck: '2026-02-09',
      note: '신규 등록(더미). 실제 등록 로직 연결 예정.',
      maintenanceLog: [],
      parts: [
        { key: 'engine', label: '엔진', hp: 100 },
        { key: 'brake', label: '브레이크', hp: 100 },
        { key: 'tire', label: '타이어', hp: 100 },
        { key: 'battery', label: '배터리', hp: 100 },
      ],
      monthlyCost: 1_100_000,
      lastCost: 0,
      replaceCost: 2_600_000,
    },
    ...vehicles.value,
  ]
}

const handleAssignDummy = () => {
  if (!selectedVehicle.value) return
  const v = selectedVehicle.value
  const newRoute = v.route ? null : '12'
  vehicles.value = vehicles.value.map((x) =>
    x.id === v.id ? { ...x, route: newRoute, status: newRoute ? 'running' : 'standby' } : x
  )
}

const handleMaintenanceDummy = () => {
  if (!selectedVehicle.value) return
  const v = selectedVehicle.value
  const to: VehicleStatus = v.status === 'maintenance' ? 'standby' : 'maintenance'
  vehicles.value = vehicles.value.map((x) =>
    x.id === v.id ? { ...x, status: to } : x
  )
}

const handleAddLogDummy = () => {
  if (!selectedVehicle.value) return
  const v = selectedVehicle.value
  const next = {
    date: '2026-01-09',
    text: '점검 기록 추가(더미)',
    level: 'info' as const,
  }
  vehicles.value = vehicles.value.map((x) =>
    x.id === v.id ? { ...x, maintenanceLog: [next, ...x.maintenanceLog] } : x
  )
}

const handleCompleteMaintenanceDummy = () => {
  if (!selectedVehicle.value) return
  const v = selectedVehicle.value
  vehicles.value = vehicles.value.map((x) =>
    x.id === v.id ? { ...x, status: 'standby' } : x
  )
}

const handleRepairDummy = () => {
  if (!selectedVehicle.value) return
  const v = selectedVehicle.value
  vehicles.value = vehicles.value.map((x) => {
    if (x.id !== v.id) return x
    const parts = x.parts.map((p) => ({ ...p, hp: Math.min(100, p.hp + 8) }))
    return { ...x, parts }
  })
}

const handleReplaceDummy = () => {
  if (!selectedVehicle.value) return
  const v = selectedVehicle.value
  vehicles.value = vehicles.value.map((x) => {
    if (x.id !== v.id) return x
    const parts = x.parts.map((p) => ({ ...p, hp: 100 }))
    return { ...x, parts }
  })
}
</script>

<style scoped>
.vehicles-root {
  width: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 헤더 */

.vehicles-header {
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.75);
  background: radial-gradient(
      circle at top left,
      rgba(56, 189, 248, 0.16),
      rgba(15, 23, 42, 0.98)
    );
  padding: 10px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.vehicles-header-left {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.vehicles-badge {
  display: inline-flex;
  width: fit-content;
  align-items: center;
  padding: 2px 10px;
  border-radius: 999px;
  border: 1px solid rgba(129, 140, 248, 0.9);
  background: rgba(15, 23, 42, 0.96);
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(248, 250, 252, 0.96);
}

.vehicles-title {
  font-size: 0.98rem;
  font-weight: 900;
  color: rgba(248, 250, 252, 0.98);
  line-height: 1.1;
}

.vehicles-subtitle {
  font-size: 0.78rem;
  color: rgba(226, 232, 240, 0.88);
  line-height: 1.4;
}

.vehicles-cta {
  border-radius: 999px;
  border: 1px solid rgba(191, 219, 254, 0.9);
  background: linear-gradient(
    135deg,
    rgba(79, 70, 229, 0.98),
    rgba(30, 64, 175, 0.95)
  );
  padding: 8px 12px;
  font-size: 0.8rem;
  font-weight: 900;
  letter-spacing: 0.02em;
  color: rgba(248, 250, 252, 0.98);
  cursor: pointer;
  transition:
    transform 0.08s ease-out,
    box-shadow 0.16s ease-out,
    border-color 0.16s ease-out;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.9);
}

.vehicles-cta:hover {
  transform: translateY(-1px);
  border-color: rgba(129, 140, 248, 1);
  box-shadow: 0 0 18px rgba(96, 165, 250, 0.6);
}

/* 상단 요약 */

.vehicles-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.stat-card {
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.6);
  background: rgba(15, 23, 42, 0.96);
  padding: 10px 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.stat-label {
  font-size: 0.76rem;
  font-weight: 900;
  color: rgba(226, 232, 240, 0.92);
}

.stat-chip {
  font-size: 0.68rem;
  padding: 1px 7px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.7);
  background: rgba(2, 6, 23, 0.6);
  color: rgba(226, 232, 240, 0.9);
  letter-spacing: 0.08em;
}

.chip-running { border-color: rgba(34, 197, 94, 0.75); }
.chip-standby { border-color: rgba(59, 130, 246, 0.75); }
.chip-maint { border-color: rgba(251, 191, 36, 0.8); }

.stat-value {
  font-size: 1.15rem;
  font-weight: 950;
  color: rgba(248, 250, 252, 0.98);
}

.stat-desc {
  font-size: 0.74rem;
  color: rgba(226, 232, 240, 0.82);
  line-height: 1.35;
}

/* 컨트롤 */

.vehicles-controls {
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.6);
  background: rgba(15, 23, 42, 0.9);
  padding: 8px 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}

.control-left,
.control-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.segmented {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.segmented-item {
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.65);
  background: rgba(15, 23, 42, 0.9);
  padding: 7px 10px;
  font-size: 0.78rem;
  color: rgba(226, 232, 240, 0.92);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition:
    border-color 0.16s ease-out,
    box-shadow 0.16s ease-out,
    transform 0.08s ease-out;
}

.segmented-item:hover {
  border-color: rgba(191, 219, 254, 0.95);
  transform: translateY(-1px);
}

.segmented-item.is-active {
  border-color: rgba(129, 140, 248, 1);
  box-shadow: 0 0 14px rgba(96, 165, 250, 0.35);
}

.seg-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.9);
  box-shadow: 0 0 8px rgba(191, 219, 254, 0.5);
}

.dot-all { background: rgba(148, 163, 184, 0.9); }
.dot-running { background: rgba(34, 197, 94, 0.95); box-shadow: 0 0 10px rgba(34, 197, 94, 0.6); }
.dot-standby { background: rgba(59, 130, 246, 0.95); box-shadow: 0 0 10px rgba(59, 130, 246, 0.55); }
.dot-maintenance { background: rgba(251, 191, 36, 0.98); box-shadow: 0 0 10px rgba(251, 191, 36, 0.65); }
.dot-inactive { background: rgba(148, 163, 184, 0.7); box-shadow: 0 0 8px rgba(148, 163, 184, 0.35); }

.seg-label { white-space: nowrap; }

.search-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 10px;
  font-size: 0.85rem;
  opacity: 0.85;
}

.search-input {
  width: min(420px, 64vw);
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.65);
  background: rgba(2, 6, 23, 0.45);
  padding: 7px 10px 7px 28px;
  color: rgba(226, 232, 240, 0.94);
  font-size: 0.78rem;
  outline: none;
}

.search-input:focus {
  border-color: rgba(129, 140, 248, 1);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.22);
}

.ghost-btn {
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.6);
  background: rgba(15, 23, 42, 0.7);
  padding: 7px 10px;
  font-size: 0.78rem;
  color: rgba(226, 232, 240, 0.92);
  cursor: pointer;
  transition:
    border-color 0.16s ease-out,
    box-shadow 0.16s ease-out,
    transform 0.08s ease-out;
}

.ghost-btn:hover {
  border-color: rgba(191, 219, 254, 0.95);
  transform: translateY(-1px);
}

.ghost-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  transform: none;
}

/* 레이아웃 */

.vehicles-layout {
  display: grid;
  grid-template-columns: 380px minmax(0, 1fr);
  gap: 10px;
  min-height: 0;
}

.vehicles-left,
.vehicles-right {
  min-height: 0;
}

.panel {
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.6);
  background: rgba(15, 23, 42, 0.96);
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.panel-head {
  padding: 10px 10px 8px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.35);
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}

.panel-title {
  font-size: 0.9rem;
  font-weight: 950;
  color: rgba(248, 250, 252, 0.98);
}

.panel-meta {
  font-size: 0.75rem;
  color: rgba(226, 232, 240, 0.82);
  white-space: nowrap;
}

/* 리스트 */

.list {
  padding: 8px 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow: auto;
}

.list-item {
  width: 100%;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.45);
  background: rgba(2, 6, 23, 0.35);
  padding: 8px 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  cursor: pointer;
  transition:
    border-color 0.16s ease-out,
    box-shadow 0.16s ease-out,
    transform 0.08s ease-out;
}

.list-item:hover {
  border-color: rgba(191, 219, 254, 0.9);
  transform: translateY(-1px);
}

.list-item.is-active {
  border-color: rgba(129, 140, 248, 1);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.18);
}

.list-main {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.9);
  box-shadow: 0 0 10px rgba(191, 219, 254, 0.4);
  flex: 0 0 auto;
}

.status-running { background: rgba(34, 197, 94, 0.95); box-shadow: 0 0 12px rgba(34, 197, 94, 0.6); }
.status-standby { background: rgba(59, 130, 246, 0.95); box-shadow: 0 0 12px rgba(59, 130, 246, 0.55); }
.status-maintenance { background: rgba(251, 191, 36, 0.98); box-shadow: 0 0 12px rgba(251, 191, 36, 0.65); }
.status-inactive { background: rgba(148, 163, 184, 0.7); box-shadow: 0 0 10px rgba(148, 163, 184, 0.35); }

.list-text {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.list-title {
  font-size: 0.82rem;
  font-weight: 950;
  color: rgba(248, 250, 252, 0.98);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.list-sub {
  font-size: 0.72rem;
  color: rgba(226, 232, 240, 0.84);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.list-right {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  flex: 0 0 auto;
}

.status-pill {
  font-size: 0.68rem;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.6);
  background: rgba(15, 23, 42, 0.85);
  color: rgba(226, 232, 240, 0.92);
}

.status-pill.big {
  font-size: 0.72rem;
  padding: 3px 10px;
}

.pill-running { border-color: rgba(34, 197, 94, 0.75); }
.pill-standby { border-color: rgba(59, 130, 246, 0.75); }
.pill-maintenance { border-color: rgba(251, 191, 36, 0.8); }
.pill-inactive { border-color: rgba(148, 163, 184, 0.55); }

.list-mini {
  font-size: 0.7rem;
  color: rgba(226, 232, 240, 0.78);
  white-space: nowrap;
}

/* 상세 */

.panel-detail {
  overflow: hidden;
}

.detail-head {
  align-items: center;
}

.detail-title {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.detail-actions {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.detail-empty {
  padding: 14px 12px;
}

.detail-body {
  padding: 10px 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow: auto;
  min-height: 0;
}

.detail-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.summary-card {
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.45);
  background: rgba(2, 6, 23, 0.35);
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.summary-label {
  font-size: 0.72rem;
  color: rgba(226, 232, 240, 0.82);
}

.summary-value {
  font-size: 0.86rem;
  font-weight: 950;
  color: rgba(248, 250, 252, 0.98);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 탭 */

.tabs {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.tab {
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.6);
  background: rgba(15, 23, 42, 0.7);
  padding: 7px 10px;
  font-size: 0.78rem;
  color: rgba(226, 232, 240, 0.92);
  cursor: pointer;
  transition:
    border-color 0.16s ease-out,
    transform 0.08s ease-out,
    box-shadow 0.16s ease-out;
}

.tab:hover {
  border-color: rgba(191, 219, 254, 0.95);
  transform: translateY(-1px);
}

.tab.is-active {
  border-color: rgba(129, 140, 248, 1);
  background: linear-gradient(
    135deg,
    rgba(79, 70, 229, 0.98),
    rgba(30, 64, 175, 0.95)
  );
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.18);
}

/* 탭 패널 */

.tab-panel {
  min-height: 0;
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.card {
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.45);
  background: rgba(2, 6, 23, 0.35);
  padding: 10px 10px;
}

.card-wide {
  grid-column: 1 / -1;
}

.card-title {
  font-size: 0.82rem;
  font-weight: 950;
  color: rgba(248, 250, 252, 0.98);
  margin-bottom: 8px;
}

.card-text {
  font-size: 0.78rem;
  color: rgba(226, 232, 240, 0.88);
  line-height: 1.6;
}

.card-hint {
  margin-top: 8px;
  font-size: 0.74rem;
  color: rgba(226, 232, 240, 0.78);
  line-height: 1.5;
}

.kv {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.kv-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.kv-key {
  font-size: 0.74rem;
  color: rgba(226, 232, 240, 0.82);
}

.kv-val {
  font-size: 0.76rem;
  color: rgba(248, 250, 252, 0.95);
  font-weight: 900;
}

.memo {
  font-size: 0.78rem;
  color: rgba(226, 232, 240, 0.88);
  line-height: 1.65;
  white-space: pre-line;
}

/* 로그 */

.log {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.log-row {
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  background: rgba(15, 23, 42, 0.55);
  padding: 8px 10px;
  display: grid;
  grid-template-columns: 110px minmax(0, 1fr) 70px;
  gap: 10px;
  align-items: center;
}

.log-date {
  font-size: 0.72rem;
  color: rgba(226, 232, 240, 0.82);
}

.log-text {
  font-size: 0.78rem;
  color: rgba(248, 250, 252, 0.92);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.log-tag {
  justify-self: end;
  font-size: 0.68rem;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.6);
  background: rgba(2, 6, 23, 0.5);
  color: rgba(226, 232, 240, 0.9);
}

.tag-info { border-color: rgba(59, 130, 246, 0.7); }
.tag-warn { border-color: rgba(251, 191, 36, 0.75); }
.tag-crit { border-color: rgba(244, 63, 94, 0.75); }

/* 부품 */

.parts {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.part-row {
  display: grid;
  grid-template-columns: 110px minmax(0, 1fr) 50px;
  gap: 10px;
  align-items: center;
}

.part-name {
  font-size: 0.76rem;
  color: rgba(226, 232, 240, 0.9);
  font-weight: 900;
}

.part-bar {
  height: 10px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.4);
  background: rgba(15, 23, 42, 0.55);
  overflow: hidden;
}

.part-fill {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    rgba(34, 197, 94, 0.9),
    rgba(59, 130, 246, 0.85),
    rgba(251, 191, 36, 0.9)
  );
}

.part-hp {
  justify-self: end;
  font-size: 0.74rem;
  color: rgba(248, 250, 252, 0.9);
  font-weight: 900;
}

.btn-col {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* 빈 상태 */

.empty {
  border-radius: 14px;
  border: 1px dashed rgba(148, 163, 184, 0.45);
  background: rgba(2, 6, 23, 0.25);
  padding: 12px 10px;
  margin-top: 2px;
  text-align: center;
}

.empty.slim {
  margin-top: 0;
}

.empty-title {
  font-size: 0.82rem;
  font-weight: 950;
  color: rgba(248, 250, 252, 0.96);
  margin-bottom: 4px;
}

.empty-desc {
  font-size: 0.76rem;
  color: rgba(226, 232, 240, 0.84);
  line-height: 1.5;
}

/* 반응형 */

@media (max-width: 1100px) {
  .vehicles-layout {
    grid-template-columns: 340px minmax(0, 1fr);
  }

  .detail-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 859px) {
  .vehicles-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .vehicles-layout {
    grid-template-columns: minmax(0, 1fr);
  }

  .panel-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .detail-actions {
    width: 100%;
  }

  .detail-actions .ghost-btn {
    flex: 1;
  }

  .grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .log-row {
    grid-template-columns: 96px minmax(0, 1fr);
    grid-template-rows: auto auto;
  }

  .log-tag {
    grid-column: 2 / 3;
    justify-self: start;
  }
}
</style>
