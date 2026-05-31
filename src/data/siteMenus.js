// src/data/siteMenus.js

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
    description: '회사 기본 정보를 확인합니다.',
  },
  {
    id: 'research',
    name: '연구',
    icon: '◇',
    requiredResearch: null,
    description: '메뉴와 기능을 해금합니다.',
  },
  {
    id: 'route',
    name: '노선도',
    icon: '▰',
    requiredResearch: 'route-basic',
    description: '노선 구조를 확인합니다.',
  },
  {
    id: 'section',
    name: '구간 보기',
    icon: '⌁',
    requiredResearch: 'section-basic',
    description: '선택 구간의 운행 흐름을 확인합니다.',
  },
  {
    id: 'station',
    name: '역 목록',
    icon: '◎',
    requiredResearch: 'station-basic',
    description: '역과 정류장 정보를 확인합니다.',
  },
  {
    id: 'train',
    name: '차량 목록',
    icon: '▣',
    requiredResearch: 'train-basic',
    description: '차량과 열차 정보를 확인합니다.',
  },
  {
    id: 'operation',
    name: '운행 관리',
    icon: '◴',
    requiredResearch: 'operation-basic',
    description: '운행 상태와 스케줄을 관리합니다.',
  },
  {
    id: 'facility',
    name: '시설',
    icon: '▤',
    requiredResearch: 'facility-basic',
    description: '시설과 인프라를 관리합니다.',
  },
  {
    id: 'save',
    name: '저장 관리',
    icon: '▥',
    requiredResearch: 'save-basic',
    description: '저장과 백업을 관리합니다.',
  },
  {
    id: 'settings',
    name: '설정',
    icon: '⚙',
    requiredResearch: null,
    description: '사이트와 월드 설정을 관리합니다.',
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