<template>
  <PageShell
    eyebrow="Transport"
    title="교통"
    description="교통 메뉴는 실제 교통망을 관리하는 영역입니다. 기능은 아직 연결하지 않고, 각 영역의 자리만 먼저 만듭니다."
    stage="임시 운영"
  >
    <section class="card-grid">
      <ComingSoonCard
        tag="관제"
        title="관제실"
        description="현재 운행, 임시 운행, 지연 상태, 주요 로그, 1초 1틱 흐름을 표시할 예정입니다."
      />

      <ComingSoonCard
        tag="시설"
        title="교통시설"
        description="도시, 정류장, 역, 터미널, 공항, 항구, 차고지, 정비시설을 관리할 예정입니다."
      />

      <ComingSoonCard
        tag="노선"
        title="노선"
        description="기본 노선, 자동 생성 노선, 유저 생성 노선, 정차지, 노선 색상, 노선 난이도를 관리할 예정입니다."
      />

      <ComingSoonCard
        tag="차량"
        title="차량"
        description="차량 등록, 차량 난이도, 필요 직원, 필요 교육, 차량 상태를 관리할 예정입니다."
      />

      <ComingSoonCard
        tag="운행"
        title="운행"
        description="임시 운행, 수동 운행, 반복 운행, 자동 운행, 배차 간격, 회차 시간을 관리할 예정입니다."
      />

      <ComingSoonCard
        tag="확장"
        title="수요 / 정비 / 안전"
        description="수요, 혼잡, 만족도, 정비, 고장 위험, 안전 관리는 이후 단계에서 열릴 예정입니다."
      />
    </section>
  </PageShell>
</template>

<script setup>
import PageShell from '../components/PageShell.vue'
import ComingSoonCard from '../components/ComingSoonCard.vue'
</script>

<style scoped>
.card-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

@media (max-width: 1080px) {
  .card-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .card-grid {
    grid-template-columns: 1fr;
  }
}
</style>