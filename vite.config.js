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
  },
   // ⭐⭐⭐ 로컬 개발 서버 설정 추가/수정 ⭐⭐⭐
  server: {
    host: '0.0.0.0', // 모든 네트워크 인터페이스에서 접근 가능하도록 설정
    port: 5173,      // 기본 포트
    watch: {
      usePolling: true, // WSL2와 같은 환경에서 파일 변경을 감지하기 위해 폴링 방식 사용
    },
    // hmr: { // 필요한 경우, HMR 연결 설정을 명시할 수도 있습니다.
    //   overlay: false, // HMR 오류 오버레이 비활성화 (선택 사항)
    // }
  }
  // ⭐⭐⭐ /로컬 개발 서버 설정 ⭐⭐⭐
})