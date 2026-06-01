// RCTS FILE CONTEXT
// 파일 역할:
// - 연구 목록 데이터를 관리한다.
// - 각 연구는 메뉴 해금 조건 또는 회사 내부 기능 해금 조건과 연결된다.
//
// 현재 연결:
// - CompanyResearchPanel.vue에서 researchItems를 카테고리별로 출력한다.
// - Home.vue에서 completedResearch 상태와 activeResearch 상태를 관리한다.
// - siteMenus.js의 requiredResearch 값과 researchItems의 id가 연결된다.
// - FacilityPage.vue에서 facility-bus-basic 같은 시설 2차 메뉴 연구 완료 여부를 확인한다.
// - OperationPage.vue에서 bus-dwell-time-basic 완료 여부로 정차시간 설정 표시 여부를 판단한다.
// - OperationPage.vue에서 bus-auto-dispatch-basic 완료 여부로 자동운행 설정 표시 여부를 판단한다.
//
// 현재 규칙:
// - 연구 메뉴는 상위 사이트 메뉴가 아니라 회사 메뉴 내부 기능이다.
// - 연구는 category 값으로 구분한다.
//   - menu-unlock: 좌측 사이트 메뉴 또는 내부 기능 해금 연구.
//   - settings: 회사 설정 메뉴 내부 기능 연구.
// - 완료된 연구는 연구 화면 목록에서 사라진다.
// - 즉시 완료 방식은 제거했다.
// - 연구는 durationTicks 시간이 지나야 완료된다.
// - bus-dwell-time-basic은 버스 운행 2단계 연구이며, 노선별 정차시간 설정을 해금한다.
// - bus-auto-dispatch-basic은 버스 운행 3단계 연구이며, 노선별 자동운행/재출발 대기시간 설정을 해금한다.
// - 운행중 노선은 수정할 수 없고, 미운행 상태에서만 수정할 수 있다.
//
// 주의:
// - siteMenus.js의 requiredResearch와 researchItems의 id가 정확히 일치해야 메뉴 해금이 작동한다.
// - 연구 시간은 durationTicks로 관리한다.
// - 1 tick = 1 second 기준이다.

