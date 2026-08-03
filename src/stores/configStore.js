import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export const useConfigStore = defineStore('config', () => {
  const unit = ref('celsius')
  const isCelsius = computed(() => unit.value === 'celsius')

  const toggleTemperatureUnit = () => {
    unit.value = isCelsius.value ? 'fahrenheit' : 'celsius'
  }

  const formatTemperature = (celsius) => {
    const value = isCelsius.value ? celsius : (celsius * 9) / 5 + 32
    return `${Math.round(value)}°${isCelsius.value ? 'C' : 'F'}`
  }

  return { unit, isCelsius, toggleTemperatureUnit, formatTemperature }
})
