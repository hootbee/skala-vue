import axios from 'axios'

const stockApi = axios.create({
  baseURL: 'https://finnhub.io/api/v1',
  timeout: 10000,
})

export const STOCK_MARKETS = [
  { id: 'nvidia', rank: 1, name: '엔비디아', symbol: 'NVDA', currency: 'USD' },
  { id: 'alphabet', rank: 2, name: '알파벳', symbol: 'GOOGL', currency: 'USD' },
  { id: 'apple', rank: 3, name: '애플', symbol: 'AAPL', currency: 'USD' },
  { id: 'microsoft', rank: 4, name: '마이크로소프트', symbol: 'MSFT', currency: 'USD' },
  { id: 'amazon', rank: 5, name: '아마존', symbol: 'AMZN', currency: 'USD' },
  { id: 'broadcom', rank: 6, name: '브로드컴', symbol: 'AVGO', currency: 'USD' },
  { id: 'meta', rank: 7, name: '메타', symbol: 'META', currency: 'USD' },
  { id: 'tesla', rank: 8, name: '테슬라', symbol: 'TSLA', currency: 'USD' },
  { id: 'walmart', rank: 9, name: '월마트', symbol: 'WMT', currency: 'USD' },
  { id: 'berkshire', rank: 10, name: '버크셔 해서웨이', symbol: 'BRK.B', currency: 'USD' },
]

const demoPrices = [
  [178, 181, 180, 184, 187, 185, 189, 191, 188, 192, 194, 193],
  [315, 319, 318, 323, 327, 325, 330, 333, 331, 335, 337, 339],
  [325, 329, 327, 332, 335, 334, 338, 340, 337, 341, 342, 343],
  [420, 416, 412, 414, 409, 405, 407, 403, 401, 404, 400, 398],
  [218, 221, 220, 224, 226, 225, 228, 230, 229, 232, 230, 231],
  [350, 354, 352, 359, 363, 361, 368, 371, 369, 374, 376, 377],
  [570, 575, 573, 580, 584, 581, 587, 590, 588, 592, 593, 594],
  [320, 316, 313, 309, 312, 306, 304, 308, 305, 303, 301, 302],
  [108, 109, 109, 110, 111, 110, 112, 113, 112, 114, 113, 114],
  [495, 498, 497, 501, 503, 502, 506, 508, 507, 509, 510, 510],
]

export const demoSeries = (index) => demoPrices[index].map((value, i) => ({
  timestamp: Date.now() - (demoPrices[index].length - i) * 86400000,
  value,
}))

export async function fetchStockSeries(market) {
  const token = import.meta.env.VITE_FINNHUB_API_KEY
  const fallback = () => ({ series: demoSeries(STOCK_MARKETS.findIndex(({ id }) => id === market.id)), source: 'demo' })
  if (!token) return fallback()

  try {
    // Historical candles require Finnhub Premium. Quote is available on the
    // free plan, so use it to refresh the latest point on the demo sparkline.
    const { data } = await stockApi.get('/quote', { params: { symbol: market.symbol, token } })
    if (!Number.isFinite(data.c) || data.c <= 0) return fallback()
    const series = fallback().series
    series[series.length - 1] = { timestamp: Date.now(), value: data.c }
    return { source: 'api', series, change: data.d, percentChange: data.dp }
  } catch {
    // API 키, 플랜, CORS 또는 일시적인 네트워크 오류가 있어도 대시보드는 유지한다.
    return fallback()
  }
}
