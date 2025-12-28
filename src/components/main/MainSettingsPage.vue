<!-- src/components/main/MainSettingsPage.vue -->
<template>
  <div class="settings-page">
    <header class="page-header">
      <h2 class="page-title">설정</h2>
      <p class="page-desc">
        게임 환경, 표시 옵션, 알림, 계정 연동 등을 관리하는 영역입니다.
      </p>
    </header>

    <section class="content-card">
      <p class="placeholder">
        기본 레이아웃만 준비된 상태입니다.<br />
        이후 KSTS 속도, UI 표시 옵션, 사운드 등의 설정 항목을 이곳에 배치할 수 있습니다.
      </p>
    </section>
  </div>
</template>

<script setup>
// 이후 설정/환경 관련 로직 연결
</script>

<style scoped>
.settings-page {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.page-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.page-title {
  font-size: 1rem;
  font-weight: 700;
}

.page-desc {
  font-size: 0.82rem;
  opacity: 0.9;
}

.content-card {
  padding: 14px 12px;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.86);
  border: 1px solid rgba(148, 163, 184, 0.55);
  font-size: 0.82rem;
}

.placeholder {
  opacity: 0.9;
  line-height: 1.5;
}
</style>
