<script setup>
defineProps({
  items: { type: Array, default: () => [] },
  isLoading: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

defineEmits(['retry'])

const priceFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
})

const formatPrice = (value) => Number.isFinite(value) ? priceFormatter.format(value) : '—'
const formatPercent = (value) => Number.isFinite(value) ? `${value >= 0 ? '+' : ''}${value.toFixed(2)}%` : '—'

const candleShapes = (values) => {
  if (!Array.isArray(values) || values.length < 2) return []
  const min = Math.min(...values.map(({ low }) => low))
  const max = Math.max(...values.map(({ high }) => high))
  const range = max - min || 1
  const toY = (value) => 42 - ((value - min) / range) * 32
  const candleWidth = Math.min(6.4, 84 / values.length)
  return values.map((item, index) => ({
    x: 8 + (index / Math.max(values.length - 1, 1)) * 84,
    width: candleWidth,
    highY: toY(item.high),
    lowY: toY(item.low),
    openY: toY(item.open),
    closeY: toY(item.close),
    bodyY: Math.min(toY(item.open), toY(item.close)),
    bodyHeight: Math.max(1.8, Math.abs(toY(item.close) - toY(item.open))),
    positive: item.close >= item.open,
  }))
}
</script>

<template>
  <section class="market-etfs" aria-labelledby="market-etfs-title">
    <header class="market-etfs-heading">
      <div><p>MARKET PULSE</p><h2 id="market-etfs-title">미국 대표 지수 흐름</h2></div>
      <span>지수 추종 ETF 기준 · 5분 캐시</span>
    </header>
    <div v-if="isLoading" class="etf-grid" role="status" aria-label="주요 지수를 불러오는 중입니다">
      <span v-for="index in 3" :key="index" class="etf-skeleton"></span>
    </div>
    <div v-else-if="error" class="etf-state" role="alert">
      <p>{{ error }}</p><button type="button" @click="$emit('retry')">다시 불러오기</button>
    </div>
    <div v-else-if="items.length" class="etf-grid">
      <article v-for="item in items" :key="item.symbol" class="etf-card">
        <span class="etf-card-top"><strong>{{ item.name }}</strong><small>{{ item.symbol }}</small></span>
        <span class="etf-description">{{ item.description }}</span>
        <div v-if="item.history?.length > 1" class="etf-chart-wrap">
          <span>최근 10거래일</span>
          <svg class="etf-chart" viewBox="0 0 100 46" preserveAspectRatio="none" role="img" :aria-label="`${item.name} 최근 10거래일 캔들 차트`">
          <path class="etf-chart-guide" d="M 0 42 H 100" />
          <g v-for="(candle, index) in candleShapes(item.history)" :key="index" :class="['etf-candle', { positive: candle.positive, negative: !candle.positive }]">
            <line :x1="candle.x" :x2="candle.x" :y1="candle.highY" :y2="candle.lowY" />
            <rect :x="candle.x - candle.width / 2" :y="candle.bodyY" :width="candle.width" :height="candle.bodyHeight" rx=".5" />
          </g>
          </svg>
        </div>
        <span class="etf-price-row"><strong>{{ formatPrice(item.price) }}</strong><em :class="{ positive: item.changePercent >= 0, negative: item.changePercent < 0 }">{{ formatPercent(item.changePercent) }}</em></span>
      </article>
    </div>
    <p v-else class="etf-state">표시할 시장 지수 데이터가 없습니다.</p>
  </section>
</template>

<style scoped>
.market-etfs { margin-bottom: 20px; padding: 20px 22px; border: 1px solid var(--line); border-radius: 18px; background: var(--surface); box-shadow: var(--shadow); }
.market-etfs-heading { display: flex; align-items: end; justify-content: space-between; gap: 20px; }
.market-etfs-heading p { margin: 0 0 5px; color: var(--blue-500); font-size: .66rem; font-weight: 800; letter-spacing: .15em; }
.market-etfs-heading h2 { margin: 0; color: var(--ink); font-size: 1.12rem; letter-spacing: -.03em; }
.market-etfs-heading > span { color: var(--muted); font-size: .68rem; text-align: right; }
.etf-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 9px; }
.etf-card { display: grid; gap: 9px; min-width: 0; padding: 15px; border: 1px solid var(--line); border-radius: 12px; color: var(--ink); background: #fbfdff; text-align: left; cursor: default; }
.etf-card-top, .etf-price-row { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
.etf-card-top strong { font-size: .87rem; }.etf-card-top small { color: var(--muted); font-size: .66rem; font-weight: 800; }
.etf-description { color: var(--muted); font-size: .66rem; }
.etf-chart-wrap { display: grid; min-height: 112px; align-content: end; gap: 5px; padding: 11px 11px 7px; border: 1px solid #e5eef3; border-radius: 9px; background: #f8fbfd; }
.etf-chart-wrap > span { color: #78909f; font-size: .58rem; font-weight: 700; }
.etf-chart { display: block; width: 100%; height: 78px; overflow: visible; }
.etf-chart-guide { fill: none; stroke: #dce8ef; stroke-width: 1; stroke-dasharray: 2 2; }
.etf-candle line { stroke-width: 1.15; }.etf-candle rect { stroke-width: .7; }.etf-candle.positive { color: #19875a; }.etf-candle.positive line, .etf-candle.positive rect { stroke: currentColor; }.etf-candle.positive rect { fill: #d8f1e5; }.etf-candle.negative { color: #c04b4b; }.etf-candle.negative line, .etf-candle.negative rect { stroke: currentColor; }.etf-candle.negative rect { fill: #f8dddd; }
.etf-price-row { padding-top: 10px; border-top: 1px solid #e5eef3; }.etf-price-row strong { font-size: 1.08rem; }.etf-price-row em { font-size: .72rem; font-style: normal; font-weight: 800; }.positive { color: #14734f; }.negative { color: #b44242; }
.etf-skeleton { min-height: 111px; border-radius: 12px; background: linear-gradient(90deg, #eef3f6 25%, #f8fafb 50%, #eef3f6 75%); background-size: 200% 100%; animation: shimmer 1.2s infinite; }
.etf-state { display: grid; min-height: 80px; margin: 0; place-items: center; align-content: center; gap: 8px; color: var(--muted); font-size: .75rem; text-align: center; }.etf-state p { margin: 0; }.etf-state button { padding: 8px 11px; border: 0; border-radius: 8px; color: #fff; background: var(--blue-700); font: inherit; font-weight: 800; cursor: pointer; }
@keyframes shimmer { to { background-position: -200% 0; } }
@media (max-width: 650px) { .market-etfs { padding: 18px 14px; }.market-etfs-heading { align-items: flex-start; flex-direction: column; gap: 6px; }.market-etfs-heading > span { text-align: left; }.etf-grid { grid-template-columns: 1fr; } }
@media (prefers-reduced-motion: reduce) { .etf-skeleton { animation: none; } }
</style>
