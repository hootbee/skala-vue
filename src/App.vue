<script setup>
import UnitToggler from './components/UnitToggler.vue'
import WeatherChatbot from './components/WeatherChatbot.vue'
</script>

<template>
  <div class="app-shell">
    <nav class="app-nav" aria-label="주요 메뉴">
      <RouterLink class="brand" to="/">SKALA WEATHER</RouterLink>
      <div class="nav-actions">
        <div class="nav-links">
          <RouterLink to="/">통합 홈</RouterLink>
          <RouterLink to="/weather">날씨</RouterLink>
          <RouterLink to="/about">서비스 소개</RouterLink>
          <RouterLink to="/stocks">주식 시세</RouterLink>
          <RouterLink class="subscribe-link" to="/subscribe">구독하기</RouterLink>
        </div>
        <UnitToggler />
      </div>
    </nav>
    <RouterView />
    <WeatherChatbot />
  </div>
</template>

<style scoped>
.app-shell { min-height: 100vh; }
.app-nav { display: flex; align-items: center; justify-content: space-between; width: min(1120px, calc(100% - 40px)); margin: 0 auto; padding: 20px 0; border-bottom: 1px solid var(--line); }
.brand { font-weight: 900; letter-spacing: .08em; color: var(--blue-700); text-decoration: none; }
.nav-links { display: flex; gap: 8px; }
.nav-actions { display: flex; align-items: center; gap: 12px; }
.nav-links a { padding: 8px 10px; border-radius: 8px; color: var(--muted); text-decoration: none; font-size: .9rem; }
.nav-links a:hover { color: var(--blue-700); background: var(--blue-100); }
.nav-links a.router-link-active { color: var(--blue-700); background: var(--blue-100); font-weight: 700; }
.nav-links .subscribe-link { color: #fff; background: var(--blue-700); font-weight: 700; }
.nav-links .subscribe-link:hover,
.nav-links .subscribe-link.router-link-active { color: #fff; background: #12527e; }
@media (max-width: 720px) { .app-nav { align-items: flex-start; flex-direction: column; gap: 12px; } .nav-actions { width: 100%; justify-content: space-between; flex-wrap: wrap; } .nav-links { flex-wrap: wrap; } }
</style>
