// src/main.js
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

// 전역 스타일을 한 번만 임포트합니다. (scoped가 아닙니다)
import '@/styles/global.scss'; 

const app = createApp(App);

app.use(router);
app.mount('#app');