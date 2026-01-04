// src/composables/useFirebaseAuth.ts
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth'
import { auth, googleProvider } from '@/libs/firebase'

const currentUser = ref<User | null>(null)
const isAuthLoading = ref(false)

let unsubscribeAuth: (() => void) | null = null

function ensureAuthListener() {
  if (unsubscribeAuth) return

  unsubscribeAuth = onAuthStateChanged(auth, (user) => {
    currentUser.value = user
    console.log('[useFirebaseAuth] onAuthStateChanged:', user?.uid || 'null')
  })
}

// 💡 모듈이 로드되는 시점에 한 번은 무조건 리스너를 붙여둔다.
ensureAuthListener()

export function useFirebaseAuth() {
  const isLoggedIn = computed(() => !!currentUser.value)

  /**
   * Google 자동 로그인
   * - 이미 로그인된 상태면 현재 user 바로 반환
   * - 새 로그인 시도 후 성공하면 User 반환
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
      // currentUser.value 는 onAuthStateChanged 에서 채워짐
      console.log('[useFirebaseAuth] signInWithPopup 성공:', result.user.uid)
      return result.user ?? null
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
    signInWithGoogle,
    logout,
  }
}
