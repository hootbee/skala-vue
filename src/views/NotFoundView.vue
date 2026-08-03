<script setup>
document.title = '페이지를 찾을 수 없음 | SKALA Weather'
</script>

<template><main class="not-found"><p class="code">404</p><h1>페이지를 찾을 수 없습니다.</h1><RouterLink to="/">날씨 홈으로 이동</RouterLink></main></template>

<style scoped>
.not-found { width: min(820px, calc(100% - 40px)); margin: 0 auto; padding: 100px 0; color: #23445d; }
.code { margin: 0; color: #318bd0; font-size: 5rem; font-weight: 900; }
.not-found a { color: #276fa3; }
</style>
