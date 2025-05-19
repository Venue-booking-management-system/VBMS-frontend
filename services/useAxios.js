import axios from 'axios'
import { useAuthStore } from '~/stores/auth'

export const useAxios = () => {
  const config = useRuntimeConfig()
  const authStore = useAuthStore()

  const axiosInstance = axios.create({
    baseURL: config.public.baseURL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  axiosInstance.interceptors.request.use(
    (config) => {
      const token = authStore.token
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        authStore.logout()
        navigateTo('/login')
      }

      const errorMessage = error.response?.data || 'An error occurred'
      console.log(errorMessage)

      return Promise.reject(error)
    }
  )

  return axiosInstance
}