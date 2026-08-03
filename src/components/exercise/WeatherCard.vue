<script setup>
import { computed } from 'vue'
import { useConfigStore } from '../../stores/configStore'
import { getUvLevel } from '../../services/weatherApi'

const props = defineProps({
  weather: {
    type: Object,
    required: true,
  },
  selected: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['select-card', 'click-detail'])
const configStore = useConfigStore()
const displayTemp = computed(() => configStore.formatTemperature(props.weather.temp))

const weatherIcon = {
  맑음: '☀️',
  비: '🌧️',
  구름: '☁️',
  눈: '🌨️',
  안개: '🌫️',
}

const selectCard = (weather) => {
  emit('select-card', weather)
}

const showDetail = (weather) => {
  emit('click-detail', weather)
}
</script>

<template>
  <article
    class="weather-card"
    :class="{ selected }"
    role="button"
    :aria-pressed="selected"
    :aria-label="`${props.weather.name} ${props.weather.status}, ${displayTemp}. 선택하려면 Enter를 누르세요.`"
    tabindex="0"
    @click="selectCard(props.weather)"
    @keydown.enter="selectCard(props.weather)"
    @keydown.space.prevent="selectCard(props.weather)"
  >
    <div class="card-top">
      <div>
        <p class="city-name">{{ props.weather.name }}</p>
        <p class="weather-status">{{ props.weather.status }}</p>
      </div>
      <span class="weather-icon" aria-hidden="true">
        {{ weatherIcon[props.weather.status] ?? '🌤️' }}
      </span>
    </div>

    <p class="temperature">{{ displayTemp }}</p>

    <dl class="weather-metrics">
      <div>
        <dt>체감온도</dt>
        <dd>{{ configStore.formatTemperature(props.weather.feelsLike) }}</dd>
      </div>
      <div>
        <dt>습도</dt>
        <dd>{{ props.weather.humidity }}%</dd>
      </div>
      <div>
        <dt>최근 1시간 강수</dt>
        <dd>{{ props.weather.precipitation.toFixed(1) }} mm</dd>
      </div>
      <div>
        <dt>자외선</dt>
        <dd>{{ props.weather.uvIndex ?? '—' }} <small>{{ getUvLevel(props.weather.uvIndex) }}</small></dd>
      </div>
    </dl>

    <div class="card-bottom">
      <span v-if="props.weather.temp >= 25" class="temperature-label hot">
        🔥 더움 (25도 이상)
      </span>
      <span v-else class="temperature-label cool">
        ❄️ 선선함 (25도 미만)
      </span>
      <button type="button" @click.stop="showDetail(props.weather)">상세보기</button>
    </div>
  </article>
</template>

<style scoped>
.weather-card {
  padding: 26px;
  border: 1px solid var(--line);
  border-radius: 16px;
  outline: none;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: var(--shadow);
  transition: border-color 160ms ease, box-shadow 160ms ease;
}

.weather-card:hover,
.weather-card:focus-visible,
.weather-card.selected {
  border-color: #79b9e3;
  box-shadow: 0 14px 28px rgba(45, 101, 142, 0.14);
}

.card-top,
.card-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.city-name {
  margin: 0 0 4px;
  font-size: 1.25rem;
  font-weight: 800;
}

.weather-status {
  margin: 0;
  font-size: 0.86rem;
  color: #7a8d9c;
}

.weather-icon {
  display: grid;
  width: 58px;
  height: 58px;
  border-radius: 18px;
  place-items: center;
  font-size: 2rem;
  background: #edf7ff;
}

.temperature {
  margin: 26px 0 30px;
  font-size: 3.5rem;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.06em;
  color: #153e5f;
}

.temperature span {
  margin-left: 3px;
  font-size: 1.1rem;
  font-weight: 600;
  letter-spacing: 0;
  color: #83a0b5;
}

.weather-metrics {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin: -10px 0 24px;
}

.weather-metrics div {
  padding: 10px;
  border-radius: 10px;
  background: #f2f8fc;
}

.weather-metrics dt {
  margin-bottom: 3px;
  color: #7b91a1;
  font-size: .65rem;
}

.weather-metrics dd {
  margin: 0;
  color: #34566e;
  font-size: .8rem;
  font-weight: 800;
}

.weather-metrics small {
  margin-left: 2px;
  color: #71899a;
  font-size: .62rem;
  font-weight: 600;
}

.temperature-label {
  padding: 7px 10px;
  border-radius: 9px;
  font-size: 0.7rem;
  font-weight: 700;
}

.temperature-label.hot {
  color: #cc5f31;
  background: #fff0e8;
}

.temperature-label.cool {
  color: #397eb1;
  background: #eaf5ff;
}

.card-bottom button {
  padding: 8px 12px;
  border: 0;
  border-radius: 10px;
  color: #fff;
  background: #276fa3;
  transition: background 150ms ease;
}

.card-bottom button:hover {
  background: #185984;
}

@media (max-width: 560px) {
  .card-bottom {
    align-items: flex-start;
    flex-direction: column;
  }

  .card-bottom button {
    width: 100%;
  }
}
</style>
