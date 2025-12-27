<!-- src/App.vue -->
<template>
  <router-view />
</template>

<script setup>
</script>

<style>
html,
body,
#app {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;

  /* 스크롤은 허용 */
  overflow-y: auto;

  /* 스크롤바만 숨김 (Firefox) */
  scrollbar-width: none;
}

/* 스크롤바만 숨김 (Chrome, Edge, Safari 등 WebKit 계열) */
html::-webkit-scrollbar,
body::-webkit-scrollbar,
#app::-webkit-scrollbar {
  width: 0;
  height: 0;
}
</style>
