import axios from 'axios'

const geminiApi = axios.create({
  baseURL: 'https://generativelanguage.googleapis.com/v1beta',
  timeout: 60000,
})

const strategySchema = {
  type: 'OBJECT',
  required: ['summary', 'signal', 'confidence', 'strategies', 'keyRisks', 'disclaimer'],
  properties: {
    summary: { type: 'STRING' },
    signal: { type: 'STRING', enum: ['긍정', '중립', '주의'] },
    confidence: { type: 'INTEGER', minimum: 0, maximum: 100 },
    strategies: {
      type: 'ARRAY',
      minItems: 3,
      maxItems: 3,
      items: {
        type: 'OBJECT',
        required: ['horizon', 'timeframe', 'stance', 'thesis', 'entryPlan', 'riskManagement', 'checkpoints'],
        properties: {
          horizon: { type: 'STRING', enum: ['단기', '중기', '장기'] },
          timeframe: { type: 'STRING' },
          stance: { type: 'STRING', enum: ['관찰', '분할 접근', '보수적 접근'] },
          thesis: { type: 'STRING' },
          entryPlan: { type: 'STRING' },
          riskManagement: { type: 'STRING' },
          checkpoints: { type: 'ARRAY', minItems: 2, maxItems: 4, items: { type: 'STRING' } },
        },
      },
    },
    keyRisks: { type: 'ARRAY', minItems: 3, maxItems: 5, items: { type: 'STRING' } },
    disclaimer: { type: 'STRING' },
  },
}

const finiteOrNull = (value) => Number.isFinite(value) ? value : null
const round = (value, digits = 2) => Number.isFinite(value) ? Number(value.toFixed(digits)) : null

const parseStructuredResponse = (text) => {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  const start = trimmed.indexOf('{')
  const end = trimmed.lastIndexOf('}')
  if (start === -1 || end <= start) throw new SyntaxError('JSON object not found')
  return JSON.parse(trimmed.slice(start, end + 1))
}

const summarizePriceSeries = (chart) => {
  const values = chart?.values ?? []
  if (values.length < 2) return null
  const closes = values.map(({ close }) => close).filter(Number.isFinite)
  const first = closes[0]
  const last = closes.at(-1)
  const recent20 = closes.slice(-20)
  const average = (items) => items.reduce((sum, value) => sum + value, 0) / items.length
  const returns = closes.slice(1).map((close, index) => (close - closes[index]) / closes[index]).filter(Number.isFinite)
  const averageReturn = returns.length ? average(returns) : 0
  const variance = returns.length
    ? returns.reduce((sum, value) => sum + ((value - averageReturn) ** 2), 0) / returns.length
    : 0

  return {
    period: chart.period?.label ?? '6개월',
    firstClose: round(first),
    lastClose: round(last),
    returnPercent: round(((last - first) / first) * 100),
    high: round(Math.max(...values.map(({ high, close }) => finiteOrNull(high) ?? close))),
    low: round(Math.min(...values.map(({ low, close }) => finiteOrNull(low) ?? close))),
    average20: round(average(recent20)),
    annualizedVolatilityPercent: round(Math.sqrt(variance) * Math.sqrt(252) * 100),
    observations: values.length,
  }
}

const normalizeFinancialRows = (rows) => rows.map((row) => ({
  period: row.quarter ? `${row.year} Q${row.quarter}` : `${row.year}`,
  revenue: finiteOrNull(row.revenue),
  operatingIncome: finiteOrNull(row.operatingIncome),
  netIncome: finiteOrNull(row.netIncome),
  eps: finiteOrNull(row.eps),
  assets: finiteOrNull(row.assets),
  revenueQoQ: round(row.revenueChange),
  revenueYoY: round(row.revenueYoY),
  netIncomeYoY: round(row.netIncomeYoY),
}))

