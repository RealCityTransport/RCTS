<!-- src/components/TheHeader.vue -->
<template>
  <header class="app-header">
    <!-- RCTS 로고, 유저 정보, 게임 시간, 메뉴 아이콘 등 -->
    <div class="logo">RCTS</div>
    <div class="user-info">Manager: [UserName]</div>
    <div class="game-time">{{ kstString }}</div>
    <nav class="header-nav">
      <button class="nav-button">⚙️ 설정</button>
      <button class="nav-button">❓ 도움말</button>
      <button class="nav-button">📜 기록</button>
      <button class="nav-button" @click="goToDataArchive">자료실</button>
    </nav>
  </header>
</template>

<script setup>
import { useKstTime } from '@/composables/useKstTime';
import { useRouter } from 'vue-router';

// KST 시간 표시 모듈
const { kstString } = useKstTime();

const router = useRouter();
const goToDataArchive = () => {
  router.push({ name: 'DataArchive' });
};
</script>

<style lang="scss" scoped>
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.8rem 1.5rem;
  background-color: #2c2c4d; /* 헤더 배경색 */
  color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  font-size: 0.9rem;

  .logo {
    font-weight: bold;
    font-size: 1.2rem;
    color: #4CAF50; /* 포인트 색상 */
  }

  .game-time {
    font-style: italic;
    opacity: 0.8;
  }

  .header-nav {
    display: flex;
    gap: 0.8rem;
  }

  .nav-button {
    background: none;
    border: none;
    color: #fff;
    cursor: pointer;
    font-size: 0.9rem;
    padding: 0.3rem 0.6rem;
    border-radius: 4px;
    transition: background-color 0.2s ease;

    &:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }
  }
}
</style>