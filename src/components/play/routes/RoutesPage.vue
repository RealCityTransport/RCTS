<!-- src/components/play/routes/RoutesPage.vue -->
<template>
  <div class="routes-root">
    <!-- 상단 -->
    <header class="routes-header">
      <div class="routes-header-left">
        <div class="badge">ROUTES · CENTER</div>
        <h3 class="routes-title">노선 센터</h3>
        <p class="routes-sub">
          노선 생성·편집·정류장 구성·운행 정책을 관리하는 화면.
          지금은 UI/레이아웃 고정용 더미 상태야.
        </p>
      </div>

      <nav class="routes-menu" aria-label="노선 센터 메뉴">
        <button
          type="button"
          class="routes-menu-item"
          :class="{ 'is-active': activeSection === 'routes' }"
          @click="activeSection = 'routes'"
        >
          노선
        </button>
        <button
          type="button"
          class="routes-menu-item"
          :class="{ 'is-active': activeSection === 'stops' }"
          @click="activeSection = 'stops'"
        >
          정류장
        </button>
        <button
          type="button"
          class="routes-menu-item"
          :class="{ 'is-active': activeSection === 'policies' }"
          @click="activeSection = 'policies'"
        >
          정책
        </button>
      </nav>
    </header>

    <!-- KPI -->
    <section class="kpi-grid">
      <article class="kpi-card">
        <div class="kpi-label">등록 노선</div>
        <div class="kpi-value">8</div>
        <div class="kpi-sub">도시 전체 (더미)</div>
      </article>

      <article class="kpi-card">
        <div class="kpi-label">활성 운행</div>
        <div class="kpi-value">5</div>
        <div class="kpi-sub">운영중 노선 (더미)</div>
      </article>

      <article class="kpi-card">
        <div class="kpi-label">정류장</div>
        <div class="kpi-value">42</div>
        <div class="kpi-sub">전체 등록 (더미)</div>
      </article>

      <article class="kpi-card">
        <div class="kpi-label">경고</div>
        <div class="kpi-value">3</div>
        <div class="kpi-sub">충돌/중복 (더미)</div>
      </article>
    </section>

    <!-- 본문: 2열 레이아웃 (운영처럼 “실제 화면” 느낌) -->
    <main class="routes-body">
      <section class="routes-columns">
        <!-- LEFT: 노선 목록/필터 -->
        <aside class="panel panel-left">
          <div class="panel-head">
            <div class="panel-head-left">
              <div class="panel-title">노선 목록</div>
              <div class="panel-sub">선택한 노선의 상태·기본 정보를 확인</div>
            </div>

            <div class="panel-actions">
              <button type="button" class="chip chip-primary">+ 신규</button>
              <button type="button" class="chip">가져오기</button>
            </div>
          </div>

          <div class="panel-tools">
            <div class="tool-row">
              <span class="tool-label">필터</span>
              <div class="seg">
                <button
                  type="button"
                  class="seg-item"
                  :class="{ 'is-active': listFilter === 'all' }"
                  @click="listFilter = 'all'"
                >
                  전체
                </button>
                <button
                  type="button"
                  class="seg-item"
                  :class="{ 'is-active': listFilter === 'active' }"
                  @click="listFilter = 'active'"
                >
                  운영중
                </button>
                <button
                  type="button"
                  class="seg-item"
                  :class="{ 'is-active': listFilter === 'paused' }"
                  @click="listFilter = 'paused'"
                >
                  대기
                </button>
              </div>
            </div>

            <div class="tool-row">
              <span class="tool-label">검색</span>
              <input
                class="search"
                type="text"
                placeholder="노선명 / 코드 검색 (더미)"
                v-model="searchText"
              />
            </div>
          </div>

          <div class="route-list">
            <button
              v-for="r in filteredRoutes"
              :key="r.code"
              type="button"
              class="route-item"
              :class="{ 'is-active': selectedRouteCode === r.code }"
              @click="selectedRouteCode = r.code"
            >
              <div class="route-item-top">
                <div class="route-code">{{ r.code }}</div>
                <div class="route-badges">
                  <span class="pill" :class="r.status === 'active' ? 'pill-green' : 'pill-gray'">
                    {{ r.status === 'active' ? '운영중' : '대기' }}
                  </span>
                  <span v-if="r.alert" class="pill pill-amber">경고</span>
                </div>
              </div>

              <div class="route-name">{{ r.name }}</div>

              <div class="route-meta">
                <span class="meta-item">정류장 {{ r.stops }}개</span>
                <span class="meta-dot"></span>
                <span class="meta-item">배차 {{ r.headway }}분</span>
              </div>

              <div class="route-foot">
                <span class="mini-label">수익</span>
                <span class="mini-value">{{ r.revenue }}</span>
                <span class="mini-split"></span>
                <span class="mini-label">혼잡</span>
                <span class="mini-value">{{ r.load }}</span>
              </div>
            </button>
          </div>

          <div class="panel-foot">
            <span class="dot"></span>
            <span class="foot-text">목록/선택/검색은 UI만 동작하는 더미야.</span>
          </div>
        </aside>

        <!-- RIGHT: 선택 노선 상세 + 섹션(노선/정류장/정책) -->
        <section class="panel panel-right">
          <div class="panel-head">
            <div class="panel-head-left">
              <div class="panel-title">
                {{ selectedRoute.code }} · {{ selectedRoute.name }}
              </div>
              <div class="panel-sub">
                상태: {{ selectedRoute.status === 'active' ? '운영중' : '대기' }} ·
                마지막 점검: 2분 전 (더미)
              </div>
            </div>

            <div class="panel-actions">
              <button type="button" class="chip">편집</button>
              <button type="button" class="chip">복제</button>
              <button type="button" class="chip chip-danger">중지</button>
            </div>
          </div>

          <!-- 섹션별 내용 -->
          <div class="panel-content">
            <!-- 섹션 탭 -->
            <div class="inner-tabs">
              <button
                type="button"
                class="inner-tab"
                :class="{ 'is-active': activeSection === 'routes' }"
                @click="activeSection = 'routes'"
              >
                노선 요약
              </button>
              <button
                type="button"
                class="inner-tab"
                :class="{ 'is-active': activeSection === 'stops' }"
                @click="activeSection = 'stops'"
              >
                정류장 구성
              </button>
              <button
                type="button"
                class="inner-tab"
                :class="{ 'is-active': activeSection === 'policies' }"
                @click="activeSection = 'policies'"
              >
                운행 정책
              </button>
            </div>

            <!-- 노선 요약 -->
            <div v-if="activeSection === 'routes'" class="content-stack">
              <div class="cards-grid">
                <div class="info-card">
                  <div class="info-label">현재 운행 차량</div>
                  <div class="info-value">{{ selectedRoute.vehicles }}</div>
                  <div class="info-sub">배차 기준 (더미)</div>
                </div>
                <div class="info-card">
                  <div class="info-label">평균 지연</div>
                  <div class="info-value">{{ selectedRoute.delay }}</div>
                  <div class="info-sub">최근 1시간 (더미)</div>
                </div>
                <div class="info-card">
                  <div class="info-label">혼잡도</div>
                  <div class="info-value">{{ selectedRoute.load }}</div>
                  <div class="info-sub">피크 타임 (더미)</div>
                </div>
              </div>

              <div class="big-card">
                <div class="big-head">
                  <div class="big-title">운행 타임라인</div>
                  <div class="big-sub">현재는 시각화 자리만 고정</div>
                </div>
                <div class="timeline">
                  <div class="timeline-bar"></div>
                  <div class="timeline-legend">
                    <span class="lg-item"><span class="lg-dot lg-blue"></span> 정상</span>
                    <span class="lg-item"><span class="lg-dot lg-amber"></span> 지연</span>
                    <span class="lg-item"><span class="lg-dot lg-gray"></span> 대기</span>
                  </div>
                </div>
              </div>

              <div class="big-card">
                <div class="big-head">
                  <div class="big-title">이벤트</div>
                  <div class="big-sub">운영 알림/경고 스트림 (더미)</div>
                </div>
                <div class="log-list">
                  <div class="log-item">
                    <span class="log-pill log-pill-amber">경고</span>
                    <span class="log-text">정류장 ID 중복 감지 (더미)</span>
                    <span class="log-time">방금</span>
                  </div>
                  <div class="log-item">
                    <span class="log-pill log-pill-blue">정보</span>
                    <span class="log-text">배차 간격 자동 조정 제안 (더미)</span>
                    <span class="log-time">5분 전</span>
                  </div>
                  <div class="log-item">
                    <span class="log-pill log-pill-gray">기록</span>
                    <span class="log-text">노선 점검 완료 (더미)</span>
                    <span class="log-time">18분 전</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 정류장 구성 -->
            <div v-else-if="activeSection === 'stops'" class="content-stack">
              <div class="big-card">
                <div class="big-head">
                  <div class="big-title">정류장 시퀀스</div>
                  <div class="big-sub">드래그/편집 UX 자리만 먼저 고정</div>
                </div>

                <div class="stops-grid">
                  <div v-for="(s, idx) in stopsDummy" :key="s.id" class="stop-card">
                    <div class="stop-top">
                      <span class="stop-index">{{ String(idx + 1).padStart(2, '0') }}</span>
                      <span class="stop-name">{{ s.name }}</span>
                      <span class="stop-tag">{{ s.zone }}</span>
                    </div>
                    <div class="stop-meta">
                      <span class="stop-mini">승하차 {{ s.flow }}</span>
                      <span class="meta-dot"></span>
                      <span class="stop-mini">대기 {{ s.wait }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="big-card">
                <div class="big-head">
                  <div class="big-title">정류장 상세</div>
                  <div class="big-sub">선택/편집은 더미</div>
                </div>

                <div class="form-grid">
                  <div class="form-field">
                    <label class="form-label">정류장명</label>
                    <input class="form-input" type="text" value="Central Station" disabled />
                  </div>
                  <div class="form-field">
                    <label class="form-label">구역</label>
                    <input class="form-input" type="text" value="CBD" disabled />
                  </div>
                  <div class="form-field">
                    <label class="form-label">환승</label>
                    <input class="form-input" type="text" value="Bus / Metro" disabled />
                  </div>
                  <div class="form-field">
                    <label class="form-label">설명</label>
                    <input class="form-input" type="text" value="핵심 환승 거점 (더미)" disabled />
                  </div>
                </div>

                <div class="panel-foot" style="margin-top:10px;">
                  <span class="dot"></span>
                  <span class="foot-text">정류장 편집은 이후 실제 데이터 연결 예정.</span>
                </div>
              </div>
            </div>

            <!-- 운행 정책 -->
            <div v-else class="content-stack">
              <div class="big-card">
                <div class="big-head">
                  <div class="big-title">배차 정책</div>
                  <div class="big-sub">정책 값은 더미 상태</div>
                </div>

                <div class="policy-grid">
                  <div class="policy-item">
                    <div class="policy-label">기본 배차</div>
                    <div class="policy-value">{{ selectedRoute.headway }}분</div>
                    <div class="policy-sub">출근/퇴근 시간 자동 조정 (더미)</div>
                  </div>
                  <div class="policy-item">
                    <div class="policy-label">운행 시간</div>
                    <div class="policy-value">05:30 ~ 23:40</div>
                    <div class="policy-sub">막차/첫차 룰 (더미)</div>
                  </div>
                  <div class="policy-item">
                    <div class="policy-label">차량 제한</div>
                    <div class="policy-value">최대 12</div>
                    <div class="policy-sub">노선 규모에 따른 상한 (더미)</div>
                  </div>
                </div>
              </div>

              <div class="big-card">
                <div class="big-head">
                  <div class="big-title">적용 조건</div>
                  <div class="big-sub">규칙 기반 자동화 자리</div>
                </div>

                <div class="rules">
                  <div class="rule">
                    <span class="rule-pill">IF</span>
                    <span class="rule-text">혼잡도 High</span>
                    <span class="rule-pill">THEN</span>
                    <span class="rule-text">배차 -2분</span>
                  </div>
                  <div class="rule">
                    <span class="rule-pill">IF</span>
                    <span class="rule-text">지연 10분+</span>
                    <span class="rule-pill">THEN</span>
                    <span class="rule-text">차량 +1</span>
                  </div>
                  <div class="rule">
                    <span class="rule-pill">IF</span>
                    <span class="rule-text">야간 시간대</span>
                    <span class="rule-pill">THEN</span>
                    <span class="rule-text">배차 +4분</span>
                  </div>
                </div>

                <div class="panel-foot" style="margin-top:10px;">
                  <span class="dot"></span>
                  <span class="foot-text">정책/규칙 엔진은 운영 로직 붙을 때 연결.</span>
                </div>
              </div>
            </div>
          </div>

          <div class="footer">
            <span class="dot"></span>
            <span class="footer-text">
              이 노선 센터는 이후 “노선 저장/정류장 편집/운행 스케줄”이 붙는 핵심 관리 화면이 될 거야.
            </span>
          </div>
        </section>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const activeSection = ref('routes') // routes | stops | policies
const listFilter = ref('all') // all | active | paused
const searchText = ref('')
const selectedRouteCode = ref('R-01')

const routesDummy = [
  {
    code: 'R-01',
    name: 'CBD 순환선',
    status: 'active',
    alert: true,
    stops: 14,
    headway: 6,
    vehicles: 8,
    delay: '2m',
    load: 'High',
    revenue: '₩ 1.2M/day',
  },
  {
    code: 'R-02',
    name: '서부 산업단지 직통',
    status: 'active',
    alert: false,
    stops: 9,
    headway: 10,
    vehicles: 6,
    delay: '0m',
    load: 'Mid',
    revenue: '₩ 860K/day',
  },
  {
    code: 'R-07',
    name: '공항 익스프레스',
    status: 'active',
    alert: false,
    stops: 6,
    headway: 12,
    vehicles: 5,
    delay: '3m',
    load: 'Mid',
    revenue: '₩ 1.8M/day',
  },
  {
    code: 'R-11',
    name: '강변 주거 라인',
    status: 'paused',
    alert: false,
    stops: 11,
    headway: 14,
    vehicles: 0,
    delay: '-',
    load: 'Low',
    revenue: '₩ 320K/day',
  },
  {
    code: 'R-12',
    name: '대학교 셔틀',
    status: 'paused',
    alert: false,
    stops: 7,
    headway: 8,
    vehicles: 0,
    delay: '-',
    load: 'Low',
    revenue: '₩ 210K/day',
  },
]

const stopsDummy = [
  { id: 'S-001', name: 'Central Station', zone: 'CBD', flow: 'High', wait: '3m' },
  { id: 'S-014', name: 'Museum Gate', zone: 'CBD', flow: 'Mid', wait: '2m' },
  { id: 'S-021', name: 'Riverside Park', zone: 'River', flow: 'Mid', wait: '4m' },
  { id: 'S-033', name: 'West Depot', zone: 'Industrial', flow: 'Low', wait: '1m' },
  { id: 'S-040', name: 'Airport T1', zone: 'Airport', flow: 'High', wait: '5m' },
]

const filteredRoutes = computed(() => {
  const q = searchText.value.trim().toLowerCase()

  return routesDummy
    .filter((r) => {
      if (listFilter.value === 'active') return r.status === 'active'
      if (listFilter.value === 'paused') return r.status === 'paused'
      return true
    })
    .filter((r) => {
      if (!q) return true
      return (r.code + ' ' + r.name).toLowerCase().includes(q)
    })
})

const selectedRoute = computed(() => {
  return routesDummy.find((r) => r.code === selectedRouteCode.value) || routesDummy[0]
})
</script>

<style scoped>
.routes-root {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 헤더 */

.routes-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;

  padding-bottom: 10px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.35);
}

