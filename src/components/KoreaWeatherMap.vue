<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useConfigStore } from '../stores/configStore'
import {
  fetchCurrentWeather,
  getAirQualityLevel,
  getUvLevel,
  getWeatherErrorMessage,
  KOREA_WEATHER_REGIONS,
} from '../services/weatherApi'

const configStore = useConfigStore()
const mapElement = ref(null)
const selectedIds = ref([])
const loadingIds = ref([])
const weatherById = ref({})
const errorsById = ref({})
const statusMessage = ref('지도나 지역 버튼을 눌러 날씨를 비교해 보세요.')
const markerById = new Map()
let map

const selectedRegions = computed(() =>
  selectedIds.value.map((id) => KOREA_WEATHER_REGIONS.find((region) => region.id === id)).filter(Boolean),
)

const isSelected = (id) => selectedIds.value.includes(id)
const isLoading = (id) => loadingIds.value.includes(id)

const weatherIcon = {
  맑음: '☀️',
  비: '🌧️',
  구름: '☁️',
  눈: '🌨️',
  안개: '🌫️',
}

const updateMarker = (region) => {
  const marker = markerById.get(region.id)
  if (!marker) return
  const selected = isSelected(region.id)
  marker.setStyle({
    radius: selected ? 10 : 7,
    color: selected ? '#ffffff' : '#17649a',
    weight: selected ? 3 : 2,
    fillColor: selected ? '#e85e55' : '#318bd0',
    fillOpacity: 1,
  })
  marker.setTooltipContent(`${region.name}${selected ? ' · 선택됨' : ''}`)
}

const loadRegionWeather = async (region) => {
  loadingIds.value = [...loadingIds.value, region.id]
  const nextErrors = { ...errorsById.value }
  delete nextErrors[region.id]
  errorsById.value = nextErrors

  try {
    const weather = await fetchCurrentWeather(region)
    weatherById.value = { ...weatherById.value, [region.id]: weather }
    statusMessage.value = `${region.name} 날씨를 불러왔습니다. 현재 ${configStore.formatTemperature(weather.temp)}, ${weather.status}입니다.`
  } catch (error) {
    errorsById.value = { ...errorsById.value, [region.id]: getWeatherErrorMessage(error) }
    statusMessage.value = `${region.name} 날씨를 불러오지 못했습니다.`
  } finally {
    loadingIds.value = loadingIds.value.filter((id) => id !== region.id)
  }
}

const toggleRegion = async (region) => {
  if (isSelected(region.id)) {
    selectedIds.value = selectedIds.value.filter((id) => id !== region.id)
    statusMessage.value = `${region.name}을 비교 목록에서 제외했습니다.`
    await nextTick()
    updateMarker(region)
    return
  }

  selectedIds.value = [...selectedIds.value, region.id]
  statusMessage.value = `${region.name}을 비교 목록에 추가했습니다.`
  await nextTick()
  updateMarker(region)
  if (!weatherById.value[region.id] && !isLoading(region.id)) await loadRegionWeather(region)
}

const retryRegion = (region) => {
  if (!isLoading(region.id)) loadRegionWeather(region)
}

const clearSelection = async () => {
  const previousIds = [...selectedIds.value]
  selectedIds.value = []
  statusMessage.value = '선택한 지역을 모두 초기화했습니다.'
  await nextTick()
  previousIds.forEach((id) => {
    const region = KOREA_WEATHER_REGIONS.find((item) => item.id === id)
    if (region) updateMarker(region)
  })
}

const getNearestRegion = ({ lat, lng }) => KOREA_WEATHER_REGIONS.reduce((nearest, region) => {
  const latDistance = region.lat - lat
  const lonDistance = (region.lon - lng) * Math.cos((lat * Math.PI) / 180)
  const distance = latDistance ** 2 + lonDistance ** 2
  return !nearest || distance < nearest.distance ? { region, distance } : nearest
}, null).region

onMounted(() => {
  map = L.map(mapElement.value, {
    center: [36.2, 127.8],
    zoom: 7,
    minZoom: 6,
    maxZoom: 12,
    scrollWheelZoom: false,
  })

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map)

  KOREA_WEATHER_REGIONS.forEach((region) => {
    const marker = L.circleMarker([region.lat, region.lon], {
      radius: 7,
      color: '#17649a',
      weight: 2,
      fillColor: '#318bd0',
      fillOpacity: 1,
    }).addTo(map)
    marker.bindTooltip(region.name, { direction: 'top', offset: [0, -6] })
    marker.on('click', (event) => {
      if (event.originalEvent) L.DomEvent.stopPropagation(event.originalEvent)
      toggleRegion(region)
    })
    markerById.set(region.id, marker)
  })

  map.on('click', (event) => {
    const nearest = getNearestRegion(event.latlng)
    if (!isSelected(nearest.id)) toggleRegion(nearest)
    else statusMessage.value = `${nearest.name}은 이미 비교 목록에 있습니다.`
  })
})

