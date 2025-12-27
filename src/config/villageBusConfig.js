// src/config/villageBusConfig.js

// 💠 마을버스 기본 운행 설정
export const VILLAGE_BUS_BASE_CONFIG = {
  id: 'village_bus_basic',
  name: '마을버스',

  // 요금/정원
  fare: 1500,          // 1인당 기본요금 (원)
  baseCapacity: 25,    // 기본 승차 정원
  maxCapacity: 40,     // 연구로 해금되는 최대 정원

  // 정류장·시간 관련
  stopTimeMinutes: 5,  // 정류장 1개 이동/처리 기준 시간 (5분)
  baseStopsPerLoop: 20 // 기본 왕복 정류장 수 → 5분 × 20 = 100분
}

// 💠 마을버스 수요/탑승률 기본 파라미터
export const VILLAGE_BUS_DEMAND_PARAMS = {
  // 목표 평균 탑승률 (25명 기준 약 15명)
  targetLoadRatio: 0.6,

  // 기본 모드에서 타겟 근처로 수렴시킬 때 허용 오차
  // (target + random(0~extra))
  extraBoardLeeway: 3,

  // 러시 이벤트 확률 (연구 해금 이후에만 사용)
  rushEventChance: 0.05, // 5%

  // 러시일 때 최소 채우는 비율 (예: 70%~100% 사이)
  rushFillMinRatio: 0.7
}

// 💠 마을버스 연구 카탈로그
export const VILLAGE_BUS_RESEARCH_CATALOG = {
  // 1) 승차 정원 업그레이드 (25명 → 40명 고정)
  capacityUpgrade: {
    id: 'village_bus_capacity_upgrade',
    name: '마을버스 확장형 차량 도입',
    desc: '차량 규격과 좌석 배치를 확장해 더 많은 승객을 태울 수 있습니다.',
    type: 'capacity',
    // 효과: 정원 25명 → 40명 고정
    effect: {
      capacity: 40
    },
    cost: 120_000
  },

  // 2) 노선 연장 연구 (정류장 수 증가)
  lineExtension: {
    id: 'village_bus_line_extension',
    name: '마을버스 노선 연장',
    desc: '마을 전역을 아우르도록 노선을 연장해 더 많은 정류장을 커버합니다.',
    type: 'line',
    // 기본 20개 → 연구 후 40개로 고정
    effect: {
      baseStopsPerLoop: 40
    },
    cost: 100_000
  },

  // 3) 러시아워 수요 연구 (가끔 100%까지 몰리는 이벤트 해금)
  peakRush: {
    id: 'village_bus_peak_rush',
    name: '러시아워 수요 분석',
    desc: '출퇴근/이벤트 수요를 반영해 간헐적으로 만차에 가까운 승객이 몰려듭니다.',
    type: 'rush',
    // 효과: 러시 이벤트 활성화 플래그
    effect: {
      enableRushEvent: true
    },
    cost: 80_000
  }
}

// 💠 런타임 상태 기본값 생성 (슬롯 하나 기준)
// - 실제 Idle 슬롯 state 초기화할 때 써도 됨
export function createInitialVillageBusState() {
  return {
    lineId: VILLAGE_BUS_BASE_CONFIG.id,
    capacity: VILLAGE_BUS_BASE_CONFIG.baseCapacity,
    stopsPerLoop: VILLAGE_BUS_BASE_CONFIG.baseStopsPerLoop,

    // 연구 적용 플래그들
    research: {
      capacityUpgradeDone: false,
      lineExtensionDone: false,
      peakRushDone: false
    },

    // 운행 상태
    currentPassengers: 0,
    totalIncome: 0,
    stopsProcessedInThisLoop: 0
  }
}
