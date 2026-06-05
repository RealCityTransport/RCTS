/*
  파일명: src/modules/time.js

  역할:
  - RCTS v2 시간 모듈입니다.
  - 1초 = 1틱 구조를 안정적으로 관리합니다.
  - setInterval의 오차를 줄이기 위해 performance.now() 기반 누적 계산을 사용합니다.

  기본 규칙:
  - 사이트 접속 중에만 시간이 흐릅니다.
  - 사이트가 닫히면 타이머는 정지합니다.
  - 다시 접속하면 저장된 남은 시간부터 이어서 진행합니다.
  - 오프라인 진행은 연구로 해금되기 전까지 반영하지 않습니다.

  특수 운행:
  - parcel_count 모드는 1틱 = 1건 처리입니다.
  - bus_stops / bus_metro 모드는 정류장 정차/이동 단계로 진행됩니다.
  - route 슬롯은 여러 차량이 배차간격에 따라 순차 출발합니다.
*/

const DEFAULT_TICK_MS = 1000

const msToSeconds = (ms) => {
  return Math.floor(ms / 1000)
}

export const getOfflineMaxSecondsByLevel = (level) => {
  const table = {
    0: 0,
    1: 60 * 60,
    2: 3 * 60 * 60,
    3: 8 * 60 * 60,
    4: 24 * 60 * 60,
    5: 72 * 60 * 60,
  }

  return table[level] ?? 0
}

const isOfflineProgressUnlocked = (gameState) => {
  return Boolean(
    gameState?.time?.offlineProgressUnlocked ||
      gameState?.unlocks?.offlineProgress,
  )
}

export const calculateOfflineProgress = (gameState) => {
  const timeState = gameState?.time

  if (!timeState) {
    return {
      rawOfflineSeconds: 0,
      appliedOfflineSeconds: 0,
    }
  }

  if (!isOfflineProgressUnlocked(gameState)) {
    return {
      rawOfflineSeconds: 0,
      appliedOfflineSeconds: 0,
    }
  }

  const lastSavedAt = timeState.lastSavedAt ?? Date.now()
  const now = Date.now()

  const rawOfflineSeconds = Math.max(0, msToSeconds(now - lastSavedAt))

  const offlineProgressLevel =
    typeof timeState.offlineProgressLevel === 'number'
      ? timeState.offlineProgressLevel
      : 4

  const maxSeconds = getOfflineMaxSecondsByLevel(offlineProgressLevel)
  const appliedOfflineSeconds = Math.min(rawOfflineSeconds, maxSeconds)

  return {
    rawOfflineSeconds,
    appliedOfflineSeconds,
  }
}

const isBusDurationMode = (durationMode) => {
  return durationMode === 'bus_stops' || durationMode === 'bus_metro'
}

const getPositiveNumber = (value, fallback) => {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return value
  }

  return fallback
}

export const buildBusPhases = (slot) => {
  if (!slot || !isBusDurationMode(slot.durationMode)) return []

  const dwellSeconds = getPositiveNumber(slot.stopDwellSeconds, 30)

  if (slot.durationMode === 'bus_metro') {
    const startStops = Math.max(0, slot.startStops ?? 5)
    const endStops = Math.max(0, slot.endStops ?? 5)
    const accessMoveSeconds = getPositiveNumber(slot.accessMoveSeconds, 90)
    const expressMoveSeconds = getPositiveNumber(slot.expressMoveSeconds, 60 * 60)

    const phases = []

    for (let index = 1; index <= startStops; index += 1) {
      phases.push({
        type: 'start_stop',
        label: `출발지 ${index}/${startStops} 정류장 정차`,
        durationSeconds: dwellSeconds,
        currentStopIndex: index,
        totalStops: startStops,
        area: 'start',
      })

      if (index < startStops) {
        phases.push({
          type: 'start_move',
          label: `출발지 ${index}번 → ${index + 1}번 이동`,
          durationSeconds: accessMoveSeconds,
          fromStopIndex: index,
          toStopIndex: index + 1,
          area: 'start',
        })
      }
    }

    phases.push({
      type: 'express_move',
      label: '광역 이동 중',
      durationSeconds: expressMoveSeconds,
      area: 'express',
    })

    for (let index = 1; index <= endStops; index += 1) {
      phases.push({
        type: 'end_stop',
        label: `종착지 ${index}/${endStops} 정류장 정차`,
        durationSeconds: dwellSeconds,
        currentStopIndex: index,
        totalStops: endStops,
        area: 'end',
      })

      if (index < endStops) {
        phases.push({
          type: 'end_move',
          label: `종착지 ${index}번 → ${index + 1}번 이동`,
          durationSeconds: accessMoveSeconds,
          fromStopIndex: index,
          toStopIndex: index + 1,
          area: 'end',
        })
      }
    }

    return phases
  }

  const totalStops = Math.max(1, slot.stopCount ?? 20)
  const totalDurationSeconds = getPositiveNumber(
    slot.originalDurationSeconds ?? slot.durationSeconds,
    60 * 60,
  )

  const totalDwellSeconds = dwellSeconds * totalStops
  const moveCount = Math.max(1, totalStops - 1)
  const moveSeconds = Math.max(
    1,
    Math.floor((Math.max(totalDurationSeconds, totalDwellSeconds + moveCount) - totalDwellSeconds) / moveCount),
  )

  const phases = []

  for (let index = 1; index <= totalStops; index += 1) {
    phases.push({
      type: 'stop',
      label: `${index}/${totalStops} 정류장 정차`,
      durationSeconds: dwellSeconds,
      currentStopIndex: index,
      totalStops,
    })

    if (index < totalStops) {
      phases.push({
        type: 'move',
        label: `${index}번 → ${index + 1}번 정류장 이동`,
        durationSeconds: moveSeconds,
        fromStopIndex: index,
        toStopIndex: index + 1,
        totalStops,
      })
    }
  }

  return phases
}

