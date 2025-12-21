<template>
  <div class="settings-shell">
    <aside class="settings-nav">
      <slot name="nav" />
    </aside>

    <section class="settings-content">
      <slot name="content" />
    </section>
  </div>
</template>

<script setup>
</script>

<style scoped lang="scss">
.settings-shell {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 14px;
  width: 100%;
  height: 100%;
  min-height: 0; // ✅ router-view 내용이 overflow로 잘리거나 안보이는 문제 방지
}

.settings-nav {
  padding: 12px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.2);
  min-height: 0;
}

.settings-content {
  padding: 12px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.25);
  overflow: auto;  // ✅ 내용 스크롤
  min-height: 0;   // ✅ grid/overflow 조합에서 필수
}
</style>
