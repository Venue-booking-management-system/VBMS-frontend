export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore()
  if (!authStore.isAuthenticated) {
    return navigateTo({
      path: '/login',
      query: { redirect: to.fullPath },
    })
  }
  await authStore.fetchUserData()
  if (!authStore.user?.isStaff) {
    return navigateTo('/')
  }
})