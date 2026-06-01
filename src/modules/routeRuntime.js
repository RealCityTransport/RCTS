// RCTS FILE CONTEXT
// 파일 역할:
// - 운행 노선의 거리, 정차시간, 왕복시간, 다음 정류장/정차 상태 계산을 담당한다.
// - 시설 순서, 구간 거리, 차량 속도, 노선별 정차시간을 기준으로 1회 왕복 운행 시간을 계산한다.
//
// 현재 규칙:
// - 노선은 항상 왕복 기준으로 계산한다.
// - A → B → C 노선이면 왕복은 A → B → C → B → A 로 계산한다.
// - 구간 거리는 운행 메뉴에서 입력한 값이다.
// - 차량 최고속도 maxSpeedKmh를 기준으로 기본 이동시간 = 거리 / 속도 로 계산한다.
// - route.dwellSeconds가 있으면 각 도착 시설마다 정차시간을 추가한다.
// - 이동중이면 현재 구간과 다음 정류장을 표시한다.
// - 정차중이면 정차된 시설과 정차 남은 시간을 표시한다.
// - 1 tick = 1 second 기준이다.

export function getSegmentKey(fromId, toId) {
  return `${fromId}__${toId}`
}

export function getRouteOrderedFacilities(route, facilities = []) {
  if (!route?.orderedFacilityIds?.length) {
    return []
  }

  return route.orderedFacilityIds
    .map((facilityId) => {
      return facilities.find((facility) => facility.id === facilityId)
    })
    .filter(Boolean)
}

export function getRouteDwellSeconds(route) {
  const dwellSeconds = Number(route?.dwellSeconds || 0)

  if (!Number.isFinite(dwellSeconds) || dwellSeconds < 0) {
    return 0
  }

  return Math.floor(dwellSeconds)
}

export function getOneWayDistanceKm(route) {
  if (!route?.orderedFacilityIds?.length) {
    return 0
  }

  let totalDistance = 0

  for (let index = 0; index < route.orderedFacilityIds.length - 1; index += 1) {
    const fromId = route.orderedFacilityIds[index]
    const toId = route.orderedFacilityIds[index + 1]
    const key = getSegmentKey(fromId, toId)
    const distance = Number(route.segmentDistances?.[key] || 0)

    if (Number.isFinite(distance) && distance > 0) {
      totalDistance += distance
    }
  }

  return totalDistance
}

export function getRoundTripDistanceKm(route) {
  return getOneWayDistanceKm(route) * 2
}

export function buildRoundTripLegs(route, facilities = [], vehicle = null) {
  const orderedFacilities = getRouteOrderedFacilities(route, facilities)
  const speed = Number(vehicle?.maxSpeedKmh || route?.vehicleSnapshot?.maxSpeedKmh || 0)
  const dwellTicks = getRouteDwellSeconds(route)

  if (orderedFacilities.length < 2 || !Number.isFinite(speed) || speed <= 0) {
    return []
  }

  const legs = []

  for (let index = 0; index < orderedFacilities.length - 1; index += 1) {
    const from = orderedFacilities[index]
    const to = orderedFacilities[index + 1]
    const key = getSegmentKey(from.id, to.id)
    const distanceKm = Number(route.segmentDistances?.[key] || 0)

    if (!Number.isFinite(distanceKm) || distanceKm <= 0) {
      continue
    }

    const travelTicks = Math.ceil((distanceKm / speed) * 3600)

    legs.push({
      key,
      direction: 'outbound',
      from,
      to,
      distanceKm,
      travelTicks,
      dwellTicks,
      durationTicks: travelTicks + dwellTicks,
    })
  }

  for (let index = orderedFacilities.length - 1; index > 0; index -= 1) {
    const from = orderedFacilities[index]
    const to = orderedFacilities[index - 1]
    const sourceDistanceKey = getSegmentKey(to.id, from.id)
    const distanceKm = Number(route.segmentDistances?.[sourceDistanceKey] || 0)

    if (!Number.isFinite(distanceKm) || distanceKm <= 0) {
      continue
    }

    const travelTicks = Math.ceil((distanceKm / speed) * 3600)

    legs.push({
      key: `${from.id}__${to.id}`,
      sourceDistanceKey,
      direction: 'return',
      from,
      to,
      distanceKm,
      travelTicks,
      dwellTicks,
      durationTicks: travelTicks + dwellTicks,
    })
  }

  return legs
}

