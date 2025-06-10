export default defineNuxtRouteMiddleware(async (to, from) => {
  if (process.client) {
    const authStore = useAuthStore()
    const profileStore = useProfileStore()

    // Initialize auth store if not already done
    authStore.initialize()

    // Redirect unauthenticated users to login for protected routes
    if (!authStore.isAuthenticated && to.meta.auth) {
      return navigateTo({
        path: '/login',
        query: { redirect: to.fullPath },
      })
    }

    // Redirect authenticated users away from login page
    if (authStore.isAuthenticated && to.path === '/login') {
      return navigateTo('/')
    }

    // Fetch profile if authenticated but not loaded
    if (authStore.isAuthenticated && !profileStore.isProfileLoaded) {
      try {
        await profileStore.fetchProfile()
      } catch {
        authStore.clearAuth()
        return navigateTo('/login')
      }
    }
  }
})