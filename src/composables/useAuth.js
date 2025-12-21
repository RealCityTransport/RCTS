// src/composables/useAuth.js
import { ref } from 'vue';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/plugins/firebase/config';

// 전역 반응형 상태 (useAuth를 여러 번 호출해도 동일 인스턴스 공유)
const user = ref(null);
const authError = ref(null);
const authReady = ref(false);

let isAuthListenerInitialized = false;

// Firebase 인증 상태 리스너: 앱 생애주기 동안 1회만
if (!isAuthListenerInitialized) {
  onAuthStateChanged(auth, (currentUser) => {
    user.value = currentUser;
    authReady.value = true;

    if (currentUser) {
      console.log('글로벌 인증 상태 업데이트: 로그인 됨', currentUser.displayName || currentUser.email);
    } else {
      console.log('글로벌 인증 상태 업데이트: 로그아웃 됨');
    }
  });

  isAuthListenerInitialized = true;
}

export function useAuth() {
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      authError.value = null;
      console.log('useAuth: 로그인 성공!', result.user.displayName || result.user.email);
      // 라우팅은 composable 책임에서 제외 (setup 외 호출 경고/의존성 회피)
      return result.user;
    } catch (err) {
      authError.value = err;
      console.error('useAuth: 로그인 실패:', err);
      throw err;
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
      authError.value = null;
      console.log('useAuth: 로그아웃 성공!');
      return true;
    } catch (err) {
      authError.value = err;
      console.error('useAuth: 로그아웃 실패:', err);
      throw err;
    }
  };

  return {
    user,
    authError,
    authReady,
    signInWithGoogle,
    signOutUser,
  };
}