.routes-header-left {
  flex: 1 1 auto;
  min-width: 260px;
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 999px;
  border: 1px solid rgba(129, 140, 248, 0.75);
  background: rgba(2, 6, 23, 0.35);
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.1em;
  color: rgba(248, 250, 252, 0.92);
}

.routes-title {
  margin: 8px 0 4px;
  font-size: 0.95rem;
  font-weight: 900;
  color: rgba(248, 250, 252, 0.96);
}

.routes-sub {
  margin: 0;
  font-size: 0.78rem;
  line-height: 1.55;
  color: rgba(226, 232, 240, 0.86);
}

/* 상단 메뉴 */

.routes-menu {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  padding: 4px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.45);
  background: rgba(15, 23, 42, 0.35);
}

.routes-menu-item {
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  background: rgba(2, 6, 23, 0.25);

  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  color: rgba(226, 232, 240, 0.86);

  cursor: pointer;
  transition:
    border-color 0.12s ease-out,
    background 0.12s ease-out,
    transform 0.08s ease-out;
}

.routes-menu-item:hover {
  border-color: rgba(191, 219, 254, 0.8);
  background: rgba(15, 23, 42, 0.55);
}

.routes-menu-item.is-active {
  border-color: rgba(129, 140, 248, 0.85);
  background: rgba(129, 140, 248, 0.14);
  color: rgba(248, 250, 252, 0.96);
  transform: translateY(-1px);
}

