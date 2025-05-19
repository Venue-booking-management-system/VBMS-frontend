// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  modules: ['@nuxt/content', '@nuxt/eslint', '@pinia/nuxt'],
  routeRules: {
    '/dashboard': { middleware: ['auth'] },
  },
  runtimeConfig: {
    public: {
      baseURL: process.env.NUXT_PUBLIC_BASE_URL || 'http://localhost:8000',
    },
  },
  css: ['~/assets/styles/main.scss'],
})