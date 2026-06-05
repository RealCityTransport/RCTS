/*
  파일명: src/state/defaultGameState.js

  역할:
  - RCTS v2 기본 게임 상태를 생성합니다.
  - 저장 데이터가 없을 때 이 상태로 시작합니다.

  업데이트 정책:
  - version이 올라가도 기존 저장 데이터를 초기화하지 않습니다.
  - migration에서 부족한 필드만 보정합니다.

  v7 변경사항:
  - 버스 Lv.1~Lv.4 unlock 구조 추가
  - 버스 차량 분류 연구 unlock 추가
  - 시간표 메뉴/버스 시간표 단계 unlock 추가
  - 자동저장 unlock 추가
*/

export const GAME_STATE_VERSION = 7

export const createDefaultGameState = () => {
  const now = Date.now()

  return {
    version: GAME_STATE_VERSION,

    company: {
      name: 'RCTS Company',
      createdAt: now,
    },

    money: 0,

    vehicles: [],

    operationSlots: [],

    research: {
      running: null,
      completed: [],
    },

    unlocks: {
      funding: false,

      /*
        택시
      */
      taxiLv1: true,
      taxiLv2: false,
      taxiLv3: false,
      taxiReal: false,

      /*
        택배
      */
      parcelLv1: true,
      parcelLv2: false,
      parcelLv3: false,
      parcelReal: false,
      parcelLine: false,
      parcelLocal: false,

      /*
        버스 운행 등급

        busLv1:
        - 기본 해금
        - 초기에는 세부 차종이 아닌 "버스"로 표시
        - 마을버스 Lv.1 운행 가능

        busLv2:
        - 마을버스 Lv.2
        - 시내버스 Lv.1

        busLv3:
        - 시내버스 Lv.2
        - 광역버스 Lv.1
        - 마을버스 Lv.3은 없음

        busLv4:
        - 기본 시간표
        - 차량 1대 = 슬롯 1개 구조에서
          노선 1개 = 다중차량 구조로 전환 시작
      */
      busLv1: true,
      busLv2: false,
      busLv3: false,
      busLv4: false,

      /*
        기존 저장 데이터 호환용

        이전 버전에서는 마을버스 Lv.1을 villageBusLv1로 관리했습니다.
        새 구조에서는 busLv1이 기본 버스 해금 역할을 하지만,
        기존 코드/저장과의 충돌을 막기 위해 유지합니다.
      */
      villageBusLv1: true,

      /*
        버스 차량 분류

        초기:
        - 버스

        버스 차량 분류 연구 후:
        - 소형버스 25인승
        - 중형버스 35인승
        - 대형버스 45인승

        후반:
        - 굴절버스: BRT 연계
        - 2층버스: 광역버스 확장형
      */
      busVehicleClass: false,
      articulatedBus: false,
      doubleDeckerBus: false,

      /*
        시간표

        timetableMenu:
        - 시간표 UI 노출

        busTimetableBasic:
        - 버스 Lv.4 기본 시간표
        - 차량 수 기반 자동 비율 배차

        busTimetable2:
        - 목표 배차간격 설정
        - 필요 차량 수 / 부족 차량 수 표시

        busTimetable3:
        - 첫차, 막차, 기본 배차, 출근/퇴근 배차
        - 표준시간 기반 커스텀 시간표

        busTimetable4:
        - 심야시간 운행
        - 첫차/막차 외 시간대 배차
      */
      timetableMenu: false,
      busTimetableBasic: false,
      busTimetable2: false,
      busTimetable3: false,
      busTimetable4: false,

      /*
        운영/저장 편의 연구
      */
      operationSlotSell: false,
      offlineProgress: false,
      autoSave: false,
      autoSettlement: false,
      operationSlotUnlimited: false,
    },

    limits: {
      maxOperationSlots: 3,
      operationSlotUnlimited: false,
    },

    time: {
      lastOpenedAt: now,
      lastSavedAt: now,

      offlineProgressUnlocked: false,

      /*
        자동저장은 시간표 3의 선행 조건입니다.
        실제 자동저장 루프 적용은 store/bootstrap 쪽에서 처리합니다.
      */
      autoSaveUnlocked: false,
      lastAutoSavedAt: null,
    },

    logs: {
      settlements: [],
      system: [],
    },
  }
}