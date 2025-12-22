<!-- src/components/TheCenterArea.vue -->
<template>
  <div class="layout-area center-area">
    <div class="center-content-wrapper">
      <!-- DESKTOP TAB NAV -->
      <nav class="main-content-nav desktop-only" aria-label="Main navigation">
        <ul class="nav-list">
          <li class="nav-item"><router-link to="/home/research">연구</router-link></li>
          <li class="nav-item"><router-link to="/home/vehicles">차량</router-link></li>
          <li class="nav-item"><router-link to="/home/line">노선</router-link></li>
          <li class="nav-item"><router-link to="/home/construction">건설</router-link></li>
          <li class="nav-item"><router-link to="/home/finance">재정</router-link></li>
          <li class="nav-item"><router-link to="/home/city">도시</router-link></li>
          <li class="nav-item"><router-link to="/home/settings">설정</router-link></li>
        </ul>
      </nav>

      <!-- MOBILE HEADER (Hamburger) -->
      <div class="mobile-nav mobile-only" aria-label="Mobile navigation header">
        <button
          class="hamburger-btn"
          type="button"
          aria-label="Open menu"
          :aria-expanded="isMenuOpen ? 'true' : 'false'"
          @click="toggleMenu"
        >
          <span class="hamburger-icon">☰</span>
          <span class="hamburger-label">메뉴</span>
        </button>

        <div class="mobile-title">
          <span class="mobile-title-text">{{ currentTitle }}</span>
        </div>
      </div>

      <!-- MOBILE DRAWER -->
      <div
        v-if="isMenuOpen"
        class="drawer-overlay mobile-only"
        role="presentation"
        @click.self="closeMenu"
      >
        <aside class="drawer" role="dialog" aria-modal="true" aria-label="Main menu">
          <div class="drawer-head">
            <div class="drawer-title">RCTS 메뉴</div>
            <button class="drawer-close" type="button" aria-label="Close menu" @click="closeMenu">
              ✕
            </button>
          </div>

          <div class="drawer-body">
            <!-- ✅ 최상단: 프리뷰 운행 -->
            <button class="drawer-item drawer-item-preview" type="button" @click="go('/home/preview')">
              프리뷰 운행
            </button>

            <button class="drawer-item" type="button" @click="go('/home/research')">연구</button>
            <button class="drawer-item" type="button" @click="go('/home/vehicles')">차량</button>
            <button class="drawer-item" type="button" @click="go('/home/line')">노선</button>
            <button class="drawer-item" type="button" @click="go('/home/construction')">건설</button>
            <button class="drawer-item" type="button" @click="go('/home/finance')">재정</button>
            <button class="drawer-item" type="button" @click="go('/home/city')">도시</button>
            <button class="drawer-item" type="button" @click="go('/home/settings')">설정</button>
          </div>

          <div class="drawer-foot">
            <div class="drawer-hint">
              모바일에서는 메뉴를 여기서 열어 이동합니다.
            </div>
          </div>
        </aside>
      </div>

      <!-- ROUTER VIEW AREA -->
      <div class="main-content-display">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const router = useRouter();
const route = useRoute();

const isMenuOpen = ref(false);

function closeMenu() {
  isMenuOpen.value = false;
}
function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value;
}

function go(path) {
  closeMenu();
  router.push(path);
}

/* 현재 페이지 타이틀(모바일 헤더용) */
const currentTitle = computed(() => {
  const p = route.path || '';
  if (p.includes('/home/preview')) return '프리뷰 운행';
  if (p.includes('/home/research')) return '연구';
  if (p.includes('/home/vehicles')) return '차량';
  if (p.includes('/home/line')) return '노선';
  if (p.includes('/home/construction')) return '건설';
  if (p.includes('/home/finance')) return '재정';
  if (p.includes('/home/city')) return '도시';
  if (p.includes('/home/settings')) return '설정';
  return '메인';
});

/* 라우트 바뀌면 메뉴 자동 닫기(실수 방지) */
watch(
  () => route.fullPath,
  () => {
    closeMenu();
  }
);

/* ESC로 닫기 + 메뉴 열렸을 때 배경 스크롤 잠금 */
function onKeyDown(e) {
  if (e.key === 'Escape') closeMenu();
}

watch(isMenuOpen, (open) => {
  document.body.style.overflow = open ? 'hidden' : '';
});

onMounted(() => {
  window.addEventListener('keydown', onKeyDown);
});
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown);
  document.body.style.overflow = '';
});
</script>

<style scoped>
/* =========================================================
   CENTER AREA
   ========================================================= */

