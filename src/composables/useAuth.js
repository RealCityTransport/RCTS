// src/composables/useAuth.js
import { ref } from 'vue'
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { auth } from '@/plugins/firebase/config'

// 전역 반응형 상태 (싱글톤)
const user = ref(null)
const authError = ref(null)
const authReady = ref(false)

// 리스너 초기화/해제 관리
let isAuthListenerInitialized = false
let unsubscribeAuth = null

// ✅ Auth는 DEV에서도 허용(기본값 true)
// - 필요하면 .env에서 VITE_DEV_AUTH_ENABLED=false 로 끌 수 있음
const DEV_AUTH_ENABLED = (import.meta.env.VITE_DEV_AUTH_ENABLED ?? 'true') === 'true'
const AUTH_ENABLED = import.meta.env.PROD ? true : DEV_AUTH_ENABLED

function setGuestReady() {
  user.value = null
  authError.value = null
  authReady.value = true
}

function initAuthListenerOnce() {
  if (isAuthListenerInitialized) return

  // Auth 비활성 or auth 객체 없음: 게스트 모드로 즉시 준비 완료
  if (!AUTH_ENABLED || !auth) {
    setGuestReady()
    isAuthListenerInitialized = true
    return
  }

  // (DEV HMR 등) 혹시 남아있을 수 있는 구독 해제
  if (typeof unsubscribeAuth === 'function') {
    try { unsubscribeAuth() } catch (_) {}
    unsubscribeAuth = null
  }

  unsubscribeAuth = onAuthStateChanged(
    auth,
    (currentUser) => {
      user.value = currentUser || null
      authReady.value = true
      authError.value = null

      if (currentUser?.uid) {
        console.log(
          '글로벌 인증 상태 업데이트: 로그인 됨',
          currentUser.displayName || currentUser.email
        )
      } else {
        console.log('글로벌 인증 상태 업데이트: 로그아웃 됨')
      }
    },
    (err) => {
      // 리스너 자체 에러도 "부팅 멈춤"으로 가지 않게 처리
      authError.value = err
      setGuestReady()
      console.error('onAuthStateChanged error:', err)
    }
  )

  isAuthListenerInitialized = true
}

// ✅ 모듈 로드시 1회 초기화
initAuthListenerOnce()

export function useAuth() {
  const signInWithGoogle = async () => {
    if (!AUTH_ENABLED || !auth) {
      const err = new Error('현재 환경에서 로그인 기능이 비활성화되어 있습니다.')
      err.code = 'AUTH_DISABLED'
      authError.value = err
      throw err
    }

    const provider = new GoogleAuthProvider()
    try {
      const result = await signInWithPopup(auth, provider)
      authError.value = null
      // onAuthStateChanged가 user/authReady를 최종 확정
      console.log('useAuth: 로그인 성공!', result.user.displayName || result.user.email)
      return result.user
    } catch (err) {
      authError.value = err
      console.error('useAuth: 로그인 실패:', err)
      throw err
    }
  }

  const signOutUser = async () => {
    if (!AUTH_ENABLED || !auth) {
      // 이미 게스트 모드로 간주
      setGuestReady()
      return true
    }

    try {
      await signOut(auth)
      authError.value = null
      // onAuthStateChanged가 user=null 확정
      console.log('useAuth: 로그아웃 성공!')
      return true
    } catch (err) {
      authError.value = err
      console.error('useAuth: 로그아웃 실패:', err)
      throw err
    }
  }

  return {
    user,
    authError,
    authReady,
    signInWithGoogle,
    signOutUser,
    // 디버그
    AUTH_ENABLED,
  }
}