onBeforeUnmount(() => {
  map?.remove()
  markerById.clear()
})
</script>

<template>
  <section class="map-section" aria-labelledby="korea-map-title">
    <div class="map-heading">
      <div>
        <p class="eyebrow">KOREA WEATHER MAP</p>
        <h2 id="korea-map-title">지도에서 지역 날씨 비교</h2>
        <p>지도 위 지역 지점이나 빈 곳을 누르면 가장 가까운 시·도의 날씨를 추가합니다.</p>
      </div>
      <div class="selection-count">
        <strong>{{ selectedIds.length }}</strong><span>개 지역 선택</span>
        <button v-if="selectedIds.length" type="button" @click="clearSelection">전체 해제</button>
      </div>
    </div>

    <div ref="mapElement" class="map-canvas" role="application" aria-label="대한민국 지역 날씨 선택 지도"></div>

    <div class="region-buttons" aria-label="지역 빠른 선택">
      <button
        v-for="region in KOREA_WEATHER_REGIONS"
        :key="region.id"
        type="button"
        :class="{ selected: isSelected(region.id) }"
        :aria-pressed="isSelected(region.id)"
        @click="toggleRegion(region)"
      >
        <span aria-hidden="true"></span>{{ region.name }}
      </button>
    </div>

    <p class="map-status" aria-live="polite">{{ statusMessage }}</p>

    <div v-if="selectedRegions.length" class="comparison-grid" aria-label="선택 지역 날씨 비교">
      <article v-for="region in selectedRegions" :key="region.id" class="comparison-card">
        <div class="comparison-heading">
          <div><span class="region-pin" aria-hidden="true"></span><h3>{{ region.name }}</h3></div>
          <button type="button" :aria-label="`${region.name} 비교에서 삭제`" @click="toggleRegion(region)">×</button>
        </div>

        <div v-if="isLoading(region.id)" class="card-state" role="status">날씨를 불러오는 중…</div>
        <div v-else-if="errorsById[region.id]" class="card-state error" role="alert">
          <p>{{ errorsById[region.id] }}</p>
          <button type="button" @click="retryRegion(region)">다시 시도</button>
        </div>
        <template v-else-if="weatherById[region.id]">
          <div class="current-weather">
            <span aria-hidden="true">{{ weatherIcon[weatherById[region.id].status] ?? '🌤️' }}</span>
            <div><strong>{{ configStore.formatTemperature(weatherById[region.id].temp) }}</strong><p>{{ weatherById[region.id].description }}</p></div>
          </div>
          <dl class="comparison-metrics">
            <div><dt>체감</dt><dd>{{ configStore.formatTemperature(weatherById[region.id].feelsLike) }}</dd></div>
            <div><dt>습도</dt><dd>{{ weatherById[region.id].humidity }}%</dd></div>
            <div><dt>강수</dt><dd>{{ weatherById[region.id].precipitation.toFixed(1) }} mm</dd></div>
            <div><dt>자외선</dt><dd>{{ getUvLevel(weatherById[region.id].uvIndex) }}</dd></div>
            <div><dt>공기질</dt><dd>{{ getAirQualityLevel(weatherById[region.id].airQualityIndex) }}</dd></div>
            <div><dt>바람</dt><dd>{{ weatherById[region.id].windSpeed?.toFixed(1) ?? '—' }} m/s</dd></div>
          </dl>
          <RouterLink class="detail-link" :to="`/weather/${region.id}`">상세 날씨 보기 →</RouterLink>
        </template>
      </article>
    </div>
    <div v-else class="empty-comparison">
      <span aria-hidden="true">⌖</span>
      <p>아직 선택한 지역이 없습니다.<br>여러 지역을 선택하면 한눈에 비교할 수 있어요.</p>
    </div>
  </section>
</template>