export const researchItems = [
  {
    id: 'settings-basic',
    category: 'menu-unlock',
    name: '기초 회사 설정 연구',
    targetName: '설정',
    description: '회사 메뉴 내부의 설정 기능을 활성화합니다.',
    durationTicks: 180,
    requiredResearch: [],
    isAvailable: true,
    disabledReason: '',
  },
  {
    id: 'save-local-basic',
    category: 'settings',
    name: '기초 저장 기능 연구',
    targetName: '수동 저장',
    description: '설정 > 데이터 영역에서 브라우저 IndexedDB 수동 저장 기능을 사용할 수 있게 합니다.',
    durationTicks: 180,
    requiredResearch: ['settings-basic'],
    isAvailable: true,
    disabledReason: '',
  },
  {
    id: 'facility-basic',
    category: 'menu-unlock',
    name: '기초 시설 연구',
    targetName: '시설',
    description: '정류장과 역 같은 단일 시설을 만들고 관리할 수 있는 시설 메뉴를 활성화합니다.',
    durationTicks: 180,
    requiredResearch: ['save-local-basic'],
    isAvailable: true,
    disabledReason: '',
  },
  {
    id: 'operation-basic',
    category: 'menu-unlock',
    name: '기초 운행 연구',
    targetName: '운행',
    description: '시설 간 거리, 노선, 배차, 운행 구조를 관리할 수 있는 운행 메뉴를 활성화합니다.',
    durationTicks: 180,
    requiredResearch: ['save-local-basic'],
    isAvailable: true,
    disabledReason: '',
  },
  {
    id: 'vehicle-basic',
    category: 'menu-unlock',
    name: '기초 차량 연구',
    targetName: '차량',
    description: '버스, 철도, 비행기, 선박, 우주선 등 교통수단의 차량 관리를 위한 차량 메뉴를 활성화합니다.',
    durationTicks: 180,
    requiredResearch: ['save-local-basic'],
    isAvailable: true,
    disabledReason: '',
  },
  {
    id: 'facility-bus-basic',
    category: 'menu-unlock',
    name: '기초 버스 시설 연구',
    targetName: '버스 시설',
    description: '시설 메뉴 안에서 버스 정류장, 버스 터미널, 버스 차고지 같은 버스 시설 관리를 활성화합니다.',
    durationTicks: 180,
    requiredResearch: ['facility-basic'],
    isAvailable: true,
    disabledReason: '',
  },
  {
    id: 'bus-dwell-time-basic',
    category: 'menu-unlock',
    name: '버스 운행 2단계 연구',
    targetName: '정차시간 설정',
    description: '버스 노선별 정차시간을 초 단위로 직접 설정할 수 있게 합니다. 설정한 정차시간은 1회 왕복시간 계산에 포함됩니다.',
    durationTicks: 180,
    requiredResearch: ['facility-bus-basic', 'operation-basic', 'vehicle-basic'],
    isAvailable: true,
    disabledReason: '',
  },
  {
    id: 'bus-auto-dispatch-basic',
    category: 'menu-unlock',
    name: '버스 운행 3단계 연구',
    targetName: '자동운행',
    description: '버스 노선이 1회 왕복을 완료한 뒤, 사용자가 정한 재출발 대기시간 후 같은 차량이 자동으로 다시 출발할 수 있게 합니다.',
    durationTicks: 180,
    requiredResearch: ['bus-dwell-time-basic'],
    isAvailable: true,
    disabledReason: '',
  },
  {
    id: 'facility-rail-basic',
    category: 'menu-unlock',
    name: '기초 철도 시설 연구',
    targetName: '철도 시설',
    description: '시설 메뉴 안에서 철도역, 차량기지, 승강장 같은 철도 시설 관리를 활성화합니다.',
    durationTicks: 180,
    requiredResearch: ['facility-basic'],
    isAvailable: false,
    disabledReason: '철도 시설 기능은 아직 미개발 상태입니다.',
  },
  {
    id: 'facility-air-basic',
    category: 'menu-unlock',
    name: '기초 항공 시설 연구',
    targetName: '항공 시설',
    description: '시설 메뉴 안에서 공항, 활주로, 게이트 같은 항공 시설 관리를 활성화합니다.',
    durationTicks: 180,
    requiredResearch: ['facility-basic'],
    isAvailable: false,
    disabledReason: '항공 시설 기능은 아직 미개발 상태입니다.',
  },
  {
    id: 'facility-ship-basic',
    category: 'menu-unlock',
    name: '기초 선박 시설 연구',
    targetName: '선박 시설',
    description: '시설 메뉴 안에서 항만, 선착장, 여객터미널 같은 선박 시설 관리를 활성화합니다.',
    durationTicks: 180,
    requiredResearch: ['facility-basic'],
    isAvailable: false,
    disabledReason: '선박 시설 기능은 아직 미개발 상태입니다.',
  },
  {
    id: 'facility-space-basic',
    category: 'menu-unlock',
    name: '기초 우주선 시설 연구',
    targetName: '우주선 시설',
    description: '시설 메뉴 안에서 우주항, 발사장, 궤도 터미널 같은 우주선 시설 관리를 활성화합니다.',
    durationTicks: 180,
    requiredResearch: ['facility-basic'],
    isAvailable: false,
    disabledReason: '우주선 시설 기능은 아직 미개발 상태입니다.',
  },
  {
    id: 'finance-basic',
    category: 'menu-unlock',
    name: '기초 재정 연구',
    targetName: '재정',
    description: '재정 메뉴를 활성화합니다. 재정이 열리면 수익, 비용, 자금 부족이 게임 진행에 영향을 줍니다.',
    durationTicks: 180,
    requiredResearch: ['facility-basic', 'operation-basic', 'vehicle-basic'],
    isAvailable: false,
    disabledReason: '재정 기능은 아직 미개발 상태입니다.',
  },
  {
    id: 'administration-basic',
    category: 'menu-unlock',
    name: '기초 행정 연구',
    targetName: '행정',
    description: '행정 메뉴를 활성화합니다. 행정이 열리면 시설 설치와 노선 운영에 인허가 절차가 필요해집니다.',
    durationTicks: 180,
    requiredResearch: ['facility-basic', 'operation-basic', 'vehicle-basic'],
    isAvailable: false,
    disabledReason: '행정 기능은 아직 미개발 상태입니다.',
  },
]

export function getResearchName(researchId) {
  return researchItems.find((research) => research.id === researchId)?.name || researchId
}

export function getResearchItem(researchId) {
  return researchItems.find((research) => research.id === researchId) || null
}

export function isResearchCompleted(researchId, completedResearch = []) {
  return completedResearch.includes(researchId)
}

export function getMissingRequiredResearch(research, completedResearch = []) {
  if (!research?.requiredResearch?.length) {
    return []
  }

  return research.requiredResearch.filter((researchId) => {
    return !completedResearch.includes(researchId)
  })
}

export function canStartResearch(research, completedResearch = []) {
  if (!research) {
    return false
  }

  if (!research.isAvailable) {
    return false
  }

  if (isResearchCompleted(research.id, completedResearch)) {
    return false
  }

  return getMissingRequiredResearch(research, completedResearch).length === 0
}