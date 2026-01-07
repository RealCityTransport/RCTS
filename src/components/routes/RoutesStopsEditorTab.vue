<!-- src/components/routes/RoutesStopsEditorTab.vue -->
<template>
  <section class="routes-section">
    <section class="routes-panel routes-panel-main">
      <h4 class="panel-title">정류장·역 편집</h4>
      <p class="panel-desc">
        이 화면에서는 노선에 사용되는 정류장·역 정보를 통합 관리하면서,
        선택한 노선에 포함될 정류장·역의 순서를 함께 편집합니다.
        정류장 마스터 데이터와 노선별 시퀀스를 한 흐름 안에서 다루는 것이 목표입니다.
      </p>

      <div class="panel-grid">
        <article class="panel-card">
          <h5 class="panel-card-title">정류장 마스터 관리</h5>
          <p class="panel-card-text">
            정류장 이름, 내부 코드, 위치 설명, 유형 등을 관리하는 영역입니다.
            하나의 정류장이 여러 노선에서 공유될 수 있도록
            노선과는 독립된 마스터 데이터로 다루고,
            편집한 내용은 즉시 노선 시퀀스 편집에도 반영됩니다.
          </p>
        </article>

        <article class="panel-card">
          <h5 class="panel-card-title">노선별 정류장 시퀀스</h5>
          <p class="panel-card-text">
            선택한 노선에 포함될 정류장·역을 순서대로 배치하는 영역입니다.
            드래그 앤 드롭 방식으로 순서를 조정하거나,
            일부 구간만 별도의 시퀀스로 분리해 관리하는 등
            설계에 특화된 편집 흐름을 준비합니다.
          </p>
        </article>

        <article class="panel-card">
          <h5 class="panel-card-title">상·하행 및 분기 관리</h5>
          <p class="panel-card-text">
            상·하행 노선, 분기 구간, 순환 구조 등을
            하나의 노선 그룹 안에서 어떻게 배치할지 정리하는 영역입니다.
            상·하행을 쌍으로 관리하거나, 분기 구간을 그룹으로 묶는 등
            다양한 패턴을 표현하는 것을 목표로 합니다.
          </p>
        </article>
      </div>
    </section>

    <section class="routes-panel routes-panel-sub">
      <div class="sub-grid">
        <article class="sub-card">
          <h4 class="sub-card-title">임시 저장 &amp; 초안 관리</h4>
          <p class="sub-card-text">
            아직 확정되지 않은 정류장·역 편집안을 초안으로 저장해 두고,
            나중에 다시 불러와 이어서 수정할 수 있는 구조를 위한 공간입니다.
            여러 후보 시퀀스를 만들어 놓고 비교해 볼 때 유용하게 쓰입니다.
          </p>
        </article>

        <article class="sub-card">
          <h4 class="sub-card-title">운영 반영 전 검증</h4>
          <p class="sub-card-text">
            실제 운행에 반영하기 전에,
            정류장 수, 구간 수, 예상 소요 시간 등 기본적인 지표를 기준으로
            문제가 없는지 간단히 점검하는 정보를 보여줄 예정입니다.
            이 검증 결과는 이후 운영 센터에서 사용할 계획·실적 비교의 기반이 됩니다.
          </p>
        </article>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
// 탭 내용 전용 컴포넌트 – 추후 정류장 마스터/시퀀스 편집 로직 추가 예정
</script>

<style scoped>
.routes-section {
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
