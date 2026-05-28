<template>
  <PageShell
    eyebrow="System"
    title="시스템"
    description="시스템 메뉴는 복잡하게 나누지 않고 회사, 데이터, 설정 세 가지로만 유지합니다."
    stage="0단계"
  >
    <section class="card-grid">
      <ComingSoonCard
        tag="회사"
        title="회사"
        description="회사 현황, 운영 단계, 연구, 해금 상태, 선행 보너스를 이 안에 묶을 예정입니다."
      />

      <ComingSoonCard
        tag="데이터"
        title="데이터"
        description="저장, 자동저장, 불러오기, 백업 스냅샷, 데이터 검사를 이 안에 묶을 예정입니다."
      />

      <ComingSoonCard
        tag="설정"
        title="설정"
        description="화면 표시, 로그, 도움말, 알림, 모바일 UI 설정을 이 안에 묶을 예정입니다."
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