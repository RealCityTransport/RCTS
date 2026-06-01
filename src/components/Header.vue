<!-- src/components/Header.vue -->
<!--
RCTS FILE CONTEXT
파일 역할:
- 사이트 상단 Header 전체를 조립하는 컨테이너 컴포넌트.
- 실제 헤더 상단은 HeaderTop.vue가 담당한다.
- 뉴스 영역은 HeaderNews.vue가 담당한다.

현재 연결:
- Home.vue에서 <Header />로 호출된다.
- HeaderTop.vue는 표준시간을 표시한다.
- HeaderNews.vue는 뉴스/공지 한 줄 문구를 표시한다.

주의:
- Header.vue에는 세부 디자인을 직접 많이 넣지 않는다.
- HeaderTop / HeaderNews를 조립하는 역할만 유지한다.

다음 작업 방향:
- 사용자 회사명이 생기면 HeaderTop.vue의 부제 영역에 회사명 또는 월드명을 연결할 수 있다.
- 뉴스 데이터가 많아지면 newsItems를 별도 data/headerNews.js로 분리할 수 있다.
-->

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