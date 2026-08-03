import axios from 'axios'

const stockApi = axios.create({
  baseURL: 'https://finnhub.io/api/v1',
  timeout: 10000,
})

export const STOCK_MARKETS = [
  { id: 'kospi', name: '코스피', symbol: '^KS11', currency: '포인트' },
  { id: 'nasdaq', name: '나스닥', symbol: '^IXIC', currency: '포인트' },
  { id: 'sp500', name: 'S&P 500', symbol: '^GSPC', currency: '포인트' },
  { id: 'samsung', name: '삼성전자', symbol: '005930.KS', currency: '원' },
  { id: 'sk-hynix', name: 'SK하이닉스', symbol: '000660.KS', currency: '원' },
]

const demoPrices = [
  [2650, 2678, 2664, 2691, 2710, 2698, 2732, 2750, 2741, 2768, 2784, 2772],
  [16840, 16920, 16810, 17030, 17120, 17070, 17240, 17310, 17260, 17420, 17510, 17620],
  [5480, 5510, 5490, 5540, 5575, 5550, 5605, 5620, 5590, 5650, 5680, 5705],
  [73500, 74200, 73800, 75100, 74600, 75800, 76500, 76100, 77400, 78200, 77800, 79100],
  [182000, 185500, 183800, 188000, 191500, 189000, 194000, 198500, 196000, 201000, 205500, 209000],
]

export const demoSeries = (index) => demoPrices[index].map((value, i) => ({
  timestamp: Date.now() - (demoPrices[index].length - i) * 86400000,
  value,
}))

export async function fetchStockSeries(market) {
  const token = import.meta.env.VITE_FINNHUB_API_KEY
  if (!token) return { series: demoSeries(STOCK_MARKETS.findIndex(({ id }) => id === market.id)), source: 'demo' }

  const to = Math.floor(Date.now() / 1000)
  const from = to - 60 * 60 * 24 * 30
  const { data } = await stockApi.get('/stock/candle', {
    params: { symbol: market.symbol, resolution: 'D', from, to, token },
  })
  if (data.s !== 'ok' || !data.c?.length) throw new Error(`${market.name} 데이터를 불러오지 못했습니다.`)
  return { source: 'api', series: data.c.map((value, i) => ({ timestamp: data.t[i] * 1000, value })) }
}
