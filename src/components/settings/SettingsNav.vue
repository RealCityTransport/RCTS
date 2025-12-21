<template>
  <nav class="settings-nav-inner">
    <h3 class="title">설정</h3>

    <ul class="menu">
      <li>
        <router-link :to="{ name: 'DataManager' }">
          데이터 관리
        </router-link>
      </li>
    </ul>
  </nav>
</template>

<script setup>
</script>

<style scoped lang="scss">
.settings-nav-inner { display: flex; flex-direction: column; gap: 12px; }
.title { margin: 0; font-size: 14px; opacity: 0.9; }
.menu { list-style: none; padding: 0; margin: 0; display: grid; gap: 8px; }
.menu a { display: block; padding: 8px 10px; border-radius: 8px; text-decoration: none; color: inherit; opacity: 0.85; }
.menu a.router-link-active { background: rgba(255,255,255,0.12); opacity: 1; }
</style>
