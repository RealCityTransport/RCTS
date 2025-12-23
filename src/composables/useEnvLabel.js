// src/composables/useEnvLabel.js
import { computed } from 'vue'

function normalizeChannel(v) {
  const x = String(v || '').toLowerCase()
  if (x === 'test') return 'test'
  if (x === 'preview') return 'preview'
  return 'prod'
}

/**
 * ✅ 표기 정책
 * - 로컬(dev): DEV
 * - 배포: VITE_DEPLOY_CHANNEL 기반으로 테스트서버/사전공개/본서버
 *
 * (오빠의 .env.development에는 이 값이 없어도 됨)
 */
export function useEnvLabel() {
  const envKey = computed(() => {
    if (!import.meta.env.PROD) return 'dev'
    return normalizeChannel(import.meta.env.VITE_DEPLOY_CHANNEL ?? 'prod')
  })

  const envLabel = computed(() => {
    if (!import.meta.env.PROD) return 'DEV'

    switch (envKey.value) {
      case 'test': return '테스트서버'
      case 'preview': return '사전공개'
      case 'prod': return '본서버'
      default: return '본서버'
    }
  })

  return { envKey, envLabel }
}
