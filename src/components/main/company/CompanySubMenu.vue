<!--
RCTS FILE CONTEXT
파일 역할:
- 회사 메뉴 내부의 2차 메뉴를 담당한다.
- 현재 2차 메뉴는 연구 / 설정으로 구성된다.

현재 연결:
- CompanyPage.vue에서 사용된다.
- activeTab props를 받아 현재 선택된 2차 메뉴를 표시한다.
- isSettingsUnlocked props로 설정 메뉴 잠금 여부를 판단한다.
- select-tab 이벤트로 선택된 탭 id를 부모에게 전달한다.

현재 규칙:
- 연구 탭은 항상 열려 있다.
- 설정 탭은 settings-basic 연구 완료 전까지 잠김 상태다.

주의:
- 실제 연구 내용과 설정 내용은 이 컴포넌트에 넣지 않는다.
- 이 컴포넌트는 2차 메뉴 버튼 출력만 담당한다.

다음 작업 방향:
- 회사 내부 2차 메뉴가 늘어나면 tabs 배열로 반복 렌더링하도록 바꿀 수 있다.
-->

<template>
  <nav class="company-sub-menu">
    <button
      type="button"
      :class="{ active: activeTab === 'research' }"
      @click="emit('select-tab', 'research')"
    >
      <span>◇</span>
      <strong>연구</strong>
    </button>

    <button
      type="button"
      :class="{
        active: activeTab === 'settings',
        locked: !isSettingsUnlocked,
      }"
      :disabled="!isSettingsUnlocked"
      @click="emit('select-tab', 'settings')"
    >
      <span>⚙</span>
      <strong>설정</strong>
      <small v-if="!isSettingsUnlocked">잠김</small>
    </button>
  </nav>
</template>

<script setup>
defineProps({
  activeTab: {
    type: String,
    required: true,
  },
  isSettingsUnlocked: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits(['select-tab'])
</script>

<style scoped>
.company-sub-menu {
  display: flex;
  gap: 10px;
  padding: 12px;
  border: 1px solid #dbe3ef;
  border-radius: 12px;
  background: #f8fafc;
}

.company-sub-menu button {
  min-width: 128px;
  height: 44px;
  display: inline-grid;
  grid-template-columns: 22px 1fr auto;
  align-items: center;
  gap: 8px;
  padding: 0 14px;
  border: 1px solid #dbe3ef;
  border-radius: 10px;
  background: white;
  color: #334155;
  font-weight: 900;
  cursor: pointer;
}

.company-sub-menu button:hover {
  border-color: #93c5fd;
  background: #eff6ff;
}

.company-sub-menu button.active {
  border-color: var(--blue);
  background: var(--blue);
  color: white;
}

.company-sub-menu button.locked {
  opacity: 0.5;
  cursor: not-allowed;
  filter: grayscale(0.4);
}

.company-sub-menu button.locked:hover {
  border-color: #dbe3ef;
  background: white;
}

.company-sub-menu span {
  text-align: center;
}

.company-sub-menu small {
  padding: 3px 6px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.72);
  color: #e2e8f0;
  font-size: 10px;
  font-weight: 900;
}

@media (max-width: 820px) {
  .company-sub-menu {
    display: grid;
    grid-template-columns: 1fr;
  }

  .company-sub-menu button {
    width: 100%;
  }
}
</style>