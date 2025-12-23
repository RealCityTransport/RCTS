<!-- src/components/TopBar.vue -->
<template>
  <header class="top-bar-area">
    <div class="top-bar-content">
      <div class="left-area">
        <h1 class="game-title">RCTS</h1>
      </div>

      <div class="center-area">
        <span class="time-label">KST</span>
        <span class="time-value" :data-ready="isKstTimeReady">
          {{ isKstTimeReady ? kstString : 'SYNC…' }}
        </span>
      </div>

      <div class="right-area">
        <!-- ✅ 전환 버튼 없음: 표기 배지만 -->
        <span class="env-badge" :data-env="envKey">
          {{ envLabel }}
        </span>

        <button class="auth-btn" type="button" @click="onClickAuth">
          <span class="auth-text">{{ isLoggedIn ? '로그아웃' : '로그인' }}</span>
          <span class="auth-icon">{{ isLoggedIn ? '⎋' : '→' }}</span>
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useKstTime } from '@/composables/useKstTime'
import { useAuth } from '@/composables/useAuth'
import { useResearch } from '@/composables/useResearch'
import { useWorld } from '@/composables/useWorld'
import { useEnvLabel } from '@/composables/useEnvLabel'
import { db, REMOTE_ENABLED } from '@/plugins/firebase/config'

const { kstString, isKstTimeReady } = useKstTime()
const { user, signInWithGoogle, signOutUser, AUTH_ENABLED } = useAuth()
const { loadForUser, clearUserState, unsubscribe } = useResearch()

// 월드는 환경으로만 결정(로컬=dev 고정)
const { world } = useWorld()

// 우측 배지 표기(로컬=DEV 고정, 배포=채널 표기)
const { envKey, envLabel } = useEnvLabel()

const isLoggedIn = computed(() => !!user.value?.uid)

// ✅ 원격 저장/로드는 "배포 + REMOTE_ENABLED + db"일 때만
const REMOTE_OK = computed(() => import.meta.env.PROD && !!REMOTE_ENABLED && !!db)

async function onClickAuth() {
  if (!AUTH_ENABLED) {
    alert('현재 환경에서 로그인 기능이 비활성화되어 있습니다.')
    return
  }

  // 로그아웃
  if (isLoggedIn.value) {
    try {
      await signOutUser()
    } finally {
      // 구독/로컬 상태 정리 (REMOTE OFF여도 안전)
      try { unsubscribe() } catch {}
      try { clearUserState() } catch {}
    }
    return
  }

  // 로그인
  try {
    const u = await signInWithGoogle()

    // ✅ DEV에서는 계정 자료 로드 시도 자체를 하지 않음
    if (REMOTE_OK.value && u?.uid) {
      await loadForUser(u.uid, world.value)
    }
  } catch (e) {
    console.error('[auth] login failed', e)
    alert(`로그인 실패: ${e?.code || e?.message || e}`)
  }
}
</script>

<style scoped>
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
.left-area { display: flex; align-items: center; }
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
.time-label { font-size: 0.7em; opacity: 0.7; }
.time-value { color: var(--positive-color); }
.time-value[data-ready="false"] { opacity: 0.8; }

.right-area { display: flex; align-items: center; gap: 10px; }

/* ✅ 채널 배지(표기만) */
.env-badge{
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.6px;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid var(--border-color);
  color: var(--text-color);
  background: rgba(255,255,255,0.04);
  user-select: none;
}

/* 로컬은 DEV 고정 */
.env-badge[data-env="dev"] { color: var(--positive-color); }

/* 배포 채널 색상(원하면 빼도 됨) */
.env-badge[data-env="test"] { color: rgba(130,200,255,1); }
.env-badge[data-env="preview"] { color: rgba(255,210,130,1); }
.env-badge[data-env="prod"] { color: rgba(255,255,255,0.92); }

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
.auth-icon { display: none; }

@media (max-width: 768px) {
  .top-bar-content { height: 44px; padding: 0 12px; }
  .game-title { font-size: 1.1em; letter-spacing: 1px; }
  .center-area { display: none; }
  .right-area { gap: 8px; }
  .env-badge { padding: 5px 8px; font-size: 11px; }
  .auth-btn { padding: 6px 10px; font-size: 0.85em; }
  .auth-text { display: none; }
  .auth-icon { display: inline; font-size: 1.1em; }
}
</style>
