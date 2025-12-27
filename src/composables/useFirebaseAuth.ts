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
let unsubscribeAuth: (() => void) | null = null

function ensureAuthListener() {
  if (unsubscribeAuth) return

  unsubscribeAuth = onAuthStateChanged(auth, (user) => {
    currentUser.value = user
  })
}

export function useFirebaseAuth() {
  const isLoggedIn = computed(() => !!currentUser.value)

  async function signInWithGoogle() {
    ensureAuthListener()

    if (currentUser.value) return

    try {
      await signInWithPopup(auth, googleProvider)
      // currentUser.value 는 onAuthStateChanged 에서 채워짐
    } catch (err) {
      console.error('Google 로그인 실패:', err)
    }
  }

  async function logout() {
    try {
      await signOut(auth)
    } catch (err) {
      console.error('로그아웃 실패:', err)
    }
  }

  onMounted(() => {
    ensureAuthListener()
  })

  onUnmounted(() => {
    // 전역 리스너를 계속 유지할 거면 여기에서 unsubscribe 안 해도 됨
    // 지금 구조에서는 한 번만 붙여두고 재사용하는 용도로 둠
  })

  return {
    user: currentUser,
    isLoggedIn,
    signInWithGoogle,
    logout,
  }
}
