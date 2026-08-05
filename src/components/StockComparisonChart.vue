<script setup>
import { computed, ref, watch } from 'vue'
import { STOCK_CHART_PERIODS } from '../services/stockApi'
import { useStockStore } from '../stores/stockStore'

const props = defineProps({
  markets: { type: Array, default: () => [] },
  defaultSymbols: { type: Array, default: () => [] },
})

const stockStore = useStockStore()
const selectedPeriod = ref('1M')
const firstSymbol = ref('')
const secondSymbol = ref('')
const seriesBySymbol = ref({})
const isLoading = ref(false)
const error = ref('')
const hoveredIndex = ref(null)

const periodOptions = STOCK_CHART_PERIODS
  .filter(({ id }) => ['1M', '3M', '6M', '1Y'].includes(id))
  .map(({ id, label }) => ({ value: id, label }))

const availableMarkets = computed(() => props.markets.filter((market) => market?.symbol))
const selectedMarkets = computed(() => [firstSymbol.value, secondSymbol.value]
  .map((symbol) => availableMarkets.value.find((market) => market.symbol === symbol))
  .filter(Boolean))
const normalizedSeries = computed(() => selectedMarkets.value.map((market) => {
  const values = seriesBySymbol.value[market.symbol]?.values ?? []
  const base = values[0]?.close
  return {
    ...market,
    values: base ? values.map((point) => ({ ...point, performance: ((point.close - base) / base) * 100 })) : [],
  }
}).filter(({ values }) => values.length))
const chartLength = computed(() => Math.max(...normalizedSeries.value.map(({ values }) => values.length), 0))
const chartStats = computed(() => {
  const points = normalizedSeries.value.flatMap(({ values }) => values.map(({ performance }) => performance))
  if (!points.length) return { min: -1, max: 1 }
  const min = Math.min(...points, 0)
  const max = Math.max(...points, 0)
  const range = Math.max(max - min, 1)
  return { min: min - range * .08, max: max + range * .08 }
})
const lines = computed(() => normalizedSeries.value.map((series) => {
  const range = chartStats.value.max - chartStats.value.min || 1
  return {
    ...series,
    points: series.values.map(({ performance }, index) => {
      const x = (index / Math.max(series.values.length - 1, 1)) * 100
      const y = 92 - ((performance - chartStats.value.min) / range) * 82
      return `${x.toFixed(2)},${y.toFixed(2)}`
    }).join(' '),
  }
}))
const hoveredPoint = computed(() => {
  if (hoveredIndex.value === null) return null
  return normalizedSeries.value.map((series) => ({
    symbol: series.symbol,
    name: series.name,
    point: series.values[hoveredIndex.value] ?? series.values.at(-1),
  }))
})
const hoveredX = computed(() => chartLength.value > 1 && hoveredIndex.value !== null
  ? (hoveredIndex.value / (chartLength.value - 1)) * 100
  : 0)

const loadComparison = async () => {
  if (selectedMarkets.value.length !== 2) return
  isLoading.value = true
  error.value = ''
  hoveredIndex.value = null
  try {
    const results = await Promise.allSettled(selectedMarkets.value.map((market) =>
      stockStore.getChart(market, selectedPeriod.value)))
    const loaded = {}
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') loaded[selectedMarkets.value[index].symbol] = result.value
    })
    if (Object.keys(loaded).length < 2) throw new Error('비교할 차트 데이터를 불러오지 못했습니다.')
    seriesBySymbol.value = loaded
  } catch (loadError) {
    error.value = loadError.message || '비교 차트를 불러오지 못했습니다.'
  } finally {
    isLoading.value = false
  }
}

const updateHover = (event) => {
  if (!chartLength.value) return
  const bounds = event.currentTarget.getBoundingClientRect()
  hoveredIndex.value = Math.round(Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width)) * (chartLength.value - 1))
}

