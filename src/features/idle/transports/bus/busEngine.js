// src/features/idle/transports/bus/busEngine.js
import {
  VILLAGE_BUS_BASE_CONFIG,
  VILLAGE_BUS_DEMAND_PARAMS,
  BUS_DWELL_SEC,
  BUS_TRAVEL_SEC,
  BUS_CYCLE_SEC,
  BUS_RUN_DURATION_10_STOPS_SEC,
  BUS_RUN_DURATION_20_STOPS_SEC,
  VILLAGE_BUS_RESEARCH_CATALOG,
} from './busData'

/**
 * 루프 인덱스(1~2N-1)를 물리 정류장 번호(1~N)로 매핑
 * 예: N=10일 때 → 1,2,...,10,9,8,...,2
 */
export function mapSegmentToLineStop(loopIndex, uniqueStops) {
  if (!uniqueStops || uniqueStops <= 1) return 1
  const base = 2 * uniqueStops - 2
  const idx0 = ((loopIndex - 1) % base + base) % base

  if (idx0 < uniqueStops) {
    return 1 + idx0
  }
  return 2 * uniqueStops - 1 - idx0
}

/**
 * 현재 버스 라인 설정에 따른 1루프 총 운행 시간(초)
 */
export function getBusRunDuration(state) {
  const stopsPerLoop =
    state.stopsPerLoop || VILLAGE_BUS_BASE_CONFIG.baseStopsPerLoop

  if (stopsPerLoop === VILLAGE_BUS_BASE_CONFIG.baseStopsPerLoop) {
    return BUS_RUN_DURATION_10_STOPS_SEC
  }
  if (stopsPerLoop === VILLAGE_BUS_BASE_CONFIG.extendedStopsPerLoop) {
    return BUS_RUN_DURATION_20_STOPS_SEC
  }

  // 안전용 기본 계산: (정류장 수 × (정차+이동)) - 마지막 이동 1번
  if (stopsPerLoop <= 0) return BUS_CYCLE_SEC
  return stopsPerLoop * BUS_CYCLE_SEC - BUS_TRAVEL_SEC
}

/**
 * 연구 적용:
 * - 정원 확장 / 노선 연장 연구가 완료되었으면 capacity / stopsPerLoop 반영
 */
export function applyVillageBusResearchToState(state) {
  const base = VILLAGE_BUS_BASE_CONFIG
  const research = {
    capacityUpgradeDone: false,
    lineExtensionDone: false,
    peakRushDone: false,
    ...(state.research || {}),
  }

  const capacity = research.capacityUpgradeDone
    ? VILLAGE_BUS_RESEARCH_CATALOG.capacityUpgrade.effect.capacity
    : base.baseCapacity

  const stopsPerLoop = research.lineExtensionDone
    ? VILLAGE_BUS_RESEARCH_CATALOG.lineExtension.effect.baseStopsPerLoop
    : base.baseStopsPerLoop

  return {
    ...state,
    capacity,
    stopsPerLoop,
    research,
  }
}

/**
 * 하나의 정류장에서 승차/하차와 수익을 시뮬레이션
 */