export const createInitialBusProgress = (slot) => {
  const phases = buildBusPhases(slot)
  const firstPhase = phases[0]

  if (!firstPhase) {
    return null
  }

  return {
    phaseIndex: 0,
    phaseType: firstPhase.type,
    label: firstPhase.label,
    phaseDurationSeconds: firstPhase.durationSeconds,
    phaseRemainingSeconds: firstPhase.durationSeconds,
    currentStopIndex: firstPhase.currentStopIndex ?? null,
    totalStops: firstPhase.totalStops ?? null,
    area: firstPhase.area ?? null,
  }
}

const normalizeBusProgress = (slot, progress) => {
  const phases = buildBusPhases(slot)

  if (phases.length === 0) return null

  const phaseIndex = Math.max(
    0,
    Math.min(progress?.phaseIndex ?? 0, phases.length - 1),
  )

  const phase = phases[phaseIndex]

  return {
    phaseIndex,
    phaseType: phase.type,
    label: phase.label,
    phaseDurationSeconds: phase.durationSeconds,
    phaseRemainingSeconds:
      typeof progress?.phaseRemainingSeconds === 'number'
        ? Math.max(0, progress.phaseRemainingSeconds)
        : phase.durationSeconds,
    currentStopIndex: phase.currentStopIndex ?? null,
    totalStops: phase.totalStops ?? null,
    area: phase.area ?? null,
  }
}

const advanceBusProgress = ({ slot, progress, remainingSeconds, tickSeconds }) => {
  const phases = buildBusPhases(slot)

  if (phases.length === 0) {
    const nextRemainingSeconds = Math.max(0, remainingSeconds - tickSeconds)

    return {
      completed: nextRemainingSeconds <= 0,
      remainingSeconds: nextRemainingSeconds,
      busProgress: progress ?? null,
    }
  }

  let nextProgress = normalizeBusProgress(slot, progress)
  let secondsToApply = Math.max(0, tickSeconds)
  let completed = false

  while (secondsToApply > 0 && nextProgress && !completed) {
    const phaseRemainingSeconds = Math.max(0, nextProgress.phaseRemainingSeconds)

    if (phaseRemainingSeconds > secondsToApply) {
      nextProgress.phaseRemainingSeconds = phaseRemainingSeconds - secondsToApply
      secondsToApply = 0
      break
    }

    secondsToApply -= phaseRemainingSeconds

    const nextPhaseIndex = nextProgress.phaseIndex + 1

    if (nextPhaseIndex >= phases.length) {
      completed = true
      nextProgress = {
        ...nextProgress,
        phaseRemainingSeconds: 0,
      }
      break
    }

    const nextPhase = phases[nextPhaseIndex]

    nextProgress = {
      phaseIndex: nextPhaseIndex,
      phaseType: nextPhase.type,
      label: nextPhase.label,
      phaseDurationSeconds: nextPhase.durationSeconds,
      phaseRemainingSeconds: nextPhase.durationSeconds,
      currentStopIndex: nextPhase.currentStopIndex ?? null,
      totalStops: nextPhase.totalStops ?? null,
      area: nextPhase.area ?? null,
    }
  }

  const nextRemainingSeconds = completed
    ? 0
    : Math.max(0, remainingSeconds - tickSeconds)

  return {
    completed: completed || nextRemainingSeconds <= 0,
    remainingSeconds: nextRemainingSeconds,
    busProgress: nextProgress,
  }
}

