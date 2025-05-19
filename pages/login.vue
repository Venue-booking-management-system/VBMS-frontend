<script setup>
import { ref } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useRouter } from 'vue-router'

const router = useRouter()

definePageMeta({
  middleware: ['guest'],
})

const authStore = useAuthStore()
const form = ref({
  email: '',
  password: ''
})
const errors = ref({})

async function handleLogin() {
  try {
    await authStore.login(form.value)
    const redirect = router.currentRoute.value.query.redirect || '/'
    await router.push(redirect)
  }
  catch (error) {
    errors.value = error
  }
}
</script>

<template>
  <section id="login-page">
    <div class="auth-container">
      <div class="card auth-card">
        <h2 class="auth-title">Login to Your Account</h2>
        <div class="alert">{{ errors }}</div>
        <form @submit.prevent="handleLogin">
          <div class="form-group">
            <label for="login-email">Email Address</label>
            <input v-model="form.email" type="email" id="login-email" class="form-control" placeholder="Enter your email" required>
          </div>
          <div class="form-group">
            <label for="login-password">Password</label>
            <input v-model="form.password" type="password" id="login-password" class="form-control" placeholder="Enter your password" required>
          </div>
          <div class="form-footer">
            <div>
              <a href="#" style="color: #4a6fdc; text-decoration: none;">Forgot Password?</a>
            </div>
            <button type="submit" class="btn">Login</button>
          </div>
        </form>
        <div class="auth-switch">
          <p>Don't have an account? <router-link to="/register">register</router-link></p>
        </div>
      </div>
    </div>
  </section>
</template>
