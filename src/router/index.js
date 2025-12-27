// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'

// ✅ views 폴더의 모든 .vue 파일 자동 로드
const viewModules = import.meta.glob('../views/**/*.vue')

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

  // SomethingView → something
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
