<!-- src/components/main/MainTopMenu.vue -->
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

const menus = [
  { key: 'dashboard', label: '대시보드' },
  { key: 'routes', label: '노선' },

  // 🔁 기존: vehicles / 차량
  // { key: 'vehicles', label: '차량' },

  // ✅ 변경: map / 지도 (노선 도화지 / 공간 뷰 용)
  { key: 'map', label: '지도' },

  { key: 'construction', label: '건설' },
  { key: 'research', label: '연구' },
  { key: 'finance', label: '재정' },

  // 🔹 위키
  { key: 'wiki', label: '위키' },

  { key: 'community', label: '커뮤니티' },
  { key: 'settings', label: '설정' },
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
