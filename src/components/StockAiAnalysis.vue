<script setup>
defineProps({
  result: { type: Object, default: null },
  companyName: { type: String, required: true },
  isLoading: { type: Boolean, default: false },
  error: { type: String, default: '' },
})
const emit = defineEmits(['analyze'])

const formatDateTime = (value) => value
  ? new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
  : ''
</script>

<template>
  <section class="analysis-panel" aria-labelledby="ai-analysis-title">
    <header class="analysis-heading">
      <div><p class="eyebrow">GEMINI DATA ANALYSIS</p><h3 id="ai-analysis-title">AI 투자전략</h3><p>현재 시세와 가격 흐름, 공시 재무지표만 사용해 관찰 전략을 정리합니다.</p></div>
      <span class="ai-badge">Gemini 2.5 Flash</span>
    </header>

    <div v-if="isLoading" class="analysis-state" role="status" aria-live="polite">
      <span class="loader" aria-hidden="true"></span>
      <strong>{{ companyName }} 데이터를 분석하고 있습니다.</strong>
      <p>가격 흐름과 최근 분기·연간 재무 변화를 함께 비교합니다.</p>
    </div>

    <div v-else-if="error" class="analysis-state error" role="alert">
      <strong>AI 분석을 완료하지 못했습니다.</strong><p>{{ error }}</p>
      <button type="button" @click="emit('analyze')">다시 시도</button>
    </div>

    <div v-else-if="!result" class="analysis-empty">
      <div class="analysis-mark" aria-hidden="true">AI</div>
      <div><strong>요청할 때만 분석합니다.</strong><p>버튼을 누르면 {{ companyName }}의 시세·밸류에이션·6개월 가격 흐름·재무 추이를 Gemini에 전달합니다.</p></div>
      <button type="button" @click="emit('analyze')">AI 분석 보기</button>
      <small>분석 전에는 Gemini API를 호출하지 않습니다.</small>
    </div>

    <template v-else>
      <section class="analysis-summary" aria-label="AI 분석 요약">
        <div class="signal-block">
          <span class="signal" :class="`signal--${result.signal}`">{{ result.signal }}</span>
          <div><small>데이터 신뢰도</small><strong>{{ result.confidence }}%</strong></div>
        </div>
        <p>{{ result.summary }}</p>
        <div class="confidence-track" role="progressbar" :aria-valuenow="result.confidence" aria-valuemin="0" aria-valuemax="100" aria-label="분석 데이터 신뢰도"><span :style="{ width: `${result.confidence}%` }"></span></div>
      </section>

      <div class="strategy-list">
        <article v-for="strategy in result.strategies" :key="strategy.horizon" class="strategy-card">
          <header><div><span>{{ strategy.horizon }}</span><h4>{{ strategy.timeframe }}</h4></div><strong>{{ strategy.stance }}</strong></header>
          <p>{{ strategy.thesis }}</p>
          <dl><div><dt>접근 기준</dt><dd>{{ strategy.entryPlan }}</dd></div><div><dt>위험 관리</dt><dd>{{ strategy.riskManagement }}</dd></div></dl>
          <div class="checkpoints"><strong>확인할 지표</strong><ul><li v-for="item in strategy.checkpoints" :key="item">{{ item }}</li></ul></div>
        </article>
      </div>

      <section class="risk-box" aria-labelledby="risk-title"><h4 id="risk-title">핵심 위험요인</h4><ul><li v-for="risk in result.keyRisks" :key="risk">{{ risk }}</li></ul></section>
      <footer class="analysis-footer"><div><strong>{{ result.model }}</strong><time :datetime="result.analyzedAt">{{ formatDateTime(result.analyzedAt) }} 분석</time></div><button type="button" @click="emit('analyze')">다시 분석</button></footer>
      <p class="disclaimer">{{ result.disclaimer }} 투자 판단과 손실의 책임은 사용자에게 있으며, 중요한 결정 전 공식 공시와 전문가 의견을 함께 확인하세요.</p>
    </template>
  </section>
</template>

