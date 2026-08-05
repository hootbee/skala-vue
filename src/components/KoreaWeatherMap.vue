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
const lastActiveRegion = ref(null)
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
    statusMessage.value = `${region.name} (${region.landmarkName ?? '대표 지역'}) 날씨를 불러왔습니다. 현재 ${configStore.formatTemperature(weather.temp)}, ${weather.status}입니다.`
  } catch (error) {
    errorsById.value = { ...errorsById.value, [region.id]: getWeatherErrorMessage(error) }
    statusMessage.value = `${region.name} 날씨를 불러오지 못했습니다.`
  } finally {
    loadingIds.value = loadingIds.value.filter((id) => id !== region.id)
  }
}

const toggleRegion = async (region) => {
  lastActiveRegion.value = region
  if (isSelected(region.id)) {
    selectedIds.value = selectedIds.value.filter((id) => id !== region.id)
    statusMessage.value = `${region.name}을 비교 목록에서 제외했습니다.`
    await nextTick()
    updateMarker(region)
    return
  }

  selectedIds.value = [...selectedIds.value, region.id]
  statusMessage.value = `${region.name} (${region.landmarkName ?? ''})을 비교 목록에 추가했습니다.`
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
  lastActiveRegion.value = null
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
    lastActiveRegion.value = nearest
    if (!isSelected(nearest.id)) toggleRegion(nearest)
    else statusMessage.value = `${nearest.name} (${nearest.landmarkName})은 이미 비교 목록에 있습니다.`
  })
})

const handleImageError = (event) => {
  if (event?.target?.parentElement) {
    event.target.parentElement.style.display = 'none'
  }
}

onBeforeUnmount(() => {
  map?.remove()
  markerById.clear()
})
</script>

<template>
  <section class="map-section" aria-labelledby="korea-map-title">
    <div
      v-if="lastActiveRegion?.landmarkImg"
      class="section-landmark-photo"
      aria-hidden="true"
      :style="{ backgroundImage: `url(${lastActiveRegion.landmarkImg})` }"
    ></div>
    <div
      v-else-if="lastActiveRegion?.landmarkSvg"
      class="section-landmark-backdrop"
      aria-hidden="true"
      v-html="lastActiveRegion.landmarkSvg"
    ></div>

    <div class="map-heading">
      <div>
        <p class="eyebrow">KOREA WEATHER MAP</p>
        <h2 id="korea-map-title">지도에서 지역 날씨 비교</h2>
        <p>지도 위 지역 지점이나 빈 곳을 누르면 그 지역의 랜드마크 배경과 날씨를 추가합니다.</p>
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

    <div v-if="lastActiveRegion" class="landmark-spotlight-banner">
      <div
        v-if="lastActiveRegion.landmarkImg"
        class="spotlight-img-box"
      >
        <img
          :src="lastActiveRegion.landmarkImg"
          :alt="`${lastActiveRegion.name} ${lastActiveRegion.landmarkName}`"
          class="spotlight-img"
          @error="handleImageError"
        />
      </div>
      <div class="spotlight-info">
        <span class="spotlight-badge">🏛️ {{ lastActiveRegion.name }} 대표 랜드마크</span>
        <h4>{{ lastActiveRegion.landmarkName }}</h4>
        <p>{{ lastActiveRegion.landmarkDesc }}</p>
      </div>
    </div>

    <div v-if="selectedRegions.length" class="comparison-grid" aria-label="선택 지역 날씨 비교">
      <article v-for="region in selectedRegions" :key="region.id" class="comparison-card">
        <!-- Prominent Landmark Photo Banner -->
        <div v-if="region.landmarkImg" class="card-landmark-photo-banner">
          <img
            :src="region.landmarkImg"
            :alt="`${region.name} ${region.landmarkName}`"
            class="landmark-photo-img"
            @error="handleImageError"
          />
          <div class="photo-overlay"></div>
          <div class="landmark-photo-tag">
            <span aria-hidden="true">🏛️</span>
            <span>{{ region.landmarkName }}</span>
          </div>
        </div>

        <div class="comparison-heading">
          <div><span class="region-pin" aria-hidden="true"></span><h3>{{ region.name }}</h3></div>
          <button type="button" :aria-label="`${region.name} 비교에서 삭제`" @click="toggleRegion(region)">×</button>
        </div>

        <p v-if="region.landmarkDesc" class="landmark-desc-text">
          📍 {{ region.landmarkDesc }}
        </p>

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
      <p>아직 선택한 지역이 없습니다.<br>지도나 버튼을 누르면 해당 지역 랜드마크 배경과 함께 날씨를 비교할 수 있어요.</p>
    </div>
  </section>
</template>

