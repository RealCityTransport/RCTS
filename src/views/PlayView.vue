<!-- src/components/play/PlayPage.vue -->
<template>
  <div class="play-page-root">
    <section class="play-shell">
      <!-- 상단 헤더 -->
      <header class="play-header">
        <div class="play-header-left">
          <p class="play-badge">PLAY · HUB</p>
          <h2 class="play-title">RCTS 플레이 허브</h2>
        </div>

        <!-- 모바일용 햄버거 메뉴 버튼 (로그인 이후에만 표시) -->
        <button
          v-if="isAuthReady && isLoggedIn"
          type="button"
          class="play-mobile-menu-toggle"
          :class="{ 'is-open': isMobileMenuOpen }"
          @click="toggleMobileMenu"
        >
          <span class="hamburger-line" :class="{ 'is-open': isMobileMenuOpen }"></span>
          <span class="hamburger-line" :class="{ 'is-open': isMobileMenuOpen }"></span>
          <span class="hamburger-line" :class="{ 'is-open': isMobileMenuOpen }"></span>
        </button>
      </header>

      <!-- 모바일 메뉴 배경 오버레이 -->
      <transition name="mobile-backdrop">
        <div
          v-if="isMobileMenuOpen"
          class="play-mobile-backdrop"
          @click="toggleMobileMenu"
        />
      </transition>

      <!-- 본문 -->
      <main class="play-body">
        <!-- 1단계: 아직 인증 상태 로딩 중 -->
        <section v-if="!isAuthReady" class="play-gate">
          <div class="gate-card">
            <h3 class="gate-title">계정 상태를 확인하는 중입니다</h3>
            <p class="gate-desc">
              이전에 로그인한 기록이 있는지 확인하고 있습니다.
              잠시만 기다리면 자동으로 플레이 허브 또는 로그인 안내 화면으로 전환됩니다.
            </p>
          </div>
        </section>

        <!-- 2단계: 인증 완료 + 로그아웃 상태 → 로그인 게이트 -->
        <section v-else-if="!isLoggedIn" class="play-gate">
          <div class="gate-card">
            <h3 class="gate-title">로그인이 필요합니다</h3>
            <p class="gate-desc">
              RCTS 플레이 허브는 로그인된 계정을 기준으로
              회사 정보와 노선·차량·운영 데이터를 관리합니다.
              Google 계정으로 로그인하면, 나중에 다시 접속했을 때도
              같은 계정으로 이어서 플레이할 수 있습니다.
            </p>

            <ul class="gate-list">
              <li>하나의 계정으로 여러 도시와 회사를 관리할 수 있습니다.</li>
              <li>노선과 차량 설정, 운영 상태가 계정 기준으로 저장됩니다.</li>
              <li>향후 통계와 멀티 디바이스 기능도 이 계정을 기준으로 동작합니다.</li>
            </ul>

            <div class="gate-actions">
              <button
                type="button"
                class="gate-button gate-button-primary"
                :disabled="isAuthLoading"
                @click="handleSignIn"
              >
                <span v-if="!isAuthLoading">Google 계정으로 로그인</span>
                <span v-else>로그인 진행 중…</span>
              </button>
              <p class="gate-note">
                로그인 창이 뜨지 않으면 브라우저 팝업 차단 설정을 확인해 주세요.
              </p>
            </div>
          </div>
        </section>

        <!-- 3단계: 인증 완료 + 로그인 상태 → 사이드 메뉴 + 메인 컨텐츠 -->
        <section v-else class="play-layout">
          <!-- LEFT: 데스크톱용 사이드 메뉴 -->
          <nav class="play-sidebar" aria-label="플레이 메뉴">
            <div class="sidebar-header">
              <span class="sidebar-label">플레이 메뉴</span>
            </div>

            <button
              v-for="item in menuItems"
              :key="item.key"
              type="button"
              class="sidebar-item"
              :class="{ 'is-active': activeMenu === item.key }"
              @click="handleSelectMenu(item.key)"
            >
              <span class="sidebar-item-main">
                <span class="sidebar-dot" />
                <span class="sidebar-text">{{ item.label }}</span>
              </span>
              <span
                v-if="item.badge"
                class="sidebar-badge"
              >
                {{ item.badge }}
              </span>
            </button>
          </nav>

          <!-- 모바일용 햄버거 메뉴 패널 -->
          <transition name="mobile-menu">
            <nav
              v-if="isMobileMenuOpen"
              class="play-mobile-menu"
              aria-label="플레이 메뉴 (모바일)"
            >
              <div class="mobile-menu-header">
                <span class="mobile-menu-title">플레이 메뉴</span>
              </div>
              <button
                v-for="item in menuItems"
                :key="item.key"
                type="button"
                class="mobile-menu-item"
                :class="{ 'is-active': activeMenu === item.key }"
                @click="handleSelectMenu(item.key)"
              >
                <span class="mobile-menu-item-main">
                  <span class="mobile-menu-dot" />
                  <span class="mobile-menu-text">{{ item.label }}</span>
                </span>
                <span
                  v-if="item.badge"
                  class="mobile-menu-badge"
                >
                  {{ item.badge }}
                </span>
              </button>
            </nav>
          </transition>

          <!-- RIGHT: 메인 영역 -->
          <section class="play-main">
            <div class="play-main-inner">
              <!-- 메뉴: 회사 -->
              <CompanyPage v-if="activeMenu === 'company'" />

              <!-- 메뉴: 운영 -->
              <OperationsPage
                v-else-if="activeMenu === 'operations'"
              />

              <!-- 메뉴: 노선 -->
              <RoutesPage
                v-else-if="activeMenu === 'routes'"
              />

              <!-- 메뉴: 차량 -->
              <VehiclesPage
                v-else-if="activeMenu === 'vehicles'"
              />

              <!-- 메뉴: 설정 -->
              <div
                v-else-if="activeMenu === 'settings'"
                class="section-panel"
              >
                <h3 class="section-title">플레이 설정</h3>
                <p class="section-desc">
                  플레이 환경과 표시 방식, 계정·회사 연동과 관련된 설정을 모아두는 화면입니다.
                  자주 변경되지는 않지만, 한 번 설정해 두면
                  이후 플레이 전체에 영향을 주는 항목들이 여기에 모이게 됩니다.
                </p>

                <div class="section-grid">
                  <div class="section-card">
                    <h4 class="section-card-title">환경 설정</h4>
                    <p class="section-card-text">
                      게임 속도, 자동 저장 주기, 기본 표시 단위 등
                      전반적인 플레이 환경을 조정하는 옵션이 들어올 예정입니다.
                    </p>
                  </div>
                  <div class="section-card">
                    <h4 class="section-card-title">표시 옵션</h4>
                    <p class="section-card-text">
                      UI 밀도, 효과 표시 여부, 색상 계열 등
                      화면을 어떻게 보여줄지에 대한 옵션을 묶어서 관리하는 영역입니다.
                    </p>
                  </div>
                  <div class="section-card">
                    <h4 class="section-card-title">계정 &amp; 연동</h4>
                    <p class="section-card-text">
                      로그인 계정, 회사 프로필 연동, 향후 외부 서비스와의 연동 옵션 등을
                      한곳에서 관리할 수 있도록 확장할 계획입니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </section>
      </main>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import CompanyPage from '@/components/company/CompanyPage.vue'
