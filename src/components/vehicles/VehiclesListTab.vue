<!-- src/components/vehicles/VehiclesListTab.vue -->
<template>
  <div class="vehicles-list-root">
    <section class="vehicles-panel vehicles-panel-main">
      <h4 class="panel-title">차량 목록</h4>
      <p class="panel-desc">
        이 화면에서는 차량 하나하나의 정보를 목록으로 관리합니다.
        실제 서비스에서는 차량 ID, 종류, 소속 회사, 투입 노선, 상태 등
        여러 기준으로 검색하고 필터링할 수 있도록 구성됩니다.
      </p>

      <div class="panel-grid">
        <article class="panel-card">
          <h5 class="panel-card-title">기본 정보</h5>
          <p class="panel-card-text">
            차량 이름 또는 번호, 타입(버스/전철/기차/항공/선박 등),
            소속 회사와 현재 상태 같은 기본 속성들이 이 영역에서 관리됩니다.
            이후에는 표 형식 또는 카드 형식 중 원하는 방식으로
            전환해서 볼 수 있도록 확장됩니다.
          </p>
        </article>
        <article class="panel-card">
          <h5 class="panel-card-title">검색 &amp; 필터</h5>
          <p class="panel-card-text">
            차량 타입, 상태, 소속 노선, 연식 등으로
            원하는 차량만 골라 볼 수 있는 검색/필터 기능이 들어올 자리입니다.
            차량 수가 많아질수록 이 기능의 역할이 중요해집니다.
          </p>
        </article>
        <article class="panel-card">
          <h5 class="panel-card-title">차량 상세로 이동</h5>
          <p class="panel-card-text">
            목록에서 특정 차량을 선택하면,
            운행 이력, 고장 이력, 정비 기록 등을 볼 수 있는
            상세 페이지로 이동하는 입구 역할을 합니다.
          </p>
        </article>
      </div>
    </section>

    <section class="vehicles-panel vehicles-panel-sub">
      <div class="sub-grid">
        <article class="sub-card">
          <h4 class="sub-card-title">보기 방식 &amp; 정렬</h4>
          <p class="sub-card-text">
            차량을 카드형, 표형 등 원하는 방식으로 보여주고,
            이름, 타입, 상태, 최근 운행 시간 등을 기준으로
            정렬 방식을 바꿀 수 있는 옵션이 이 영역에 배치될 예정입니다.
          </p>
        </article>

        <article class="sub-card">
          <h4 class="sub-card-title">새 차량 등록 입구</h4>
          <p class="sub-card-text">
            실제 노선에 투입할 새 차량을 등록하는 흐름은
            이 자리에서 시작됩니다.
            차량 타입을 선택하고, 기본 정보를 입력한 뒤
            바로 노선이나 편성에 연결할 수 있도록 안내하게 됩니다.
          </p>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
// 나중에는 props로 차량 리스트/필터 상태를 받아서
// 실제 차량 테이블 컴포넌트로 교체하면 돼.
</script>

<style scoped>
.vehicles-list-root {
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
