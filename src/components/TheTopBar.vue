<template>
  <header class="top-bar-area">
    <div class="top-bar-content">
      <!-- Left / Title -->
      <div class="left-area">
        <h1 class="game-title">RCTS</h1>
      </div>

      <!-- Center / Time (Desktop only) -->
      <div class="center-area">
        <span class="time-label">KST</span>
        <span class="time-value">{{ kstString }}</span>
      </div>

      <!-- Right / Auth -->
      <div class="right-area">
        <button class="auth-btn" @click="user ? signOutUser() : signInWithGoogle()">
          <span class="auth-text">{{ user ? '로그아웃' : '로그인' }}</span>
          <span class="auth-icon">{{ user ? '⎋' : '→' }}</span>
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { useKstTime } from '@/composables/useKstTime';
import { useAuth } from '@/composables/useAuth';

const { kstString } = useKstTime();
const { user, signInWithGoogle, signOutUser } = useAuth();
</script>

<style scoped>
/* =======================================
   TOP BAR – Desktop HUD / Mobile App Header
   ======================================= */

.top-bar-area {
  width: 100%;
  flex-shrink: 0;
  background: var(--area-bg-color-center);
  border-bottom: 1px solid var(--border-color);
}

.top-bar-content {
  height: 56px;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* ---------------------------------------
   Desktop
---------------------------------------- */
.left-area {
  display: flex;
  align-items: center;
}
.game-title {
  margin: 0;
  font-size: 1.9em;
  font-weight: 800;
  color: var(--highlight-color);
  letter-spacing: 2px;
  white-space: nowrap;
}

.center-area {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 1.2em;
  font-weight: bold;
  color: var(--text-color);
}
.time-label {
  font-size: 0.7em;
  opacity: 0.7;
}
.time-value {
  color: var(--positive-color);
}

.right-area {
  display: flex;
  align-items: center;
}

.auth-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  background: var(--accent-color);
  color: var(--text-color);
  font-weight: 700;
  font-size: 0.95em;
}
.auth-icon {
  display: none;
}

/* ---------------------------------------
   Mobile – App Header Mode
---------------------------------------- */
@media (max-width: 768px) {
  .top-bar-content {
    height: 44px;
    padding: 0 12px;
  }

  /* 모바일: 타이틀 최소화 */
  .game-title {
    font-size: 1.1em;
    letter-spacing: 1px;
  }

  /* 모바일: 시간 숨김 */
  .center-area {
    display: none;
  }

  /* 모바일: 버튼 단순화 */
  .auth-btn {
    padding: 6px 10px;
    font-size: 0.85em;
  }
  .auth-text {
    display: none;
  }
  .auth-icon {
    display: inline;
    font-size: 1.1em;
  }
}
</style>
