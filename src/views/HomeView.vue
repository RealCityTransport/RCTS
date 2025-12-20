<!-- src/views/HomeView.vue -->
<template>
  <div class="game-wrapper">
    <!-- 탑 바 컴포넌트 -->
    <TheTopBar />

    <!-- 메인 레이아웃 (왼쪽, 중앙, 오른쪽 영역을 담는 컨테이너) -->
    <div class="main-layout-horizontal">
      <!-- 왼쪽 영역 컴포넌트 -->
      <TheLeftArea />

      <!-- 중앙 영역 컴포넌트 -->
      <TheCenterArea />

      <!-- 오른쪽 영역 컴포넌트 -->
      <TheRightArea />
    </div>
  </div>
</template>

<script setup>
// 이 HomeView 컴포넌트에서 필요한 로직은 여기에 직접 작성합니다.
// 현재 HomeView는 주로 컴포넌트를 조합하는 역할이므로, 로직은 간단합니다.

// 각 영역 컴포넌트들을 불러옵니다.
// '@/components'는 보통 src/components를 가리키는 alias입니다.
import TheTopBar from '@/components/TheTopBar.vue';
import TheLeftArea from '@/components/TheLeftArea.vue';
import TheCenterArea from '@/components/TheCenterArea.vue';
import TheRightArea from '@/components/TheRightArea.vue';
</script>

<style scoped lang="scss">
@use '@/styles/HomeView.scss';
</style>