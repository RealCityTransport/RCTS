<!-- src/views/PreviewRunsView.vue -->
<template>
  <div class="preview-page">
    <!-- 오빠 요구: "마치 본 컨텐츠인것마냥" 메인에 전부 나오게 -->
    <TheLeftArea class="preview-left-as-main" />
  </div>
</template>

<script setup>
import TheLeftArea from '@/components/TheLeftArea.vue';
</script>

<style scoped>
.preview-page{
  width:100%;
  height:100%;
  min-height:0;
  display:flex;
  flex-direction:column;
  overflow:hidden;
}

/* TheLeftArea는 원래 사이드 패널 폭/배경을 갖고 있을 수 있으니
   메인 컨텐츠처럼 꽉 차게 강제 */
.preview-left-as-main{
  width:100% !important;
  min-width:0 !important;
  height:100% !important;
  min-height:0 !important;

  /* 모바일 센터에 들어오면 border 정책은 CenterArea와 맞추는 게 보통 깔끔 */
  border:none !important;
}
</style>
