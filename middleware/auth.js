// middleware/auth.js
export default defineNuxtRouteMiddleware((to, from) => {
  if (process.client) {
    const authStore = useAuthStore()

    // Redirect unauthenticated users to login for protected routes
    if (!authStore.isAuthenticated && to.meta.requiresAuth) {
      return navigateTo('/login')
    }

    // Redirect authenticated users away from login page
    if (authStore.isAuthenticated && to.path === '/login') {
      return navigateTo('/')
    }

    // Restrict routes based on user type
    if (to.meta.requiresStudent && !authStore.isStudent) {
      return navigateTo('/unauthorized')
    }
    if (to.meta.requiresStaff && !authStore.isStaff) {
      return navigateTo('/unauthorized')
    }
  }
})