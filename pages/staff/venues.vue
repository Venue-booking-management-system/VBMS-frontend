<template>
  <div>
    <h1>Venue Management</h1>
  </div>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth'
const authStore = useAuthStore()

definePageMeta({
  middleware: ['staff'],
})
</script>