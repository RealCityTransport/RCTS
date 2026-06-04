<!--
  파일 주소:
  src/components/layout/RctsHeader.vue

  적용 내용:
  - RCTS 공통 상단 헤더 컴포넌트
  - 좌측 RCTS 로고 표시
  - 중앙 메뉴를 Vue Router의 RouterLink로 연결
  - 메뉴 클릭 시 각 View.vue 페이지가 RouterView에 로드됨
  - 우측에는 보유 자금만 표시
  - 자금 표시는 src/modules/finance.js의 getFunds(), formatMoney()를 통해 표시
  - 신규 게임 시작 시 gameState 기본 자금 0R이 헤더에 표시됨

  연결된 파일:
  - src/App.vue
  - src/router/index.js
  - src/modules/gameState.js
  - src/modules/finance.js
  - src/views/Home.vue
  - src/views/BusView.vue
  - src/views/RailView.vue
  - src/views/AirView.vue
  - src/views/ShipView.vue
  - src/views/SpaceView.vue
  - src/views/ResearchView.vue
  - src/views/SettingsView.vue

  향후 연결 예정:
  - src/modules/world.js
  - src/modules/research.js

  수정 시 주의:
  - 메뉴를 추가/삭제할 때는 navItems와 router/index.js의 routes를 같이 수정
  - 자금은 gameState.finance.funds를 직접 포맷하지 말고 finance.js를 통해 표시
-->

<template>
  <header class="rcts-header">
    <div class="brand-area">
      <RouterLink class="brand-logo" to="/">RCTS</RouterLink>
    </div>

    <nav class="top-nav">
      <RouterLink
        v-for="item in navItems"
        :key="item.key"
        :to="item.path"
        class="nav-button"
        :class="{ active: route.path === item.path }"
      >
        <span class="nav-icon">{{ item.icon }}</span>
        <span>{{ item.label }}</span>
      </RouterLink>
    </nav>

    <div class="header-right">
      <div class="fund-box">
        <div class="fund-label">보유 자금</div>
        <div class="fund-value">{{ displayedFunds }}</div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { formatMoney, getFunds } from '../../modules/finance'

const route = useRoute()

const displayedFunds = computed(() => formatMoney(getFunds()))

const navItems = [
  { key: 'dashboard', label: '대시보드', icon: '▦', path: '/' },
  { key: 'bus', label: '버스', icon: '▣', path: '/bus' },
  { key: 'rail', label: '철도', icon: '▤', path: '/rail' },
  { key: 'air', label: '항공', icon: '✈', path: '/air' },
  { key: 'ship', label: '선박', icon: '▰', path: '/ship' },
  { key: 'space', label: '우주선', icon: '◆', path: '/space' },
  { key: 'research', label: '연구', icon: '◇', path: '/research' },
  { key: 'settings', label: '설정', icon: '⚙', path: '/settings' }
]
</script>

<style scoped>
.rcts-header {
  position: sticky;
  top: 0;
  z-index: 20;
  display: grid;
  grid-template-columns: 150px minmax(520px, 1fr) 220px;
  gap: 16px;
  align-items: center;
  min-height: 76px;
  padding: 12px 24px;
  border-bottom: 1px solid rgba(120, 190, 255, 0.16);
  background: rgba(3, 12, 22, 0.92);
  backdrop-filter: blur(18px);
}

.brand-area {
  display: flex;
  align-items: center;
}

.brand-logo {
  color: #eaf4ff;
  text-decoration: none;
  letter-spacing: 0.05em;
  font-size: 38px;
  font-weight: 900;
  line-height: 1;
}

.top-nav {
  display: flex;
  min-width: 0;
  overflow: hidden;
  border: 1px solid rgba(120, 190, 255, 0.16);
  border-radius: 14px;
}

.nav-button {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-width: 74px;
  padding: 14px 9px;
  color: #b8c8d8;
  text-decoration: none;
  border-right: 1px solid rgba(120, 190, 255, 0.1);
  background: rgba(255, 255, 255, 0.025);
}

.nav-button:last-child {
  border-right: 0;
}

.nav-button.active {
  color: #eaf9ff;
  background: linear-gradient(
    180deg,
    rgba(0, 174, 255, 0.26),
    rgba(0, 112, 190, 0.22)
  );
  box-shadow: inset 0 0 0 1px rgba(84, 207, 255, 0.32);
}

.nav-icon {
  color: #74d5ff;
  font-size: 15px;
}

.header-right {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.fund-box {
  min-width: 190px;
  padding: 11px 14px;
  border: 1px solid rgba(229, 211, 90, 0.2);
  border-radius: 14px;
  background: rgba(229, 211, 90, 0.06);
}

.fund-label {
  color: #9daec0;
  font-size: 12px;
  text-align: right;
}

.fund-value {
  margin-top: 3px;
  color: #e5d35a;
  font-size: 21px;
  font-weight: 900;
  text-align: right;
}

@media (max-width: 1180px) {
  .rcts-header {
    grid-template-columns: 130px 1fr;
  }

  .header-right {
    grid-column: 1 / -1;
    justify-content: flex-end;
  }
}

@media (max-width: 820px) {
  .rcts-header {
    position: static;
    grid-template-columns: 1fr;
  }

  .top-nav {
    overflow-x: auto;
  }

  .nav-button {
    flex: 0 0 auto;
    min-width: 88px;
  }

  .header-right {
    justify-content: flex-start;
  }

  .fund-box {
    width: 100%;
  }

  .fund-label,
  .fund-value {
    text-align: left;
  }
}
</style>