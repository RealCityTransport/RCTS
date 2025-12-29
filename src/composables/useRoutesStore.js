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
    // 완공 여부
    built: !!st.isBuilt,
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
    isBuilt: !!s.built,
  }))
}

/** 이 노선이 "시공중" 잠금 상태인지 여부 */
function isConstructionLocked(route) {
  return route?.status === '건설중'
}

/** 운영중 + 완공된 정류장이 있는지 여부 */
function hasBuiltStops(route) {
  if (!route || !Array.isArray(route.stops)) return false
  return route.stops.some((s) => s.built)
}

/** 두 배열의 id 순서가 같은지 비교 */
function isSameIdOrder(listA, listB) {
  if (listA.length !== listB.length) return false
  for (let i = 0; i < listA.length; i += 1) {
    if (listA[i] !== listB[i]) return false
  }
  return true
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

  /** 변경 시공(2시간) 시작 헬퍼
   * - 운영중 상태에서 완공된 정류장의 순서/거리/구조를 바꾸면 호출
   */
  async function startReconstructionWithStops(route, nextStops, reason) {
    if (!route) return

    const nowMs = Date.now()
    const twoHoursMs = 2 * 60 * 60 * 1000

    const resequenced = (Array.isArray(nextStops) ? nextStops : []).map(
      (s, idx) => ({
        ...s,
        seq: idx + 1,
        distanceFromPrevKm:
          idx === 0
            ? 0
            : typeof s.distanceFromPrevKm === 'number'
              ? s.distanceFromPrevKm
              : 0,
        // 변경 시공에 들어가면 모두 "다시 시공 필요" 상태이므로 built=false
        built: false,
      }),
    )

    const stationsPayload = uiStopsToDbStations(resequenced)

    await patchRoute(route.id, {
      status: '건설중',
      constructionStartedAt: nowMs,
      constructionEndsAt: nowMs + twoHoursMs,
      stations: stationsPayload,
    })

    // 선택 정류장 유지 시도
    if (resequenced.length > 0 && selectedStopId.value) {
      const exists = resequenced.some((s) => s.id === selectedStopId.value)
      if (!exists) {
        selectedStopId.value = resequenced[0].id
      }
    }

    addLog(
      'route:update',
      `노선 "${route.name}"의 구조가 변경되어 변경 시공(약 2시간)을 시작합니다.`,
      {
        routeId: route.id,
        routeName: route.name,
        reason,
      },
    )
  }

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
   * - 건설중(시공중)인 노선에서는 추가 불가
   * - 운영중일 때 추가된 정류장은 built=false (설계중)으로 취급
   */
  async function addStop() {
    const route = selectedRoute.value
    if (!route) return
    if (isConstructionLocked(route)) {
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
      built: false, // 새 정류장은 항상 미완공(설계중)으로 시작
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
   * - 건설중(시공중)인 노선에서는 구조 변경 불가
   * - 운영중 + 완공된 정류장의 순서가 바뀌면 → 변경 시공(2시간) 시작
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

    const oldStops = Array.isArray(route.stops) ? route.stops : []

    const safeStops = Array.isArray(newStops)
      ? newStops.map((s, idx) => ({
          ...s,
          seq: idx + 1,
          distanceFromPrevKm:
            idx === 0 ? 0 : s.distanceFromPrevKm ?? s.distanceFromPrevKm,
          built: !!s.built,
        }))
      : []

    // 운영중 + 완공된 정류장이 있고, 그 순서가 바뀌었다면 → 변경 시공
    if (route.status === '운영중' && hasBuiltStops(route)) {
      const oldBuiltOrder = oldStops
        .filter((s) => s.built)
        .map((s) => s.id)
      const newBuiltOrder = safeStops
        .filter((s) => s.built)
        .map((s) => s.id)

      if (!isSameIdOrder(oldBuiltOrder, newBuiltOrder)) {
        await startReconstructionWithStops(
          route,
          safeStops,
          'reorder-stops',
        )
        return
      }
    }

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

    // "운영중"으로 전환될 때: 현재 정류장들을 모두 built=true(완공)로 세팅
    if (patch.status === '운영중') {
      const currentStops = Array.isArray(route.stops) ? route.stops : []
      const builtStops = currentStops.map((s, idx) => ({
        ...s,
        seq: s.seq ?? idx + 1,
        built: true,
      }))
      patch.stations = uiStopsToDbStations(builtStops)
    }

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

  /** 정류장 정보 업데이트
   * - 건설중(건설중)인 노선에서는 StopDetailPanel 쪽에서 거리 변경 UI를 이미 막고 있음
   * - 운영중 + 완공된 정류장의 "거리"를 바꾸면 → 변경 시공(2시간) 시작
   * - 이름만 바꾸는 건 재시공 없이 허용
   */
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
      built: prev.built, // built 플래그는 여기서 덮어쓰지 않음
    }

    const nextStops = [...oldStops]
    nextStops[stopIndex] = nextStop

    const newDistance =
      typeof nextStop.distanceFromPrevKm === 'number'
        ? nextStop.distanceFromPrevKm
        : oldDistance

    const nameChanged =
      updatedStop.name && updatedStop.name !== oldName
    const distanceChanged =
      newDistance != null &&
      oldDistance != null &&
      newDistance !== oldDistance

    // 운영중 + 완공된 정류장의 거리 변경 → 변경 시공 시작
    if (
      route.status === '운영중' &&
      prev.built &&
      distanceChanged
    ) {
      await startReconstructionWithStops(
        route,
        nextStops,
        'update-distance',
      )
      return
    }

    const stationsPayload = uiStopsToDbStations(nextStops)
    await patchRoute(route.id, { stations: stationsPayload })

    selectedStopId.value = updatedStop.id

    if (nameChanged) {
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

    if (distanceChanged) {
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

  /** 노선 삭제 (상태 무관, 정류장 포함 전부 삭제) */
  async function deleteRoute(routeId) {
    const route =
      routes.value.find((r) => r.id === routeId) ?? selectedRoute.value
    if (!route) return

    await removeRouteFromDb(route.id)

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

  /** 정류장 삭제
   * - 건설중(시공중)인 노선에서는 삭제 불가
   * - 운영중 + 완공된 정류장을 삭제하면 → 변경 시공(2시간) 시작
   * - 미완공(설계중) 정류장 삭제는 재시공 없이 허용
   */
  async function deleteStop(stopId) {
    const route = selectedRoute.value
    if (!route) return

    if (isConstructionLocked(route)) {
      addLog(
        'stop:delete:blocked',
        `노선 "${route.name}"은 시공 중이라 정류장을 삭제할 수 없습니다.`,
        {
          routeId: route.id,
          routeName: route.name,
        },
      )
      return
    }

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
      built: !!s.built,
    }))

    // 운영중 + 완공된 정류장 삭제 → 변경 시공
    if (route.status === '운영중' && target.built) {
      await startReconstructionWithStops(
        route,
        resequenced,
        'delete-stop',
      )
      return
    }

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
