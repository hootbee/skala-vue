<script setup>
import { nextTick, ref } from 'vue'
import { useConfigStore } from '../stores/configStore'
import {
  fetchCurrentWeather,
  getAirQualityLevel,
  getUvLevel,
  getWeatherErrorMessage,
  KOREA_WEATHER_REGIONS,
  WEATHER_CITIES,
} from '../services/weatherApi'

const CHAT_REGIONS = [
  ...KOREA_WEATHER_REGIONS,
  ...WEATHER_CITIES.filter(({ name }) => name === '판교'),
]

const REGION_ALIASES = {
  region_seoul: ['서울', '서울시'],
  region_busan: ['부산', '부산시'],
  region_daegu: ['대구', '대구시'],
  region_incheon: ['인천', '인천시'],
  region_gwangju: ['광주', '광주시'],
  region_daejeon: ['대전', '대전시'],
  region_ulsan: ['울산', '울산시'],
  region_sejong: ['세종', '세종시'],
  region_gyeonggi: ['경기', '경기도', '수원'],
  region_gangwon: ['강원', '강원도', '강원특별자치도', '춘천'],
  region_chungbuk: ['충북', '충청북도', '청주'],
  region_chungnam: ['충남', '충청남도', '홍성', '천안'],
  region_jeonbuk: ['전북', '전라북도', '전북특별자치도', '전주'],
  region_jeonnam: ['전남', '전라남도', '무안'],
  region_gyeongbuk: ['경북', '경상북도', '안동'],
  region_gyeongnam: ['경남', '경상남도', '창원'],
  region_jeju: ['제주', '제주도', '제주특별자치도'],
  city_02: ['판교', '성남'],
}

const configStore = useConfigStore()
const isOpen = ref(false)
const isLoading = ref(false)
const question = ref('')
const input = ref(null)
const chatLog = ref(null)
const lastCity = ref(KOREA_WEATHER_REGIONS[0])
const weatherCache = new Map()
let messageId = 1

const messages = ref([
  {
    id: messageId++,
    sender: 'bot',
    text: '안녕하세요! 전국 17개 시·도와 판교의 실시간 날씨를 알려드려요.\n두 지역 이상을 함께 입력하면 날씨도 비교할 수 있어요.',
  },
])

const quickQuestions = ['서울 부산 날씨 비교', '제주 바람', '강원도 우산 필요해?', '전주 미세먼지']

const scrollToLatest = async () => {
  await nextTick()
  if (chatLog.value) chatLog.value.scrollTop = chatLog.value.scrollHeight
}

const toggleChat = async () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    await nextTick()
    input.value?.focus()
    scrollToLatest()
  }
}

const getMentionedRegions = (text) => CHAT_REGIONS.filter((region) =>
  (REGION_ALIASES[region.id] ?? [region.name]).some((alias) => text.includes(alias)),
)

const findRegions = (text) => {
  const regions = getMentionedRegions(text)
  return regions.length ? regions : [lastCity.value]
}

