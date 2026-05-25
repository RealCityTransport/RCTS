// src/composables/useFacilities.js
import { computed, ref } from 'vue'

/**
 * ✅ 시설 모듈(전역 싱글톤)
 * - 지도 기반으로 좌표가 고정되는 시설을 전역으로 관리
 * - Rmap/Rworld는 스타일만 다르고 시설 데이터는 동일해야 하므로 단일 소스 사용
 *
 * ✅ 국가 전환(Conversion) 적용 지원
 * - replaceAllFacilities(list, options) 로 서버에서 받은 facilities를 일괄 반영
 * - 기본 정책: 회사 소유 시설(예: COMPANY_HQ)은 보존(preserveCompanyFacilities: true)
 */

const STORAGE_KEY = 'rcts_facilities_v1'

const _facilities = ref([])
const _loaded = ref(false)

const safeParse = (raw) => {
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

const normalizeFacility = (f) => {
  if (!f || typeof f !== 'object') return null

  const id = String(f.id || '')
  const type = String(f.type || '')
  const name = String(f.name || '')
  const lng = Number(f.lng)
  const lat = Number(f.lat)
  const companyId = f.companyId ? String(f.companyId) : null

  if (!id || !type) return null
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null

  return { id, type, name, lng, lat, companyId }
}

const loadOnce = () => {
  if (_loaded.value) return
  _loaded.value = true

  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return

  const data = safeParse(raw)
  if (!Array.isArray(data)) return

  _facilities.value = data
    .map(normalizeFacility)
    .filter((x) => !!x)
}

const persist = () => {
  if (!_loaded.value) _loaded.value = true
  localStorage.setItem(STORAGE_KEY, JSON.stringify(_facilities.value || []))
}

const newId = (prefix) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`

/** ✅ id 중복 제거 + 마지막 항목 우선(서버 결과가 최신이라고 가정) */
const dedupeByIdKeepLast = (list) => {
  const map = new Map()
  for (const item of list) {
    if (!item?.id) continue
    map.set(item.id, item)
  }
  return Array.from(map.values())
}

/** ✅ 회사 소유 시설 필터(기본: companyId가 있으면 “회사 소유”로 간주) */
const isCompanyOwned = (f) => !!f?.companyId

export function useFacilities() {
  loadOnce()

  const facilities = computed(() => _facilities.value || [])

  const getCompanyHq = (companyId) => {
    if (!companyId) return null
    return (_facilities.value || []).find((f) => f.type === 'COMPANY_HQ' && f.companyId === companyId) || null
  }

  const setCompanyHq = (companyId, lng, lat) => {
    if (!companyId) throw new Error('회사 정보가 없습니다.')
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) throw new Error('좌표가 올바르지 않습니다.')

    // 회사 본부는 회사당 1개
    const exists = getCompanyHq(companyId)
    if (exists) throw new Error('회사 본부는 이미 설치되어 있습니다.')

    const fac = {
      id: newId('F'),
      type: 'COMPANY_HQ',
      name: '회사 본부',
      lng,
      lat,
      companyId
    }

    _facilities.value.push(fac)
    persist()
    return fac
  }

  /**
   * ✅ 국가 전환 결과를 시설 DB에 반영(핵심)
   *
   * @param {Array} list - 서버에서 받은 facilities 배열
   * @param {Object} options
   * @param {boolean} options.preserveCompanyFacilities - 회사 소유 시설을 보존할지(기본 true)
   * @param {boolean} options.preserveCompanyHq - COMPANY_HQ만 보존할지(기본 false, preserveCompanyFacilities가 true면 자동 보존됨)
   * @param {number} options.maxCount - 안전 상한(기본 200000). 초과분은 뒤에서 잘림.
   *
   * 정책(기본):
   * - 서버 결과(list)를 “기본 시설”로 보고 갈아끼우되,
   * - 기존에 사용자가 만든 회사 소유 시설(예: COMPANY_HQ)은 유지한다.
   */
  const replaceAllFacilities = (list, options = {}) => {
    const {
      preserveCompanyFacilities = true,
      preserveCompanyHq = false,
      maxCount = 200000
    } = options

    const incomingRaw = Array.isArray(list) ? list : []
    const incoming = incomingRaw.map(normalizeFacility).filter((x) => !!x)

    // ✅ 상한(너무 커지면 로컬스토리지/메모리 문제 방지)
    const boundedIncoming = incoming.length > maxCount ? incoming.slice(0, maxCount) : incoming

    // ✅ 기존에서 보존할 것들
    const existing = _facilities.value || []
    const preserved = []

    if (preserveCompanyFacilities) {
      for (const f of existing) {
        if (isCompanyOwned(f)) preserved.push(f)
      }
    } else if (preserveCompanyHq) {
      for (const f of existing) {
        if (f?.type === 'COMPANY_HQ') preserved.push(f)
      }
    }

    // ✅ 합치고(id 중복 제거)
    const merged = dedupeByIdKeepLast([...boundedIncoming, ...preserved])

    _facilities.value = merged
    persist()
    return _facilities.value
  }

  /**
   * ✅ 서버 결과를 “추가/갱신” 형태로 반영(선택 기능)
   * - replaceAll이 너무 과격할 때 사용
   */
  const upsertFacilities = (list, options = {}) => {
    const { maxCount = 50000 } = options
    const incomingRaw = Array.isArray(list) ? list : []
    const incoming = incomingRaw.map(normalizeFacility).filter((x) => !!x)
    const boundedIncoming = incoming.length > maxCount ? incoming.slice(0, maxCount) : incoming

    const existing = _facilities.value || []
    const map = new Map()

    for (const f of existing) {
      if (!f?.id) continue
      map.set(f.id, f)
    }
    for (const f of boundedIncoming) {
      map.set(f.id, f)
    }

    _facilities.value = Array.from(map.values())
    persist()
    return _facilities.value
  }

  const clearAllFacilities = () => {
    // 개발/테스트용
    _facilities.value = []
    persist()
  }

  return {
    facilities,
    getCompanyHq,
    setCompanyHq,
    replaceAllFacilities,
    upsertFacilities,
    clearAllFacilities
  }
}
