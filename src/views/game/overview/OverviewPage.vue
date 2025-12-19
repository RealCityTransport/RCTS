<!-- src/views/OverviewPage.vue -->
<template>
  <div class="overview-page">
    <!-- 상단 요약 카드 -->
    <section class="top-summary-grid">
      <div class="resource-card">
        <h3>총 수익</h3>
        <p class="value">$ 1,234,567</p>
      </div>
      <div class="resource-card">
        <h3>총 운송 건수</h3>
        <p class="value">12,345 건</p>
      </div>
      <div class="resource-card">
        <h3>운행 차량 수</h3>
        <p class="value">123 대</p>
      </div>
      <div class="resource-card">
        <h3>노선 수</h3>
        <p class="value">56 개</p>
      </div>
    </section>

    <!-- 메인 대시보드 패널 -->
    <section class="main-dashboard-panels">
      <!-- 운송 현황 그래프 -->
      <div class="panel">
        <h3>운송 현황</h3>
        <div class="chart-placeholder">오늘 운송 수익/운송량 그래프</div>
      </div>

      <!-- 알림 / 이벤트 -->
      <div class="panel alerts">
        <h3>알림 / 이벤트</h3>
        <ul>
          <li>버스 101번 노선: 혼잡도 85%</li>
          <li>철도 3호선: 기관차 점검 필요</li>
          <li>신규 항공 노선: ICN → HND 개통</li>
          <li>화물선 'BlueWave': 정시율 95%</li>
        </ul>
      </div>
    </section>

    <!-- 운송 수단 버튼 -->
    <section class="main-feature-buttons">
      <button class="feature-btn">
        <span>버스</span>
        <small>노선 & 운행 관리</small>
      </button>
      <button class="feature-btn">
        <span>철도</span>
        <small>노선 & 차량 관리</small>
      </button>
      <button class="feature-btn">
        <span>비행기</span>
        <small>항공 노선 & 운항 관리</small>
      </button>
      <button class="feature-btn">
        <span>선박</span>
        <small>항로 & 화물/승객 운송</small>
      </button>
    </section>

    <!-- 최신 기록 -->
    <section class="recent-events-panel">
      <h3>최신 운송 기록</h3>
      <ul>
        <li>DAY 1 - 14:35: 버스 101번 노선 운행 완료</li>
        <li>DAY 1 - 14:30: 철도 3호선 유지보수 완료</li>
        <li>DAY 1 - 14:10: 신규 항공 노선 ICN → HND 운행 시작</li>
      </ul>
    </section>
  </div>
</template>

<script setup>
// 아직 스크립트 로직은 없음. 
// 필요하면 운송 데이터 API 연동 후 reactive 데이터로 대체 가능
</script>

<style lang="scss" scoped>
.overview-page {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  box-sizing: border-box;

  /* 상단 요약 카드 */
  .top-summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;

    .resource-card {
      background-color: #2c2c4d;
      padding: 1.2rem 1.5rem;
      border-radius: 8px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      text-align: center;

      h3 {
        margin-top: 0;
        color: #88c0d0;
        font-size: 1.1rem;
        margin-bottom: 0.5rem;
      }
      .value {
        font-size: 1.8rem;
        font-weight: bold;
        color: #e0e0e0;
      }
    }
  }

  /* 대시보드 패널 */
  .main-dashboard-panels {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 1.5rem;

    .panel {
      background-color: #2c2c4d;
      padding: 1.5rem;
      border-radius: 8px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);

      h3 {
        margin-top: 0;
        color: #88c0d0;
        font-size: 1.2rem;
        margin-bottom: 1rem;
      }
      &.alerts ul {
        list-style: none;
        padding: 0;
        margin: 0;
        li {
          padding: 0.5rem 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          &:last-child {
            border-bottom: none;
          }
        }
      }
      .chart-placeholder {
        background-color: #3e3e6b;
        height: 150px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #bbb;
        border-radius: 4px;
        font-style: italic;
      }
    }
  }

  /* 운송 수단 버튼 */
  .main-feature-buttons {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;

    .feature-btn {
      background-color: #3e3e6b;
      padding: 2rem 1.5rem;
      border: none;
      border-radius: 8px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      color: #e0e0e0;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      transition: background-color 0.2s ease, transform 0.2s ease;

      &:hover {
        background-color: #555588;
        transform: translateY(-3px);
      }
      span {
        font-size: 1.5rem;
        font-weight: bold;
        margin-bottom: 0.5rem;
      }
      small {
        font-size: 0.9rem;
        opacity: 0.7;
      }
    }
  }

  /* 최신 기록 */
  .recent-events-panel {
    background-color: #2c2c4d;
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);

    h3 {
      margin-top: 0;
      color: #88c0d0;
      font-size: 1.2rem;
      margin-bottom: 1rem;
    }
    ul {
      list-style: none;
      padding: 0;
      margin: 0;
      li {
        padding: 0.5rem 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        &:last-child {
          border-bottom: none;
        }
      }
    }
  }
}
</style>
