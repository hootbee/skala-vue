import axios from 'axios'

const newsApi = axios.create({
  baseURL: 'https://gnews.io/api/v4',
  timeout: 10000,
})

const demoArticles = [
  {
    id: 'demo-weather',
    source: '날씨',
    title: '이번 주 맑고 더운 날씨 이어져…낮 최고 30도',
    description: '큰 일교차에 유의하고 외출 시 자외선 차단제를 준비하세요.',
    publishedAt: new Date(Date.now() - 28 * 60 * 1000).toISOString(),
    url: '',
  },
  {
    id: 'demo-economy',
    source: '경제',
    title: '미국 증시 주요 기술주 중심으로 혼조세',
    description: '시장 참가자들이 기업 실적과 경제 지표를 살피며 종목별 흐름이 엇갈리고 있습니다.',
    publishedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    url: '',
  },
  {
    id: 'demo-life',
    source: '생활',
    title: '여름철 전력 수요 증가, 생활 속 절전 방법은',
    description: '실내 적정 온도 유지와 대기전력 차단으로 에너지를 아낄 수 있습니다.',
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    url: '',
  },
]

const normalizeArticle = (article) => ({
  id: article.id || article.url,
  source: article.source?.name || 'News',
  title: article.title,
  description: article.description || '기사에서 자세한 내용을 확인하세요.',
  publishedAt: article.publishedAt,
  url: article.url,
})

const requestHeadlines = (apiKey, language, country) => newsApi.get('/top-headlines', {
  params: {
    category: 'general',
    lang: language,
    country,
    max: 3,
    apikey: apiKey,
  },
})

export async function fetchTopHeadlines() {
  const apiKey = import.meta.env.VITE_GNEWS_API_KEY
  if (!apiKey) return { articles: demoArticles, source: 'demo' }

  try {
    let response = await requestHeadlines(apiKey, 'ko', 'kr')
    if (!response.data.articles?.length) response = await requestHeadlines(apiKey, 'en', 'us')
    const articles = response.data.articles?.slice(0, 3).map(normalizeArticle) ?? []
    return articles.length ? { articles, source: 'api' } : { articles: demoArticles, source: 'demo' }
  } catch {
    return { articles: demoArticles, source: 'demo' }
  }
}