<style scoped>
.map-section { margin: 22px 0 28px; padding: 28px; border: 1px solid #cbdfea; border-radius: 20px; background: rgba(255,255,255,.9); box-shadow: var(--shadow); }
.map-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; margin-bottom: 20px; }
.eyebrow { margin: 0 0 7px; color: var(--blue-500); font-size: .68rem; font-weight: 800; letter-spacing: .17em; }
.map-heading h2 { margin: 0 0 7px; color: #1f4057; font-size: 1.55rem; letter-spacing: -.04em; }
.map-heading p:not(.eyebrow) { margin: 0; color: #728897; font-size: .8rem; }
.selection-count { display: grid; min-width: 105px; grid-template-columns: auto 1fr; align-items: baseline; gap: 4px; padding: 12px 14px; border-radius: 12px; color: #607c8f; background: #f0f7fb; }
.selection-count strong { color: var(--blue-700); font-size: 1.45rem; }
.selection-count span { font-size: .68rem; }
.selection-count button { grid-column: 1 / -1; padding: 4px; border: 0; color: #7a8f9d; background: transparent; font-size: .65rem; text-decoration: underline; }
.map-canvas { width: 100%; height: 440px; overflow: hidden; border: 1px solid #c7dce8; border-radius: 16px; background: #dfeef5; }
.map-canvas:focus-visible { outline: 3px solid rgba(49,139,208,.45); outline-offset: 3px; }
.map-canvas :deep(.leaflet-control-attribution) { font-size: 9px; }
.map-canvas :deep(.leaflet-tooltip) { border: 0; border-radius: 7px; color: #244b64; box-shadow: 0 4px 12px rgba(28,69,96,.16); font-family: 'Noto Sans KR', sans-serif; font-size: .68rem; font-weight: 800; }
.region-buttons { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 15px; }
.region-buttons button { display: inline-flex; align-items: center; min-height: 34px; gap: 6px; padding: 6px 10px; border: 1px solid #cfdee7; border-radius: 99px; color: #587487; background: #fff; font-size: .7rem; font-weight: 700; }
.region-buttons button:hover { border-color: #68a9d2; background: #f0f8fd; }
.region-buttons button.selected { border-color: #17649a; color: #17649a; background: #e8f4fc; }
.region-buttons button span { width: 6px; height: 6px; border-radius: 50%; background: #69a9d2; }
.region-buttons button.selected span { background: #e85e55; }
.map-status { min-height: 20px; margin: 11px 2px 0; color: #718898; font-size: .7rem; }
.comparison-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-top: 20px; }
.comparison-card { min-width: 0; padding: 18px; border: 1px solid #d4e3eb; border-radius: 14px; background: #fff; }
.comparison-heading { display: flex; align-items: center; justify-content: space-between; }
.comparison-heading > div { display: flex; align-items: center; gap: 7px; }
.region-pin { width: 8px; height: 8px; border-radius: 50%; background: #e85e55; box-shadow: 0 0 0 4px rgba(232,94,85,.1); }
.comparison-heading h3 { margin: 0; color: #35546a; font-size: .9rem; }
.comparison-heading > button { width: 28px; height: 28px; border: 0; border-radius: 7px; color: #8296a4; background: #f1f6f9; font-size: 1.15rem; }
.current-weather { display: flex; align-items: center; gap: 12px; margin: 18px 0; }
.current-weather > span { font-size: 2rem; }
.current-weather div { min-width: 0; }
.current-weather strong { color: #183e59; font-size: 1.8rem; letter-spacing: -.05em; }
.current-weather p { overflow: hidden; margin: 2px 0 0; color: #7a8f9e; font-size: .7rem; text-overflow: ellipsis; white-space: nowrap; }
.comparison-metrics { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1px; overflow: hidden; margin: 0 0 14px; border: 1px solid #e2ebf0; border-radius: 9px; background: #e2ebf0; }
.comparison-metrics div { padding: 9px; background: #f8fbfd; }
.comparison-metrics dt { color: #8598a5; font-size: .6rem; }
.comparison-metrics dd { margin: 3px 0 0; color: #456278; font-size: .72rem; font-weight: 800; }
.detail-link { color: var(--blue-700); font-size: .68rem; font-weight: 800; text-decoration: none; }
.detail-link:hover { text-decoration: underline; }
.card-state { display: grid; min-height: 210px; place-items: center; color: #79909f; font-size: .72rem; text-align: center; }
.card-state.error { align-content: center; gap: 10px; color: #a04e4e; }
.card-state.error p { margin: 0; }
.card-state.error button { padding: 7px 10px; border: 0; border-radius: 7px; color: #fff; background: var(--blue-700); font-size: .68rem; }
.empty-comparison { display: flex; align-items: center; justify-content: center; min-height: 100px; gap: 12px; margin-top: 18px; border: 1px dashed #c8dce7; border-radius: 13px; color: #8498a5; background: #f8fbfd; }
.empty-comparison span { color: #5598c3; font-size: 1.7rem; }
.empty-comparison p { margin: 0; font-size: .75rem; line-height: 1.6; }
@media (max-width: 800px) { .comparison-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 560px) {
  .map-section { padding: 18px 14px; border-radius: 16px; }
  .map-heading { align-items: flex-start; flex-direction: column; gap: 14px; }
  .selection-count { width: 100%; grid-template-columns: auto 1fr auto; }
  .selection-count button { grid-column: auto; }
  .map-canvas { height: 390px; border-radius: 12px; }
  .region-buttons { gap: 6px; }
  .region-buttons button { padding: 5px 8px; }
  .comparison-grid { grid-template-columns: 1fr; }
}
</style>
