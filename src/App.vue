<!-- src/App.vue -->
<template>
  <router-view />
</template>

<script setup>
// App.vue는 최상위 라우터 뷰만 표시하므로, 별도의 로직은 필요 없습니다.
// 글로벌 스타일이나 전역적인 설정을 import 할 수도 있습니다.
// 예시: import '@/assets/styles/main.scss'; // 전역 SCSS 파일 (아래 3번 참고)
</script>

<style lang="scss">
/* 전역 스타일: normalize.css 또는 사용자 정의 리셋 스타일 */
@import url('https://cdn.jsdelivr.net/npm/reset-css@5.0.1/reset.min.css');

html, body, #app {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  overflow: hidden; /* 전체 앱 스크롤 방지, 내부 컴포넌트가 스크롤 처리 */
  font-family: 'NexonLv1Gothic', sans-serif; /* 기본 폰트 설정 (추후 로드 방식과 결합) */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
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