// src/composables/useCompany.js
import { ref, computed, watch } from 'vue'
import { useAuth } from '@/composables/useAuth.js'

/** @type {import('vue').Ref<{name:string, createdAt:number, updatedAt:number}|null>} */
const _company = ref(null)
/** @type {import('vue').Ref<boolean>} */
const _loading = ref(false)

let _bound = false

const storageKey = (uid) => `rcts:company:${uid || 'guest'}`

const readCompany = (uid) => {
  if (!uid) return null
  try {
    const raw = localStorage.getItem(storageKey(uid))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed.name !== 'string') return null

    // 하위호환: 예전 데이터(createdAt/updatedAt 없을 수 있음)
    const createdAt =
      typeof parsed.createdAt === 'number' ? parsed.createdAt : Date.now()
    const updatedAt =
      typeof parsed.updatedAt === 'number' ? parsed.updatedAt : createdAt

    return {
      ...parsed,
      name: parsed.name,
      createdAt,
      updatedAt,
    }
  } catch {
    return null
  }
}

const writeCompany = (uid, company) => {
  if (!uid) return
  localStorage.setItem(storageKey(uid), JSON.stringify(company))
}

export const useCompany = () => {
  const { uid, isLoggedIn } = useAuth()

  if (!_bound) {
    _bound = true

    watch(
      uid,
      (nextUid) => {
        _loading.value = true
        try {
          _company.value = readCompany(nextUid)
        } finally {
          _loading.value = false
        }
      },
      { immediate: true }
    )
  }

  const hasCompany = computed(() => !!_company.value)
  const companyName = computed(() => _company.value?.name ?? '')

  const createCompany = async (name) => {
    const u = uid.value
    if (!u) return

    // ✅ 이미 회사가 있으면 생성 불가(삭제도 없으니 안전장치)
    if (_company.value) return

    const trimmed = String(name ?? '').trim()
    if (!trimmed) return

    _loading.value = true
    try {
      // UI 연출
      await new Promise((r) => setTimeout(r, 350))

      const now = Date.now()
      const payload = {
        name: trimmed,
        createdAt: now,
        updatedAt: now,

        // ✅ 확장 대비(추후 자회사/부서/사업부 등)
        // subsidiaries: [],
      }

      _company.value = payload
      writeCompany(u, payload)
    } finally {
      _loading.value = false
    }
  }

  const updateCompanyName = async (nextName) => {
    const u = uid.value
    if (!u) return
    if (!_company.value) return

    const trimmed = String(nextName ?? '').trim()
    if (!trimmed) return

    _loading.value = true
    try {
      // UI 연출 (생성보다 살짝 짧게)
      await new Promise((r) => setTimeout(r, 200))

      const updated = {
        ..._company.value,
        name: trimmed,
        updatedAt: Date.now(),
      }

      _company.value = updated
      writeCompany(u, updated)
    } finally {
      _loading.value = false
    }
  }

  return {
    company: _company,
    loading: _loading,
    isLoggedIn,

    hasCompany,
    companyName,

    createCompany,
    updateCompanyName,
  }
}
