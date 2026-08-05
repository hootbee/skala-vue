<script setup>
defineProps({
  items: { type: Array, default: () => [] },
  isLoading: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

defineEmits(['retry'])

const formatPrice = (item) => {
  if (!Number.isFinite(item.price)) return '—'
  if (item.id === 'usdkrw') return `₩${item.price.toLocaleString('ko-KR', { maximumFractionDigits: 2 })}`
  return `$${item.price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
}
const formatPercent = (value) => Number.isFinite(value) ? `${value >= 0 ? '+' : ''}${value.toFixed(2)}%` : '—'
</script>

<template>
  <section class="macro-strip" aria-labelledby="macro-strip-title">
    <header class="macro-heading"><div><p class="eyebrow">MARKET MACRO</p><h2 id="macro-strip-title">환율·금 흐름</h2></div><span>실시간 참고 지표 · 5분 캐시</span></header>
    <div v-if="isLoading" class="macro-grid" role="status" aria-label="환율과 금 시세를 불러오는 중입니다"><span v-for="index in 2" :key="index" class="macro-skeleton"></span></div>
    <div v-else-if="error" class="macro-error" role="alert"><span>{{ error }}</span><button type="button" @click="$emit('retry')">다시 불러오기</button></div>
    <div v-else-if="items.length" class="macro-grid">
      <article v-for="item in items" :key="item.id" class="macro-item"><div><small>{{ item.description }}</small><strong>{{ item.name }}</strong></div><b>{{ formatPrice(item) }}</b><em :class="{ negative: item.changePercent < 0 }">{{ formatPercent(item.changePercent) }}</em></article>
    </div>
  </section>
</template>

<style scoped>
.macro-strip { display: grid; gap: 14px; margin: 0 0 20px; padding: 16px 20px; border: 1px solid var(--line); border-radius: 16px; background: rgba(255,255,255,.72); }.macro-heading { display: flex; align-items: end; justify-content: space-between; gap: 16px; }.eyebrow { margin: 0 0 4px; color: var(--blue-500); font-size: .62rem; font-weight: 900; letter-spacing: .16em; }.macro-heading h2 { margin: 0; font-size: 1rem; letter-spacing: -.03em; }.macro-heading > span { color: var(--muted); font-size: .64rem; }.macro-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }.macro-item { display: grid; grid-template-columns: 1fr auto auto; align-items: center; gap: 12px; padding: 12px 14px; border: 1px solid #dce9ef; border-radius: 11px; background: #fbfdff; }.macro-item div { display: grid; gap: 3px; }.macro-item small { color: var(--muted); font-size: .61rem; }.macro-item strong { color: var(--ink); font-size: .78rem; }.macro-item > b { color: var(--ink); font-size: 1rem; }.macro-item em { color: #14734f; font-size: .72rem; font-style: normal; font-weight: 800; }.macro-item em.negative { color: #b44242; }.macro-error { display: flex; align-items: center; justify-content: space-between; gap: 12px; color: var(--muted); font-size: .72rem; }.macro-error button { padding: 7px 10px; border: 1px solid #aecbdb; border-radius: 7px; color: var(--blue-700); background: #fff; font: inherit; font-weight: 800; cursor: pointer; }.macro-skeleton { min-height: 54px; border-radius: 11px; background: linear-gradient(90deg, #eef3f6 25%, #f8fafb 50%, #eef3f6 75%); background-size: 200% 100%; animation: shimmer 1.2s infinite; }@keyframes shimmer { to { background-position: -200% 0; } }
@media (max-width: 600px) { .macro-heading { align-items: flex-start; flex-direction: column; gap: 3px; }.macro-grid { grid-template-columns: 1fr; }.macro-item { grid-template-columns: 1fr auto; }.macro-item em { grid-column: 2; grid-row: 1; }.macro-heading > span { text-align: left; } }
@media (prefers-reduced-motion: reduce) { .macro-skeleton { animation: none; } }
</style>
