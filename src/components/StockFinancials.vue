<script setup>
import { computed, ref } from 'vue'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import SelectButton from 'primevue/selectbutton'
import Skeleton from 'primevue/skeleton'

const props = defineProps({
  data: { type: Object, default: null },
  companyName: { type: String, required: true },
  isLoading: { type: Boolean, default: false },
  error: { type: String, default: '' },
})
const emit = defineEmits(['retry'])
const periodMode = ref('quarterly')
const periodOptions = [
  { label: '분기', value: 'quarterly' },
  { label: '연간', value: 'annual' },
]
const rows = computed(() => props.data?.[periodMode.value] ?? [])
const tableRows = computed(() => [...rows.value].reverse())
const latest = computed(() => rows.value.at(-1) ?? null)
const maxRevenue = computed(() => Math.max(...rows.value.map(({ revenue }) => Math.abs(revenue || 0)), 1))

const compactCurrency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
})

const formatMoney = (value) => Number.isFinite(value) ? compactCurrency.format(value) : '—'
const formatEps = (value) => Number.isFinite(value) ? `$${value.toFixed(2)}` : '—'
const formatPeriod = (row) => periodMode.value === 'quarterly' ? `${row.year} Q${row.quarter}` : `${row.year}`
const formatGrowth = (value) => Number.isFinite(value) ? `${value >= 0 ? '+' : ''}${value.toFixed(1)}%` : '—'
const growthClass = (value) => ({ positive: value > 0, negative: value < 0 })
const barHeight = (value) => `${Math.max(5, (Math.abs(value || 0) / maxRevenue.value) * 100)}%`
</script>

