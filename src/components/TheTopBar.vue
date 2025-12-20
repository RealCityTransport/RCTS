<template>
  <header class="top-bar-area">
    <div class="top-bar-content">
      <!-- 1. 로고/게임 이름 영역 -->
      <div class="logo-area">
        <h1 class="game-title">RCTS</h1>
        <!-- 실제 게임 개발 시 여기에 멋진 로고 이미지를 넣을 수 있습니다. -->
      </div>

      <!-- 2. KST 표준 시간 표시 영역 -->
      <div class="kst-time-display">
        <span class="time-label">KST</span>
        <span class="time-value">{{ kstString }}</span>
      </div>

      <!-- 3. 로그인 버튼 영역 (가장 끝에 위치) -->
      <div class="user-auth-area"> 
        <button class="login-btn" @click="user ? signOutUser() : signInWithGoogle()">
          {{ user ? '로그아웃' : '로그인' }} <!-- user 객체 존재 여부에 따라 텍스트 변경 -->
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { useKstTime } from '@/composables/useKstTime';
import { useAuth } from '@/composables/useAuth';

const { kstString } = useKstTime();

const { user, authError, signInWithGoogle, signOutUser } = useAuth();

</script>

<style scoped lang="scss">
@use '@/styles/TheTopBar.scss';
</style>