function simulateOneStop(state, loopStopIndex, stopsPerLoop, uniqueStops) {
  const nextState = { ...state }

  const capacity =
    nextState.capacity || VILLAGE_BUS_BASE_CONFIG.baseCapacity
  const currentPassengers = nextState.currentPassengers || 0

  const isFirstStop = loopStopIndex === 1
  const isLastStop = loopStopIndex === stopsPerLoop

  const physicalStopIndex = mapSegmentToLineStop(
    loopStopIndex,
    uniqueStops,
  )

  let board = 0
  let deboard = 0
  let income = 0

  const fare = VILLAGE_BUS_BASE_CONFIG.fare || 0

  if (isLastStop) {
    deboard = currentPassengers
    board = 0
    nextState.currentPassengers = 0
  } else if (isFirstStop) {
    deboard = 0

    const maxBoard = Math.max(0, capacity)
    if (maxBoard > 0) {
      board = Math.floor(Math.random() * (maxBoard + 1))
    }

    let passengersAfter = board
    if (passengersAfter > capacity) passengersAfter = capacity
    if (passengersAfter < 0) passengersAfter = 0

    nextState.currentPassengers = passengersAfter

    if (board > 0) {
      income = fare * board
      nextState.totalIncome = (nextState.totalIncome || 0) + income
    }
  } else {
    let afterDeboardPassengers = currentPassengers

    if (currentPassengers > 0) {
      const maxDeboard = currentPassengers
      deboard = Math.floor(Math.random() * (maxDeboard + 1))
      afterDeboardPassengers = currentPassengers - deboard
      if (afterDeboardPassengers < 0) {
        afterDeboardPassengers = 0
      }
    }

    const maxBoardFromDiff = deboard
    let boardMax = maxBoardFromDiff

    const remainingCapacity = Math.max(
      0,
      capacity - afterDeboardPassengers,
    )
    if (boardMax > remainingCapacity) {
      boardMax = remainingCapacity
    }

    if (boardMax > 0) {
      board = Math.floor(Math.random() * (boardMax + 1))
    }

    let passengersAfter = afterDeboardPassengers + board

    if (passengersAfter > capacity) {
      passengersAfter = capacity
    }
    if (passengersAfter < 0) {
      passengersAfter = 0
    }

    nextState.currentPassengers = passengersAfter

    if (board > 0) {
      income = fare * board
      nextState.totalIncome = (nextState.totalIncome || 0) + income
    }
  }

  nextState.lastStopIndex = loopStopIndex
  nextState.lastLoopStopIndex = loopStopIndex
  nextState.lastPhysicalStopIndex = physicalStopIndex
  nextState.lastBoard = board
  nextState.lastDeboard = deboard
  nextState.stopsProcessedInThisLoop =
    (nextState.stopsProcessedInThisLoop || 0) + 1

  return {
    nextState,
    income,
  }
}

/**
 * 여러 개의 정류장(steps개)을 한 번에 시뮬레이션
 */
export function simulateVillageBusStops(state, steps) {
  const stopsPerLoop =
    state.stopsPerLoop || VILLAGE_BUS_BASE_CONFIG.baseStopsPerLoop
  const totalStops = stopsPerLoop > 0 ? stopsPerLoop : 1
  const uniqueStops = Math.max(1, Math.floor((totalStops + 1) / 2))

  let current = { ...state }
  let income = 0
  let lastLoopStopIndex = current.lastLoopStopIndex || 0

  const count =
    typeof steps === 'number' && steps > 0 ? Math.floor(steps) : 0

  for (let i = 0; i < count; i += 1) {
    let loopStopIndex
    if (lastLoopStopIndex <= 0 || lastLoopStopIndex >= totalStops) {
      loopStopIndex = 1
    } else {
      loopStopIndex = lastLoopStopIndex + 1
    }

    const res = simulateOneStop(
      current,
      loopStopIndex,
      totalStops,
      uniqueStops,
    )
    current = res.nextState
    income += res.income
    lastLoopStopIndex = loopStopIndex
  }

  return {
    nextState: current,
    income,
  }
}

/**
 * 1회 왕복(1루프)에 대한 고정 스크립트 생성
 */
