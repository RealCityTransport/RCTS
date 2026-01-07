<!-- src/components/routes/RoutesDetailTab.vue -->
<template>
  <div class="routes-tab-root">
    <section class="routes-panel routes-panel-main">
      <h4 class="panel-title">노선 · 정류장 상세</h4>
      <p class="panel-desc">
        이 탭은 개별 노선과 정류장의 상세 정보를 집중적으로 보는 화면입니다.
        노선 편집/운영 화면 어디에서든 이 상세 모듈을 불러와
        같은 형태로 정보를 확인할 수 있도록 설계합니다.
      </p>

      <div class="panel-grid">
        <article class="panel-card">
          <h5 class="panel-card-title">선택한 노선 상세 정보</h5>
          <p class="panel-card-text">
            노선의 전체 구간, 정류장 수, 왕복 소요 시간, 평균 배차 간격 등
            노선 단위의 핵심 정보를 모아 보여주는 영역입니다.
            이후에는 수요, 수익, 비용 등 경영 지표도 함께 붙을 수 있습니다.
          </p>
        </article>

        <article class="panel-card">
          <h5 class="panel-card-title">정류장 / 역 상세</h5>
          <p class="panel-card-text">
            특정 정류장 또는 역을 선택했을 때,
            승하차 인원, 환승 연결, 주변 노선 정보 등을
            한 번에 확인할 수 있는 상세 패널이 들어올 자리입니다.
          </p>
        </article>

        <article class="panel-card">
          <h5 class="panel-card-title">운영 이력 &amp; 변경 기록</h5>
          <p class="panel-card-text">
            노선과 정류장에 대해 과거에 어떤 변경이 있었는지,
            배차 조정이나 경로 변경 이력을 타임라인 형식으로 보여주는 기능을
            이 영역과 연결할 예정입니다.
          </p>
        </article>
      </div>
    </section>

    <section class="routes-panel routes-panel-sub">
      <div class="sub-grid">
        <article class="sub-card">
          <h4 class="sub-card-title">관제 화면과의 연동</h4>
          <p class="sub-card-text">
            상세 패널에서 특정 노선이나 정류장을 선택하면,
            관제 화면에서도 동일 대상이 하이라이트되도록
            상호 연동되는 구조를 목표로 합니다.
          </p>
        </article>

        <article class="sub-card">
          <h4 class="sub-card-title">즐겨찾기 &amp; 바로가기</h4>
          <p class="sub-card-text">
            자주 확인하는 노선이나 정류장을 즐겨찾기로 지정해 두고,
            운영 센터나 다른 화면에서 바로 이 상세 탭으로 넘어올 수 있는
            바로가기 역할도 이 영역이 담당하게 됩니다.
          </p>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
// 노선/정류장 상세 보기 전용 탭
</script>

<style scoped>
.routes-tab-root {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.routes-panel {
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.55);
  background: rgba(15, 23, 42, 0.96);
  padding: 8px 10px;
}

.routes-panel-main {
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

.routes-panel-sub {
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

@media (min-width: 1040px) {
  .panel-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .sub-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
