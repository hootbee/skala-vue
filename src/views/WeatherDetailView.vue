<script setup>
import { computed } from 'vue'
import { useConfigStore } from '../stores/configStore'
import { useRoute } from 'vue-router'

const route = useRoute()
const configStore = useConfigStore()
const weatherList = [
  { id: 'city_01', name: '서울', temp: 28, status: '맑음', observation: '맑고 따뜻한 날씨입니다.' },
  { id: 'city_02', name: '판교', temp: 24, status: '비', observation: '우산을 준비해 주세요.' },
  { id: 'city_03', name: '전주', temp: 26, status: '구름', observation: '구름이 조금 있지만 활동하기 좋습니다.' },
]
const city = computed(() => weatherList.find((item) => item.id === route.params.cityId))
document.title = '날씨 상세 | SKALA Weather'
</script>

<template>
  <main class="detail-view" aria-labelledby="detail-title">
    <template v-if="city"><p class="eyebrow">CITY DETAIL</p><h1 id="detail-title">{{ city.name }} 날씨 상세</h1><div class="detail-card"><span class="detail-icon" aria-hidden="true">{{ city.status === '맑음' ? '☀️' : city.status === '비' ? '🌧️' : '☁️' }}</span><p class="temperature">{{ configStore.formatTemperature(city.temp) }}</p><p class="status">현재 상태: <strong>{{ city.status }}</strong></p><p>{{ city.observation }}</p></div></template>
    <template v-else><h1>도시 정보를 찾을 수 없습니다.</h1><p>요청한 도시 코드가 Mock 데이터에 없습니다.</p></template>
    <RouterLink class="back-link" to="/">날씨 홈으로 돌아가기</RouterLink>
  </main>
</template>

<style scoped>
.detail-view { width: min(820px, calc(100% - 40px)); margin: 0 auto; padding: 72px 0; color: var(--ink); }
.eyebrow { color: var(--blue-500); font-size: .75rem; font-weight: 800; letter-spacing: .16em; }
h1 { font-size: clamp(2rem, 5vw, 3.5rem); letter-spacing: -.05em; }
.detail-card { margin: 30px 0 24px; padding: 32px; border: 1px solid var(--line); border-radius: 16px; background: var(--surface); box-shadow: var(--shadow); }
.detail-icon { font-size: 3.5rem; }
.temperature { margin: 18px 0; font-size: 4rem; font-weight: 800; color: #153e5f; }
.temperature small { margin-left: 4px; font-size: 1.2rem; color: #83a0b5; }
.status { color: #668095; }
.back-link { display: inline-block; padding: 12px 16px; border-radius: 9px; color: #fff; background: var(--blue-700); text-decoration: none; }
.back-link:hover { background: #12527e; }
</style>
