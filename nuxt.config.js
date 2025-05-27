// https://nuxt.com/docs/api/configuration/nuxt-config
// eslint-disable-next-line no-undef
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: {
    enabled: true,

    timeline: {
      enabled: true,
    },
  },
  modules: ['@nuxt/content', '@nuxt/eslint', '@pinia/nuxt'],
  routeRules: {
    '/dashboard': { middleware: ['auth', 'staff'] },
  },
  runtimeConfig: {
    public: {
      baseURL: process.env.NUXT_PUBLIC_BASE_URL || 'http://localhost:8000',
    },
  },
  css: ['~/assets/styles/main.scss'],
})