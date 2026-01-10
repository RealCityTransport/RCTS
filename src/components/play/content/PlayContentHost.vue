<!-- src/components/play/content/PlayContentHost.vue -->
<template>
  <!-- ✅ GLOBAL 컨텐츠가 우선 -->
  <WikiPage v-if="activeGlobal === 'wiki'" />
  <DevlogPage v-else-if="activeGlobal === 'devlog'" />
  <CommunityPage v-else-if="activeGlobal === 'community'" />

  <!-- ✅ PLAY 컨텐츠 -->
  <CompanyPage v-else-if="activeMenu === 'company'" />
  <OperationsPage v-else-if="activeMenu === 'operations'" />
  <RoutesPage v-else-if="activeMenu === 'routes'" />
  <VehiclesPage v-else-if="activeMenu === 'vehicles'" />
  <SettingsPage v-else-if="activeMenu === 'settings'" />

  <!-- 나머지는 더미 -->
  <div v-else class="section-panel">
    <h3 class="section-title">{{ currentTitle }}</h3>
    <p class="section-desc">
      이 메뉴는 아직 더미 상태야. 회사 → 운영 → 노선 → 차량 → 설정 순서대로 실제 페이지를 붙일 거고,
      지금은 UI 구조를 통일하는 단계!
    </p>

    <div class="section-grid">
      <div class="section-card">
        <h4 class="section-card-title">현재 메뉴</h4>
        <p class="section-card-text">
          {{ currentTitle }} (더미)
        </p>
      </div>
      <div class="section-card">
        <h4 class="section-card-title">상태</h4>
        <p class="section-card-text">
          로직 비활성화 · UI만 표시
        </p>
      </div>
      <div class="section-card">
        <h4 class="section-card-title">다음 작업</h4>
        <p class="section-card-text">
          각 메뉴를 components/play 하위 페이지로 분리해서 연결
        </p>
      </div>
    </div>

    <div class="section-actions">
      <router-link to="/" class="home-link">← Home</router-link>
    </div>
  </div>
</template>

<script setup>
import CompanyPage from '@/components/play/company/CompanyPage.vue'
import OperationsPage from '@/components/play/operations/OperationsPage.vue'
import RoutesPage from '@/components/play/routes/RoutesPage.vue'
import VehiclesPage from '@/components/play/vehicles/VehiclesPage.vue'
import SettingsPage from '@/components/play/settings/SettingsPage.vue'

import WikiPage from '@/components/wiki/wikipage.vue'
import DevlogPage from '@/components/devlog/devlogpage.vue'
import CommunityPage from '@/components/community/communitypage.vue'

defineProps({
  activeMenu: { type: String, required: true },
  activeGlobal: { type: String, required: true },
  currentTitle: { type: String, required: true },
})
</script>

<style scoped>
.section-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section-title {
  font-size: 0.95rem;
  font-weight: 900;
  color: rgba(248, 250, 252, 0.96);
}

.section-desc {
  font-size: 0.8rem;
  color: rgba(226, 232, 240, 0.9);
  line-height: 1.6;
}

.section-grid {
  margin-top: 2px;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 8px;
}

.section-card {
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.45);
  background: rgba(2, 6, 23, 0.22);
  padding: 8px 10px;
  font-size: 0.78rem;
}

.section-card-title {
  font-size: 0.82rem;
  font-weight: 900;
  color: rgba(248, 250, 252, 0.96);
  margin-bottom: 4px;
}

.section-card-text {
  font-size: 0.78rem;
  color: rgba(226, 232, 240, 0.9);
  line-height: 1.5;
}

.section-actions {
  margin-top: 6px;
  display: flex;
}

.home-link {
  text-decoration: none;
  font-weight: 900;
  letter-spacing: 0.04em;
  color: rgba(248, 250, 252, 0.96);
  padding: 8px 10px;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.45);
  background: rgba(2, 6, 23, 0.18);
}

.home-link:hover {
  border-color: rgba(191, 219, 254, 0.95);
}

@media (min-width: 860px) {
  .section-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
