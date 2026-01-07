<!-- src/components/vehicles/VehiclesPage.vue -->
<template>
  <div class="vehicles-root">
    <!-- 상단: 차량 헤더 + 내부 메뉴 -->
    <header class="vehicles-header">
      <div class="vehicles-header-main">
        <h3 class="vehicles-title">차량 관리</h3>
        <p class="vehicles-desc">
          차량 관리는 노선 운영의 뼈대를 이루는 영역입니다.
          어떤 차량을 보유하고 있는지, 지금 얼마나 가동 중인지,
          언제 정비가 필요한지를 한곳에서 관리할 수 있도록 구성됩니다.
        </p>
      </div>

      <nav class="vehicles-nav">
        <button
          type="button"
          class="vehicles-nav-item"
          :class="{ 'is-active': activeTab === 'overview' }"
          @click="activeTab = 'overview'"
        >
          차량 현황
        </button>
        <button
          type="button"
          class="vehicles-nav-item"
          :class="{ 'is-active': activeTab === 'list' }"
          @click="activeTab = 'list'"
        >
          차량 목록
        </button>
      </nav>
    </header>

    <!-- 본문 -->
    <main class="vehicles-body">
      <!-- 탭: 차량 현황 -->
      <section
        v-if="activeTab === 'overview'"
        class="vehicles-section"
      >
        <VehiclesOverviewTab />
      </section>

      <!-- 탭: 차량 목록 -->
      <section
        v-else-if="activeTab === 'list'"
        class="vehicles-section"
      >
        <VehiclesListTab />
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

import VehiclesOverviewTab from '@/components/vehicles/VehiclesOverviewTab.vue'
import VehiclesListTab from '@/components/vehicles/VehiclesListTab.vue'

type VehiclesTab = 'overview' | 'list'

const activeTab = ref<VehiclesTab>('overview')
</script>

<style scoped>
.vehicles-root {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 헤더 */

.vehicles-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.4);
}

.vehicles-header-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.vehicles-title {
  font-size: 0.95rem;
  font-weight: 700;
}

.vehicles-desc {
  font-size: 0.8rem;
  opacity: 0.9;
  line-height: 1.6;
}

/* 내부 메뉴 */

.vehicles-nav {
  display: inline-flex;
  gap: 6px;
  padding: 4px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(148, 163, 184, 0.7);
}

.vehicles-nav-item {
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

.vehicles-nav-item:hover {
  border-color: rgba(191, 219, 254, 1);
  background: rgba(30, 64, 175, 0.9);
}

.vehicles-nav-item.is-active {
  border-color: rgba(129, 140, 248, 1);
  background: linear-gradient(
    135deg,
    rgba(79, 70, 229, 0.95),
    rgba(30, 64, 175, 0.95)
  );
  transform: translateY(-1px);
}

/* 본문 */

.vehicles-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.vehicles-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>