/* KPI */

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.kpi-card {
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.4);
  background: rgba(2, 6, 23, 0.35);
  padding: 10px 12px;
}

.kpi-label {
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  color: rgba(148, 163, 184, 0.9);
  font-weight: 900;
  text-transform: uppercase;
}

.kpi-value {
  margin-top: 6px;
  font-size: 1.05rem;
  font-weight: 900;
  color: rgba(248, 250, 252, 0.96);
}

.kpi-sub {
  margin-top: 2px;
  font-size: 0.74rem;
  color: rgba(226, 232, 240, 0.76);
}

/* 본문 */

.routes-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
}

.routes-columns {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 10px;
  min-height: 0;
}

/* 패널 공통 */

.panel {
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.7);
  background: rgba(2, 6, 23, 0.22);
  padding: 10px 12px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.panel-left {
  background: radial-gradient(
      circle at top left,
      rgba(56, 189, 248, 0.12),
      rgba(15, 23, 42, 0.92)
    );
}

.panel-right {
  background: rgba(15, 23, 42, 0.82);
}

.panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.35);
}

.panel-head-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.panel-title {
  font-size: 0.92rem;
  font-weight: 900;
  color: rgba(248, 250, 252, 0.96);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.panel-sub {
  font-size: 0.74rem;
  color: rgba(226, 232, 240, 0.78);
  line-height: 1.4;
}

.panel-actions {
  display: inline-flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

/* 작은 버튼 */

.chip {
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.5);
  background: rgba(2, 6, 23, 0.25);
  color: rgba(226, 232, 240, 0.92);
  font-size: 0.75rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition:
    border-color 0.12s ease-out,
    background 0.12s ease-out,
    transform 0.08s ease-out;
}

.chip:hover {
  border-color: rgba(191, 219, 254, 0.95);
  background: rgba(15, 23, 42, 0.55);
}

.chip:active {
  transform: scale(0.98);
}

.chip-primary {
  border-color: rgba(96, 165, 250, 0.8);
  background: rgba(37, 99, 235, 0.22);
}

.chip-danger {
  border-color: rgba(251, 113, 133, 0.75);
  background: rgba(244, 63, 94, 0.12);
}

/* 왼쪽 도구 */

.panel-tools {
  padding: 10px 0 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tool-row {
  display: grid;
  grid-template-columns: 54px 1fr;
  align-items: center;
  gap: 8px;
}

.tool-label {
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(148, 163, 184, 0.92);
}

.search {
  width: 100%;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.55);
  background: rgba(2, 6, 23, 0.25);
  color: rgba(226, 232, 240, 0.92);
  padding: 8px 10px;
  font-size: 0.78rem;
  outline: none;
}

.search::placeholder {
  color: rgba(148, 163, 184, 0.75);
}

/* 세그 버튼 */

.seg {
  display: inline-flex;
  gap: 6px;
  padding: 4px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.45);
  background: rgba(2, 6, 23, 0.16);
}

