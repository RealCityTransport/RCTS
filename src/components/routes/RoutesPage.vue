<!-- src/components/routes/RoutesPage.vue -->
<template>
  <div class="routes-root">
    <main class="routes-body">
      <section class="routes-columns">
        <!-- 왼쪽: 노선 목록 (내부에 상세 포함) -->
        <div class="routes-left">
          <div class="routes-panel">
            <RoutesListTab />
          </div>
        </div>

        <!-- 오른쪽: 정류장·역 목록 -->
        <div class="routes-panel">
          <RoutesStopsEditorTab />
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import RoutesListTab from './RoutesListTab.vue'
import RoutesStopsEditorTab from './RoutesStopsEditorTab.vue'
</script>

<style scoped>
.routes-root {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.routes-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.routes-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.routes-left {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 여기 패널은 레이아웃용 래퍼.
   실제 테두리/배경은 내부 컴포넌트에서 처리 */
.routes-panel {
  display: flex;
  flex-direction: column;
}

@media (max-width: 900px) {
  .routes-columns {
    grid-template-columns: 1fr;
  }
}
</style>
