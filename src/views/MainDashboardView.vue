<script setup>
import { computed, onMounted, ref } from 'vue'
import { STOCK_MARKETS, fetchStockSeries } from '../services/stockApi'
import { fetchTopHeadlines } from '../services/newsApi'
import { useConfigStore } from '../stores/configStore'
import {
  fetchCurrentWeather,
  getAirQualityLevel,
  getWeatherErrorMessage,
  WEATHER_CITIES,
} from '../services/weatherApi'

document.title = '오늘의 브리핑 | SKALA Weather'
const configStore = useConfigStore()

const today = new Intl.DateTimeFormat('ko-KR', {
  month: 'long',
  day: 'numeric',
  weekday: 'long',
}).format(new Date())

const weather = ref([])
const isWeatherLoading = ref(true)
const weatherError = ref('')
const heroWeather = computed(() => weather.value.find(({ id }) => id === 'city_01') ?? weather.value[0])
const weatherIcon = {
  맑음: '☀️',
  비: '🌧️',
  구름: '☁️',
  눈: '🌨️',
  안개: '🌫️',
}

const loadWeather = async () => {
  isWeatherLoading.value = true
  weatherError.value = ''
  const results = await Promise.allSettled(WEATHER_CITIES.map(fetchCurrentWeather))
  weather.value = results.filter(({ status }) => status === 'fulfilled').map(({ value }) => value)
  const failed = results.find(({ status }) => status === 'rejected')
  if (failed) weatherError.value = getWeatherErrorMessage(failed.reason)
  isWeatherLoading.value = false
}

onMounted(loadWeather)

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
})
const stocks = ref(STOCK_MARKETS.slice(0, 3).map((market) => ({
  ...market,
  value: '—',
  change: '—',
  up: null,
  source: 'loading',
})))
const marketNotice = computed(() =>
  stocks.value.some(({ source }) => source === 'demo')
    ? 'API 연결 실패로 참고용 시세를 표시하고 있습니다.'
    : 'Finnhub 미국 주식 현재가이며 투자 참고용입니다.',
)

onMounted(async () => {
  await Promise.all(stocks.value.map(async (stock) => {
    const result = await fetchStockSeries(stock)
    const latest = result.series.at(-1)?.value
    const previous = result.series.at(-2)?.value
    const percentChange = result.percentChange ?? ((latest - previous) / previous) * 100

    stock.value = currencyFormatter.format(latest)
    stock.change = `${percentChange >= 0 ? '+' : ''}${percentChange.toFixed(2)}%`
    stock.up = percentChange >= 0
    stock.source = result.source
  }))
})

const news = ref([])
const isNewsLoading = ref(true)
const newsSource = ref('loading')

const formatNewsTime = (publishedAt) => {
  const publishedDate = new Date(publishedAt)
  if (Number.isNaN(publishedDate.getTime())) return '시간 정보 없음'
  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - publishedDate.getTime()) / 60000))
  if (elapsedMinutes < 60) return `${Math.max(1, elapsedMinutes)}분 전`
  if (elapsedMinutes < 1440) return `${Math.floor(elapsedMinutes / 60)}시간 전`
  return new Intl.DateTimeFormat('ko-KR', { month: 'short', day: 'numeric' }).format(publishedDate)
}

const loadNews = async () => {
  isNewsLoading.value = true
  const result = await fetchTopHeadlines()
  news.value = result.articles.map((article) => ({ ...article, time: formatNewsTime(article.publishedAt) }))
  newsSource.value = result.source
  isNewsLoading.value = false
}

onMounted(loadNews)
</script>

