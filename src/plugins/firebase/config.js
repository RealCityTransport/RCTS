// src/plugins/firebase/config.js
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentSingleTabManager,
} from 'firebase/firestore'

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

const app = initializeApp(firebaseConfig)

const auth = getAuth(app)

// ✅ 권장: 단일 탭 퍼시스턴스(멀티탭 충돌 방지)
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentSingleTabManager(),
  }),
})

export { auth, db }
