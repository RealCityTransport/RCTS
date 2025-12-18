<!-- src/views/NotFoundView.vue -->
<template>
  <div class="not-found">
    <h1>404 Not Found</h1>
    <p>찾을 수 없는 페이지입니다.</p>
    <router-link to="/">홈으로 돌아가기</router-link>
  </div>
</template>

<script setup>
</script>

<style scoped>
.not-found {
  text-align: center;
  margin-top: 50px;
  color: #e0e0e0;
}
a {
  color: #7289da;
  text-decoration: none;
}
</style>