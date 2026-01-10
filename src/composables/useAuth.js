// src/composables/useAuth.js
import { ref, computed } from 'vue'
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import { getFirebaseAuth } from '@/firebase/firebaseClient.js'

/** @type {import('vue').Ref<import('firebase/auth').User|null>} */
const _user = ref(null)
/** @type {import('vue').Ref<boolean>} */
const _loading = ref(true)

let _inited = false

const ensureInit = () => {
  if (_inited) return
  _inited = true

  const auth = getFirebaseAuth()
  onAuthStateChanged(auth, (u) => {
    _user.value = u
    _loading.value = false
  })
}

export const useAuth = () => {
  ensureInit()

  const isLoggedIn = computed(() => !!_user.value)
  const displayName = computed(() => _user.value?.displayName ?? '')
  const email = computed(() => _user.value?.email ?? '')
  const photoURL = computed(() => _user.value?.photoURL ?? '')
  const uid = computed(() => _user.value?.uid ?? '')

  const loginWithGoogle = async () => {
    const auth = getFirebaseAuth()
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })
    await signInWithPopup(auth, provider)
  }

  const logout = async () => {
    const auth = getFirebaseAuth()
    await signOut(auth)
  }

  return {
    user: _user,
    loading: _loading,
    isLoggedIn,

    displayName,
    email,
    photoURL,
    uid,

    loginWithGoogle,
    logout,
  }
}
