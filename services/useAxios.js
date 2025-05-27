import axios from 'axios'
import { useAuthStore } from '~/stores/auth'

let isHandling401 = false

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
        async (error) => {
            // Handle 401 errors (unauthorized)
            if (error.response?.status === 401) {
                // Prevent multiple simultaneous 401 handling
                if (!isHandling401) {
                    isHandling401 = true

                    try {
                        // Try to refresh token first if we have a refresh token
                        if (authStore.refreshToken && !error.config.url?.includes('/token/refresh/')) {
                            try {
                                await authStore.refreshTokenRequest()
                                // Retry the original request with new token
                                error.config.headers.Authorization = `Bearer ${authStore.token}`
                                return axiosInstance(error.config)
                            } catch (refreshError) {
                                // Refresh failed, clear auth state
                                authStore.clearAuthState()
                                await navigateTo('/login')
                            }
                        } else {
                            // No refresh token or refresh endpoint failed, clear auth state
                            authStore.clearAuthState()
                            await navigateTo('/login')
                        }
                    } catch (logoutError) {
                        console.error('Error during auth cleanup:', logoutError)
                    } finally {
                        isHandling401 = false
                    }
                }

                return Promise.reject(error)
            }

            // Log other errors (but reduce noise)
            if (error.response?.status !== 401) {
                const errorMessage = error.response?.data || 'An error occurred'
                console.error('API Error:', errorMessage)
            }

            return Promise.reject(error)
        }
    )

    return axiosInstance
}