<!-- src/components/Header.vue -->
<template>
  <header class="site-header">
    <HeaderTop />

    <HeaderNews :news-items="newsItems" />
  </header>
</template>

<script setup>
import HeaderTop from './header/HeaderTop.vue'
import HeaderNews from './header/HeaderNews.vue'

const newsItems = [
  '회사등록가능 / 주의 저장 미지원(추가예정)',
]
</script>

<style scoped>
.site-header {
  width: 100%;
}
</style>