.seg-item {
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  background: rgba(2, 6, 23, 0.12);
  color: rgba(226, 232, 240, 0.86);
  font-size: 0.74rem;
  font-weight: 900;
  cursor: pointer;
  transition:
    border-color 0.12s ease-out,
    background 0.12s ease-out,
    transform 0.08s ease-out;
}

.seg-item:hover {
  border-color: rgba(191, 219, 254, 0.9);
  background: rgba(15, 23, 42, 0.45);
}

.seg-item.is-active {
  border-color: rgba(129, 140, 248, 0.9);
  background: rgba(129, 140, 248, 0.14);
  color: rgba(248, 250, 252, 0.96);
  transform: translateY(-1px);
}

/* 노선 목록 */

.route-list {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding-right: 2px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.route-item {
  width: 100%;
  text-align: left;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.5);
  background: rgba(2, 6, 23, 0.18);
  padding: 10px 10px;
  cursor: pointer;

  transition:
    border-color 0.12s ease-out,
    background 0.12s ease-out,
    transform 0.08s ease-out,
    box-shadow 0.12s ease-out;
}

.route-item:hover {
  border-color: rgba(191, 219, 254, 0.95);
  background: rgba(15, 23, 42, 0.38);
  box-shadow: 0 10px 18px rgba(15, 23, 42, 0.65);
  transform: translateY(-1px);
}

