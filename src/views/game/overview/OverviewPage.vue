<!-- src/views/OverviewPage.vue -->
<template>
  <div class="overview-page">
    <section class="top-summary-grid">
      <div class="resource-card">
        <h3>자금</h3>
        <p class="value">$ 1,234,567,890</p>
      </div>
      <div class="resource-card">
        <h3>차량</h3>
        <p class="value">123 대</p>
      </div>
      <div class="resource-card">
        <h3>공장</h3>
        <p class="value">45 개</p>
      </div>
      <div class="resource-card">
        <h3>자원</h3>
        <p class="value">철: 123k, 석탄: 45k</p>
      </div>
    </section>

    <section class="main-dashboard-panels">
      <div class="panel">
        <h3>수익 현황</h3>
        <div class="chart-placeholder">여기에 수익 그래프 표시</div>
      </div>
      <div class="panel alerts">
        <h3>알림</h3>
        <ul>
          <li>차량 유지보수 필요 (버스 3대)</li>
          <li>신규 연구 완료: 고효율 엔진 (연구소)</li>
          <li>교통 혼잡 발생: 중앙로</li>
        </ul>
      </div>
    </section>

    <section class="main-feature-buttons">
      <button class="feature-btn">
        <span>교통센터</span>
        <small>노선 및 차량 관리</small>
      </button>
      <button class="feature-btn">
        <span>공장 관리</span>
        <small>생산 및 자원 감독</small>
      </button>
      <button class="feature-btn">
        <span>연구소</span>
        <small>기술 개발 및 혁신</small>
      </button>
      <button class="feature-btn locked">
        <span>우주 탐사</span>
        <small>잠금 해제 필요</small>
      </button>
    </section>

    <section class="recent-events-panel">
      <h3>최신 기록</h3>
      <ul>
        <li>DAY 1 - 14:35: '중앙 버스 터미널' 건설 완료.</li>
        <li>DAY 1 - 14:30: 월별 유지보수 비용 지출. -15,000 $</li>
        <li>DAY 1 - 14:10: '101번 버스 노선' 혼잡도 80% 초과.</li>
      </ul>
    </section>
  </div>
</template>

<script setup>
// 스크립트 로직 없음
</script>

<style lang="scss" scoped>
.overview-page {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  box-sizing: border-box;

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
      
      &:hover:not(.locked) {
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
      &.locked {
        background-color: #44445c;
        color: #777799;
        cursor: not-allowed;
        opacity: 0.6;
        span {
            text-decoration: line-through;
        }
      }
    }
  }

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