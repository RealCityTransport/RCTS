<!-- src/components/layout/SiteMenu.vue -->
<template>
  <nav class="site-menu">
    <button
      v-for="menu in menuItems"
      :key="menu.id"
      type="button"
      :class="{
        active: activeMenu === menu.id,
        locked: menu.locked,
      }"
      :disabled="menu.locked"
      @click="selectMenu(menu)"
    >
      <span class="menu-icon">{{ menu.icon }}</span>

      <strong>{{ menu.name }}</strong>

      <small v-if="menu.locked">잠김</small>
    </button>
  </nav>
</template>

<script setup>
defineProps({
  menuItems: {
    type: Array,
    required: true,
  },
  activeMenu: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['select-menu'])

function selectMenu(menu) {
  if (menu.locked) {
    return
  }

  emit('select-menu', menu)
}
</script>

<style scoped>
.site-menu {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.site-menu button {
  width: 100%;
  min-height: 42px;
  display: grid;
  grid-template-columns: 22px 1fr auto;
  align-items: center;
  gap: 12px;
  padding: 0 14px 0 18px;
  border: 0;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.08);
  color: #e5e7eb;
  text-align: left;
  cursor: pointer;
}

.site-menu button:hover {
  background: rgba(255, 255, 255, 0.14);
}

.site-menu button.active {
  background: var(--blue);
  color: white;
}

.site-menu button.locked {
  opacity: 0.42;
  cursor: not-allowed;
  filter: grayscale(0.4);
}

.site-menu button.locked:hover {
  background: rgba(255, 255, 255, 0.08);
}

.menu-icon {
  width: 22px;
  text-align: center;
}

.site-menu strong {
  font-size: 15px;
}

.site-menu small {
  padding: 3px 6px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.7);
  color: #cbd5e1;
  font-size: 10px;
  font-weight: 900;
}

@media (max-width: 820px) {
  .site-menu {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
  }

  .site-menu button {
    grid-template-columns: 22px 1fr;
  }

  .site-menu small {
    display: none;
  }
}
</style>