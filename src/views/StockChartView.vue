<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import StockWatchlist from '../components/StockWatchlist.vue'
import {
  STOCK_CHART_PERIODS,
  STOCK_MARKETS,
  STOCK_RANKING_UPDATED_AT,
  fetchStockChart,
  fetchMarketStatus,
  fetchStockDetail,
  fetchStockProfile,
  fetchStockQuote,
  getChartErrorMessage,
  getStockErrorMessage,
} from '../services/stockApi'

document.title = '미국 주식 시세 | SKALA Weather'

const searchQuery = ref('')
const selectedMarket = ref(STOCK_MARKETS.find(({ symbol }) => symbol === 'AAPL') ?? STOCK_MARKETS[0])
const quotes = ref([])
const favoriteStorageKey = 'skala-stock-favorites'
const defaultFavoriteSymbols = ['NVDA', 'AAPL', 'MSFT']
const getSavedFavorites = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(favoriteStorageKey))
    if (!Array.isArray(saved)) return defaultFavoriteSymbols
    return saved.filter((symbol) => STOCK_MARKETS.some((market) => market.symbol === symbol)).slice(0, 6)
  } catch {
    return defaultFavoriteSymbols
  }
}
const favoriteSymbols = ref(getSavedFavorites())
const favoriteProfiles = ref({})
const favoriteMessage = ref('')
const marketStatus = ref(null)
const detail = ref(null)
const isListLoading = ref(true)
const isDetailLoading = ref(true)
const listError = ref('')
const detailError = ref('')
const detailCache = new Map()
const selectedPeriod = ref('1M')
const chartData = ref(null)
const isChartLoading = ref(true)
const chartError = ref('')
const chartCache = new Map()
let chartRequestId = 0
const initialQuoteCount = 10
const candlePeriodLabels = {
  '1D': '5분봉 캔들',
  '1W': '1시간봉 캔들',
  '1M': '일봉 캔들',
}

const filteredMarkets = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return STOCK_MARKETS
  return STOCK_MARKETS.filter((market) =>
    market.name.toLowerCase().includes(query) || market.symbol.toLowerCase().includes(query),
  )
})

const quoteBySymbol = computed(() => Object.fromEntries(quotes.value.map((quote) => [quote.symbol, quote])))
const favoriteMarkets = computed(() => favoriteSymbols.value
  .map((symbol) => STOCK_MARKETS.find((market) => market.symbol === symbol))
  .filter(Boolean)
  .map((market) => ({
    ...market,
    ...favoriteProfiles.value[market.symbol],
    ...quoteBySymbol.value[market.symbol],
  })))
