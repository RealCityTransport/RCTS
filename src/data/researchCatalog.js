/*
  파일명: src/data/researchCatalog.js

  역할:
  - RCTS v2 연구 데이터 카탈로그입니다.

  effect.type:
  - funding: 정산/수익 해금
  - slot_limit: 최대 운영슬롯 증가
  - slot_sell: 대기 슬롯 판매 기능 해금
  - offline_progress: 오프라인 진행 해금
  - auto_save: 자동저장 기능 해금
  - auto_settlement: 완료 슬롯 자동정산 해금
  - slot_limit_unlimited: 운영슬롯 무제한 해금
  - vehicle_unlock: 특정 차량 구입/업그레이드 해금
  - multi_unlock: 여러 unlockKey를 한 번에 해금
*/

export const RESEARCH_CATALOG = [
  {
    id: 'funding_revenue',
    icon: '💰',
    name: '자금추가 연구',
    description: '운영 슬롯에 정산금액이 표시되고 수익을 받을 수 있습니다.',
    durationSeconds: 60 * 60,
    cost: 0,
    prerequisites: [],
    effect: {
      type: 'funding',
      unlockKey: 'funding',
    },
  },

  /*
    택시 연구
  */
  {
    id: 'taxi_lv2_unlock',
    icon: '🚕',
    name: '택시 Lv.2 해금 연구',
    description: '택시 Lv.2 구입과 기존 택시 Lv.1 업그레이드가 가능해집니다.',
    durationSeconds: 60 * 60,
    cost: 120000,
    prerequisites: ['funding_revenue'],
    effect: {
      type: 'vehicle_unlock',
      unlockKey: 'taxiLv2',
    },
  },
  {
    id: 'taxi_lv3_unlock',
    icon: '🚕',
    name: '택시 Lv.3 해금 연구',
    description: '택시 Lv.3 구입과 기존 택시 Lv.2 업그레이드가 가능해집니다.',
    durationSeconds: 2 * 60 * 60,
    cost: 300000,
    prerequisites: ['taxi_lv2_unlock'],
    effect: {
      type: 'vehicle_unlock',
      unlockKey: 'taxiLv3',
    },
  },
  {
    id: 'taxi_real_unlock',
    icon: '🚖',
    name: '택시 리얼 운행 연구',
    description: '랜덤 운행시간과 추가요금이 적용되는 택시 리얼을 사용할 수 있습니다.',
    durationSeconds: 4 * 60 * 60,
    cost: 700000,
    prerequisites: ['taxi_lv3_unlock'],
    effect: {
      type: 'vehicle_unlock',
      unlockKey: 'taxiReal',
    },
  },

  /*
    택배 연구
  */
  {
    id: 'parcel_lv2_unlock',
    icon: '🚚',
    name: '택배 Lv.2 해금 연구',
    description: '택배 Lv.2 구입과 기존 택배 Lv.1 업그레이드가 가능해집니다.',
    durationSeconds: 90 * 60,
    cost: 180000,
    prerequisites: ['funding_revenue'],
    effect: {
      type: 'vehicle_unlock',
      unlockKey: 'parcelLv2',
    },
  },
  {
    id: 'parcel_lv3_unlock',
    icon: '🚚',
    name: '택배 Lv.3 해금 연구',
    description: '택배 Lv.3 구입과 기존 택배 Lv.2 업그레이드가 가능해집니다.',
    durationSeconds: 3 * 60 * 60,
    cost: 450000,
    prerequisites: ['parcel_lv2_unlock'],
    effect: {
      type: 'vehicle_unlock',
      unlockKey: 'parcelLv3',
    },
  },
  {
    id: 'parcel_real_unlock',
    icon: '📦',
    name: '택배 리얼 배송 연구',
    description: '30~300건 랜덤 배송을 1틱 1건으로 처리하는 택배 리얼을 사용할 수 있습니다.',
    durationSeconds: 6 * 60 * 60,
    cost: 1200000,
    prerequisites: ['parcel_lv3_unlock'],
    effect: {
      type: 'vehicle_unlock',
      unlockKey: 'parcelReal',
    },
  },
  {
    id: 'parcel_line_unlock',
    icon: '🚛',
    name: '간선택배 연구',
    description: '지역 간 운송 개념의 간선택배를 사용할 수 있습니다.',
    durationSeconds: 6 * 60 * 60,
    cost: 1200000,
    prerequisites: ['parcel_lv3_unlock'],
    effect: {
      type: 'vehicle_unlock',
      unlockKey: 'parcelLine',
    },
  },
  {
    id: 'parcel_local_unlock',
    icon: '🏢',
    name: '지역택배 연구',
    description: '장시간 고수익 지역택배 운송을 사용할 수 있습니다.',
    durationSeconds: 12 * 60 * 60,
    cost: 2500000,
    prerequisites: ['parcel_line_unlock'],
    effect: {
      type: 'vehicle_unlock',
      unlockKey: 'parcelLocal',
    },
  },

  /*
    버스 연구

    버스는 택시/택배처럼 단순 단일 라인 업그레이드가 아닙니다.

    버스 Lv.1
    - 기본 해금
    - 초기에는 차량명이 세부 차종이 아닌 "버스"로 표시됩니다.
    - 마을버스 Lv.1 운행 가능

    버스 Lv.2
    - 마을버스 Lv.2
    - 시내버스 Lv.1

    버스 Lv.3
    - 시내버스 Lv.2
    - 광역버스 Lv.1
    - 마을버스 Lv.3은 없음

    버스 Lv.4
    - 기본 시간표 해금
    - 기존 차량 1대 = 슬롯 1개 구조에서
      노선 1개 = 다중차량 구조로 넘어가기 시작합니다.
  */
  {
    id: 'bus_lv2_unlock',
    icon: '🚌',
    name: '버스 Lv.2 해금 연구',
    description: '마을버스 Lv.2와 시내버스 Lv.1 운행 등급이 해금됩니다.',
    durationSeconds: 3 * 60 * 60,
    cost: 500000,
    prerequisites: ['funding_revenue'],
    effect: {
      type: 'vehicle_unlock',
      unlockKey: 'busLv2',
    },
  },
  {
    id: 'bus_lv3_unlock',
    icon: '🚌',
    name: '버스 Lv.3 해금 연구',
    description: '시내버스 Lv.2와 광역버스 Lv.1 운행 등급이 해금됩니다.',
    durationSeconds: 8 * 60 * 60,
    cost: 2000000,
    prerequisites: ['bus_lv2_unlock'],
    effect: {
      type: 'vehicle_unlock',
      unlockKey: 'busLv3',
    },
  },

  /*
    버스 차량 연구

    초기에는 소형/중형/대형버스가 바로 등장하지 않습니다.
    처음에는 "버스"만 보이고, 버스 차량 분류 연구 후 차량 종류가 나뉩니다.

    소형버스: 25인승
    중형버스: 35인승
    대형버스: 45인승

    굴절버스:
    - BRT를 위한 후반 확장 차량
    - 지금은 고수요 시내/BRT 대응 차량으로 해금만 준비

    2층버스:
    - 광역버스 확장형 차량
  */
  {
    id: 'bus_vehicle_class_unlock',
    icon: '🚌',
    name: '버스 차량 분류 연구',
    description: '소형버스, 중형버스, 대형버스 차량 분류가 해금됩니다.',
    durationSeconds: 4 * 60 * 60,
    cost: 800000,
    prerequisites: ['bus_lv2_unlock'],
    effect: {
      type: 'vehicle_unlock',
      unlockKey: 'busVehicleClass',
    },
  },
  {
    id: 'articulated_bus_unlock',
    icon: '🚍',
    name: '굴절버스 연구',
    description: 'BRT와 고수요 시내 간선에 대응하는 굴절버스를 해금합니다. BRT 세부 기능은 추후 별도 연구로 확장됩니다.',
    durationSeconds: 12 * 60 * 60,
    cost: 3000000,
    prerequisites: ['bus_vehicle_class_unlock', 'bus_lv3_unlock'],
    effect: {
      type: 'vehicle_unlock',
      unlockKey: 'articulatedBus',
    },
  },
  {
    id: 'double_decker_bus_unlock',
    icon: '🚌',
    name: '2층버스 연구',
    description: '고수요 광역버스 노선에 대응하는 2층버스를 해금합니다.',
    durationSeconds: 12 * 60 * 60,
    cost: 3500000,
    prerequisites: ['bus_vehicle_class_unlock', 'bus_lv3_unlock'],
    effect: {
      type: 'vehicle_unlock',
      unlockKey: 'doubleDeckerBus',
    },
  },

  /*
    버스 시간표 연구

    버스 Lv.4 기본 시간표:
    - 숨겨진 시간표 기능 등장
    - 슬롯에 시간표 버튼 활성화
    - 슬롯 아래 드롭다운으로 시간표 표시
    - 차량 수 기반 자동 비율 배차

    버스 시간표 2:
    - 목표 배차간격 설정
    - 필요 차량 수 계산
    - 부족 차량 수 표시

    버스 시간표 3:
    - 진짜 커스텀 시간표
    - 표준시간 기반 운행
    - 첫차, 막차, 기본 배차, 출근시간, 출근배차, 퇴근시간, 퇴근배차
    - 오프라인 진행과 자동저장이 선행되어야 함

    버스 시간표 4:
    - 심야시간 운행 해금
    - 첫차/막차 외 시간대는 심야 배차간격만 설정
  */
  {
    id: 'bus_lv4_timetable_basic',
    icon: '🕒',
    name: '버스 Lv.4 기본 시간표 연구',
    description: '시간표 기능이 해금되고, 버스 슬롯이 노선 슬롯 기반의 다중차량 운행 구조로 전환되기 시작합니다.',
    durationSeconds: 12 * 60 * 60,
    cost: 5000000,
    prerequisites: ['bus_lv3_unlock'],
    effect: {
      type: 'multi_unlock',
      unlockKeys: ['busLv4', 'timetableMenu', 'busTimetableBasic'],
    },
  },
  {
    id: 'bus_timetable_2',
    icon: '⏱️',
    name: '버스 시간표 2 연구',
    description: '목표 배차간격을 설정할 수 있고, 필요한 차량 수와 부족 차량 수를 확인할 수 있습니다.',
    durationSeconds: 18 * 60 * 60,
    cost: 8000000,
    prerequisites: ['bus_lv4_timetable_basic'],
    effect: {
      type: 'vehicle_unlock',
      unlockKey: 'busTimetable2',
    },
  },
  {
    id: 'bus_timetable_3',
    icon: '📅',
    name: '버스 시간표 3 연구',
    description: '첫차, 막차, 기본 배차, 출근/퇴근 시간대 배차를 설정하는 표준시간 기반 커스텀 시간표가 해금됩니다.',
    durationSeconds: 24 * 60 * 60,
    cost: 15000000,
    prerequisites: ['bus_timetable_2', 'offline_progress', 'auto_save'],
    effect: {
      type: 'vehicle_unlock',
      unlockKey: 'busTimetable3',
    },
  },
  {
    id: 'bus_timetable_4',
    icon: '🌃',
    name: '버스 시간표 4 연구',
    description: '첫차와 막차 외 시간대의 심야 운행이 해금됩니다. 심야시간은 배차간격만 설정합니다.',
    durationSeconds: 24 * 60 * 60,
    cost: 25000000,
    prerequisites: ['bus_timetable_3'],
    effect: {
      type: 'vehicle_unlock',
      unlockKey: 'busTimetable4',
    },
  },

  /*
    운영 슬롯 연구
  */
  {
    id: 'operation_slot_limit_4',
    icon: '📦',
    name: '운영슬롯 확장 I',
    description: '최대 운영슬롯을 4개로 확장합니다.',
    durationSeconds: 30 * 60,
    cost: 50000,
    prerequisites: ['funding_revenue'],
    effect: {
      type: 'slot_limit',
      value: 4,
    },
  },
  {
    id: 'operation_slot_sell',
    icon: '🏷️',
    name: '운영슬롯 판매 연구',
    description: '대기 상태의 운영슬롯을 판매할 수 있습니다.',
    durationSeconds: 90 * 60,
    cost: 180000,
    prerequisites: ['operation_slot_limit_4'],
    effect: {
      type: 'slot_sell',
      unlockKey: 'operationSlotSell',
    },
  },
  {
    id: 'operation_slot_limit_5',
    icon: '📦',
    name: '운영슬롯 확장 II',
    description: '최대 운영슬롯을 5개로 확장합니다.',
    durationSeconds: 60 * 60,
    cost: 120000,
    prerequisites: ['operation_slot_sell'],
    effect: {
      type: 'slot_limit',
      value: 5,
    },
  },
  {
    id: 'operation_slot_limit_6',
    icon: '📦',
    name: '운영슬롯 확장 III',
    description: '최대 운영슬롯을 6개로 확장합니다.',
    durationSeconds: 2 * 60 * 60,
    cost: 250000,
    prerequisites: ['operation_slot_limit_5'],
    effect: {
      type: 'slot_limit',
      value: 6,
    },
  },
  {
    id: 'operation_slot_limit_7',
    icon: '📦',
    name: '운영슬롯 확장 IV',
    description: '최대 운영슬롯을 7개로 확장합니다.',
    durationSeconds: 3 * 60 * 60,
    cost: 500000,
    prerequisites: ['operation_slot_limit_6'],
    effect: {
      type: 'slot_limit',
      value: 7,
    },
  },
  {
    id: 'operation_slot_limit_8',
    icon: '📦',
    name: '운영슬롯 확장 V',
    description: '최대 운영슬롯을 8개로 확장합니다.',
    durationSeconds: 4 * 60 * 60,
    cost: 900000,
    prerequisites: ['operation_slot_limit_7'],
    effect: {
      type: 'slot_limit',
      value: 8,
    },
  },
  {
    id: 'operation_slot_limit_9',
    icon: '📦',
    name: '운영슬롯 확장 VI',
    description: '최대 운영슬롯을 9개로 확장합니다.',
    durationSeconds: 6 * 60 * 60,
    cost: 1500000,
    prerequisites: ['operation_slot_limit_8'],
    effect: {
      type: 'slot_limit',
      value: 9,
    },
  },
  {
    id: 'operation_slot_limit_10',
    icon: '📦',
    name: '운영슬롯 확장 VII',
    description: '최대 운영슬롯을 10개로 확장합니다.',
    durationSeconds: 8 * 60 * 60,
    cost: 2400000,
    prerequisites: ['operation_slot_limit_9'],
    effect: {
      type: 'slot_limit',
      value: 10,
    },
  },
  {
    id: 'offline_progress',
    icon: '🌙',
    name: '오프라인 저장 연구',
    description: '사이트를 닫아도 오프라인 시간 진행을 저장하고 복귀 시 반영합니다.',
    durationSeconds: 24 * 60 * 60,
    cost: 0,
    prerequisites: ['operation_slot_limit_10'],
    effect: {
      type: 'offline_progress',
      unlockKey: 'offlineProgress',
    },
  },
  {
    id: 'auto_save',
    icon: '💾',
    name: '자동저장 연구',
    description: '표준시간 기반 운행과 시간표 운행을 안정적으로 유지하기 위한 자동저장 기능을 해금합니다.',
    durationSeconds: 12 * 60 * 60,
    cost: 0,
    prerequisites: ['offline_progress'],
    effect: {
      type: 'auto_save',
      unlockKey: 'autoSave',
    },
  },
  {
    id: 'auto_settlement',
    icon: '🤖',
    name: '자동정산 연구',
    description: '완료된 운영 슬롯을 자동으로 정산할 수 있습니다.',
    durationSeconds: 24 * 60 * 60,
    cost: 0,
    prerequisites: ['offline_progress'],
    effect: {
      type: 'auto_settlement',
      unlockKey: 'autoSettlement',
    },
  },
  {
    id: 'operation_slot_unlimited',
    icon: '∞',
    name: '운영슬롯 무제한 연구',
    description: '운영슬롯 최대치 제한을 해제합니다.',
    durationSeconds: 24 * 60 * 60,
    cost: 0,
    prerequisites: ['auto_settlement'],
    effect: {
      type: 'slot_limit_unlimited',
      unlockKey: 'operationSlotUnlimited',
    },
  },
]