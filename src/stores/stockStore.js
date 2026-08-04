import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  STOCK_CHART_PERIODS,
  STOCK_MARKETS,
  composeStockDetail,
  fetchMarketStatus,
  fetchStockChart,
  fetchStockFinancials,
  fetchStockMetrics,
  fetchStockNews,
  fetchStockProfile,
  fetchStockQuote,
} from '../services/stockApi'

const preferenceStorageKey = 'skala-stock-preferences'
const legacyFavoriteKey = 'skala-stock-favorites'
const apiCacheStorageKey = 'skala-stock-api-cache-v1'
const defaultFavoriteSymbols = ['NVDA', 'AAPL', 'MSFT']
const defaultSelectedSymbol = 'AAPL'
const defaultSelectedPeriod = '1M'
const validSymbols = new Set(STOCK_MARKETS.map(({ symbol }) => symbol))
const validPeriods = new Set(STOCK_CHART_PERIODS.map(({ id }) => id))
const inFlightRequests = new Map()

export const STOCK_CACHE_TTL = Object.freeze({
  quote: 60_000,
  marketStatus: 60_000,
  profile: 24 * 60 * 60_000,
  metrics: 30 * 60_000,
  news: 15 * 60_000,
  financials: 24 * 60 * 60_000,
  analysis: 6 * 60 * 60_000,
  chart: {
    '1D': 2 * 60_000,
    '1W': 5 * 60_000,
    '1M': 15 * 60_000,
    '3M': 30 * 60_000,
    '6M': 60 * 60_000,
    '1Y': 6 * 60 * 60_000,
    '5Y': 6 * 60 * 60_000,
    ALL: 6 * 60 * 60_000,
  },
})

const filterSymbols = (symbols, limit) => Array.isArray(symbols)
  ? [...new Set(symbols.filter((symbol) => validSymbols.has(symbol)))].slice(0, limit)
  : []

const readStorageObject = (storage, key) => {
  if (!storage) return {}
  try {
    const saved = JSON.parse(storage.getItem(key))
    return saved && typeof saved === 'object' ? saved : {}
  } catch {
    return {}
  }
}

const readPreferences = () => {
  if (typeof window === 'undefined') return {}
  let saved = {}
  try {
    saved = readStorageObject(localStorage, preferenceStorageKey)
  } catch {
    return {}
  }
  if (Object.keys(saved).length) return saved

  try {
    const legacyFavorites = JSON.parse(localStorage.getItem(legacyFavoriteKey))
    if (Array.isArray(legacyFavorites)) return { favoriteSymbols: legacyFavorites }
  } catch {
    // 이전 저장값을 읽을 수 없으면 기본값을 사용합니다.
  }
  return {}
}

const readApiCache = () => {
  if (typeof window === 'undefined') return {}
  try {
    return readStorageObject(localStorage, apiCacheStorageKey)
  } catch {
    return {}
  }
}

const newestEntries = (entries, limit) => Object.fromEntries(Object.entries(entries)
  .sort(([, a], [, b]) => (b?.cachedAt ?? 0) - (a?.cachedAt ?? 0))
  .slice(0, limit))

const rawCache = (entries) => Object.fromEntries(Object.entries(entries)
  .filter(([, entry]) => entry?.data)
  .map(([key, entry]) => [key, entry.data]))

