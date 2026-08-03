import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export const useConfigStore = defineStore('config', () => {
  const temperatureUnit = ref('C')
  const isCelsius = computed(() => temperatureUnit.value === 'C')

  const toggleTemperatureUnit = () => {
    temperatureUnit.value = isCelsius.value ? 'F' : 'C'
  }

  const formatTemperature = (celsius) => {
    const value = isCelsius.value ? celsius : (celsius * 9) / 5 + 32
    return `${Math.round(value)}°${temperatureUnit.value}`
  }

  return { temperatureUnit, isCelsius, toggleTemperatureUnit, formatTemperature }
})
