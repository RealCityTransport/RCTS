// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'

// ✅ PC용: views 폴더의 모든 .vue 파일 자동 로드
const pcViewModules = import.meta.glob('../views/**/*.vue')

// ✅ 모바일용: mobile 폴더의 모든 .vue 파일 자동 로드
//    - 모바일 전용 페이지는 src/mobile 폴더 아래에 *View.vue 형식으로 둔다.
const mobileViewModules = import.meta.glob('../mobile/**/*.vue')

/**
 * 간단한 디바이스 판별
 * - SPA 환경 기준 (SSR 사용 안 하는 전제)
 */
function isMobileDevice() {
  if (typeof navigator === 'undefined') return false

  const ua = navigator.userAgent || ''
  return /Mobi|Android|iPhone|iPad|iPod/i.test(ua)
}

/**
 * 실제로 사용할 뷰 모듈 선택
 * - 1순위: 모바일 접속 + mobile 폴더에 뷰가 있을 때 → mobile 폴더 사용
 * - 2순위: 그 외에는 항상 views 폴더 사용
 */
function resolveViewModules() {
  const mobile = isMobileDevice()

  if (mobile) {
    const mobileKeys = Object.keys(mobileViewModules)

    if (mobileKeys.length > 0) {
      console.info('[router] 모바일 접속 감지 → src/mobile 뷰 사용')
      return mobileViewModules
    }

    console.warn(
      '[router][MOBILE] 모바일 접속이지만 "src/mobile" 폴더에서 뷰를 찾지 못했습니다. ' +
        '임시로 "src/views" 폴더의 PC용 뷰를 사용합니다.'
    )
    return pcViewModules
  }

  // PC / 기타 환경 → 기본 views 폴더 사용
  return pcViewModules
}

// ✅ 최종적으로 사용할 뷰 모듈
const viewModules = resolveViewModules()

/**
 * 파일 이름 기본 뽑기
 */
function getBaseName(filePath) {
  const fileName = filePath.split('/').pop() || ''
  return fileName.replace(/\.vue$/i, '')
}

/**
 * CamelCase → kebab-case 변환
 */
function camelToKebab(str) {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
}

/**
 * baseName → path 변환 규칙
 */
function toRoutePath(base) {
  const lower = base.toLowerCase()

  if (lower === 'homeview' || lower === 'home') return '/'
  if (lower === 'playview' || lower === 'play') return '/play'

  // SomethingView → /something
  const name = base.replace(/view$/i, '')
  return '/' + camelToKebab(name)
}

/**
 * baseName → route name
 */
function toRouteName(base) {
  const name = base.replace(/view$/i, '')
  return camelToKebab(name)
}

// ----------------------------------------------------
// 🚨 규칙 검증 + routes 생성
// ----------------------------------------------------
const routes = []

Object.entries(viewModules).forEach(([filePath, loader]) => {
  const base = getBaseName(filePath)

  // ❗ 규칙: 반드시 SomethingView.vue 형식
  const isValid = /View$/i.test(base)

  if (!isValid) {
    console.warn(
      `[router][WARN] "${filePath}" 파일명이 규칙을 위반했습니다. 
파일명은 반드시 "*View.vue" 형식이어야 하며, 
예: HomeView.vue / PlayView.vue / SettingsView.vue`
    )
    return // 잘못된 파일은 라우트로 등록하지 않음
  }

  const path = toRoutePath(base)
  const name = toRouteName(base)

  routes.push({
    path,
    name,
    component: loader, // lazy load
  })
})

// 홈이 없으면 경고
if (!routes.some(r => r.path === '/')) {
  console.warn('[router] "/" 라우트가 없습니다. HomeView.vue를 추가해주세요.')
}

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