.route-item.is-active {
  border-color: rgba(129, 140, 248, 1);
  background: linear-gradient(
    135deg,
    rgba(79, 70, 229, 0.35),
    rgba(30, 64, 175, 0.28)
  );
  box-shadow: 0 14px 26px rgba(15, 23, 42, 0.75);
}

.route-item-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.route-code {
  font-size: 0.76rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  color: rgba(191, 219, 254, 0.95);
  text-transform: uppercase;
}

.route-badges {
  display: inline-flex;
  gap: 6px;
  align-items: center;
}

.pill {
  font-size: 0.7rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.55);
  background: rgba(2, 6, 23, 0.25);
  color: rgba(226, 232, 240, 0.92);
}

.pill-green {
  border-color: rgba(52, 211, 153, 0.6);
  background: rgba(16, 185, 129, 0.12);
  color: rgba(167, 243, 208, 0.95);
}

.pill-gray {
  border-color: rgba(148, 163, 184, 0.5);
  background: rgba(148, 163, 184, 0.1);
  color: rgba(226, 232, 240, 0.86);
}

.pill-amber {
  border-color: rgba(251, 191, 36, 0.65);
  background: rgba(245, 158, 11, 0.14);
  color: rgba(253, 230, 138, 0.96);
}

.route-name {
  margin-top: 6px;
  font-size: 0.9rem;
  font-weight: 900;
  color: rgba(248, 250, 252, 0.96);
}

