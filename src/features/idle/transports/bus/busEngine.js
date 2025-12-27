// src/features/idle/transports/bus/busEngine.js
import {
  VILLAGE_BUS_BASE_CONFIG,
  VILLAGE_BUS_DEMAND_PARAMS,
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
 * - stopCount: 처리할 정류장 개수
 * - return: { nextState, income }
 */
export function simulateVillageBusStops(lineState, stopCount) {
  if (stopCount <= 0) {
    return {
      nextState: lineState,
      income: 0,
    }
  }

  const conf = VILLAGE_BUS_BASE_CONFIG
  const demand = VILLAGE_BUS_DEMAND_PARAMS

  const state = { ...lineState }

  const capacity = state.capacity
  const stopsPerLoop =
    state.stopsPerLoop || VILLAGE_BUS_BASE_CONFIG.baseStopsPerLoop

  let currentPassengers = state.currentPassengers
  let income = 0

  for (let i = 0; i < stopCount; i += 1) {
    const loopStopIndex =
      (state.stopsProcessedInThisLoop % stopsPerLoop) + 1

    // 하차
    const deboard =
      currentPassengers > 0 ? randomInt(0, currentPassengers) : 0
    currentPassengers -= deboard

    // 탑승
    const freeSeats = capacity - currentPassengers
    let board = 0

    if (freeSeats > 0) {
      const isRush =
        state.research.peakRushDone &&
        Math.random() < demand.rushEventChance

      if (isRush) {
        const minAfter = Math.round(capacity * demand.rushFillMinRatio)
        const targetAfter = randomInt(minAfter, capacity)
        const needed = Math.max(0, targetAfter - currentPassengers)
        board = Math.min(freeSeats, needed)
      } else {
        const targetAfter = Math.round(capacity * demand.targetLoadRatio)
        const desiredDiff = targetAfter - currentPassengers
        const maxBoardTowardTarget =
          desiredDiff > 0
            ? desiredDiff + demand.extraBoardLeeway
            : Math.max(1, Math.floor(capacity * 0.1))

        const maxBoard = Math.min(
          freeSeats,
          Math.max(0, maxBoardTowardTarget),
        )

        if (maxBoard > 0) {
          board = randomInt(0, maxBoard)
        }
      }

      currentPassengers += board
    }

    // 승차 인원 기준 수익 정산
    income += board * conf.fare

    state.stopsProcessedInThisLoop += 1
    state.lastStopIndex = loopStopIndex
    state.lastBoard = board
    state.lastDeboard = deboard
  }

  state.currentPassengers = currentPassengers
  state.totalIncome += income

  return {
    nextState: state,
    income,
  }
}

/**
 * 버스 한 루프에 필요한 전체 운행 시간(초)
 */
export function getBusRunDuration(lineState) {
  const stops =
    lineState.stopsPerLoop || VILLAGE_BUS_BASE_CONFIG.baseStopsPerLoop
  return stops * BUS_CYCLE_SEC
}

/**
 * (필요하면) 현재 버스 슬롯의 정류장/phase 정보를 계산하는 헬퍼
 * - 지금은 View 쪽에서 직접 계산하고 있으니,
 *   나중에 더 분리하고 싶으면 여기로 옮겨도 됨.
 */
export function getBusPhaseInfo(lineState, runMeta, nowMs) {
  const totalSec = runMeta.durationSec || getBusRunDuration(lineState)
  const elapsedSec = Math.max(0, (nowMs - runMeta.startedAtMs) / 1000)
  const clamped =
    totalSec > 0 ? Math.min(elapsedSec, totalSec - 0.001) : 0

  const stopsPerLoop =
    lineState.stopsPerLoop || VILLAGE_BUS_BASE_CONFIG.baseStopsPerLoop

  const stopIndexBase = Math.floor(clamped / BUS_CYCLE_SEC)
  const currentStopIndex = Math.min(stopsPerLoop, stopIndexBase + 1)

  const withinStop = clamped % BUS_CYCLE_SEC
  const inDwell = withinStop < BUS_DWELL_SEC

  let dwellRemainingSec = 0
  let travelRemainingSec = 0

  if (inDwell) {
    dwellRemainingSec = BUS_DWELL_SEC - withinStop
  } else {
    const travelElapsed = withinStop - BUS_DWELL_SEC
    travelRemainingSec = Math.max(0, BUS_TRAVEL_SEC - travelElapsed)
  }

  return {
    currentStopIndex,
    inDwell,
    dwellRemainingSec,
    travelRemainingSec,
    stopsPerLoop,
  }
}
