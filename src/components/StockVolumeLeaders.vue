<script setup>
import FireCanvas from './FireCanvas.vue'

defineProps({
  items: { type: Array, default: () => [] },
  selectedSymbol: { type: String, default: '' },
  isLoading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  notice: { type: String, default: '' },
})

const emit = defineEmits(['select-market', 'retry'])
const crownLabels = ['금색', '은색', '동색']

const formatVolume = (value) => Number.isFinite(value)
  ? new Intl.NumberFormat('ko-KR', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
  : '—'
</script>

<template>
  <section class="volume-leaders" aria-labelledby="volume-leaders-title">
    <header class="volume-heading">
      <div><p>VOLUME TOP 5</p><h2 id="volume-leaders-title">거래량 상위 종목</h2></div>
      <span>시총 상위 30개 · 최근 3개월 일평균</span>
    </header>

    <div v-if="isLoading" class="leader-skeletons" role="status" aria-label="거래량 순위를 계산하는 중입니다">
      <span v-for="index in 5" :key="index"></span>
    </div>
    <div v-else-if="error" class="leader-state" role="alert">
      <p>{{ error }}</p><button type="button" @click="emit('retry')">다시 불러오기</button>
    </div>
    <ol v-else-if="items.length" class="leader-list">
      <li v-for="(item, index) in items" :key="item.symbol">
        <button type="button" class="leader-card" :class="[`rank-${index + 1}`, { selected: selectedSymbol === item.symbol }]" :aria-pressed="selectedSymbol === item.symbol" @click="emit('select-market', item)">
          <FireCanvas v-if="index < 3" class="card-fire-canvas" :intensity="1 - index * .25" />
          <span class="leader-rank">
            <span v-if="index < 3" class="leader-crown" aria-hidden="true">♛</span>
            <span v-if="index < 3" class="visually-hidden">{{ crownLabels[index] }} 왕관</span>
            {{ index + 1 }}
          </span>
          <span class="leader-name"><strong>{{ item.name }}</strong><small>{{ item.symbol }} · 시총 {{ item.rank }}위</small></span>
          <span class="leader-volume"><strong>{{ formatVolume(item.averageVolume) }}</strong><small>주/일</small></span>
        </button>
      </li>
    </ol>
    <p v-else class="leader-state">표시할 거래량 데이터가 없습니다.</p>
    <p v-if="notice" class="leader-notice" role="status">{{ notice }}</p>
  </section>
</template>

<style scoped>
.volume-leaders { margin-bottom: 20px; padding: 20px 22px; border: 1px solid var(--line); border-radius: 18px; background: var(--surface); box-shadow: var(--shadow); }
.volume-heading { display: flex; align-items: end; justify-content: space-between; gap: 20px; margin-bottom: 15px; }
.volume-heading p { margin: 0 0 5px; color: var(--blue-500); font-size: .66rem; font-weight: 800; letter-spacing: .15em; }
.volume-heading h2 { margin: 0; color: var(--ink); font-size: 1.12rem; letter-spacing: -.03em; }
.volume-heading > span { color: var(--muted); font-size: .68rem; text-align: right; }
.leader-list { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 8px; margin: 0; padding: 0; list-style: none; }
.leader-list li { min-width: 0; padding-top: 17px; }
.leader-list button { position: relative; isolation: isolate; display: grid; width: 100%; min-height: 104px; grid-template-columns: auto minmax(0, 1fr); align-content: space-between; gap: 9px; padding: 16px 13px 13px; overflow: hidden; border: 1px solid var(--line); border-radius: 12px; color: var(--ink); background: #fbfdff; text-align: left; cursor: pointer; }
.card-fire-canvas { position: absolute; inset: 18% 0 0; z-index: -1; width: 100%; height: 82%; pointer-events: none; opacity: .72; }
.leader-list button:hover { border-color: #9fc7dc; background: #f3f9fd; }
.leader-list button.selected { border-color: var(--blue-500); box-shadow: inset 0 0 0 1px var(--blue-500); background: var(--blue-100); }
.leader-list button.rank-1, .leader-list button.rank-2, .leader-list button.rank-3 { box-shadow: 0 5px 14px rgba(220, 76, 25, .12), inset 0 -18px 24px rgba(247, 89, 24, .06); animation: card-heat 1.8s ease-in-out infinite; }
.leader-list button.rank-1 { --heat-alpha: .3; border-color: #d6ae3d; background: linear-gradient(145deg, #fff9dc, #fff); }.leader-list button.rank-2 { --heat-alpha: .2; border-color: #aebbc4; background: linear-gradient(145deg, #f1f5f7, #fff); }.leader-list button.rank-3 { --heat-alpha: .13; border-color: #bd825d; background: linear-gradient(145deg, #fff0e6, #fff); }
.leader-list button.rank-1:hover { background: #fff6c9; }.leader-list button.rank-2:hover { background: #eaf0f3; }.leader-list button.rank-3:hover { background: #ffe9dc; }
.leader-list button:focus-visible { outline: 3px solid #84c9f3; outline-offset: 2px; }
.leader-rank { position: relative; z-index: 1; display: grid; width: 24px; height: 24px; place-items: center; border-radius: 7px; color: #fff; background: var(--blue-700); font-size: .7rem; font-weight: 900; }
.leader-crown { position: absolute; top: -17px; left: 50%; color: #d7a600; font-size: 1.05rem; line-height: 1; filter: drop-shadow(0 2px 2px rgba(92, 61, 0, .2)); transform: translateX(-50%); }
.rank-2 .leader-crown { color: #909ca4; }.rank-3 .leader-crown { color: #a9663f; }
.rank-1 .leader-rank { background: #b88900; }.rank-2 .leader-rank { background: #7d8c96; }.rank-3 .leader-rank { background: #9c603e; }
.leader-name { position: relative; z-index: 1; display: grid; min-width: 0; gap: 3px; }
.leader-name strong { overflow: hidden; font-size: .78rem; text-overflow: ellipsis; white-space: nowrap; }
.leader-name small, .leader-volume small { color: var(--muted); font-size: .6rem; }
.leader-volume { position: relative; z-index: 1; display: grid; grid-column: 1 / -1; grid-template-columns: auto 1fr; align-items: baseline; gap: 4px; }
.leader-volume strong { color: var(--blue-700); font-size: 1rem; }
.leader-skeletons { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; }
.leader-skeletons span { min-height: 104px; border-radius: 12px; background: linear-gradient(90deg, #eef3f6 25%, #f8fafb 50%, #eef3f6 75%); background-size: 200% 100%; animation: shimmer 1.2s infinite; }
.leader-state { display: grid; min-height: 104px; margin: 0; place-items: center; align-content: center; gap: 9px; color: var(--muted); font-size: .75rem; text-align: center; }
.leader-state button { padding: 8px 11px; border: 0; border-radius: 8px; color: #fff; background: var(--blue-700); font: inherit; font-weight: 800; }
.leader-notice { margin: 10px 0 0; color: #7a8f9d; font-size: .65rem; }
.visually-hidden { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
@keyframes shimmer { to { background-position: -200% 0; } }
@keyframes card-heat { 50% { filter: drop-shadow(0 5px 7px rgb(231 67 20 / var(--heat-alpha))); } }
@media (max-width: 900px) { .leader-list, .leader-skeletons { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 560px) { .volume-leaders { padding: 18px 14px; }.volume-heading { align-items: flex-start; flex-direction: column; gap: 6px; }.volume-heading > span { text-align: left; }.leader-list, .leader-skeletons { grid-template-columns: 1fr; }.leader-list button { min-height: 82px; }.leader-skeletons span { min-height: 82px; } }
@media (prefers-reduced-motion: reduce) { .leader-card, .leader-skeletons span { animation: none; } }
</style>