<style scoped>
.map-section {
  position: relative;
  overflow: hidden;
  margin: 22px 0 28px;
  padding: 28px;
  border: 1px solid #cbdfea;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: var(--shadow);
}
.section-landmark-photo {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  opacity: 0.12;
  mix-blend-mode: multiply;
  pointer-events: none;
  z-index: 0;
  transition: opacity 0.5s ease, background-image 0.5s ease;
  filter: contrast(1.05) brightness(1.05);
}
.section-landmark-backdrop {
  position: absolute;
  right: -20px;
  bottom: -20px;
  width: 320px;
  height: 320px;
  color: #17649a;
  opacity: 0.07;
  pointer-events: none;
  z-index: 0;
  transition: opacity 0.5s ease;
}
.section-landmark-backdrop :deep(svg) {
  width: 100%;
  height: 100%;
}
.map-heading,
.map-canvas,
.region-buttons,
.map-status,
.comparison-grid,
.empty-comparison {
  position: relative;
  z-index: 1;
}
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
.region-buttons button { display: inline-flex; align-items: center; min-height: 34px; gap: 6px; padding: 6px 10px; border: 1px solid #cfdee7; border-radius: 99px; color: #587487; background: #fff; font-size: .7rem; font-weight: 700; transition: border-color 0.2s, background 0.2s; }
.region-buttons button:hover { border-color: #68a9d2; background: #f0f8fd; }
.region-buttons button.selected { border-color: #17649a; color: #17649a; background: #e8f4fc; }
.region-buttons button span { width: 6px; height: 6px; border-radius: 50%; background: #69a9d2; }
.region-buttons button.selected span { background: #e85e55; }
.map-status { min-height: 20px; margin: 11px 2px 0; color: #718898; font-size: .7rem; }
.landmark-spotlight-banner {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 14px;
  padding: 12px 16px;
  border: 1px solid #bde0fe;
  border-radius: 14px;
  background: linear-gradient(135deg, #e8f4fc 0%, #f0f8ff 100%);
  box-shadow: 0 4px 12px rgba(23, 100, 154, 0.08);
}
.spotlight-img-box {
  width: 96px;
  height: 68px;
  flex: 0 0 auto;
  overflow: hidden;
  border-radius: 10px;
  border: 1px solid #a2d2ff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
.spotlight-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.spotlight-info { min-width: 0; }
.spotlight-badge {
  display: inline-block;
  color: var(--blue-700);
  font-size: 0.68rem;
  font-weight: 800;
}
.spotlight-info h4 {
  margin: 2px 0 3px;
  color: #1a415a;
  font-size: 1.05rem;
  letter-spacing: -0.02em;
}
.spotlight-info p {
  margin: 0;
  color: #5c788d;
  font-size: 0.75rem;
}
.comparison-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-top: 20px; }
.comparison-card {
  position: relative;
  overflow: hidden;
  min-width: 0;
  padding: 18px;
  border: 1px solid #d4e3eb;
  border-radius: 14px;
  background: #ffffff;
  box-shadow: 0 4px 14px rgba(24, 62, 89, 0.07);
}
.card-landmark-photo-banner {
  position: relative;
  height: 130px;
  margin: -18px -18px 14px;
  overflow: hidden;
  border-bottom: 1px solid #d4e3eb;
}
.landmark-photo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}
.comparison-card:hover .landmark-photo-img {
  transform: scale(1.05);
}
.photo-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(16, 42, 62, 0.75) 0%, rgba(16, 42, 62, 0.1) 60%, transparent 100%);
}
.landmark-photo-tag {
  position: absolute;
  left: 12px;
  bottom: 10px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 9px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.94);
  color: #194360;
  font-size: 0.72rem;
  font-weight: 800;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
.landmark-desc-text {
  margin: 4px 0 10px;
  color: #60798b;
  font-size: 0.68rem;
  line-height: 1.4;
}
.card-landmark-img-bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  opacity: 0.16;
  mix-blend-mode: multiply;
  pointer-events: none;
  z-index: 0;
  transition: opacity 0.4s ease;
  mask-image: linear-gradient(to bottom right, rgba(0,0,0,0.9), rgba(0,0,0,0.15));
  -webkit-mask-image: linear-gradient(to bottom right, rgba(0,0,0,0.9), rgba(0,0,0,0.15));
}
.card-landmark-bg {
  position: absolute;
  right: -15px;
  bottom: -15px;
  width: 170px;
  height: 170px;
  color: #276f9e;
  opacity: 0.11;
  pointer-events: none;
  z-index: 0;
  transition: opacity 0.4s ease;
}
.card-landmark-bg :deep(svg) {
  width: 100%;
  height: 100%;
}
.comparison-heading,
.landmark-badge,
.current-weather,
.comparison-metrics,
.detail-link,
.card-state {
  position: relative;
  z-index: 1;
}
.comparison-heading { display: flex; align-items: center; justify-content: space-between; }
.comparison-heading > div { display: flex; align-items: center; gap: 7px; }
.region-pin { width: 8px; height: 8px; border-radius: 50%; background: #e85e55; box-shadow: 0 0 0 4px rgba(232,94,85,.1); }
.comparison-heading h3 { margin: 0; color: #35546a; font-size: .9rem; }
.comparison-heading > button { width: 28px; height: 28px; border: 0; border-radius: 7px; color: #8296a4; background: #f1f6f9; font-size: 1.15rem; cursor: pointer; }
.landmark-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-top: 6px;
  padding: 3px 8px;
  border-radius: 6px;
  background: rgba(232, 244, 252, 0.85);
  border: 1px solid rgba(186, 219, 239, 0.6);
  color: #265575;
  font-size: 0.65rem;
  font-weight: 700;
}
.current-weather { display: flex; align-items: center; gap: 12px; margin: 14px 0 16px; }
.current-weather > span { font-size: 2rem; }
.current-weather div { min-width: 0; }
.current-weather strong { color: #183e59; font-size: 1.8rem; letter-spacing: -.05em; }
.current-weather p { overflow: hidden; margin: 2px 0 0; color: #7a8f9e; font-size: .7rem; text-overflow: ellipsis; white-space: nowrap; }
.comparison-metrics { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1px; overflow: hidden; margin: 0 0 14px; border: 1px solid #e2ebf0; border-radius: 9px; background: #e2ebf0; }
.comparison-metrics div { padding: 9px; background: rgba(248, 251, 253, 0.92); }
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
