const initialPosts = [
  { id: 1, title: 'Vue 학습을 시작합니다', content: 'Composition API부터 차근차근 실습해 봅시다.', author: '관리자', createdAt: '2026-08-01T09:00:00.000Z', updatedAt: '2026-08-01T09:00:00.000Z' },
  { id: 2, title: 'Mock API 활용 방법', content: 'Axios로 목록 조회, 등록, 수정, 삭제 요청을 연습합니다.', author: 'Vue 강사', createdAt: '2026-08-02T10:30:00.000Z', updatedAt: '2026-08-02T10:30:00.000Z' },
  { id: 3, title: '개발 서버 실행 안내', content: 'npm run dev:all로 Vite와 Mock API 서버를 함께 실행합니다.', author: '실습 도우미', createdAt: '2026-08-03T13:20:00.000Z', updatedAt: '2026-08-03T13:20:00.000Z' },
]

let posts = []
let nextPostId = 1

export function resetPosts() {
  posts = structuredClone(initialPosts)
  nextPostId = Math.max(...posts.map((post) => post.id)) + 1
  return posts
}

export const listPosts = () => posts
export const getPostCount = () => posts.length
export const findPostById = (postId) => posts.find((post) => post.id === postId)

export function createPost(postInput) {
  const now = new Date().toISOString()
  const post = { id: nextPostId++, ...postInput, createdAt: now, updatedAt: now }
  posts.push(post)
  return post
}

export function updatePost(postId, patch) {
  const post = findPostById(postId)
  if (!post) return undefined
  Object.assign(post, patch, { updatedAt: new Date().toISOString() })
  return post
}

export function deletePost(postId) {
  const index = posts.findIndex((post) => post.id === postId)
  if (index === -1) return undefined
  return posts.splice(index, 1)[0]
}

resetPosts()
