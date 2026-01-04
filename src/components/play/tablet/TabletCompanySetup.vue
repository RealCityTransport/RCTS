<!-- src/components/play/tablet/TabletCompanySetup.vue -->
<template>
  <div class="play-tablet-shell-root">
    <TabletHome
      :company="company"
      @create-company="handleCreateCompany"
      @delete-company="handleDeleteCompany"
    />
  </div>
</template>

<script setup lang="ts">
import TabletHome from '@/components/play/tablet/TabletHome.vue'
import { usePlayerAccount } from '@/composables/usePlayerAccount'
import type { CompanyPayload } from '@/composables/usePlayerAccount'

const {
  company,
  saveCompanyForCurrentUser,
  clearCompanyForCurrentUser,
} = usePlayerAccount()

const handleCreateCompany = async (payload: CompanyPayload) => {
  console.log(
    '[TabletCompanySetup] handleCreateCompany 수신, payload:',
    payload
  )
  try {
    await saveCompanyForCurrentUser(payload)
    console.log('[TabletCompanySetup] saveCompanyForCurrentUser 완료')
  } catch (err) {
    console.error(
      '[TabletCompanySetup] saveCompanyForCurrentUser 에러:',
      err
    )
  }
}

const handleDeleteCompany = async () => {
  console.log('[TabletCompanySetup] delete-company 이벤트 수신')
  try {
    await clearCompanyForCurrentUser()
    console.log('[TabletCompanySetup] clearCompanyForCurrentUser 완료')
  } catch (err) {
    console.error(
      '[TabletCompanySetup] clearCompanyForCurrentUser 에러:',
      err
    )
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