const isSelectedFavorite = computed(() => favoriteSymbols.value.includes(selectedMarket.value.symbol))
const rangePosition = computed(() => {
  if (!detail.value) return 50
  const { currentPrice, week52High, week52Low } = detail.value
  if (![currentPrice, week52High, week52Low].every(Number.isFinite) || week52High === week52Low) return 50
  return Math.min(100, Math.max(0, ((currentPrice - week52Low) / (week52High - week52Low)) * 100))
})
const chartSeries = computed(() => chartData.value?.values ?? [])
const isCandlePeriod = computed(() => Boolean(candlePeriodLabels[selectedPeriod.value]))
const chartTypeLabel = computed(() => candlePeriodLabels[selectedPeriod.value] ?? '종가 라인')
const chartPlotSeries = computed(() => {
  if (chartSeries.value.length <= 240) return chartSeries.value
  const step = Math.ceil(chartSeries.value.length / 240)
  return chartSeries.value.filter((_, index) => index % step === 0 || index === chartSeries.value.length - 1)
})
const chartStats = computed(() => {
  if (!chartSeries.value.length) return null
  const closes = chartSeries.value.map(({ close }) => close)
  const lows = chartSeries.value.map(({ low, close }) => Number.isFinite(low) ? low : close)
  const highs = chartSeries.value.map(({ high, close }) => Number.isFinite(high) ? high : close)
  const first = closes[0]
  const last = closes.at(-1)
  const change = last - first
  return {
    min: Math.min(...lows),
    max: Math.max(...highs),
    first,
    last,
    change,
    percentChange: first ? (change / first) * 100 : 0,
  }
})
const chartPoints = computed(() => {
  if (!chartPlotSeries.value.length || !chartStats.value) return ''
  const range = chartStats.value.max - chartStats.value.min || 1
  return chartPlotSeries.value.map(({ close }, index) => {
    const x = (index / Math.max(chartPlotSeries.value.length - 1, 1)) * 100
    const y = 88 - ((close - chartStats.value.min) / range) * 72
    return `${x.toFixed(2)},${y.toFixed(2)}`
  }).join(' ')
})
const chartAreaPoints = computed(() => chartPoints.value ? `0,94 ${chartPoints.value} 100,94` : '')
const candleShapes = computed(() => {
  if (!isCandlePeriod.value || !chartPlotSeries.value.length || !chartStats.value) return []
  const range = chartStats.value.max - chartStats.value.min || 1
  const toY = (price) => 88 - ((price - chartStats.value.min) / range) * 72
  const width = Math.min(1.8, Math.max(.45, 72 / chartPlotSeries.value.length))

  return chartPlotSeries.value.map((item, index) => {
    const x = ((index + .5) / chartPlotSeries.value.length) * 100
    const openY = toY(item.open)
    const closeY = toY(item.close)
    const naturalHeight = Math.abs(closeY - openY)
    const height = Math.max(.8, naturalHeight)
    return {
      x,
      width,
      highY: toY(item.high),
      lowY: toY(item.low),
      bodyY: naturalHeight < .8 ? ((openY + closeY) / 2) - .4 : Math.min(openY, closeY),
      height,
      up: item.close >= item.open,
    }
  })
})
const volumeBars = computed(() => {
  if (!chartPlotSeries.value.length) return []
  const maxVolume = Math.max(...chartPlotSeries.value.map(({ volume }) => volume || 0), 1)
  const width = Math.max(.25, 80 / chartPlotSeries.value.length)
  return chartPlotSeries.value.map(({ volume }, index) => ({
    x: (index / Math.max(chartPlotSeries.value.length - 1, 1)) * 100,
    y: 99 - ((volume || 0) / maxVolume) * 8,
    height: ((volume || 0) / maxVolume) * 8,
    width,
  }))
})

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
})
const compactCurrencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 2,
})
const compactNumberFormatter = new Intl.NumberFormat('ko-KR', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

const formatPrice = (value) => Number.isFinite(value) ? currencyFormatter.format(value) : '—'
const formatCompactCurrency = (value) => Number.isFinite(value) ? compactCurrencyFormatter.format(value) : '—'
const formatNumber = (value, digits = 2) => Number.isFinite(value) ? value.toFixed(digits) : '—'
const formatVolume = (value) => Number.isFinite(value) ? compactNumberFormatter.format(value) : '—'
const formatDateTime = (value) => value
  ? new Intl.DateTimeFormat('ko-KR', {
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Seoul',
    }).format(new Date(value))
  : '업데이트 시간 없음'
const formatNewsDate = (value) => value
  ? new Intl.DateTimeFormat('ko-KR', { month: 'short', day: 'numeric' }).format(new Date(value))
  : '날짜 없음'
const formatChartDate = (value) => {
  if (!value) return '—'
  if (selectedPeriod.value === '1D') return value.slice(11, 16)
  return new Intl.DateTimeFormat('ko-KR', { year: '2-digit', month: 'short', day: 'numeric' })
    .format(new Date(`${value.slice(0, 10)}T00:00:00`))
}

const loadMarket = async () => {
  isListLoading.value = true
  listError.value = ''
  try {
    const [statusResult, quoteResults] = await Promise.all([
      fetchMarketStatus(),
      Promise.allSettled(STOCK_MARKETS.slice(0, initialQuoteCount).map(fetchStockQuote)),
    ])
    marketStatus.value = statusResult
    quotes.value = quoteResults.filter(({ status }) => status === 'fulfilled').map(({ value }) => value)
    if (!quotes.value.length) throw new Error('종목 시세를 불러오지 못했습니다.')
  } catch (error) {
    listError.value = getStockErrorMessage(error)
  } finally {
    isListLoading.value = false
  }
}

const loadFavoriteProfiles = async () => {
  const markets = favoriteSymbols.value
    .map((symbol) => STOCK_MARKETS.find((market) => market.symbol === symbol))
    .filter(Boolean)
  const results = await Promise.allSettled(markets.map(fetchStockProfile))
  favoriteProfiles.value = Object.fromEntries(results
    .filter(({ status }) => status === 'fulfilled')
    .map(({ value }) => [value.symbol, value]))

  const missingQuotes = markets.filter((market) => !quoteBySymbol.value[market.symbol])
  if (!missingQuotes.length) return
  const quoteResults = await Promise.allSettled(missingQuotes.map(fetchStockQuote))
  quotes.value.push(...quoteResults
    .filter(({ status }) => status === 'fulfilled')
    .map(({ value }) => value))
}

const loadDetail = async (market, force = false) => {
  selectedMarket.value = market
  detailError.value = ''
  loadChart(market, selectedPeriod.value, force)
  if (!force && detailCache.has(market.symbol)) {
    detail.value = detailCache.get(market.symbol)
    return
  }

  detail.value = null
  isDetailLoading.value = true
  try {
    const result = await fetchStockDetail(market)
    detailCache.set(market.symbol, result)
    detail.value = result
    const listQuote = { ...market, ...result }
    const quoteIndex = quotes.value.findIndex(({ symbol }) => symbol === market.symbol)
    if (quoteIndex >= 0) quotes.value.splice(quoteIndex, 1, listQuote)
    else quotes.value.push(listQuote)
  } catch (error) {
    detailError.value = getStockErrorMessage(error)
  } finally {
    isDetailLoading.value = false
  }
}

async function loadChart(market, periodId, force = false) {
  selectedPeriod.value = periodId
  chartError.value = ''
  const cacheKey = `${market.symbol}:${periodId}`
  if (!force && chartCache.has(cacheKey)) {
    chartData.value = chartCache.get(cacheKey)
    isChartLoading.value = false
    return
  }

  const requestId = ++chartRequestId
  chartData.value = null
  isChartLoading.value = true
  try {
    const result = await fetchStockChart(market, periodId)
    chartCache.set(cacheKey, result)
    if (requestId === chartRequestId) chartData.value = result
  } catch (error) {
    if (requestId === chartRequestId) chartError.value = getChartErrorMessage(error)
  } finally {
    if (requestId === chartRequestId) isChartLoading.value = false
  }
}

const retryAll = () => {
  loadMarket()
  loadDetail(selectedMarket.value, true)
}

const removeFavorite = (symbol) => {
  favoriteSymbols.value = favoriteSymbols.value.filter((item) => item !== symbol)
  favoriteMessage.value = '즐겨찾기에서 삭제했습니다.'
}

const toggleSelectedFavorite = () => {
  const symbol = selectedMarket.value.symbol
  if (isSelectedFavorite.value) {
    removeFavorite(symbol)
    return
  }
  if (favoriteSymbols.value.length >= 6) {
    favoriteMessage.value = '즐겨찾기는 최대 6개까지 저장할 수 있습니다.'
    return
  }
  favoriteSymbols.value = [...favoriteSymbols.value, symbol]
  if (detail.value?.symbol === symbol) {
    favoriteProfiles.value = {
      ...favoriteProfiles.value,
      [symbol]: { ...selectedMarket.value, name: detail.value.name, logo: detail.value.logo },
    }
  }
  favoriteMessage.value = `${selectedMarket.value.name}을(를) 즐겨찾기에 추가했습니다.`
}

watch(favoriteSymbols, (symbols) => {
  localStorage.setItem(favoriteStorageKey, JSON.stringify(symbols))
})

onMounted(async () => {
  await loadMarket()
  loadFavoriteProfiles()
  loadDetail(selectedMarket.value)
})
</script>

<template>
  <main class="stocks-page">
    <header class="stocks-header">
      <div>
        <p class="eyebrow">U.S. STOCK MARKET</p>
        <h1>미국 주식 시세</h1>
        <p>시가총액 상위 30개 미국 기업의 현재가와 주요 투자 정보를 확인합니다.</p>
      </div>
      <div class="market-session" :class="{ open: marketStatus?.isOpen }" role="status">
        <span aria-hidden="true"></span>
        <div><small>미국 시장</small><strong>{{ marketStatus?.label ?? '상태 확인 중' }}</strong></div>
      </div>
    </header>

    <StockWatchlist
      :items="favoriteMarkets"
      :selected-symbol="selectedMarket.symbol"
      @select-market="loadDetail"
      @remove-favorite="removeFavorite"
    />
    <p class="favorite-feedback" role="status" aria-live="polite">{{ favoriteMessage }}</p>

    <section class="stock-browser" aria-label="종목 탐색과 상세 정보">
      <aside class="stock-selector" aria-labelledby="stock-list-title">
        <div class="selector-heading">
          <div><p class="eyebrow">MARKET CAP TOP 30</p><h2 id="stock-list-title">종목 찾기</h2></div>
          <span>{{ STOCK_RANKING_UPDATED_AT.replaceAll('-', '.') }} 기준</span>
        </div>
        <label class="stock-search">
          <span>종목명 또는 코드 검색</span>
          <input v-model="searchQuery" type="search" placeholder="예: 애플 또는 AAPL" autocomplete="off">
        </label>

        <p v-if="isListLoading" class="list-state" role="status">현재 시세를 불러오는 중입니다…</p>
        <div v-else-if="listError" class="list-state error" role="alert">
          <p>{{ listError }}</p><button type="button" @click="loadMarket">다시 시도</button>
        </div>
        <p v-else-if="!filteredMarkets.length" class="list-state" role="status">검색 결과가 없습니다.</p>
        <ul v-else class="stock-list">
          <li v-for="market in filteredMarkets" :key="market.symbol">
            <button
              type="button"
              :class="{ selected: selectedMarket.symbol === market.symbol }"
              :aria-pressed="selectedMarket.symbol === market.symbol"
              @click="loadDetail(market)"
            >
              <span class="stock-rank">{{ market.rank }}</span>
              <span class="stock-identity"><strong>{{ market.name }}</strong><small>{{ market.symbol }}</small></span>
              <span v-if="quoteBySymbol[market.symbol]" class="stock-quote">
                <strong>{{ formatPrice(quoteBySymbol[market.symbol].currentPrice) }}</strong>
                <small :class="{ down: quoteBySymbol[market.symbol].change < 0 }">
                  {{ quoteBySymbol[market.symbol].change >= 0 ? '+' : '' }}{{ formatNumber(quoteBySymbol[market.symbol].change) }}
                </small>
              </span>
              <span v-else class="stock-quote unavailable"><small>선택 시 조회</small></span>
            </button>
          </li>
        </ul>
      </aside>

      <section class="stock-detail" aria-live="polite">
        <div v-if="isDetailLoading" class="detail-state" role="status">
          <span class="loader" aria-hidden="true"></span><p>{{ selectedMarket.name }} 정보를 불러오는 중입니다…</p>
        </div>
        <div v-else-if="detailError" class="detail-state error" role="alert">
          <strong>종목 정보를 불러오지 못했습니다.</strong><p>{{ detailError }}</p>
          <button type="button" @click="loadDetail(selectedMarket, true)">다시 시도</button>
        </div>
        <template v-else-if="detail">
          <header class="company-heading">
            <div class="company-identity">
              <img v-if="detail.logo" :src="detail.logo" :alt="`${detail.name} 로고`">
              <div v-else class="logo-fallback" aria-hidden="true">{{ detail.symbol.slice(0, 1) }}</div>
              <div><p>{{ detail.exchange }} · {{ detail.industry }}</p><h2>{{ detail.name }}</h2><span>{{ detail.symbol }}</span></div>
            </div>
            <div class="company-actions">
              <button
                type="button"
                class="favorite-toggle"
                :class="{ active: isSelectedFavorite }"
                :aria-pressed="isSelectedFavorite"
                @click="toggleSelectedFavorite"
              >{{ isSelectedFavorite ? '★ 즐겨찾기 해제' : '☆ 즐겨찾기 추가' }}</button>
              <a v-if="detail.website" :href="detail.website" target="_blank" rel="noopener noreferrer">기업 사이트 ↗</a>
            </div>
          </header>

          <section class="price-summary" aria-labelledby="current-price-title">
            <div>
              <p id="current-price-title">현재가</p>
              <strong>{{ formatPrice(detail.currentPrice) }}</strong>
              <span :class="{ down: detail.change < 0 }">
                {{ detail.change >= 0 ? '▲' : '▼' }} {{ formatPrice(Math.abs(detail.change)) }}
                ({{ detail.changePercent >= 0 ? '+' : '' }}{{ formatNumber(detail.changePercent) }}%)
              </span>
            </div>
            <div class="update-meta">
              <span class="live-label">API LIVE</span>
              <time :datetime="detail.updatedAt">{{ formatDateTime(detail.updatedAt) }}</time>
              <small>가격은 거래소 상황에 따라 지연될 수 있습니다.</small>
            </div>
          </section>

          <section class="daily-section" aria-labelledby="daily-title">
            <div class="section-heading"><div><p class="eyebrow">TODAY</p><h3 id="daily-title">금일 거래 정보</h3></div></div>
            <dl class="daily-grid">
              <div><dt>시가</dt><dd>{{ formatPrice(detail.open) }}</dd></div>
              <div><dt>고가</dt><dd>{{ formatPrice(detail.high) }}</dd></div>
              <div><dt>저가</dt><dd>{{ formatPrice(detail.low) }}</dd></div>
              <div><dt>전일 종가</dt><dd>{{ formatPrice(detail.previousClose) }}</dd></div>
            </dl>
            <p class="availability-note">당일 거래량과 거래대금은 현재 Finnhub 무료 API 응답에 포함되지 않습니다.</p>
          </section>

          <section class="price-chart-section" aria-labelledby="price-chart-title">
            <div class="chart-heading">
              <div><p class="eyebrow">PRICE HISTORY</p><h3 id="price-chart-title">기간별 가격 차트</h3></div>
              <span>{{ chartTypeLabel }} · Twelve Data</span>
            </div>
            <div class="period-tabs" aria-label="차트 기간 선택">
              <button
                v-for="period in STOCK_CHART_PERIODS"
                :key="period.id"
                type="button"
                :class="{ active: selectedPeriod === period.id }"
                :aria-pressed="selectedPeriod === period.id"
                @click="loadChart(selectedMarket, period.id)"
              >{{ period.label }}</button>
            </div>

            <div v-if="isChartLoading" class="chart-state" role="status">
              <span class="loader" aria-hidden="true"></span><p>차트 데이터를 불러오는 중입니다…</p>
            </div>
            <div v-else-if="chartError" class="chart-state error" role="alert">
              <strong>차트를 불러오지 못했습니다.</strong><p>{{ chartError }}</p>
              <button type="button" @click="loadChart(selectedMarket, selectedPeriod, true)">다시 시도</button>
            </div>
            <div v-else-if="chartStats" class="price-chart">
              <div class="chart-summary">
                <div><small>기간 종가</small><strong>{{ formatPrice(chartStats.last) }}</strong></div>
                <span :class="{ down: chartStats.change < 0 }">
                  {{ chartStats.change >= 0 ? '+' : '' }}{{ formatPrice(chartStats.change) }}
                  ({{ chartStats.percentChange >= 0 ? '+' : '' }}{{ formatNumber(chartStats.percentChange) }}%)
                </span>
              </div>
              <div class="chart-canvas">
                <div class="chart-y-axis" aria-hidden="true">
                  <span>{{ formatPrice(chartStats.max) }}</span>
                  <span>{{ formatPrice((chartStats.max + chartStats.min) / 2) }}</span>
                  <span>{{ formatPrice(chartStats.min) }}</span>
                </div>
                <svg
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  role="img"
                  :aria-label="`${detail.name} ${STOCK_CHART_PERIODS.find(({ id }) => id === selectedPeriod)?.label} ${chartTypeLabel} 가격 변화. 시작 ${formatPrice(chartStats.first)}, 마지막 ${formatPrice(chartStats.last)}`"
                >
                  <defs>
                    <linearGradient id="stock-area-gradient" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0" stop-color="currentColor" stop-opacity=".24" />
                      <stop offset="1" stop-color="currentColor" stop-opacity=".02" />
                    </linearGradient>
                  </defs>
                  <line v-for="y in [16, 52, 88]" :key="y" x1="0" x2="100" :y1="y" :y2="y" class="grid-line" />
                  <template v-if="isCandlePeriod">
                    <g v-for="(candle, index) in candleShapes" :key="`candle-${index}`" :class="candle.up ? 'candle-up' : 'candle-down'">
                      <line :x1="candle.x" :x2="candle.x" :y1="candle.highY" :y2="candle.lowY" class="candle-wick" />
                      <rect :x="candle.x - candle.width / 2" :y="candle.bodyY" :width="candle.width" :height="candle.height" class="candle-body" />
                    </g>
                  </template>
                  <template v-else>
                    <polygon :points="chartAreaPoints" fill="url(#stock-area-gradient)" />
                    <polyline :points="chartPoints" fill="none" stroke="currentColor" stroke-width="2" vector-effect="non-scaling-stroke" />
                  </template>
                  <rect
                    v-for="(bar, index) in volumeBars"
                    :key="index"
                    :x="bar.x"
                    :y="bar.y"
                    :width="bar.width"
                    :height="bar.height"
                    class="volume-bar"
                  />
                </svg>
              </div>
              <div class="chart-x-axis">
                <time :datetime="chartSeries[0]?.datetime">{{ formatChartDate(chartSeries[0]?.datetime) }}</time>
                <span>OHLCV · {{ chartSeries.length }}개 데이터</span>
                <time :datetime="chartSeries.at(-1)?.datetime">{{ formatChartDate(chartSeries.at(-1)?.datetime) }}</time>
              </div>
            </div>
          </section>

          <section class="range-section" aria-labelledby="range-title">
            <div class="section-heading">
              <div><p class="eyebrow">52-WEEK RANGE</p><h3 id="range-title">52주 가격 범위</h3></div>
              <span>실제 Finnhub 지표</span>
            </div>
            <div class="range-chart" role="img" :aria-label="`52주 최저 ${formatPrice(detail.week52Low)}, 현재 ${formatPrice(detail.currentPrice)}, 최고 ${formatPrice(detail.week52High)}`">
              <div class="range-track"><span :style="{ left: `${rangePosition}%` }"></span></div>
              <div class="range-labels"><span>최저 <strong>{{ formatPrice(detail.week52Low) }}</strong></span><span>현재 <strong>{{ formatPrice(detail.currentPrice) }}</strong></span><span>최고 <strong>{{ formatPrice(detail.week52High) }}</strong></span></div>
            </div>
          </section>

          <section class="metrics-section" aria-labelledby="metrics-title">
            <div class="section-heading"><div><p class="eyebrow">FUNDAMENTALS</p><h3 id="metrics-title">기업·투자 지표</h3></div></div>
            <dl class="metrics-grid">
              <div><dt>시가총액</dt><dd>{{ formatCompactCurrency(detail.marketCap) }}</dd></div>
              <div><dt>PER</dt><dd>{{ formatNumber(detail.per) }}배</dd></div>
              <div><dt>PBR</dt><dd>{{ formatNumber(detail.pbr) }}배</dd></div>
              <div><dt>EPS</dt><dd>{{ formatPrice(detail.eps) }}</dd></div>
              <div><dt>BPS</dt><dd>{{ formatPrice(detail.bps) }}</dd></div>
              <div><dt>배당수익률</dt><dd>{{ formatNumber(detail.dividendYield) }}%</dd></div>
              <div><dt>3개월 평균 거래량</dt><dd>{{ formatVolume(detail.averageVolume) }}</dd></div>
              <div><dt>발행주식수</dt><dd>{{ formatVolume(detail.sharesOutstanding) }}</dd></div>
            </dl>
          </section>

          <section class="news-section" aria-labelledby="news-title">
            <div class="section-heading">
              <div><p class="eyebrow">COMPANY NEWS</p><h3 id="news-title">최신 뉴스</h3></div>
              <span>{{ detail.news.length }}건</span>
            </div>
            <div v-if="detail.news.length" class="news-list">
              <article v-for="item in detail.news" :key="item.id" class="news-item">
                <div><span>{{ item.source }}</span><time :datetime="item.publishedAt">{{ formatNewsDate(item.publishedAt) }}</time></div>
                <h4><a :href="item.url" target="_blank" rel="noopener noreferrer">{{ item.headline }}</a></h4>
                <p>{{ item.summary }}</p>
              </article>
            </div>
            <p v-else class="news-empty">최근 30일 이내 관련 뉴스가 없습니다.</p>
          </section>
        </template>
      </section>
    </section>

    <aside class="data-notice">
      <div><strong>데이터 안내</strong><p>시가총액 순위는 {{ STOCK_RANKING_UPDATED_AT.replaceAll('-', '.') }} 기준 스냅샷입니다. 현재가·기업 정보·뉴스는 Finnhub, 기간별 차트는 Twelve Data에서 가져오며 순위와 가격은 변동될 수 있습니다.</p></div>
      <button type="button" @click="retryAll">전체 새로고침</button>
    </aside>
  </main>
</template>

<style scoped>
.stocks-page { width: min(1180px, calc(100% - 40px)); margin: 0 auto; padding: 44px 0 72px; color: var(--ink); }
.stocks-header { display: flex; align-items: flex-end; justify-content: space-between; gap: 32px; margin-bottom: 28px; }
.stocks-header h1 { margin: 0 0 10px; font-size: clamp(2.25rem, 5vw, 3.6rem); letter-spacing: -.06em; }
.stocks-header > div > p:last-child { margin: 0; color: var(--muted); }
.eyebrow { margin: 0 0 7px; color: var(--blue-500); font-size: .68rem; font-weight: 800; letter-spacing: .16em; }
.market-session { display: flex; align-items: center; min-width: 170px; gap: 10px; padding: 13px 16px; border: 1px solid var(--line); border-radius: 12px; background: var(--surface); }
.market-session > span { width: 9px; height: 9px; border-radius: 50%; background: #9aaab5; }
.market-session.open > span { background: #1f9d70; box-shadow: 0 0 0 4px rgba(31,157,112,.12); }
.market-session div { display: grid; gap: 2px; }.market-session small { color: var(--muted); font-size: .67rem; }.market-session strong { font-size: .84rem; }
.favorite-feedback { min-height: 18px; margin: -12px 0 10px; color: var(--blue-700); font-size: .7rem; text-align: right; }
.stock-browser { display: grid; grid-template-columns: 310px minmax(0, 1fr); min-width: 0; align-items: start; gap: 20px; }
.stock-selector, .stock-detail { min-width: 0; border: 1px solid var(--line); border-radius: 18px; background: var(--surface); box-shadow: var(--shadow); }
.stock-selector { position: sticky; top: 16px; padding: 22px 16px 16px; }
.selector-heading, .section-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.selector-heading { padding: 0 6px; }.selector-heading h2, .section-heading h3 { margin: 0; letter-spacing: -.03em; }.selector-heading h2 { font-size: 1.25rem; }
.selector-heading > span, .section-heading > span { color: var(--muted); font-size: .7rem; }
.stock-search { display: grid; gap: 7px; margin: 18px 6px 14px; color: #536f82; font-size: .72rem; font-weight: 700; }
.stock-search input { width: 100%; padding: 11px 12px; border: 1px solid #cadbe5; border-radius: 9px; color: var(--ink); background: #fbfdff; font: inherit; font-size: .82rem; }
.stock-search input:focus-visible, button:focus-visible, a:focus-visible { outline: 3px solid #84c9f3; outline-offset: 2px; }
.stock-list { max-height: 610px; margin: 0; padding: 0; overflow-y: auto; list-style: none; }
.stock-list li + li { margin-top: 3px; }
.stock-list button { display: grid; grid-template-columns: 24px minmax(0, 1fr) auto; align-items: center; width: 100%; gap: 9px; padding: 11px 10px; border: 0; border-radius: 10px; color: inherit; background: transparent; text-align: left; cursor: pointer; }
.stock-list button:hover { background: #f2f8fc; }.stock-list button.selected { background: var(--blue-100); box-shadow: inset 3px 0 var(--blue-500); }
.stock-rank { display: grid; width: 23px; height: 23px; border-radius: 7px; place-items: center; color: var(--blue-700); background: #e5f3fc; font-size: .68rem; font-weight: 800; }
.stock-identity, .stock-quote { display: grid; gap: 2px; }.stock-identity strong { font-size: .81rem; }.stock-identity small, .stock-quote small { color: var(--muted); font-size: .65rem; }
.stock-quote { text-align: right; }.stock-quote strong { font-size: .75rem; }.stock-quote small { color: #16815d; }.stock-quote small.down { color: #c05757; }.stock-quote.unavailable { max-width: 55px; color: var(--muted); line-height: 1.2; }.stock-quote.unavailable small { color: inherit; }
.list-state { display: grid; min-height: 240px; padding: 20px; place-items: center; color: var(--muted); text-align: center; }.list-state.error { color: #a44b4b; }
.list-state button, .detail-state button, .chart-state button { padding: 9px 13px; border: 0; border-radius: 8px; color: #fff; background: var(--blue-700); cursor: pointer; }
.stock-detail { min-height: 720px; padding: 30px; }
.detail-state { display: grid; min-height: 600px; place-items: center; align-content: center; gap: 10px; color: var(--muted); text-align: center; }.detail-state p { margin: 0; }.detail-state.error strong { color: #8f4141; }
.loader { width: 28px; height: 28px; border: 3px solid #d8e9f4; border-top-color: var(--blue-500); border-radius: 50%; animation: spin .7s linear infinite; }
.company-heading { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding-bottom: 24px; border-bottom: 1px solid var(--line); }
.company-identity { display: flex; align-items: center; gap: 14px; }.company-identity img, .logo-fallback { width: 52px; height: 52px; border: 1px solid var(--line); border-radius: 13px; object-fit: contain; background: #fff; }
.logo-fallback { display: grid; place-items: center; color: var(--blue-700); background: var(--blue-100); font-weight: 900; }
.company-identity p { margin: 0 0 3px; color: var(--muted); font-size: .68rem; }.company-identity h2 { margin: 0; font-size: 1.45rem; letter-spacing: -.04em; }.company-identity span { color: var(--blue-700); font-size: .75rem; font-weight: 800; }
.company-actions { display: flex; align-items: center; gap: 10px; }
.company-actions > a { color: var(--blue-700); font-size: .76rem; font-weight: 700; text-decoration: none; }
.favorite-toggle { padding: 8px 10px; border: 1px solid #bdd2df; border-radius: 8px; color: var(--blue-700); background: #fff; font-size: .72rem; font-weight: 800; cursor: pointer; }
.favorite-toggle:hover, .favorite-toggle.active { border-color: #e3b642; color: #7b5a00; background: #fff8dc; }
.price-summary { display: flex; align-items: flex-end; justify-content: space-between; gap: 28px; padding: 27px 0; border-bottom: 1px solid var(--line); }
.price-summary > div:first-child { display: grid; grid-template-columns: auto auto; align-items: baseline; column-gap: 12px; }.price-summary p { grid-column: 1 / -1; margin: 0 0 5px; color: var(--muted); font-size: .72rem; }.price-summary strong { font-size: clamp(2.1rem, 5vw, 3.1rem); letter-spacing: -.06em; }.price-summary span { color: #16815d; font-size: .82rem; font-weight: 800; }.price-summary span.down { color: #c05757; }
.update-meta { display: grid; justify-items: end; gap: 4px; color: var(--muted); font-size: .67rem; }.update-meta .live-label { padding: 4px 7px; border-radius: 999px; color: #176c51; background: #e4f7ef; font-size: .62rem; }.update-meta small { max-width: 220px; text-align: right; }
.daily-section, .price-chart-section, .range-section, .metrics-section, .news-section { padding-top: 28px; }.section-heading { align-items: end; margin-bottom: 15px; }.section-heading h3 { font-size: 1.15rem; }
.daily-grid, .metrics-grid { display: grid; margin: 0; border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }.daily-grid { grid-template-columns: repeat(4, 1fr); }.metrics-grid { grid-template-columns: repeat(4, 1fr); }
.daily-grid div, .metrics-grid div { display: grid; gap: 6px; padding: 16px; border-right: 1px solid var(--line); background: #fbfdff; }.daily-grid div:last-child { border-right: 0; }.metrics-grid div:nth-child(4n) { border-right: 0; }.metrics-grid div:nth-child(n+5) { border-top: 1px solid var(--line); }
dt { color: var(--muted); font-size: .69rem; }dd { margin: 0; font-size: .88rem; font-weight: 800; }
.availability-note { margin: 10px 0 0; color: #738a99; font-size: .69rem; }
.chart-heading { display: flex; align-items: end; justify-content: space-between; gap: 16px; }.chart-heading h3 { margin: 0; font-size: 1.15rem; letter-spacing: -.03em; }.chart-heading > span { color: var(--muted); font-size: .7rem; }
.period-tabs { display: flex; gap: 4px; margin: 15px 0 12px; overflow-x: auto; scrollbar-width: thin; }.period-tabs button { min-width: 48px; flex: 1 0 auto; padding: 8px 10px; border: 1px solid var(--line); border-radius: 8px; color: #607b8d; background: #fff; font-size: .7rem; font-weight: 700; cursor: pointer; }.period-tabs button:hover { border-color: #9bc6df; color: var(--blue-700); background: #f3f9fd; }.period-tabs button.active { border-color: var(--blue-500); color: #fff; background: var(--blue-700); }
.chart-state { display: grid; min-height: 290px; padding: 24px; place-items: center; align-content: center; gap: 10px; border: 1px solid var(--line); border-radius: 12px; color: var(--muted); background: #fbfdff; text-align: center; }.chart-state p { margin: 0; }.chart-state.error strong { color: #8f4141; }
.price-chart { padding: 18px 18px 14px; border: 1px solid var(--line); border-radius: 12px; background: #fbfdff; }.chart-summary { display: flex; align-items: end; justify-content: space-between; gap: 20px; margin-bottom: 10px; }.chart-summary > div { display: grid; gap: 3px; }.chart-summary small { color: var(--muted); font-size: .67rem; }.chart-summary strong { font-size: 1.25rem; }.chart-summary > span { color: #16815d; font-size: .74rem; font-weight: 800; }.chart-summary > span.down { color: #c05757; }
.chart-canvas { position: relative; height: 250px; padding-left: 52px; overflow: hidden; }.chart-canvas svg { display: block; width: 100%; height: 100%; overflow: visible; color: var(--blue-500); }.chart-y-axis { position: absolute; inset: 0 auto 0 0; display: flex; width: 48px; flex-direction: column; justify-content: space-between; padding: 32px 0 25px; color: #8a9eab; font-size: .62rem; }.grid-line { stroke: #dce8ef; stroke-width: .5; vector-effect: non-scaling-stroke; }.volume-bar { fill: #9bcce8; opacity: .58; }
.candle-up { color: #16815d; }.candle-down { color: #c05757; }.candle-wick { stroke: currentColor; stroke-width: 1; vector-effect: non-scaling-stroke; }.candle-body { fill: currentColor; }
.chart-x-axis { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-left: 52px; color: #8296a4; font-size: .62rem; }.chart-x-axis span { text-align: center; }
.range-chart { padding: 20px; border: 1px solid var(--line); border-radius: 12px; background: #fbfdff; }.range-track { position: relative; height: 7px; margin: 8px 7px 16px; border-radius: 99px; background: linear-gradient(90deg, #b8d7eb, var(--blue-500)); }.range-track span { position: absolute; top: 50%; width: 16px; height: 16px; border: 3px solid #fff; border-radius: 50%; background: var(--blue-700); box-shadow: 0 1px 5px rgba(21,74,110,.28); transform: translate(-50%, -50%); }.range-labels { display: flex; justify-content: space-between; color: var(--muted); font-size: .68rem; }.range-labels span { display: grid; gap: 3px; }.range-labels span:nth-child(2) { text-align: center; }.range-labels span:last-child { text-align: right; }.range-labels strong { color: var(--ink); font-size: .76rem; }
.news-list { border-top: 1px solid var(--line); }.news-item { padding: 17px 0; border-bottom: 1px solid var(--line); }.news-item > div { display: flex; gap: 8px; color: var(--muted); font-size: .66rem; }.news-item h4 { margin: 6px 0; font-size: .9rem; line-height: 1.4; }.news-item h4 a { color: var(--ink); text-decoration: none; }.news-item h4 a:hover { color: var(--blue-700); text-decoration: underline; }.news-item p { display: -webkit-box; margin: 0; overflow: hidden; color: var(--muted); font-size: .72rem; line-height: 1.55; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }.news-empty { padding: 30px; color: var(--muted); text-align: center; }
.data-notice { display: flex; align-items: center; justify-content: space-between; gap: 24px; margin-top: 20px; padding: 18px 22px; border: 1px solid var(--line); border-radius: 14px; background: #edf6fb; }.data-notice strong { font-size: .8rem; }.data-notice p { margin: 4px 0 0; color: var(--muted); font-size: .7rem; }.data-notice button { flex: 0 0 auto; padding: 9px 12px; border: 1px solid #aecbdb; border-radius: 8px; color: var(--blue-700); background: #fff; font-weight: 700; cursor: pointer; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 900px) { .stock-browser { grid-template-columns: minmax(0, 1fr); }.stock-selector { position: static; }.stock-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); max-height: min(520px, 55vh); gap: 3px; }.stock-list li + li { margin: 0; }.stock-detail { min-height: 600px; }.metrics-grid { grid-template-columns: repeat(2, 1fr); }.metrics-grid div:nth-child(2n) { border-right: 0; }.metrics-grid div:nth-child(n+3) { border-top: 1px solid var(--line); } }
@media (max-width: 650px) { .stocks-page { width: min(100% - 24px, 1180px); padding-top: 26px; }.stocks-header { align-items: flex-start; flex-direction: column; gap: 18px; }.market-session { min-width: 0; }.favorite-feedback { text-align: left; }.stock-list { grid-template-columns: 1fr; max-height: min(440px, 52vh); }.stock-detail { padding: 20px 16px; }.company-heading, .price-summary { align-items: flex-start; flex-direction: column; }.company-actions { align-items: flex-start; flex-direction: column; }.update-meta { justify-items: start; }.update-meta small { text-align: left; }.daily-grid { grid-template-columns: repeat(2, 1fr); }.daily-grid div:nth-child(2) { border-right: 0; }.daily-grid div:nth-child(n+3) { border-top: 1px solid var(--line); }.metrics-grid { grid-template-columns: repeat(2, 1fr); }.chart-canvas { height: 210px; padding-left: 42px; }.chart-y-axis { width: 39px; font-size: .57rem; }.chart-x-axis { padding-left: 42px; }.range-labels { gap: 8px; }.data-notice { align-items: flex-start; flex-direction: column; } }
@media (prefers-reduced-motion: reduce) { .loader { animation: none; } * { scroll-behavior: auto !important; transition: none !important; } }
</style>
