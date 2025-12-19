// src/composables/useAuth.js
import { ref } from 'vue';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { auth } from '@/plugins/firebase/config'; // Firebase auth 인스턴스 임포트
import { useRouter } from 'vue-router'; // 리다이렉션을 위해 useRouter 임포트

// 전역 반응형 상태 (useAuth를 여러 번 호출해도 동일한 인스턴스를 공유)
const user = ref(null);
const authError = ref(null);
let isAuthListenerInitialized = false; // 리스너가 한 번만 초기화되도록 플래그

// Firebase 인증 상태 리스너 초기화 (앱 실행 시 한 번만 실행)
if (!isAuthListenerInitialized) {
  auth.onAuthStateChanged((currentUser) => {
    user.value = currentUser;
    if (currentUser) {
      console.log('글로벌 인증 상태 업데이트: 로그인 됨', currentUser.displayName || currentUser.email);
    } else {
      console.log('글로벌 인증 상태 업데이트: 로그아웃 됨');
    }
  });
  isAuthListenerInitialized = true;
}

export function useAuth() {
  const router = useRouter();

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      // user.value는 onAuthStateChanged 리스너에 의해 자동으로 업데이트 됨
      authError.value = null;
      console.log('useAuth: 로그인 성공!', result.user.displayName);
      router.push({ name: 'Overview' }); // 로그인 성공 시 메인 화면으로 이동
    } catch (err) {
      authError.value = err;
      console.error('useAuth: 로그인 실패:', err);
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
      // user.value는 onAuthStateChanged 리스너에 의해 자동으로 업데이트 됨
      authError.value = null;
      console.log('useAuth: 로그아웃 성공!');
      router.push({ name: 'Overview' }); // 로그아웃 성공 시 메인 화면으로 이동
    } catch (err) {
      authError.value = err;
      console.error('useAuth: 로그아웃 실패:', err);
    }
  };

  return {
    user,
    authError,
    signInWithGoogle,
    signOutUser,
  };
}