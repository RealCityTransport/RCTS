<template>
  <nav class="top-menu">
    <button
      v-for="item in menus"
      :key="item.key"
      type="button"
      class="menu-button"
      :class="{ active: modelValue === item.key }"
      @click="$emit('update:modelValue', item.key)"
    >
      {{ item.label }}
    </button>
  </nav>
</template>

<script setup>
defineProps({
  modelValue: {
    type: String,
    required: true,
  },
})

// PLAY 내부 메인 메뉴
// MainView.vue 의 activeMenu 와 1:1로 맞춘다.
const menus = [
  { key: 'routes', label: '노선' },            // 노선 관리
  { key: 'vehicles', label: '차량·장비' },     // 차량 & 편성 관리
  { key: 'operations', label: '운행' },        // 배차 / 시간표 / 운행 관리
  { key: 'settings', label: '설정' },          // 환경 설정
]
</script>

<style scoped>
.top-menu {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 4px;
  margin-bottom: 8px;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.78);
  border: 1px solid rgba(148, 163, 184, 0.6);
}

.menu-button {
  padding: 6px 14px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.7);
  background: rgba(15, 23, 42, 0.7);
  color: #e5e7eb;
  font-size: 0.78rem;
  cursor: pointer;
  white-space: nowrap;
}

.menu-button.active {
  background: rgba(59, 130, 246, 0.4);
  border-color: rgba(59, 130, 246, 0.9);
}
</style>
