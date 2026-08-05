<script setup>
import { computed, ref, watch } from 'vue'
import { STOCK_CHART_PERIODS } from '../services/stockApi'
import { useStockStore } from '../stores/stockStore'

const props = defineProps({
  markets: { type: Array, default: () => [] },
  defaultSymbol: { type: String, default: 'NVDA' },
})

const stockStore = useStockStore()
const selectedSymbol = ref('NVDA')
const chart = ref(null)
const quote = ref(null)
const isLoading = ref(false)
const error = ref('')
const investmentAmount = 1000

const availableMarkets = computed(() => props.markets.filter((market) => market?.symbol))
const selectedMarket = computed(() => availableMarkets.value.find(({ symbol }) => symbol === selectedSymbol.value))
const periodLabel = computed(() => STOCK_CHART_PERIODS.find(({ id }) => id === '1Y')?.label ?? '1년')
const startPoint = computed(() => chart.value?.values?.[0] ?? null)
const endPoint = computed(() => chart.value?.values?.at(-1) ?? null)
const currentPrice = computed(() => Number.isFinite(quote.value?.currentPrice) ? quote.value.currentPrice : endPoint.value?.close)
const returnRate = computed(() => startPoint.value?.close && Number.isFinite(currentPrice.value)
  ? ((currentPrice.value - startPoint.value.close) / startPoint.value.close) * 100
  : null)
const finalValue = computed(() => returnRate.value === null ? null : investmentAmount * (1 + returnRate.value / 100))
const formatPrice = (value) => Number.isFinite(value) ? `$${value.toFixed(2)}` : '—'
const formatMoney = (value) => Number.isFinite(value) ? `$${value.toFixed(0)}` : '—'
const formatDate = (value) => value ? new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(`${value.slice(0, 10)}T00:00:00`)) : '날짜 없음'

const load = async () => {
  if (!selectedMarket.value) return
  isLoading.value = true
  error.value = ''
  try {
    const [chartResult, quoteResult] = await Promise.all([
      stockStore.getChart(selectedMarket.value, '1Y'),
      stockStore.getQuote(selectedMarket.value),
    ])
    chart.value = chartResult
    quote.value = quoteResult
  } catch (loadError) {
    error.value = loadError.message || '지난 1년 수익률을 계산하지 못했습니다.'
  } finally {
    isLoading.value = false
  }
}

const initialise = () => {
  const preferred = props.defaultSymbol || 'NVDA'
  selectedSymbol.value = availableMarkets.value.some(({ symbol }) => symbol === preferred)
    ? preferred
    : availableMarkets.value[0]?.symbol ?? ''
}

watch(() => props.markets, () => { initialise(); load() }, { immediate: true })
watch(selectedSymbol, load)
</script>

<template>
  <section class="year-ago-card" aria-labelledby="year-ago-title">
    <header class="year-ago-heading">
      <div><p class="eyebrow">ONE YEAR CHECK</p><h2 id="year-ago-title">작년 오늘 주식을 샀다면?</h2></div>
      <label>종목<select v-model="selectedSymbol"><option v-for="market in availableMarkets" :key="market.symbol" :value="market.symbol">{{ market.name }} ({{ market.symbol }})</option></select></label>
    </header>
    <div v-if="isLoading" class="year-ago-state" role="status">지난 1년 데이터를 계산하는 중입니다…</div>
    <div v-else-if="error" class="year-ago-state error" role="alert">{{ error }}</div>
    <div v-else-if="returnRate !== null" class="year-ago-result">
      <div class="year-ago-main"><strong>{{ selectedMarket.name }}</strong><span>1년 수익률</span><b :class="{ negative: returnRate < 0 }">{{ returnRate >= 0 ? '+' : '' }}{{ returnRate.toFixed(2) }}%</b></div>
      <dl><div><dt>가정 매수일</dt><dd>{{ formatDate(startPoint.datetime) }}</dd></div><div><dt>매수 가격</dt><dd>{{ formatPrice(startPoint.close) }}</dd></div><div><dt>현재 가격</dt><dd>{{ formatPrice(currentPrice) }}</dd></div><div><dt> {{ formatMoney(investmentAmount) }} 투자했다면</dt><dd :class="{ negative: returnRate < 0 }">{{ formatMoney(finalValue) }}</dd></div></dl>
    </div>
    <p v-else class="year-ago-state">지난 1년 데이터를 표시할 수 없습니다.</p>
    <p class="year-ago-note">{{ periodLabel }} 차트의 종가 기준이며, 수수료·배당·환율은 반영하지 않은 참고용 계산입니다.</p>
  </section>
</template>

<style scoped>
.year-ago-card { padding: 22px; border: 1px solid var(--line); border-radius: 18px; background: var(--surface); box-shadow: var(--shadow); }.year-ago-heading { display: flex; align-items: end; justify-content: space-between; gap: 18px; margin-bottom: 17px; }.year-ago-heading h2 { margin: 0; font-size: 1.25rem; letter-spacing: -.04em; }.eyebrow { margin: 0 0 7px; color: var(--blue-500); font-size: .66rem; font-weight: 800; letter-spacing: .16em; }.year-ago-heading label { display: grid; min-width: 180px; gap: 6px; color: var(--muted); font-size: .68rem; font-weight: 700; }.year-ago-heading select { min-height: 38px; padding: 7px 10px; border: 1px solid #cadbe5; border-radius: 8px; color: var(--ink); background: #fbfdff; font: inherit; font-size: .76rem; }.year-ago-result { display: grid; grid-template-columns: minmax(160px, .6fr) 1fr; gap: 20px; padding: 16px; border: 1px solid var(--line); border-radius: 12px; background: #fbfdff; }.year-ago-main { display: grid; align-content: center; gap: 4px; }.year-ago-main strong { color: var(--ink); font-size: .9rem; }.year-ago-main span { color: var(--muted); font-size: .68rem; }.year-ago-main b { color: #16815d; font-size: 2rem; letter-spacing: -.05em; }.year-ago-main b.negative { color: #c05757; }.year-ago-result dl { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px 18px; margin: 0; }.year-ago-result dl div { display: grid; gap: 4px; }.year-ago-result dt { color: var(--muted); font-size: .64rem; }.year-ago-result dd { margin: 0; color: var(--ink); font-size: .78rem; font-weight: 800; }.year-ago-result dd.negative { color: #c05757; }.year-ago-state { display: grid; min-height: 110px; place-items: center; color: var(--muted); font-size: .76rem; }.year-ago-state.error { color: #a44b4b; }.year-ago-note { margin: 12px 0 0; color: #8397a4; font-size: .64rem; line-height: 1.5; }
@media (max-width: 680px) { .year-ago-heading { align-items: flex-start; flex-direction: column; }.year-ago-heading label { width: 100%; }.year-ago-result { grid-template-columns: 1fr; }.year-ago-main { padding-bottom: 13px; border-bottom: 1px solid var(--line); }.year-ago-main b { font-size: 1.8rem; } }
</style>
