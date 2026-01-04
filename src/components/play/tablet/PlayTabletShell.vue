<!-- src/components/play/tablet/PlayTabletShell.vue -->
<template>
  <div class="play-tablet-shell-root">
    <!-- 여기 위쪽에 상단 바, 시계, 기타 UI가 있다면 그대로 두고,
         관제 테블릿 내용 자리에 TabletHome 하나만 박아두는 구조라고 보면 돼 -->

    <TabletHome
      :company="company"
      @create-company="handleCreateCompany"
    />
  </div>
</template>

<script setup lang="ts">
import TabletHome from './TabletHome.vue'
import { usePlayerAccount } from '@/composables/usePlayerAccount'
import type { CompanyPayload } from '@/composables/usePlayerAccount'

const { company, saveCompanyForCurrentUser } = usePlayerAccount()

const handleCreateCompany = async (payload: CompanyPayload) => {
  console.log('[PlayTabletShell] handleCreateCompany 수신, payload:', payload)
  try {
    await saveCompanyForCurrentUser(payload)
    console.log('[PlayTabletShell] saveCompanyForCurrentUser 완료')
  } catch (err) {
    console.error('[PlayTabletShell] saveCompanyForCurrentUser 에러:', err)
  }
}
</script>

<style scoped>
.play-tablet-shell-root {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
