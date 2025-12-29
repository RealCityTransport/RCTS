// src/features/routes/useRoutes.ts
import {
  ref,
  computed,
  onMounted,
  onUnmounted,
  watch,
} from 'vue'
import { useFirebaseAuth } from '@/composables/useFirebaseAuth'
import {
  listenUserRoutes,
  createRoute,
  updateRoute,
  deleteRoute,
  type Route,
  type RoutePayload,
} from './routeRepository'

export function useRoutes() {
  const { user, isLoggedIn } = useFirebaseAuth()

  const routes = ref<Route[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  let unsubscribe: null | (() => void) = null

  const uid = computed(() => user.value?.uid ?? null)

  const sortedRoutes = computed(() =>
    [...routes.value].sort(
      (a, b) => (b.lastUpdatedAt ?? 0) - (a.lastUpdatedAt ?? 0),
    ),
  )

  const startListen = () => {
    if (!uid.value) return
    if (unsubscribe) return

    isLoading.value = true
    error.value = null

    unsubscribe = listenUserRoutes(uid.value, (list) => {
      routes.value = list
      isLoading.value = false
    })
  }

  const stopListen = () => {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
    routes.value = []
  }

  const addRoute = async (payload: RoutePayload) => {
    if (!uid.value) {
      throw new Error('로그인이 필요합니다.')
    }
    try {
      return await createRoute(uid.value, payload)
    } catch (e: any) {
      console.error('노선 생성 실패:', e)
      error.value = e?.message ?? '노선 생성 중 오류가 발생했습니다.'
      throw e
    }
  }

  const patchRoute = async (
    routeId: string,
    patch: Partial<RoutePayload>,
  ) => {
    if (!uid.value) {
      throw new Error('로그인이 필요합니다.')
    }
    try {
      await updateRoute(uid.value, routeId, patch)
    } catch (e: any) {
      console.error('노선 수정 실패:', e)
      error.value = e?.message ?? '노선 수정 중 오류가 발생했습니다.'
      throw e
    }
  }

  const removeRoute = async (routeId: string) => {
    if (!uid.value) {
      throw new Error('로그인이 필요합니다.')
    }
    try {
      await deleteRoute(uid.value, routeId)
    } catch (e: any) {
      console.error('노선 삭제 실패:', e)
      error.value = e?.message ?? '노선 삭제 중 오류가 발생했습니다.'
      throw e
    }
  }

  onMounted(() => {
    if (isLoggedIn.value) {
      startListen()
    }
  })

  onUnmounted(() => {
    stopListen()
  })

  // 로그인 / 로그아웃 시 자동으로 구독 재설정
  watch(
    isLoggedIn,
    (loggedIn) => {
      if (loggedIn) {
        startListen()
      } else {
        stopListen()
      }
    },
    { immediate: false },
  )

  return {
    // 상태
    routes,
    sortedRoutes,
    isLoading,
    error,
    isLoggedIn,

    // 액션
    addRoute,
    patchRoute,
    removeRoute,

    // 제어용
    startListen,
    stopListen,
  }
}
