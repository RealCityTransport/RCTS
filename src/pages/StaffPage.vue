<template>
  <PageShell
    eyebrow="Staff"
    title="직원"
    description="직원 메뉴는 교육센터, 인사, 직원 목록 세 가지로만 구성합니다. 영입, 배치, 방출, 계승은 인사 메뉴 팀으로 들어갑니다."
    stage="0단계"
  >
    <section class="card-grid">
      <ComingSoonCard
        tag="교육센터"
        title="교육센터"
        description="초급, 중급, 고급, 외부 교육, 마스터 교육, 온라인 교육은 이 메뉴 안에서 관리될 예정입니다."
      />

      <ComingSoonCard
        tag="인사"
        title="인사"
        description="직원 후보, 영입, 이름 지정, 성별 랜덤, 희귀 인재, 배치, 방출, 계승 보너스는 모두 이 메뉴로 들어갑니다."
      />

      <ComingSoonCard
        tag="직원 목록"
        title="직원 목록"
        description="보유 직원, 근무 상태, 분야별 숙련, 교육 이력, 마스터 현황을 조회하는 메뉴입니다."
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

@media (max-width: 860px) {
  .card-grid {
    grid-template-columns: 1fr;
  }
}
</style>