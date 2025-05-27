import { defineStore } from 'pinia'
import { useAxios } from '~/services/useAxios.js'
import { useProfileStore } from './profile.js'

const API_ROUTES = {
    REGISTER: '/api/auth/register/',
    LOGIN: '/api/token/',
    REFRESH: '/api/token/refresh/',
    LOGOUT: '/api/auth/logout/'
}

const STORAGE_KEYS = {
    TOKEN: 'token',
    REFRESH_TOKEN: 'refreshToken'
}

export const useAuthStore = defineStore('auth', {
    state: () => ({
        token: null,
        refreshToken: null,
        refreshTimeout: null
    }),

    getters: {
        isAuthenticated: (state) => !!state.token,
    },

    actions: {
        loadFromStorage() {
            this.token = this.getFromStorage(STORAGE_KEYS.TOKEN)
            this.refreshToken = this.getFromStorage(STORAGE_KEYS.REFRESH_TOKEN)
        },

        getFromStorage(key, parseJson = false) {
            if (typeof localStorage === 'undefined') return null
            const value = localStorage.getItem(key)
            return parseJson ? JSON.parse(value) : value
        },

        saveToStorage(key, value) {
            if (typeof localStorage === 'undefined') return
            const storableValue = typeof value === 'object' ? JSON.stringify(value) : value
            localStorage.setItem(key, storableValue)
        },

        handleError(error) {
            return Promise.reject(error.response?.data || error)
        },

        async register(userData) {
            try {
                const api = useAxios()
                await api.post(API_ROUTES.REGISTER, userData)
                return this.login({
                    email: userData.email,
                    password: userData.password
                })
            } catch (error) {
                return this.handleError(error)
            }
        },

        async login(credentials) {
            try {
                const api = useAxios()
                const response = await api.post(API_ROUTES.LOGIN, credentials)
                this.handleTokenResponse(response.data)

                // Fetch profile after successful login
                const profileStore = useProfileStore()
                await profileStore.fetchProfile()

                return response.data
            } catch (error) {
                this.clearAuth()
                return this.handleError(error)
            }
        },

        handleTokenResponse(data) {
            this.token = data.access
            this.refreshToken = data.refresh
            this.saveToStorage(STORAGE_KEYS.TOKEN, this.token)
            this.saveToStorage(STORAGE_KEYS.REFRESH_TOKEN, this.refreshToken)
            this.scheduleTokenRefresh()
        },

        async refreshTokenRequest() {
            try {
                const api = useAxios()
                const response = await api.post(API_ROUTES.REFRESH, {
                    refresh: this.refreshToken
                })
                this.token = response.data.access
                this.saveToStorage(STORAGE_KEYS.TOKEN, this.token)
                this.scheduleTokenRefresh()
                return this.token
            } catch (error) {
                this.clearAuth()
                throw error
            }
        },

        scheduleTokenRefresh() {
            if (this.refreshTimeout) {
                clearTimeout(this.refreshTimeout)
            }
            this.refreshTimeout = setTimeout(() => this.refreshTokenRequest(), 19 * 60 * 1000)
        },

        // Manual logout (makes API call) - called by user actions
        async logout() {
            try {
                // Only make API call if we have a token
                if (this.token) {
                    const api = useAxios()
                    await api.post(API_ROUTES.LOGOUT)
                }
            } catch (error) {
                // Don't throw on logout API errors - just log them
                console.warn('Logout API call failed:', error.message)
            } finally {
                // Always clear state regardless of API call success
                this.clearAuth()
                const profileStore = useProfileStore()
                profileStore.clearProfile()
                await navigateTo('/login')
            }
        },

        // Clear auth state without API calls - called by interceptor
        clearAuthState() {
            this.clearAuth()
            const profileStore = useProfileStore()
            profileStore.clearProfile()
        },

        clearAuth() {
            this.token = null
            this.refreshToken = null
            if (typeof localStorage !== 'undefined') {
                Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key))
            }
            if (this.refreshTimeout) {
                clearTimeout(this.refreshTimeout)
                this.refreshTimeout = null
            }
        },

        initialize() {
            if (typeof localStorage === 'undefined') return
            this.loadFromStorage()
            if (this.token) {
                this.scheduleTokenRefresh()
                // Initialize profile if we have a valid token
                const profileStore = useProfileStore()
                if (!profileStore.isProfileLoaded) {
                    profileStore.fetchProfile().catch(() => {
                        // If profile fetch fails, clear auth
                        this.clearAuth()
                    })
                }
            }
        },

        async checkAuth() {
            if (this.token) {
                try {
                    const profileStore = useProfileStore()
                    await profileStore.fetchProfile()
                    return true
                } catch (error) {
                    this.clearAuth()
                    const profileStore = useProfileStore()
                    profileStore.clearProfile()
                    return false
                }
            }
            return false
        }
    }
})