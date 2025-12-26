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

// ✅ Firebase Config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FB_API_KEY,
  authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FB_DATABASE_URL, // ✅ RTDB는 이게 필수
  projectId: import.meta.env.VITE_FB_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FB_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FB_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FB_APP_ID,
  measurementId: import.meta.env.VITE_FB_MEASUREMENT_ID,
}

// ✅ 최소 구성 체크 (Auth/Firestore 기준)
const HAS_FIREBASE_CONFIG =
  !!firebaseConfig.apiKey &&
  !!firebaseConfig.authDomain &&
  !!firebaseConfig.projectId &&
  !!firebaseConfig.appId

// ✅ RTDB URL 유효성 체크 (필수: https://...firebaseio.com 또는 ...firebasedatabase.app)
function isValidRtdbUrl(url) {
  if (!url || typeof url !== 'string') return false
  const u = url.trim()
  if (!u) return false
  if (!/^https?:\/\//i.test(u)) return false
  // 일반적인 RTDB 도메인 패턴
  if (u.includes('.firebaseio.com')) return true
  if (u.includes('.firebasedatabase.app')) return true
  return false
}

const HAS_VALID_RTDB_URL = isValidRtdbUrl(firebaseConfig.databaseURL)

// --- instances
let app = null
let auth = null
let rtdb = null
let db = null

// --- logs (오빠 스타일 유지)
console.log('[firebase] apiKey=', firebaseConfig.apiKey ? '(set)' : '(missing)')
console.log('[firebase] projectId=', firebaseConfig.projectId || '(missing)')
console.log('[firebase] authDomain=', firebaseConfig.authDomain || '(missing)')
console.log('[firebase] databaseURL=', HAS_VALID_RTDB_URL ? '(set)' : '(missing/invalid)')
console.log('[firebase] MODE=', import.meta.env.MODE, 'PROD=', import.meta.env.PROD)
console.log('[firebase] REMOTE_ENABLED=', REMOTE_ENABLED)
console.log('[firebase] FIRESTORE_PERSISTENCE_ENABLED=', FIRESTORE_PERSISTENCE_ENABLED)

// ✅ App/Auth init
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

// ✅ Remote services init
if (REMOTE_ENABLED && app) {
  // --- RTDB (❗ databaseURL 없으면 시도 자체를 하지 않음)
  if (!HAS_VALID_RTDB_URL) {
    console.warn(
      '[firebase] RTDB disabled: VITE_FB_DATABASE_URL is missing/invalid. ' +
        'Set it like https://<YOUR>.firebaseio.com or https://<YOUR>.firebasedatabase.app'
    )
    rtdb = null
  } else {
    try {
      rtdb = getDatabase(app)
    } catch (e) {
      console.warn('[firebase] getDatabase failed:', e)
      rtdb = null
    }
  }

  // --- Firestore (✅ “새 캐시 방식”만 사용, enable*Persistence는 제거)
  try {
    // initializeFirestore가 있으면 캐시를 명시하여 단일 경로로 고정
    if (typeof firestore.initializeFirestore === 'function') {
      if (!FIRESTORE_PERSISTENCE_ENABLED) {
        // persistence OFF -> memory cache
        if (typeof firestore.memoryLocalCache === 'function') {
          db = firestore.initializeFirestore(app, { localCache: firestore.memoryLocalCache() })
        } else {
          // 구버전 호환
          db = firestore.getFirestore(app)
        }
      } else {
        // persistence ON -> multi-tab persistent cache
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
          // 구버전 호환: 캐시 API가 없으면 그냥 getFirestore (best-effort)
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

  // ❌ 중요: 아래는 제거함
  // initializeFirestore에서 cache(localCache)를 이미 지정했기 때문에
  // enableMultiTabIndexedDbPersistence / enableIndexedDbPersistence를 호출하면
  // "SDK cache is already specified" 경고가 발생함.
  // (필요시엔 FirestoreSettings.cache 방식으로만 관리)
}

export { app, auth, db, rtdb }
