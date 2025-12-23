// src/plugins/firebase/config.js
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getDatabase } from 'firebase/database'
import * as firestore from 'firebase/firestore'

// ✅ 정책: DEV에서는 원격(Firestore/RTDB) 완전 차단
// - 필요 시 .env에서 VITE_REMOTE_ENABLED=true/false로 제어 가능
export const REMOTE_ENABLED =
  import.meta.env.PROD && (import.meta.env.VITE_REMOTE_ENABLED ?? 'true') === 'true'

// ✅ Firebase 설정은 .env에서 주입
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FB_API_KEY,
  authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FB_DATABASE_URL,
  projectId: import.meta.env.VITE_FB_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FB_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FB_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FB_APP_ID,
  measurementId: import.meta.env.VITE_FB_MEASUREMENT_ID,
}

// ✅ 필수 키 체크 (Auth 동작에 중요)
const HAS_FIREBASE_CONFIG =
  !!firebaseConfig.apiKey &&
  !!firebaseConfig.authDomain &&
  !!firebaseConfig.projectId &&
  !!firebaseConfig.appId

let app = null
let auth = null
let rtdb = null
let db = null

// (디버그) 키 존재 여부만 표시 — 값은 노출하지 않음
console.log('[firebase] apiKey=', firebaseConfig.apiKey ? '(set)' : '(missing)')
console.log('[firebase] projectId=', firebaseConfig.projectId || '(missing)')
console.log('[firebase] authDomain=', firebaseConfig.authDomain || '(missing)')
console.log('[firebase] REMOTE_ENABLED=', REMOTE_ENABLED)

// ✅ initializeApp 보호 (import 시점 크래시 방지)
try {
  if (HAS_FIREBASE_CONFIG) {
    app = initializeApp(firebaseConfig)

    // ✅ Auth는 DEV에서도 생성 (원격 저장만 막는다)
    auth = getAuth(app)
  } else {
    console.warn('[firebase] Missing VITE_FB_* env config. Running in guest-safe mode.')
  }
} catch (e) {
  console.warn('[firebase] initializeApp failed. Running in guest-safe mode:', e)
  app = null
  auth = null
}

// ✅ 원격 리소스는 PROD + REMOTE_ENABLED에서만 생성
if (REMOTE_ENABLED && app) {
  // RTDB
  try {
    rtdb = getDatabase(app)
  } catch (e) {
    console.warn('[firebase] getDatabase failed:', e)
    rtdb = null
  }

  // Firestore (가능하면 multi-tab cache)
  try {
    if (
      typeof firestore.initializeFirestore === 'function' &&
      typeof firestore.persistentLocalCache === 'function' &&
      typeof firestore.persistentMultipleTabManager === 'function'
    ) {
      db = firestore.initializeFirestore(app, {
        localCache: firestore.persistentLocalCache({
          tabManager: firestore.persistentMultipleTabManager(),
        }),
      })
    }
  } catch (e) {
    console.warn('[firebase] initializeFirestore persistence failed:', e)
    db = null
  }

  // fallback: 기본 Firestore + persistence best-effort
  if (!db) {
    try {
      db = firestore.getFirestore(app)
    } catch (e) {
      console.warn('[firebase] getFirestore failed:', e)
      db = null
    }

    if (db) {
      ;(async () => {
        try {
          // Deprecated 표시가 떠도 fallback에서만 쓰는 best-effort라 OK
          if (typeof firestore.enableMultiTabIndexedDbPersistence === 'function') {
            await firestore.enableMultiTabIndexedDbPersistence(db)
          } else if (typeof firestore.enableIndexedDbPersistence === 'function') {
            try {
              await firestore.enableIndexedDbPersistence(db, { synchronizeTabs: true })
            } catch {
              await firestore.enableIndexedDbPersistence(db)
            }
          }
        } catch (e) {
          console.warn('[firebase] indexeddb persistence not available:', e)
        }
      })()
    }
  }
}

export { app, auth, db, rtdb }
