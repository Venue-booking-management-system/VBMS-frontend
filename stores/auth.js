import { defineStore } from 'pinia'
import { useAxios } from '~/services/useAxios.js'

const API_ROUTES = {
    REGISTER: '/api/auth/register/',
    LOGIN: '/api/token/',
    REFRESH: '/api/token/refresh/',
    PROFILE: '/api/me/profile/',
    LOGOUT: '/api/auth/logout/'
}

const STORAGE_KEYS = {
    USER: 'user',
    TOKEN: 'token',
    REFRESH_TOKEN: 'refreshToken'
}

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null,
        token: null,
        refreshToken: null,
        refreshTimeout: null
    }),

    getters: {
        isAuthenticated: (state) => !!state.token,
        userType: (state) => state.user?.user_type || null,
        isStudent: (state) => state.user?.user_type === 'student',
        isStaff: (state) => state.user?.user_type === 'staff',
    },

    actions: {
        loadFromStorage() {
            const user = this.getFromStorage(STORAGE_KEYS.USER, true)
            this.user = user ? { ...user } : null
            this.user = this.getFromStorage(STORAGE_KEYS.USER, true)
            this.token = this.getFromStorage(STORAGE_KEYS.TOKEN)
            this.refreshToken = this.getFromStorage(STORAGE_KEYS.REFRESH_TOKEN)
        },

        getFromStorage(key, parseJson = false) {
            const value = localStorage.getItem(key)
            return parseJson ? JSON.parse(value) : value
        },

        saveToStorage(key, value) {
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
                await this.fetchProfile()
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

        async fetchProfile() {
            try {
                const api = useAxios()
                const response = await api.get(API_ROUTES.PROFILE)
                    for (const key in response.data) {
                        if (key === 'profile') {
                            this.user = {...this.user, ...response.data[key]}
                        }
                        this.user[key] = response.data[key]
                    }
                    this.saveToStorage(STORAGE_KEYS.USER, this.user)
                    return this.user
            } catch (error) {
                return this.handleError(error)
            }
        },

        async updateProfile(profileData) {
            try {
                const api = useAxios()
                const response = await api.put(API_ROUTES.PROFILE, profileData)
                this.user = { ...this.user, ...response.data }
                this.saveToStorage(STORAGE_KEYS.USER, this.user)
                return this.user
            } catch (error) {
                return this.handleError(error)
            }
        },

        async logout() {
            try {
                const api = useAxios()
                await api.post(API_ROUTES.LOGOUT)
            } finally {
                this.clearAuth()
                navigateTo('/login')
            }
        },

        clearAuth() {
            this.user = null
            this.token = null
            this.refreshToken = null
            Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key))
            if (this.refreshTimeout) {
                clearTimeout(this.refreshTimeout)
            }
        },

        initialize() {
            if (typeof localStorage === 'undefined') return
            this.loadFromStorage()
            if (this.token) {
                this.scheduleTokenRefresh()
                if (!this.user) this.fetchProfile()
            }
        },
        async checkAuth() {
            if (this.token) {
                try {
                    await this.fetchProfile()
                    return true
                } catch (error) {
                    this.clearAuth()
                    return false
                }
            }
            return false
        }
    }
})
