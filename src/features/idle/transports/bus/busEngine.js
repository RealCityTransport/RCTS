// src/features/idle/transports/bus/busEngine.js
import {
  VILLAGE_BUS_BASE_CONFIG,
  BUS_CYCLE_SEC,
  BUS_DWELL_SEC,
  BUS_TRAVEL_SEC,
  VILLAGE_BUS_RESEARCH_CATALOG,
} from './busData'

function randomInt(min, max) {
  if (max <= min) return min
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * 왕복 루프에서 "세그먼트 인덱스(1~총세그먼트)"를
 * 실제 물리 정류장 번호(1~N→N~1)로 매핑
 *
 * - uniqueStops: 왕복 기준 물리 정류장 수 (예: 10)
 * - 세그먼트 인덱스는 1~(2 * uniqueStops) 구간을 가정
 */
export function mapSegmentToLineStop(segmentIndex, uniqueStops) {
  if (uniqueStops <= 1) return 1

  const N = uniqueStops
  const seg = Math.max(1, Math.floor(segmentIndex))
  const maxSeg = 2 * N
  const clamped = Math.min(seg, maxSeg)

  if (clamped <= N) {
    // 1 ~ N : 정방향 1 → N
    return clamped
  }
  // N+1 ~ 2N : 역방향 N → 1
  return 2 * N + 1 - clamped
}

/**
 * 연구 결과를 실제 라인 구성(capacity, stopsPerLoop)에 적용
 * - 순수 객체 입력/출력
 */
export function applyVillageBusResearchToState(lineState) {
  const base = VILLAGE_BUS_BASE_CONFIG
  const r = lineState.research || {}

  const state = { ...lineState }

  state.capacity = r.capacityUpgradeDone
    ? VILLAGE_BUS_RESEARCH_CATALOG.capacityUpgrade.effect.capacity
    : base.baseCapacity

  state.stopsPerLoop = r.lineExtensionDone
    ? VILLAGE_BUS_RESEARCH_CATALOG.lineExtension.effect.baseStopsPerLoop
    : base.baseStopsPerLoop

  return state
}

/**
 * 마을버스 정류장 단위 시뮬레이션
 * - lineState: 현재 버스 라인 상태 (순수 객체)
 * - stopCount: 처리할 "정류장 정차" 횟수
 * - return: { nextState, income }
 *
 * 규칙:
 * - 정류장 정차 시점마다 승·하차 처리
 * - 첫 정류장:
 *   - 승차만 작동 (하차 없음)
 *   - 여유 좌석이 있다면 1명~여유좌석 랜덤 승차
 * - 마지막 정류장:
 *   - 현재 탑승 인원 전부 하차
 *   - 추가 승차 없음 (board = 0)
 * - 중간 정류장:
 *   - 하차: 현재 탑승 인원에서 랜덤 (0~현재탑승인원)
 *   - 승차: 하차 후 남은 인원 기준, 여유 좌석(정원-현재탑승) 1~여유좌석 랜덤 승차
 * - 수익: 각 정류장에서 "승차 인원 × 기본요금" 즉시 정산
 */
export function simulateVillageBusStops(lineState, stopCount) {
  if (stopCount <= 0) {
    return {
      nextState: lineState,
      income: 0,
    }
  }

  const conf = VILLAGE_BUS_BASE_CONFIG
  const state = { ...lineState }

  const capacity =
    typeof state.capacity === 'number'
      ? state.capacity
      : VILLAGE_BUS_BASE_CONFIG.baseCapacity

  const stopsPerLoop =
    state.stopsPerLoop || VILLAGE_BUS_BASE_CONFIG.baseStopsPerLoop

  const totalStops = stopsPerLoop
  const uniqueStops = Math.max(1, Math.floor(totalStops / 2))

  let currentPassengers =
    typeof state.currentPassengers === 'number'
      ? state.currentPassengers
      : 0

  let income = 0

  for (let i = 0; i < stopCount; i += 1) {
    const loopStopIndex =
      (state.stopsProcessedInThisLoop % stopsPerLoop) + 1

    const physicalStopIndex = mapSegmentToLineStop(
      loopStopIndex,
      uniqueStops,
    )

    let deboard = 0
    let board = 0

    if (loopStopIndex === 1) {
      // 1) 첫 정류장: 승차만 작동 (하차 없음)
      const freeSeats = Math.max(0, capacity - currentPassengers)
      if (freeSeats > 0) {
        // 최소 1명 이상 승차
        board = randomInt(1, freeSeats)
        currentPassengers += board
      }
    } else if (loopStopIndex === stopsPerLoop) {
      // 2) 마지막 정류장: 현재 탑승 인원 전부 하차, 승차 없음
      deboard = currentPassengers
      currentPassengers = 0
      board = 0
    } else {
      // 3) 중간 정류장: 하차 + 승차 동시에
      if (currentPassengers > 0) {
        // 하차: 현재 탑승 인원에서 랜덤
        deboard = randomInt(0, currentPassengers)
        currentPassengers -= deboard
      }

      const freeSeats = Math.max(0, capacity - currentPassengers)
      if (freeSeats > 0) {
        // 승차: 여유 좌석 기준 1~여유좌석 랜덤
        board = randomInt(1, freeSeats)
        currentPassengers += board
      }
    }

    // 수익: 승차 인원 × 기본요금
    income += board * conf.fare

    // 상태 기록 (UI용)
    state.stopsProcessedInThisLoop =
      (state.stopsProcessedInThisLoop || 0) + 1

    // 루프 인덱스/물리 인덱스 모두 저장
    state.lastStopIndex = loopStopIndex
    state.lastLoopStopIndex = loopStopIndex
    state.lastPhysicalStopIndex = physicalStopIndex
    state.lastBoard = board
    state.lastDeboard = deboard
    state.lastPassengers = currentPassengers
  }

  state.currentPassengers = currentPassengers
  state.totalIncome = (state.totalIncome || 0) + income

  return {
    nextState: state,
    income,
  }
}

/**
 * 버스 한 루프에 필요한 전체 운행 시간(초)
 *
 * - lineState.stopsPerLoop 는 "루프 내 정류장 정차 횟수" 개념
 *   (예: 물리 정류장 10개 왕복이면 20 정차, 확장 시 40 정차 등)
 * - 각 정류장마다 정차는 항상 발생
 * - 이동은 (정류장 수 - 1)번만 발생하는 구조로 계산
 */
export function getBusRunDuration(lineState) {
  const stops =
    lineState.stopsPerLoop || VILLAGE_BUS_BASE_CONFIG.baseStopsPerLoop

  // 정차 시간: 모든 정류장에서 BUS_DWELL_SEC
  const totalDwell = stops * BUS_DWELL_SEC

  // 이동 시간: 마지막 정류장 이후에는 더 이동하지 않는다고 보고 (stops - 1)번
  const totalTravel = Math.max(0, stops - 1) * BUS_TRAVEL_SEC

  return totalDwell + totalTravel
}

/**
 * 현재 버스 슬롯의 정류장/방향/위치 정보를 계산하는 헬퍼
 *
 * - lineState: 현재 라인 상태
 * - runMeta: 슬롯의 운행 메타 (startedAtMs, durationSec 등)
 * - nowMs: 기준 시각 (Date.now())
 */
export function getBusPhaseInfo(lineState, runMeta, nowMs) {
  const baseStops =
    lineState.stopsPerLoop || VILLAGE_BUS_BASE_CONFIG.baseStopsPerLoop

  const stopsPerLoop = baseStops > 0 ? baseStops : 1
  const uniqueStops = Math.max(1, Math.floor(stopsPerLoop / 2))

  if (!runMeta) {
    return {
      stopsPerLoop,
      uniqueStops,
      segmentIndex: 0,
      physicalStopIndex: 0,
      nextPhysicalStopIndex: 0,
      direction: 'forward',
      inDwell: false,
      dwellRemainingSec: 0,
      travelRemainingSec: 0,
      trackPositionRatio: 0,
    }
  }

  const totalSec =
    runMeta.durationSec || getBusRunDuration(lineState) || 1
  const elapsedSec = Math.max(0, (nowMs - runMeta.startedAtMs) / 1000)
  const clamped =
    totalSec > 0 ? Math.min(elapsedSec, totalSec - 0.001) : 0

  // 루프 내 세그먼트 인덱스 (1 ~ stopsPerLoop)
  const segmentIndexBase = Math.floor(clamped / BUS_CYCLE_SEC)
  const segmentIndex = Math.min(stopsPerLoop, segmentIndexBase + 1)

  // 상행/하행 판별 + 물리 정류장 번호
  const direction =
    segmentIndex <= uniqueStops ? 'forward' : 'backward'
  const physicalStopIndex = mapSegmentToLineStop(
    segmentIndex,
    uniqueStops,
  )

  // 세그먼트 내에서 정차/이동 상태 및 잔여 시간
  const withinSegment = clamped % BUS_CYCLE_SEC
  const inDwell = withinSegment < BUS_DWELL_SEC

  let dwellRemainingSec = 0
  let travelRemainingSec = 0

  if (inDwell) {
    dwellRemainingSec = BUS_DWELL_SEC - withinSegment
    travelRemainingSec = 0
  } else {
    const travelElapsed = withinSegment - BUS_DWELL_SEC
    travelRemainingSec = Math.max(0, BUS_TRAVEL_SEC - travelElapsed)
    dwellRemainingSec = 0
  }

  // 다음 물리 정류장 번호 (표시용)
  let nextPhysicalStopIndex = physicalStopIndex
  if (direction === 'forward') {
    nextPhysicalStopIndex = Math.min(uniqueStops, physicalStopIndex + 1)
  } else {
    nextPhysicalStopIndex = Math.max(1, physicalStopIndex - 1)
  }

  // 선 위에서의 물방울 위치 (0~1)
  let trackPositionRatio = 0
  if (uniqueStops > 1) {
    let segmentTravelProgress = 0
    if (!inDwell && BUS_TRAVEL_SEC > 0) {
      const travelElapsed = withinSegment - BUS_DWELL_SEC
      segmentTravelProgress = Math.min(
        1,
        Math.max(0, travelElapsed / BUS_TRAVEL_SEC),
      )
    }

    const fromIdx = physicalStopIndex
    const toIdx = nextPhysicalStopIndex
    const base = fromIdx - 1
    const offset = (toIdx - fromIdx) * segmentTravelProgress
    const logicalPosition = base + offset

    trackPositionRatio = Math.min(
      1,
      Math.max(0, logicalPosition / (uniqueStops - 1)),
    )
  }

  return {
    stopsPerLoop,
    uniqueStops,
    segmentIndex,
    physicalStopIndex,
    nextPhysicalStopIndex,
    direction,
    inDwell,
    dwellRemainingSec,
    travelRemainingSec,
    trackPositionRatio,
  }
}
