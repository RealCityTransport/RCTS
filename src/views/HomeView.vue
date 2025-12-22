<template>
  <div class="game-wrapper">
    <TheTopBar />

    <div class="main-layout">
      <!-- 데스크톱: 기존 그대로 -->
      <TheLeftArea class="layout-area left-area desktop-only" />

      <!-- 센터는 항상 -->
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

  /* ✅ 100vw는 스크롤바 폭 때문에 가로 오버플로 유발 가능 → 100%로 */
  width:100%;
  height:100vh;
  min-height:100dvh;

  /* ✅ 데스크톱: 앱 내부 레이아웃 고정 */
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

/* ✅ 모바일: 센터만 */
.desktop-only{ display:flex; }

@media (max-width: 768px){
  .main-layout{
    flex-direction:column;
    flex: 0 0 auto;
    min-height:auto;
  }

  .desktop-only{
    display:none !important; /* LeftArea 숨김 */
  }

  .center-area{
    width:100%;
    flex: 0 0 auto;
    border:none;
  }

  .layout-area{
    border:none;
    min-height:auto;

    /* ✅ 내부 요소가 튀어나오며 가로 스크롤 생기는 것 방지 */
    overflow-x: hidden;
  }

  /* ✅ 핵심: 모바일에서는 game-wrapper 자체를 스크롤 컨테이너로 */
  .game-wrapper{
    height: 100dvh !important;
    min-height: 100dvh !important;

    overflow-y: auto !important;
    overflow-x: hidden !important;

    -webkit-overflow-scrolling: touch;

    /* ✅ 스크롤은 유지하고 스크롤바만 숨김 */
    scrollbar-width: none;        /* Firefox */
    -ms-overflow-style: none;     /* IE/Edge legacy */

    background:#0b0f16;
  }

  .game-wrapper::-webkit-scrollbar{
    width:0;
    height:0;
  }
}
</style>
