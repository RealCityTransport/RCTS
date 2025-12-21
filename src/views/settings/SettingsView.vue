<template>
  <SettingsShell>
    <template #nav>
      <SettingsNav />
    </template>

    <template #content>
      <router-view />
    </template>
  </SettingsShell>
</template>

<script setup>
import SettingsShell from '@/components/settings/SettingsShell.vue';
import SettingsNav from '@/components/settings/SettingsNav.vue';
</script>
