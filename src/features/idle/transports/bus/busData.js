// src/features/idle/transports/bus/busData.js

/**
 * 마을버스 기본 작동 데이터
 * - 기본요금 1,500원
 * - 승차 정원: 25명 (연구로 40명)
 * - 물리 정류장 수: 기본 10개 (왕복 19회 정차), 연구로 20개 (왕복 39회 정차)
 * - 정류장 정차 시간: 30초
 * - 정류장 간 이동 시간: 1분 30초(90초)
 */
export const VILLAGE_BUS_BASE_CONFIG = {
  id: 'village_bus_basic',
  name: '마을버스',
  fare: 1500,
  baseCapacity: 25,
  maxCapacity: 40,

  // 루프 내 "정류장 정차" 횟수 (왕복 기준)
  // 물리 정류장 10개 → 1→10→1 패턴으로 19회 정차
  // 물리 정류장 20개 → 1→20→1 패턴으로 39회 정차
  baseStopsPerLoop: 19,
  extendedStopsPerLoop: 39,
}

// 수요 관련 파라미터
export const VILLAGE_BUS_DEMAND_PARAMS = {
  // 목표 탑승률 (정원 대비)
  targetLoadRatio: 0.6,
  // 목표 인원에서 여유로 추가로 허용할 랜덤 승차 인원
  extraBoardLeeway: 3,
  // 러시아워/이벤트 확률
  rushEventChance: 0.05,
  // 러시아워일 때 최소 탑승률
  rushFillMinRatio: 0.7,
}

// 시간 상수
export const BUS_DWELL_SEC = 30
export const BUS_TRAVEL_SEC = 90
export const BUS_CYCLE_SEC = BUS_DWELL_SEC + BUS_TRAVEL_SEC

// 왕복 한 루프 총 운행 시간(초)을 상수로 고정
// - 물리 정류장 10개 (19정차, 18구간)
//   정차: 19 × 30초 = 570초
//   이동: 18 × 90초 = 1620초
//   합계: 2190초 (약 36.5분)
export const BUS_RUN_DURATION_10_STOPS_SEC = 2190

// - 물리 정류장 20개 (39정차, 38구간)
//   정차: 39 × 30초 = 1170초
//   이동: 38 × 90초 = 3420초
//   합계: 4590초 (약 76.5분)
export const BUS_RUN_DURATION_20_STOPS_SEC = 4590

// 노선 조정(버스 교체) 시간: 10분
export const BUS_RECONFIG_SEC = 10 * 60

// 마을버스 연구 카탈로그
export const VILLAGE_BUS_RESEARCH_CATALOG = {
  capacityUpgrade: {
    key: 'capacityUpgrade',
    id: 'village_bus_capacity_upgrade',
    // 이름 변경: 정원 확장: 40석 마을버스 -> 마을버스 정원 확장 : 40석.
    name: '마을버스 정원 확장 : 40석.',
    desc: '좌석 배치와 차량 규격을 확장해 승차 정원을 40명까지 늘립니다.',
    type: 'capacity',
    effect: {
      capacity: VILLAGE_BUS_BASE_CONFIG.maxCapacity,
    },
    cost: 250_000,
    timeSec: 1_800,
  },
  lineExtension: {
    key: 'lineExtension',
    id: 'village_bus_line_extension',
    // 이름 변경: 노선 연장: 40개 정류장 -> +10개 정류장.
    name: '+10개 정류장.',
    desc: '노선을 연장해 물리 정류장 수를 10개에서 20개로 확장합니다.',
    type: 'line',
    effect: {
      // stopsPerLoop를 39정차(물리 정류장 20개 왕복)로 확장
      baseStopsPerLoop: VILLAGE_BUS_BASE_CONFIG.extendedStopsPerLoop,
    },
    cost: 220_000,
    timeSec: 2_400,
  },
  peakRush: {
    key: 'peakRush',
    id: 'village_bus_peak_rush',
    name: '러시아워 수요 분석',
    desc: '러시아워/이벤트 구간에 만차에 가까운 승객이 몰려드는 이벤트가 발생합니다.',
    type: 'rush',
    effect: {
      enableRushEvent: true,
    },
    cost: 180_000,
    timeSec: 1_500,
  },
}

// 마을버스 라인 기본 상태 생성
export function createInitialVillageBusState() {
  return {
    lineId: VILLAGE_BUS_BASE_CONFIG.id,

    // 실제 운행에 적용 중인 값
    capacity: VILLAGE_BUS_BASE_CONFIG.baseCapacity,
    stopsPerLoop: VILLAGE_BUS_BASE_CONFIG.baseStopsPerLoop,

    // 연구 완료 상태 (하지만 곧바로 적용되진 않음)
    research: {
      capacityUpgradeDone: false,
      lineExtensionDone: false,
      peakRushDone: false,
    },

    currentPassengers: 0,
    totalIncome: 0,
    stopsProcessedInThisLoop: 0,

    lastStopIndex: 0,
    lastLoopStopIndex: 0,
    lastPhysicalStopIndex: 0,
    lastBoard: 0,
    lastDeboard: 0,
  }
}

/**
 * 향후 추가할 버스 계열 타입 메타
 * - 아직 구현되지 않았으며 "곧 추가됩니다." 용 표시 데이터
 */
export const VILLAGE_BUS_LINE_VARIANTS = [
  {
    id: 'city_bus',
    name: '시내버스',
    desc: '곧 추가됩니다.',
  },
  {
    id: 'metro_bus',
    name: '광역버스',
    desc: '곧 추가됩니다.',
  },
  {
    id: 'intercity_bus',
    name: '시외버스',
    desc: '곧 추가됩니다.',
  },
  {
    id: 'express_bus',
    name: '고속버스',
    desc: '곧 추가됩니다.',
  },
  {
    id: 'tour_bus',
    name: '관광버스',
    desc: '곧 추가됩니다.',
  },
]