<template>
  <section class="financials-panel" aria-labelledby="financials-title">
    <div class="financials-heading">
      <div><p class="eyebrow">FINANCIAL HISTORY</p><h3 id="financials-title">재무 추이</h3><p>공시 원문을 실제 분기값으로 환산해 비교합니다.</p></div>
      <SelectButton
        v-model="periodMode"
        class="period-switch"
        :options="periodOptions"
        option-label="label"
        option-value="value"
        aria-label="재무제표 기간 선택"
        :allow-empty="false"
      />
    </div>

    <div v-if="isLoading" class="financial-skeleton" role="status" :aria-label="`${companyName} 재무제표를 불러오는 중입니다`">
      <div><Skeleton v-for="index in 4" :key="index" height="76px" border-radius="10px" /></div>
      <Skeleton width="100%" height="220px" border-radius="12px" />
      <Skeleton width="100%" height="240px" border-radius="12px" />
    </div>
    <div v-else-if="error" class="financial-state error" role="alert"><strong>재무제표를 불러오지 못했습니다.</strong><p>{{ error }}</p><button type="button" @click="emit('retry')">다시 시도</button></div>
    <p v-else-if="!rows.length" class="financial-state">표시할 재무 데이터가 없습니다.</p>

    <template v-else>
      <dl class="financial-kpis">
        <div><dt>최근 매출</dt><dd>{{ formatMoney(latest.revenue) }}</dd><span :class="growthClass(latest.revenueYoY)">전년 대비 {{ formatGrowth(latest.revenueYoY) }}</span></div>
        <div><dt>영업이익</dt><dd>{{ formatMoney(latest.operatingIncome) }}</dd><span>{{ formatPeriod(latest) }}</span></div>
        <div><dt>순이익</dt><dd>{{ formatMoney(latest.netIncome) }}</dd><span :class="growthClass(latest.netIncomeYoY)">전년 대비 {{ formatGrowth(latest.netIncomeYoY) }}</span></div>
        <div><dt>희석 EPS</dt><dd>{{ formatEps(latest.eps) }}</dd><span>{{ periodMode === 'quarterly' ? '분기 기준' : '연간 기준' }}</span></div>
      </dl>

      <figure class="revenue-chart">
        <figcaption><strong>매출 변화</strong><span>단위: USD · {{ data.source }}</span></figcaption>
        <div class="bars" role="img" :aria-label="`${companyName} ${periodMode === 'quarterly' ? '분기' : '연간'} 매출 변화 차트`">
          <div v-for="row in rows" :key="`${row.year}-${row.quarter}`" class="bar-column">
            <span class="bar-value">{{ formatMoney(row.revenue) }}</span>
            <div class="bar-track"><span :style="{ height: barHeight(row.revenue) }"></span></div>
            <strong>{{ formatPeriod(row) }}</strong>
          </div>
        </div>
      </figure>

      <div class="financial-table-frame">
        <p id="financial-table-hint" class="financial-table-hint"><span aria-hidden="true">↔</span> 표를 좌우로 밀어 전체 항목을 확인하세요.</p>
        <DataTable
          class="financial-table"
          :value="tableRows"
          scrollable
          striped-rows
          removable-sort
          size="small"
          aria-label="재무제표"
          aria-describedby="financial-table-hint"
        >
          <Column field="year" header="기간" frozen sortable>
            <template #body="{ data: row }"><strong>{{ formatPeriod(row) }}</strong></template>
          </Column>
          <Column field="revenue" header="매출" sortable>
            <template #body="{ data: row }">{{ formatMoney(row.revenue) }}</template>
          </Column>
          <Column field="revenueChange" :header="periodMode === 'quarterly' ? '전분기' : '전년 대비'" sortable>
            <template #body="{ data: row }"><span :class="growthClass(row.revenueChange)">{{ formatGrowth(row.revenueChange) }}</span></template>
          </Column>
          <Column v-if="periodMode === 'quarterly'" field="revenueYoY" header="전년 동기" sortable>
            <template #body="{ data: row }"><span :class="growthClass(row.revenueYoY)">{{ formatGrowth(row.revenueYoY) }}</span></template>
          </Column>
          <Column field="operatingIncome" header="영업이익" sortable>
            <template #body="{ data: row }">{{ formatMoney(row.operatingIncome) }}</template>
          </Column>
          <Column field="netIncome" header="순이익" sortable>
            <template #body="{ data: row }">{{ formatMoney(row.netIncome) }}</template>
          </Column>
          <Column field="netIncomeYoY" header="순이익 변화" sortable>
            <template #body="{ data: row }"><span :class="growthClass(row.netIncomeYoY)">{{ formatGrowth(row.netIncomeYoY) }}</span></template>
          </Column>
          <Column field="eps" header="EPS" sortable>
            <template #body="{ data: row }">{{ formatEps(row.eps) }}</template>
          </Column>
          <Column field="assets" header="총자산" sortable>
            <template #body="{ data: row }">{{ formatMoney(row.assets) }}</template>
          </Column>
          <template #empty>표시할 재무 데이터가 없습니다.</template>
        </DataTable>
      </div>
      <p v-if="periodMode === 'quarterly'" class="financial-note">2·3분기 손익은 누적 10-Q에서 이전 분기를 차감했고, 4분기는 연간 공시에서 3분기 누적값을 차감했습니다. 기업별 공시 방식에 따라 일부 항목은 제공되지 않을 수 있습니다.</p>
      <p v-else class="financial-note">연간 수치는 기업의 10-K 공시 원문을 기준으로 정리했습니다. 기업별 공시 방식에 따라 일부 항목은 제공되지 않을 수 있습니다.</p>
    </template>
  </section>
</template>