export const useStockStore = defineStore('stock', () => {
  const saved = readPreferences()
  const savedApiCache = readApiCache()
  const savedFavorites = filterSymbols(saved.favoriteSymbols, 6)
  const favoriteSymbols = ref(saved.favoriteSymbols === undefined ? defaultFavoriteSymbols : savedFavorites)
  const recentSymbols = ref(filterSymbols(saved.recentSymbols, 5))
  const selectedSymbol = ref(validSymbols.has(saved.selectedSymbol) ? saved.selectedSymbol : defaultSelectedSymbol)
  const selectedPeriod = ref(validPeriods.has(saved.selectedPeriod) ? saved.selectedPeriod : defaultSelectedPeriod)

  const quoteEntries = ref(savedApiCache.quoteEntries ?? {})
  const profileEntries = ref(savedApiCache.profileEntries ?? {})
  const metricEntries = ref(savedApiCache.metricEntries ?? {})
  const newsEntries = ref(savedApiCache.newsEntries ?? {})
  const chartEntries = ref(savedApiCache.chartEntries ?? {})
  const financialEntries = ref(savedApiCache.financialEntries ?? {})
  const analysisEntries = ref(savedApiCache.analysisEntries ?? {})
  const marketStatusEntry = ref(savedApiCache.marketStatusEntry ?? null)

  const quoteCache = computed(() => rawCache(quoteEntries.value))
  const profileCache = computed(() => rawCache(profileEntries.value))
  const favoriteCount = computed(() => favoriteSymbols.value.length)
  const isFavorite = (symbol) => favoriteSymbols.value.includes(symbol)

  const persistPreferences = () => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(preferenceStorageKey, JSON.stringify({
        favoriteSymbols: favoriteSymbols.value,
        recentSymbols: recentSymbols.value,
        selectedSymbol: selectedSymbol.value,
        selectedPeriod: selectedPeriod.value,
      }))
      localStorage.removeItem(legacyFavoriteKey)
    } catch {
      // 저장 공간을 사용할 수 없어도 현재 세션의 Pinia 상태는 유지합니다.
    }
  }

  const persistApiCache = () => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(apiCacheStorageKey, JSON.stringify({
        quoteEntries: newestEntries(quoteEntries.value, 30),
        profileEntries: newestEntries(profileEntries.value, 30),
        metricEntries: newestEntries(metricEntries.value, 12),
        newsEntries: newestEntries(newsEntries.value, 10),
        chartEntries: newestEntries(chartEntries.value, 12),
        financialEntries: newestEntries(financialEntries.value, 8),
        analysisEntries: newestEntries(analysisEntries.value, 10),
        marketStatusEntry: marketStatusEntry.value,
      }))
    } catch {
      try {
        localStorage.removeItem(apiCacheStorageKey)
      } catch {
        // 저장 한도를 넘으면 메모리 캐시만 유지합니다.
      }
    }
  }

  const setEntry = (entries, key, data) => {
    entries.value = { ...entries.value, [key]: { data, cachedAt: Date.now() } }
    persistApiCache()
    return data
  }

  const resolveCached = async ({ entries, key, requestKey, ttl, loader, force = false }) => {
    const entry = entries.value[key]
    if (!force && entry && (Date.now() - entry.cachedAt < ttl || entry.retryAt > Date.now())) return entry.data
    if (inFlightRequests.has(requestKey)) return inFlightRequests.get(requestKey)

    const request = loader()
      .then((data) => setEntry(entries, key, data))
      .catch((error) => {
        if (entry?.data) {
          entries.value = {
            ...entries.value,
            [key]: { ...entry, retryAt: Date.now() + 30_000 },
          }
          persistApiCache()
          return entry.data
        }
        throw error
      })
      .finally(() => inFlightRequests.delete(requestKey))
    inFlightRequests.set(requestKey, request)
    return request
  }

  const toggleFavorite = (symbol) => {
    if (!validSymbols.has(symbol)) return 'invalid'
    if (isFavorite(symbol)) {
      favoriteSymbols.value = favoriteSymbols.value.filter((item) => item !== symbol)
      persistPreferences()
      return 'removed'
    }
    if (favoriteSymbols.value.length >= 6) return 'limit'
    favoriteSymbols.value = [...favoriteSymbols.value, symbol]
    persistPreferences()
    return 'added'
  }

  const removeFavorite = (symbol) => {
    if (!isFavorite(symbol)) return
    favoriteSymbols.value = favoriteSymbols.value.filter((item) => item !== symbol)
    persistPreferences()
  }

  const selectStock = (symbol) => {
    if (!validSymbols.has(symbol)) return
    selectedSymbol.value = symbol
    recentSymbols.value = [symbol, ...recentSymbols.value.filter((item) => item !== symbol)].slice(0, 5)
    persistPreferences()
  }

  const selectPeriod = (period) => {
    if (!validPeriods.has(period)) return
    selectedPeriod.value = period
    persistPreferences()
  }

  const cacheQuote = (quote) => quote?.symbol && setEntry(quoteEntries, quote.symbol, quote)
  const cacheQuotes = (quotes) => quotes.forEach(cacheQuote)

  const getQuote = (market, force = false) => resolveCached({
    entries: quoteEntries,
    key: market.symbol,
    requestKey: `quote:${market.symbol}`,
    ttl: STOCK_CACHE_TTL.quote,
    loader: () => fetchStockQuote(market),
    force,
  })

  const getProfile = (market, force = false) => resolveCached({
    entries: profileEntries,
    key: market.symbol,
    requestKey: `profile:${market.symbol}`,
    ttl: STOCK_CACHE_TTL.profile,
    loader: () => fetchStockProfile(market),
    force,
  })

  const getMetrics = (market, force = false) => resolveCached({
    entries: metricEntries,
    key: market.symbol,
    requestKey: `metrics:${market.symbol}`,
    ttl: STOCK_CACHE_TTL.metrics,
    loader: () => fetchStockMetrics(market),
    force,
  })

  const getNews = (market, force = false) => resolveCached({
    entries: newsEntries,
    key: market.symbol,
    requestKey: `news:${market.symbol}`,
    ttl: STOCK_CACHE_TTL.news,
    loader: () => fetchStockNews(market),
    force,
  })

  const getMarketStatus = async (force = false) => {
    const entry = marketStatusEntry.value
    if (!force && entry && (
      Date.now() - entry.cachedAt < STOCK_CACHE_TTL.marketStatus || entry.retryAt > Date.now()
    )) return entry.data
    const requestKey = 'market-status:US'
    if (inFlightRequests.has(requestKey)) return inFlightRequests.get(requestKey)
    const request = fetchMarketStatus()
      .then((data) => {
        marketStatusEntry.value = { data, cachedAt: Date.now() }
        persistApiCache()
        return data
      })
      .catch((error) => {
        if (entry?.data) {
          marketStatusEntry.value = { ...entry, retryAt: Date.now() + 30_000 }
          persistApiCache()
          return entry.data
        }
        throw error
      })
      .finally(() => inFlightRequests.delete(requestKey))
    inFlightRequests.set(requestKey, request)
    return request
  }

  const getDetail = async (market, force = false) => {
    const [quote, profile, metrics, news] = await Promise.all([
      getQuote(market, force),
      getProfile(market, force),
      getMetrics(market, force),
      getNews(market, force),
    ])
    return composeStockDetail(market, quote, profile, metrics, news)
  }

  const getChart = (market, periodId, force = false) => {
    const key = `${market.symbol}:${periodId}`
    return resolveCached({
      entries: chartEntries,
      key,
      requestKey: `chart:${key}`,
      ttl: STOCK_CACHE_TTL.chart[periodId] ?? STOCK_CACHE_TTL.chart['1M'],
      loader: () => fetchStockChart(market, periodId),
      force,
    })
  }

  const getFinancials = (market, force = false) => resolveCached({
    entries: financialEntries,
    key: market.symbol,
    requestKey: `financials:${market.symbol}`,
    ttl: STOCK_CACHE_TTL.financials,
    loader: () => fetchStockFinancials(market),
    force,
  })

  const getCachedAnalysis = (symbol) => {
    const entry = analysisEntries.value[symbol]
    if (!entry?.data || Date.now() - entry.cachedAt >= STOCK_CACHE_TTL.analysis) return null
    return entry.data
  }

  const cacheAnalysis = (symbol, analysis) => {
    if (!validSymbols.has(symbol) || !analysis) return null
    return setEntry(analysisEntries, symbol, analysis)
  }

  return {
    favoriteSymbols,
    recentSymbols,
    selectedSymbol,
    selectedPeriod,
    quoteCache,
    profileCache,
    favoriteCount,
    isFavorite,
    toggleFavorite,
    removeFavorite,
    selectStock,
    selectPeriod,
    cacheQuote,
    cacheQuotes,
    getQuote,
    getProfile,
    getMarketStatus,
    getDetail,
    getChart,
    getFinancials,
    getCachedAnalysis,
    cacheAnalysis,
  }
})