<template>
  <main class="dashboard-page">
    <header class="dashboard-hero">
      <div>
        <p class="date-label">{{ today }}</p>
        <h1>오늘 필요한 정보만<br><span>가볍게 확인하세요.</span></h1>
        <p class="hero-copy">뉴스와 날씨, 주요 시세를 한 화면에 모았습니다.</p>
      </div>
      <div v-if="heroWeather" class="hero-weather" :aria-label="`${heroWeather.name} 현재 날씨 ${heroWeather.status}, ${configStore.formatTemperature(heroWeather.temp)}`">
        <span class="sun" aria-hidden="true">{{ weatherIcon[heroWeather.status] ?? '🌤️' }}</span>
        <div><strong>{{ configStore.formatTemperature(heroWeather.temp) }}</strong><span>{{ heroWeather.name }} · {{ heroWeather.description }}</span></div>
      </div>
      <div v-else class="hero-weather hero-weather-state" role="status">
        {{ isWeatherLoading ? '서울 날씨를 불러오는 중…' : '날씨 정보 없음' }}
      </div>
    </header>

    <section class="quick-strip" aria-label="오늘의 핵심 정보">
      <div><span class="quick-dot weather-dot" aria-hidden="true"></span><span>{{ heroWeather?.name ?? '서울' }}</span><strong>{{ heroWeather ? `${configStore.formatTemperature(heroWeather.temp)} ${heroWeather.status}` : '—' }}</strong></div>
      <div><span class="quick-dot air-dot" aria-hidden="true"></span><span>공기질</span><strong>{{ heroWeather ? getAirQualityLevel(heroWeather.airQualityIndex) : '—' }}</strong></div>
      <div><span class="quick-dot market-dot" aria-hidden="true"></span><span>{{ stocks[0].symbol }}</span><strong :class="stocks[0].up === false ? 'negative' : 'positive'">{{ stocks[0].change }}</strong></div>
      <div><span class="quick-dot rain-dot" aria-hidden="true"></span><span>최근 강수</span><strong>{{ heroWeather ? `${heroWeather.precipitation.toFixed(1)} mm` : '—' }}</strong></div>
    </section>

    <div class="dashboard-grid">
      <section class="panel news-panel" aria-labelledby="news-title">
        <div class="panel-heading">
          <div><p class="eyebrow">TODAY'S NEWS</p><h2 id="news-title">오늘의 주요 뉴스</h2></div>
          <span :class="['source-label', newsSource]">{{ newsSource === 'api' ? 'LIVE' : newsSource === 'demo' ? 'DEMO' : 'LOADING' }}</span>
        </div>
        <p v-if="isNewsLoading" class="news-state" role="status">오늘의 뉴스를 불러오는 중입니다…</p>
        <div v-else class="news-list">
          <article v-for="(item, index) in news" :key="item.title" class="news-item">
            <span class="news-number">0{{ index + 1 }}</span>
            <div class="news-content">
              <div class="news-meta"><span>{{ item.source }}</span><time :datetime="item.publishedAt">{{ item.time }}</time></div>
              <h3><a v-if="item.url" :href="item.url" target="_blank" rel="noopener noreferrer">{{ item.title }}</a><span v-else>{{ item.title }}</span></h3>
              <p>{{ item.description }}</p>
            </div>
          </article>
        </div>
        <p v-if="newsSource === 'demo' && !isNewsLoading" class="news-notice">GNews API 키가 없거나 연결할 수 없어 참고용 뉴스를 표시합니다.</p>
      </section>

      <div class="side-stack">
        <section class="panel weather-panel" aria-labelledby="weather-summary-title">
          <div class="panel-heading compact-heading">
            <div><p class="eyebrow">LIVE WEATHER</p><h2 id="weather-summary-title">지역별 날씨</h2></div>
            <RouterLink to="/weather">전체 보기 <span aria-hidden="true">→</span></RouterLink>
          </div>
          <p v-if="isWeatherLoading" class="weather-state" role="status">실시간 날씨를 불러오는 중입니다…</p>
          <div v-else-if="weather.length" class="weather-list">
            <RouterLink v-for="item in weather" :key="item.id" :to="`/weather/${item.id}`" class="weather-row">
              <span class="weather-icon" aria-hidden="true">{{ weatherIcon[item.status] ?? '🌤️' }}</span>
              <div><strong>{{ item.name }}</strong><span>{{ item.description }}</span></div>
              <p><strong>{{ configStore.formatTemperature(item.temp) }}</strong><span>체감 {{ configStore.formatTemperature(item.feelsLike) }}</span></p>
            </RouterLink>
          </div>
          <div v-else class="weather-error" role="alert">
            <p>{{ weatherError }}</p>
            <button type="button" @click="loadWeather">다시 시도</button>
          </div>
          <p v-if="weatherError && weather.length" class="partial-weather-error" role="status">일부 지역은 현재 정보를 불러오지 못했습니다.</p>
        </section>

        <section class="panel stock-panel" aria-labelledby="stock-summary-title">
          <div class="panel-heading compact-heading">
            <div><p class="eyebrow">U.S. MARKET</p><h2 id="stock-summary-title">미국 대형주</h2></div>
            <RouterLink to="/stocks">전체 보기 <span aria-hidden="true">→</span></RouterLink>
          </div>
          <div class="stock-list">
            <div v-for="stock in stocks" :key="stock.symbol" class="stock-row">
              <div class="stock-name"><span>{{ stock.name }}</span><small>{{ stock.symbol }}</small></div>
              <strong>{{ stock.value }}</strong>
              <span :class="stock.up === null ? 'pending' : stock.up ? 'up' : 'down'">{{ stock.change }}</span>
            </div>
          </div>
          <p class="market-notice">{{ marketNotice }}</p>
        </section>
      </div>
    </div>

    <aside class="pro-banner">
      <div class="pro-mark" aria-hidden="true">P</div>
      <div><strong>하루를 더 여유롭게 준비하고 싶다면</strong><p>14일 상세 예보와 맞춤 알림을 Weather Pro에서 만나보세요.</p></div>
      <RouterLink to="/subscribe">Pro 시작하기</RouterLink>
    </aside>
  </main>
