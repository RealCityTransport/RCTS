// src/libs/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// TODO: 여기에 실제 Firebase 콘솔에서 발급받은 값으로 교체해줘야 함
// (프로젝트 설정 → 일반 → 내 앱 → SDK 설정)
const firebaseConfig = {
  apiKey: "AIzaSyDMvSyTEhJGh7a0coyDWCDiAsWCgxE9QsU",
  authDomain: "realcitytransport.firebaseapp.com",
  databaseURL: "https://realcitytransport-default-rtdb.firebaseio.com",
  projectId: "realcitytransport",
  storageBucket: "realcitytransport.firebasestorage.app",
  messagingSenderId: "510805652928",
  appId: "1:510805652928:web:0559bdd8da50af10b7c425",
  measurementId: "G-JE98MMZMCW"
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
export const db = getFirestore(app)
