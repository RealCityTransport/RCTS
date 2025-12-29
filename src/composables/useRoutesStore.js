// src/composables/useRoutesStore.js
import { ref, computed, watch } from 'vue'
import { useSystemLog } from '@/composables/useSystemLog'
import { useRoutes } from '@/features/routes/useRoutes'

const selectedRouteId = ref(null)
const selectedStopId = ref(null)

/** 타임스탬프(ms)를 'YYYY-MM-DD HH:MM' 문자열로 변환 */
function formatDateTime(ms) {
  if (!ms) return ''
  const d = new Date(ms)
  const yyyy = d.getFullYear()
  const MM = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${yyyy}-${MM}-${dd} ${hh}:${mm}`
}

/**
 * DB Route → UI Route 변환
 */
function mapDbRouteToUi(dbRoute) {
  const stations = Array.isArray(dbRoute.stations) ? dbRoute.stations : []

  const stops = stations.map((st, index) => ({
    id: st.id,
    seq: st.order ?? index + 1,
    name: st.name,
    kind: 'stop',
    role: st.isTerminal
      ? 'terminal'
      : st.isMajor
        ? 'hub'
        : 'normal',
    distanceFromPrevKm:
      typeof st.distanceFromPrevKm === 'number'
        ? st.distanceFromPrevKm
        : index === 0
          ? 0
          : 0,
  }))

  return {
    id: dbRoute.id,
    name: dbRoute.name,
    type: dbRoute.type,
    status: dbRoute.status,
    transport: dbRoute.transport,
    tags: dbRoute.tags ?? [],
    stopsCount: stops.length,
    stops,
    lastUpdatedAt: formatDateTime(
      dbRoute.lastUpdatedAt ?? dbRoute.updatedAt ?? dbRoute.createdAt,
    ),
    createdAt: formatDateTime(dbRoute.createdAt),
    avgLoadFactor: dbRoute.avgLoadFactor ?? 0,
    revenueSummary: dbRoute.revenueSummary ?? {
      lastHour: 0,
      lastDay: 0,
      total: 0,
    },
    constructionStartedAt:
      typeof dbRoute.constructionStartedAt === 'number'
        ? dbRoute.constructionStartedAt
        : null,
    constructionEndsAt:
      typeof dbRoute.constructionEndsAt === 'number'
        ? dbRoute.constructionEndsAt
        : null,
  }
}

/**
 * UI stops → DB stations 변환
 */
function uiStopsToDbStations(stops) {
  const list = Array.isArray(stops) ? stops : []
  return list.map((s, idx) => ({
    id: s.id,
    name: s.name,
    order: s.seq ?? idx + 1,
    isTerminal: s.role === 'terminal',
    isMajor: s.role === 'hub' || s.role === 'transfer',
    distanceFromPrevKm:
      typeof s.distanceFromPrevKm === 'number'
        ? s.distanceFromPrevKm
        : idx === 0
          ? 0
          : 0,
  }))
}

/** 이 노선이 "시공중" 잠금 상태인지 여부 */
function isConstructionLocked(route) {
  return route?.status === '건설중'
}

export function useRoutesStore() {
  const { addLog } = useSystemLog()

  const {
    routes: dbRoutes,
    addRoute,
    patchRoute,
    removeRoute: removeRouteFromDb,
  } = useRoutes()

  const routes = computed(() => {
    return (dbRoutes.value || []).map(mapDbRouteToUi)
  })

  const selectedRoute = computed(() => {
    return routes.value.find((r) => r.id === selectedRouteId.value) ?? null
  })

  const selectedStop = computed(() => {
    const route = selectedRoute.value
    if (!route || !Array.isArray(route.stops)) return null
    return route.stops.find((s) => s.id === selectedStopId.value) ?? null
  })

  watch(
    routes,
    (list) => {
      // 삭제 등으로 사라진 경우 selection 정리
      if (
        selectedRouteId.value &&
        !list.some((r) => r.id === selectedRouteId.value)
      ) {
        selectedRouteId.value = null
        selectedStopId.value = null
      }

      // 아무 것도 선택 안 돼 있으면 첫 노선 자동 선택
      if (!selectedRouteId.value && list.length > 0) {
        selectedRouteId.value = list[0].id
        selectedStopId.value = null
      }
    },
    { immediate: true },
  )

  /** 새 노선 생성 (초기 상태: 설계중) */
  async function createRoute() {
    const nextIndex = routes.value.length + 1
    const name = `새 노선 ${nextIndex}`

    const payload = {
      name,
      status: '설계중',
      type: '가상',
      shape: '순환',
      transport: 'bus',
      description: '',
      color: '#888888',
      lineCode: '',
      stations: [],
      tags: ['초기', '미완성'],
      constructionStartedAt: null,
      constructionEndsAt: null,
    }

    const newId = await addRoute(payload)

    if (newId) {
      selectedRouteId.value = newId
      selectedStopId.value = null
    }

    addLog('route:create', `새 노선이 생성되었습니다: "${name}"`, {
      routeId: newId,
      routeName: name,
    })
  }

  function selectRoute(routeId) {
    selectedRouteId.value = routeId
    selectedStopId.value = null

    const route = routes.value.find((r) => r.id === routeId)
    if (route) {
      addLog('route:update', `노선을 선택했습니다: "${route.name}"`, {
        routeId: route.id,
        routeName: route.name,
      })
    }
  }

  function selectStop(stopId) {
    selectedStopId.value = stopId

    const route = selectedRoute.value
    if (!route || !Array.isArray(route.stops)) return

    const stop = route.stops.find((s) => s.id === stopId)
    if (!stop) return

    addLog('stop:update', `정류장을 선택했습니다: "${stop.name}"`, {
      routeId: route.id,
      routeName: route.name,
      stopName: stop.name,
    })
  }

  /** 정류장 추가
   * - 시공중(건설중)인 노선에서는 추가 자체 불가
   */
  async function addStop() {
    const route = selectedRoute.value
    if (!route) return
    if (isConstructionLocked(route)) {
      // 잠긴 상태에서는 삭제만 허용 (요청한 규칙)
      addLog(
        'stop:create:blocked',
        `노선 "${route.name}"은 시공 중이라 정류장을 추가할 수 없습니다.`,
        { routeId: route.id, routeName: route.name },
      )
      return
    }

    const currentStops = Array.isArray(route.stops) ? [...route.stops] : []

    const nextSeq =
      currentStops.reduce((max, s) => Math.max(max, s.seq || 0), 0) + 1

    const newStopId = `${route.id}-s${String(nextSeq).padStart(2, '0')}`

    const defaultDistance =
      nextSeq === 1 ? 0 : Number((2 + Math.random() * 3).toFixed(1))

    const newStop = {
      id: newStopId,
      seq: nextSeq,
      name: `새 정류장 ${nextSeq}`,
      kind: 'stop',
      role: 'normal',
      distanceFromPrevKm: defaultDistance,
    }

    const nextStops = [...currentStops, newStop]

    const stationsPayload = uiStopsToDbStations(nextStops)
    await patchRoute(route.id, { stations: stationsPayload })

    selectedStopId.value = newStopId

    addLog(
      'stop:create',
      `노선 "${route.name}"에 정류장이 추가되었습니다: "${newStop.name}" (이전 정류장까지 ${defaultDistance}km)`,
      {
        routeId: route.id,
        routeName: route.name,
        stopName: newStop.name,
      },
    )
  }

  /** 정류장 순서 재정렬
   * - 시공중(건설중)인 노선에서는 구조 변경 불가
   */
  async function reorderStops(newStops) {
    const route = selectedRoute.value
    if (!route) return
    if (isConstructionLocked(route)) {
      addLog(
        'stop:reorder:blocked',
        `노선 "${route.name}"은 시공 중이라 정류장 순서를 변경할 수 없습니다.`,
        { routeId: route.id, routeName: route.name },
      )
      return
    }

    const safeStops = Array.isArray(newStops)
      ? newStops.map((s, idx) => ({
          ...s,
          seq: idx + 1,
          distanceFromPrevKm:
            idx === 0 ? 0 : s.distanceFromPrevKm ?? s.distanceFromPrevKm,
        }))
      : []

    const stationsPayload = uiStopsToDbStations(safeStops)
    await patchRoute(route.id, { stations: stationsPayload })

    addLog(
      'stop:reorder',
      `노선 "${route.name}"의 정류장 순서가 변경되었습니다.`,
      {
        routeId: route.id,
        routeName: route.name,
      },
    )
  }

  /** 노선 정보 업데이트 (이름/운송수단/상태/시공시간 등) */
  async function updateRoute(updatedRoute) {
    const route = selectedRoute.value
    if (!route || !updatedRoute) return

    const oldName = route.name
    const patch = {}

    if (typeof updatedRoute.name === 'string') {
      patch.name = updatedRoute.name
    }
    if (typeof updatedRoute.type === 'string') {
      patch.type = updatedRoute.type
    }
    if (typeof updatedRoute.status === 'string') {
      patch.status = updatedRoute.status
    }
    if (typeof updatedRoute.transport === 'string') {
      patch.transport = updatedRoute.transport
    }
    if (Array.isArray(updatedRoute.tags)) {
      patch.tags = updatedRoute.tags
    }
    if (typeof updatedRoute.description === 'string') {
      patch.description = updatedRoute.description
    }
    if (typeof updatedRoute.color === 'string') {
      patch.color = updatedRoute.color
    }
    if (typeof updatedRoute.lineCode === 'string') {
      patch.lineCode = updatedRoute.lineCode
    }
    if (
      updatedRoute.constructionStartedAt === null ||
      typeof updatedRoute.constructionStartedAt === 'number'
    ) {
      patch.constructionStartedAt = updatedRoute.constructionStartedAt
    }
    if (
      updatedRoute.constructionEndsAt === null ||
      typeof updatedRoute.constructionEndsAt === 'number'
    ) {
      patch.constructionEndsAt = updatedRoute.constructionEndsAt
    }

    if (Object.keys(patch).length === 0) return

    await patchRoute(route.id, patch)

    selectedRouteId.value = route.id

    if (patch.name && patch.name !== oldName) {
      addLog(
        'route:update',
        `노선 이름이 변경되었습니다: "${oldName}" → "${patch.name}"`,
        {
          routeId: route.id,
          routeName: patch.name,
        },
      )
    }

    if (patch.status === '건설중') {
      addLog(
        'route:update',
        `노선 "${route.name}"이(가) 시공 단계로 전환되었습니다.`,
        {
          routeId: route.id,
          routeName: route.name,
        },
      )
    }

    if (patch.status === '운영중') {
      addLog(
        'route:update',
        `노선 "${route.name}"의 시공이 완료되어 운영을 시작합니다.`,
        {
          routeId: route.id,
          routeName: route.name,
        },
      )
    }
  }

  /** 정류장 정보 업데이트 */
  async function updateStop(updatedStop) {
    const route = selectedRoute.value
    if (!route || !updatedStop) return

    const oldStops = Array.isArray(route.stops) ? [...route.stops] : []
    const stopIndex = oldStops.findIndex((s) => s.id === updatedStop.id)
    if (stopIndex === -1) return

    const prev = oldStops[stopIndex]
    const oldName = prev.name
    const oldDistance =
      typeof prev.distanceFromPrevKm === 'number'
        ? prev.distanceFromPrevKm
        : null

    const nextStop = {
      ...prev,
      ...updatedStop,
    }

    const nextStops = [...oldStops]
    nextStops[stopIndex] = nextStop

    const newDistance =
      typeof nextStop.distanceFromPrevKm === 'number'
        ? nextStop.distanceFromPrevKm
        : oldDistance

    const stationsPayload = uiStopsToDbStations(nextStops)
    await patchRoute(route.id, { stations: stationsPayload })

    selectedStopId.value = updatedStop.id

    if (updatedStop.name && updatedStop.name !== oldName) {
      addLog(
        'stop:update',
        `정류장 이름이 변경되었습니다: "${oldName}" → "${updatedStop.name}"`,
        {
          routeId: route.id,
          routeName: route.name,
          stopName: updatedStop.name,
        },
      )
    }

    if (
      newDistance != null &&
      oldDistance != null &&
      newDistance !== oldDistance
    ) {
      addLog(
        'stop:update',
        `정류장 "${nextStop.name}"의 이전 정류장까지 거리가 ${oldDistance}km → ${newDistance}km 로 변경되었습니다.`,
        {
          routeId: route.id,
          routeName: route.name,
          stopName: nextStop.name,
        },
      )
    }
  }

  /** 노선 삭제 (상태 무관, 정류장 포함 전부 삭제)
   * - string: routeId
   * - object: { routeId, ... } 또는 { id, ... }
   */
  async function deleteRoute(routeArg) {
    const routeId =
      typeof routeArg === 'string'
        ? routeArg
        : routeArg?.routeId ?? routeArg?.id ?? null

    if (!routeId) return

    const route =
      routes.value.find((r) => r.id === routeId) ?? selectedRoute.value
    if (!route) return

    await removeRouteFromDb(routeId)

    if (selectedRouteId.value === route.id) {
      selectedRouteId.value = null
      selectedStopId.value = null
    }

    addLog(
      'route:delete',
      `노선 "${route.name}"이(가) 삭제되었습니다.`,
      {
        routeId: route.id,
        routeName: route.name,
      },
    )
  }

  /** 정류장 삭제 (상태 무관, 항상 허용)
   * - string: stopId
   * - object: { routeId, stopId }
   */
  async function deleteStop(stopArg) {
    const stopId =
      typeof stopArg === 'string'
        ? stopArg
        : stopArg?.stopId ?? stopArg?.id ?? null

    if (!stopId) return

    // payload에 routeId가 오면 그걸 우선 사용
    const routeFromPayloadId =
      typeof stopArg === 'object' ? stopArg?.routeId : null

    const route =
      (routeFromPayloadId
        ? routes.value.find((r) => r.id === routeFromPayloadId)
        : selectedRoute.value) || null

    if (!route) return

    const oldStops = Array.isArray(route.stops) ? [...route.stops] : []
    const target = oldStops.find((s) => s.id === stopId)
    if (!target) return

    const filtered = oldStops.filter((s) => s.id !== stopId)

    // seq 재지정 + 첫 정류장 거리 0km 고정
    const resequenced = filtered.map((s, idx) => ({
      ...s,
      seq: idx + 1,
      distanceFromPrevKm:
        idx === 0
          ? 0
          : typeof s.distanceFromPrevKm === 'number'
            ? s.distanceFromPrevKm
            : 0,
    }))

    const stationsPayload = uiStopsToDbStations(resequenced)
    await patchRoute(route.id, { stations: stationsPayload })

    if (selectedStopId.value === stopId) {
      selectedStopId.value = resequenced[0]?.id ?? null
    }

    addLog(
      'stop:delete',
      `노선 "${route.name}"에서 정류장 "${target.name}"이(가) 삭제되었습니다.`,
      {
        routeId: route.id,
        routeName: route.name,
        stopName: target.name,
      },
    )
  }

  return {
    routes,
    selectedRouteId,
    selectedStopId,
    selectedRoute,
    selectedStop,
    createRoute,
    selectRoute,
    selectStop,
    addStop,
    reorderStops,
    updateRoute,
    updateStop,
    deleteRoute,
    deleteStop,
  }
}
