<!-- src/company/CompanyPage.vue -->
<template>
  <div class="company-panel">
    <!-- 상단: 회사 메뉴 헤더 + 탭 -->
    <header class="company-header">
      <div class="company-header-main">
        <h3 class="company-title">회사 관리</h3>
        <p class="company-subtitle">
          RCTS에서 사용할 회사 프로필과 회사 단위 연구를 관리하는 화면입니다.
          회사는 선택 사항이지만, 등록해 두면 운영·노선·차량·재정 정보를
          회사 기준으로 정리해서 볼 수 있습니다.
        </p>
      </div>

      <nav class="company-nav">
        <button
          type="button"
          class="company-nav-item"
          :class="{ 'is-active': activeTab === 'profile' }"
          @click="activeTab = 'profile'"
        >
          회사 정보
        </button>
        <button
          type="button"
          class="company-nav-item"
          :class="{ 'is-active': activeTab === 'research' }"
          @click="activeTab = 'research'"
        >
          연구 (준비중)
        </button>
      </nav>
    </header>

    <!-- 탭: 회사 정보 -->
    <section
      v-if="activeTab === 'profile'"
      class="company-section"
    >
      <CompanyProfilePanel />
    </section>

    <!-- 탭: 연구 -->
    <section
      v-else-if="activeTab === 'research'"
      class="company-section"
    >
      <CompanyResearchPanel />
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import CompanyProfilePanel from './CompanyProfilePanel.vue'
import CompanyResearchPanel from './CompanyResearchPanel.vue'

type CompanyTab = 'profile' | 'research'

const activeTab = ref<CompanyTab>('profile')
</script>

<style scoped>
.company-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 헤더 */

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

.company-subtitle {
  font-size: 0.8rem;
  opacity: 0.9;
  line-height: 1.6;
}

/* 내부 탭 */

.company-nav {
  display: inline-flex;
  gap: 6px;
  padding: 4px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(148, 163, 184, 0.7);
}

.company-nav-item {
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

.company-nav-item:hover {
  border-color: rgba(191, 219, 254, 1);
  background: rgba(30, 64, 175, 0.9);
}

.company-nav-item.is-active {
  border-color: rgba(129, 140, 248, 1);
  background: linear-gradient(
    135deg,
    rgba(79, 70, 229, 0.95),
    rgba(30, 64, 175, 0.95)
  );
  transform: translateY(-1px);
}

/* 공통 섹션 */

.company-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}
</style>
