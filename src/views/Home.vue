<!--
  파일 주소:
  src/views/Home.vue

  적용 내용:
  - RCTS 메인 대시보드 본문 화면
  - 상단 헤더는 App.vue의 RctsHeader 컴포넌트가 담당
  - 차량 중심 운행 관제 레이아웃 담당
  - 슬롯 1개 = 차량 1대 구조를 화면에 표시
  - 현재는 실제 데이터 연동 없이 하드코딩된 임시 데이터 사용
  - 중앙 슬롯 리스트는 100% 가로 행 구조로 표시

  연결된 파일:
  - src/router/index.js
  - src/App.vue
  - src/components/layout/RctsHeader.vue

  향후 연결 예정:
  - src/components/dashboard/ModeSummaryPanel.vue
  - src/components/dashboard/OperationSlotList.vue
  - src/components/dashboard/FinanceSummaryPanel.vue
  - src/modules/time.js
  - src/modules/finance.js
  - src/modules/settlement.js
  - src/modules/operations.js

  수정 시 주의:
  - 헤더 코드는 이 파일에 넣지 않음
  - 현재는 레이아웃 확인용 하드코딩 페이지
  - 나중에 컴포넌트 단위로 추가 분리 예정
-->

<template>
  <main class="home-layout">
    <aside class="left-panel panel">
      <h2>운송수단 현황</h2>

      <div class="mode-card">
        <strong>버스</strong>
        <span>운영중 42 / 총 50</span>
      </div>

      <div class="mode-card">
        <strong>철도</strong>
        <span>운영중 3 / 총 3</span>
      </div>

      <div class="mode-card">
        <strong>항공</strong>
        <span>운영중 8 / 총 10</span>
      </div>

      <div class="mode-card">
        <strong>선박</strong>
        <span>운영중 5 / 총 6</span>
      </div>
    </aside>

    <section class="center-panel">
      <section class="summary panel">
        <p>DASHBOARD</p>
        <h1>차량 중심 운행 관제</h1>
        <span>
          App.vue는 공통 껍데기, RctsHeader는 공통 헤더, Home.vue는 대시보드 본문을 담당합니다.
        </span>
      </section>

      <section class="panel">
        <div class="section-header">
          <h2>대표 운행 슬롯</h2>
          <button type="button">전체 슬롯 관리 →</button>
        </div>

        <div class="slot-list">
          <article
            v-for="slot in slots"
            :key="slot.id"
            class="slot-row"
          >
            <div>
              <small>{{ slot.id }}</small>
              <strong>{{ slot.vehicle }}</strong>
            </div>

            <div>
              <small>배정 운행</small>
              <strong>{{ slot.route }}</strong>
            </div>

            <div>
              <small>상태</small>
              <strong>{{ slot.status }}</strong>
            </div>

            <div>
              <small>진행률</small>
              <div class="progress">
                <div :style="{ width: slot.progress + '%' }"></div>
              </div>
            </div>

            <div>
              <small>남은 시간</small>
              <strong>{{ slot.remaining }}</strong>
            </div>

            <div>
              <small>예상 정산</small>
              <strong>{{ slot.revenue }}</strong>
            </div>
          </article>
        </div>
      </section>
    </section>

    <aside class="right-panel panel">
      <h2>정산 / 재정 요약</h2>

      <div class="finance-card">
        <span>시간당 예상 수익</span>
        <strong>260,250,000R</strong>
      </div>

      <div class="finance-card">
        <span>일일 순수익</span>
        <strong>6,245,000,000R</strong>
      </div>

      <h3>최근 정산</h3>

      <ul class="settlement-list">
        <li>마을버스 1호 +12,450R</li>
        <li>KE201 +75,000,000R</li>
        <li>KTX 011 +42,300R</li>
      </ul>
    </aside>
  </main>
</template>

<script setup>
const slots = [
  {
    id: 'BUS-001',
    vehicle: '마을버스 1호',
    route: '마을 순환 1번',
    status: '운행중',
    progress: 78,
    remaining: '00:01:12',
    revenue: '12,450R'
  },
  {
    id: 'BUS-014',
    vehicle: '마을버스 14호',
    route: '마을 순환 1번',
    status: '정차중',
    progress: 44,
    remaining: '00:00:38',
    revenue: '11,800R'
  },
  {
    id: 'AIR-002',
    vehicle: 'KE201',
    route: '인천 → 도쿄',
    status: 'CRUISE',
    progress: 72,
    remaining: '01:15:00',
    revenue: '75,000,000R'
  },
  {
    id: 'SHIP-001',
    vehicle: 'ULTRA CONTAINER 1호',
    route: 'Busan → Rotterdam',
    status: '항해중',
    progress: 55,
    remaining: '14일 06:12',
    revenue: '48,000,000,000R'
  }
]
</script>

<style scoped>
.home-layout {
  display: grid;
  grid-template-columns: 280px minmax(720px, 1fr) 340px;
  gap: 16px;
  padding: 16px;
}

.panel {
  border: 1px solid rgba(120, 190, 255, 0.16);
  border-radius: 18px;
  background: rgba(8, 20, 34, 0.78);
  box-shadow: 0 14px 40px rgba(0, 0, 0, 0.28);
}

.left-panel,
.right-panel {
  padding: 16px;
}

.panel h2 {
  margin: 0 0 14px;
  font-size: 18px;
}

.mode-card {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 14px;
  margin-bottom: 10px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.035);
}

.mode-card span {
  color: #93a6b9;
  font-size: 13px;
}

.center-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.summary {
  padding: 24px;
}

.summary p {
  margin: 0 0 8px;
  color: #4bcaff;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.15em;
}

.summary h1 {
  margin: 0 0 10px;
  font-size: 30px;
}

.summary span {
  color: #a8bacb;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
}

.section-header h2 {
  margin: 0;
}

.section-header button {
  color: #9fdcff;
  border: 0;
  background: transparent;
}

.slot-list {
  display: flex;
  flex-direction: column;
  gap: 9px;
  padding: 0 16px 16px;
}

.slot-row {
  display: grid;
  grid-template-columns: 1fr 1.3fr 0.8fr 1.2fr 0.8fr 1fr;
  gap: 12px;
  align-items: center;
  min-height: 78px;
  padding: 13px 14px;
  border: 1px solid rgba(120, 190, 255, 0.13);
  border-left: 4px solid #45b7ff;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.035);
}

.slot-row small {
  display: block;
  margin-bottom: 4px;
  color: #8498ab;
  font-size: 11px;
}

.slot-row strong {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.progress {
  height: 9px;
  overflow: hidden;
  border-radius: 99px;
  background: rgba(255, 255, 255, 0.08);
}

.progress div {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #45b7ff, rgba(255, 255, 255, 0.82));
}

.finance-card {
  padding: 14px;
  margin-bottom: 10px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.035);
}

.finance-card span {
  color: #8ea2b4;
  font-size: 12px;
}

.finance-card strong {
  display: block;
  margin-top: 6px;
  color: #75ed82;
  font-size: 20px;
}

.right-panel h3 {
  margin: 18px 0 10px;
}

.settlement-list {
  padding: 0;
  margin: 0;
  list-style: none;
}

.settlement-list li {
  padding: 11px 0;
  color: #b8c8d8;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
}

@media (max-width: 1200px) {
  .home-layout {
    grid-template-columns: 1fr;
  }

  .slot-row {
    grid-template-columns: 1fr;
  }
}
</style>