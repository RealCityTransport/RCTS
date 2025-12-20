<!-- src/views/HomeView.vue -->
<template>
  <div class="game-wrapper">
    <TheTopBar />
    <div class="main-layout-horizontal">
      <TheLeftArea />
      <TheCenterArea />
      <TheRightArea />
    </div>
  </div>
</template>

<script setup>
import TheTopBar from '@/components/TheTopBar.vue';
import TheLeftArea from '@/components/TheLeftArea.vue';
import TheCenterArea from '@/components/TheCenterArea.vue';
import TheRightArea from '@/components/TheRightArea.vue';
</script>

<style scoped lang="scss">
@use '@/styles/HomeView.scss'; 
</style>