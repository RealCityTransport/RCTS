// src/composables/useCompany.js
import { computed, ref } from 'vue'

/**
 * ✅ 회사 모듈(전역 싱글톤)
 * - 앞으로 회사 확장(자회사/재정/시설/직원/권한 등)을 위해 PlayPage에서 분리
 * - 현재는 로컬 저장 기반 (추후 구글 로그인/클라우드 저장으로 교체 가능)
 */

const STORAGE_KEY = 'rcts_company_v1'

// 싱글톤 상태
const _company = ref(null)
const _loaded = ref(false)

const nowIso = () => new Date().toISOString()

const safeParse = (raw) => {
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

const loadOnce = () => {
  if (_loaded.value) return
  _loaded.value = true

  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return

  const data = safeParse(raw)
  if (!data || typeof data !== 'object') return

  // 최소 스키마 검증(가볍게)
  if (!data.id || !data.name) return

  _company.value = {
    id: String(data.id),
    name: String(data.name),
    createdAt: data.createdAt ? String(data.createdAt) : nowIso(),
    updatedAt: data.updatedAt ? String(data.updatedAt) : nowIso()
  }
}

const persist = () => {
  if (!_loaded.value) _loaded.value = true
  if (!_company.value) {
    localStorage.removeItem(STORAGE_KEY)
    return
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(_company.value))
}

const normalizeName = (name) => String(name ?? '').trim()

export function useCompany() {
  loadOnce()

  const company = computed(() => _company.value)
  const hasCompany = computed(() => !!_company.value)

  const createCompany = (name) => {
    const n = normalizeName(name)

    if (!n) throw new Error('회사명을 입력해 주세요.')
    if (n.length < 2) throw new Error('회사명은 2자 이상이어야 합니다.')
    if (n.length > 24) throw new Error('회사명은 24자 이하여야 합니다.')

    // 1개만 운영(현재 정책). 추후 자회사/멀티로 확장 가능.
    if (_company.value) throw new Error('회사는 이미 생성되어 있습니다.')

    _company.value = {
      id: `C-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: n,
      createdAt: nowIso(),
      updatedAt: nowIso()
    }

    persist()
    return _company.value
  }

  const renameCompany = (newName) => {
    if (!_company.value) throw new Error('회사가 아직 생성되지 않았습니다.')

    const n = normalizeName(newName)
    if (!n) throw new Error('회사명을 입력해 주세요.')
    if (n.length < 2) throw new Error('회사명은 2자 이상이어야 합니다.')
    if (n.length > 24) throw new Error('회사명은 24자 이하여야 합니다.')

    _company.value = {
      ..._company.value,
      name: n,
      updatedAt: nowIso()
    }

    persist()
    return _company.value
  }

  const clearCompany = () => {
    // 디버그/개발용 (나중에 정책적으로 막아도 됨)
    _company.value = null
    persist()
  }

  const exportCompany = () => {
    // 추후 “파일 저장(다운로드)” 모듈과 연결할 수 있도록 미리 API 제공
    return _company.value ? JSON.stringify(_company.value, null, 2) : ''
  }

  const importCompany = (jsonText) => {
    const data = safeParse(jsonText)
    if (!data || typeof data !== 'object') throw new Error('회사 데이터 형식이 올바르지 않습니다.')
    if (!data.id || !data.name) throw new Error('회사 데이터에 필수 값이 없습니다.')

    _company.value = {
      id: String(data.id),
      name: String(data.name),
      createdAt: data.createdAt ? String(data.createdAt) : nowIso(),
      updatedAt: data.updatedAt ? String(data.updatedAt) : nowIso()
    }
    persist()
  }

  return {
    company,
    hasCompany,

    createCompany,
    renameCompany,
    clearCompany,

    exportCompany,
    importCompany
  }
}
