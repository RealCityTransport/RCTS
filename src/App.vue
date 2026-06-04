<!--
  파일 주소:
  src/App.vue

  적용 내용:
  - RCTS 앱의 최상위 공통 껍데기 파일
  - 앱 시작 시 gameState.js 초기화
  - save.js 저장 모듈 초기화
  - 자동저장 시작
  - bus.js 버스 시뮬레이션 시작
  - 공통 헤더 RctsHeader 표시
  - RouterView로 현재 페이지 로드
  - 전체 페이지 스크롤은 허용하되 스크롤바는 숨김 처리

  연결된 파일:
  - src/main.js
  - src/router/index.js
  - src/modules/gameState.js
  - src/modules/save.js
  - src/modules/bus.js
  - src/components/layout/RctsHeader.vue
  - src/views/Home.vue
  - src/views/BusView.vue
  - src/views/SettingsView.vue

  수정 시 주의:
  - 개별 페이지 레이아웃 코드는 이 파일에 넣지 않음
  - App.vue는 공통 구조와 전역 모듈 초기화만 담당
-->

<template>
  <div class="app-root">
    <RctsHeader />

    <RouterView />
  </div>
</template>

<script setup>
import { onBeforeUnmount } from 'vue'
import { RouterView } from 'vue-router'
import RctsHeader from './components/layout/RctsHeader.vue'
import { initializeGameState } from './modules/gameState'
import { initSaveModule, startAutoSave, stopAutoSave } from './modules/save'
import { initializeBusModule, startBusSimulation, stopBusSimulation } from './modules/bus'

initializeGameState()
initializeBusModule()

void initSaveModule().then(() => {
  startAutoSave()
  startBusSimulation()
})

onBeforeUnmount(() => {
  stopAutoSave()
  stopBusSimulation()
})
</script>

<style>
* {
  box-sizing: border-box;
}

html,
body,
#app {
  min-height: 100%;
  margin: 0;
}

html,
body {
  overflow: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

html::-webkit-scrollbar,
body::-webkit-scrollbar,
#app::-webkit-scrollbar,
.app-root::-webkit-scrollbar {
  width: 0;
  height: 0;
  display: none;
}

body {
  background: #06101a;
  color: #eaf4ff;
  font-family:
    Inter,
    Pretendard,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
}

button,
input,
select,
textarea {
  font: inherit;
}

button {
  cursor: pointer;
}

.app-root {
  min-height: 100vh;
  overflow: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  background:
    radial-gradient(circle at top left, rgba(0, 180, 255, 0.16), transparent 32%),
    radial-gradient(circle at bottom right, rgba(90, 255, 170, 0.09), transparent 34%),
    #06101a;
}
</style>