.route-meta {
  margin-top: 6px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: rgba(226, 232, 240, 0.78);
  font-size: 0.74rem;
  font-weight: 700;
}

.meta-dot {
  width: 4px;
  height: 4px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.85);
  flex: 0 0 auto;
}

.route-foot {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  color: rgba(226, 232, 240, 0.8);
}

.mini-label {
  font-weight: 900;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(148, 163, 184, 0.95);
}

.mini-value {
  font-weight: 900;
  color: rgba(248, 250, 252, 0.94);
}

.mini-split {
  width: 1px;
  height: 10px;
  background: rgba(148, 163, 184, 0.35);
  margin: 0 6px;
}

/* 오른쪽 내부 탭 */

.panel-content {
  flex: 1;
  min-height: 0;
  padding-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.inner-tabs {
  display: inline-flex;
  gap: 6px;
  padding: 4px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.45);
  background: rgba(2, 6, 23, 0.16);
  width: fit-content;
}

.inner-tab {
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  background: rgba(2, 6, 23, 0.12);
  color: rgba(226, 232, 240, 0.86);
  font-size: 0.74rem;
  font-weight: 900;
  cursor: pointer;
  transition:
    border-color 0.12s ease-out,
    background 0.12s ease-out,
    transform 0.08s ease-out;
}

