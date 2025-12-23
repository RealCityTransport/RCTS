// src/composables/useSync.js
import { computed, watch } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useResearch } from '@/composables/useResearch'
import { useWorld } from '@/composables/useWorld'
import { REMOTE_ENABLED } from '@/plugins/firebase/config'

let isInitialized = false

export function useSync() {
  const { user, authReady } = useAuth()
  const { world } = useWorld()
  const research = useResearch()

  const uid = computed(() => user.value?.uid || null)

  // ✅ DEV 저장/동기화 완전 차단: PROD에서만 sync 동작
  const REMOTE_OK = computed(() => import.meta.env.PROD && !!REMOTE_ENABLED)

  const start = () => {
    // ✅ DEV면 동기화 매니저 자체를 시작하지 않음
    if (!REMOTE_OK.value) return
    if (isInitialized) return

    watch(
      [authReady, uid, world],
      ([ready, nextUid, nextWorld], [_, prevUid, prevWorld]) => {
        if (!ready) return

        const uidChanged = !!prevUid && prevUid !== nextUid
        const worldChanged = !!prevWorld && prevWorld !== nextWorld

        if (uidChanged || worldChanged) {
          research.unsubscribe()
        }

        if (nextUid) {
          research.subscribeForUser(nextUid, nextWorld)
        } else {
          research.unsubscribe()
          research.clearUserState()
        }
      },
      { immediate: true }
    )

    isInitialized = true
  }

  return { start }
}
