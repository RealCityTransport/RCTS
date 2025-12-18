<!-- src/views/game/overview/OverviewPage.vue -->
<template>
  <div class="overview-page">
    <!-- 메인 대시보드 시안 반영 -->
    <section class="top-summary-grid">
      <div class="resource-card">
        <h3>💰 Funds</h3>
        <p class="value">1,500,000 $</p>
      </div>
      <div class="resource-card">
        <h3>🚌 Buses</h3>
        <p class="value">3 Units</p>
      </div>
      <div class="resource-card">
        <h3>🏭 Factories</h3>
        <p class="value">1 Unit</p>
      </div>
      <div class="resource-card">
        <h3>📦 Resources</h3>
        <p class="value">120 / 500 Tons</p>
      </div>
    </section>

    <section class="main-dashboard-panels">
      <div class="panel income-panel">
        <h3>📊 Income Overview</h3>
        <ul>
          <li>Bus Profits: <span class="income-value">+12,000 $ / min</span></li>
          <li>Rail & Air: <span class="status locked">Locked</span></li>
          <li>Shipping: <span class="status locked">Locked</span></li>
        </ul>
      </div>

      <div class="panel alerts-panel">
        <h3>🔔 Alerts</h3>
        <ul>
          <li>Construction Complete: New Bus Depot!</li>
          <li>Research Upgrade Ready: Engine Efficiency V2!</li>
          <li>Probe Returned with Resources: Uranium Ore x100</li>
        </ul>
      </div>
    </section>

    <section class="main-feature-buttons">
      <button class="feature-btn">🚛 Transport Center</button>
      <button class="feature-btn">🏭 Factory Management</button>
      <button class="feature-btn">🔬 Research Lab</button>
      <button class="feature-btn locked" disabled>🚀 Space Exploration</button>
    </section>

    <section class="panel recent-events-panel">
      <h3>📜 Recent Events</h3>
      <ul>
        <li>[DAY 1 - 12:30] New Bus Route established: Line A-101.</li>
        <li>[DAY 1 - 11:45] Factory "Alpha" built at Sector 3.</li>
        <li>[DAY 1 - 10:15] Quarterly Income Collected.</li>
      </ul>
    </section>
  </div>
</template>

<script setup>
// 대시보드 관련 데이터 및 로직 (아직 비워둡니다)
</script>

<style lang="scss" scoped>
.overview-page {
  width: 100%;
  max-width: 1200px; /* 대시보드 최대 폭 설정 */
  margin: 0 auto; /* 중앙 정렬 */
  padding: 1rem; /* 내부 여백 */
  background-color: #22223b; /* 페이지 배경색 */
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.top-summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;

  .resource-card {
    background-color: #33334d;
    padding: 1rem;
    border-radius: 6px;
    text-align: center;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);

    h3 {
      font-size: 0.9rem;
      color: #99aab5;
      margin-bottom: 0.5rem;
    }
    .value {
      font-size: 1.5rem;
      font-weight: bold;
      color: #7289da;
    }
  }
}

.main-dashboard-panels {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1.5rem;

  .panel {
    flex: 1;
    background-color: #33334d;
    padding: 1.2rem;
    border-radius: 6px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);

    h3 {
      font-size: 1rem;
      color: #4CAF50;
      margin-bottom: 1rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding-bottom: 0.5rem;
    }

    ul {
      list-style: none;
      padding: 0;
      margin: 0;
      li {
        padding: 0.3rem 0;
        font-size: 0.85rem;
        color: #e0e0e0;
      }
    }
    .income-value {
      color: #28a745;
      font-weight: bold;
    }
    .status.locked {
      color: #ffc107;
      font-weight: bold;
    }
  }
}

.main-feature-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;

  .feature-btn {
    background-color: #44446d;
    color: #fff;
    padding: 1.2rem 1rem;
    border: none;
    border-radius: 6px;
    font-size: 1rem;
    font-weight: bold;
    cursor: pointer;
    transition: background-color 0.2s ease, transform 0.2s ease;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);

    &:hover:not(.locked) {
      background-color: #555588;
      transform: translateY(-2px);
    }

    &.locked {
      background-color: #3d3d5f;
      color: #777;
      cursor: not-allowed;
    }
  }
}

.recent-events-panel {
  background-color: #33334d;
  padding: 1.2rem;
  border-radius: 6px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);

  h3 {
    font-size: 1rem;
    color: #ffc107; /* 알림 강조 색상 */
    margin-bottom: 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding-bottom: 0.5rem;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    li {
      padding: 0.3rem 0;
      font-size: 0.8rem;
      color: #e0e0e0;
      border-bottom: 1px dashed rgba(255, 255, 255, 0.05);
      &:last-child {
        border-bottom: none;
      }
    }
  }
}
</style>