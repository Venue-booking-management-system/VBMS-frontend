<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()
const form = ref({
  first_name: '',
  last_name: '',
  email: '',
})
const errors = ref({})

onMounted(async () => {
  if (!authStore.user) {
    await authStore.fetchProfile()
  }
  form.value = { ...authStore.user }
})

async function handleUpdate() {
  try {
    await authStore.updateProfile(form.value)
  } catch (error) {
    errors.value = error
  }
}

definePageMeta({
  middleware: ['auth'],
})
</script>

<template>
  <section id="profile-page">
    <div class="container page-section">
      <div class="card">
        <div class="profile-header">
          <div class="avatar">
            <img src="../assets/images/default_profilepic.jpg" alt="Profile picture">
            <div class="avatar-overlay">Change Photo</div>
          </div>
          <div class="profile-info">
            <h2>John Doe</h2>
            <p>john.doe@example.com</p>
          </div>
          <div class="profile-actions">
            <button class="btn btn-outline">Edit Profile</button>
          </div>
        </div>

        <div class="tabs">
          <div class="tab active" onclick="switchTab(event, 'personal-info')">Personal Information</div>
          <div class="tab" onclick="switchTab(event, 'my-bookings')">My Bookings</div>
          <div class="tab" onclick="switchTab(event, 'account-settings')">Account Settings</div>
        </div>

        <div id="personal-info" class="tab-content active">
          <div class="profile-section">
            <h3 class="section-title">Personal Information</h3>
            <form>
              <div class="form-group">
                <label for="profile-name">Full Name</label>
                <input type="text" id="profile-name" class="form-control" value="John Doe">
              </div>
              <div class="form-group">
                <label for="profile-email">Email Address</label>
                <input type="email" id="profile-email" class="form-control" value="john.doe@example.com">
              </div>
              <div class="form-group">
                <label for="profile-phone">Phone Number</label>
                <input type="tel" id="profile-phone" class="form-control" value="+1 234 567 890">
              </div>
              <div class="form-group">
                <label for="profile-address">Address</label>
                <textarea id="profile-address" class="form-control" rows="3">123 Main Street, Anytown, CA 12345</textarea>
              </div>
              <button type="submit" class="btn">Save Changes</button>
            </form>
          </div>
        </div>

        <div id="my-bookings" class="tab-content">
          <div class="profile-section">
            <h3 class="section-title">My Bookings</h3>
            <ul class="booking-list">
              <li class="booking-item">
                <div class="booking-info">
                  <h4>Conference Hall A</h4>
                  <p>June 15, 2025 • 9:00 AM - 5:00 PM</p>
                </div>
                <span class="booking-status status-approved">Approved</span>
              </li>
              <li class="booking-item">
                <div class="booking-info">
                  <h4>Meeting Room 3</h4>
                  <p>June 20, 2025 • 1:00 PM - 3:00 PM</p>
                </div>
                <span class="booking-status status-pending">Pending</span>
              </li>
              <li class="booking-item">
                <div class="booking-info">
                  <h4>Event Space</h4>
                  <p>July 10, 2025 • 6:00 PM - 10:00 PM</p>
                </div>
                <span class="booking-status status-rejected">Rejected</span>
              </li>
            </ul>
          </div>
        </div>

        <div id="account-settings" class="tab-content">
          <div class="profile-section">
            <h3 class="section-title">Change Password</h3>
            <form>
              <div class="form-group">
                <label for="current-password">Current Password</label>
                <input type="password" id="current-password" class="form-control" placeholder="Enter current password">
              </div>
              <div class="form-group">
                <label for="new-password">New Password</label>
                <input type="password" id="new-password" class="form-control" placeholder="Enter new password">
              </div>
              <div class="form-group">
                <label for="confirm-new-password">Confirm New Password</label>
                <input type="password" id="confirm-new-password" class="form-control" placeholder="Confirm new password">
              </div>
              <button type="submit" class="btn">Update Password</button>
            </form>
          </div>

          <div class="profile-section">
            <h3 class="section-title">Notification Settings</h3>
            <form>
              <div class="form-group">
                <label>
                  <input type="checkbox" checked> Email notifications for booking updates
                </label>
              </div>
              <div class="form-group">
                <label>
                  <input type="checkbox" checked> Email notifications for new promotions
                </label>
              </div>
              <div class="form-group">
                <label>
                  <input type="checkbox"> SMS notifications for booking updates
                </label>
              </div>
              <button type="submit" class="btn">Save Preferences</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </section>

</template>

<style scoped>

</style>
