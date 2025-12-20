<!-- src/App.vue -->
<template>
  <router-view />
</template>

<script setup>
  
</script>

<style lang="scss">
/* 전역 스타일: normalize.css 또는 사용자 정의 리셋 스타일 */
@import url('https://cdn.jsdelivr.net/npm/reset-css@5.0.1/reset.min.css');

html, body, #app {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  // ⭐⭐⭐ 폰트 패밀리 이름을 'Suit'로 변경 ⭐⭐⭐
  font-family: 'Suit', sans-serif; /* Fallback 폰트도 함께 지정 */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

button {
  font-family: 'Suit', sans-serif;
}

/* --- 임시 --- */
/* 폰트 파일 로드가 아직 안되었을 경우를 대비한 가이드 */
/* NexonLv1Gothic 폰트를 사용할 경우, 아래의 @font-face를
   public 폴더에 폰트를 배치한 후 main.scss나 다른 전역 스타일 파일에 추가해야 합니다.
   예시:
   @font-face {
     font-family: 'NexonLv1Gothic';
     src: url('/fonts/NexonLv1Gothic.woff') format('woff');
     font-weight: normal;
     font-style: normal;
   }
*/
/* --- /임시 --- */

/* 개발 중 시각적인 구분과 디버깅을 위한 임시 스타일 (나중에 삭제) */
/* .game-app-container { border: 2px solid green; }
.app-header { border: 1px solid red; }
.game-main-content { border: 1px solid blue; }
.app-footer { border: 1px solid yellow; }
.overview-page { border: 1px solid purple; } */

</style>