<script setup>
import { computed } from 'vue'

const props = defineProps({
  markets: { type: Array, default: () => [] },
  quotes: { type: Object, default: () => ({}) },
  metrics: { type: Object, default: () => ({}) },
})

const sectorBySymbol = {
  NVDA: '반도체', AAPL: '빅테크', GOOG: '빅테크', MSFT: '빅테크', AMZN: '빅테크',
  AVGO: '반도체', SPCX: '우주·방산', META: '빅테크', TSLA: '자동차·에너지', 'BRK.B': '금융',
  LLY: '헬스케어', JPM: '금융', MU: '반도체', WMT: '소비재', AMD: '반도체', V: '금융',
  XOM: '에너지', JNJ: '헬스케어', MA: '금융', CSCO: '기술', INTC: '반도체', ABBV: '헬스케어',
  BAC: '금융', COST: '소비재', AMAT: '반도체', CVX: '에너지', KO: '소비재', UNH: '헬스케어', CAT: '산업재', ORCL: '기술',
}

const sectorItems = computed(() => {
  const available = props.markets.map((market) => ({
    ...market,
    sector: sectorBySymbol[market.symbol] || '기타',
    changePercent: props.quotes[market.symbol]?.changePercent,
    marketCap: props.metrics[market.symbol]?.marketCap,
  })).filter(({ changePercent }) => Number.isFinite(changePercent))
  const maxCap = Math.max(...available.map(({ marketCap }) => marketCap || 0), 1)
  return available.map((item) => ({
    ...item,
    weight: Math.max(1, Math.min(4, Math.round(((item.marketCap || maxCap * .08) / maxCap) * 4))),
    tone: item.changePercent >= 0 ? 'up' : 'down',
    intensity: Math.min(4, Math.max(1, Math.ceil(Math.abs(item.changePercent) / 1.5))),
  })).sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0))
})
const sectorGroups = computed(() => [...new Set(sectorItems.value.map(({ sector }) => sector))].map((sector) => ({
  sector,
  items: sectorItems.value.filter((item) => item.sector === sector),
})))
const averageChange = computed(() => {
  if (!sectorItems.value.length) return null
  return sectorItems.value.reduce((sum, item) => sum + item.changePercent, 0) / sectorItems.value.length
})
const formatPercent = (value) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
</script>

<template>
  <section class="heatmap-section" aria-labelledby="sector-heatmap-title">
    <header class="section-heading">
      <div><p class="eyebrow">MARKET BREADTH</p><h2 id="sector-heatmap-title">섹터 히트맵</h2></div>
      <span v-if="averageChange !== null">조회 종목 평균 {{ formatPercent(averageChange) }}</span>
      <span v-else>현재가를 불러오면 표시됩니다.</span>
    </header>
    <p class="heatmap-description">시가총액 상위 종목을 산업군별로 묶었습니다. 타일이 클수록 시가총액이 크고, 색이 진할수록 등락폭이 큽니다.</p>
    <div v-if="sectorGroups.length" class="sector-groups">
      <section v-for="group in sectorGroups" :key="group.sector" class="sector-group" :aria-labelledby="`sector-${group.sector}`">
        <h3 :id="`sector-${group.sector}`">{{ group.sector }}</h3>
        <div class="heatmap-grid">
          <div v-for="item in group.items" :key="item.symbol" class="heatmap-tile" :class="[`is-${item.tone}`, `intensity-${item.intensity}`]" :style="{ flexGrow: item.weight }" :aria-label="`${item.name} ${formatPercent(item.changePercent)}`">
            <strong>{{ item.symbol }}</strong><span>{{ formatPercent(item.changePercent) }}</span>
          </div>
        </div>
      </section>
    </div>
    <p v-else class="heatmap-empty">현재가를 불러오는 중이거나 표시할 종목이 없습니다.</p>
  </section>
</template>

<style scoped>
.heatmap-section { margin-bottom: 20px; padding: 22px; border: 1px solid var(--line); border-radius: 18px; background: var(--surface); box-shadow: var(--shadow); }.section-heading { display: flex; align-items: end; justify-content: space-between; gap: 16px; }.section-heading h2 { margin: 0; font-size: 1.25rem; letter-spacing: -.04em; }.section-heading > span { color: var(--muted); font-size: .69rem; }.eyebrow { margin: 0 0 7px; color: var(--blue-500); font-size: .66rem; font-weight: 800; letter-spacing: .16em; }.heatmap-description { margin: 9px 0 17px; color: var(--muted); font-size: .73rem; line-height: 1.5; }.sector-groups { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }.sector-group { min-width: 0; padding: 13px; border: 1px solid var(--line); border-radius: 12px; background: #fbfdff; }.sector-group h3 { margin: 0 0 10px; color: var(--blue-700); font-size: .77rem; }.heatmap-grid { display: flex; min-height: 58px; flex-wrap: wrap; gap: 5px; }.heatmap-tile { display: flex; min-width: 62px; min-height: 54px; flex-basis: 62px; flex-direction: column; justify-content: center; gap: 3px; padding: 7px; border-radius: 8px; color: #fff; box-sizing: border-box; }.heatmap-tile strong { font-size: .72rem; }.heatmap-tile span { font-size: .64rem; font-weight: 800; }.is-up.intensity-1 { background: #67af91; }.is-up.intensity-2 { background: #3f9b77; }.is-up.intensity-3 { background: #187a57; }.is-up.intensity-4 { background: #0b5a40; }.is-down.intensity-1 { background: #d58e8e; }.is-down.intensity-2 { background: #c56b6b; }.is-down.intensity-3 { background: #ad4d4d; }.is-down.intensity-4 { background: #873535; }.heatmap-empty { display: grid; min-height: 130px; margin: 16px 0 0; place-items: center; color: var(--muted); font-size: .76rem; }
@media (max-width: 900px) { .sector-groups { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 600px) { .section-heading { align-items: flex-start; flex-direction: column; gap: 5px; }.sector-groups { grid-template-columns: 1fr; }.heatmap-tile { min-width: 70px; } }
</style>
