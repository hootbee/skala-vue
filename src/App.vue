<script setup>
import UnitToggler from './components/UnitToggler.vue'
</script>

<template>
  <div class="app-shell">
    <nav class="app-nav" aria-label="주요 메뉴">
      <RouterLink class="brand" to="/">SKALA WEATHER</RouterLink>
      <div class="nav-actions"><div class="nav-links"><RouterLink to="/">날씨 홈</RouterLink><RouterLink to="/about">서비스 소개</RouterLink></div><UnitToggler /></div>
    </nav>
    <RouterView />
  </div>
</template>

<style scoped>
.app-shell { min-height: 100vh; }
.app-nav { display: flex; align-items: center; justify-content: space-between; width: min(1120px, calc(100% - 40px)); margin: 0 auto; padding: 22px 0 0; }
.brand { font-weight: 900; letter-spacing: .08em; color: #17649a; text-decoration: none; }
.nav-links { display: flex; gap: 8px; }
.nav-actions { display: flex; align-items: center; gap: 12px; }
.nav-links a { padding: 9px 13px; border-radius: 10px; color: #5d7485; text-decoration: none; font-size: .9rem; }
.nav-links a.router-link-active { color: #17649a; background: #e6f4ff; font-weight: 700; }
@media (max-width: 560px) { .app-nav { align-items: flex-start; flex-direction: column; gap: 12px; } .nav-actions { flex-wrap: wrap; } }
</style>
