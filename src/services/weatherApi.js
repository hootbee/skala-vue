import axios from 'axios'

const weatherApi = axios.create({
  baseURL: 'https://api.openweathermap.org/data/2.5',
  timeout: 10000,
})

const weatherMetricsApi = axios.create({
  baseURL: 'https://api.open-meteo.com/v1',
  timeout: 10000,
})

export const resolvePublicUrl = (path) => {
  if (!path) return null
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  const base = import.meta.env.BASE_URL ?? '/'
  const cleanBase = base.endsWith('/') ? base : `${base}/`
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  return `${cleanBase}${cleanPath}`
}

export const REGION_LANDMARKS = {
  region_seoul: {
    name: 'N서울타워',
    desc: '서울의 중심 남산 정상의 명소',
    img: resolvePublicUrl('/landmarks/seoul.jpg'),
    svg: `<svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M100 20L103 60H97L100 20Z" fill="currentColor"/><circle cx="100" cy="70" r="16" stroke="currentColor" stroke-width="3" fill="none"/><path d="M92 86L85 170H115L108 86" stroke="currentColor" stroke-width="3" fill="none"/><path d="M70 170H130" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><path d="M40 180C70 165 130 165 160 180" stroke="currentColor" stroke-width="2" stroke-dasharray="4 4"/></svg>`,
  },
  region_busan: {
    name: '광안대교',
    desc: '푸른 바다 위 수놓은 명품 현수교',
    img: resolvePublicUrl('/landmarks/busan.jpg'),
    svg: `<svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M40 110L70 50L70 150M160 110L130 50L130 150" stroke="currentColor" stroke-width="3"/><path d="M20 110Q100 135 180 110" stroke="currentColor" stroke-width="4"/><path d="M70 50Q100 100 130 50" stroke="currentColor" stroke-width="2"/><line x1="70" y1="80" x2="130" y2="80" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 3"/><path d="M10 150Q100 130 190 150" stroke="currentColor" stroke-width="2"/></svg>`,
  },
  region_daegu: {
    name: '83타워',
    desc: '대구 시내가 한눈에 펼쳐지는 타워',
    img: resolvePublicUrl('/landmarks/daegu.jpg'),
    svg: `<svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M100 15V55M94 55H106V75H94V55Z" stroke="currentColor" stroke-width="2.5"/><polygon points="80,95 120,95 110,75 90,75" fill="none" stroke="currentColor" stroke-width="3"/><path d="M92 95L82 170H118L108 95" stroke="currentColor" stroke-width="3"/><line x1="60" y1="170" x2="140" y2="170" stroke="currentColor" stroke-width="3"/></svg>`,
  },
  region_incheon: {
    name: '인천대교',
    desc: '서해 바다를 가로지르는 사장교',
    img: resolvePublicUrl('/landmarks/incheon.jpg'),
    svg: `<svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M100 30L100 150M100 30L50 120M100 30L65 120M100 30L80 120M100 30L120 120M100 30L135 120M100 30L150 120" stroke="currentColor" stroke-width="2"/><line x1="20" y1="120" x2="180" y2="120" stroke="currentColor" stroke-width="4"/><path d="M10 145C60 135 140 135 190 145" stroke="currentColor" stroke-width="2" stroke-dasharray="4 4"/></svg>`,
  },
  region_gwangju: {
    name: '무등산 주상절리대',
    desc: '빛고을을 품은 웅장한 국립공원',
    img: resolvePublicUrl('/landmarks/gwangju.jpg'),
    svg: `<svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 160L60 90L100 120L140 60L180 160Z" fill="none" stroke="currentColor" stroke-width="3"/><path d="M60 90V160M100 120V160M140 60V160" stroke="currentColor" stroke-width="2" stroke-dasharray="4 2"/><circle cx="155" cy="45" r="12" stroke="currentColor" stroke-width="2"/></svg>`,
  },
  region_daejeon: {
    name: '한빛탑',
    desc: '과학도시 대전의 상징 엑스포 타워',
    img: resolvePublicUrl('/landmarks/daejeon.jpg'),
    svg: `<svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M100 15L100 50M90 50H110L106 70H94L90 50Z" stroke="currentColor" stroke-width="2.5"/><ellipse cx="100" cy="85" rx="25" ry="12" stroke="currentColor" stroke-width="3" fill="none"/><path d="M90 97L75 170H125L110 97" stroke="currentColor" stroke-width="3"/><line x1="55" y1="170" x2="145" y2="170" stroke="currentColor" stroke-width="3"/></svg>`,
  },
  region_ulsan: {
    name: '울산대교',
    desc: '산업 수도 해안을 잇는 단경간 현수교',
    img: resolvePublicUrl('/landmarks/ulsan.jpg'),
    svg: `<svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M50 40V140M150 40V140" stroke="currentColor" stroke-width="3.5"/><path d="M20 90Q100 125 180 90" stroke="currentColor" stroke-width="3.5"/><path d="M50 40Q100 85 150 40" stroke="currentColor" stroke-width="2"/><line x1="15" y1="110" x2="185" y2="110" stroke="currentColor" stroke-width="3"/></svg>`,
  },
  region_sejong: {
    name: '세종호수공원',
    desc: '국내 최대 인공호수와 무대섬',
    img: resolvePublicUrl('/landmarks/sejong.jpg'),
    svg: `<svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M40 120C60 90 140 90 160 120C140 135 60 135 40 120Z" stroke="currentColor" stroke-width="3" fill="none"/><path d="M70 100C85 80 115 80 130 100" stroke="currentColor" stroke-width="2.5"/><path d="M20 145C70 135 130 135 180 145" stroke="currentColor" stroke-width="2"/><path d="M30 160C80 150 120 150 170 160" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 3"/></svg>`,
  },
  region_gyeonggi: {
    name: '수원화성',
    desc: '세계문화유산 조선의 대표 성곽',
    img: resolvePublicUrl('/landmarks/gyeonggi.jpg'),
    svg: `<svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M40 110L100 80L160 110H40Z" stroke="currentColor" stroke-width="3"/><path d="M50 80L100 55L150 80" stroke="currentColor" stroke-width="2.5"/><rect x="50" y="110" width="100" height="50" stroke="currentColor" stroke-width="3"/><path d="M85 160C85 140 115 140 115 160" stroke="currentColor" stroke-width="3" fill="none"/></svg>`,
  },
  region_gangwon: {
    name: '설악산 울산바위',
    desc: '동해를 굽어보는 웅장한 바위 암봉',
    img: resolvePublicUrl('/landmarks/gangwon.jpg'),
    svg: `<svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 160L50 80L75 110L110 50L145 105L180 160Z" stroke="currentColor" stroke-width="3.5" fill="none"/><path d="M50 80V160M110 50V160M145 105V160" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 3"/><path d="M15 165H185" stroke="currentColor" stroke-width="3"/></svg>`,
  },
  region_chungbuk: {
    name: '단양 도담삼봉',
    desc: '남한강 위 세 개의 기암봉',
    img: resolvePublicUrl('/landmarks/gangwon.jpg'),
    svg: `<svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M40 140L60 90L80 140Z" stroke="currentColor" stroke-width="2.5"/><path d="M85 140L105 60L125 140Z" stroke="currentColor" stroke-width="3"/><path d="M130 140L145 100L160 140Z" stroke="currentColor" stroke-width="2.5"/><path d="M100 80H110V90H100Z" stroke="currentColor" stroke-width="2"/><path d="M15 145C60 135 140 135 185 145" stroke="currentColor" stroke-width="3"/></svg>`,
  },
  region_chungnam: {
    name: '독립기념관 겨레의 집',
    desc: '민족의 기상이 서린 동양 최대 기와지붕',
    img: resolvePublicUrl('/landmarks/gyeonggi.jpg'),
    svg: `<svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M30 100Q100 65 170 100" stroke="currentColor" stroke-width="4"/><path d="M45 100V150M70 90V150M100 80V150M130 90V150M155 100V150" stroke="currentColor" stroke-width="2.5"/><line x1="20" y1="150" x2="180" y2="150" stroke="currentColor" stroke-width="3.5"/></svg>`,
  },
  region_jeonbuk: {
    name: '전주 한옥마을',
    desc: '고즈넉한 기와 지붕의 곡선미',
    img: resolvePublicUrl('/landmarks/jeonbuk.jpg'),
    svg: `<svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M30 105C60 85 140 85 170 105" stroke="currentColor" stroke-width="4"/><path d="M40 105L45 155M160 105L155 155" stroke="currentColor" stroke-width="3"/><path d="M70 115H130V155H70V115Z" stroke="currentColor" stroke-width="2.5"/><line x1="20" y1="155" x2="180" y2="155" stroke="currentColor" stroke-width="3"/></svg>`,
  },
  region_jeonnam: {
    name: '순천만 습지',
    desc: '황금빛 갈대밭과 굽이치는 S자 갯골',
    img: resolvePublicUrl('/landmarks/jeju.jpg'),
    svg: `<svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 160C60 160 80 120 120 120C160 120 140 70 180 60" stroke="currentColor" stroke-width="3.5"/><path d="M40 130V160M55 120V160M70 140V160M140 130V160M155 110V160M170 125V160" stroke="currentColor" stroke-width="2"/></svg>`,
  },
  region_gyeongbuk: {
    name: '경주 첨성대',
    desc: '동양에서 가장 오래된 신라 천문대',
    img: resolvePublicUrl('/landmarks/gyeongbuk.jpg'),
    svg: `<svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M75 160Q82 90 85 60H115Q118 90 125 160Z" stroke="currentColor" stroke-width="3.5" fill="none"/><rect x="80" y="48" width="40" height="12" stroke="currentColor" stroke-width="3"/><rect x="92" y="90" width="16" height="20" stroke="currentColor" stroke-width="2"/><line x1="60" y1="160" x2="140" y2="160" stroke="currentColor" stroke-width="4"/></svg>`,
  },
  region_gyeongnam: {
    name: '남해 다랭이마을',
    desc: '바다를 향해 층층이 계단식 밭',
    img: resolvePublicUrl('/landmarks/busan.jpg'),
    svg: `<svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 60C70 80 130 70 180 50" stroke="currentColor" stroke-width="3"/><path d="M20 90C80 110 140 100 180 80" stroke="currentColor" stroke-width="3"/><path d="M20 120C90 140 150 130 180 110" stroke="currentColor" stroke-width="3"/><path d="M20 150C100 170 160 160 180 140" stroke="currentColor" stroke-width="3"/></svg>`,
  },
  region_jeju: {
    name: '성산일출봉',
    desc: '푸른 바다 위 솟아오른 왕관 모양 분화구',
    img: resolvePublicUrl('/landmarks/jeju.jpg'),
    svg: `<svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M25 150L45 90L75 110L100 80L125 110L155 90L175 150Z" stroke="currentColor" stroke-width="3.5" fill="none"/><circle cx="100" cy="50" r="16" stroke="currentColor" stroke-width="3"/><path d="M15 155C70 145 130 145 185 155" stroke="currentColor" stroke-width="3"/></svg>`,
  },
  city_02: {
    name: '판교 테크노밸리',
    desc: '대한민국 첨단 IT 혁신의 중심',
    img: resolvePublicUrl('/landmarks/gyeonggi.jpg'),
    svg: `<svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="40" y="70" width="45" height="90" stroke="currentColor" stroke-width="3"/><rect x="100" y="40" width="60" height="120" stroke="currentColor" stroke-width="3"/><line x1="20" y1="160" x2="180" y2="160" stroke="currentColor" stroke-width="4"/><line x1="50" y1="90" x2="75" y2="90" stroke="currentColor" stroke-width="2"/><line x1="50" y1="110" x2="75" y2="110" stroke="currentColor" stroke-width="2"/><line x1="115" y1="65" x2="145" y2="65" stroke="currentColor" stroke-width="2"/><line x1="115" y1="90" x2="145" y2="90" stroke="currentColor" stroke-width="2"/><line x1="115" y1="115" x2="145" y2="115" stroke="currentColor" stroke-width="2"/></svg>`,
  },
}

