<!-- src/company/CompanyResearchPanel.vue -->
<template>
  <div class="company-research-root">
    <h3 class="company-title">회사 연구</h3>
    <p class="company-desc">
      회사 연구는 특정 회사에 귀속되는 장기 업그레이드 시스템입니다.
      차량 성능 향상, 노선 효율 개선, 운영 자동화 같은 연구 과제를
      회사 단위로 선택하고, 일정 시간에 걸쳐 진행하게 됩니다.
    </p>

    <p class="company-desc company-desc-secondary">
      현재 버전에서는 회사 연구 기능이 아직 활성화되어 있지 않습니다.
      연구 트리와 연구 슬롯, 진행 상태 표시 UI가 준비되면
      이 화면에서 바로 회사 연구를 관리할 수 있도록 순차적으로 업데이트될 예정입니다.
    </p>

    <div class="research-placeholder">
      <h4 class="placeholder-title">곧 추가될 기능</h4>
      <ul class="placeholder-list">
        <li>회사별 연구 트리 및 연구 카테고리</li>
        <li>동시에 진행 가능한 연구 슬롯 수 제한</li>
        <li>연구 진행률, 남은 시간 표시와 완료 알림</li>
        <li>운영·노선·차량 화면과 연동되는 연구 효과 적용</li>
      </ul>
      <p class="placeholder-note">
        연구 시스템이 도입되면, 회사 프로필을 등록한 상태에서
        이 화면을 통해 회사의 “장기 성장 방향”을 설정할 수 있습니다.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.company-research-root {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.company-title {
  font-size: 0.95rem;
  font-weight: 700;
}

.company-desc {
  font-size: 0.8rem;
  opacity: 0.9;
  line-height: 1.6;
}

.company-desc-secondary {
  margin-top: -2px;
  opacity: 0.85;
}

/* 연구 플레이스홀더 */

.research-placeholder {
  margin-top: 4px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px dashed rgba(148, 163, 184, 0.7);
  background: rgba(15, 23, 42, 0.9);
  font-size: 0.8rem;
}

.placeholder-title {
  font-size: 0.84rem;
  font-weight: 600;
  margin-bottom: 4px;
}

.placeholder-list {
  margin: 4px 0 6px;
  padding-left: 16px;
  line-height: 1.6;
}

.placeholder-note {
  font-size: 0.78rem;
  opacity: 0.9;
  line-height: 1.5;
}
</style>
