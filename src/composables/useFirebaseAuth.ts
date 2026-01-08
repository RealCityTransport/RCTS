// src/composables/useFirebaseAuth.ts
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth'
import { auth, googleProvider } from '@/libs/firebase'
import { startRctsTimeTicker } from '@/services/rctsTimeTicker'

const currentUser = ref<User | null>(null)
const isAuthLoading = ref(false)
// ✅ 인증 초기 상태가 결정되었는지 여부
const isAuthReady = ref(false)

let unsubscribeAuth: (() => void) | null = null

// ✅ ticker stop 핸들 (중복 실행 방지 + 로그아웃 시 정지)
let stopRctsTicker: null | (() => void) = null

function ensureAuthListener() {
  if (unsubscribeAuth) return

  unsubscribeAuth = onAuthStateChanged(auth, (user) => {
    currentUser.value = user
    isAuthReady.value = true // ✅ 첫 응답이 온 시점에 ready 처리
    console.log('[useFirebaseAuth] onAuthStateChanged:', user?.uid || 'null')

    // ✅ 로그인 상태면 ticker 시작 (한 번만)
    if (user?.uid) {
      if (!stopRctsTicker) {
        stopRctsTicker = startRctsTimeTicker()
        console.log('[useFirebaseAuth] RCTS ticker started')
      }
      return
    }

    // ✅ 로그아웃이면 ticker 정지
    if (stopRctsTicker) {
      stopRctsTicker()
      stopRctsTicker = null
      console.log('[useFirebaseAuth] RCTS ticker stopped')
    }
  })
}

// 💡 모듈이 로드되는 시점에 한 번은 무조건 리스너를 붙여둔다.
ensureAuthListener()

export function useFirebaseAuth() {
  const isLoggedIn = computed(() => !!currentUser.value)

  /**
   * Google 로그인
   * - 이미 로그인된 상태면 현재 user 바로 반환
   * - 새 로그인 시도 후 성공하면 User 반환 + 즉시 상태 갱신
   * - 실패/취소 시 null 반환
   * - 진행 중 상태는 isAuthLoading 으로 노출
   */
  async function signInWithGoogle(): Promise<User | null> {
    // 리스너 보장
    ensureAuthListener()

    // 이미 로그인된 상태면 새 팝업 띄우지 않기
    if (currentUser.value) {
      console.log('[useFirebaseAuth] 이미 로그인 상태, 현재 유저 반환')
      return currentUser.value
    }

    if (isAuthLoading.value) {
      // 중복 클릭 방지
      return null
    }

    isAuthLoading.value = true

    try {
      const result = await signInWithPopup(auth, googleProvider)

      if (result.user) {
        // ✅ 팝업 결과를 바로 전역 상태에 반영해서
        // onAuthStateChanged 응답을 기다리지 않아도 UI가 즉시 전환되도록 함
        currentUser.value = result.user
        isAuthReady.value = true
        console.log('[useFirebaseAuth] signInWithPopup 성공:', result.user.uid)
        return result.user
      }

      return null
    } catch (err) {
      console.error('Google 로그인 실패:', err)
      return null
    } finally {
      isAuthLoading.value = false
    }
  }

  async function logout() {
    try {
      await signOut(auth)
      console.log('[useFirebaseAuth] 로그아웃 완료')
      // onAuthStateChanged 에서 currentUser / isAuthReady 다시 정리됨
    } catch (err) {
      console.error('로그아웃 실패:', err)
    }
  }

  onMounted(() => {
    // 컴포넌트에서 쓰일 때도 한 번 더 보장
    ensureAuthListener()
  })

  onUnmounted(() => {
    // 전역 리스너를 계속 유지할 계획이면 여기서는 해제하지 않는다.
    // 지금 구조에서는 앱 전체에서 하나의 리스너를 재사용하는 용도로 둔다.
  })

  return {
    user: currentUser,
    isLoggedIn,
    isAuthLoading,
    isAuthReady,
    signInWithGoogle,
    logout,
  }
}
