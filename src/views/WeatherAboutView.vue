<template>
  <main class="simple-view">
    <p class="eyebrow">ABOUT SKALA WEATHER</p>
    <h1>지역별 날씨를 한눈에 확인하세요.</h1>
    <p>서울, 판교, 전주의 Mock 날씨 데이터를 검색하고 상세 페이지에서 확인할 수 있는 Vue Router 실습 앱입니다.</p>
    <RouterLink class="back-link" to="/">메인 대시보드로 돌아가기</RouterLink>
  </main>
</template>

<style scoped>
.simple-view { width: min(820px, calc(100% - 40px)); margin: 0 auto; padding: 100px 0; color: #23445d; }
.eyebrow { color: #318bd0; font-size: .75rem; font-weight: 800; letter-spacing: .16em; }
h1 { max-width: 620px; font-size: clamp(2rem, 5vw, 3.5rem); letter-spacing: -.05em; }
.simple-view p:not(.eyebrow) { max-width: 600px; line-height: 1.8; color: #668095; }
.back-link { display: inline-block; margin-top: 28px; padding: 12px 16px; border-radius: 10px; color: #fff; background: #276fa3; text-decoration: none; }
</style>
