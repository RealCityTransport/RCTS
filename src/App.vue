<!-- src/App.vue -->
<!--
RCTS FILE CONTEXT
파일 역할:
- 사이트 최초 진입 시 실행되는 최상위 깡통 App.vue.
- 실제 화면은 vue-router의 <RouterView />를 통해 views/Home.vue에서 불러온다.
- App.vue는 화면 UI를 직접 담당하지 않고, 앱 전체 초기화만 담당한다.

현재 연결:
- src/router/index.js 에서 / 경로가 Home.vue를 로드한다.
- src/modules/standardTime.js 를 onMounted에서 시작한다.
- 표준시간 모듈은 사이트 실행 중 1초 = 1틱으로 계속 흐른다.

주의:
- App.vue에는 개별 화면 레이아웃을 넣지 않는다.
- Header, Home, Dashboard 같은 UI는 components/views 쪽에서 관리한다.
- 전역 스크롤바 숨김 스타일은 여기서 관리한다.

다음 작업 방향:
- 저장 모듈, 월드 로드 모듈, 초기 앱 부트스트랩 기능은 App.vue 또는 별도 bootstrap 모듈에서 연결한다.
-->

<template>
  <RouterView />
</template>

<script setup>
import { onBeforeUnmount, onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { standardTime } from './modules/standardTime'

onMounted(() => {
  standardTime.start()
})

onBeforeUnmount(() => {
  standardTime.stop()
})
</script>

<style>
html,
body,
#app {
  margin: 0;
  width: 100%;
  min-height: 100%;
}

html,
body {
  background: #d8e0ec;
  overflow-y: auto;
  overflow-x: hidden;

  /* Firefox */
  scrollbar-width: none;

  /* IE / Edge 구버전 */
  -ms-overflow-style: none;
}

/* Chrome / Edge / Safari */
html::-webkit-scrollbar,
body::-webkit-scrollbar,
#app::-webkit-scrollbar {
  width: 0;
  height: 0;
  display: none;
}

/* 내부 영역도 스크롤은 되지만 스크롤바는 숨김 */
* {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

*::-webkit-scrollbar {
  width: 0;
  height: 0;
  display: none;
}
</style>