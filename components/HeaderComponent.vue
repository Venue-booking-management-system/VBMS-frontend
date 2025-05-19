<script setup>
import { ref } from 'vue'
import { useAuthStore } from '~/stores/auth';
import { storeToRefs } from 'pinia';

const authStore = useAuthStore();
const router = useRouter();

const { isAuthenticated } = storeToRefs(authStore);

const logout = ref(async () => {
  await authStore.logout();
  await router.push('/login');
});
</script>

<template>

  <header class="header">
    <div class="container header-content">
      <img class="logo" src="../assets/images/logo.png" width="100px"/>
      <ul class="nav-links">
        <li><router-link to="/">Dashboard</router-link></li>
        <li><router-link to="/venues">Venues</router-link></li>
        <li><router-link to="/bookings">My Bookings</router-link></li>
        <li><router-link to="/profile">Profile</router-link></li>
        <li><button @click.prevent="logout">Logout</button></li>
      </ul>
    </div>
  </header>
</template>

<style lang="scss">
@use "../assets/styles/variables" as vars;
.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.logo {
  font-size: 24px;
  font-weight: bold;
  color: vars.$primary;
}
.nav-links {
  display: flex;
  list-style: none;
}
.nav-links li {
  margin-left: 20px;
}
.nav-links a {
  text-decoration: none;
  color: #333;
  font-weight: 500;
  transition: color 0.3s;
}
.nav-links a:hover,
.nav-links a.router-link-active {
  color: vars.$primary;
}
</style>
