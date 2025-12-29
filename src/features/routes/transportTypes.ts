// src/features/routes/transportTypes.ts
export type TransportMode =
  | 'bus'    // 버스
  | 'truck'  // 트럭
  | 'rail'   // 철도
  | 'air'    // 비행기
  | 'ship'   // 배
  | 'space'  // 우주선

export const TRANSPORT_MODE_OPTIONS: { key: TransportMode; label: string; description: string }[] = [
  {
    key: 'bus',
    label: '버스',
    description: '도시 내 단거리 여객 중심 노선에 사용됩니다.',
  },
  {
    key: 'truck',
    label: '트럭',
    description: '물류·화물 위주의 노선(산업단지, 물류센터 등)에 사용됩니다.',
  },
  {
    key: 'rail',
    label: '철도',
    description: '대량 수송·중거리 이상 노선에 사용됩니다.',
  },
  {
    key: 'air',
    label: '비행기',
    description: '도시간/도국가 간 장거리 여객·화물 노선에 사용됩니다.',
  },
  {
    key: 'ship',
    label: '배',
    description: '항만·섬·연안 지역을 잇는 해상 노선에 사용됩니다.',
  },
  {
    key: 'space',
    label: '우주선',
    description: '행성·궤도·우주 스테이션 간 초장거리 노선에 사용됩니다.',
  },
]
