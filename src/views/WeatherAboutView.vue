<script setup>
document.title = '서비스 소개 | SKALA Weather'

const features = [
  {
    number: '01',
    title: '전국 날씨 탐색',
    description: '전국 17개 시·도의 현재 기온과 체감온도, 습도, 바람, 공기질을 확인하고 지도에서 여러 지역을 비교할 수 있습니다.',
  },
  {
    number: '02',
    title: '날씨 질문 도우미',
    description: '지역명과 궁금한 내용을 입력하면 우산, 옷차림, 자외선, 미세먼지처럼 일상에 필요한 현재 관측 정보를 빠르게 정리합니다.',
  },
  {
    number: '03',
    title: '미국 시장 요약',
    description: '미국 시가총액 상위 기업의 현재가와 등락을 간결하게 보여주어 날씨와 함께 오늘의 주요 정보를 살펴볼 수 있습니다.',
  },
]
</script>

<template>
  <main class="about-page">
    <header class="about-hero">
      <p class="eyebrow">ABOUT SKALA WEATHER</p>
      <h1>오늘 필요한 정보를<br>한곳에서 편안하게.</h1>
      <p class="hero-copy">
        SKALA Weather는 지역 날씨를 중심으로 지도 비교, 날씨 질문, 미국 주식 시세를 연결한 데일리 정보 포털입니다.
        복잡한 데이터보다 지금 확인해야 할 내용을 먼저 보여줍니다.
      </p>
      <div class="hero-actions">
        <RouterLink class="primary-link" to="/weather">전국 날씨 보기</RouterLink>
        <RouterLink class="secondary-link" to="/stocks">미국 주식 보기</RouterLink>
      </div>
    </header>

    <section class="feature-section" aria-labelledby="feature-title">
      <div class="section-intro">
        <p class="eyebrow">WHAT YOU CAN DO</p>
        <h2 id="feature-title">필요한 정보에 바로 닿는 기능</h2>
      </div>
      <div class="feature-list">
        <article v-for="feature in features" :key="feature.number" class="feature-item">
          <span>{{ feature.number }}</span>
          <div>
            <h3>{{ feature.title }}</h3>
            <p>{{ feature.description }}</p>
          </div>
        </article>
      </div>
    </section>

    <section class="data-note" aria-labelledby="data-title">
      <div>
        <p class="eyebrow">DATA &amp; TRUST</p>
        <h2 id="data-title">정보의 성격을 명확하게 안내합니다.</h2>
      </div>
      <p>
        날씨는 OpenWeatherMap의 현재 관측 데이터를 사용하며 실제 예보와 차이가 있을 수 있습니다.
        주식 현재가는 Finnhub에서 제공하며 과거 추이 그래프에는 참고용 데이터가 포함될 수 있습니다.
        모든 정보는 생활 및 학습 참고용이며 중요한 판단 전 공식 정보를 함께 확인해 주세요.
      </p>
    </section>

    <footer class="about-footer">
      <p>오늘의 정보를 가볍게 확인해 보세요.</p>
      <RouterLink to="/">통합 홈으로 돌아가기 <span aria-hidden="true">→</span></RouterLink>
    </footer>
  </main>
</template>

<style scoped>
.about-page { width: min(980px, calc(100% - 40px)); margin: 0 auto; padding: 48px 0 72px; color: var(--ink); }
.about-hero { padding: 52px 0 58px; border-bottom: 1px solid var(--line); }
.eyebrow { margin: 0 0 10px; color: var(--blue-500); font-size: .7rem; font-weight: 800; letter-spacing: .17em; }
.about-hero h1 { max-width: 720px; margin: 0; font-size: clamp(2.5rem, 7vw, 4.8rem); line-height: 1.08; letter-spacing: -.065em; }
.hero-copy { max-width: 700px; margin: 24px 0 0; color: var(--muted); font-size: 1rem; line-height: 1.9; }
.hero-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 30px; }
.hero-actions a { display: inline-flex; align-items: center; min-height: 44px; padding: 0 16px; border-radius: 9px; font-size: .82rem; font-weight: 800; text-decoration: none; }
.primary-link { color: #fff; background: var(--blue-700); }
.primary-link:hover { background: #12527e; }
.secondary-link { border: 1px solid var(--line); color: var(--blue-700); background: var(--surface); }
.secondary-link:hover { border-color: #9dc6df; background: var(--blue-100); }
.feature-section { display: grid; grid-template-columns: minmax(220px, .7fr) minmax(0, 1.3fr); gap: 54px; padding: 58px 0; }
.section-intro h2, .data-note h2 { margin: 0; color: var(--ink); font-size: clamp(1.6rem, 4vw, 2.15rem); line-height: 1.3; letter-spacing: -.045em; }
.feature-list { display: grid; }
.feature-item { display: grid; grid-template-columns: 42px 1fr; gap: 16px; padding: 23px 0; border-top: 1px solid var(--line); }
.feature-item:last-child { border-bottom: 1px solid var(--line); }
.feature-item > span { color: var(--blue-500); font-size: .72rem; font-weight: 800; }
.feature-item h3 { margin: 0 0 8px; color: #29485e; font-size: 1rem; }
.feature-item p { margin: 0; color: var(--muted); font-size: .82rem; line-height: 1.75; }
.data-note { display: grid; grid-template-columns: minmax(250px, .8fr) minmax(0, 1.2fr); gap: 48px; padding: 32px; border: 1px solid #cbdfea; border-radius: 16px; background: var(--blue-100); }
.data-note > p { margin: 0; color: #577386; font-size: .8rem; line-height: 1.85; }
.about-footer { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding-top: 40px; }
.about-footer p { margin: 0; color: var(--muted); }
.about-footer a { color: var(--blue-700); font-size: .82rem; font-weight: 800; text-decoration: none; }
.about-footer a:hover { text-decoration: underline; }
@media (max-width: 680px) {
  .about-page { width: min(100% - 24px, 980px); padding-top: 24px; }
  .about-hero { padding: 34px 0 42px; }
  .feature-section, .data-note { grid-template-columns: 1fr; gap: 28px; }
  .feature-section { padding: 42px 0; }
  .data-note { padding: 24px 20px; }
  .about-footer { align-items: flex-start; flex-direction: column; }
}
</style>
