/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string
  readonly VITE_FIREBASE_AUTH_DOMAIN: string
  readonly VITE_FIREBASE_DATABASE_URL: string
  readonly VITE_FIREBASE_PROJECT_ID: string
  readonly VITE_FIREBASE_STORAGE_BUCKET: string
  readonly VITE_FIREBASE_SENDER_ID: string
  readonly VITE_FIREBASE_APP_ID: string
  readonly VITE_FIREBASE_MEASUREMENT_ID: string

  readonly VITE_ADMIN_EMAILS?: string
}

// 이 부분은 있어도 되고, 없어도 돼
// 이미 vite/client 안에 ImportMeta가 정의되어 있어서,
// 안 적어도 동작하긴 함. 적어도 문제는 없음.
interface ImportMeta {
  readonly env: ImportMetaEnv
}
