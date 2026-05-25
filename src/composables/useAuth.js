// src/composables/useAuth.js
import { computed, ref } from 'vue'
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { auth, googleProvider } from '@/firebase/firebase'

/**
 * ✅ 전역(싱글턴) 인증 상태
 * - setup() 밖에서도 안전하게 import/호출 가능
 * - inject() 없음
 * - onAuthStateChanged는 단 1회만 구독
 */

const _inited = ref(false)
const _loading = ref(true)
const _user = ref(null)
const _error = ref('')

function initAuthOnce() {
  if (_inited.value) return
  _inited.value = true

  onAuthStateChanged(
    auth,
    (u) => {
      _user.value = u || null
      _loading.value = false
    },
    (err) => {
      _error.value = err?.message || '인증 상태 확인 중 오류가 발생했습니다.'
      _loading.value = false
    },
  )
}

async function loginWithGoogle() {
  _error.value = ''
  try {
    // 팝업 로그인
    await signInWithPopup(auth, googleProvider)
  } catch (e) {
    const code = e?.code || ''
    // 팝업 닫기 등은 조용히 처리 가능(원하시면 토스트로 연결)
    if (code === 'auth/popup-closed-by-user') return
    _error.value = e?.message || '로그인 중 오류가 발생했습니다.'
    throw e
  }
}

async function logout() {
  _error.value = ''
  try {
    await signOut(auth)
  } catch (e) {
    _error.value = e?.message || '로그아웃 중 오류가 발생했습니다.'
    throw e
  }
}

export function useAuth() {
  initAuthOnce()

  const isLoggedIn = computed(() => !!_user.value)
  const displayName = computed(() => _user.value?.displayName || '')
  const email = computed(() => _user.value?.email || '')
  const photoURL = computed(() => _user.value?.photoURL || '')

  return {
    loading: _loading,
    error: _error,
    user: _user,

    isLoggedIn,
    displayName,
    email,
    photoURL,

    loginWithGoogle,
    logout,
  }
}
