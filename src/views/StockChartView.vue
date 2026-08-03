<script setup>
import { computed, onMounted, ref } from 'vue'
import { STOCK_MARKETS, fetchStockSeries } from '../services/stockApi'

document.title = '주식 시세 | SKALA Weather'
const cards = ref(STOCK_MARKETS.map((market) => ({ market, series: [], loading: true, error: '' })))
const todayLabel = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'long',
}).format(new Date())

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
})
const formatValue = (value) => currencyFormatter.format(value)
const formatChange = (value) => currencyFormatter.format(Math.abs(value))
const chartPoints = (series) => {
  if (!series.length) return ''
  const min = Math.min(...series.map(({ value }) => value))
  const max = Math.max(...series.map(({ value }) => value))
  const range = max - min || 1
  return series.map(({ value }, i) => `${(i / Math.max(series.length - 1, 1)) * 100},${92 - ((value - min) / range) * 76}`).join(' ')
}
const cardView = computed(() => cards.value.map((card) => ({
  ...card,
  latest: card.series.at(-1)?.value,
  change: card.change ?? (card.series.length > 1 ? card.series.at(-1).value - card.series.at(-2).value : 0),
  points: chartPoints(card.series),
})))

onMounted(async () => {
  await Promise.all(cards.value.map(async (card) => {
    try {
      const result = await fetchStockSeries(card.market)
      card.series = result.series
      card.source = result.source
      card.change = result.change
      card.percentChange = result.percentChange
    }
    catch (error) { card.error = error.message }
    finally { card.loading = false }
  }))
})
</script>

<template>
  <main class="stocks-page">
    <header class="stocks-header">
      <p class="eyebrow">MARKET SNAPSHOT</p>
      <h1>미국 시가총액 상위 10개</h1>
      <time class="today-date" :datetime="new Date().toISOString().slice(0, 10)">{{ todayLabel }}</time>
      <p>미국 대표 대형주의 현재가와 최근 흐름을 한눈에 확인해 보세요.</p>
      <small>투자 참고용 정보이며, 실제 매매 전 공식 거래소와 증권사 정보를 확인하세요.</small>
    </header>
    <section class="stock-grid" aria-label="미국 시가총액 상위 10개 종목">
      <article v-for="card in cardView" :key="card.market.id" class="stock-card">
        <div class="stock-card__heading"><div><h2><span class="rank">{{ card.market.rank }}</span>{{ card.market.name }}</h2><span>{{ card.market.symbol }}</span></div><span v-if="card.source === 'demo'" class="demo-badge">DEMO</span></div>
        <p v-if="card.loading" class="state" role="status">시세를 불러오는 중입니다…</p>
        <p v-else-if="card.error" class="state error" role="alert">{{ card.error }}</p>
        <template v-else>
          <div class="stock-value">{{ formatValue(card.latest) }}</div>
          <div :class="['change', { down: card.change < 0 }]">{{ card.change >= 0 ? '▲' : '▼' }} {{ formatChange(card.change) }}<span v-if="Number.isFinite(card.percentChange)"> ({{ Math.abs(card.percentChange).toFixed(2) }}%)</span></div>
          <svg class="chart" viewBox="0 0 100 100" role="img" :aria-label="`${card.market.name} 최근 가격 흐름`" preserveAspectRatio="none"><polyline :points="card.points" fill="none" stroke="currentColor" stroke-width="2.5" vector-effect="non-scaling-stroke" /></svg>
          <div class="chart-axis"><span>30일 전</span><span>최근</span></div>
        </template>
      </article>
    </section>
  </main>
</template>

<style scoped>
.stocks-page { width: min(1120px, calc(100% - 40px)); margin: 0 auto; padding: 40px 0 56px; }
.stocks-header { margin-bottom: 26px; }
.stocks-header h1 { margin: 0 0 10px; color: var(--ink); font-size: clamp(2rem, 5vw, 3rem); letter-spacing: -.055em; }
.today-date { display: block; margin-bottom: 12px; color: var(--blue-700); font-size: .9rem; font-weight: 700; }
.stocks-header p { margin: 0 0 8px; color: var(--muted); }
.stocks-header small { color: #7890a1; }
.eyebrow { margin: 0 0 8px !important; color: var(--blue-700) !important; font-size: .72rem; font-weight: 800; letter-spacing: .16em; }
.stock-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.stock-card { padding: 22px; border: 1px solid var(--line); border-radius: 14px; background: var(--surface); box-shadow: var(--shadow); }
.stock-card__heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
.stock-card h2 { margin: 0 0 3px; color: var(--ink); font-size: 1.1rem; }
.rank { display: inline-grid; width: 24px; height: 24px; margin-right: 8px; border-radius: 7px; place-items: center; color: var(--blue-700) !important; background: var(--blue-100); font-size: .72rem !important; }
.stock-card__heading span { color: var(--muted); font-size: .76rem; }
.demo-badge { padding: 3px 7px; border-radius: 999px; color: var(--blue-700) !important; background: var(--blue-100); font-size: .66rem !important; font-weight: 700; }
.stock-value { margin-top: 22px; color: var(--ink); font-size: 1.7rem; font-weight: 800; letter-spacing: -.04em; }
.change { margin-top: 4px; color: #16815d; font-size: .84rem; font-weight: 700; }
.change.down { color: #c05757; }
.chart { display: block; width: 100%; height: 132px; margin-top: 15px; overflow: visible; color: var(--blue-500); }
.chart-axis { display: flex; justify-content: space-between; color: #8aa0ae; font-size: .72rem; }
.state { min-height: 180px; display: grid; margin: 0; place-items: center; color: var(--muted); text-align: center; }
.state.error { color: #b24e4e; }
@media (max-width: 650px) { .stocks-page { width: min(100% - 24px, 1120px); padding-top: 24px; } .stock-grid { grid-template-columns: 1fr; } }
</style>
