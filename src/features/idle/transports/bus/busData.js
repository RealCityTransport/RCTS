// src/features/idle/transports/bus/busData.js

/**
 * 마을버스 기본 작동 데이터
 * - 기본요금 1,500원
 * - 승차 정원: 25명 (연구로 40명)
 * - 정류장 수: 기본 20개 (연구로 40개)
 * - 정류장 정차 시간: 30초
 * - 정류장 간 이동 시간: 5분(300초)
 */
export const VILLAGE_BUS_BASE_CONFIG = {
  id: 'village_bus_basic',
  name: '마을버스',
  fare: 1500,
  baseCapacity: 25,
  maxCapacity: 40,
  baseStopsPerLoop: 20,
  extendedStopsPerLoop: 40,
}

// 수요 관련 파라미터
export const VILLAGE_BUS_DEMAND_PARAMS = {
  targetLoadRatio: 0.6,
  extraBoardLeeway: 3,
  rushEventChance: 0.05,
  rushFillMinRatio: 0.7,
}

// 시간 상수
export const BUS_DWELL_SEC = 30
export const BUS_TRAVEL_SEC = 5 * 60
export const BUS_CYCLE_SEC = BUS_DWELL_SEC + BUS_TRAVEL_SEC

// 노선 조정(버스 교체) 시간: 10분
export const BUS_RECONFIG_SEC = 10 * 60

// 마을버스 연구 카탈로그
export const VILLAGE_BUS_RESEARCH_CATALOG = {
  capacityUpgrade: {
    key: 'capacityUpgrade',
    id: 'village_bus_capacity_upgrade',
    name: '정원 확장: 40석 마을버스',
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
    name: '노선 연장: 40개 정류장',
    desc: '노선을 연장해 1루프당 40개 정류장을 운행합니다.',
    type: 'line',
    effect: {
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
    lastBoard: 0,
    lastDeboard: 0,
  }
}
