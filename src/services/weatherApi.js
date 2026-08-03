import axios from 'axios'

const weatherApi = axios.create({
  baseURL: 'https://api.openweathermap.org/data/2.5',
  timeout: 10000,
})

const weatherMetricsApi = axios.create({
  baseURL: 'https://api.open-meteo.com/v1',
  timeout: 10000,
})

export const WEATHER_CITIES = [
  { id: 'city_01', name: '서울', lat: 37.5665, lon: 126.978 },
  { id: 'city_02', name: '판교', lat: 37.3947, lon: 127.1112 },
  { id: 'city_03', name: '전주', lat: 35.8242, lon: 127.148 },
]

export const KOREA_WEATHER_REGIONS = [
  { id: 'region_seoul', name: '서울', lat: 37.5665, lon: 126.978 },
  { id: 'region_busan', name: '부산', lat: 35.1796, lon: 129.0756 },
  { id: 'region_daegu', name: '대구', lat: 35.8714, lon: 128.6014 },
  { id: 'region_incheon', name: '인천', lat: 37.4563, lon: 126.7052 },
  { id: 'region_gwangju', name: '광주', lat: 35.1595, lon: 126.8526 },
  { id: 'region_daejeon', name: '대전', lat: 36.3504, lon: 127.3845 },
  { id: 'region_ulsan', name: '울산', lat: 35.5384, lon: 129.3114 },
  { id: 'region_sejong', name: '세종', lat: 36.48, lon: 127.289 },
  { id: 'region_gyeonggi', name: '경기', lat: 37.2636, lon: 127.0286 },
  { id: 'region_gangwon', name: '강원', lat: 37.8813, lon: 127.7298 },
  { id: 'region_chungbuk', name: '충북', lat: 36.6424, lon: 127.489 },
  { id: 'region_chungnam', name: '충남', lat: 36.6012, lon: 126.6608 },
  { id: 'region_jeonbuk', name: '전북', lat: 35.8242, lon: 127.148 },
  { id: 'region_jeonnam', name: '전남', lat: 34.9904, lon: 126.4817 },
  { id: 'region_gyeongbuk', name: '경북', lat: 36.5684, lon: 128.7294 },
  { id: 'region_gyeongnam', name: '경남', lat: 35.2279, lon: 128.6811 },
  { id: 'region_jeju', name: '제주', lat: 33.4996, lon: 126.5312 },
]

const getStatus = (weatherId) => {
  if (weatherId === 800) return '맑음'
  if (weatherId >= 200 && weatherId < 600) return '비'
  if (weatherId >= 600 && weatherId < 700) return '눈'
  if (weatherId >= 700 && weatherId < 800) return '안개'
  return '구름'
}

const fetchWeatherMetrics = async (city) => {
  try {
    const { data } = await weatherMetricsApi.get('/forecast', {
      params: {
        latitude: city.lat,
        longitude: city.lon,
        current: 'uv_index,precipitation',
        timezone: 'Asia/Seoul',
      },
    })
    return {
      uvIndex: Number.isFinite(data.current?.uv_index) ? data.current.uv_index : null,
      precipitation: Number.isFinite(data.current?.precipitation) ? data.current.precipitation : null,
    }
  } catch {
    return { uvIndex: null, precipitation: null }
  }
}

export const getUvLevel = (uvIndex) => {
  if (!Number.isFinite(uvIndex)) return '정보 없음'
  if (uvIndex < 3) return '낮음'
  if (uvIndex < 6) return '보통'
  if (uvIndex < 8) return '높음'
  if (uvIndex < 11) return '매우 높음'
  return '위험'
}

export const getAirQualityLevel = (airQualityIndex) =>
  ({ 1: '좋음', 2: '보통', 3: '주의', 4: '나쁨', 5: '매우 나쁨' })[airQualityIndex] ?? '정보 없음'

const getWindDirection = (degrees) => {
  if (!Number.isFinite(degrees)) return '—'
  const directions = ['북', '북동', '동', '남동', '남', '남서', '서', '북서']
  return directions[Math.round(degrees / 45) % directions.length]
}

const fetchAirQuality = async (city, apiKey) => {
  try {
    const { data } = await weatherApi.get('/air_pollution', {
      params: { lat: city.lat, lon: city.lon, appid: apiKey },
    })
    const current = data.list?.[0]
    return {
      airQualityIndex: current?.main?.aqi ?? null,
      pm25: current?.components?.pm2_5 ?? null,
      pm10: current?.components?.pm10 ?? null,
    }
  } catch {
    return { airQualityIndex: null, pm25: null, pm10: null }
  }
}

const normalizeWeather = (data, city, metrics, airQuality) => ({
  id: city.id,
  name: city.name,
  temp: Math.round(data.main.temp),
  feelsLike: Math.round(data.main.feels_like),
  humidity: data.main.humidity,
  status: getStatus(data.weather[0]?.id),
  description: data.weather[0]?.description ?? '날씨 정보 없음',
  observation: `${data.weather[0]?.description ?? '현재 날씨'}이며, 체감 온도는 ${Math.round(data.main.feels_like)}도입니다.`,
  precipitation: data.rain?.['1h'] ?? data.snow?.['1h'] ?? metrics.precipitation ?? 0,
  uvIndex: metrics.uvIndex,
  pressure: data.main.pressure,
  visibility: data.visibility,
  clouds: data.clouds?.all ?? null,
  windSpeed: data.wind?.speed ?? null,
  windGust: data.wind?.gust ?? null,
  windDirection: getWindDirection(data.wind?.deg),
  sunrise: data.sys?.sunrise ?? null,
  sunset: data.sys?.sunset ?? null,
  updatedAt: data.dt ?? null,
  ...airQuality,
})

export const getWeatherErrorMessage = (error) => {
  if (error.code === 'WEATHER_KEY_MISSING') return '날씨 API 키가 설정되지 않았습니다. .env 파일을 확인해 주세요.'
  if (error.response?.status === 401) return '날씨 API 키가 유효하지 않거나 아직 활성화되지 않았습니다.'
  if (error.response?.status === 404) return '요청한 도시의 날씨 정보를 찾을 수 없습니다.'
  if (error.code === 'ECONNABORTED') return '날씨 서버 응답이 지연되고 있습니다. 잠시 후 다시 시도해 주세요.'
  return '날씨 정보를 불러오지 못했습니다. 네트워크 연결을 확인해 주세요.'
}

export const fetchCurrentWeather = async (city) => {
  const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY?.trim()
  if (!apiKey || apiKey.includes('여기에_')) {
    const error = new Error('OpenWeather API key is missing')
    error.code = 'WEATHER_KEY_MISSING'
    throw error
  }

  const [weatherResponse, metrics, airQuality] = await Promise.all([
    weatherApi.get('/weather', {
      params: { lat: city.lat, lon: city.lon, appid: apiKey, units: 'metric', lang: 'kr' },
    }),
    fetchWeatherMetrics(city),
    fetchAirQuality(city, apiKey),
  ])

  return normalizeWeather(weatherResponse.data, city, metrics, airQuality)
}
