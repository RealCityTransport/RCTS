<!-- src/components/play/company/CompanyPage.vue -->
<template>
  <div class="company-panel">
    <!-- 상단: 회사 관리 헤더 -->
    <header class="company-header">
      <div class="company-header-main">
        <h3 class="company-title">회사 관리</h3>
        <p class="company-sub">
          현재는 UI 골격만 적용된 상태입니다. (로직/데이터/연동 없음)
        </p>
      </div>
    </header>

    <!-- 회사 정보 -->
    <section class="company-section">
      <header class="section-header">
        <h4 class="section-title">회사 정보</h4>
        <p class="section-desc">
          회사 프로필/기본 설정 영역. 추후 계정 기준으로 저장되는 회사 데이터를 연결합니다.
        </p>
      </header>

      <div class="section-body">
        <CompanyProfilePanel />
      </div>
    </section>

    <!-- 연구 영역 -->
    <section class="company-section">
      <header class="section-header">
        <h4 class="section-title">회사 연구</h4>
        <p class="section-desc">
          회사 단위 연구 트리 / 진행 슬롯 / 해금 효과 요약을 구성하는 영역입니다.
          (현재는 레이아웃 고정용 더미)
        </p>
      </header>

      <div class="section-body">
        <CompanyResearchPanel />
      </div>
    </section>
  </div>
</template>

<script setup>
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
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.35);
}

.company-header-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.company-title {
  font-size: 0.95rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  color: rgba(248, 250, 252, 0.96);
}

.company-sub {
  margin: 0;
  font-size: 0.78rem;
  opacity: 0.86;
  line-height: 1.5;
  color: rgba(226, 232, 240, 0.9);
}

/* 공통 섹션 */

.company-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 12px;

  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.55);
  background: radial-gradient(
    circle at top left,
    rgba(56, 189, 248, 0.12),
    rgba(15, 23, 42, 0.98)
  );
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.55);
}

.section-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.section-title {
  font-size: 0.88rem;
  font-weight: 900;
  letter-spacing: 0.02em;
  color: rgba(248, 250, 252, 0.96);
}

.section-desc {
  margin: 0;
  font-size: 0.78rem;
  opacity: 0.9;
  line-height: 1.55;
  color: rgba(226, 232, 240, 0.9);
}

.section-body {
  margin-top: 2px;
}
</style>