<style scoped>
.financials-panel { padding-top: 28px; }
.financials-heading { display: flex; align-items: end; justify-content: space-between; gap: 20px; margin-bottom: 18px; }
.eyebrow { margin: 0 0 7px; color: var(--blue-500); font-size: .68rem; font-weight: 800; letter-spacing: .16em; }
.financials-heading h3 { margin: 0; font-size: 1.2rem; letter-spacing: -.03em; }
.financials-heading div > p:last-child { margin: 5px 0 0; color: var(--muted); font-size: .7rem; }
.period-switch { display: inline-flex; padding: 4px; border-radius: 10px; background: #e8f0f5; }
.period-switch :deep(.p-togglebutton) { min-width: 58px; padding: 7px 11px; border: 0; border-radius: 7px; color: var(--muted); background: transparent; box-shadow: none; font-size: .72rem; font-weight: 800; }
.period-switch :deep(.p-togglebutton-checked) { color: var(--blue-700); background: #fff; box-shadow: 0 2px 7px rgba(35,81,112,.1); }
.financial-state { display: grid; min-height: 330px; place-items: center; align-content: center; gap: 10px; border: 1px solid var(--line); border-radius: 12px; color: var(--muted); background: #fbfdff; text-align: center; }
.financial-state p { margin: 0; }.financial-state.error strong { color: #8f4141; }.financial-state button { padding: 9px 13px; border: 0; border-radius: 8px; color: #fff; background: var(--blue-700); font-weight: 800; }
.financial-skeleton { display: grid; gap: 16px; }
.financial-skeleton > div { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; overflow: hidden; border-radius: 12px; }
.financial-kpis { display: grid; grid-template-columns: repeat(4, 1fr); margin: 0 0 16px; border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }
.financial-kpis div { display: grid; gap: 5px; padding: 15px; border-right: 1px solid var(--line); background: #fbfdff; }.financial-kpis div:last-child { border-right: 0; }
.financial-kpis dt { color: var(--muted); font-size: .67rem; }.financial-kpis dd { margin: 0; font-size: 1rem; font-weight: 850; }.financial-kpis span { color: var(--muted); font-size: .63rem; }
.positive { color: #16815d !important; }.negative { color: #c05757 !important; }
.revenue-chart { margin: 0 0 16px; padding: 18px 16px 13px; border: 1px solid var(--line); border-radius: 12px; background: #fbfdff; }
.revenue-chart figcaption { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 14px; }.revenue-chart figcaption strong { font-size: .82rem; }.revenue-chart figcaption span { color: var(--muted); font-size: .62rem; }
.bars { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(48px, 1fr); align-items: end; height: 200px; gap: 7px; overflow-x: auto; }
.bar-column { display: grid; grid-template-rows: 20px 1fr 22px; height: 100%; gap: 4px; min-width: 48px; text-align: center; }.bar-value { overflow: hidden; color: var(--muted); font-size: .57rem; text-overflow: ellipsis; white-space: nowrap; }
.bar-track { display: flex; align-items: end; justify-content: center; border-bottom: 1px solid #cedde6; background: repeating-linear-gradient(to top, transparent 0, transparent 32px, #e4edf2 33px); }.bar-track span { width: min(32px, 68%); min-height: 5px; border-radius: 5px 5px 0 0; background: linear-gradient(#4ba1d9, var(--blue-700)); }
.bar-column strong { color: #536f82; font-size: .6rem; white-space: nowrap; }
.financial-table-frame { position: relative; }
.financial-table-hint { display: none; align-items: center; gap: 6px; margin: 0 0 8px; color: #627e91; font-size: .66rem; font-weight: 700; }
.financial-table-hint span { color: var(--blue-700); font-size: .9rem; }
.financial-table { overflow: hidden; border: 1px solid var(--line); border-radius: 12px; font-size: .7rem; }
.financial-table :deep(.p-datatable-table) { min-width: 850px; }
.financial-table :deep(.p-datatable-thead > tr > th) { padding: 11px 12px; border-color: #e5edf2; color: #536f82; background: #f1f7fa; font-size: .63rem; text-align: right; white-space: nowrap; }
.financial-table :deep(.p-datatable-tbody > tr > td) { padding: 11px 12px; border-color: #e5edf2; color: var(--ink); text-align: right; white-space: nowrap; }
.financial-table :deep(.p-datatable-tbody > tr:nth-child(even)) { background: #f8fbfd; }
.financial-table :deep(.p-datatable-sort-icon) { width: 12px; color: #7d93a2; }
.financial-table :deep(.p-datatable-frozen-column) { text-align: left !important; background: #f8fbfd !important; }
.financial-note { margin: 10px 0 0; color: #738a99; font-size: .66rem; line-height: 1.65; }
@media (max-width: 700px) { .financials-heading { align-items: flex-start; flex-direction: column; }.financial-kpis { grid-template-columns: repeat(2, 1fr); }.financial-kpis div:nth-child(2) { border-right: 0; }.financial-kpis div:nth-child(n+3) { border-top: 1px solid var(--line); }.financial-skeleton > div { grid-template-columns: repeat(2, 1fr); }.revenue-chart { padding-inline: 10px; }.revenue-chart figcaption { align-items: flex-start; flex-direction: column; }.bars { grid-auto-columns: minmax(52px, 1fr); }.financial-table-hint { display: flex; }.financial-table-frame::after { position: absolute; right: 1px; bottom: 1px; width: 18px; height: calc(100% - 29px); border-radius: 0 11px 11px 0; background: linear-gradient(90deg, transparent, rgba(23,100,154,.1)); content: ''; pointer-events: none; } }
</style>