.center-content-wrapper{
  display:flex;
  flex-direction:column;
  width:100%;
  height:100%;
  min-height:0;
  padding:0;
}

/* --- Desktop tabs (existing style, kept) --- */
.main-content-nav{
  flex-shrink:0;
  height:52px;
  display:flex;
  align-items:center;
  justify-content:center;
  padding:0 10px;

  background: rgba(255,255,255,0.03);
  border-bottom: 1px solid var(--border-color);
  box-shadow: 0 2px 5px rgba(0,0,0,0.18);
}

.nav-list{
  display:flex;
  align-items:stretch;
  height:100%;
  list-style:none;
  margin:0;
  padding:0;
  white-space:nowrap;
}

.nav-item{
  height:100%;
  display:flex;
  align-items:stretch;
}

.nav-item a{
  display:inline-flex;
  align-items:center;
  justify-content:center;

  height:100%;
  padding:0 16px;
  min-width:78px;

  color: var(--text-color);
  font-size: 1.02em;
  font-weight: 900;
  text-decoration:none;
  white-space:nowrap;

  transition: background 0.18s ease, color 0.18s ease;
}

.nav-item a:hover{
  background: rgba(255,255,255,0.05);
  color: var(--highlight-color);
}

.nav-item a.router-link-active{
  background: var(--accent-color);
  color: white;
  border-bottom: 3px solid var(--highlight-color);
}

/* --- Router view container --- */
.main-content-display{
  flex:1;
  min-height:0;
  display:flex;
  flex-direction:column;
  align-items:stretch;
  overflow:hidden;
}

/* =========================================================
   MOBILE NAV (Hamburger)
   ========================================================= */

.mobile-nav{
  flex-shrink:0;
  height:46px;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:10px;

  padding:0 10px;
  border-bottom: 1px solid var(--border-color);
  background: rgba(0,0,0,0.18);
}

.hamburger-btn{
  display:inline-flex;
  align-items:center;
  gap:8px;

  border:1px solid rgba(255,255,255,0.14);
  background: rgba(255,255,255,0.06);
  color:inherit;

  padding:8px 10px;
  border-radius:10px;
  cursor:pointer;

  font-size:12px;
  font-weight:900;
}

.hamburger-icon{
  font-size:16px;
  line-height:1;
}

.mobile-title{
  flex:1;
  display:flex;
  justify-content:flex-end;
}
.mobile-title-text{
  font-size:13px;
  font-weight:900;
  opacity:0.9;
  padding:6px 8px;
  border-radius:10px;
  border:1px solid rgba(255,255,255,0.10);
  background: rgba(255,255,255,0.03);
}

/* drawer overlay */
.drawer-overlay{
  position: fixed;
  inset: 0;
  z-index: 999;
  background: rgba(0,0,0,0.55);
  display:flex;
  justify-content:flex-start;
}

/* drawer panel */
.drawer{
  width: min(320px, 86vw);
  height: 100%;
  background: rgba(10,10,10,0.96);
  border-right: 1px solid rgba(255,255,255,0.10);
  box-shadow: 6px 0 18px rgba(0,0,0,0.35);

  display:flex;
  flex-direction:column;
}

.drawer-head{
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding:14px 14px;
  border-bottom: 1px solid rgba(255,255,255,0.10);
}

.drawer-title{
  font-weight:900;
  letter-spacing:0.04em;
}

.drawer-close{
  border:1px solid rgba(255,255,255,0.14);
  background: rgba(255,255,255,0.06);
  color:inherit;
  border-radius:10px;
  padding:6px 10px;
  cursor:pointer;
  font-weight:900;
}

.drawer-body{
  padding:10px;
  display:flex;
  flex-direction:column;
  gap:8px;
}

.drawer-item{
  width:100%;
  text-align:left;

  border:1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.04);
  color:inherit;

  padding:10px 12px;
  border-radius:12px;
  cursor:pointer;

  font-weight:900;
}

.drawer-item:active{
  transform: translateY(1px);
}

/* ✅ 프리뷰 운행 강조(원치 않으면 지워도 됨) */
.drawer-item-preview{
  border-color: rgba(120,255,120,0.22);
  background: rgba(120,255,120,0.10);
}

.drawer-foot{
  margin-top:auto;
  padding:12px 14px;
  border-top: 1px solid rgba(255,255,255,0.10);
}
.drawer-hint{
  font-size:12px;
  opacity:0.75;
  line-height:1.35;
}

/* =========================================================
   Visibility helpers
   ========================================================= */
.mobile-only{ display:none; }
.desktop-only{ display:flex; }

@media (max-width: 768px){
  .desktop-only{ display:none; }
  .mobile-only{ display:flex; }
}
</style>
