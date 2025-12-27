// src/composables/useRuntimeEnv.js
import { ref, computed } from 'vue'

/**
 * 서버별로 제공되는 /rcts-env.json 을 읽어
 * 런타임 환경 설정을 적용하는 훅
 *
 * - dist 번들은 공통
 * - 각 서버(테스트/본서버 등)는 rcts-env.json 내용만 다르게 제공
 */

const envLoaded = ref(false)

const envData = ref({
  channel: 'prod',          // 기본값: prod
  researchMinutes: 5,       // 기본값: 연구 5분
  savingEnabled: true,      // 기본값: 저장 허용
})

function getEnvUrl() {
  // Vite 기준: BASE_URL (예: "/", "/RCTS_Test/")
  const base = import.meta.env.BASE_URL || '/'
  // 끝 슬래시 제거 후 rcts-env.json 붙이기
  return `${base.replace(/\/$/, '')}/rcts-env.json`
}

export async function loadRuntimeEnv() {
  if (envLoaded.value) return

  try {
    const url = getEnvUrl()
    const res = await fetch(url, { cache: 'no-cache' })

    if (res.ok) {
      const json = await res.json()

      envData.value = {
        ...envData.value,
        ...json,
      }
    } else {
      console.warn('[RCTS] runtime env not found, use default:', url)
    }
  } catch (err) {
    console.warn('[RCTS] runtime env load failed:', err)
  } finally {
    envLoaded.value = true
  }
}

export function useRuntimeEnv() {
  return {
    envLoaded: computed(() => envLoaded.value),

    channel: computed(() => envData.value.channel),

    // 연구 시간(분 단위)
    researchMinutes: computed(() => envData.value.researchMinutes),

    // 저장 가능 여부
    savingEnabled: computed(() => envData.value.savingEnabled),
  }
}
