export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore()
  const profileStore = useProfileStore()

  // Ensure user is authenticated
  if (!authStore.isAuthenticated) {
    return navigateTo({
      path: '/login',
      query: { redirect: to.fullPath },
    })
  }

  // Ensure profile is loaded
  if (!profileStore.isProfileLoaded) {
    try {
      await profileStore.fetchProfile()
    } catch {
      authStore.clearAuth()
      return navigateTo('/login')
    }
  }

  // Restrict to staff users
  if (!profileStore.isStaff) {
    return navigateTo('/unauthorized')
  }
})