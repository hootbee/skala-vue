<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import Drawer from 'primevue/drawer'
import Toast from 'primevue/toast'
import UnitToggler from './components/UnitToggler.vue'
import WeatherChatbot from './components/WeatherChatbot.vue'

const isMenuOpen = ref(false)
const route = useRoute()

const closeMenu = () => { isMenuOpen.value = false }
</script>

<template>
  <div class="app-shell">
    <nav class="app-nav" aria-label="주요 메뉴">
      <RouterLink class="brand" to="/">SKALA WEATHER</RouterLink>
      <button
        class="mobile-menu-button"
        type="button"
        aria-label="메뉴 열기"
        :aria-expanded="isMenuOpen"
        aria-controls="mobile-navigation"
        @click="isMenuOpen = true"
      ><span aria-hidden="true">☰</span><span>메뉴</span></button>
      <div class="nav-actions">
        <div class="nav-links">
          <RouterLink to="/">통합 홈</RouterLink>
          <RouterLink to="/weather">날씨</RouterLink>
          <RouterLink to="/about">서비스 소개</RouterLink>
          <RouterLink to="/stocks">주식 시세</RouterLink>
          <RouterLink to="/api-lab">API 실습</RouterLink>
          <RouterLink class="subscribe-link" to="/subscribe">구독하기</RouterLink>
        </div>
        <UnitToggler />
      </div>
    </nav>
    <Drawer
      v-model:visible="isMenuOpen"
      position="right"
      header="메뉴"
      class="mobile-drawer"
      :pt="{ root: { id: 'mobile-navigation' } }"
    >
      <nav class="mobile-nav-links" aria-label="모바일 주요 메뉴">
        <RouterLink :class="{ active: route.name === 'home' }" to="/" @click="closeMenu">통합 홈</RouterLink>
        <RouterLink to="/weather" @click="closeMenu">날씨</RouterLink>
        <RouterLink to="/about" @click="closeMenu">서비스 소개</RouterLink>
        <RouterLink to="/stocks" @click="closeMenu">주식 시세</RouterLink>
        <RouterLink to="/api-lab" @click="closeMenu">API 실습</RouterLink>
        <RouterLink class="subscribe-link" to="/subscribe" @click="closeMenu">구독하기</RouterLink>
      </nav>
      <div class="mobile-unit"><span>온도 단위</span><UnitToggler /></div>
    </Drawer>
    <RouterView />
    <WeatherChatbot :suppressed="isMenuOpen" />
    <Toast position="top-right" />
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
.mobile-menu-button { display: none; align-items: center; min-height: 42px; gap: 7px; padding: 8px 12px; border: 1px solid var(--line); border-radius: 9px; color: var(--blue-700); background: #fff; font-weight: 800; }
.mobile-nav-links { display: grid; gap: 7px; }
.mobile-nav-links a { padding: 12px 13px; border-radius: 9px; color: var(--ink); text-decoration: none; }
.mobile-nav-links a:hover,
.mobile-nav-links a.router-link-active,
.mobile-nav-links a.active { color: var(--blue-700); background: var(--blue-100); font-weight: 800; }
.mobile-nav-links .subscribe-link { margin-top: 8px; color: #fff; background: var(--blue-700); text-align: center; }
.mobile-unit { display: flex; align-items: center; justify-content: space-between; margin-top: 24px; padding-top: 18px; border-top: 1px solid var(--line); color: var(--muted); font-size: .8rem; font-weight: 700; }
@media (max-width: 760px) {
  .app-nav { width: min(100% - 24px, 1120px); padding: 14px 0; }
  .nav-actions { display: none; }
  .mobile-menu-button { display: inline-flex; }
}
</style>
