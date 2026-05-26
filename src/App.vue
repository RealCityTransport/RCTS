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
  width: 100%;
  height: auto;
  min-height: 100%;
  margin: 0;
  background: #000;
  color: #d8d8d8;
  overflow-y: auto;
  font-family: "Pretendard", "Noto Sans KR", system-ui, sans-serif;

  scrollbar-width: none;
  -ms-overflow-style: none;
}

html::-webkit-scrollbar,
body::-webkit-scrollbar,
#app::-webkit-scrollbar {
  display: none;
}

* {
  box-sizing: border-box;
}
</style>