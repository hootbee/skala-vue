import axios from 'axios'

const stockApi = axios.create({
  baseURL: 'https://finnhub.io/api/v1',
  timeout: 10000,
})

const chartApi = axios.create({
  baseURL: 'https://api.twelvedata.com',
  timeout: 15000,
})

export const STOCK_MARKETS = [
  { id: 'nvidia', rank: 1, name: '엔비디아', symbol: 'NVDA' },
  { id: 'apple', rank: 2, name: '애플', symbol: 'AAPL' },
  { id: 'alphabet', rank: 3, name: '알파벳', symbol: 'GOOG' },
  { id: 'microsoft', rank: 4, name: '마이크로소프트', symbol: 'MSFT' },
  { id: 'amazon', rank: 5, name: '아마존', symbol: 'AMZN' },
  { id: 'broadcom', rank: 6, name: '브로드컴', symbol: 'AVGO' },
  { id: 'spacex', rank: 7, name: '스페이스X', symbol: 'SPCX' },
  { id: 'meta', rank: 8, name: '메타', symbol: 'META' },
  { id: 'tesla', rank: 9, name: '테슬라', symbol: 'TSLA' },
  { id: 'berkshire', rank: 10, name: '버크셔 해서웨이', symbol: 'BRK.B' },
  { id: 'eli-lilly', rank: 11, name: '일라이 릴리', symbol: 'LLY' },
  { id: 'jpmorgan', rank: 12, name: 'JP모건 체이스', symbol: 'JPM' },
  { id: 'micron', rank: 13, name: '마이크론', symbol: 'MU' },
  { id: 'walmart', rank: 14, name: '월마트', symbol: 'WMT' },
  { id: 'amd', rank: 15, name: 'AMD', symbol: 'AMD' },
  { id: 'visa', rank: 16, name: '비자', symbol: 'V' },
  { id: 'exxon-mobil', rank: 17, name: '엑슨모빌', symbol: 'XOM' },
  { id: 'johnson-johnson', rank: 18, name: '존슨앤드존슨', symbol: 'JNJ' },
  { id: 'mastercard', rank: 19, name: '마스터카드', symbol: 'MA' },
  { id: 'cisco', rank: 20, name: '시스코', symbol: 'CSCO' },
  { id: 'intel', rank: 21, name: '인텔', symbol: 'INTC' },
  { id: 'abbvie', rank: 22, name: '애브비', symbol: 'ABBV' },
  { id: 'bank-of-america', rank: 23, name: '뱅크 오브 아메리카', symbol: 'BAC' },
  { id: 'costco', rank: 24, name: '코스트코', symbol: 'COST' },
  { id: 'applied-materials', rank: 25, name: '어플라이드 머티어리얼즈', symbol: 'AMAT' },
  { id: 'chevron', rank: 26, name: '셰브론', symbol: 'CVX' },
  { id: 'coca-cola', rank: 27, name: '코카콜라', symbol: 'KO' },
  { id: 'unitedhealth', rank: 28, name: '유나이티드헬스', symbol: 'UNH' },
  { id: 'caterpillar', rank: 29, name: '캐터필러', symbol: 'CAT' },
  { id: 'oracle', rank: 30, name: '오라클', symbol: 'ORCL' },
]

export const STOCK_RANKING_UPDATED_AT = '2026-08-04'

export const STOCK_CHART_PERIODS = [
  { id: '1D', label: '1일', interval: '5min', outputsize: 78 },
  { id: '1W', label: '1주', interval: '1h', outputsize: 40 },
  { id: '1M', label: '1개월', interval: '1day', outputsize: 23 },
  { id: '3M', label: '3개월', interval: '1day', outputsize: 66 },
  { id: '6M', label: '6개월', interval: '1day', outputsize: 132 },
  { id: '1Y', label: '1년', interval: '1day', outputsize: 260 },
  { id: '5Y', label: '5년', interval: '1week', outputsize: 260 },
  { id: 'ALL', label: '전체', interval: '1month', outputsize: 5000 },
]

const getToken = () => import.meta.env.VITE_FINNHUB_API_KEY

const get = async (path, params = {}) => {
  const token = getToken()
  if (!token) throw new Error('Finnhub API 키가 설정되지 않았습니다.')
  const { data } = await stockApi.get(path, { params: { ...params, token } })
  return data
}

