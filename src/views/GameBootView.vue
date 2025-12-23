<!-- src/views/GameBootView.vue -->
<template>
  <div class="boot-wrap">
    <div class="boot-title">게임 부팅 중...</div>
    <div class="boot-sub">인증/저장 데이터 초기화 중</div>

    <div v-if="error" class="boot-error">
      {{ error }}
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { useAuth } from '@/composables/useAuth'
import { useResearch } from '@/composables/useResearch'
import { REMOTE_ENABLED } from '@/plugins/firebase/config'

const router = useRouter()
const error = ref('')

// ✅ DEV에서는 원격 자체가 금지이므로 계정 로드 로직을 실행하지 않음
const REMOTE_OK = import.meta.env.PROD && !!REMOTE_ENABLED

onMounted(async () => {
  try {
    const { user, authReady } = useAuth()
    const { loadForUser, clearUserState } = useResearch()

    // authReady가 true 될 때까지 잠깐 대기
    let guard = 0
    while (!authReady.value && guard < 300) {
      await new Promise((r) => setTimeout(r, 10))
      guard++
    }

    // ✅ 원격 비활성(DEV 포함): 항상 게스트 상태 유지
    if (!REMOTE_OK) {
      clearUserState()
      await router.replace('/game/main/research')
      return
    }

    // ✅ 원격 활성: 로그인 여부에 따라 처리
    const currentUser = user.value
    if (!currentUser?.uid) {
      clearUserState()
      // 향후 /auth/login 도입 시 그쪽으로 변경 가능
      await router.replace('/game/main/research')
      return
    }

    // 로그인/계정 로드
    await loadForUser(currentUser.uid)

    await router.replace('/game/main/research')
  } catch (e) {
    console.error(e)
    error.value = '부팅 실패: 인증/저장 초기화 중 오류가 발생했어. (게스트로 진입)'
    // 실패해도 앱은 살려서 최소 동작 루트로 진입
    await router.replace('/game/main/research')
  }
})
</script>

<style scoped>
.boot-wrap{
  padding: 24px;
}
.boot-title{
  font-size: 18px;
  font-weight: 900;
}
.boot-sub{
  margin-top: 8px;
  opacity: 0.75;
}
.boot-error{
  margin-top: 16px;
  opacity: 0.9;
  white-space: pre-wrap;
}
</style>
