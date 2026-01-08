<!-- src/company/CompanyPage.vue -->
<template>
  <div class="company-panel">
    <!-- 상단: 회사 관리 헤더 -->
    <header class="company-header">
      <div class="company-header-main">
        <h3 class="company-title">회사 관리</h3>
      </div>
    </header>

    <!-- 회사 정보 카드: 섹션 제목(회사 정보) 없이 바로 CompanyProfilePanel만 -->
    <section class="company-section">
      <div class="section-body">
        <CompanyProfilePanel />
      </div>
    </section>

    <!-- 연구 영역 -->
    <section class="company-section">
      <header class="section-header">
        <h4 class="section-title">회사 연구 (준비중)</h4>
        <p class="section-desc">
          회사 단위로 적용되는 연구 트리를 관리할 예정인 영역입니다.
          향후에는 회사 기술, 효율, 특화 전략 등을 연구로 해금하는 구조를
          이곳에서 다루게 됩니다.
        </p>
      </header>

      <div class="section-body">
        <CompanyResearchPanel />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import CompanyProfilePanel from './CompanyProfilePanel.vue'
import CompanyResearchPanel from './CompanyResearchPanel.vue'
</script>

<style scoped>
.company-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* 상단 헤더 */

.company-header {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.4);
}

.company-header-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.company-title {
  font-size: 0.95rem;
  font-weight: 700;
}

/* 공통 섹션 */

.company-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 10px;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.5);
  background: radial-gradient(
    circle at top left,
    rgba(30, 64, 175, 0.28),
    rgba(15, 23, 42, 0.98)
  );
}

.section-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.section-title {
  font-size: 0.88rem;
  font-weight: 600;
}

.section-desc {
  font-size: 0.78rem;
  opacity: 0.9;
  line-height: 1.5;
}

.section-body {
  margin-top: 4px;
}
</style>
