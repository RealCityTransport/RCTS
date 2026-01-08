// src/composables/usePlayerRoutes.ts
import { ref, computed, watchEffect } from 'vue'
import {
  ref as dbRef,
  onValue,
  push,
  set,
  update,
  remove,
} from 'firebase/database'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { auth, rtdb } from '@/libs/firebase'

export type TransportType =
  | 'bus'
  | 'rail'
  | 'tram'
  | 'air'
  | 'ship'
  | 'space'
  | string

export interface RouteRecord {
  id: string
  name: string
  lineCode: string
  transport: TransportType
  type: string
  status: string
  shape: string
  color: string
  description: string
  tags?: string[]
  stations?: unknown

  createdAt: number | null
  updatedAt: number | null
  lastUpdatedAt?: number | null

  ownerUid?: string
}

const routes = ref<RouteRecord[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const currentUser = ref<User | null>(null)

// 현재 선택된 노선
const activeRouteId = ref<string | null>(null)

let authUnsub: (() => void) | null = null
let routesUnsub: (() => void) | null = null
let isInitialized = false

function ensureInit() {
  if (isInitialized) return
  isInitialized = true

  authUnsub = onAuthStateChanged(auth, user => {
    currentUser.value = user
  })
}

export function usePlayerRoutes() {
  ensureInit()

  // 로그인 상태에 따라 /routes/{uid} 구독
  watchEffect(() => {
    const user = currentUser.value

    // 기존 라우트 리스너 제거
    if (routesUnsub) {
      routesUnsub()
      routesUnsub = null
    }

    routes.value = []

    if (!user) {
      loading.value = false
      activeRouteId.value = null
      return
    }

    const uid = user.uid
    const routesRef = dbRef(rtdb, `routes/${uid}`)

    loading.value = true
    error.value = null

    const off = onValue(
      routesRef,
      snapshot => {
        const raw = snapshot.val() as Record<string, any> | null
        const next: RouteRecord[] = []

        if (raw) {
          // raw: { <routeId>: { name, color, stations, ... }, ... }
          for (const [routeId, value] of Object.entries(raw)) {
            const v = value as any

            const rec: RouteRecord = {
              id: routeId,
              name: v.name ?? '',
              lineCode: v.lineCode ?? '',
              transport: v.transport ?? 'bus',
              type: v.type ?? '가상',
              status: v.status ?? '설계중',
              shape: v.shape ?? '',
              color: v.color ?? '#888888',
              description: v.description ?? '',
              tags: v.tags ?? [],
              stations: v.stations,

              createdAt: v.createdAt ?? null,
              updatedAt: v.updatedAt ?? null,
              lastUpdatedAt: v.lastUpdatedAt ?? null,
              ownerUid: v.ownerUid ?? uid,
            }

            next.push(rec)
          }
        }

        // updatedAt(없으면 createdAt) 기준 최신 순 정렬
        next.sort((a, b) => {
          const au = a.updatedAt ?? a.createdAt ?? 0
          const bu = b.updatedAt ?? b.createdAt ?? 0
          return bu - au
        })

        routes.value = next

        // 선택된 노선이 없어졌거나 없으면 자동 선택
        if (next.length === 0) {
          activeRouteId.value = null
        } else if (
          !activeRouteId.value ||
          !next.some(r => r.id === activeRouteId.value)
        ) {
          activeRouteId.value = next[0].id
        }

        loading.value = false
      },
      err => {
        console.error('[usePlayerRoutes] onValue error:', err)
        error.value =
          err?.message ?? '노선 데이터를 불러오는 중 오류가 발생했습니다.'
        loading.value = false
      }
    )

    routesUnsub = () => off()
  })

  const hasError = computed(() => !!error.value)

  const selectRoute = (id: string | null) => {
    activeRouteId.value = id
  }

  // 새 노선 생성: /routes/{uid} 밑에 push
  const createRoute = async (payload: {
    name: string
    lineCode?: string
    transport?: TransportType
    type?: string
    status?: string
    shape?: string
    color?: string
    description?: string
    tags?: string[]
  }) => {
    const user = currentUser.value
    if (!user) {
      throw new Error('로그인한 사용자만 노선을 생성할 수 있습니다.')
    }

    const uid = user.uid
    const now = Date.now()
    const routesRef = dbRef(rtdb, `routes/${uid}`)
    const newRef = push(routesRef)

    const data = {
      name: payload.name,
      lineCode: payload.lineCode ?? '',
      transport: payload.transport ?? 'bus',
      type: payload.type ?? '가상',
      status: payload.status ?? '설계중',
      shape: payload.shape ?? '순환',
      color: payload.color ?? '#888888',
      description: payload.description ?? '',
      tags: payload.tags ?? [],
      stations: [],

      createdAt: now,
      updatedAt: now,
      lastUpdatedAt: now,

      ownerUid: uid,
    }

    await set(newRef, data)
    return newRef.key
  }

  // 기존 노선 수정: /routes/{uid}/{routeId}
  const updateRoute = async (id: string, partial: Partial<RouteRecord>) => {
    if (!id) return

    const user = currentUser.value
    if (!user) {
      throw new Error('로그인한 사용자만 노선을 수정할 수 있습니다.')
    }

    const uid = user.uid
    const refPath = dbRef(rtdb, `routes/${uid}/${id}`)
    const now = Date.now()

    const patch: Record<string, any> = {
      ...partial,
      updatedAt: now,
      lastUpdatedAt: now,
    }

    // id는 DB에 저장하지 않음
    delete patch.id

    await update(refPath, patch)
  }

  // 노선 삭제: /routes/{uid}/{routeId}
  const deleteRoute = async (id: string) => {
    if (!id) return

    const user = currentUser.value
    if (!user) {
      throw new Error('로그인한 사용자만 노선을 삭제할 수 있습니다.')
    }

    const uid = user.uid
    const refPath = dbRef(rtdb, `routes/${uid}/${id}`)
    await remove(refPath)

    if (activeRouteId.value === id) {
      if (routes.value.length > 0) {
        activeRouteId.value = routes.value[0].id
      } else {
        activeRouteId.value = null
      }
    }
  }

  return {
    routes,
    loading,
    error,
    hasError,
    activeRouteId,
    selectRoute,
    createRoute,
    updateRoute,
    deleteRoute,
  }
}