.inner-tab:hover {
  border-color: rgba(191, 219, 254, 0.9);
  background: rgba(15, 23, 42, 0.45);
}

.inner-tab.is-active {
  border-color: rgba(129, 140, 248, 0.9);
  background: rgba(129, 140, 248, 0.14);
  color: rgba(248, 250, 252, 0.96);
  transform: translateY(-1px);
}

/* 컨텐츠 스택 */

.content-stack {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding-right: 2px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 카드 */

.cards-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.info-card {
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.4);
  background: rgba(2, 6, 23, 0.32);
  padding: 10px 12px;
}

.info-label {
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  color: rgba(148, 163, 184, 0.9);
  font-weight: 900;
  text-transform: uppercase;
}

.info-value {
  margin-top: 6px;
  font-size: 1.02rem;
  font-weight: 900;
  color: rgba(248, 250, 252, 0.96);
}

.info-sub {
  margin-top: 2px;
  font-size: 0.74rem;
  color: rgba(226, 232, 240, 0.76);
}

/* 큰 카드 */

.big-card {
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.45);
  background: rgba(2, 6, 23, 0.22);
  padding: 10px 12px;
}

.big-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.3);
}

.big-title {
  font-size: 0.84rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(248, 250, 252, 0.96);
}

.big-sub {
  font-size: 0.74rem;
  color: rgba(226, 232, 240, 0.74);
}

/* 타임라인 자리 */

.timeline {
  padding-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.timeline-bar {
  height: 120px;
  border-radius: 14px;
  border: 1px dashed rgba(148, 163, 184, 0.5);
  background: linear-gradient(
    135deg,
    rgba(37, 99, 235, 0.18),
    rgba(2, 6, 23, 0.16)
  );
}

.timeline-legend {
  display: inline-flex;
  gap: 10px;
  flex-wrap: wrap;
  color: rgba(226, 232, 240, 0.82);
  font-size: 0.74rem;
  font-weight: 800;
}

.lg-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.lg-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.5);
}

.lg-blue { background: rgba(59, 130, 246, 0.75); }
.lg-amber { background: rgba(245, 158, 11, 0.8); }
.lg-gray { background: rgba(148, 163, 184, 0.65); }

/* 로그 */

.log-list {
  padding-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.log-item {
  display: grid;
  grid-template-columns: 54px 1fr 60px;
  gap: 10px;
  align-items: center;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  background: rgba(15, 23, 42, 0.35);
  padding: 8px 10px;
}

.log-pill {
  font-size: 0.7rem;
  font-weight: 900;
  text-align: center;
  padding: 2px 6px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.5);
}

.log-pill-amber {
  border-color: rgba(251, 191, 36, 0.65);
  background: rgba(245, 158, 11, 0.14);
  color: rgba(253, 230, 138, 0.96);
}

.log-pill-blue {
  border-color: rgba(96, 165, 250, 0.7);
  background: rgba(37, 99, 235, 0.18);
  color: rgba(191, 219, 254, 0.96);
}