const initialiseSelection = () => {
  const validSymbols = new Set(availableMarkets.value.map(({ symbol }) => symbol))
  const defaults = props.defaultSymbols.filter((symbol) => validSymbols.has(symbol))
  firstSymbol.value = validSymbols.has(firstSymbol.value) ? firstSymbol.value : defaults[0] ?? availableMarkets.value[0]?.symbol ?? ''
  secondSymbol.value = validSymbols.has(secondSymbol.value) && secondSymbol.value !== firstSymbol.value
    ? secondSymbol.value
    : defaults.find((symbol) => symbol !== firstSymbol.value) ?? availableMarkets.value.find(({ symbol }) => symbol !== firstSymbol.value)?.symbol ?? ''
}

watch(() => props.markets, () => { initialiseSelection(); loadComparison() }, { immediate: true })
watch([firstSymbol, secondSymbol, selectedPeriod], loadComparison)
</script>

<template>
  <section class="comparison-section" aria-labelledby="comparison-title">
    <header class="section-heading">
      <div><p class="eyebrow">RELATIVE PERFORMANCE</p><h2 id="comparison-title">종목 대 종목 수익률 비교</h2></div>
      <span>선택 기간 시작값을 0%로 맞춰 비교합니다.</span>
    </header>
    <div class="comparison-controls">
      <label>첫 번째 종목<select v-model="firstSymbol"><option v-for="market in availableMarkets" :key="market.symbol" :value="market.symbol">{{ market.name }} ({{ market.symbol }})</option></select></label>
      <span class="vs" aria-hidden="true">VS</span>
      <label>두 번째 종목<select v-model="secondSymbol"><option v-for="market in availableMarkets" :key="market.symbol" :value="market.symbol">{{ market.name }} ({{ market.symbol }})</option></select></label>
      <div class="comparison-periods" role="group" aria-label="비교 기간">
        <button v-for="option in periodOptions" :key="option.value" type="button" :class="{ active: selectedPeriod === option.value }" @click="selectedPeriod = option.value">{{ option.label }}</button>
      </div>
    </div>
    <div v-if="isLoading" class="comparison-state" role="status">두 종목의 가격 흐름을 불러오는 중입니다…</div>
    <div v-else-if="error" class="comparison-state error" role="alert">{{ error }}</div>
    <div v-else-if="lines.length" class="comparison-chart-wrap">
      <div class="comparison-legend"><span v-for="line in lines" :key="line.symbol"><i :style="{ background: line.symbol === firstSymbol ? '#318bd0' : '#c47b46' }"></i>{{ line.name }} <strong>{{ line.values.at(-1).performance >= 0 ? '+' : '' }}{{ line.values.at(-1).performance.toFixed(2) }}%</strong></span></div>
      <div class="comparison-chart" @pointermove="updateHover" @pointerleave="hoveredIndex = null">
        <span class="comparison-axis top">+{{ chartStats.max.toFixed(1) }}%</span><span class="comparison-axis bottom">{{ chartStats.min.toFixed(1) }}%</span>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="두 종목의 기간별 상대 수익률 비교 차트">
          <line x1="0" x2="100" y1="92" y2="92" class="zero-line" />
          <line v-if="hoveredPoint" :x1="hoveredX" :x2="hoveredX" y1="5" y2="95" class="hover-line" />
          <polyline v-for="line in lines" :key="line.symbol" :points="line.points" fill="none" :stroke="line.symbol === firstSymbol ? '#318bd0' : '#c47b46'" stroke-width="2.5" vector-effect="non-scaling-stroke" />
        </svg>
        <div v-if="hoveredPoint" class="comparison-tooltip" :style="{ left: `${hoveredX}%` }"><time>{{ hoveredPoint[0]?.point?.datetime?.slice(0, 10) }}</time><span v-for="item in hoveredPoint" :key="item.symbol"><strong>{{ item.symbol }}</strong> {{ item.point?.performance >= 0 ? '+' : '' }}{{ item.point?.performance?.toFixed(2) }}%</span></div>
      </div>
    </div>
    <p v-else class="comparison-state">비교할 종목을 선택해 주세요.</p>
  </section>
