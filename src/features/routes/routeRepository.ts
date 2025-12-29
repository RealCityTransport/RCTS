// src/features/routes/routeRepository.ts
import { rtdb } from '@/libs/firebase'
import {
  ref as dbRef,
  onValue,
  off,
  push,
  set,
  update,
  remove,
} from 'firebase/database'
import type { TransportMode } from './transportTypes'

/**
 * 노선 상태
 * - 설계중 / 건설중 / 운영중
 */
export type RouteStatus = '설계중' | '건설중' | '운영중'

/**
 * 노선 유형
 * - 가상 / 시설
 */
export type RouteType = '가상' | '시설'

/**
 * 노선 형태
 * - 순환 / 왕복 / 직선
 */
export type RouteShape = '순환' | '왕복' | '직선'

/**
 * 노선 내 역(정류장) 정보
 */
export interface RouteStation {
  id: string
  name: string
  order: number
  isTerminal: boolean
  isMajor: boolean
  /** 이전 정류장까지 거리 (km) */
  distanceFromPrevKm: number
}

/**
 * DB에 저장되는 노선 기본 구조
 */
export interface Route {
  id?: string
  name: string
  status: RouteStatus
  type: RouteType
  shape: RouteShape
  /** 이 노선의 기본 운송수단 (bus/truck/rail/air/ship/space) */
  transport: TransportMode
  description: string
  color: string
  lineCode: string
  stations: RouteStation[]
  tags?: string[]
  /** 시공 시작 시각(ms) – 설계중일 땐 null */
  constructionStartedAt?: number | null
  /** 시공 완료 예정 시각(ms) – 설계중일 땐 null */
  constructionEndsAt?: number | null
  createdAt: number
  updatedAt: number
  lastUpdatedAt: number
}

/**
 * 노선 생성/수정 시 사용할 payload
 */
export interface RoutePayload {
  name: string
  status: RouteStatus
  type: RouteType
  shape: RouteShape
  transport: TransportMode
  description?: string
  color?: string
  lineCode?: string
  stations: RouteStation[]
  tags?: string[]
  constructionStartedAt?: number | null
  constructionEndsAt?: number | null
}

/**
 * 유저별 노선 리스트 경로: /routes/{uid}
 */
export function getUserRoutesRef(uid: string) {
  return dbRef(rtdb, `routes/${uid}`)
}

/**
 * 실시간으로 유저의 노선 목록 구독
 */
export function listenUserRoutes(
  uid: string,
  callback: (routes: Route[]) => void,
) {
  const routesRef = getUserRoutesRef(uid)

  const handler = (snapshot: any) => {
    const val = snapshot.val() || {}
    const list: Route[] = Object.entries(val).map(
      ([id, data]: [string, any]) => ({
        id,
        ...(data as Omit<Route, 'id'>),
      }),
    )

    callback(list)
  }

  onValue(routesRef, handler)

  // 구독 해제 함수 리턴
  return () => {
    off(routesRef, 'value', handler)
  }
}

/**
 * 노선 생성
 */
export async function createRoute(
  uid: string,
  payload: RoutePayload,
): Promise<string | null> {
  const routesRef = getUserRoutesRef(uid)
  const newRef = push(routesRef)
  const now = Date.now()

  const stations: RouteStation[] = (payload.stations ?? []).map((s, idx) => ({
    id: s.id,
    name: s.name,
    order: s.order ?? idx + 1,
    isTerminal: !!s.isTerminal,
    isMajor: !!s.isMajor,
    distanceFromPrevKm:
      typeof s.distanceFromPrevKm === 'number'
        ? s.distanceFromPrevKm
        : idx === 0
          ? 0
          : 0,
  }))

  const data: Omit<Route, 'id'> = {
    name: payload.name,
    status: payload.status,
    type: payload.type,
    shape: payload.shape,
    transport: payload.transport,
    description: payload.description ?? '',
    color: payload.color ?? '#888888',
    lineCode: payload.lineCode ?? '',
    stations,
    tags: payload.tags ?? [],
    constructionStartedAt:
      typeof payload.constructionStartedAt === 'number'
        ? payload.constructionStartedAt
        : null,
    constructionEndsAt:
      typeof payload.constructionEndsAt === 'number'
        ? payload.constructionEndsAt
        : null,
    createdAt: now,
    updatedAt: now,
    lastUpdatedAt: now,
  }

  await set(newRef, data)
  return newRef.key
}

/**
 * 노선 부분 수정
 */
export async function updateRoute(
  uid: string,
  routeId: string,
  patch: Partial<RoutePayload>,
): Promise<void> {
  const routeRef = dbRef(rtdb, `routes/${uid}/${routeId}`)
  const now = Date.now()

  const normalized: any = {
    ...patch,
    updatedAt: now,
    lastUpdatedAt: now,
  }

  if (patch.stations) {
    normalized.stations = patch.stations.map((s, idx) => ({
      id: s.id,
      name: s.name,
      order: s.order ?? idx + 1,
      isTerminal: !!s.isTerminal,
      isMajor: !!s.isMajor,
      distanceFromPrevKm:
        typeof s.distanceFromPrevKm === 'number'
          ? s.distanceFromPrevKm
          : idx === 0
            ? 0
            : 0,
    }))
  }

  if (patch.constructionStartedAt === undefined) {
    // 그대로 두기
  }
  if (patch.constructionEndsAt === undefined) {
    // 그대로 두기
  }

  await update(routeRef, normalized)
}

/**
 * 노선 삭제
 */
export async function deleteRoute(
  uid: string,
  routeId: string,
): Promise<void> {
  const routeRef = dbRef(rtdb, `routes/${uid}/${routeId}`)
  await remove(routeRef)
}
