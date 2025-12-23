// src/plugins/firebase/config.js
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getDatabase } from 'firebase/database'
import * as firestore from 'firebase/firestore'

// ✅ env가 최우선
const ENV_REMOTE = (import.meta.env.VITE_REMOTE_ENABLED ?? 'true') === 'true'
const ENV_PERSISTENCE = (import.meta.env.VITE_FIRESTORE_PERSISTENCE ?? 'true') === 'true'

// ✅ 최종 정책
export const REMOTE_ENABLED = ENV_REMOTE
export const FIRESTORE_PERSISTENCE_ENABLED = ENV_REMOTE && ENV_PERSISTENCE

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

const HAS_FIREBASE_CONFIG =
  !!firebaseConfig.apiKey &&
  !!firebaseConfig.authDomain &&
  !!firebaseConfig.projectId &&
  !!firebaseConfig.appId

let app = null
let auth = null
let rtdb = null
let db = null

console.log('[firebase] apiKey=', firebaseConfig.apiKey ? '(set)' : '(missing)')
console.log('[firebase] projectId=', firebaseConfig.projectId || '(missing)')
console.log('[firebase] authDomain=', firebaseConfig.authDomain || '(missing)')
console.log('[firebase] MODE=', import.meta.env.MODE, 'PROD=', import.meta.env.PROD)
console.log('[firebase] REMOTE_ENABLED=', REMOTE_ENABLED)
console.log('[firebase] FIRESTORE_PERSISTENCE_ENABLED=', FIRESTORE_PERSISTENCE_ENABLED)

try {
  if (HAS_FIREBASE_CONFIG) {
    app = initializeApp(firebaseConfig)
    auth = getAuth(app)
  } else {
    console.warn('[firebase] Missing VITE_FB_* env config. Running in guest-safe mode.')
  }
} catch (e) {
  console.warn('[firebase] initializeApp failed. Running in guest-safe mode:', e)
  app = null
  auth = null
}

if (REMOTE_ENABLED && app) {
  // RTDB
  try {
    rtdb = getDatabase(app)
  } catch (e) {
    console.warn('[firebase] getDatabase failed:', e)
    rtdb = null
  }

  // Firestore
  try {
    if (typeof firestore.initializeFirestore === 'function') {
      // persistence OFF면 memory cache(또는 기본)로 고정
      if (!FIRESTORE_PERSISTENCE_ENABLED) {
        if (typeof firestore.memoryLocalCache === 'function') {
          db = firestore.initializeFirestore(app, { localCache: firestore.memoryLocalCache() })
        } else {
          db = firestore.getFirestore(app)
        }
      } else {
        // persistence ON: multi-tab manager 사용
        if (
          typeof firestore.persistentLocalCache === 'function' &&
          typeof firestore.persistentMultipleTabManager === 'function'
        ) {
          db = firestore.initializeFirestore(app, {
            localCache: firestore.persistentLocalCache({
              tabManager: firestore.persistentMultipleTabManager(),
            }),
          })
        } else {
          db = firestore.getFirestore(app)
        }
      }
    } else {
      db = firestore.getFirestore(app)
    }
  } catch (e) {
    console.warn('[firebase] firestore init failed. Fallback to getFirestore:', e)
    try {
      db = firestore.getFirestore(app)
    } catch (e2) {
      console.warn('[firebase] getFirestore failed:', e2)
      db = null
    }
  }

  // ✅ persistence가 켜진 경우에만 best-effort 시도
  if (db && FIRESTORE_PERSISTENCE_ENABLED) {
    ;(async () => {
      try {
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

export { app, auth, db, rtdb }
