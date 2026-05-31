<!-- src/views/Home.vue -->
<template>
  <main class="app-shell">
    <Header />

    <section class="layout">
      <aside class="sidebar">
        <SiteMenu
          :menu-items="menuItems"
          :active-menu="activeMenu"
          @select-menu="selectMenu"
        />

        <section class="side-card">
          <h3>사이트 상태</h3>

          <dl>
            <dt>회사 상태</dt>
            <dd>{{ hasCompany ? '생성됨' : '없음' }}</dd>

            <dt>회사명</dt>
            <dd>{{ company?.name || '-' }}</dd>

            <dt>선택 메뉴</dt>
            <dd>{{ activeMenuName }}</dd>

            <dt>메뉴 상태</dt>
            <dd>{{ hasCompany ? '연구 기반 개방' : '대시보드만 공개' }}</dd>
          </dl>
        </section>

        <section v-if="hasCompany" class="side-card">
          <h3>완료 연구</h3>

          <ul class="research-list">
            <li v-for="research in completedResearchLabels" :key="research">
              {{ research }}
            </li>
          </ul>
        </section>
      </aside>

      <section class="main-area">
        <DashboardPage
          v-if="activeMenu === 'dashboard'"
          :company="company"
          @create-company="handleCreateCompany"
        />

        <CompanyPage
          v-else-if="activeMenu === 'company'"
          :company="company"
        />

        <ResearchPage
          v-else-if="activeMenu === 'research'"
          :completed-research="completedResearch"
          @complete-research="completeResearch"
        />

        <ComingSoonPage
          v-else
          :menu-name="activeMenuName"
        />
      </section>
    </section>

    <footer class="footer-tip">
      <strong>TIP</strong>
      <span>
        메인 컨텐츠는 BaseMainPage.vue를 기준으로 통일된 페이지 포맷을 사용합니다.
      </span>
    </footer>
  </main>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

import Header from '../components/Header.vue'
import SiteMenu from '../components/layout/SiteMenu.vue'

import DashboardPage from '../components/main/DashboardPage.vue'
import CompanyPage from '../components/main/CompanyPage.vue'
import ResearchPage from '../components/main/ResearchPage.vue'
import ComingSoonPage from '../components/main/ComingSoonPage.vue'

import { getResearchName } from '../data/researchItems'
import {
  getSiteMenuName,
  getVisibleSiteMenus,
  isSiteMenuUnlocked,
} from '../data/siteMenus'

const company = ref(null)
const activeMenu = ref('dashboard')
const completedResearch = ref([])

const hasCompany = computed(() => {
  return Boolean(company.value)
})

const menuItems = computed(() => {
  return getVisibleSiteMenus({
    hasCompany: hasCompany.value,
  }).map((menu) => {
    return {
      ...menu,
      locked: hasCompany.value && !isSiteMenuUnlocked(menu, completedResearch.value),
    }
  })
})

const activeMenuName = computed(() => {
  return getSiteMenuName(activeMenu.value)
})

const completedResearchLabels = computed(() => {
  if (completedResearch.value.length === 0) {
    return ['완료된 연구 없음']
  }

  return completedResearch.value.map((id) => getResearchName(id))
})

watch(hasCompany, (value) => {
  if (!value) {
    activeMenu.value = 'dashboard'
  }
})

function isResearchDone(researchId) {
  return completedResearch.value.includes(researchId)
}

function selectMenu(menu) {
  if (menu.locked) {
    return
  }

  activeMenu.value = menu.id
}

function completeResearch(researchId) {
  if (isResearchDone(researchId)) {
    return
  }

  completedResearch.value.push(researchId)
}

function handleCreateCompany(payload) {
  const id =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `company-${Date.now()}`

  company.value = {
    id,
    name: payload.name,
    createdAt: new Date().toISOString(),
  }

  completedResearch.value = []
  activeMenu.value = 'dashboard'
}
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.app-shell {
  --header-bg: #172033;
  --header-card-bg: #26334d;
  --news-bg: #0f172a;
  --news-label-bg: #2563eb;
  --workspace-bg: #d8e0ec;
  --sidebar-bg: #101827;
  --sidebar-card-bg: #1c2940;
  --main-bg: #edf2f7;
  --panel-bg: #ffffff;
  --panel-border: #cfd8e5;
  --text-main: #111827;
  --text-soft: #64748b;
  --blue: #2563eb;
  --blue-dark: #1e3a8a;
  --green: #15803d;
  --orange: #f97316;

  min-height: 100vh;
  background: var(--workspace-bg);
  color: var(--text-main);
  font-family:
    Pretendard,
    Inter,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    sans-serif;
}

.layout {
  min-height: calc(100vh - 150px);
  display: grid;
  grid-template-columns: 232px minmax(0, 1fr);
  gap: 0;
  background: var(--workspace-bg);
}

.sidebar {
  padding: 18px 14px;
  color: white;
  background:
    linear-gradient(180deg, rgba(37, 99, 235, 0.1), transparent 32%),
    var(--sidebar-bg);
  border-right: 1px solid rgba(255, 255, 255, 0.08);
}

.side-card {
  margin-top: 28px;
  padding: 14px;
  border-radius: 10px;
  background: var(--sidebar-card-bg);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.side-card h3 {
  margin: 0 0 12px;
  font-size: 15px;
}

.side-card dl {
  margin: 0;
}

.side-card dt {
  margin-top: 12px;
  color: #cbd5e1;
  font-size: 12px;
}

.side-card dd {
  margin: 4px 0 0;
  color: white;
  font-size: 14px;
  word-break: keep-all;
}

.research-list {
  display: flex;
  flex-direction: column;
  gap: 7px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.research-list li {
  color: #dbeafe;
  font-size: 13px;
  line-height: 1.45;
}

.main-area {
  min-width: 0;
  padding: 18px;
  background: var(--main-bg);
}

.footer-tip {
  min-height: 38px;
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 0 24px;
  color: #dbeafe;
  font-size: 13px;
  background: #111827;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.footer-tip strong {
  color: #93c5fd;
}

@media (max-width: 820px) {
  .layout {
    grid-template-columns: 1fr;
  }

  .sidebar {
    padding: 14px;
    border-right: 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .main-area {
    padding: 10px;
  }

  .footer-tip {
    height: auto;
    padding: 12px 16px;
    align-items: flex-start;
  }
}
</style>