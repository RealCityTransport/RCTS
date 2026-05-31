<!-- src/App.vue -->
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