<!-- src/components/routes/RoutesPage.vue -->
<template>
  <div class="routes-root">
    <!-- 상단: 노선 내부 메뉴 탭만 표시 -->
    <header class="routes-header">
      <nav class="routes-nav">
        <button
          type="button"
          class="routes-nav-item"
          :class="{ 'is-active': activeTab === 'list' }"
          @click="activeTab = 'list'"
        >
          노선 목록
        </button>
        <button
          type="button"
          class="routes-nav-item"
          :class="{ 'is-active': activeTab === 'stopsOrder' }"
          @click="activeTab = 'stopsOrder'"
        >
          정류장·역 편집
        </button>
        <button
          type="button"
          class="routes-nav-item"
          :class="{ 'is-active': activeTab === 'detail' }"
          @click="activeTab = 'detail'"
        >
          노선·정류장 상세
        </button>
      </nav>
    </header>

    <!-- 본문 -->
    <main class="routes-body">
      <RoutesListTab v-if="activeTab === 'list'" />
      <RoutesStopsEditorTab
        v-else-if="activeTab === 'stopsOrder'"
      />
      <RoutesDetailTab v-else-if="activeTab === 'detail'" />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import RoutesListTab from './RoutesListTab.vue'
import RoutesStopsEditorTab from './RoutesStopsEditorTab.vue'
import RoutesDetailTab from './RoutesDetailTab.vue'

type RoutesTab = 'list' | 'stopsOrder' | 'detail'

const activeTab = ref<RoutesTab>('list')
</script>

<style scoped>
.routes-root {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 헤더 (탭만 유지) */

.routes-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.4);
}

/* 내부 메뉴 탭 */

.routes-nav {
  display: inline-flex;
  gap: 6px;
  padding: 4px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(148, 163, 184, 0.7);
}

.routes-nav-item {
  padding: 5px 12px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.8);
  background: rgba(15, 23, 42, 0.96);
  font-size: 0.78rem;
  cursor: pointer;
  color: #e5e7eb;
  transition:
    background 0.15s ease-out,
    border-color 0.15s ease-out,
    transform 0.05s ease-out;
}

.routes-nav-item:hover {
  border-color: rgba(191, 219, 254, 1);
  background: rgba(30, 64, 175, 0.9);
}

.routes-nav-item.is-active {
  border-color: rgba(129, 140, 248, 1);
  background: linear-gradient(
    135deg,
    rgba(79, 70, 229, 0.95),
    rgba(30, 64, 175, 0.95)
  );
  transform: translateY(-1px);
}

/* 본문 */

.routes-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>