/*
  택배 건수형 슬롯 처리

  규칙:
  - 1틱 = 1건
  - tickSeconds가 10이면 최대 10건 처리
  - 처리된 건수만큼 settlementAmount 누적
  - remainingParcels가 0이 되면 completed
*/
const applyTickToParcelCountSlot = (slot, tickSeconds = 1) => {
  const remainingParcels = Math.max(0, slot.remainingParcels ?? 0)
  const perParcelAmount = slot.perParcelAmount ?? 2500

  if (remainingParcels <= 0) {
    return {
      ...slot,
      remainingSeconds: 0,
      remainingParcels: 0,
      status: 'completed',
      completedAt: Date.now(),
    }
  }

  const processedThisTick = Math.min(remainingParcels, Math.max(1, tickSeconds))
  const nextRemainingParcels = Math.max(0, remainingParcels - processedThisTick)
  const nextProcessedParcels = (slot.processedParcels ?? 0) + processedThisTick
  const nextSettlementAmount =
    (slot.settlementAmount ?? 0) + processedThisTick * perParcelAmount

  if (nextRemainingParcels <= 0) {
    return {
      ...slot,
      remainingSeconds: 0,
      remainingParcels: 0,
      processedParcels: nextProcessedParcels,
      settlementAmount: nextSettlementAmount,
      status: 'completed',
      completedAt: Date.now(),
    }
  }

  return {
    ...slot,
    remainingSeconds: nextRemainingParcels,
    remainingParcels: nextRemainingParcels,
    processedParcels: nextProcessedParcels,
    settlementAmount: nextSettlementAmount,
  }
}

const applyTickToBusSingleSlot = (slot, tickSeconds = 1) => {
  const result = advanceBusProgress({
    slot,
    progress: slot.busProgress,
    remainingSeconds: slot.remainingSeconds ?? slot.durationSeconds ?? 0,
    tickSeconds,
  })

  if (result.completed) {
    return {
      ...slot,
      remainingSeconds: 0,
      busProgress: result.busProgress,
      status: 'completed',
      completedAt: Date.now(),
    }
  }

  return {
    ...slot,
    remainingSeconds: result.remainingSeconds,
    busProgress: result.busProgress,
  }
}

const applyTickToRouteVehicleRun = (slot, run, tickSeconds = 1) => {
  if (run.status === 'completed') {
    return run
  }

  if (run.status === 'waiting_departure') {
    const nextDepartureInSeconds = Math.max(
      0,
      (run.nextDepartureInSeconds ?? 0) - tickSeconds,
    )

    if (nextDepartureInSeconds > 0) {
      return {
        ...run,
        nextDepartureInSeconds,
      }
    }

    const overflowSeconds = Math.max(0, tickSeconds - (run.nextDepartureInSeconds ?? 0))
    const initialProgress = createInitialBusProgress(slot)

    const startedRun = {
      ...run,
      status: 'running',
      nextDepartureInSeconds: 0,
      startedAt: Date.now(),
      busProgress: initialProgress,
    }

    if (overflowSeconds <= 0) {
      return startedRun
    }

    return applyTickToRouteVehicleRun(slot, startedRun, overflowSeconds)
  }

  if (run.status === 'running') {
    const result = advanceBusProgress({
      slot,
      progress: run.busProgress,
      remainingSeconds: run.remainingSeconds ?? run.durationSeconds ?? slot.durationSeconds ?? 0,
      tickSeconds,
    })

    if (result.completed) {
      return {
        ...run,
        status: 'completed',
        remainingSeconds: 0,
        busProgress: result.busProgress,
        completedAt: Date.now(),
      }
    }

    return {
      ...run,
      remainingSeconds: result.remainingSeconds,
      busProgress: result.busProgress,
    }
  }

  return run
}

