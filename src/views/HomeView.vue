<template>
  <div class="game-wrapper">
    <TheTopBar />

    <div class="main-layout">
      <TheLeftArea class="layout-area left-area" />
      <TheCenterArea class="layout-area center-area" />
    </div>
  </div>
</template>

<script setup>
import TheTopBar from '@/components/TheTopBar.vue';
import TheLeftArea from '@/components/TheLeftArea.vue';
import TheCenterArea from '@/components/TheCenterArea.vue';
</script>

<style scoped>
.game-wrapper{
  display:flex;
  flex-direction:column;
  width:100vw;
  height:100vh;
  min-height:100dvh;
  overflow:hidden;
  background: var(--main-bg-color);
  color: var(--text-color);
}

.main-layout{
  display:flex;
  flex:1;
  width:100%;
  min-height:0;
}

/* 공통 */
.layout-area{
  display:flex;
  flex-direction:column;
  min-width:0;
  min-height:0;
  box-sizing:border-box;
  border: 1px solid var(--border-color);
}

/* 데스크톱 */
.left-area{
  width: var(--panel-width);
  min-width: var(--panel-min-width);
  background-color: var(--area-bg-color-left);
  border-left:none;
}

.center-area{
  flex:1;
  background-color: var(--area-bg-color-center);
  border-left:none;
  border-right:none;
}

/* ✅ 모바일: 무조건 센터만 */
@media (max-width: 768px){
  .main-layout{
    flex-direction:column;
  }
  .left-area{
    display:none !important;
  }
  .center-area{
    width:100%;
    flex:1;
    border:none;
  }
  .layout-area{
    border:none;
  }

  /* 모바일 전용 톤(원하면 더 과감히) */
  .game-wrapper{
    background:#0b0f16;
  }
}
</style>