const formatTime = (timestamp) => timestamp
  ? new Intl.DateTimeFormat('ko-KR', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Seoul' }).format(new Date(timestamp * 1000))
  : '정보 없음'

const getClothingAdvice = (temperature) => {
  if (temperature >= 28) return '민소매나 반소매처럼 통풍이 잘되는 가벼운 옷이 좋아요.'
  if (temperature >= 23) return '반소매가 적당하고, 실내 냉방에 대비해 얇은 겉옷을 챙기세요.'
  if (temperature >= 17) return '긴소매나 얇은 가디건, 가벼운 재킷이 잘 맞아요.'
  if (temperature >= 12) return '니트나 재킷처럼 보온이 되는 겉옷을 추천해요.'
  if (temperature >= 5) return '코트나 두꺼운 재킷을 입고 체온을 지켜주세요.'
  return '두꺼운 외투와 목도리, 장갑 등 방한용품이 필요해요.'
}

const createAnswer = (text, weather) => {
  const cityName = weather.name

  if (/우산|비|강수/.test(text)) {
    return weather.precipitation > 0 || weather.status === '비'
      ? `${cityName}은 현재 ${weather.precipitation.toFixed(1)}mm의 강수가 관측됐어요. 우산을 챙기는 편이 좋습니다.`
      : `${cityName}은 최근 1시간 강수량이 0mm예요. 현재 관측 기준으로 우산은 필요하지 않아 보여요.`
  }
  if (/옷|복장|입어|코디/.test(text)) {
    return `${cityName}은 현재 ${configStore.formatTemperature(weather.temp)}, 체감 ${configStore.formatTemperature(weather.feelsLike)}예요. ${getClothingAdvice(weather.feelsLike)}`
  }
  if (/자외선|선크림|햇빛|썬크림/.test(text)) {
    return weather.uvIndex == null
      ? `${cityName}의 자외선 정보를 현재 불러오지 못했어요.`
      : `${cityName}의 자외선 지수는 ${weather.uvIndex}, '${getUvLevel(weather.uvIndex)}' 단계예요.${weather.uvIndex >= 6 ? ' 외출 전 자외선 차단제를 바르고 모자를 챙기세요.' : ' 장시간 야외 활동이 아니라면 부담이 크지 않아요.'}`
  }
  if (/미세먼지|공기|대기|pm/.test(text)) {
    return `${cityName}의 공기질은 '${getAirQualityLevel(weather.airQualityIndex)}' 단계예요. PM2.5는 ${weather.pm25?.toFixed(1) ?? '—'}㎍/㎥, PM10은 ${weather.pm10?.toFixed(1) ?? '—'}㎍/㎥입니다.${weather.airQualityIndex >= 4 ? ' 야외 활동 시간을 줄이고 마스크를 챙기세요.' : ''}`
  }
  if (/바람|풍속|강풍/.test(text)) {
    return `${cityName}은 ${weather.windDirection}풍이 ${weather.windSpeed?.toFixed(1) ?? '—'}m/s로 불고 있어요.${weather.windGust ? ` 순간풍속은 ${weather.windGust.toFixed(1)}m/s입니다.` : ''}${weather.windSpeed >= 8 ? ' 바람이 강하니 이동할 때 주의하세요.' : ''}`
  }
  if (/일출|해.?뜰|일몰|해.?질/.test(text)) {
    return `${cityName}의 일출은 ${formatTime(weather.sunrise)}, 일몰은 ${formatTime(weather.sunset)}이에요.`
  }
  if (/습도|건조|눅눅/.test(text)) {
    return `${cityName}의 현재 습도는 ${weather.humidity}%예요.${weather.humidity >= 70 ? ' 다소 습하니 실내 환기나 제습이 도움 됩니다.' : weather.humidity <= 35 ? ' 건조한 편이니 수분 섭취와 보습에 신경 써주세요.' : ' 비교적 쾌적한 범위예요.'}`
  }
  if (/기압/.test(text)) {
    return `${cityName}의 현재 기압은 ${weather.pressure}hPa예요.`
  }
  if (/가시|시야|안개/.test(text)) {
    return `${cityName}의 현재 가시거리는 ${weather.visibility ? (weather.visibility / 1000).toFixed(1) : '—'}km예요.`
  }
  if (/구름|흐림|운량/.test(text)) {
    return `${cityName}의 구름량은 ${weather.clouds ?? '—'}%이며 현재 날씨는 ${weather.description}입니다.`
  }
  if (/날씨|기온|온도|체감|어때|상태/.test(text) || getMentionedRegions(text).length) {
    return `${cityName}은 현재 ${weather.description}, ${configStore.formatTemperature(weather.temp)}예요. 체감온도는 ${configStore.formatTemperature(weather.feelsLike)}, 습도는 ${weather.humidity}%입니다.`
  }

  return '날씨, 지역 비교, 기온, 우산, 옷차림, 자외선, 미세먼지, 바람, 습도, 기압, 가시거리, 구름량, 일출·일몰을 물어보세요. 예: “서울 부산 날씨 비교”'
}

const createComparisonAnswer = (text, weatherList) => {
  if (/우산|비|강수/.test(text)) {
    const lines = weatherList.map((weather) =>
      `• ${weather.name}: ${weather.precipitation.toFixed(1)}mm · ${weather.precipitation > 0 || weather.status === '비' ? '우산 권장' : '현재 우산 불필요'}`,
    )
    return `지역별 강수 비교예요.\n${lines.join('\n')}`
  }
  if (/미세먼지|공기|대기|pm/.test(text)) {
    const lines = weatherList.map((weather) =>
      `• ${weather.name}: ${getAirQualityLevel(weather.airQualityIndex)} · PM2.5 ${weather.pm25?.toFixed(1) ?? '—'}㎍/㎥`,
    )
    return `지역별 공기질 비교예요.\n${lines.join('\n')}`
  }
  if (/자외선|선크림|햇빛|썬크림/.test(text)) {
    const lines = weatherList.map((weather) => `• ${weather.name}: ${weather.uvIndex ?? '—'} · ${getUvLevel(weather.uvIndex)}`)
    return `지역별 자외선 비교예요.\n${lines.join('\n')}`
  }
  if (/바람|풍속|강풍/.test(text)) {
    const lines = weatherList.map((weather) => `• ${weather.name}: ${weather.windDirection}풍 ${weather.windSpeed?.toFixed(1) ?? '—'}m/s`)
    return `지역별 바람 비교예요.\n${lines.join('\n')}`
  }
  if (/습도|건조|눅눅/.test(text)) {
    const lines = weatherList.map((weather) => `• ${weather.name}: 습도 ${weather.humidity}%`)
    return `지역별 습도 비교예요.\n${lines.join('\n')}`
  }
  if (/옷|복장|입어|코디/.test(text)) {
    const lines = weatherList.map((weather) => `• ${weather.name} ${configStore.formatTemperature(weather.feelsLike)}: ${getClothingAdvice(weather.feelsLike)}`)
    return `체감온도에 맞춘 지역별 옷차림이에요.\n${lines.join('\n')}`
  }

  const warmest = weatherList.reduce((result, weather) => weather.temp > result.temp ? weather : result)
  const coolest = weatherList.reduce((result, weather) => weather.temp < result.temp ? weather : result)
  const lines = weatherList.map((weather) =>
    `• ${weather.name}: ${configStore.formatTemperature(weather.temp)} · ${weather.description} · 체감 ${configStore.formatTemperature(weather.feelsLike)}`,
  )
  const difference = Math.abs(warmest.temp - coolest.temp)
  const summary = difference
    ? `${warmest.name}이 ${coolest.name}보다 ${difference}도 높아요.`
    : '현재 지역 간 기온 차이가 거의 없어요.'
  return `선택한 지역의 현재 날씨예요.\n${lines.join('\n')}\n${summary}`
}

const getCachedWeather = async (region) => {
  const cached = weatherCache.get(region.id)
  if (cached && Date.now() - cached.savedAt < 5 * 60 * 1000) return cached.weather
  const weather = await fetchCurrentWeather(region)
  weatherCache.set(region.id, { weather, savedAt: Date.now() })
  return weather
}

const askQuestion = async (preset) => {
  const text = (preset ?? question.value).trim()
  if (!text || isLoading.value) return

  messages.value.push({ id: messageId++, sender: 'user', text })
  question.value = ''
  isLoading.value = true
  await scrollToLatest()

  const regions = findRegions(text).slice(0, 5)
  lastCity.value = regions.at(-1)
  try {
    const results = await Promise.allSettled(regions.map(getCachedWeather))
    const weatherList = results.filter(({ status }) => status === 'fulfilled').map(({ value }) => value)
    if (!weatherList.length) throw results[0].reason
    const answer = weatherList.length > 1
      ? createComparisonAnswer(text.toLowerCase(), weatherList)
      : createAnswer(text.toLowerCase(), weatherList[0])
    const partialNotice = weatherList.length < regions.length ? '\n일부 지역은 정보를 불러오지 못했어요.' : ''
    messages.value.push({ id: messageId++, sender: 'bot', text: `${answer}${partialNotice}` })
  } catch (error) {
    messages.value.push({ id: messageId++, sender: 'bot', text: getWeatherErrorMessage(error), error: true })
  } finally {
    isLoading.value = false
    await scrollToLatest()
    input.value?.focus()
  }
}
</script>

<template>
  <div class="chatbot-wrap" @keydown.esc="isOpen = false">
    <section v-if="isOpen" id="weather-chatbot" class="chatbot-panel" aria-label="룰베이스 날씨 챗봇">
      <header class="chatbot-header">
        <div class="bot-avatar" aria-hidden="true">W</div>
        <div>
          <div class="bot-title"><h2>날씨 도우미</h2><span>RULE AI</span></div>
          <p><span aria-hidden="true"></span> 실시간 날씨 연결됨</p>
        </div>
        <button type="button" aria-label="날씨 챗봇 닫기" @click="toggleChat">×</button>
      </header>

      <div ref="chatLog" class="chat-log" aria-live="polite" aria-relevant="additions">
        <div v-for="message in messages" :key="message.id" :class="['message-row', message.sender]">
          <span v-if="message.sender === 'bot'" class="message-avatar" aria-hidden="true">W</span>
          <p :class="{ error: message.error }">{{ message.text }}</p>
        </div>
        <div v-if="isLoading" class="message-row bot" role="status">
          <span class="message-avatar" aria-hidden="true">W</span>
          <p class="typing" aria-label="답변을 만드는 중"><span></span><span></span><span></span></p>
        </div>
      </div>

      <div class="quick-questions" aria-label="추천 질문">
        <button v-for="item in quickQuestions" :key="item" type="button" :disabled="isLoading" @click="askQuestion(item)">{{ item }}</button>
      </div>

      <form class="chat-form" @submit.prevent="askQuestion()">
        <label class="sr-only" for="weather-question">날씨 질문 입력</label>
        <input id="weather-question" ref="input" v-model="question" :disabled="isLoading" autocomplete="off" placeholder="예: 서울 부산 날씨 비교">
        <button type="submit" :disabled="!question.trim() || isLoading" aria-label="질문 보내기">↑</button>
      </form>
      <p class="rule-notice">키워드 규칙에 따라 답변하며 예보가 아닌 현재 관측 정보입니다.</p>
    </section>

    <button
      v-else
      class="chatbot-toggle"
      type="button"
      aria-controls="weather-chatbot"
      :aria-expanded="isOpen"
      aria-label="날씨 챗봇 열기"
      @click="toggleChat"
    >
      <span aria-hidden="true">☁</span>
      <strong>날씨 질문</strong>
    </button>
  </div>
</template>

<style scoped>
.chatbot-wrap { position: fixed; right: 24px; bottom: 24px; z-index: 5000; isolation: isolate; }
.chatbot-toggle { display: flex; align-items: center; min-height: 54px; gap: 10px; padding: 8px 18px 8px 8px; border: 0; border-radius: 999px; color: #fff; background: #17649a; box-shadow: 0 14px 34px rgba(24, 87, 131, .28); transition: transform .18s, background .18s; }
.chatbot-toggle:hover { background: #12527e; transform: translateY(-2px); }
.chatbot-toggle span { display: grid; width: 38px; height: 38px; border-radius: 50%; place-items: center; color: #17649a; background: #fff; font-size: 1.25rem; }
.chatbot-toggle strong { font-size: .82rem; }
.chatbot-panel { display: grid; grid-template-rows: auto minmax(0, 1fr) auto auto auto; width: min(380px, calc(100vw - 32px)); height: min(610px, calc(100vh - 48px)); overflow: hidden; border: 1px solid #cbdfea; border-radius: 20px; background: #f7fafc; box-shadow: 0 24px 70px rgba(24, 68, 98, .24); }
.chatbot-header { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 11px; padding: 17px 18px; color: #fff; background: linear-gradient(120deg, #12577f, #247fb7); }
.bot-avatar, .message-avatar { display: grid; border-radius: 50%; place-items: center; font-weight: 900; }
.bot-avatar { width: 40px; height: 40px; color: #17649a; background: #fff; }
.bot-title { display: flex; align-items: center; gap: 7px; }
.bot-title h2 { margin: 0; font-size: .95rem; }
.bot-title span { padding: 3px 6px; border-radius: 99px; color: #d8f1ff; background: rgba(255,255,255,.13); font-size: .53rem; font-weight: 800; letter-spacing: .05em; }
.chatbot-header p { display: flex; align-items: center; gap: 5px; margin: 4px 0 0; color: rgba(255,255,255,.7); font-size: .64rem; }
.chatbot-header p span { width: 6px; height: 6px; border-radius: 50%; background: #68e0a6; }
.chatbot-header > button { width: 34px; height: 34px; border: 0; border-radius: 8px; color: #fff; background: transparent; font-size: 1.5rem; line-height: 1; }
.chatbot-header > button:hover { background: rgba(255,255,255,.13); }
.chat-log { display: flex; overflow-y: auto; flex-direction: column; gap: 14px; padding: 20px 16px; scroll-behavior: smooth; }
.message-row { display: flex; align-items: flex-end; gap: 7px; }
.message-row.user { justify-content: flex-end; }
.message-avatar { width: 26px; height: 26px; flex: 0 0 auto; color: #fff; background: var(--blue-700); font-size: .62rem; }
.message-row p { max-width: 82%; margin: 0; padding: 11px 13px; border: 1px solid #dbe7ee; border-radius: 5px 14px 14px; color: #496579; background: #fff; box-shadow: 0 4px 10px rgba(38,78,105,.04); font-size: .78rem; line-height: 1.65; white-space: pre-line; }
.message-row.user p { border: 0; border-radius: 14px 14px 5px; color: #fff; background: #2476aa; }
.message-row p.error { color: #9e4747; background: #fff4f4; }
.typing { display: flex; align-items: center; min-height: 38px; gap: 4px; }
.typing span { width: 5px; height: 5px; border-radius: 50%; background: #7c98aa; animation: typing 1s infinite ease-in-out; }
.typing span:nth-child(2) { animation-delay: .14s; }.typing span:nth-child(3) { animation-delay: .28s; }
.quick-questions { display: flex; overflow-x: auto; gap: 6px; padding: 0 16px 10px; scrollbar-width: none; }
.quick-questions::-webkit-scrollbar { display: none; }
.quick-questions button { flex: 0 0 auto; padding: 7px 9px; border: 1px solid #cbdfea; border-radius: 99px; color: #4e7894; background: #fff; font-size: .65rem; }
.quick-questions button:hover:not(:disabled) { border-color: #5ea1cb; background: #eff8fd; }
.chat-form { display: grid; grid-template-columns: 1fr auto; gap: 8px; margin: 0 14px; padding: 7px; border: 1px solid #cbdde7; border-radius: 12px; background: #fff; }
.chat-form:focus-within { border-color: var(--blue-500); box-shadow: 0 0 0 3px rgba(49,139,208,.1); }
.chat-form input { min-width: 0; padding: 6px 7px; border: 0; outline: none; color: var(--ink); background: transparent; font-size: .78rem; }
.chat-form input::placeholder { color: #96a9b5; }
.chat-form button { width: 34px; height: 34px; border: 0; border-radius: 9px; color: #fff; background: var(--blue-700); font-size: 1rem; font-weight: 900; }
.chat-form button:disabled { cursor: default; opacity: .35; }
.rule-notice { margin: 8px 14px 12px; color: #94a5b0; text-align: center; font-size: .58rem; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
@keyframes typing { 0%, 60%, 100% { transform: translateY(0); opacity: .45; } 30% { transform: translateY(-3px); opacity: 1; } }
@media (max-width: 560px) {
  .chatbot-wrap { right: 12px; bottom: 12px; }
  .chatbot-panel { width: calc(100vw - 24px); height: min(620px, calc(100dvh - 24px)); border-radius: 16px; }
  .chatbot-toggle strong { display: none; }
  .chatbot-toggle { width: 54px; padding: 8px; }
}
</style>
