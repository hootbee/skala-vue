import axios from 'axios'

const http = axios.create({
  baseURL: import.meta.env.VITE_MOCK_API_BASE_URL || 'http://localhost:3001/api',
  timeout: 5000,
  headers: { 'Content-Type': 'application/json', 'X-Lab-Client': 'skala-vue' },
})

http.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || (error.code === 'ECONNABORTED'
      ? 'API 응답 시간이 초과되었습니다.'
      : 'Mock API 서버에 연결할 수 없습니다. npm run dev:all로 다시 실행해 주세요.')
    return Promise.reject(new Error(message))
  },
)

const resourceApi = (resource) => ({
  async getAll(params = {}) { return (await http.get(`/${resource}`, { params })).data },
  async create(payload) { return (await http.post(`/${resource}`, payload)).data },
  async update(id, payload) { return (await http.patch(`/${resource}/${id}`, payload)).data },
  async remove(id) { return (await http.delete(`/${resource}/${id}`)).data },
})

export const productApi = resourceApi('products')
export const postApi = resourceApi('posts')

export const systemApi = {
  async getHealth() { return (await http.get('/health')).data },
  async reset() { return (await http.post('/reset')).data },
}
