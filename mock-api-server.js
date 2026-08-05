import http from 'node:http'

import { getSessionCount, getUserCount, resetAuth } from './mock-api/data/authStore.js'
import { getPostCount, resetPosts } from './mock-api/data/postStore.js'
import { getProductCount, resetProducts } from './mock-api/data/productStore.js'
import { handleAuthRoutes } from './mock-api/routes/authRoutes.js'
import { handlePostRoutes } from './mock-api/routes/postRoutes.js'
import { handleProductRoutes } from './mock-api/routes/productRoutes.js'
import { sendError, sendJson, waitForRequestedDelay } from './mock-api/utils/httpUtils.js'

const port = Number(process.env.API_PORT ?? 3001)

const server = http.createServer(async (request, response) => {
  if (request.method === 'OPTIONS') return sendJson(response, 204)

  const host = request.headers.host ?? `localhost:${port}`
  const url = new URL(request.url ?? '/', `http://${host}`)

  try {
    await waitForRequestedDelay(url)
    if (request.method === 'GET' && url.pathname === '/api/health') {
      return sendJson(response, 200, {
        status: 'ok',
        productCount: getProductCount(),
        postCount: getPostCount(),
        userCount: getUserCount(),
        sessionCount: getSessionCount(),
      })
    }
    if (request.method === 'POST' && url.pathname === '/api/reset') {
      const products = resetProducts()
      const posts = resetPosts()
      resetAuth()
      return sendJson(response, 200, {
        message: 'Mock 데이터와 인증 세션이 초기화되었습니다.',
        productCount: products.length,
        postCount: posts.length,
        userCount: getUserCount(),
        sessionCount: getSessionCount(),
      })
    }
    if (await handleAuthRoutes(request, response, url)) return
    if (await handleProductRoutes(request, response, url)) return
    if (await handlePostRoutes(request, response, url)) return
    sendJson(response, 404, { message: '존재하지 않는 API 경로입니다.' })
  } catch (error) {
    sendError(response, error)
  }
})

server.listen(port, () => {
  console.log(`Mock API: http://localhost:${port}/api`)
})