import OperationsPage from '@/components/operations/OperationsPage.vue'
import RoutesPage from '@/components/routes/RoutesPage.vue'
import VehiclesPage from '@/components/vehicles/VehiclesPage.vue'
import { useFirebaseAuth } from '@/composables/useFirebaseAuth'

type MenuKey = 'company' | 'operations' | 'routes' | 'vehicles' | 'settings'

const { isLoggedIn, isAuthLoading, isAuthReady, signInWithGoogle } = useFirebaseAuth()

const menuItems: { key: MenuKey; label: string; badge?: string }[] = [
  { key: 'company', label: '회사' },
  { key: 'operations', label: '운영' },
  { key: 'routes', label: '노선' },
  { key: 'vehicles', label: '차량' },
  { key: 'settings', label: '설정' },
]

const activeMenu = ref<MenuKey>('company')
const isMobileMenuOpen = ref(false)

const handleSignIn = async () => {
  try {
    await signInWithGoogle()
  } catch (error) {
    console.error('로그인 중 오류가 발생했습니다:', error)
  }
}

const handleSelectMenu = (key: MenuKey) => {
  activeMenu.value = key
  // 모바일에서는 메뉴 선택 시 햄버거 패널 닫기
  isMobileMenuOpen.value = false
}

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}
</script>

