<!-- src/components/play/tablet/TabletCompanySetup.vue -->
<template>
  <div class="play-tablet-shell-root">
    <TabletHome
      :company="company"
      @create-company="handleCreateCompany"
    />
  </div>
</template>

<script setup lang="ts">
import TabletHome from '@/components/play/tablet/TabletHome.vue'
import { usePlayerAccount } from '@/composables/usePlayerAccount'
import type { CompanyPayload } from '@/composables/usePlayerAccount'

const { company, saveCompanyForCurrentUser } = usePlayerAccount()

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
</script>

<style scoped>
.play-tablet-shell-root {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
