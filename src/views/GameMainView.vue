<!-- src/views/GameMainView.vue -->
<template>
  <div class="game-main-page">
    <!-- 상단 타이틀 영역 -->
    <header class="hero">
      <div class="hero-text">
        <h1 class="game-title">Real City Transport</h1>
        <p class="game-subtitle">
          나만의 도시 교통망을 설계하고 운영하는 인생 게임.
        </p>
      </div>

      <div class="hero-meta">
        <span class="badge">EARLY BUILD</span>
        <span class="version-text">버전: 0.0.1 (임시)</span>
      </div>
    </header>

    <!-- 메인 메뉴 버튼 영역 -->
    <main class="menu">
      <button class="menu-button primary" @click="startGame">
        새 게임 시작
      </button>

      <button class="menu-button">
        이어 하기
      </button>

      <button class="menu-button">
        시나리오 선택
      </button>

      <button class="menu-button subtle">
        옵션 / 설정
      </button>
    </main>

    <!-- 하단 정보 영역 -->
    <footer class="footer">
      <p class="footer-line">
        저장/불러오기, 옵션 등은 나중에 실제 시스템과 연결할 예정이야.
      </p>
      <p class="footer-line secondary">
        © {{ currentYear }} Real City Transport · 개인 프로젝트
      </p>
    </footer>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()
const currentYear = new Date().getFullYear()

const startGame = () => {
  router.push({ name: 'game-play' })
}
</script>

<style scoped>
.game-main-page {
  min-height: 100vh;
  min-height: 100dvh;
  padding: 16px 14px 24px;
  box-sizing: border-box;

  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 16px;

  background: radial-gradient(circle at top, rgba(79, 140, 255, 0.25), transparent 60%),
              radial-gradient(circle at bottom, rgba(15, 180, 120, 0.2), transparent 55%),
              #050711;
}

/* 상단 히어로 영역 */
.hero {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.hero-text {
  max-width: 520px;
}

.game-title {
  margin: 0 0 4px;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.game-subtitle {
  margin: 0;
  font-size: 13px;
  opacity: 0.8;
  line-height: 1.5;
}

.hero-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  font-size: 11px;
}

.badge {
  padding: 3px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 500;
  opacity: 0.9;
}

.version-text {
  opacity: 0.8;
}

/* 메뉴 버튼 영역 */
.menu {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 8px;
}

/* 기본 메뉴 버튼 스타일 */
.menu-button {
  width: 100%;
  padding: 12px 14px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(0, 0, 0, 0.35);
  color: inherit;
  font-size: 14px;
  text-align: center;

  display: flex;
  align-items: center;
  justify-content: center;

  cursor: pointer;
  opacity: 0.9;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    transform 0.06s ease,
    opacity 0.15s ease;
}

.menu-button.primary {
  background: rgba(79, 140, 255, 0.22);
  border-color: rgba(79, 140, 255, 0.55);
  font-weight: 600;
}

.menu-button.subtle {
  opacity: 0.75;
  font-size: 13px;
}

.menu-button:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.06);
}

.menu-button.primary:hover {
  background: rgba(79, 140, 255, 0.32);
}

.menu-button:active {
  transform: scale(0.97);
}

/* 하단 푸터 */
.footer {
  margin-top: 12px;
  font-size: 11px;
  opacity: 0.8;
}

.footer-line {
  margin: 0 0 2px;
}

.footer-line.secondary {
  opacity: 0.65;
}

/* ───────── 데스크톱 이상 레이아웃 조정 ───────── */
@media (min-width: 768px) {
  .game-main-page {
    padding: 24px 40px 32px;
  }

  .hero {
    gap: 12px;
  }

  .game-title {
    font-size: 32px;
  }

  .game-subtitle {
    font-size: 14px;
  }

  .menu {
    max-width: 420px;
  }
}

@media (min-width: 1200px) {
  .game-main-page {
    padding: 32px 56px 40px;
  }

  .hero {
    max-width: 640px;
  }

  .menu {
    max-width: 380px;
  }
}
</style>
