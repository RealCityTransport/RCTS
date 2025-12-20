<!-- src/components/TheTopBar.vue -->
<template>
  <header class="top-bar-area">
    <div class="top-bar-content">
      <div class="logo-area">
        <h1 class="game-title">RCTS</h1>
      </div>
      <div class="kst-time-display">
        <span class="time-label">KST</span>
        <span class="time-value">{{ kstString }}</span>
      </div>
      <div class="user-auth-area"> 
        <button class="login-btn" @click="user ? signOutUser() : signInWithGoogle()">
          {{ user ? '로그아웃' : '로그인' }}
        </button> 
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref } from 'vue';
import { useKstTime } from '@/composables/useKstTime';
import { useAuth } from '@/composables/useAuth';

const currentMoney = ref(1000000); 
const { kstString } = useKstTime();
const { user, authError, signInWithGoogle, signOutUser } = useAuth();
</script>

<style scoped lang="scss">
@use '@/styles/TheTopBar.scss';
</style>