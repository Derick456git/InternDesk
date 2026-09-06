import axios from 'axios'

const API_URL = 'http://localhost:5000/api'

const instance = axios.create({ baseURL: API_URL })

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('internToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const api = {
  get: (endpoint, params) => instance.get(endpoint, { params }).then((r) => r.data),
  post: (endpoint, body) => instance.post(endpoint, body).then((r) => r.data),
  put: (endpoint, body) => instance.put(endpoint, body).then((r) => r.data),
  patch: (endpoint, body) => instance.patch(endpoint, body).then((r) => r.data),
  delete: (endpoint) => instance.delete(endpoint).then((r) => r.data),
  upload: (endpoint, formData) => instance.post(endpoint, formData).then((r) => r.data),
}

export function getErrorMessage(err, fallback) {
  return err?.response?.data?.message || err?.message || fallback
}