const applyTickToRouteSlot = (slot, tickSeconds = 1) => {
  const runs = Array.isArray(slot.routeVehicleRuns) ? slot.routeVehicleRuns : []

  if (runs.length === 0) {
    const nextRemainingSeconds = Math.max(0, (slot.remainingSeconds ?? 0) - tickSeconds)

    if (nextRemainingSeconds <= 0) {
      return {
        ...slot,
        remainingSeconds: 0,
        status: 'completed',
        routeStatus: 'completed',
        completedAt: Date.now(),
      }
    }

    return {
      ...slot,
      remainingSeconds: nextRemainingSeconds,
    }
  }

  const nextRuns = runs.map((run) => applyTickToRouteVehicleRun(slot, run, tickSeconds))
  const allCompleted = nextRuns.every((run) => run.status === 'completed')

  if (allCompleted) {
    return {
      ...slot,
      routeVehicleRuns: nextRuns,
      remainingSeconds: 0,
      status: 'completed',
      routeStatus: 'completed',
      completedAt: Date.now(),
    }
  }

  const remainingCandidates = nextRuns.map((run) => {
    if (run.status === 'waiting_departure') {
      return (run.nextDepartureInSeconds ?? 0) + (run.remainingSeconds ?? 0)
    }

    if (run.status === 'running') {
      return run.remainingSeconds ?? 0
    }

    return 0
  })

  return {
    ...slot,
    routeVehicleRuns: nextRuns,
    remainingSeconds: Math.max(0, ...remainingCandidates),
  }
}

export const applyTickToOperationSlots = (gameState, tickSeconds = 1) => {
  if (!Array.isArray(gameState.operationSlots)) {
    return gameState
  }

  gameState.operationSlots = gameState.operationSlots.map((slot) => {
    if (slot.status !== 'running') {
      return slot
    }

    if (slot.slotType === 'route') {
      return applyTickToRouteSlot(slot, tickSeconds)
    }

    if (slot.durationMode === 'parcel_count') {
      return applyTickToParcelCountSlot(slot, tickSeconds)
    }

    if (isBusDurationMode(slot.durationMode)) {
      return applyTickToBusSingleSlot(slot, tickSeconds)
    }

    if (typeof slot.remainingSeconds !== 'number') {
      return slot
    }

    const nextRemainingSeconds = Math.max(0, slot.remainingSeconds - tickSeconds)

    if (nextRemainingSeconds <= 0) {
      return {
        ...slot,
        remainingSeconds: 0,
        status: 'completed',
        completedAt: Date.now(),
      }
    }

    return {
      ...slot,
      remainingSeconds: nextRemainingSeconds,
    }
  })

  return gameState
}

export const applyTickToResearch = (gameState, tickSeconds = 1) => {
  const runningResearch = gameState.research?.running

  if (!runningResearch) {
    return gameState
  }

  if (typeof runningResearch.remainingSeconds !== 'number') {
    return gameState
  }

  const nextRemainingSeconds = Math.max(
    0,
    runningResearch.remainingSeconds - tickSeconds,
  )

  if (nextRemainingSeconds <= 0) {
    const completedResearch = {
      ...runningResearch,
      remainingSeconds: 0,
      completedAt: Date.now(),
    }

    gameState.research.completed = [
      ...(gameState.research.completed ?? []),
      completedResearch,
    ]

    gameState.research.running = null

    return gameState
  }

  gameState.research.running = {
    ...runningResearch,
    remainingSeconds: nextRemainingSeconds,
  }

  return gameState
}

export const applyGameTick = (gameState, tickSeconds = 1) => {
  if (!gameState.time) {
    gameState.time = {}
  }

  gameState.time.totalTicks = (gameState.time.totalTicks ?? 0) + tickSeconds

  applyTickToOperationSlots(gameState, tickSeconds)
  applyTickToResearch(gameState, tickSeconds)

  return gameState
}

export const createGameClock = ({
  getState,
  setState,
  onTick,
  tickMs = DEFAULT_TICK_MS,
} = {}) => {
  let timerId = null
  let lastFrameTime = 0
  let accumulatedMs = 0
  let running = false

  const loop = () => {
    if (!running) {
      return
    }

    const now = performance.now()

    if (!lastFrameTime) {
      lastFrameTime = now
    }

    const deltaMs = now - lastFrameTime
    lastFrameTime = now

    accumulatedMs += deltaMs

    while (accumulatedMs >= tickMs) {
      accumulatedMs -= tickMs

      const state = getState?.()

      if (state) {
        const nextState = applyGameTick(state, 1)

        setState?.(nextState)
        onTick?.(nextState)
      }
    }

    timerId = requestAnimationFrame(loop)
  }

  const start = () => {
    if (running) {
      return
    }

    running = true
    lastFrameTime = performance.now()
    accumulatedMs = 0

    timerId = requestAnimationFrame(loop)
  }

  const stop = () => {
    running = false

    if (timerId) {
      cancelAnimationFrame(timerId)
      timerId = null
    }

    lastFrameTime = 0
    accumulatedMs = 0
  }

  const reset = () => {
    stop()
    start()
  }

  const isRunning = () => running

  return {
    start,
    stop,
    reset,
    isRunning,
  }
}