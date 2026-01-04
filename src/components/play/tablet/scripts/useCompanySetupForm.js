// src/components/play/tablet/scripts/useCompanySetupForm.js
import { ref, computed, watch } from 'vue'

/**
 * TabletHome 에서 사용하는 회사 생성/정보/수정 패널 전용 스크립트
 *
 * - props.company 를 기준으로 "회사 있음/없음" 상태를 계산
 * - 회사 없음 → C 타일 클릭 시 생성 폼 열기
 * - 회사 있음 → C 타일 클릭 시 정보 보기 패널 열기
 * - 정보 보기 패널에서 "회사 정보 수정" 버튼으로 수정 폼 열기
 * - 폼 제출 시 create-company 이벤트로 상위에 payload 전달
 *
 * 실제 저장/검증/시간(RCT) 부여는 상위(계정/Firestore)에서 처리.
 */
export function useCompanySetupForm(props, emit) {
  const panelMode = ref('none') // 'none' | 'create' | 'view' | 'edit'

  const hasCompany = computed(() => !!props.company)

  const statusValue = computed(() => {
    if (!hasCompany.value) {
      return '회사 정보 미등록'
    }
    return props.company.name || '등록된 회사가 있습니다'
  })

  const statusHint = computed(() => {
    if (!hasCompany.value) {
      return '아직 회사를 만들지 않았다면, 아래에서 회사 생성을 시작할 수 있어요.'
    }

    const hq = props.company.hqLocation
    const lat = props.company.hqLat
    const lng = props.company.hqLng
    const created = props.company.createdAtText

    const parts = []

    if (hq) {
      parts.push(`본사: ${hq}`)
    }

    if (
      typeof lat === 'number' &&
      typeof lng === 'number' &&
      !Number.isNaN(lat) &&
      !Number.isNaN(lng)
    ) {
      parts.push(`좌표: ${lat.toFixed(6)}, ${lng.toFixed(6)}`)
    }

    if (created) {
      parts.push(`등록: ${created}`)
    }

    if (parts.length === 0) {
      return '이미 등록된 회사가 있습니다. 아래에서 회사 정보를 확인하거나 수정할 수 있어요.'
    }

    return parts.join(' · ')
  })

  // 회사 생성/수정 폼 로컬 상태
  const companyForm = ref({
    name: '',
    hqLocation: '',
    hqLat: '',
    hqLng: '',
  })

  function resetFormFromCompany(company) {
    if (!company) {
      companyForm.value = {
        name: '',
        hqLocation: '',
        hqLat: '',
        hqLng: '',
      }
      return
    }

    companyForm.value = {
      name: company.name || '',
      hqLocation: company.hqLocation || '',
      hqLat:
        typeof company.hqLat === 'number' && !Number.isNaN(company.hqLat)
          ? String(company.hqLat)
          : '',
      hqLng:
        typeof company.hqLng === 'number' && !Number.isNaN(company.hqLng)
          ? String(company.hqLng)
          : '',
    }
  }

  // C 타일 클릭
  function handleCompanyTileClick() {
    if (!hasCompany.value) {
      // 새 회사 생성
      resetFormFromCompany(null)
      panelMode.value = 'create'
    } else {
      // 회사 정보 보기
      panelMode.value = 'view'
    }
  }

  // 회사 정보 수정 시작
  function handleEditCompany() {
    if (!props.company) return
    resetFormFromCompany(props.company)
    panelMode.value = 'edit'
  }

  function closePanel() {
    panelMode.value = 'none'
  }

  // 회사 생성/수정 폼 제출 → 상위로 create-company 이벤트만 보냄
  function handleCreateCompany() {
    const rawLat = companyForm.value.hqLat
    const rawLng = companyForm.value.hqLng

    const parsedLat =
      rawLat !== '' && rawLat != null ? Number(rawLat) : undefined
    const parsedLng =
      rawLng !== '' && rawLng != null ? Number(rawLng) : undefined

    const payload = {
      name: companyForm.value.name.trim(),
      hqLocation: companyForm.value.hqLocation.trim(),
      hqLat:
        typeof parsedLat === 'number' && !Number.isNaN(parsedLat)
          ? parsedLat
          : undefined,
      hqLng:
        typeof parsedLng === 'number' && !Number.isNaN(parsedLng)
          ? parsedLng
          : undefined,
    }

    if (!payload.name) return

    emit('create-company', payload)

    // 저장은 상위에서 처리하므로 여기서는 패널만 닫음
    panelMode.value = 'none'
  }

  // props.company 바뀔 때 상태 정리 (예: 삭제 후)
  watch(
    () => props.company,
    (newVal) => {
      if (!newVal && panelMode.value === 'view') {
        panelMode.value = 'none'
      }
    }
  )

  return {
    panelMode,
    hasCompany,
    statusValue,
    statusHint,
    companyForm,
    handleCompanyTileClick,
    handleCreateCompany,
    handleEditCompany,
    closePanel,
  }
}
