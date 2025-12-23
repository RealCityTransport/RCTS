// vite.config.js
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'

// ✅ ESM 환경에서 __dirname 정의
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig(({ mode }) => {
  // VITE_* env 로드
  const env = loadEnv(mode, process.cwd(), 'VITE_')

  // ✅ 채널별 base (기본: /RCTS/)
  // - prod:   /RCTS/
  // - test:   /RCTS/test/
  // - preview:/RCTS/preview/
  const base = env.VITE_BASE ?? '/RCTS/'

  return {
    base,
    plugins: [vue()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
      watch: { usePolling: true },
    },
  }
})
