// src/composables/useWorld.js
import { computed } from 'vue'

function normalizeWorld(v) {
  const x = String(v || '').toLowerCase()
  if (x === 'dev') return 'dev'
  if (x === 'stage') return 'stage'
  return 'prod'
}

/**
 * ✅ 정책
 * - 로컬(dev server): 무조건 dev 고정
 * - 배포(build): VITE_WORLD로 고정(없으면 prod)
 */
export function useWorld() {
  const world = computed(() => {
    if (!import.meta.env.PROD) return 'dev'
    return normalizeWorld(import.meta.env.VITE_WORLD ?? 'prod')
  })

  return { world }
}