<style scoped>
.play-page-root {
  width: 100%;
  min-height: 100vh;
  box-sizing: border-box;
  padding: 12px 8px 16px;
  display: flex;
  justify-content: center;
}

.play-shell {
  width: 100%;
  max-width: 1800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: calc(100vh - 28px);
  position: relative; /* 모바일 메뉴 오버레이 기준 */
}

/* 헤더 */

.play-header {
  padding: 10px 14px;
  border-radius: 14px;
  background: radial-gradient(
      circle at top left,
      rgba(37, 99, 235, 0.28),
      rgba(15, 23, 42, 0.96)
    );
  border: 1px solid rgba(148, 163, 184, 0.8);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.play-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.play-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 999px;
  border: 1px solid rgba(129, 140, 248, 0.9);
  background: rgba(15, 23, 42, 0.96);
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.play-title {
  font-size: 1.02rem;
  font-weight: 700;
}

/* 모바일 햄버거 버튼 */

.play-mobile-menu-toggle {
  display: none; /* 기본은 숨김, 모바일에서만 표시 */
  width: 40px;
  height: 30px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.9);
  background: radial-gradient(
    circle at center,
    rgba(51, 65, 85, 0.9),
    rgba(15, 23, 42, 1)
  );
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: 0 8px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.9);
  transition:
    transform 0.12s ease-out,
    box-shadow 0.12s ease-out,
    border-color 0.12s ease-out,
    background 0.12s ease-out;
}

.play-mobile-menu-toggle.is-open {
  transform: scale(1.05);
  border-color: rgba(129, 140, 248, 1);
  box-shadow: 0 0 18px rgba(96, 165, 250, 0.9);
  background: radial-gradient(
    circle at center,
    rgba(59, 130, 246, 0.25),
    rgba(15, 23, 42, 1)
  );
}

.hamburger-line {
  width: 18px;
  height: 2px;
  border-radius: 999px;
  background: rgba(226, 232, 240, 0.95);
  transform-origin: center;
  transition:
    transform 0.16s cubic-bezier(0.33, 1, 0.68, 1),
    opacity 0.12s ease-out,
    width 0.16s ease-out,
    box-shadow 0.16s ease-out,
    background 0.16s ease-out;
  box-shadow: 0 0 6px rgba(148, 163, 184, 0.8);
}

.hamburger-line:nth-child(1) {
  transform-origin: left center;
}

.hamburger-line:nth-child(3) {
  transform-origin: right center;
}

.hamburger-line.is-open {
  background: #e5e7eb;
  box-shadow: 0 0 10px rgba(248, 250, 252, 1);
}

.hamburger-line.is-open:nth-child(1) {
  transform: translateY(4px) rotate(42deg);
}

.hamburger-line.is-open:nth-child(2) {
  opacity: 0;
  width: 0;
}

.hamburger-line.is-open:nth-child(3) {
  transform: translateY(-4px) rotate(-42deg);
}

/* 모바일 메뉴 배경 오버레이 */

.play-mobile-backdrop {
  position: absolute;
  inset: 0;
  border-radius: 18px;
  background: radial-gradient(
      circle at top,
      rgba(15, 23, 42, 0.6),
      rgba(15, 23, 42, 0.95)
    );
  backdrop-filter: blur(2px);
  z-index: 15;
}

/* 오버레이 트랜지션 */

.mobile-backdrop-enter-active,
.mobile-backdrop-leave-active {
  transition: opacity 0.16s ease-out;
}

.mobile-backdrop-enter-from,
.mobile-backdrop-leave-to {
  opacity: 0;
}

.mobile-backdrop-enter-to,
.mobile-backdrop-leave-from {
  opacity: 1;
}

/* 본문 레이아웃 공통 */

.play-body {
  flex: 1;
  min-height: 0;
  display: flex;
}

/* 로그인 게이트 / 로딩 공통 */

.play-gate {
  flex: 1 1 auto;
  min-height: 0;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(148, 163, 184, 0.7);
  padding: 18px 18px;
  box-sizing: border-box;

  display: flex;
  align-items: center;
  justify-content: center;
}

