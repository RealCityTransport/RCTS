// vite.config.js
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  // ⭐⭐⭐ GitHub Pages 배포를 위한 base 경로 설정 ⭐⭐⭐
  base: '/RCTS/', // 오빠의 저장소 이름과 동일하게 설정해주세요.
                   // 예: your-username.github.io/RCTS/ 로 접근할 수 있도록.
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})