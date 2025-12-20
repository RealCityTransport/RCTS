<!-- src/App.vue -->
<template>
  <router-view />
</template>

<script setup>
// App.vue는 최상위 컴포넌트로, 라우팅된 뷰를 렌더링하는 역할만 수행합니다.
// 여기에 직접적인 로직이나 컴포넌트를 두지 않습니다.
</script>

<style scoped>
/*
  App.vue에는 스코프 스타일이 전혀 필요 없거나,
  매우 최소한의 앱 전역 컨테이너 관련 스타일만 두어야 합니다.
  모든 reset, global font, root variables 등은 global.scss로 이동합니다.
*/
</style>