</template>

<style scoped>
.dashboard-page { width: min(1120px, calc(100% - 40px)); margin: 0 auto; padding: 34px 0 64px; }
.dashboard-hero { display: flex; align-items: center; justify-content: space-between; min-height: 270px; padding: 42px 48px; overflow: hidden; border-radius: 22px; color: #fff; background: linear-gradient(125deg, #124f79 0%, #176fa7 62%, #3997cf 100%); box-shadow: 0 18px 42px rgba(30, 96, 141, .18); }
.date-label { margin: 0 0 12px; color: #bce3f9; font-size: .82rem; font-weight: 700; }
.dashboard-hero h1 { margin: 0; font-size: clamp(2.25rem, 5vw, 3.9rem); line-height: 1.12; letter-spacing: -.06em; }
.dashboard-hero h1 span { color: #c9ebff; }
.hero-copy { margin: 18px 0 0; color: rgba(255,255,255,.72); }
.hero-weather { position: relative; display: flex; align-items: center; min-width: 250px; gap: 20px; padding: 28px; border: 1px solid rgba(255,255,255,.2); border-radius: 18px; background: rgba(255,255,255,.1); box-shadow: inset 0 1px 0 rgba(255,255,255,.1); }
.sun { display: grid; width: 72px; height: 72px; border-radius: 50%; place-items: center; color: #ffdf6b; background: rgba(255,255,255,.12); font-size: 2.6rem; }
.hero-weather div { display: grid; }
.hero-weather strong { font-size: 2.5rem; line-height: 1; }
.hero-weather span:last-child { margin-top: 8px; color: rgba(255,255,255,.72); font-size: .84rem; }
.hero-weather-state { align-items: center; justify-content: center; color: rgba(255,255,255,.75); font-size: .8rem; }
.quick-strip { display: grid; grid-template-columns: repeat(4, 1fr); margin: 20px 0; padding: 17px 20px; border: 1px solid var(--line); border-radius: 14px; background: rgba(255,255,255,.78); }
.quick-strip > div { display: flex; align-items: center; gap: 8px; padding: 0 20px; border-right: 1px solid #e1ebf1; }
.quick-strip > div:first-child { padding-left: 0; }
.quick-strip > div:last-child { padding-right: 0; border-right: 0; }
.quick-strip span:not(.quick-dot) { color: #728897; font-size: .76rem; }
.quick-strip strong { margin-left: auto; color: #29475d; font-size: .82rem; }
.quick-strip .positive { color: #16815d; }
.quick-strip .negative { color: #bf5454; }
.quick-dot { width: 7px; height: 7px; flex: 0 0 auto; border-radius: 50%; background: #4da2d6; }
.air-dot { background: #33ab7a; }.market-dot { background: #ed8a69; }.rain-dot { background: #7c85d5; }
.dashboard-grid { display: grid; grid-template-columns: minmax(0, 1.42fr) minmax(340px, .9fr); gap: 20px; }
.panel { border: 1px solid var(--line); border-radius: 18px; background: rgba(255,255,255,.9); box-shadow: 0 8px 26px rgba(35,81,112,.055); }
.news-panel { padding: 28px 30px; }
.panel-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 16px; }
.eyebrow { margin: 0 0 6px; color: var(--blue-500); font-size: .68rem; font-weight: 800; letter-spacing: .16em; }
.panel-heading h2 { margin: 0; color: #203e54; font-size: 1.35rem; letter-spacing: -.035em; }
.source-label { padding: 5px 8px; border-radius: 99px; color: #527f9e; background: var(--blue-100); font-size: .62rem; font-weight: 800; }
.source-label.api { color: #167454; background: #e5f7ef; }
.source-label.loading { color: #7e8f9a; background: #edf2f5; }
.news-state { display: grid; min-height: 300px; margin: 0; place-items: center; color: #7890a1; font-size: .78rem; }
.news-list { display: grid; }
.news-item { display: grid; grid-template-columns: 38px 1fr; gap: 14px; padding: 22px 0; border-top: 1px solid #e5edf2; }
.news-number { padding-top: 4px; color: #9ab0be; font-size: .76rem; font-weight: 800; }
.news-meta { display: flex; gap: 8px; margin-bottom: 6px; color: #8ca0ae; font-size: .7rem; }
.news-meta span { color: var(--blue-700); font-weight: 800; }
.news-content h3 { margin: 0 0 7px; color: #28465b; font-size: 1rem; line-height: 1.45; }
.news-content h3 a { color: inherit; text-decoration: none; }
.news-content h3 a:hover { color: var(--blue-700); text-decoration: underline; text-underline-offset: 3px; }
.news-content p { margin: 0; color: #728796; font-size: .78rem; line-height: 1.65; }
.news-notice { margin: 12px 0 0; color: #8a9ca7; font-size: .65rem; }
.side-stack { display: grid; gap: 20px; }
.weather-panel, .stock-panel { padding: 24px; }
.compact-heading { align-items: center; }
.compact-heading a { color: var(--blue-700); font-size: .74rem; font-weight: 700; text-decoration: none; }
.compact-heading a:hover { text-decoration: underline; }
.weather-list { display: grid; }
.weather-state { min-height: 154px; display: grid; margin: 0; place-items: center; color: #7890a1; font-size: .78rem; }
.weather-error { display: grid; min-height: 154px; place-items: center; align-content: center; gap: 10px; text-align: center; }
.weather-error p { margin: 0; color: #a05252; font-size: .74rem; line-height: 1.5; }
.weather-error button { padding: 7px 11px; border: 0; border-radius: 8px; color: #fff; background: var(--blue-700); font-size: .7rem; }
.partial-weather-error { margin: 9px 0 0; color: #9b674e; font-size: .65rem; }
.weather-row { display: grid; grid-template-columns: 42px 1fr auto; align-items: center; gap: 10px; padding: 13px 4px; border-top: 1px solid #e6eef3; color: inherit; text-decoration: none; }
.weather-row:hover { background: #f7fbfd; }
.weather-icon { font-size: 1.65rem; }
.weather-row div, .weather-row p { display: grid; gap: 2px; margin: 0; }
.weather-row div span, .weather-row p span { color: #879aa7; font-size: .69rem; }
.weather-row div strong { color: #385469; font-size: .86rem; }
.weather-row p { text-align: right; }
.weather-row p strong { color: #203f56; font-size: 1.1rem; }
.stock-list { display: grid; }
.stock-row { display: grid; grid-template-columns: 1fr auto 62px; align-items: center; gap: 10px; padding: 11px 4px; border-top: 1px solid #e6eef3; font-size: .79rem; }
.stock-name { display: grid; gap: 1px; }
.stock-name span { color: #506b7e; font-weight: 700; }
.stock-name small { color: #94a5b0; font-size: .62rem; }
.stock-row strong { color: #28475c; }
.stock-row .up, .stock-row .down, .stock-row .pending { text-align: right; font-weight: 700; }
.stock-row .up { color: #16815d; }.stock-row .down { color: #bf5454; }
.stock-row .pending { color: #94a5b0; }
.market-notice { margin: 10px 0 0; color: #96a6b1; font-size: .66rem; }
.pro-banner { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 18px; margin-top: 20px; padding: 22px 26px; border: 1px solid #cbe1ee; border-radius: 16px; background: linear-gradient(90deg, #edf8ff, #fff); }
.pro-mark { display: grid; width: 40px; height: 40px; border-radius: 11px; place-items: center; color: #fff; background: var(--blue-700); font-weight: 900; }
.pro-banner strong { color: #28485d; font-size: .88rem; }
.pro-banner p { margin: 3px 0 0; color: #7b909e; font-size: .75rem; }
.pro-banner a { padding: 10px 14px; border-radius: 9px; color: #fff; background: var(--blue-700); font-size: .76rem; font-weight: 800; text-decoration: none; }
.pro-banner a:hover { background: #12527e; }

@media (max-width: 850px) {
  .dashboard-grid { grid-template-columns: 1fr; }
  .side-stack { grid-template-columns: repeat(2, 1fr); }
  .hero-weather { min-width: 220px; }
  .quick-strip { grid-template-columns: repeat(2, 1fr); row-gap: 15px; }
  .quick-strip > div:nth-child(2) { border-right: 0; }
}
@media (max-width: 600px) {
  .dashboard-page { width: min(100% - 24px, 1120px); padding-top: 24px; }
  .dashboard-hero { min-height: 0; padding: 30px 24px; }
  .hero-weather { display: none; }
  .hero-copy { font-size: .86rem; }
  .quick-strip { padding: 14px 12px; }
  .quick-strip > div { padding: 0 10px; }
  .quick-strip span:not(.quick-dot) { display: none; }
  .side-stack { grid-template-columns: 1fr; }
  .news-panel { padding: 22px 18px; }
  .news-item { grid-template-columns: 30px 1fr; gap: 8px; }
  .pro-banner { grid-template-columns: auto 1fr; padding: 18px; }
  .pro-banner a { grid-column: 1 / -1; text-align: center; }
}
</style>
