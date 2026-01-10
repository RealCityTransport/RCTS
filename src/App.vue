<!-- src/App.vue -->
<template>
  <router-view />
</template>

<script setup>
</script>

<style>
html, body, #app {
  width: 100%;
  height: 100%;
  margin: 0;

  /* 세로 스크롤은 유지 */
  overflow-y: auto;

  /* 가로 스크롤 방지 */
  overflow-x: hidden;

  /* 스크롤바 숨기기 (브라우저별 대응) */
  scrollbar-width: none;          /* Firefox */
  -ms-overflow-style: none;       /* IE/Edge legacy */
}

html::-webkit-scrollbar,
body::-webkit-scrollbar,
#app::-webkit-scrollbar {
  width: 0;
  height: 0;
}
</style>
