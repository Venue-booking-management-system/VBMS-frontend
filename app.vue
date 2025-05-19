<script setup>
import HeaderComponent from './components/HeaderComponent.vue'

</script>

<template>
  <HeaderComponent />
  <NuxtPage class="view" />
</template>

<style scoped>
.view {
  margin-top: 50px;
  padding: 20px;
  min-height: calc(100vh - 100px);
}
</style>