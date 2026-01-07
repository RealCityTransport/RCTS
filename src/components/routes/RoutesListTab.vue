<!-- src/components/routes/RoutesListTab.vue -->
<template>
  <div class="routes-tab-root">
    <section class="routes-panel routes-panel-main">
      <h4 class="panel-title">노선 목록</h4>
      <p class="panel-desc">
        이 영역은 전체 노선 목록을 관리하는 기본 화면입니다.
        노선 이름과 번호, 노선 타입, 운영 여부 등을 한눈에 볼 수 있는
        리스트/테이블 UI가 들어올 자리입니다.
      </p>

      <div class="panel-grid">
        <article class="panel-card">
          <h5 class="panel-card-title">기본 노선 정보</h5>
          <p class="panel-card-text">
            노선 이름, 번호, 노선 타입(버스/철도/도시철도 등),
            시작·종점과 주요 경유지를 정리하는 영역입니다.
            이후에는 실제 지형 데이터와 연동해
            경로를 지도 위에서 바로 확인할 수 있도록 확장됩니다.
          </p>
        </article>

        <article class="panel-card">
          <h5 class="panel-card-title">운영 상태 &amp; 필터</h5>
          <p class="panel-card-text">
            정상 운행, 일시 중단, 폐지 예정 등
            노선의 운영 상태를 기준으로 필터링할 수 있는 기능이 들어올 자리입니다.
            노선 수가 많아질수록 이 필터가 핵심 도구가 됩니다.
          </p>
        </article>

        <article class="panel-card">
          <h5 class="panel-card-title">정렬 &amp; 즐겨찾기</h5>
          <p class="panel-card-text">
            노선 번호, 수요 규모, 최근 수정일 등을 기준으로 정렬하거나,
            자주 보는 노선을 즐겨찾기로 고정해 두는 기능을 위한 공간입니다.
          </p>
        </article>
      </div>
    </section>

    <section class="routes-panel routes-panel-sub">
      <div class="sub-grid">
        <article class="sub-card">
          <h4 class="sub-card-title">최근에 수정한 노선</h4>
          <p class="sub-card-text">
            최근에 노선 정보를 수정했거나, 배차 계획을 변경한 노선을
            시간 순으로 정리해 보여주는 영역입니다.
            실제로는 이곳에서 최근 작업을 이어서 진행하기 편하도록
            바로 이동할 수 있는 링크가 제공됩니다.
          </p>
        </article>

        <article class="sub-card">
          <h4 class="sub-card-title">새로 검토 중인 노선</h4>
          <p class="sub-card-text">
            향후 추가를 검토 중인 노선이나 시범 운행 노선을
            메모해 둘 수 있는 공간입니다.
            정식 노선으로 등록하기 전까지 간단한 메모 형식으로 관리할 수 있도록
            가벼운 입력 UI가 이 영역에 배치될 예정입니다.
          </p>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
// 아직 별도 로직은 없이, 구조/레이아웃만 담당하는 탭 컨포넌트
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
