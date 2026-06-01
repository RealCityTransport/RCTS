// RCTS FILE CONTEXT
// 파일 역할:
// - 사이트 좌측 메뉴 목록을 데이터로 관리한다.
// - 메뉴 이름, 아이콘, 필요한 연구, 설명을 이 파일에서 통일한다.
//
// 현재 연결:
// - Home.vue에서 getVisibleSiteMenus(), getSiteMenuName(), isSiteMenuUnlocked()를 사용한다.
// - SiteMenu.vue는 Home.vue에서 가공된 menuItems를 받아 화면에 출력한다.
//
// 현재 규칙:
// - 회사가 없으면 대시보드만 표시.
// - 회사가 있으면 게임 운영 관련 상위 메뉴가 표시된다.
// - 연구와 설정은 상위 메뉴가 아니라 회사 메뉴 내부 기능으로 들어간다.
// - 저장은 별도 상위 메뉴가 아니라 회사 설정 > 데이터 영역 안에 들어간다.
// - requiredResearch가 있는 메뉴는 해당 연구가 완료되어야 활성화된다.
//
// 현재 상위 메뉴:
// - 대시보드
// - 회사
// - 시설
// - 운행
// - 차량
// - 재정
// - 행정
//
// 메뉴 책임:
// - 시설: 역, 정류장 같은 단일 시설 관리. 시설 간 거리는 운행 메뉴 담당.
// - 운행: 시설 간 거리, 노선, 배차, 복선/복복선/대피선 같은 운행 구조 담당.
// - 차량: 차량 생산, 보유, 성능, 정비, 배치 전 차량 자체 관리.
// - 재정: 게임머니, 수입, 비용, 자금 영향 관리.
// - 행정: 인허가, 승인 절차, 시설 설치 허가, 노선 허가 관리.
//
// 주의:
// - 여기서는 메뉴의 데이터만 관리한다.
// - 메뉴 디자인은 SiteMenu.vue에서 관리한다.
// - 메뉴 클릭 후 보여줄 실제 페이지 연결은 Home.vue에서 관리한다.

export const siteMenus = [
  {
    id: 'dashboard',
    name: '대시보드',
    icon: '▦',
    requiredResearch: null,
    description: '사이트 기본 홈 화면입니다.',
  },
  {
    id: 'company',
    name: '회사',
    icon: '◈',
    requiredResearch: null,
    description: '회사 기본 정보, 연구, 설정을 관리합니다.',
  },
  {
    id: 'facility',
    name: '시설',
    icon: '▤',
    requiredResearch: 'facility-basic',
    description: '정류장과 역 같은 단일 시설을 관리합니다. 시설 간 거리는 운행 메뉴에서 관리합니다.',
  },
  {
    id: 'operation',
    name: '운행',
    icon: '◴',
    requiredResearch: 'operation-basic',
    description: '시설 간 거리, 노선, 배차, 운행 구조를 관리합니다.',
  },
  {
    id: 'vehicle',
    name: '차량',
    icon: '▣',
    requiredResearch: 'vehicle-basic',
    description: '차량 생산, 보유, 성능, 정비, 차량 자체 관리를 담당합니다.',
  },
  {
    id: 'finance',
    name: '재정',
    icon: '₩',
    requiredResearch: 'finance-basic',
    description: '게임머니, 수입, 지출, 예산, 운영 비용을 관리합니다.',
  },
  {
    id: 'administration',
    name: '행정',
    icon: '◫',
    requiredResearch: 'administration-basic',
    description: '시설 설치와 노선 운영에 필요한 인허가 절차를 관리합니다.',
  },
]

export function getVisibleSiteMenus({ hasCompany }) {
  if (!hasCompany) {
    return siteMenus.filter((menu) => menu.id === 'dashboard')
  }

  return siteMenus
}

export function getSiteMenuName(menuId) {
  return siteMenus.find((menu) => menu.id === menuId)?.name || '대시보드'
}

export function isSiteMenuUnlocked(menu, completedResearch = []) {
  if (!menu.requiredResearch) {
    return true
  }

  return completedResearch.includes(menu.requiredResearch)
}