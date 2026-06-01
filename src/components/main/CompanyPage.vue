<!--
RCTS FILE CONTEXT
파일 역할:
- 회사 메뉴의 껍데기/조립 페이지.
- 회사명과 설명이 들어가는 BaseMainPage를 유지한다.
- 회사 내부 2차 메뉴 상태만 관리한다.
- 실제 연구/설정 내용은 별도 컴포넌트로 분리되어 있다.

현재 연결:
- Home.vue에서 activeMenu === 'company'일 때 표시된다.
- company props를 받는다.
- completedResearch props를 받는다.
- activeResearch props를 받는다.
- currentTick props를 받는다.
- storageInfo, storageMessage, storageBusy props를 받는다.
- CompanySubMenu.vue를 통해 연구/설정 2차 메뉴를 표시한다.
- CompanyResearchPanel.vue에서 연구 목록과 진행 상태를 표시한다.
- CompanySettingsPanel.vue에서 회사 설정 및 데이터 저장 영역을 표시한다.

현재 규칙:
- 연구는 기본 접근 가능.
- 설정은 settings-basic 연구 완료 전까지 잠김.
- save-local-basic 연구 완료 후 설정 > 데이터 > 수동 저장 기능이 열린다.
- 설정이 잠긴 상태에서 settings 탭으로 갈 수 없다.
- 연구 시작 이벤트와 저장 관련 이벤트는 Home.vue로 다시 전달한다.

주의:
- CompanyPage.vue에는 연구 카드나 설정 폼의 세부 UI를 직접 넣지 않는다.
- 이 파일은 회사 메뉴 전체 틀과 2차 메뉴 전환만 담당한다.

다음 작업 방향:
- 회사 내부 2차 메뉴가 많아지면 companyTabs 데이터를 별도 파일로 분리할 수 있다.
-->

<template>
  <BaseMainPage
    eyebrow="COMPANY"
    :title="companyName"
    description="이곳은 회사 정보, 기본 연구, 회사 설정을 관리하는 중심 메뉴입니다."
    badge="회사 메뉴"
  >
    <section class="company-page-shell">
      <CompanySubMenu
        :active-tab="activeTab"
        :is-settings-unlocked="isSettingsUnlocked"
        @select-tab="selectTab"
      />

      <CompanyResearchPanel
        v-if="activeTab === 'research'"
        :completed-research="completedResearch"
        :active-research="activeResearch"
        :current-tick="currentTick"
        @start-research="emit('start-research', $event)"
      />

      <CompanySettingsPanel
        v-else-if="activeTab === 'settings'"
        :company="company"
        :completed-research="completedResearch"
        :is-settings-unlocked="isSettingsUnlocked"
        :storage-info="storageInfo"
        :storage-message="storageMessage"
        :storage-busy="storageBusy"
        @save-world="emit('save-world')"
        @load-world="emit('load-world')"
        @delete-world="emit('delete-world')"
      />
    </section>
  </BaseMainPage>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import BaseMainPage from './BaseMainPage.vue'
import CompanySubMenu from './company/CompanySubMenu.vue'
import CompanyResearchPanel from './company/CompanyResearchPanel.vue'
import CompanySettingsPanel from './company/CompanySettingsPanel.vue'

const props = defineProps({
  company: {
    type: Object,
    default: null,
  },
  completedResearch: {
    type: Array,
    default: () => [],
  },
  activeResearch: {
    type: Object,
    default: null,
  },
  currentTick: {
    type: Number,
    default: 0,
  },
  storageInfo: {
    type: Object,
    default: () => ({
      hasSavedData: false,
      savedAt: null,
      version: null,
    }),
  },
  storageMessage: {
    type: String,
    default: '',
  },
  storageBusy: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits([
  'start-research',
  'save-world',
  'load-world',
  'delete-world',
])

const activeTab = ref('research')

const companyName = computed(() => {
  return props.company?.name || '회사 정보 없음'
})

const isSettingsUnlocked = computed(() => {
  return props.completedResearch.includes('settings-basic')
})

watch(isSettingsUnlocked, (value) => {
  if (!value && activeTab.value === 'settings') {
    activeTab.value = 'research'
  }
})

function selectTab(tabId) {
  if (tabId === 'settings' && !isSettingsUnlocked.value) {
    return
  }

  activeTab.value = tabId
}
</script>

<style scoped>
.company-page-shell {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>