<!-- src/views/DataArchivePage.vue -->
<template>
  <div class="data-archive-page">
    <h2>실존 데이터베이스 자료실</h2>
    <p>여기에 다양한 실존 데이터와 정보들이 표시될 예정입니다.</p>
    <ul>
      <li>철도 노선 자료</li>
      <li>교통량 통계</li>
      <li>도시 개발 사례</li>
      <li>산업 동향 보고서</li>
    </ul>
  </div>
</template>

<script setup>
// 자료실 관련 로직이 여기에 추가될 예정
</script>

<style lang="scss" scoped>
.data-archive-page {
  padding: 2rem;
  color: #e0e0e0;
  background-color: #2a2a47; /* 배경색으로 구분 */
  border-radius: 8px;
  min-height: 100%; /* 부모의 높이를 채우도록 */
  box-sizing: border-box;

  h2 {
    color: #88c0d0;
    margin-bottom: 1.5rem;
  }
  ul {
    list-style: disc;
    padding-left: 1.5rem;
  }
  li {
    margin-bottom: 0.5rem;
  }
}
</style>