const finiteOrNull = (value) => Number.isFinite(value) ? value : null

const normalizeQuote = (data) => ({
  currentPrice: finiteOrNull(data.c),
  change: finiteOrNull(data.d),
  changePercent: finiteOrNull(data.dp),
  open: finiteOrNull(data.o),
  high: finiteOrNull(data.h),
  low: finiteOrNull(data.l),
  previousClose: finiteOrNull(data.pc),
  updatedAt: data.t ? new Date(data.t * 1000).toISOString() : null,
})

export async function fetchStockQuote(market) {
  const data = await get('/quote', { symbol: market.symbol })
  if (!Number.isFinite(data.c) || data.c <= 0) throw new Error(`${market.name} 시세를 확인할 수 없습니다.`)
  return { ...market, ...normalizeQuote(data) }
}

export async function fetchStockProfile(market) {
  const data = await get('/stock/profile2', { symbol: market.symbol })
  return {
    ...market,
    name: data.name || market.name,
    symbol: data.ticker || market.symbol,
    exchange: data.exchange || '미국 증권시장',
    industry: data.finnhubIndustry || '정보 없음',
    country: data.country || 'US',
    currency: data.currency || 'USD',
    logo: data.logo || '',
    website: data.weburl || '',
    marketCap: Number.isFinite(data.marketCapitalization) ? data.marketCapitalization * 1_000_000 : null,
    sharesOutstanding: Number.isFinite(data.shareOutstanding) ? data.shareOutstanding * 1_000_000 : null,
  }
}

export async function fetchMarketStatus() {
  const data = await get('/stock/market-status', { exchange: 'US' })
  let label = '장 마감'
  if (data.session === 'pre-market') label = '프리마켓'
  else if (data.session === 'post-market') label = '시간외 거래'
  else if (data.isOpen) label = '정규장 거래 중'

  return {
    isOpen: Boolean(data.isOpen),
    session: data.session,
    label,
    holiday: data.holiday,
    timezone: data.timezone,
    updatedAt: data.t ? new Date(data.t * 1000).toISOString() : null,
  }
}

const getDateString = (date) => date.toISOString().slice(0, 10)

export async function fetchStockMetrics(market) {
  const financials = await get('/stock/metric', { symbol: market.symbol, metric: 'all' })
  const metric = financials.metric ?? {}
  return {
    marketCap: Number.isFinite(metric.marketCapitalization) ? metric.marketCapitalization * 1_000_000 : null,
    per: finiteOrNull(metric.peBasicExclExtraTTM ?? metric.peTTM),
    pbr: finiteOrNull(metric.pbQuarterly ?? metric.pb),
    eps: finiteOrNull(metric.epsBasicExclExtraItemsTTM ?? metric.epsTTM),
    bps: finiteOrNull(metric.bookValuePerShareQuarterly ?? metric.bookValuePerShareAnnual),
    dividendYield: finiteOrNull(metric.currentDividendYieldTTM ?? metric.dividendYieldIndicatedAnnual),
    week52High: finiteOrNull(metric['52WeekHigh']),
    week52Low: finiteOrNull(metric['52WeekLow']),
    averageVolume: Number.isFinite(metric['3MonthAverageTradingVolume'])
      ? metric['3MonthAverageTradingVolume'] * 1_000_000
      : null,
  }
}

export async function fetchStockNews(market) {
  const today = new Date()
  const monthAgo = new Date(today)
  monthAgo.setDate(monthAgo.getDate() - 30)
  const news = await get('/company-news', {
    symbol: market.symbol,
    from: getDateString(monthAgo),
    to: getDateString(today),
  })
  return Array.isArray(news)
    ? news.slice(0, 8).map((item) => ({
        id: item.id,
        headline: item.headline,
        summary: item.summary,
        source: item.source,
        url: item.url,
        image: item.image,
        publishedAt: item.datetime ? new Date(item.datetime * 1000).toISOString() : null,
      }))
    : []
}

