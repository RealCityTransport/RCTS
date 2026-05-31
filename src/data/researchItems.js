// src/data/researchItems.js

export const researchItems = [
  {
    id: 'route-basic',
    name: '기초 노선 연구',
    description: '노선도 메뉴를 활성화합니다.',
  },
  {
    id: 'section-basic',
    name: '기초 구간 연구',
    description: '구간 보기 메뉴를 활성화합니다.',
  },
  {
    id: 'station-basic',
    name: '기초 역 연구',
    description: '역 목록 메뉴를 활성화합니다.',
  },
  {
    id: 'train-basic',
    name: '기초 차량 연구',
    description: '차량 목록 메뉴를 활성화합니다.',
  },
  {
    id: 'operation-basic',
    name: '기초 운행 연구',
    description: '운행 관리 메뉴를 활성화합니다.',
  },
  {
    id: 'facility-basic',
    name: '기초 시설 연구',
    description: '시설 메뉴를 활성화합니다.',
  },
  {
    id: 'save-basic',
    name: '기초 저장 연구',
    description: '저장 관리 메뉴를 활성화합니다.',
  },
]

export function getResearchName(researchId) {
  return researchItems.find((research) => research.id === researchId)?.name || researchId
}