export function buildBusRunScript(state) {
  const stopsPerLoop =
    state.stopsPerLoop || VILLAGE_BUS_BASE_CONFIG.baseStopsPerLoop
  const totalStops = stopsPerLoop > 0 ? stopsPerLoop : 1
  const uniqueStops = Math.max(1, Math.floor((totalStops + 1) / 2))

  let current = {
    ...state,
    currentPassengers: state.currentPassengers || 0,
    totalIncome: state.totalIncome || 0,
  }

  const steps = []
  let totalIncome = 0

  for (let loopStopIndex = 1; loopStopIndex <= totalStops; loopStopIndex += 1) {
    const res = simulateOneStop(
      current,
      loopStopIndex,
      totalStops,
      uniqueStops,
    )
    current = res.nextState
    totalIncome += res.income

    steps.push({
      loopStopIndex,
      physicalStopIndex: current.lastPhysicalStopIndex,
      board: current.lastBoard,
      deboard: current.lastDeboard,
      income: res.income,
      passengersAfter: current.currentPassengers,
    })
  }

  const durationSec = getBusRunDuration(state)

  return {
    totalDurationSec: durationSec,
    totalStops,
    totalIncome,
    steps,
    finalState: current,
  }
}

/**
 * UI용 현재 운행 단계 계산
 */
export function getBusPhaseInfo(state, runMeta, nowMs) {
  const durationSec =
    runMeta.durationSec || getBusRunDuration(state)
  const elapsedSec = Math.max(
    0,
    (nowMs - runMeta.startedAtMs) / 1000,
  )

  const stopsPerLoop =
    state.stopsPerLoop || VILLAGE_BUS_BASE_CONFIG.baseStopsPerLoop
  const totalStops = stopsPerLoop > 0 ? stopsPerLoop : 1
  const uniqueStops = Math.max(1, Math.floor((totalStops + 1) / 2))

  let loopStopIndex
  if (elapsedSec <= 0) {
    loopStopIndex = 1
  } else if (elapsedSec >= durationSec) {
    loopStopIndex = totalStops
  } else {
    loopStopIndex =
      Math.min(
        totalStops,
        Math.floor(elapsedSec / BUS_CYCLE_SEC) + 1,
      ) || 1
  }

  const cycleStartSec = (loopStopIndex - 1) * BUS_CYCLE_SEC
  const phaseElapsedSec = elapsedSec - cycleStartSec

  const inDwell = phaseElapsedSec < BUS_DWELL_SEC
  const dwellRemainingSec = inDwell
    ? Math.max(0, BUS_DWELL_SEC - phaseElapsedSec)
    : 0

  let travelRemainingSec = 0
  let travelElapsedSec = 0
  if (!inDwell) {
    travelElapsedSec = Math.max(0, phaseElapsedSec - BUS_DWELL_SEC)
    travelRemainingSec = Math.max(0, BUS_TRAVEL_SEC - travelElapsedSec)
  }

  const physicalStopIndex = mapSegmentToLineStop(
    loopStopIndex,
    uniqueStops,
  )

  const nextLoopStopIndex =
    loopStopIndex >= totalStops ? totalStops : loopStopIndex + 1
  const nextPhysicalStopIndex = mapSegmentToLineStop(
    nextLoopStopIndex,
    uniqueStops,
  )

  const direction =
    loopStopIndex <= uniqueStops ? 'forward' : 'backward'

  let trackPositionRatio = 0
  if (uniqueStops > 1) {
    const basePos =
      (physicalStopIndex - 1) / (uniqueStops - 1)
    let segmentProgress = 0
    if (!inDwell && BUS_TRAVEL_SEC > 0) {
      segmentProgress = Math.min(
        1,
        Math.max(0, travelElapsedSec / BUS_TRAVEL_SEC),
      )
    }

    const nextPos =
      (nextPhysicalStopIndex - 1) / (uniqueStops - 1)

    trackPositionRatio =
      basePos + (nextPos - basePos) * segmentProgress

    if (trackPositionRatio < 0) trackPositionRatio = 0
    if (trackPositionRatio > 1) trackPositionRatio = 1
  }

  return {
    stopsPerLoop: totalStops,
    uniqueStops,
    loopStopIndex,
    physicalStopIndex,
    nextPhysicalStopIndex,
    direction,
    inDwell,
    dwellRemainingSec,
    travelRemainingSec,
    trackPositionRatio,
  }
}