.log-pill-gray {
  border-color: rgba(148, 163, 184, 0.55);
  background: rgba(148, 163, 184, 0.12);
  color: rgba(226, 232, 240, 0.9);
}

.log-text {
  font-size: 0.78rem;
  color: rgba(226, 232, 240, 0.92);
  line-height: 1.4;
}

.log-time {
  font-size: 0.72rem;
  color: rgba(148, 163, 184, 0.9);
  text-align: right;
  white-space: nowrap;
}

/* 정류장 카드 */

.stops-grid {
  padding-top: 10px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.stop-card {
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  background: rgba(15, 23, 42, 0.35);
  padding: 10px 10px;
}

.stop-top {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stop-index {
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  color: rgba(191, 219, 254, 0.92);
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.45);
  background: rgba(2, 6, 23, 0.25);
}

.stop-name {
  flex: 1;
  min-width: 0;
  font-size: 0.82rem;
  font-weight: 900;
  color: rgba(248, 250, 252, 0.96);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stop-tag {
  font-size: 0.72rem;
  font-weight: 900;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid rgba(129, 140, 248, 0.6);
  background: rgba(129, 140, 248, 0.14);
  color: rgba(226, 232, 240, 0.96);
}

.stop-meta {
  margin-top: 8px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.74rem;
  color: rgba(226, 232, 240, 0.8);
  font-weight: 800;
}

.stop-mini {
  white-space: nowrap;
}

/* 폼 */

.form-grid {
  padding-top: 10px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(148, 163, 184, 0.92);
}

.form-input {
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.55);
  background: rgba(2, 6, 23, 0.25);
  color: rgba(226, 232, 240, 0.92);
  padding: 8px 10px;
  font-size: 0.78rem;
  outline: none;
}

/* 정책 */

.policy-grid {
  padding-top: 10px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.policy-item {
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.4);
  background: rgba(2, 6, 23, 0.32);
  padding: 10px 12px;
}

.policy-label {
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  color: rgba(148, 163, 184, 0.9);
  font-weight: 900;
  text-transform: uppercase;
}

.policy-value {
  margin-top: 6px;
  font-size: 1.02rem;
  font-weight: 900;
  color: rgba(248, 250, 252, 0.96);
}

.policy-sub {
  margin-top: 2px;
  font-size: 0.74rem;
  color: rgba(226, 232, 240, 0.76);
}

/* 규칙 */

.rules {
  padding-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rule {
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  background: rgba(15, 23, 42, 0.35);
  padding: 10px 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.rule-pill {
  font-size: 0.7rem;
  font-weight: 900;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.55);
  background: rgba(2, 6, 23, 0.25);
  color: rgba(226, 232, 240, 0.9);
}

.rule-text {
  font-size: 0.78rem;
  font-weight: 900;
  color: rgba(248, 250, 252, 0.94);
}

/* 하단 */

.footer {
  margin-top: 10px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(15, 23, 42, 0.22);
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: rgba(129, 140, 248, 0.9);
  box-shadow: 0 0 10px rgba(129, 140, 248, 0.35);
}

.footer-text {
  font-size: 0.74rem;
  color: rgba(226, 232, 240, 0.84);
}

.panel-foot {
  margin-top: 10px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(15, 23, 42, 0.22);
}

.foot-text {
  font-size: 0.74rem;
  color: rgba(226, 232, 240, 0.84);
}

/* 반응형 */

@media (max-width: 1100px) {
  .routes-columns {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 980px) {
  .kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .cards-grid {
    grid-template-columns: 1fr;
  }

  .policy-grid {
    grid-template-columns: 1fr;
  }

  .stops-grid {
    grid-template-columns: 1fr;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .log-item {
    grid-template-columns: 54px 1fr;
  }

  .log-time {
    display: none;
  }
}

@media (max-width: 520px) {
  .kpi-grid {
    grid-template-columns: 1fr;
  }
}
</style>