<style scoped>
.analysis-panel { padding-top: 28px; }
.analysis-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; margin-bottom: 18px; }
.eyebrow { margin: 0 0 7px; color: #6957b7; font-size: .68rem; font-weight: 800; letter-spacing: .16em; }
.analysis-heading h3 { margin: 0; font-size: 1.2rem; letter-spacing: -.03em; }.analysis-heading div > p:last-child { margin: 5px 0 0; color: var(--muted); font-size: .7rem; }
.ai-badge { flex: 0 0 auto; padding: 6px 10px; border: 1px solid #d6cff1; border-radius: 999px; color: #5f4daa; background: #f4f1ff; font-size: .65rem; font-weight: 800; }
.analysis-state, .analysis-empty { display: grid; min-height: 360px; place-items: center; align-content: center; gap: 12px; padding: 32px; border: 1px solid var(--line); border-radius: 14px; background: #fbfdff; text-align: center; }
.analysis-state p, .analysis-empty p { max-width: 520px; margin: 0; color: var(--muted); font-size: .75rem; line-height: 1.7; }.analysis-state.error strong { color: #934747; }
.analysis-state button, .analysis-empty button, .analysis-footer button { min-height: 40px; padding: 8px 14px; border: 0; border-radius: 8px; color: #fff; background: var(--blue-700); font: inherit; font-size: .76rem; font-weight: 800; }
.analysis-state button:hover, .analysis-empty button:hover, .analysis-footer button:hover { background: #12527e; }
.analysis-mark { display: grid; width: 54px; height: 54px; place-items: center; border: 1px solid #d8d0f3; border-radius: 15px; color: #604eac; background: linear-gradient(135deg, #f3f0ff, #e8f5fd); font-size: .9rem; font-weight: 900; }
.analysis-empty > div:nth-child(2) { display: grid; gap: 6px; }.analysis-empty small { color: #8193a0; font-size: .64rem; }
.loader { width: 30px; height: 30px; border: 3px solid #e0dcf5; border-top-color: #6957b7; border-radius: 50%; animation: spin .7s linear infinite; }
.analysis-summary { padding: 20px; border: 1px solid #d9d3ef; border-radius: 14px; background: linear-gradient(135deg, #faf9ff, #f2f9fd); }.analysis-summary > p { margin: 16px 0; color: #405c70; font-size: .82rem; line-height: 1.75; }
.signal-block { display: flex; align-items: center; justify-content: space-between; gap: 16px; }.signal { padding: 6px 12px; border-radius: 999px; color: #4e6270; background: #edf1f4; font-size: .74rem; font-weight: 850; }.signal--긍정 { color: #176d4d; background: #e1f5eb; }.signal--주의 { color: #9a4747; background: #fdecec; }
.signal-block div { display: flex; align-items: baseline; gap: 7px; }.signal-block small { color: var(--muted); font-size: .65rem; }.signal-block strong { font-size: 1.05rem; }
.confidence-track { height: 6px; overflow: hidden; border-radius: 99px; background: #dfe8ef; }.confidence-track span { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, #6957b7, var(--blue-500)); }
.strategy-list { display: grid; grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(4, auto); column-gap: 12px; margin-top: 16px; }.strategy-card { display: grid; grid-row: span 4; grid-template-rows: subgrid; min-width: 0; padding: 18px; border: 1px solid var(--line); border-radius: 13px; background: #fff; }.strategy-card header { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }.strategy-card header span { color: #6957b7; font-size: .66rem; font-weight: 850; }.strategy-card h4 { margin: 3px 0 0; font-size: .9rem; }.strategy-card header > strong { padding: 4px 7px; border-radius: 6px; color: var(--blue-700); background: var(--blue-100); font-size: .6rem; white-space: nowrap; }
.strategy-card > p { margin: 15px 0; color: #4e687a; font-size: .72rem; line-height: 1.65; overflow-wrap: break-word; word-break: keep-all; }.strategy-card dl { display: grid; align-content: start; gap: 10px; margin: 0; }.strategy-card dl div { display: grid; gap: 4px; }.strategy-card dt, .checkpoints > strong { color: var(--muted); font-size: .62rem; }.strategy-card dd { margin: 0; color: var(--ink); font-size: .69rem; line-height: 1.6; overflow-wrap: break-word; word-break: keep-all; }
.checkpoints { margin-top: 14px; padding-top: 12px; border-top: 1px solid #e6edf2; }.checkpoints ul, .risk-box ul { margin: 7px 0 0; padding-left: 16px; }.checkpoints li { margin-top: 5px; color: #577184; font-size: .65rem; line-height: 1.5; overflow-wrap: break-word; word-break: keep-all; }
.risk-box { margin-top: 16px; padding: 18px 20px; border: 1px solid #ecd4d4; border-radius: 12px; background: #fff8f8; }.risk-box h4 { margin: 0; color: #8d4747; font-size: .82rem; }.risk-box li { margin-top: 7px; color: #6f5555; font-size: .69rem; line-height: 1.55; }
.analysis-footer { display: flex; align-items: center; justify-content: space-between; gap: 18px; margin-top: 16px; }.analysis-footer div { display: grid; gap: 3px; }.analysis-footer strong { font-size: .72rem; }.analysis-footer time { color: var(--muted); font-size: .63rem; }
.disclaimer { margin: 14px 0 0; padding-top: 13px; border-top: 1px solid var(--line); color: #7c8e9a; font-size: .63rem; line-height: 1.6; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 900px) { .strategy-list { grid-template-columns: 1fr; grid-template-rows: none; gap: 12px; }.strategy-card { display: block; grid-row: auto; } }
@media (max-width: 560px) { .analysis-heading { align-items: flex-start; flex-direction: column; }.analysis-state, .analysis-empty { min-height: 330px; padding: 24px 18px; }.analysis-summary { padding: 17px; }.analysis-footer { align-items: flex-start; flex-direction: column; }.analysis-footer button { width: 100%; } }
@media (prefers-reduced-motion: reduce) { .loader { animation: none; } }
</style>
