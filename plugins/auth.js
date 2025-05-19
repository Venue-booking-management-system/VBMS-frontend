// plugins/auth.js
export default defineNuxtPlugin(async (nuxtApp) => {
    const authStore = useAuthStore()
    try {
        if (import.meta.client) {
            authStore.initialize()
        }
        console.log('Auth plugin initialized')
    } catch (error) {
        console.error('Error in auth plugin:', error)
    }
})