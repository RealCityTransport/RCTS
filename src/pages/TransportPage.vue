<!-- src/pages/TransportPage.vue -->

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useRctsStore } from '../stores/rctsStore'

const {
  company,
  isMenuOpen,
  getDepartmentHead,
  getDepartmentHeadTitle,
} = useRctsStore()

const transportHead = computed(() => {
  return getDepartmentHead('transport')
})

const transportHeadTitle = computed(() => {
  return getDepartmentHeadTitle('transport')
})
</script>

<template>
  <section class="menu-page">
    <header class="page-header">
      <RouterLink to="/" class="back-link">← 뒤로</RouterLink>

      <div>
        <h1>교통</h1>
        <p v-if="transportHead">
          {{ transportHead.name }} {{ transportHeadTitle }}
        </p>
      </div>
    </header>

    <section v-if="!company" class="empty-panel">
      <strong>회사 정보 없음</strong>
    </section>

    <section v-else-if="!isMenuOpen('transport')" class="empty-panel">
      <strong>직원고용하세요</strong>
    </section>

    <section v-else class="active-panel">
      <strong>곧 개방됩니다</strong>
    </section>
  </section>
</template>

<style scoped>
.menu-page {
  min-height: calc(100dvh - 120px);
  padding: 24px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 24px;
  background: rgba(15, 23, 42, 0.42);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  gap: 16px;
  margin-bottom: 18px;
}

.back-link {
  color: #93c5fd;
  font-size: 13px;
  font-weight: 900;
  text-decoration: none;
}

.page-header h1,
.page-header p {
  margin: 0;
}

.page-header h1 {
  color: #f8fafc;
  font-size: 32px;
  font-weight: 900;
}

.page-header p {
  margin-top: 6px;
  color: #93c5fd;
  font-size: 14px;
  font-weight: 900;
}

.empty-panel,
.active-panel {
  min-height: 160px;
  display: grid;
  place-items: center;
  padding: 24px;
  border-radius: 20px;
  text-align: center;
}

.empty-panel {
  border: 1px dashed rgba(148, 163, 184, 0.28);
  background: rgba(15, 23, 42, 0.42);
  color: #94a3b8;
}

.active-panel {
  border: 1px solid rgba(96, 165, 250, 0.42);
  background: rgba(96, 165, 250, 0.1);
  color: #f8fafc;
}

@media (max-width: 720px) {
  .menu-page {
    min-height: calc(100dvh - 96px);
    padding: 18px;
    border-radius: 20px;
  }

  .page-header {
    display: grid;
  }

  .page-header h1 {
    font-size: 28px;
  }
}
</style>