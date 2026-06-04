/*
  파일 주소:
  src/main.js

  적용 내용:
  - Vue 앱의 진입점
  - App.vue를 불러오고 Vue Router를 연결함
  - 최종적으로 #app에 RCTS 앱을 마운트함

  연결된 파일:
  - src/App.vue
  - src/router/index.js
  - index.html 내부의 <div id="app"></div>

  수정 시 주의:
  - 전역 플러그인, Pinia, 전역 CSS 등이 생기면 이 파일에서 연결
*/

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

createApp(App)
  .use(router)
  .mount('#app')