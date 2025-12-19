<!-- src/views/LoginPage.vue -->
<template>
  <div class="login-page">
    <h2>로그인</h2>
    <button @click="signInWithGoogle" class="google-login-btn">
      Google 계정으로 로그인
    </button>
    <p v-if="user">로그인된 사용자: {{ user.displayName || user.email }}</p>
    <p v-if="error" class="error-msg">오류: {{ error.message }}</p>
    <button v-if="user" @click="signOutUser" class="google-logout-btn">
      로그아웃
    </button>
  </div>
</template>

<script setup>
import { useAuth } from '@/composables/useAuth'; // ⭐⭐⭐ useAuth 임포트 ⭐⭐⭐
import { useRouter } from 'vue-router'; // 리다이렉션을 위해 useRouter 임포트 (아직은 컴포저블에서 처리)

const { user, authError, signInWithGoogle } = useAuth(); // ⭐⭐⭐ useAuth 사용 ⭐⭐⭐
const router = useRouter();

// ⭐⭐ onAuthStateChanged 로직은 useAuth 컴포저블로 이동.
// 여기서는 user의 변화를 감지하여 바로 Overview로 리다이렉트하는 역할만 수행.
if (user.value) {
  router.push({ name: 'Overview' });
}

// 혹시 로그인 페이지에 직접 접근했을 때 이미 로그인 상태라면 바로 리다이렉트 (추가 방어 로직)
// watch(user, (newUser) => {
//   if (newUser) {
//     router.push({ name: 'Overview' });
//   }
// });

</script>

<style lang="scss" scoped>
.login-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  padding: 2rem;
  background-color: #2a2a47;
  color: #e0e0e0;
  box-sizing: border-box;

  h2 {
    color: #88c0d0;
    margin-bottom: 2rem;
  }

  .google-login-btn, .google-logout-btn {
    background-color: #4285f4; /* Google Blue */
    color: white;
    border: none;
    border-radius: 4px;
    padding: 10px 20px;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.3s ease;
    margin-bottom: 1rem;

    &:hover {
      background-color: #357ae8;
    }
  }
  .google-logout-btn {
      background-color: #dc3545; /* Red for logout */
      &:hover {
          background-color: #c82333;
      }
  }

  p {
    margin-top: 1rem;
  }

  .error-msg {
    color: #ff6b6b;
  }
}
</style>