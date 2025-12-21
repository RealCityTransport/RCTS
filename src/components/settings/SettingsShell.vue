<!-- src/components/settings/SettingsShell.vue -->
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
  min-height: 0; /* ✅ grid + overflow 안정 */
}

/* nav card */
.settings-nav {
  padding: 12px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.2);
  min-height: 0;
}

/* content card */
.settings-content {
  padding: 12px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.25);

  /* ✅ Settings 내부 라우트가 많아질수록 여기만 스크롤 */
  overflow: auto;
  min-height: 0;
}

/* ✅ MOBILE: sidebar → top panel */
@media (max-width: 768px) {
  .settings-shell {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
    gap: 10px;
  }

  .settings-nav {
    padding: 10px;
  }

  .settings-content {
    padding: 10px;
  }
}
</style>