.gate-card {
  max-width: 520px;
  width: 100%;
  padding: 18px 20px;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.9);
  background: radial-gradient(
    circle at top left,
    rgba(59, 130, 246, 0.18),
    rgba(15, 23, 42, 0.98)
  );
  box-shadow: 0 14px 40px rgba(15, 23, 42, 0.9);
}

.gate-title {
  font-size: 0.98rem;
  font-weight: 700;
  margin-bottom: 8px;
}

.gate-desc {
  font-size: 0.8rem;
  opacity: 0.92;
  line-height: 1.6;
  margin-bottom: 10px;
}

.gate-list {
  margin: 0 0 12px;
  padding-left: 18px;
  font-size: 0.78rem;
  line-height: 1.6;
  opacity: 0.9;
}

.gate-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 4px;
}

.gate-button {
  border-radius: 999px;
  padding: 8px 14px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.gate-button-primary {
  background: linear-gradient(
    135deg,
    rgba(59, 130, 246, 1),
    rgba(79, 70, 229, 1)
  );
  color: #f9fafb;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.9);
  transition:
    transform 0.08s ease-out,
    box-shadow 0.12s ease-out,
    filter 0.12s ease-out;
}

.gate-button-primary:hover {
  filter: brightness(1.02);
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.95);
}

.gate-button-primary:active {
  transform: translateY(1px);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.95);
}

.gate-note {
  font-size: 0.72rem;
  opacity: 0.8;
}

/* 3단계 레이아웃: 사이드바 + 메인 */

.play-layout {
  flex: 1;
  min-height: 0;
  display: flex;
  gap: 10px;
}

/* LEFT: 데스크톱용 사이드바 */

.play-sidebar {
  flex: 0 0 210px;
  border-radius: 14px;
  background: radial-gradient(
      circle at top left,
      rgba(56, 189, 248, 0.18),
      rgba(15, 23, 42, 0.98)
    );
  border: 1px solid rgba(148, 163, 184, 0.85);
  padding: 10px 8px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sidebar-header {
  padding: 2px 10px 6px;
}

.sidebar-label {
  font-size: 0.76rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  opacity: 0.85;
}

.sidebar-item {
  width: 100%;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.75);
  background: radial-gradient(
    circle at left,
    rgba(37, 99, 235, 0.4),
    rgba(15, 23, 42, 0.96)
  );
  padding: 7px 10px;
  margin-bottom: 2px;

  font-size: 0.8rem;
  color: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  cursor: pointer;

  transition:
    background 0.16s ease-out,
    border-color 0.16s ease-out,
    box-shadow 0.16s ease-out,
    transform 0.08s ease-out;
}

.sidebar-item-main {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.sidebar-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 1);
  box-shadow: 0 0 8px rgba(191, 219, 254, 0.8);
}

.sidebar-text {
  white-space: nowrap;
}

.sidebar-badge {
  font-size: 0.72rem;
  padding: 1px 6px;
  border-radius: 999px;
  border: 1px solid rgba(191, 219, 254, 0.9);
  background: rgba(15, 23, 42, 0.88);
}

.sidebar-item:hover {
  border-color: rgba(191, 219, 254, 1);
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.9);
  transform: translateY(-1px);
}

.sidebar-item.is-active {
  border-color: rgba(129, 140, 248, 1);
  background: linear-gradient(
    135deg,
    rgba(79, 70, 229, 0.98),
    rgba(30, 64, 175, 0.95)
  );
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.95);
}

.sidebar-item.is-active .sidebar-dot {
  background: #fbbf24;
  box-shadow: 0 0 10px rgba(251, 191, 36, 1);
}

/* 모바일용 햄버거 메뉴 패널 */

.play-mobile-menu {
  position: absolute;
  top: 64px;
  left: 8px;
  right: 8px;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.98);
  border: 1px solid rgba(148, 163, 184, 0.85);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.95);
  padding: 8px 8px 10px;
  box-sizing: border-box;
  display: none; /* 기본은 숨김, 모바일에서만 사용 */
  z-index: 20;
}

.mobile-menu-header {
  padding: 2px 6px 6px;
}

