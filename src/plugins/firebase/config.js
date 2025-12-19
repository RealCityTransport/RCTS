// src/plugins/firebase/config.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Firebase 구성 객체 (환경 변수 사용 권장)
const firebaseConfig = {
  apiKey: "AIzaSyDMvSyTEhJGh7a0coyDWCDiAsWCgxE9QsU",
  authDomain: "realcitytransport.firebaseapp.com",
  databaseURL: "https://realcitytransport-default-rtdb.firebaseio.com",
  projectId: "realcitytransport",
  storageBucket: "realcitytransport.firebasestorage.app",
  messagingSenderId: "510805652928",
  appId: "1:510805652928:web:0559bdd8da50af10b7c425",
  measurementId: "G-JE98MMZMCW"
};

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);

// 인증 서비스 가져오기
const auth = getAuth(app);

export { auth };