const buildAnalysisDataset = ({ detail, financials, chart }) => ({
  generatedAt: new Date().toISOString(),
  company: {
    name: detail.name,
    symbol: detail.symbol,
    exchange: detail.exchange,
    industry: detail.industry,
  },
  quote: {
    currentPrice: finiteOrNull(detail.currentPrice),
    dailyChangePercent: finiteOrNull(detail.changePercent),
    week52High: finiteOrNull(detail.week52High),
    week52Low: finiteOrNull(detail.week52Low),
  },
  valuation: {
    marketCap: finiteOrNull(detail.marketCap),
    per: finiteOrNull(detail.per),
    pbr: finiteOrNull(detail.pbr),
    epsTtm: finiteOrNull(detail.eps),
    dividendYield: finiteOrNull(detail.dividendYield),
  },
  priceTrend: summarizePriceSeries(chart),
  quarterlyFinancials: normalizeFinancialRows(financials?.quarterly ?? []),
  annualFinancials: normalizeFinancialRows(financials?.annual ?? []),
})

export async function analyzeStockStrategy(input) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey) throw new Error('Gemini API 키가 설정되지 않았습니다.')

  const dataset = buildAnalysisDataset(input)
  const prompt = [
    'The JSON below contains normalized, reported market and financial data for a U.S.-listed company.',
    'Write the entire response in natural Korean while following the provided JSON response schema.',
    'Base every conclusion only on the supplied numeric data and produce short-, medium-, and long-term observation strategies.',
    'Do not guarantee returns, issue definitive buy or sell orders, or invent price targets.',
    'Explicitly identify insufficient data, and do not speculate about company news or macroeconomic events.',
    'quarterlyFinancials and annualFinancials are reported historical results, not forecasts. Never describe them as projected, estimated, or expected results.',
    'Do not invent facts after generatedAt, industry averages, analyst consensus, or future financial performance.',
    'Prioritize price momentum and volatility for the short term, quarterly growth for the medium term, and annual growth plus valuation for the long term.',
    'All narrative fields, strategy explanations, risks, checkpoints, and the disclaimer must be written in Korean.',
    'Keep the summary to two sentences. Keep each thesis, entryPlan, and riskManagement field to no more than two concise sentences. Keep every checkpoint and risk to one concise sentence.',
    `DATA=${JSON.stringify(dataset)}`,
  ].join('\n')

  const requestBody = {
    system_instruction: {
      parts: [{ text: 'You are a data-driven stock research assistant. Provide verifiable observation criteria and risk-management scenarios, not personalized financial advice. Read instructions in English and return all user-facing analysis in Korean.' }],
    },
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: strategySchema,
      maxOutputTokens: 8192,
    },
  }

  try {
    let data
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        data = (await geminiApi.post('/models/gemini-2.5-flash:generateContent', requestBody, {
          headers: { 'x-goog-api-key': apiKey },
        })).data
        break
      } catch (error) {
        if (error.response?.status !== 503 || attempt === 1) throw error
        await new Promise((resolve) => setTimeout(resolve, 1200))
      }
    }

    const text = data.candidates?.[0]?.content?.parts?.map(({ text: part }) => part ?? '').join('')
    if (!text) throw new Error('Gemini가 분석 결과를 반환하지 않았습니다.')
    return { ...parseStructuredResponse(text), model: 'Gemini 2.5 Flash', analyzedAt: new Date().toISOString() }
  } catch (error) {
    if (error.response?.status === 400) throw new Error('Gemini 요청 형식을 처리하지 못했습니다.')
    if (error.response?.status === 403) throw new Error('Gemini API 키 또는 허용된 웹사이트 설정을 확인해 주세요.')
    if (error.response?.status === 429) throw new Error('Gemini 호출 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.')
    if (error.response?.status === 503) throw new Error('Gemini 분석 서버가 혼잡합니다. 잠시 후 다시 시도해 주세요.')
    if (error.code === 'ECONNABORTED') throw new Error('Gemini 분석 시간이 초과되었습니다. 다시 시도해 주세요.')
    if (error instanceof SyntaxError) throw new Error('Gemini 분석 결과를 해석하지 못했습니다.')
    throw error
  }
}
