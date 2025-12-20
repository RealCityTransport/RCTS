<!-- src/components/TheCenterArea.vue -->
<template>
  <div class="layout-area center-area">
    <div class="center-content-wrapper">
      <!-- 🚀 메인 콘텐츠 내부 탑 메뉴 (내비게이션) 영역 🚀 -->
      <nav class="main-content-nav">
        <ul>
          <li><router-link to="/home/research">연구</router-link></li>
          <li><router-link to="/home/vehicles">차량</router-link></li>
          <li><router-link to="/home/line">노선</router-link></li>
          <li><router-link to="/home/construction">건설</router-link></li>
          <li><router-link to="/home/finance">재정</router-link></li>
        </ul>
      </nav>

      <!-- 🚀 메뉴 클릭에 따라 콘텐츠가 바뀌는 영역 (Vue Router View) 🚀 -->
      <div class="main-content-display">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped lang="scss">
@use '@/styles/TheCenterArea.scss';
</style>