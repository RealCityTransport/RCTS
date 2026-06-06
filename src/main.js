/*
  파일명: src/main.js

  역할:
  - 테라리아 표준시간 비서 스케줄러 앱의 진입점입니다.
*/

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

createApp(App).use(router).mount('#app')
