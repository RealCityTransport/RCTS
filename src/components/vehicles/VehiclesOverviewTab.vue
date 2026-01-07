<!-- src/components/vehicles/VehiclesOverviewTab.vue -->
<template>
  <div class="vehicles-overview-root">
    <section class="vehicles-panel vehicles-panel-main">
      <h4 class="panel-title">차량 현황 요약</h4>
      <p class="panel-desc">
        현재 보유 중인 전체 차량의 상태를 요약해서 보여주는 영역입니다.
        실제 서비스에서는 차량 수, 가동률, 정비 대기 차량 수 등
        운영자가 가장 먼저 확인하고 싶은 지표들이 이곳에 정리됩니다.
      </p>

      <div class="panel-grid">
        <article class="panel-card">
          <h5 class="panel-card-title">보유 차량 수 &amp; 타입</h5>
          <p class="panel-card-text">
            버스, 철도, 항공, 해상 등 각 차량 타입별 보유 대수를 정리해 보여줍니다.
            차량 구성을 큰 그림에서 빠르게 파악할 수 있도록
            단순한 지표 중심으로 구성됩니다.
          </p>
        </article>
        <article class="panel-card">
          <h5 class="panel-card-title">가동률 &amp; 예비 차량</h5>
          <p class="panel-card-text">
            현재 운행 중인 차량 비율과, 예비로 남겨둔 차량 비율을 정리합니다.
            가동률이 지나치게 낮거나 예비 차량이 부족한 경우,
            운영 전략을 조정해야 한다는 신호로 활용할 수 있습니다.
          </p>
        </article>
        <article class="panel-card">
          <h5 class="panel-card-title">주의가 필요한 차량</h5>
          <p class="panel-card-text">
            잦은 고장, 높은 누적 주행거리 등으로
            별도 관리가 필요한 차량 수를 요약해 보여줍니다.
            실제 구현 시에는 이 숫자를 눌러 바로 목록으로 이동할 수 있습니다.
          </p>
        </article>
      </div>
    </section>

    <section class="vehicles-panel vehicles-panel-sub">
      <div class="sub-grid">
        <article class="sub-card">
          <h4 class="sub-card-title">최근에 도입한 차량</h4>
          <p class="sub-card-text">
            최근에 새로 도입한 차량을 시간 순으로 정리해 보여주는 영역입니다.
            신규 투입 차량의 초기 운행 성과를 관찰할 때
            기준이 되는 목록으로 사용할 수 있습니다.
          </p>
        </article>

        <article class="sub-card">
          <h4 class="sub-card-title">퇴역 예정 차량</h4>
          <p class="sub-card-text">
            연식이나 상태를 이유로 곧 퇴역이 예정된 차량들을 모아 보여줍니다.
            실제 운영에서는 이 목록을 보고,
            대체 차량 도입이나 편성 변경 계획을 세우게 됩니다.
          </p>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
// 지금은 더미 설명 전용 탭이지만,
// 나중에 props로 실제 통계 데이터를 받아서 표시할 수 있게 확장하면 돼.
</script>

<style scoped>
.vehicles-overview-root {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 패널 공통 */

.vehicles-panel {
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.55);
  background: rgba(15, 23, 42, 0.96);
  padding: 8px 10px;
}

/* 메인 패널 */

.vehicles-panel-main {
  display: flex;
  flex-direction: column;
  gap: 8px;
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

.panel-grid {
  margin-top: 4px;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 8px;
}

.panel-card {
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.6);
  background: rgba(15, 23, 42, 0.98);
  padding: 8px 10px;
  font-size: 0.78rem;
}

.panel-card-title {
  font-size: 0.82rem;
  font-weight: 600;
  margin-bottom: 4px;
}

.panel-card-text {
  font-size: 0.78rem;
  opacity: 0.9;
  line-height: 1.5;
}

/* 서브 패널 */

.vehicles-panel-sub {
  display: flex;
  flex-direction: column;
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

/* 반응형 */

@media (min-width: 1040px) {
  .panel-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .sub-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
