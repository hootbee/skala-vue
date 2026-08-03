<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import BaseDashboardCard from '../components/exercise/BaseDashboardCard.vue'
import SearchBar from '../components/exercise/SearchBar.vue'
import WeatherCard from '../components/exercise/WeatherCard.vue'
import KoreaWeatherMap from '../components/KoreaWeatherMap.vue'
import { fetchCurrentWeather, getWeatherErrorMessage, WEATHER_CITIES } from '../services/weatherApi'

const router = useRouter()

const weatherList = ref([])
const isLoading = ref(true)
const loadError = ref('')

const searchQuery = ref('')
const selectedCityInfo = ref(null)
document.title = '지역별 날씨 현황 | SKALA Weather'

const filteredWeatherList = computed(() => {
  const query = searchQuery.value.trim()

  if (!query) {
    return weatherList.value
  }

  return weatherList.value.filter((weather) => weather.name.includes(query))
})

const selectedMessage = computed(() =>
  selectedCityInfo.value
    ? `${selectedCityInfo.value.name}이 선택되었습니다.`
    : '지역을 선택하면 여기에 표시됩니다.',
)

watch(selectedCityInfo, (cityInfo) => {
  if (cityInfo) {
    console.log('상태바 문구가 변경되었습니다:', selectedMessage.value)
  }
})

const updateSearchQuery = (query) => {
  searchQuery.value = query
}

const selectCity = (city) => {
  selectedCityInfo.value = city
}

const showDetail = (city) => {
  router.push(`/weather/${city.id}`)
}

const loadWeather = async () => {
  isLoading.value = true
  loadError.value = ''
  const results = await Promise.allSettled(WEATHER_CITIES.map(fetchCurrentWeather))
  weatherList.value = results.filter(({ status }) => status === 'fulfilled').map(({ value }) => value)
  const failed = results.find(({ status }) => status === 'rejected')
  if (failed) loadError.value = getWeatherErrorMessage(failed.reason)
  isLoading.value = false
}

onMounted(loadWeather)
</script>

<template>
  <main class="weather-page">
    <header class="hero">
      <div>
        <p class="eyebrow">TODAY'S WEATHER</p>
        <h1>지역별 날씨 현황</h1>
        <p class="hero-description">오늘 우리 도시의 날씨를 한눈에 확인해 보세요.</p>
      </div>
      <div class="hero-symbol" aria-hidden="true">🌤️</div>
    </header>

    <BaseDashboardCard>
      <section class="weather-section" aria-labelledby="weather-title">
        <div class="section-heading">
          <div>
            <p class="eyebrow">CITY FORECAST</p>
            <h2 id="weather-title">오늘의 날씨</h2>
          </div>
          <span class="city-count">총 {{ filteredWeatherList.length }}개 도시</span>
        </div>

        <div class="weather-search">
          <SearchBar :search-query="searchQuery" @update-query="updateSearchQuery" />
        </div>

        <p v-if="isLoading" class="state-message" role="status">실시간 날씨를 불러오는 중입니다…</p>
        <div v-else-if="filteredWeatherList.length" class="weather-grid">
          <WeatherCard
            v-for="weather in filteredWeatherList"
            :key="weather.id"
            :weather="weather"
            :selected="selectedCityInfo?.id === weather.id"
            @select-card="selectCity"
            @click-detail="showDetail"
          />
        </div>
        <div v-else-if="loadError" class="error-result" role="alert">
          <p>{{ loadError }}</p>
          <button type="button" @click="loadWeather">다시 시도</button>
        </div>
        <p v-else class="empty-result" role="status">
          검색 결과와 일치하는 도시가 없습니다.
        </p>
        <p v-if="loadError && weatherList.length" class="partial-error" role="status">일부 도시 정보를 불러오지 못했습니다.</p>
      </section>
    </BaseDashboardCard>

    <KoreaWeatherMap />

    <aside class="status-bar" aria-live="polite">
      <span class="status-dot" aria-hidden="true"></span>
      {{ selectedMessage }}
    </aside>
  </main>
</template>

<style scoped>
.weather-page {
  width: min(1120px, calc(100% - 40px));
  margin: 0 auto;
  padding: 40px 0 56px;
}

.hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 190px;
  padding: 34px 38px;
  border: 1px solid #c8e0ef;
  border-radius: 18px;
  color: #fff;
  background: #17649a;
  box-shadow: 0 14px 30px rgba(34, 105, 161, 0.14);
}

.eyebrow {
  margin: 0 0 9px;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.18em;
  opacity: 0.74;
}

h1,
h2,
p {
  margin-top: 0;
}

h1 {
  margin-bottom: 12px;
  font-size: clamp(2rem, 5vw, 3.25rem);
  line-height: 1.12;
  letter-spacing: -0.055em;
}

.hero-description {
  margin-bottom: 0;
  font-size: 1.02rem;
  color: rgba(255, 255, 255, 0.78);
}

.hero-symbol {
  display: grid;
  width: 108px;
  height: 108px;
  flex: 0 0 auto;
  border: 1px solid rgba(255, 255, 255, 0.24);
  border-radius: 18px;
  place-items: center;
  font-size: 3.8rem;
  background: rgba(255, 255, 255, 0.12);
  box-shadow: inset 0 0 30px rgba(255, 255, 255, 0.12);
}

.weather-section {
  width: 100%;
}

.weather-search {
  margin-bottom: 22px;
  padding-bottom: 18px;
  border-bottom: 1px solid #e4edf2;
}

.section-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  margin-bottom: 20px;
}

.section-heading h2 {
  margin-bottom: 0;
  font-size: 1.8rem;
  letter-spacing: -0.04em;
}

.city-count {
  padding: 7px 12px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 700;
  color: #327cae;
  background: #dcefff;
}

.weather-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.empty-result {
  margin: 0;
  padding: 42px 24px;
  border: 1px dashed #b6d4e8;
  border-radius: 20px;
  text-align: center;
  color: #66859b;
  background: rgba(255, 255, 255, 0.62);
}

.state-message,
.error-result {
  margin: 0;
  padding: 42px 24px;
  border: 1px dashed #b6d4e8;
  border-radius: 20px;
  text-align: center;
  color: #66859b;
  background: rgba(255, 255, 255, 0.62);
}

.error-result { border-color: #e5bebe; color: #9f4747; background: #fff8f8; }
.error-result p { margin-bottom: 14px; }
.error-result button { padding: 9px 14px; border: 0; border-radius: 9px; color: #fff; background: var(--blue-700); }
.partial-error { margin: 14px 0 0; color: #9f5a47; font-size: .8rem; }

.status-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 22px;
  padding: 15px 18px;
  border: 1px solid rgba(190, 216, 234, 0.75);
  border-radius: 14px;
  font-size: 0.9rem;
  color: #527086;
  background: rgba(255, 255, 255, 0.68);
}

.status-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #37b77b;
  box-shadow: 0 0 0 5px rgba(55, 183, 123, 0.13);
}

@media (max-width: 820px) {
  .weather-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .hero-symbol {
    width: 112px;
    height: 112px;
    font-size: 3.8rem;
  }
}

@media (max-width: 560px) {
  .weather-page {
    width: min(100% - 24px, 1120px);
    padding-top: 24px;
  }

  .hero {
    min-height: 0;
    padding: 28px 22px;
    border-radius: 16px;
  }

  .hero-symbol {
    display: none;
  }

  .hero-description {
    font-size: 0.9rem;
  }

  .weather-grid { grid-template-columns: 1fr; }
  .section-heading { align-items: flex-start; flex-direction: column; gap: 12px; }
}
</style>
