// src/composables/usePlayerAccount.ts
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import {
  doc,
  onSnapshot,
  setDoc,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '@/libs/firebase'
import { useFirebaseAuth } from './useFirebaseAuth'

export type CompanyPayload = {
  name: string
  type?: 'construction' | 'operator'
  hqLocation?: string
  hqLat?: number | null
  hqLng?: number | null
}

export type CompanyDoc = {
  name: string
  type: 'construction' | 'operator'
  typeLabel: string
  hqLocation?: string
  hqLat?: number | null
  hqLng?: number | null
  createdAtText: string
}

export type PlayerAccountDoc = {
  uid: string
  email?: string | null
  displayName?: string | null
  company?: CompanyDoc | null
}

const accountDoc = ref<PlayerAccountDoc | null>(null)
const isAccountLoading = ref(false)

let accountUnsub: Unsubscribe | null = null

function stopAccountListener() {
  if (accountUnsub) {
    accountUnsub()
    accountUnsub = null
  }
}

function formatRctsNowText(): string {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const hh = String(now.getHours()).padStart(2, '0')
  const mi = String(now.getMinutes()).padStart(2, '0')
  return `RCT ${yyyy}.${mm}.${dd} ${hh}:${mi}`
}

export function usePlayerAccount() {
  const { user } = useFirebaseAuth()

  const company = computed<CompanyDoc | null>(() => {
    return (accountDoc.value?.company as CompanyDoc | null) ?? null
  })

  const hasCompany = computed(() => !!company.value)

  const startAccountListener = (uid: string) => {
    stopAccountListener()

    const ref = doc(db, 'players', uid)

    isAccountLoading.value = true
    accountUnsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          accountDoc.value = {
            uid,
            email: user.value?.email ?? null,
            displayName: user.value?.displayName ?? null,
            company: null,
          }
        } else {
          accountDoc.value = snap.data() as PlayerAccountDoc
        }
        isAccountLoading.value = false
      },
      (err) => {
        console.error('계정 도큐먼트 구독 실패:', err)
        isAccountLoading.value = false
      }
    )
  }

  watch(
    () => user.value,
    (newUser) => {
      if (!newUser) {
        stopAccountListener()
        accountDoc.value = null
        return
      }
      startAccountListener(newUser.uid)
    },
    { immediate: true }
  )

  onMounted(() => {
    if (user.value) {
      startAccountListener(user.value.uid)
    }
  })

  onUnmounted(() => {
    // 필요시 stopAccountListener() 호출 가능
  })

  /**
   * 현재 로그인한 계정에 company 정보 저장/수정
   * - players/{uid} 문서를 merge: true 로 업데이트
   * - 이미 company가 있다면 createdAtText 를 유지
   * - 없었다면 새로 생성 시점으로 createdAtText 설정
   */
  async function saveCompanyForCurrentUser(payload: CompanyPayload) {
    const u = user.value
    if (!u) {
      console.warn('saveCompanyForCurrentUser: 로그인 정보 없음')
      return
    }

    const ref = doc(db, 'players', u.uid)

    const existingCompany = (accountDoc.value?.company ??
      null) as CompanyDoc | null

    const type: 'construction' | 'operator' =
      payload.type ?? existingCompany?.type ?? 'operator'

    const typeLabel =
      type === 'construction' ? '시공사' : '운송사'

    const hqLocation = payload.hqLocation?.trim() || existingCompany?.hqLocation || ''

    const hqLat =
      typeof payload.hqLat === 'number' && !Number.isNaN(payload.hqLat)
        ? payload.hqLat
        : existingCompany?.hqLat ?? null

    const hqLng =
      typeof payload.hqLng === 'number' && !Number.isNaN(payload.hqLng)
        ? payload.hqLng
        : existingCompany?.hqLng ?? null

    const createdAtText =
      existingCompany?.createdAtText || formatRctsNowText()

    const companyDoc: CompanyDoc = {
      name: payload.name.trim(),
      type,
      typeLabel,
      hqLocation,
      hqLat,
      hqLng,
      createdAtText,
    }

    const base: PlayerAccountDoc = {
      uid: u.uid,
      email: u.email,
      displayName: u.displayName,
      company: companyDoc,
    }

    await setDoc(ref, base, { merge: true })
  }

  /**
   * 현재 로그인한 계정에서 company 정보 제거
   */
  async function clearCompanyForCurrentUser() {
    const u = user.value
    if (!u) {
      console.warn('clearCompanyForCurrentUser: 로그인 정보 없음')
      return
    }

    const ref = doc(db, 'players', u.uid)

    await setDoc(
      ref,
      {
        company: null,
      },
      { merge: true }
    )
  }

  return {
    account: accountDoc,
    company,
    hasCompany,
    isAccountLoading,
    saveCompanyForCurrentUser,
    clearCompanyForCurrentUser,
  }
}
