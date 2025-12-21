// src/composables/useAuth.js
import { ref } from 'vue';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/plugins/firebase/config';
import { useResearch } from '@/composables/useResearch';

// 전역 반응형 상태 (useAuth를 여러 번 호출해도 동일 인스턴스 공유)
const user = ref(null);
const authError = ref(null);
const authReady = ref(false);

let isAuthListenerInitialized = false;

// Firebase 인증 상태 리스너: 앱 생애주기 동안 1회만
if (!isAuthListenerInitialized) {
  const research = useResearch();

  onAuthStateChanged(auth, async (currentUser) => {
    user.value = currentUser || null;
    authReady.value = true;

    try {
      if (currentUser?.uid) {
        console.log('글로벌 인증 상태 업데이트: 로그인 됨', currentUser.displayName || currentUser.email);

        // ✅ 로그인 시 연구 상태 로드(계정 연동 핵심)
        await research.loadForUser(currentUser.uid);
      } else {
        console.log('글로벌 인증 상태 업데이트: 로그아웃 됨');

        // ✅ 로그아웃/게스트 전환 시 연구 상태 정리
        research.clearUserState();
      }
    } catch (e) {
      console.error('useAuth: research sync failed:', e);
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
      // research.loadForUser는 onAuthStateChanged에서 처리 (중복 호출 방지)
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
      // research.clearUserState는 onAuthStateChanged에서 처리
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