const financialConcepts = {
  revenue: [
    'us-gaap_RevenueFromContractWithCustomerExcludingAssessedTax',
    'us-gaap_Revenues',
    'us-gaap_SalesRevenueNet',
    'us-gaap_SalesRevenueGoodsNet',
  ],
  operatingIncome: ['us-gaap_OperatingIncomeLoss'],
  netIncome: ['us-gaap_NetIncomeLoss', 'us-gaap_ProfitLoss'],
  eps: ['us-gaap_EarningsPerShareDiluted', 'us-gaap_EarningsPerShareBasic'],
  assets: ['us-gaap_Assets'],
  liabilities: ['us-gaap_Liabilities'],
  equity: [
    'us-gaap_StockholdersEquity',
    'us-gaap_StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest',
  ],
}

const financialLabelPatterns = {
  revenue: /^(net sales|revenue|revenues|total revenues)$/i,
  operatingIncome: /^operating income/i,
  netIncome: /^net income/i,
  eps: /^diluted.*per share|diluted earnings per share/i,
  assets: /^total assets$/i,
  liabilities: /^total liabilities$/i,
  equity: /^(total )?(shareholders|stockholders).+equity$/i,
}

const findReportedValue = (sections, metric) => {
  const entries = sections.flatMap((section) => Array.isArray(section) ? section : [])
  const byConcept = financialConcepts[metric]
    .map((concept) => entries.find((entry) => entry.concept === concept))
    .find(Boolean)
  const entry = byConcept ?? entries.find(({ label = '' }) => financialLabelPatterns[metric].test(label))
  return Number.isFinite(entry?.value) ? entry.value : null
}

const normalizeFiling = (filing) => ({
  year: Number(filing.year),
  quarter: Number(filing.quarter),
  period: filing.endDate?.slice(0, 10) ?? '',
  revenue: findReportedValue([filing.report?.ic], 'revenue'),
  operatingIncome: findReportedValue([filing.report?.ic], 'operatingIncome'),
  netIncome: findReportedValue([filing.report?.ic], 'netIncome'),
  eps: findReportedValue([filing.report?.ic], 'eps'),
  assets: findReportedValue([filing.report?.bs], 'assets'),
  liabilities: findReportedValue([filing.report?.bs], 'liabilities'),
  equity: findReportedValue([filing.report?.bs], 'equity'),
})

const flowMetrics = ['revenue', 'operatingIncome', 'netIncome', 'eps']

const subtractPeriods = (current, previous) => Object.fromEntries(flowMetrics.map((metric) => [
  metric,
  Number.isFinite(current?.[metric]) && Number.isFinite(previous?.[metric])
    ? current[metric] - previous[metric]
    : current?.[metric] ?? null,
]))

const calculateGrowth = (current, previous) => {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous === 0) return null
  return ((current - previous) / Math.abs(previous)) * 100
}

const addGrowthRates = (rows, quarterly = false) => rows.map((row, index) => {
  const previous = rows[index - 1]
  const yearAgo = quarterly
    ? rows.find((candidate) => candidate.year === row.year - 1 && candidate.quarter === row.quarter)
    : previous
  return {
    ...row,
    revenueChange: calculateGrowth(row.revenue, previous?.revenue),
    revenueYoY: calculateGrowth(row.revenue, yearAgo?.revenue),
    netIncomeChange: calculateGrowth(row.netIncome, previous?.netIncome),
    netIncomeYoY: calculateGrowth(row.netIncome, yearAgo?.netIncome),
  }
})

const buildQuarterlyFinancials = (quarterlyFilings, annualFilings) => {
  const quarters = quarterlyFilings.map(normalizeFiling)
  const annualByYear = new Map(annualFilings.map((filing) => {
    const normalized = normalizeFiling(filing)
    return [normalized.year, normalized]
  }))
  const rows = []

  for (const year of [...new Set(quarters.map(({ year }) => year))]) {
    const yearQuarters = quarters.filter((row) => row.year === year)
    let previousCumulative = null
    for (const quarter of [1, 2, 3]) {
      const cumulative = yearQuarters.find((row) => row.quarter === quarter)
      if (!cumulative) continue
      rows.push({
        ...cumulative,
        ...subtractPeriods(cumulative, previousCumulative),
        quarter,
      })
      previousCumulative = cumulative
    }

    const annual = annualByYear.get(year)
    if (annual && previousCumulative?.quarter === 3) {
      rows.push({
        ...annual,
        ...subtractPeriods(annual, previousCumulative),
        quarter: 4,
      })
    }
  }

  const sorted = rows
    .filter((row) => Number.isFinite(row.revenue) || Number.isFinite(row.netIncome))
    .sort((a, b) => a.year - b.year || a.quarter - b.quarter)
  return addGrowthRates(sorted, true).slice(-8)
}

