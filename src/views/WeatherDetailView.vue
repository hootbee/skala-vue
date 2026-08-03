<script setup>
import { computed, onMounted, ref } from 'vue'
import { useConfigStore } from '../stores/configStore'
import { useRoute } from 'vue-router'
import { fetchCurrentWeather, getAirQualityLevel, getUvLevel, getWeatherErrorMessage, KOREA_WEATHER_REGIONS, WEATHER_CITIES } from '../services/weatherApi'

const route = useRoute()
const configStore = useConfigStore()
const cityDefinition = computed(() => [...WEATHER_CITIES, ...KOREA_WEATHER_REGIONS].find((item) => item.id === route.params.cityId))
const city = ref(null)
const isLoading = ref(true)
const loadError = ref('')
document.title = '날씨 상세 | SKALA Weather'

const formatTime = (timestamp) => timestamp
  ? new Intl.DateTimeFormat('ko-KR', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Seoul' }).format(new Date(timestamp * 1000))
  : '—'

const weatherTips = computed(() => {
  if (!city.value) return []
  const tips = []
  if (city.value.precipitation > 0) tips.push('비가 내리고 있어요. 외출할 때 우산을 챙기세요.')
  else tips.push('현재 관측된 강수는 없어요. 가벼운 외출에 좋습니다.')
  if (city.value.uvIndex >= 6) tips.push('자외선이 높아요. 선크림과 모자를 준비하세요.')
  if (city.value.airQualityIndex >= 4) tips.push('공기질이 좋지 않아요. 장시간 야외 활동을 줄이세요.')
  if (city.value.windSpeed >= 8) tips.push('바람이 강합니다. 간판이나 낙하물에 주의하세요.')
  return tips
})

const loadWeather = async () => {
  if (!cityDefinition.value) {
    isLoading.value = false
    return
  }
  isLoading.value = true
  loadError.value = ''
  try { city.value = await fetchCurrentWeather(cityDefinition.value) }
  catch (error) { loadError.value = getWeatherErrorMessage(error) }
  finally { isLoading.value = false }
}

onMounted(loadWeather)
</script>

<template>
  <main class="detail-view" aria-labelledby="detail-title">
    <template v-if="isLoading"><h1 id="detail-title">날씨를 불러오는 중입니다.</h1><p role="status">잠시만 기다려 주세요.</p></template>
    <template v-else-if="loadError"><h1 id="detail-title">날씨 정보를 불러오지 못했습니다.</h1><p class="error-message" role="alert">{{ loadError }}</p><button class="retry-button" type="button" @click="loadWeather">다시 시도</button></template>
    <template v-else-if="city">
      <p class="eyebrow">CITY DETAIL</p>
      <div class="title-row">
        <h1 id="detail-title">{{ city.name }} 날씨 상세</h1>
        <time :datetime="new Date(city.updatedAt * 1000).toISOString()">{{ formatTime(city.updatedAt) }} 업데이트</time>
      </div>

      <div class="detail-card">
        <div class="current-summary">
          <span class="detail-icon" aria-hidden="true">{{ city.status === '맑음' ? '☀️' : city.status === '비' ? '🌧️' : city.status === '눈' ? '🌨️' : '☁️' }}</span>
          <div>
            <p class="temperature">{{ configStore.formatTemperature(city.temp) }}</p>
            <p class="status"><strong>{{ city.description }}</strong> · 체감 {{ configStore.formatTemperature(city.feelsLike) }}</p>
          </div>
        </div>

        <dl class="detail-metrics">
          <div><dt>습도</dt><dd>{{ city.humidity }}%</dd><small>현재 상대습도</small></div>
          <div><dt>최근 1시간 강수</dt><dd>{{ city.precipitation.toFixed(1) }} mm</dd><small>{{ city.precipitation > 0 ? '우산을 챙기세요' : '관측된 강수 없음' }}</small></div>
          <div><dt>자외선 지수</dt><dd>{{ city.uvIndex ?? '—' }}</dd><small>{{ getUvLevel(city.uvIndex) }}</small></div>
          <div><dt>바람</dt><dd>{{ city.windSpeed?.toFixed(1) ?? '—' }} m/s</dd><small>{{ city.windDirection }}풍<span v-if="city.windGust"> · 순간 {{ city.windGust.toFixed(1) }}</span></small></div>
          <div><dt>공기질</dt><dd>{{ getAirQualityLevel(city.airQualityIndex) }}</dd><small>PM2.5 {{ city.pm25?.toFixed(1) ?? '—' }} ㎍/㎥</small></div>
          <div><dt>가시거리</dt><dd>{{ city.visibility ? (city.visibility / 1000).toFixed(1) : '—' }} km</dd><small>수평 가시거리</small></div>
        </dl>

        <section class="environment-section" aria-labelledby="environment-title">
          <h2 id="environment-title">대기와 하늘</h2>
          <div class="environment-grid">
            <div><span>기압</span><strong>{{ city.pressure }} hPa</strong></div>
            <div><span>구름량</span><strong>{{ city.clouds ?? '—' }}%</strong></div>
            <div><span>미세먼지 PM10</span><strong>{{ city.pm10?.toFixed(1) ?? '—' }} ㎍/㎥</strong></div>
          </div>
        </section>

        <section class="sun-section" aria-label="일출과 일몰">
          <div><span aria-hidden="true">↗</span><p>일출<strong>{{ formatTime(city.sunrise) }}</strong></p></div>
          <div class="daylight-line" aria-hidden="true"><span></span></div>
          <div><span aria-hidden="true">↘</span><p>일몰<strong>{{ formatTime(city.sunset) }}</strong></p></div>
        </section>
      </div>

      <aside class="weather-guide" aria-labelledby="guide-title">
        <div><span aria-hidden="true">i</span><h2 id="guide-title">오늘의 생활 가이드</h2></div>
        <ul><li v-for="tip in weatherTips" :key="tip">{{ tip }}</li></ul>
      </aside>
    </template>
    <template v-else><h1 id="detail-title">도시 정보를 찾을 수 없습니다.</h1><p>요청한 도시 코드가 지원 목록에 없습니다.</p></template>
    <RouterLink class="back-link" to="/weather">날씨 홈으로 돌아가기</RouterLink>
  </main>
</template>

<style scoped>
.detail-view { width: min(920px, calc(100% - 40px)); margin: 0 auto; padding: 58px 0 72px; color: var(--ink); }
.eyebrow { color: var(--blue-500); font-size: .75rem; font-weight: 800; letter-spacing: .16em; }
h1 { margin: 0; font-size: clamp(2rem, 5vw, 3.5rem); letter-spacing: -.05em; }
.title-row { display: flex; align-items: end; justify-content: space-between; gap: 20px; }
.title-row time { padding-bottom: 7px; color: #8196a5; font-size: .75rem; }
.detail-card { margin: 30px 0 24px; padding: 32px; border: 1px solid var(--line); border-radius: 16px; background: var(--surface); box-shadow: var(--shadow); }
.current-summary { display: flex; align-items: center; gap: 22px; padding-bottom: 28px; border-bottom: 1px solid #e2ebf0; }
.detail-icon { display: grid; width: 86px; height: 86px; flex: 0 0 auto; border-radius: 22px; place-items: center; background: #eef8ff; font-size: 3.5rem; }
.temperature { margin: 0 0 8px; font-size: 4rem; font-weight: 800; line-height: 1; color: #153e5f; }
.temperature small { margin-left: 4px; font-size: 1.2rem; color: #83a0b5; }
.status { margin: 0; color: #668095; }
.back-link { display: inline-block; padding: 12px 16px; border-radius: 9px; color: #fff; background: var(--blue-700); text-decoration: none; }
.back-link:hover { background: #12527e; }
.error-message { color: #a44b4b; }
.retry-button { margin: 10px 10px 24px 0; padding: 11px 15px; border: 0; border-radius: 9px; color: #fff; background: var(--blue-700); }
.detail-metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 24px 0 28px; }
.detail-metrics div { padding: 16px; border-radius: 12px; background: #f0f7fb; }
.detail-metrics dt { margin-bottom: 6px; color: #7890a1; font-size: .72rem; }
.detail-metrics dd { margin: 0; color: #294c65; font-size: 1.05rem; font-weight: 800; }
.detail-metrics small { display: block; margin-top: 4px; color: #7890a1; font-size: .66rem; }
.environment-section { padding-top: 26px; border-top: 1px solid #e2ebf0; }
.environment-section h2 { margin: 0 0 14px; color: #29485e; font-size: 1rem; }
.environment-grid { display: grid; grid-template-columns: repeat(3, 1fr); border: 1px solid #e0eaf0; border-radius: 12px; }
.environment-grid div { display: grid; gap: 5px; padding: 15px 18px; border-right: 1px solid #e0eaf0; }
.environment-grid div:last-child { border-right: 0; }
.environment-grid span { color: #8195a3; font-size: .7rem; }
.environment-grid strong { color: #3c596d; font-size: .86rem; }
.sun-section { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 18px; margin-top: 20px; padding: 16px 18px; border-radius: 12px; background: linear-gradient(90deg, #fff8dc, #edf7ff 55%, #eaeefe); }
.sun-section > div:not(.daylight-line) { display: flex; align-items: center; gap: 9px; }
.sun-section > div > span { color: #e39145; font-size: 1.3rem; font-weight: 900; }
.sun-section > div:last-child > span { color: #657ac1; }
.sun-section p { display: grid; gap: 2px; margin: 0; color: #7c8d99; font-size: .65rem; }
.sun-section strong { color: #3c5669; font-size: .86rem; }
.daylight-line { position: relative; height: 1px; background: #bfcfda; }
.daylight-line span { position: absolute; top: -4px; left: 54%; width: 9px; height: 9px; border-radius: 50%; background: #f6b74f; }
.weather-guide { margin-bottom: 22px; padding: 22px 24px; border: 1px solid #cbe1ed; border-radius: 14px; background: #f5fbff; }
.weather-guide > div { display: flex; align-items: center; gap: 9px; }
.weather-guide > div span { display: grid; width: 23px; height: 23px; border-radius: 50%; place-items: center; color: #fff; background: var(--blue-700); font-size: .72rem; font-weight: 900; }
.weather-guide h2 { margin: 0; color: #294b62; font-size: .95rem; }
.weather-guide ul { display: grid; gap: 7px; margin: 14px 0 0; padding-left: 22px; color: #607b8e; font-size: .82rem; line-height: 1.6; }
@media (max-width: 620px) {
  .detail-view { width: min(100% - 24px, 920px); padding-top: 38px; }
  .title-row { align-items: flex-start; flex-direction: column; gap: 7px; }
  .detail-card { padding: 20px; }
  .current-summary { align-items: flex-start; }
  .detail-icon { width: 64px; height: 64px; border-radius: 16px; font-size: 2.5rem; }
  .temperature { font-size: 3.2rem; }
  .detail-metrics { grid-template-columns: repeat(2, 1fr); }
  .environment-grid { grid-template-columns: 1fr; }
  .environment-grid div { border-right: 0; border-bottom: 1px solid #e0eaf0; }
  .environment-grid div:last-child { border-bottom: 0; }
  .sun-section { grid-template-columns: 1fr 1fr; }
  .daylight-line { display: none; }
  .sun-section > div:last-child { justify-self: end; }
}
</style>