</template>

<style scoped>
.comparison-section { margin-bottom: 20px; padding: 22px; border: 1px solid var(--line); border-radius: 18px; background: var(--surface); box-shadow: var(--shadow); }
.section-heading { display: flex; align-items: end; justify-content: space-between; gap: 16px; margin-bottom: 16px; }.section-heading h2 { margin: 0; font-size: 1.25rem; letter-spacing: -.04em; }.section-heading > span { color: var(--muted); font-size: .69rem; }
.eyebrow { margin: 0 0 7px; color: var(--blue-500); font-size: .66rem; font-weight: 800; letter-spacing: .16em; }
.comparison-controls { display: flex; align-items: end; gap: 10px; margin-bottom: 18px; }.comparison-controls label { display: grid; flex: 1; gap: 6px; color: var(--muted); font-size: .68rem; font-weight: 700; }.comparison-controls select { width: 100%; min-height: 38px; padding: 7px 10px; border: 1px solid #cadbe5; border-radius: 8px; color: var(--ink); background: #fbfdff; font: inherit; font-size: .76rem; }.vs { padding-bottom: 11px; color: var(--blue-700); font-size: .65rem; font-weight: 900; }.comparison-periods { display: flex; gap: 4px; padding-bottom: 1px; }.comparison-periods button { min-height: 38px; padding: 7px 10px; border: 1px solid var(--line); border-radius: 8px; color: var(--muted); background: #fff; font-size: .68rem; font-weight: 800; cursor: pointer; }.comparison-periods button.active { border-color: var(--blue-700); color: #fff; background: var(--blue-700); }
.comparison-chart-wrap { padding: 15px 15px 12px; border: 1px solid var(--line); border-radius: 12px; background: #fbfdff; }.comparison-legend { display: flex; flex-wrap: wrap; gap: 15px; margin-bottom: 10px; color: var(--muted); font-size: .72rem; }.comparison-legend span { display: inline-flex; align-items: center; gap: 5px; }.comparison-legend i { width: 9px; height: 9px; border-radius: 50%; }.comparison-legend strong { color: var(--ink); }.comparison-chart { position: relative; height: 220px; margin-left: 35px; }.comparison-chart svg { display: block; width: 100%; height: 100%; overflow: visible; }.zero-line { stroke: #cbdde8; stroke-dasharray: 3 3; stroke-width: 1; vector-effect: non-scaling-stroke; }.hover-line { stroke: #668092; stroke-dasharray: 3 3; stroke-width: 1; vector-effect: non-scaling-stroke; }.comparison-axis { position: absolute; left: -35px; color: var(--muted); font-size: .62rem; }.comparison-axis.top { top: 0; }.comparison-axis.bottom { bottom: 7%; }.comparison-tooltip { position: absolute; top: 10px; display: grid; min-width: 112px; gap: 5px; padding: 9px 10px; border: 1px solid #bfd4e1; border-radius: 9px; color: var(--ink); background: rgba(255,255,255,.96); box-shadow: 0 8px 18px rgba(35,81,112,.14); font-size: .66rem; pointer-events: none; transform: translateX(8px); }.comparison-tooltip time { color: var(--blue-700); font-weight: 800; }.comparison-tooltip span { display: flex; justify-content: space-between; gap: 8px; }.comparison-state { display: grid; min-height: 220px; place-items: center; color: var(--muted); font-size: .78rem; text-align: center; }.comparison-state.error { color: #a44b4b; }
@media (max-width: 700px) { .comparison-controls { align-items: stretch; flex-wrap: wrap; }.comparison-controls label { min-width: calc(50% - 24px); }.vs { display: none; }.comparison-periods { width: 100%; }.comparison-periods button { flex: 1; }.section-heading { align-items: flex-start; flex-direction: column; gap: 5px; } }
@media (prefers-reduced-motion: reduce) { .comparison-section * { transition: none !important; } }
</style>
