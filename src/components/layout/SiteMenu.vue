<!-- src/components/layout/SiteMenu.vue -->
<!--
RCTS FILE CONTEXT
파일 역할:
- 좌측 사이트 메뉴의 출력 스타일을 통일하는 컴포넌트.
- 메뉴 데이터 자체는 data/siteMenus.js에서 관리한다.
- 이 컴포넌트는 메뉴를 버튼으로 보여주고, 선택 이벤트만 부모로 전달한다.

현재 연결:
- Home.vue에서 <SiteMenu />로 사용한다.
- Home.vue가 menuItems와 activeMenu를 props로 전달한다.
- 메뉴 클릭 시 select-menu 이벤트를 emit한다.

현재 규칙:
- activeMenu와 menu.id가 같으면 active 스타일.
- menu.locked가 true면 잠김 스타일 + disabled 처리.
- 모바일에서는 메뉴가 2열 그리드로 표시된다.

주의:
- 이 컴포넌트 안에서 회사 여부나 연구 완료 여부를 직접 판단하지 않는다.
- 잠김 여부는 Home.vue에서 계산해서 menu.locked로 넘긴다.

다음 작업 방향:
- 메뉴 그룹, 하위 메뉴, 알림 배지, 연구 필요 툴팁 등을 추가할 수 있다.
-->

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