export const WEATHER_CITIES = [
  { id: 'city_01', name: '서울', lat: 37.5665, lon: 126.978, landmarkName: REGION_LANDMARKS.region_seoul.name, landmarkDesc: REGION_LANDMARKS.region_seoul.desc, landmarkImg: REGION_LANDMARKS.region_seoul.img, landmarkSvg: REGION_LANDMARKS.region_seoul.svg },
  { id: 'city_02', name: '판교', lat: 37.3947, lon: 127.1112, landmarkName: REGION_LANDMARKS.city_02.name, landmarkDesc: REGION_LANDMARKS.city_02.desc, landmarkImg: REGION_LANDMARKS.city_02.img, landmarkSvg: REGION_LANDMARKS.city_02.svg },
  { id: 'city_03', name: '전주', lat: 35.8242, lon: 127.148, landmarkName: REGION_LANDMARKS.region_jeonbuk.name, landmarkDesc: REGION_LANDMARKS.region_jeonbuk.desc, landmarkImg: REGION_LANDMARKS.region_jeonbuk.img, landmarkSvg: REGION_LANDMARKS.region_jeonbuk.svg },
]

export const KOREA_WEATHER_REGIONS = [
  { id: 'region_seoul', name: '서울', lat: 37.5665, lon: 126.978, landmarkName: REGION_LANDMARKS.region_seoul.name, landmarkDesc: REGION_LANDMARKS.region_seoul.desc, landmarkImg: REGION_LANDMARKS.region_seoul.img, landmarkSvg: REGION_LANDMARKS.region_seoul.svg },
  { id: 'region_busan', name: '부산', lat: 35.1796, lon: 129.0756, landmarkName: REGION_LANDMARKS.region_busan.name, landmarkDesc: REGION_LANDMARKS.region_busan.desc, landmarkImg: REGION_LANDMARKS.region_busan.img, landmarkSvg: REGION_LANDMARKS.region_busan.svg },
  { id: 'region_daegu', name: '대구', lat: 35.8714, lon: 128.6014, landmarkName: REGION_LANDMARKS.region_daegu.name, landmarkDesc: REGION_LANDMARKS.region_daegu.desc, landmarkImg: REGION_LANDMARKS.region_daegu.img, landmarkSvg: REGION_LANDMARKS.region_daegu.svg },
  { id: 'region_incheon', name: '인천', lat: 37.4563, lon: 126.7052, landmarkName: REGION_LANDMARKS.region_incheon.name, landmarkDesc: REGION_LANDMARKS.region_incheon.desc, landmarkImg: REGION_LANDMARKS.region_incheon.img, landmarkSvg: REGION_LANDMARKS.region_incheon.svg },
  { id: 'region_gwangju', name: '광주', lat: 35.1595, lon: 126.8526, landmarkName: REGION_LANDMARKS.region_gwangju.name, landmarkDesc: REGION_LANDMARKS.region_gwangju.desc, landmarkImg: REGION_LANDMARKS.region_gwangju.img, landmarkSvg: REGION_LANDMARKS.region_gwangju.svg },
  { id: 'region_daejeon', name: '대전', lat: 36.3504, lon: 127.3845, landmarkName: REGION_LANDMARKS.region_daejeon.name, landmarkDesc: REGION_LANDMARKS.region_daejeon.desc, landmarkImg: REGION_LANDMARKS.region_daejeon.img, landmarkSvg: REGION_LANDMARKS.region_daejeon.svg },
  { id: 'region_ulsan', name: '울산', lat: 35.5384, lon: 129.3114, landmarkName: REGION_LANDMARKS.region_ulsan.name, landmarkDesc: REGION_LANDMARKS.region_ulsan.desc, landmarkImg: REGION_LANDMARKS.region_ulsan.img, landmarkSvg: REGION_LANDMARKS.region_ulsan.svg },
  { id: 'region_sejong', name: '세종', lat: 36.48, lon: 127.289, landmarkName: REGION_LANDMARKS.region_sejong.name, landmarkDesc: REGION_LANDMARKS.region_sejong.desc, landmarkImg: REGION_LANDMARKS.region_sejong.img, landmarkSvg: REGION_LANDMARKS.region_sejong.svg },
  { id: 'region_gyeonggi', name: '경기', lat: 37.2636, lon: 127.0286, landmarkName: REGION_LANDMARKS.region_gyeonggi.name, landmarkDesc: REGION_LANDMARKS.region_gyeonggi.desc, landmarkImg: REGION_LANDMARKS.region_gyeonggi.img, landmarkSvg: REGION_LANDMARKS.region_gyeonggi.svg },
  { id: 'region_gangwon', name: '강원', lat: 37.8813, lon: 127.7298, landmarkName: REGION_LANDMARKS.region_gangwon.name, landmarkDesc: REGION_LANDMARKS.region_gangwon.desc, landmarkImg: REGION_LANDMARKS.region_gangwon.img, landmarkSvg: REGION_LANDMARKS.region_gangwon.svg },
  { id: 'region_chungbuk', name: '충북', lat: 36.6424, lon: 127.489, landmarkName: REGION_LANDMARKS.region_chungbuk.name, landmarkDesc: REGION_LANDMARKS.region_chungbuk.desc, landmarkImg: REGION_LANDMARKS.region_chungbuk.img, landmarkSvg: REGION_LANDMARKS.region_chungbuk.svg },
  { id: 'region_chungnam', name: '충남', lat: 36.6012, lon: 126.6608, landmarkName: REGION_LANDMARKS.region_chungnam.name, landmarkDesc: REGION_LANDMARKS.region_chungnam.desc, landmarkImg: REGION_LANDMARKS.region_chungnam.img, landmarkSvg: REGION_LANDMARKS.region_chungnam.svg },
  { id: 'region_jeonbuk', name: '전북', lat: 35.8242, lon: 127.148, landmarkName: REGION_LANDMARKS.region_jeonbuk.name, landmarkDesc: REGION_LANDMARKS.region_jeonbuk.desc, landmarkImg: REGION_LANDMARKS.region_jeonbuk.img, landmarkSvg: REGION_LANDMARKS.region_jeonbuk.svg },
  { id: 'region_jeonnam', name: '전남', lat: 34.9904, lon: 126.4817, landmarkName: REGION_LANDMARKS.region_jeonnam.name, landmarkDesc: REGION_LANDMARKS.region_jeonnam.desc, landmarkImg: REGION_LANDMARKS.region_jeonnam.img, landmarkSvg: REGION_LANDMARKS.region_jeonnam.svg },
  { id: 'region_gyeongbuk', name: '경북', lat: 36.5684, lon: 128.7294, landmarkName: REGION_LANDMARKS.region_gyeongbuk.name, landmarkDesc: REGION_LANDMARKS.region_gyeongbuk.desc, landmarkImg: REGION_LANDMARKS.region_gyeongbuk.img, landmarkSvg: REGION_LANDMARKS.region_gyeongbuk.svg },
  { id: 'region_gyeongnam', name: '경남', lat: 35.2279, lon: 128.6811, landmarkName: REGION_LANDMARKS.region_gyeongnam.name, landmarkDesc: REGION_LANDMARKS.region_gyeongnam.desc, landmarkImg: REGION_LANDMARKS.region_gyeongnam.img, landmarkSvg: REGION_LANDMARKS.region_gyeongnam.svg },
  { id: 'region_jeju', name: '제주', lat: 33.4996, lon: 126.5312, landmarkName: REGION_LANDMARKS.region_jeju.name, landmarkDesc: REGION_LANDMARKS.region_jeju.desc, landmarkImg: REGION_LANDMARKS.region_jeju.img, landmarkSvg: REGION_LANDMARKS.region_jeju.svg },
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
  landmarkName: city.landmarkName,
  landmarkDesc: city.landmarkDesc,
  landmarkImg: city.landmarkImg,
  landmarkSvg: city.landmarkSvg,
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
