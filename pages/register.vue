<!-- pages/register.vue -->
<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useRouter } from 'vue-router'

// Define this page as requiring guest middleware
definePageMeta({
  middleware: ['guest'],
})

const router = useRouter()
const authStore = useAuthStore()

// Form data
const form = ref({
  email: '',
  password: '',
  confirm_password: '',
  first_name: '',
  last_name: '',
  user_type: '',
})

// Form validation state
const errors = ref({})
const formError = ref('')

// Validation checks
const passwordsMatch = computed(() =>
    form.value.password === form.value.confirm_password || !form.value.confirm_password)

// Check if user type is selected
const userTypeSelected = computed(() => !!form.value.user_type)

// Handle registration submission
async function handleRegister() {
  // Reset errors
  formError.value = ''
  errors.value = {}

  // Client-side validation
  if (!passwordsMatch.value) {
    errors.value.password = 'Passwords do not match'
    return
  }

  if (!userTypeSelected.value) {
    errors.value.user_type = 'Please select your user type'
    return
  }

  try {
    // Send registration data to auth store
    const result = await authStore.register({...form.value})

    // If registration returns a message (registration successful but requires login)
    if (result && result.success) {
      alert(result.message)
      router.push('/login')
    } else {
      // If registration includes auto-login, redirect to home
      router.push('/')
    }
  } catch (error) {
    // Display error from API
    formError.value = error
  }
}
</script>

<template>
  <section id="registration-page">
    <div class="auth-container">
      <div class="card auth-card">
        <h2 class="auth-title">Create an Account</h2>

        <!-- Display form errors -->
        <div v-if="formError" class="error-message alert">
          {{ formError }}
        </div>

        <form @submit.prevent="handleRegister">
          <div class="form-group">
            <label for="register-first-name">First Name</label>
            <input
                v-model="form.first_name"
                type="text"
                id="register-first-name"
                class="form-control"
                placeholder="Enter your first name"
                required
            />
          </div>

          <div class="form-group">
            <label for="register-last-name">Last Name</label>
            <input
                v-model="form.last_name"
                type="text"
                id="register-last-name"
                class="form-control"
                placeholder="Enter your last name"
                required
            />
          </div>

          <div class="form-group">
            <label for="register-email">Email Address</label>
            <input
                v-model="form.email"
                type="email"
                id="register-email"
                class="form-control"
                :class="{ 'is-invalid': errors.email }"
                placeholder="Enter your email"
                required
            />
            <div v-if="errors.email" class="invalid-feedback">
              {{ errors.email }}
            </div>
          </div>

          <div class="form-group">
            <label for="register-password">Password</label>
            <input
                v-model="form.password"
                type="password"
                id="register-password"
                class="form-control"
                :class="{ 'is-invalid': errors.password }"
                placeholder="Create a password"
                required
            />
          </div>

          <div class="form-group">
            <label for="register-confirm-password">Confirm Password</label>
            <input
                v-model="form.confirm_password"
                type="password"
                id="register-confirm-password"
                class="form-control"
                :class="{ 'is-invalid': !passwordsMatch }"
                placeholder="Confirm your password"
                required
            />
            <div v-if="!passwordsMatch" class="invalid-feedback">
              Passwords do not match
            </div>
          </div>

          <div class="form-group user-type-group">
            <label class="user-type-label">Select User Type</label>
            <div class="radio-options">
              <div class="radio-option">
                <input
                    v-model="form.user_type"
                    type="radio"
                    name="user_type"
                    id="student-register"
                    value="student"
                />
                <label for="student-register">Student</label>
              </div>

              <div class="radio-option">
                <input
                    v-model="form.user_type"
                    type="radio"
                    name="user_type"
                    id="staff-register"
                    value="staff"
                />
                <label for="staff-register">Staff</label>
              </div>
            </div>
            <div v-if="errors.user_type" class="invalid-feedback">
              {{ errors.user_type }}
            </div>
          </div>

          <div class="form-footer">
            <button
                type="submit"
                class="btn"
                :disabled="authStore.isLoading"
            >
              {{ authStore.isLoading ? 'Registering...' : 'Register' }}
            </button>
          </div>
        </form>

        <div class="auth-switch">
          <p>Already have an account? <NuxtLink to="/login">Login</NuxtLink></p>
        </div>
      </div>
    </div>
  </section>
</template>

