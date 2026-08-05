import { authenticateUser, createSession, createUser, deleteSession, findUserByEmail, findUserByToken } from '../data/authStore.js'
import { createHttpError, readJsonBody, sendJson } from '../utils/httpUtils.js'

function validateRegistration(input) {
  const errors = []
  if (typeof input.name !== 'string' || input.name.trim().length < 2 || input.name.trim().length > 30) errors.push('이름은 2~30자로 입력해 주세요.')
  if (typeof input.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) errors.push('올바른 이메일 주소를 입력해 주세요.')
  if (typeof input.password !== 'string' || input.password.length < 8 || input.password.length > 128) errors.push('비밀번호는 8~128자로 입력해 주세요.')
  return errors
}

function getBearerToken(request) {
  const authorization = request.headers.authorization ?? ''
  const [scheme, token] = authorization.split(' ')
  if (scheme !== 'Bearer' || !token) throw createHttpError(401, '로그인이 필요합니다.')
  return token
}

export async function handleAuthRoutes(request, response, url) {
  if (request.method === 'POST' && url.pathname === '/api/auth/register') {
    const body = await readJsonBody(request)
    const errors = validateRegistration(body)
    if (errors.length) throw createHttpError(400, errors.join(' '))
    if (findUserByEmail(body.email)) throw createHttpError(409, '이미 가입된 이메일입니다.')
    const user = createUser(body)
    sendJson(response, 201, { message: '회원가입이 완료되었습니다.', user })
    return true
  }

  if (request.method === 'POST' && url.pathname === '/api/auth/login') {
    const body = await readJsonBody(request)
    if (typeof body.email !== 'string' || typeof body.password !== 'string') throw createHttpError(400, '이메일과 비밀번호를 입력해 주세요.')
    const user = authenticateUser(body.email, body.password)
    if (!user) throw createHttpError(401, '이메일 또는 비밀번호가 올바르지 않습니다.')
    const token = createSession(user.id)
    sendJson(response, 200, { message: '로그인되었습니다.', token, user })
    return true
  }

  if (request.method === 'GET' && url.pathname === '/api/auth/me') {
    const user = findUserByToken(getBearerToken(request))
    if (!user) throw createHttpError(401, '세션이 만료되었거나 유효하지 않습니다.')
    sendJson(response, 200, { user })
    return true
  }

  if (request.method === 'POST' && url.pathname === '/api/auth/logout') {
    const token = getBearerToken(request)
    if (!findUserByToken(token)) throw createHttpError(401, '세션이 만료되었거나 유효하지 않습니다.')
    deleteSession(token)
    sendJson(response, 200, { message: '로그아웃되었습니다.' })
    return true
  }

  return false
}