export function calculateRoundTripTicks(route, facilities = [], vehicle = null) {
  return buildRoundTripLegs(route, facilities, vehicle).reduce((sum, leg) => {
    return sum + leg.durationTicks
  }, 0)
}

export function createRouteRuntimeInfo(route, facilities = [], vehicles = [], currentTick = 0) {
  const assignedVehicle =
    route?.vehicleSnapshot ||
    vehicles.find((vehicle) => vehicle.id === route?.assignedVehicleId) ||
    null

  const legs = buildRoundTripLegs(route, facilities, assignedVehicle)
  const calculatedRoundTripTicks = legs.reduce((sum, leg) => {
    return sum + leg.durationTicks
  }, 0)

  const totalRoundTripTicks = Number(route?.roundTripTicks || calculatedRoundTripTicks || 0)

  const baseInfo = {
    legs,
    assignedVehicle,
    totalRoundTripTicks,
    remainingRoundTripTicks: totalRoundTripTicks,
    remainingToNextStopTicks: 0,
    remainingCurrentPhaseTicks: 0,
    nextFacility: null,
    currentFacility: null,
    stoppedFacility: null,
    currentLeg: null,
    phase: 'idle',
    phaseLabel: '대기중',
    progressPercent: 0,
  }

  if (route?.status !== 'running') {
    return {
      ...baseInfo,
      isRunning: false,
    }
  }

  const startedAtTick =
    route.startedAtTick === null || route.startedAtTick === undefined
      ? currentTick
      : Number(route.startedAtTick)

  const elapsedTicks = Math.max(0, currentTick - startedAtTick)
  const remainingRoundTripTicks = Math.max(0, totalRoundTripTicks - elapsedTicks)

  let accumulatedTicks = 0

  for (const leg of legs) {
    const travelEndTick = accumulatedTicks + leg.travelTicks
    const legEndTick = accumulatedTicks + leg.durationTicks

    if (elapsedTicks < travelEndTick) {
      const remainingToNextStopTicks = Math.max(0, travelEndTick - elapsedTicks)

      return {
        ...baseInfo,
        isRunning: true,
        remainingRoundTripTicks,
        remainingToNextStopTicks,
        remainingCurrentPhaseTicks: remainingToNextStopTicks,
        nextFacility: leg.to,
        currentFacility: leg.from,
        stoppedFacility: null,
        currentLeg: leg,
        phase: 'moving',
        phaseLabel: '이동중',
        progressPercent:
          totalRoundTripTicks > 0
            ? Math.min(100, Math.round((elapsedTicks / totalRoundTripTicks) * 100))
            : 0,
      }
    }

    if (elapsedTicks < legEndTick) {
      const remainingDwellTicks = Math.max(0, legEndTick - elapsedTicks)

      return {
        ...baseInfo,
        isRunning: true,
        remainingRoundTripTicks,
        remainingToNextStopTicks: remainingDwellTicks,
        remainingCurrentPhaseTicks: remainingDwellTicks,
        nextFacility: null,
        currentFacility: leg.to,
        stoppedFacility: leg.to,
        currentLeg: leg,
        phase: 'dwell',
        phaseLabel: '정차중',
        progressPercent:
          totalRoundTripTicks > 0
            ? Math.min(100, Math.round((elapsedTicks / totalRoundTripTicks) * 100))
            : 0,
      }
    }

    accumulatedTicks = legEndTick
  }

  return {
    ...baseInfo,
    isRunning: true,
    remainingRoundTripTicks,
    phase: 'completed',
    phaseLabel: '도착 처리중',
    progressPercent: 100,
  }
}

export function formatTicks(totalTicks) {
  const safeTicks = Math.max(0, Math.ceil(Number(totalTicks) || 0))
  const hours = Math.floor(safeTicks / 3600)
  const minutes = Math.floor((safeTicks % 3600) / 60)
  const seconds = safeTicks % 60

  if (hours > 0) {
    return `${hours}시간 ${minutes}분 ${seconds}초`
  }

  if (minutes > 0) {
    return `${minutes}분 ${seconds}초`
  }

  return `${seconds}초`
}