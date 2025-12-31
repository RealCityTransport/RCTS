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
    built: !!st.isBuilt, // 완공 여부
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
    // 시공 시간은 더 이상 사용하지 않지만, DB에 남아있을 수 있으니 매핑만 유지
    constructionStartedAt:
      typeof dbRoute.constructionStartedAt === 'number'
        ? dbRoute.constructionStartedAt
        : null,
    constructionEndsAt:
      typeof dbRoute.constructionEndsAt === 'number'
        ? dbRoute.constructionEndsAt
        : null,
    // 시설 변경 대기 목록
    pendingChanges: Array.isArray(dbRoute.pendingChanges)
      ? dbRoute.pendingChanges
      : [],
    pendingChangeCount: dbRoute.pendingChangeCount ?? 0,
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

/** 시공 잠금 여부
 *  시간 기반 시공 개념을 제거했으므로, 일단 항상 false.
 *  (기존에 '건설중' 상태가 남아 있어도 편집을 막지 않는다.)
 */
function isConstructionLocked(_route) {
  return false
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

/** 새 정류장용 유니크 ID 생성 (seq와 무관하게 항상 고유) */
function generateStopId(routeId) {
  const rand = Math.random().toString(36).slice(2, 10)
  const ts = Date.now().toString(36)
  return `${routeId}-s-${ts}-${rand}`
}

/** 시설 변경 내역 ID 생성 */
function generateChangeId() {
  return `chg-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`
}

/** 기존 route의 pendingChanges에 변경 내역 1건 추가한 새 배열 반환 */
function buildPendingChanges(route, kind, meta = {}) {
  const prev =
    (route && Array.isArray(route.pendingChanges)
      ? route.pendingChanges
      : []) ?? []

  const entry = {
    id: generateChangeId(),
    kind, // 'add-stop' | 'delete-stop' | 'reorder-stops' | 'update-distance' 등
    createdAt: Date.now(),
    ...meta,
  }

  return [...prev, entry]
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

  /** 시설 변경 확정 헬퍼
   * - 운영중 노선에서 pendingChanges가 쌓인 상태에서 한 번에 확정할 때 호출
   * - 별도의 시간 개념 없이, 바로 구조/정류장을 갱신하고 pending을 비운다.
   */
  async function startReconstructionWithStops(route, nextStops, reason) {
    if (!route) return

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
        // 확정 시점에서 모두 “완공된 정류장”으로 본다.
        built: true,
      }),
    )

    const stationsPayload = uiStopsToDbStations(resequenced)

    await patchRoute(route.id, {
      status: '운영중', // 상태는 계속 운영중으로 유지
      stations: stationsPayload,
      pendingChanges: [],
      pendingChangeCount: 0,
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
      `노선 "${route.name}"의 시설 변경을 확정하여 구조를 갱신했습니다.`,
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
      // 시공 시간은 더 이상 사용하지 않으므로 생성 시점에 넣지 않는다.
      pendingChanges: [],
      pendingChangeCount: 0,
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
   * - 건설중(시공중) 잠금 개념은 현재 사용하지 않음
   * - 설계중: 그냥 설계 중인 정류장으로 추가
   * - 운영중: "신설 정류장"으로 추가 + 시설 변경 내역에 기록
   */
  async function addStop() {
    const route = selectedRoute.value
    if (!route) return
    if (isConstructionLocked(route)) {
      // 현재는 호출되지 않지만, 문구는 남겨둠
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

    const newStopId = generateStopId(route.id)

    const defaultDistance =
      nextSeq === 1 ? 0 : Number((2 + Math.random() * 3).toFixed(1))

    const newStop = {
      id: newStopId,
      seq: nextSeq,
      name: `새 정류장 ${nextSeq}`,
      kind: 'stop',
      role: 'normal',
      distanceFromPrevKm: defaultDistance,
      built: route.status === '운영중' ? false : false,
    }

    const nextStops = [...currentStops, newStop]
    const stationsPayload = uiStopsToDbStations(nextStops)

    const patch = {
      stations: stationsPayload,
    }

    // 운영중에 새 정류장을 추가한 경우 → 시설 변경 대기 목록에 기록
    if (route.status === '운영중') {
      const pendingChanges = buildPendingChanges(route, 'add-stop', {
        stopId: newStop.id,
        stopName: newStop.name,
        detail: '정류장 추가',
      })
      patch.pendingChanges = pendingChanges
      patch.pendingChangeCount = pendingChanges.length
    }

    await patchRoute(route.id, patch)

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
   * - 건설중(시공중) 잠금은 현재 사용하지 않음
   * - 설계중: 전체 자유 변경
   * - 운영중:
   *   · 완공 정류장 순서를 바꾸면 → "시설 변경 내역"에만 기록 (운영중 유지)
   *   · 확정 버튼을 눌러야 실제로 구조를 한번에 갱신
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

    const stationsPayload = uiStopsToDbStations(safeStops)

    const patch = {
      stations: stationsPayload,
    }

    // 운영중 + 완공된 정류장의 순서가 바뀐 경우 → 시설 변경 내역에만 추가
    if (route.status === '운영중' && hasBuiltStops(route)) {
      const oldBuiltOrder = oldStops
        .filter((s) => s.built)
        .map((s) => s.id)
      const newBuiltOrder = safeStops
        .filter((s) => s.built)
        .map((s) => s.id)

      if (!isSameIdOrder(oldBuiltOrder, newBuiltOrder)) {
        const pendingChanges = buildPendingChanges(
          route,
          'reorder-stops',
          {
            detail: '정류장 순서 변경',
          },
        )
        patch.pendingChanges = pendingChanges
        patch.pendingChangeCount = pendingChanges.length
      }
    }

    await patchRoute(route.id, patch)

    addLog(
      'stop:reorder',
      `노선 "${route.name}"의 정류장 순서가 변경되었습니다.`,
      {
        routeId: route.id,
        routeName: route.name,
      },
    )
  }

  /** 노선 정보 업데이트 (이름/운송수단/상태 등) */
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
      patch.pendingChanges = []
      patch.pendingChangeCount = 0
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

    if (patch.status === '운영중') {
      addLog(
        'route:update',
        `노선 "${route.name}"이(가) 운영을 시작합니다.`,
        {
          routeId: route.id,
          routeName: route.name,
        },
      )
    }
  }

  /** 정류장 정보 업데이트
   * - 시간 기반 재시공 개념 제거
   * - 운영중 + 완공된 정류장의 "거리"를 바꾸면 → 시설 변경 내역에만 추가 (즉시 시공 없음)
   * - 이름만 바꾸는 건 재시공/시설 변경 없이 바로 적용
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
      typeof updatedStop.name === 'string' &&
      updatedStop.name !== oldName
    const distanceChanged =
      newDistance != null &&
      oldDistance != null &&
      newDistance !== oldDistance

    const stationsPayload = uiStopsToDbStations(nextStops)
    const patch = {
      stations: stationsPayload,
    }

    // 운영중 + 완공된 정류장의 거리 변경 → 시설 변경 내역에만 추가
    if (route.status === '운영중' && prev.built && distanceChanged) {
      const pendingChanges = buildPendingChanges(
        route,
        'update-distance',
        {
          stopId: prev.id,
          stopName: prev.name,
          fromKm: oldDistance,
          toKm: newDistance,
          detail: '정류장 간 거리 변경',
        },
      )
      patch.pendingChanges = pendingChanges
      patch.pendingChangeCount = pendingChanges.length
    }

    await patchRoute(route.id, patch)

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
   * - 시간 기반 변경 시공 개념 제거
   * - 운영중 + 완공된 정류장 삭제 → 시설 변경 내역에만 추가
   * - 미완공(설계중/추가분) 정류장 삭제는 바로 적용
   * - 중간 정류장을 삭제할 때는 앞/뒤 구간 거리를 합쳐서 새 인접 구간 거리로 사용
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
    const targetIndex = oldStops.findIndex((s) => s.id === stopId)
    if (targetIndex === -1) return

    const target = oldStops[targetIndex]

    const prevStop =
      targetIndex > 0 ? oldStops[targetIndex - 1] : null
    const nextStop =
      targetIndex < oldStops.length - 1
        ? oldStops[targetIndex + 1]
        : null

    const filtered = oldStops.filter((s) => s.id !== stopId)

    const resequenced = filtered.map((s, idx) => {
      let distance = 0

      if (idx === 0) {
        distance = 0
      } else if (prevStop && nextStop && s.id === nextStop.id) {
        const prevDist =
          typeof prevStop.distanceFromPrevKm === 'number'
            ? prevStop.distanceFromPrevKm
            : 0
        const nextDist =
          typeof nextStop.distanceFromPrevKm === 'number'
            ? nextStop.distanceFromPrevKm
            : 0
        distance = prevDist + nextDist
      } else {
        distance =
          typeof s.distanceFromPrevKm === 'number'
            ? s.distanceFromPrevKm
            : 0
      }

      return {
        ...s,
        seq: idx + 1,
        distanceFromPrevKm: distance,
        built: !!s.built,
      }
    })

    const stationsPayload = uiStopsToDbStations(resequenced)
    const patch = {
      stations: stationsPayload,
    }

    // 운영중 + 완공된 정류장 삭제 → 시설 변경 내역에만 추가
    if (route.status === '운영중' && target.built) {
      const pendingChanges = buildPendingChanges(
        route,
        'delete-stop',
        {
          stopId: target.id,
          stopName: target.name,
          detail: '정류장 삭제',
        },
      )
      patch.pendingChanges = pendingChanges
      patch.pendingChangeCount = pendingChanges.length
    }

    await patchRoute(route.id, patch)

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

  /** 운영중 노선에 쌓여 있는 시설 변경 내역을 한 번에 확정
   *  - 더 이상 시간 기반 변경 시공 없음
   *  - confirm 호출 즉시 구조/정류장이 갱신되고, pending이 비워진다.
   */
  async function confirmReconstruction(routeId) {
    const route =
      routes.value.find((r) => r.id === routeId) ?? selectedRoute.value
    if (!route) return
    if (route.status !== '운영중') return
    if (!route.pendingChangeCount) return

    const nextStops = Array.isArray(route.stops) ? route.stops : []
    await startReconstructionWithStops(
      route,
      nextStops,
      'confirm-pending-changes',
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
    confirmReconstruction,
  }
}