.mobile-menu-title {
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  opacity: 0.9;
}

.mobile-menu-item {
  width: 100%;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.75);
  background: radial-gradient(
    circle at left,
    rgba(37, 99, 235, 0.4),
    rgba(15, 23, 42, 0.96)
  );
  padding: 7px 10px;
  margin-bottom: 4px;

  font-size: 0.8rem;
  color: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  cursor: pointer;

  transition:
    background 0.16s ease-out,
    border-color 0.16s ease-out,
    box-shadow 0.16s ease-out,
    transform 0.08s ease-out;
}

.mobile-menu-item-main {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.mobile-menu-dot {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 1);
  box-shadow: 0 0 7px rgba(191, 219, 254, 0.8);
}

.mobile-menu-text {
  white-space: nowrap;
}

.mobile-menu-badge {
  font-size: 0.72rem;
  padding: 1px 6px;
  border-radius: 999px;
  border: 1px solid rgba(191, 219, 254, 0.9);
  background: rgba(15, 23, 42, 0.88);
}

.mobile-menu-item.is-active {
  border-color: rgba(129, 140, 248, 1);
  background: linear-gradient(
    135deg,
    rgba(79, 70, 229, 0.98),
    rgba(30, 64, 175, 0.95)
  );
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.95);
}

.mobile-menu-item.is-active .mobile-menu-dot {
  background: #fbbf24;
  box-shadow: 0 0 10px rgba(251, 191, 36, 1);
}

/* 모바일 메뉴 트랜지션 (게임틱하게 살짝 튀어나오는 느낌) */

.mobile-menu-enter-active,
.mobile-menu-leave-active {
  transition:
    opacity 0.16s ease-out,
    transform 0.16s ease-out;
  transform-origin: top center;
}

.mobile-menu-enter-from,
.mobile-menu-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.96);
}

.mobile-menu-enter-to,
.mobile-menu-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}

/* RIGHT: 메인 영역 */

.play-main {
  flex: 1 1 auto;
  min-height: 0;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.7);
  padding: 10px 12px;
  box-sizing: border-box;
  display: flex;
}

.play-main-inner {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: auto;
}

/* 공통 섹션 (설정 등) */

.section-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section-title {
  font-size: 0.95rem;
  font-weight: 700;
}

.section-desc {
  font-size: 0.8rem;
  opacity: 0.9;
  line-height: 1.6;
}

.section-grid {
  margin-top: 2px;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 8px;
}

.section-card {
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.6);
  background: rgba(15, 23, 42, 0.96);
  padding: 8px 10px;
  font-size: 0.78rem;
}

.section-card-title {
  font-size: 0.82rem;
  font-weight: 600;
  margin-bottom: 4px;
}

.section-card-text {
  font-size: 0.78rem;
  opacity: 0.88;
  line-height: 1.5;
}

/* 반응형: PC / 태블릿 */

@media (min-width: 860px) {
  .play-body {
    padding-left: 2px;
    padding-right: 2px;
  }

  .section-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

/* 반응형: 모바일 */

@media (max-width: 859px) {
  .play-page-root {
    padding: 8px 6px 10px;
  }

  .play-shell {
    gap: 10px;
  }

  .play-header {
    padding: 8px 10px;
  }

  .play-title {
    font-size: 0.96rem;
  }

  /* 모바일에서 햄버거 버튼 표시 */
  .play-mobile-menu-toggle {
    display: inline-flex;
  }

  /* 모바일에서는 좌측 사이드바 숨김 */
  .play-sidebar {
    display: none;
  }

  /* 모바일에서만 햄버거 메뉴 패널 표시 가능 */
  .play-mobile-menu {
    display: block;
  }

  .play-layout {
    flex-direction: column;
  }

  .play-main {
    padding: 8px 8px;
  }

  .play-gate {
    padding: 14px 10px;
  }

  .gate-card {
    padding: 14px 14px;
  }

  .gate-title {
    font-size: 0.9rem;
  }

  .gate-desc {
    font-size: 0.78rem;
  }

  .gate-list {
    font-size: 0.76rem;
  }

  .gate-button {
    font-size: 0.8rem;
    padding: 7px 12px;
  }

  .gate-note {
    font-size: 0.7rem;
  }
}
</style>
