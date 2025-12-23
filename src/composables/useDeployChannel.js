// src/composables/useDeployChannel.js
import { computed } from 'vue'

function normalize(v) {
  const x = String(v || '').toLowerCase()
  if (x === 'dev') return 'dev'
  if (x === 'test') return 'test'
  if (x === 'preview') return 'preview'
  if (x === 'prod') return 'prod'
  if (x === 'beta') return 'beta'
  return 'prod'
}

export function useDeployChannel() {
  const channel = computed(() => {
    if (!import.meta.env.PROD) return 'dev'
    return normalize(import.meta.env.VITE_DEPLOY_CHANNEL ?? 'prod')
  })

  const isDev = computed(() => channel.value === 'dev')
  const isTest = computed(() => channel.value === 'test')
  const isPreview = computed(() => channel.value === 'preview')
  const isProd = computed(() => channel.value === 'prod')

  return { channel, isDev, isTest, isPreview, isProd }
}