const buildAnnualFinancials = (filings) => {
  const rows = filings.map(normalizeFiling)
    .filter((row) => Number.isFinite(row.revenue) || Number.isFinite(row.netIncome))
    .sort((a, b) => a.year - b.year)
  return addGrowthRates(rows).slice(-6)
}

export async function fetchStockFinancials(market) {
  const [quarterlyResponse, annualResponse] = await Promise.all([
    get('/stock/financials-reported', { symbol: market.symbol, freq: 'quarterly' }),
    get('/stock/financials-reported', { symbol: market.symbol, freq: 'annual' }),
  ])
  const quarterlyFilings = Array.isArray(quarterlyResponse.data) ? quarterlyResponse.data : []
  const annualFilings = Array.isArray(annualResponse.data) ? annualResponse.data : []
  const quarterly = buildQuarterlyFinancials(quarterlyFilings, annualFilings)
  const annual = buildAnnualFinancials(annualFilings)

  if (!quarterly.length && !annual.length) throw new Error(`${market.name}의 재무제표를 확인할 수 없습니다.`)
  return { symbol: market.symbol, quarterly, annual, source: 'Finnhub · SEC 원문 공시' }
}

export function composeStockDetail(market, quote, profile, metrics, news) {
  return {
    ...market,
    ...quote,
    ...profile,
    ...metrics,
    marketCap: profile.marketCap ?? metrics.marketCap,
    news,
  }
}

export async function fetchStockDetail(market) {
  const [quote, profile, metrics, news] = await Promise.all([
    fetchStockQuote(market),
    fetchStockProfile(market),
    fetchStockMetrics(market),
    fetchStockNews(market),
  ])
  return composeStockDetail(market, quote, profile, metrics, news)
}

export async function fetchStockChart(market, periodId) {
  const token = import.meta.env.VITE_TWELVE_DATA_API_KEY
  if (!token) throw new Error('Twelve Data API 키가 설정되지 않았습니다.')

  const period = STOCK_CHART_PERIODS.find(({ id }) => id === periodId)
  if (!period) throw new Error('지원하지 않는 차트 기간입니다.')

  const { data } = await chartApi.get('/time_series', {
    params: {
      symbol: market.symbol,
      interval: period.interval,
      outputsize: period.outputsize,
      apikey: token,
    },
  })

  if (data.status === 'error' || !Array.isArray(data.values)) {
    const error = new Error(data.message || '차트 데이터를 불러오지 못했습니다.')
    error.apiCode = data.code
    throw error
  }

  const values = data.values.map((item) => ({
    datetime: item.datetime,
    timestamp: new Date(item.datetime.replace(' ', 'T')).getTime(),
    open: Number(item.open),
    high: Number(item.high),
    low: Number(item.low),
    close: Number(item.close),
    volume: Number(item.volume),
  })).filter((item) => Number.isFinite(item.timestamp) && Number.isFinite(item.close))
    .sort((a, b) => a.timestamp - b.timestamp)

  if (!values.length) throw new Error('선택한 기간의 차트 데이터가 없습니다.')

  return {
    period,
    currency: data.meta?.currency || 'USD',
    exchange: data.meta?.exchange || '',
    values,
  }
}

export function getStockErrorMessage(error) {
  if (error.response?.status === 403) return '현재 Finnhub 플랜에서 이 정보를 사용할 수 없습니다.'
  if (error.response?.status === 429) return 'API 호출 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.'
  if (error.code === 'ECONNABORTED') return '시세 서버 응답이 지연되고 있습니다. 다시 시도해 주세요.'
  return error.message || '주식 정보를 불러오지 못했습니다.'
}

export function getChartErrorMessage(error) {
  if (error.apiCode === 429) return 'Twelve Data 호출 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.'
  if (error.apiCode === 401) return 'Twelve Data API 키를 확인해 주세요.'
  if (error.code === 'ECONNABORTED') return '차트 서버 응답이 지연되고 있습니다. 다시 시도해 주세요.'
  return error.message || '차트 데이터를 불러오지 못했습니다.'
}
