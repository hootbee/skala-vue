import axios from 'axios'

const weatherApi = axios.create({
  baseURL: 'https://api.openweathermap.org/data/2.5',
  timeout: 10000,
})

export const fetchCurrentWeather = (city) =>
  weatherApi.get('/weather', {
    params: {
      q: city,
      appid: import.meta.env.VITE_OPENWEATHER_API_KEY,
      units: 'metric',
      lang: 'kr',
    },
  })
