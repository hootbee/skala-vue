import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

const initialUsers = [
  { id: 1, name: '실습 사용자', email: 'demo@skala.dev', password: 'demo1234', createdAt: '2026-08-01T09:00:00.000Z' },
]

let users = []
let sessions = new Map()
let nextUserId = 1

function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  return { salt, passwordHash: scryptSync(password, salt, 64).toString('hex') }
}

function toPublicUser(user) {
  if (!user) return undefined
  const { passwordHash: _passwordHash, salt: _salt, ...publicUser } = user
  return publicUser
}

export function resetAuth() {
  users = initialUsers.map(({ password, ...user }) => ({ ...user, ...hashPassword(password) }))
  sessions = new Map()
  nextUserId = Math.max(...users.map((user) => user.id)) + 1
}

export const getUserCount = () => users.length
export const getSessionCount = () => sessions.size
export const findUserByEmail = (email) => users.find((user) => user.email === email.trim().toLowerCase())

export function createUser({ name, email, password }) {
  const user = {
    id: nextUserId++,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    ...hashPassword(password),
    createdAt: new Date().toISOString(),
  }
  users.push(user)
  return toPublicUser(user)
}

export function authenticateUser(email, password) {
  const user = findUserByEmail(email)
  if (!user) return undefined
  const candidateHash = scryptSync(password, user.salt, 64)
  const storedHash = Buffer.from(user.passwordHash, 'hex')
  return timingSafeEqual(candidateHash, storedHash) ? toPublicUser(user) : undefined
}

export function createSession(userId) {
  const token = randomBytes(32).toString('hex')
  sessions.set(token, userId)
  return token
}

export function findUserByToken(token) {
  const userId = sessions.get(token)
  return toPublicUser(users.find((user) => user.id === userId))
}

export function deleteSession(token) {
  return sessions.delete(token)
}

resetAuth()
