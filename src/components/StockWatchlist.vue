<script setup>
defineProps({
  items: {
    type: Array,
    default: () => [],
  },
  selectedSymbol: {
    type: String,
    default: '',
  },
})

defineEmits(['select-market', 'remove-favorite'])

const priceFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
})

const formatPrice = (value) => Number.isFinite(value) ? priceFormatter.format(value) : '조회 전'
</script>

<template>
  <section class="watchlist" aria-labelledby="watchlist-title">
    <header>
      <div>
        <p>WATCHLIST</p>
        <h2 id="watchlist-title">즐겨찾기</h2>
      </div>
      <span>{{ items.length }} / 6</span>
    </header>

    <p v-if="!items.length" class="empty-state">
      종목 상세에서 별표를 눌러 관심 기업을 추가해 보세요.
    </p>
    <div v-else class="favorite-list">
      <article v-for="item in items" :key="item.symbol" class="favorite-item">
        <button
          type="button"
          class="favorite-main"
          :class="{ selected: selectedSymbol === item.symbol }"
          :aria-label="`${item.name} ${item.symbol}, ${formatPrice(item.currentPrice)} 상세 보기`"
          @click="$emit('select-market', item)"
        >
          <span class="favorite-logo">
            <span aria-hidden="true">{{ item.symbol.slice(0, 1) }}</span>
            <img v-if="item.logo" :src="item.logo" alt="" @error="$event.currentTarget.remove()">
          </span>
          <span class="favorite-company">
            <strong>{{ item.name }}</strong>
            <small>{{ item.symbol }}</small>
          </span>
          <strong class="favorite-price">{{ formatPrice(item.currentPrice) }}</strong>
        </button>
        <button
          type="button"
          class="remove-favorite"
          :aria-label="`${item.name} 즐겨찾기에서 삭제`"
          @click="$emit('remove-favorite', item.symbol)"
        >×</button>
      </article>
    </div>
  </section>
</template>

<style scoped>
.watchlist { margin-bottom: 20px; padding: 20px 22px; border: 1px solid var(--line); border-radius: 18px; background: var(--surface); box-shadow: var(--shadow); }
.watchlist header { display: flex; align-items: end; justify-content: space-between; gap: 20px; margin-bottom: 14px; }
.watchlist header p { margin: 0 0 5px; color: var(--blue-500); font-size: .66rem; font-weight: 800; letter-spacing: .16em; }
.watchlist h2 { margin: 0; font-size: 1.2rem; letter-spacing: -.03em; }
.watchlist header > span { color: var(--muted); font-size: .7rem; }
.favorite-list { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
.favorite-item { position: relative; min-width: 0; }
.favorite-main { display: grid; grid-template-columns: 38px minmax(0, 1fr) auto; align-items: center; width: 100%; min-height: 64px; gap: 10px; padding: 10px 36px 10px 10px; border: 1px solid var(--line); border-radius: 12px; color: var(--ink); background: #fbfdff; text-align: left; cursor: pointer; }
.favorite-main:hover { border-color: #a9cfe5; background: #f3f9fd; }
.favorite-main.selected { border-color: var(--blue-500); background: var(--blue-100); box-shadow: inset 3px 0 var(--blue-500); }
.favorite-logo { position: relative; display: grid; width: 38px; height: 38px; overflow: hidden; border: 1px solid var(--line); border-radius: 10px; place-items: center; color: var(--blue-700); background: #e8f4fb; font-size: .8rem; font-weight: 900; }
.favorite-logo img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; background: #fff; }
.favorite-company { display: grid; min-width: 0; gap: 3px; }
.favorite-company strong { overflow: hidden; font-size: .78rem; text-overflow: ellipsis; white-space: nowrap; }
.favorite-company small { color: var(--muted); font-size: .65rem; font-weight: 700; }
.favorite-price { font-size: .78rem; white-space: nowrap; }
.remove-favorite { position: absolute; top: 7px; right: 7px; display: grid; width: 24px; height: 24px; padding: 0; border: 0; border-radius: 7px; place-items: center; color: #78909f; background: transparent; font-size: 1rem; cursor: pointer; }
.remove-favorite:hover { color: #9d4141; background: #fbeeee; }
.favorite-main:focus-visible, .remove-favorite:focus-visible { outline: 3px solid #84c9f3; outline-offset: 2px; }
.empty-state { margin: 0; padding: 20px; border: 1px dashed #bfd5e2; border-radius: 12px; color: var(--muted); background: #fbfdff; font-size: .76rem; text-align: center; }
@media (max-width: 900px) { .favorite-list { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 650px) { .watchlist { padding: 18px 14px; }.favorite-list { grid-template-columns: 1fr; }.favorite-main { min-height: 60px; } }
@media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
</style>
