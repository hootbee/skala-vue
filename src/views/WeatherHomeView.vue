<script setup>
import { computed, ref, watch, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import BaseDashboardCard from '../components/exercise/BaseDashboardCard.vue'
import SearchBar from '../components/exercise/SearchBar.vue'
import WeatherCard from '../components/exercise/WeatherCard.vue'

const router = useRouter()

const weatherList = ref([
  { id: 'city_01', name: '서울', temp: 28, status: '맑음' },
  { id: 'city_02', name: '판교', temp: 24, status: '비' },
  { id: 'city_03', name: '전주', temp: 26, status: '구름' },
])

const searchQuery = ref('')
const selectedCityInfo = ref(null)

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

watchEffect(() => {
  console.log('도시 검색어:', searchQuery.value)
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
      <SearchBar :search-query="searchQuery" @update-query="updateSearchQuery" />
    </BaseDashboardCard>

    <BaseDashboardCard>
      <section class="weather-section" aria-labelledby="weather-title">
        <div class="section-heading">
          <div>
            <p class="eyebrow">CITY FORECAST</p>
            <h2 id="weather-title">오늘의 날씨</h2>
          </div>
          <span class="city-count">총 {{ filteredWeatherList.length }}개 도시</span>
        </div>

        <div v-if="filteredWeatherList.length" class="weather-grid">
          <WeatherCard
            v-for="weather in filteredWeatherList"
            :key="weather.id"
            :weather="weather"
            @select-card="selectCity"
            @click-detail="showDetail"
          />
        </div>
        <p v-else class="empty-result" role="status">
          검색 결과와 일치하는 도시가 없습니다.
        </p>
      </section>
    </BaseDashboardCard>

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
  padding: 56px 0 48px;
}

.hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 220px;
  padding: 38px 46px;
  overflow: hidden;
  border-radius: 32px;
  color: #fff;
  background: linear-gradient(112deg, rgba(14, 99, 190, 0.96), rgba(63, 164, 230, 0.82)), #1676c7;
  box-shadow: 0 24px 50px rgba(34, 105, 161, 0.2);
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
  font-size: clamp(2.1rem, 6vw, 3.7rem);
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
  width: 150px;
  height: 150px;
  flex: 0 0 auto;
  border: 1px solid rgba(255, 255, 255, 0.24);
  border-radius: 50%;
  place-items: center;
  font-size: 5rem;
  background: rgba(255, 255, 255, 0.12);
  box-shadow: inset 0 0 30px rgba(255, 255, 255, 0.12);
}

.weather-section {
  width: 100%;
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
  grid-template-columns: repeat(3, 1fr);
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
    grid-template-columns: 1fr;
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
    padding-top: 18px;
  }

  .hero {
    min-height: 0;
    padding: 30px 24px;
    border-radius: 24px;
  }

  .hero-symbol {
    display: none;
  }

  .hero-description {
    font-size: 0.9rem;
  }
}
</style>
