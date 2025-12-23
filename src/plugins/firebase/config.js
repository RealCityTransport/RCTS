// src/plugins/firebase/config.js
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getDatabase } from 'firebase/database'
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

// ✅ Firestore (권장 캐시 설정)
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentSingleTabManager(),
  }),
})

// ✅ RTDB (서버 시간 오프셋 용도)
const rtdb = getDatabase(app)

export { app, auth, db, rtdb }
