<!-- pages/bookings/index.vue -->
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAxios } from '~/services/useAxios.js'
import { useVenueBookingStore } from '~/stores/venueBooking.js'

definePageMeta({
  middleware: ['auth'],
  auth: true,
})

const api = useAxios()
const venueBookingStore = useVenueBookingStore()

// Reactive data
const bookings = ref([])
const loading = ref(false)
const error = ref(null)
const selectedBooking = ref(null)

// Filters
const filters = ref({
  status: '',
  date_from: '',
  date_to: '',
  venue: '',
})

// Modal state
const showModal = ref(false)

// Computed properties
const filteredBookings = computed(() => {
  return bookings.value.map(booking => ({
    ...booking,
    formattedDateTime: `${new Date(booking.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} • ${booking.start_time} - ${booking.end_time}`,
    statusClass: `status-${booking.status.toLowerCase()}`,
  }))
})

// API functions
const fetchBookings = async () => {
  loading.value = true
  error.value = null
  try {
    const response = await api.get('/api/bookings/', {
      params: {
        status: filters.value.status,
        date_from: filters.value.date_from,
        date_to: filters.value.date_to,
        venue_name: filters.value.venue,
      },
    })
    bookings.value = response.data.results || []
  } catch (err) {
    error.value = err.response?.data?.detail || 'Failed to load bookings'
  } finally {
    loading.value = false
  }
}

const cancelBooking = async (bookingId) => {
  if (!confirm('Are you sure you want to cancel this booking?')) return
  loading.value = true
  error.value = null
  try {
    await api.delete(`/api/bookings/${bookingId}/`)
    await fetchBookings() // Refresh bookings
  } catch (err) {
    error.value = err.response?.data?.detail || 'Failed to cancel booking'
  } finally {
    loading.value = false
  }
}

const openBookingModal = (booking) => {
  selectedBooking.value = booking
  showModal.value = true
}

const closeBookingModal = () => {
  selectedBooking.value = null
  showModal.value = false
}

// Watch filters for changes
watch(filters, () => fetchBookings(), { deep: true })

// Lifecycle
onMounted(() => fetchBookings())
</script>

<template>
  <section id="bookings-page" class="container page-section">
    <h1 class="section-title">My Bookings</h1>

    <!-- Error State -->
    <div v-if="error" class="alert-error">
      <div class="error-icon">❌</div>
      <p>{{ error }}</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading bookings...</p>
    </div>

    <!-- Filters -->
    <div class="booking-filters">
      <div class="filter">
        <label for="booking-status">Status:</label>
        <select id="booking-status" v-model="filters.status" class="form-control">
          <option value="">All Statuses</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
          <option value="review">In Review</option>
        </select>
      </div>
      <div class="filter">
        <label for="booking-date-from">Date From:</label>
        <input id="booking-date-from" type="date" v-model="filters.date_from" class="form-control" />
      </div>
      <div class="filter">
        <label for="booking-date-to">Date To:</label>
        <input id="booking-date-to" type="date" v-model="filters.date_to" class="form-control" />
      </div>
      <div class="filter">
        <label for="booking-venue">Venue:</label>
        <input id="booking-venue" type="text" v-model="filters.venue" class="form-control" placeholder="Search venues..." />
      </div>
    </div>

    <!-- Bookings Table -->
    <div v-if="!loading" class="card">
      <table class="bookings-table">
        <thead>
        <tr>
          <th>Booking ID</th>
          <th>Venue</th>
          <th>Date & Time</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="booking in filteredBookings" :key="booking.id">
          <td>#{{ booking.id }}</td>
          <td>{{ booking.venue_name }}</td>
          <td>{{ booking.formattedDateTime }}</td>
          <td><span :class="['booking-status', booking.statusClass]">{{ booking.status }}</span></td>
          <td>
            <div class="booking-actions">
              <button class="btn btn-small btn-outline" @click="openBookingModal(booking)" :disabled="loading">
                View
              </button>
              <button
                  class="btn btn-small btn-outline"
                  @click="cancelBooking(booking.id)"
                  :disabled="loading || booking.status !== 'pending'"
              >
                Cancel
              </button>
            </div>
          </td>
        </tr>
        <tr v-if="filteredBookings.length === 0">
          <td colspan="5" class="no-data">No bookings found</td>
        </tr>
        </tbody>
      </table>
    </div>

    <!-- Booking Details Modal -->
    <div v-if="showModal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Booking Details</h2>
          <button class="btn btn-outline btn-small" @click="closeBookingModal">Close</button>
        </div>
        <div class="modal-body">
          <p><strong>Booking ID:</strong> #{{ selectedBooking.id }}</p>
          <p><strong>Venue:</strong> {{ selectedBooking.venue_name }}</p>
          <p><strong>Date & Time:</strong> {{ selectedBooking.formattedDateTime }}</p>
          <p><strong>Status:</strong> {{ selectedBooking.status }}</p>
          <p v-if="selectedBooking.event_name"><strong>Event Name:</strong> {{ selectedBooking.event_name }}</p>
          <p v-if="selectedBooking.description"><strong>Description:</strong> {{ selectedBooking.description }}</p>
          <div v-if="selectedBooking.documents?.length">
            <strong>Uploaded Documents:</strong>
            <ul>
              <li v-for="doc in selectedBooking.documents" :key="doc.id">{{ doc.name }}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-section {
  margin-bottom: 2rem;
}

.section-title {
  font-size: 2.5rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 1.5rem;
}

.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.booking-filters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.filter {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter label {
  font-weight: 500;
  color: #333;
}

.form-control {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
}

.bookings-table {
  width: 100%;
  border-collapse: collapse;
}

.bookings-table th,
.bookings-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.bookings-table th {
  font-weight: 600;
  color: #333;
}

.booking-status {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: capitalize;
}

.status-approved {
  background: #d4edda;
  color: #155724;
}

.status-pending {
  background: #fff3cd;
  color: #856404;
}

.status-rejected {
  background: #f8d7da;
  color: #721c24;
}

.status-review {
  background: #e2e3e5;
  color: #41464b;
}

.booking-actions {
  display: flex;
  gap: 0.5rem;
}

.no-data {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  text-decoration: none;
  display: inline-block;
}

.btn-primary {
  background: #007bff;
  color: white;
  border: none;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

.btn-outline {
  background: transparent;
  border: 1px solid #007bff;
  color: #007bff;
}

.btn-outline:hover:not(:disabled) {
  background: #007bff;
  color: white;
}

.btn-small {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
}

.btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
  opacity: 0.6;
}

.loading-state {
  text-align: center;
  padding: 3rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.alert-error {
  padding: 1rem;
  border-radius: 4px;
  display: flex;
  gap: 1rem;
  align-items: center;
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
  margin-bottom: 1.5rem;
}

.error-icon {
  font-size: 1.5rem;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  max-width: 500px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #eee;
}

.modal-header h2 {
  font-size: 1.5rem;
  margin: 0;
}

.modal-body {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

@media (max-width: 768px) {
  .booking-filters {
    grid-template-columns: 1fr;
  }
  .bookings-table {
    display: block;
    overflow-x: auto;
  }
}
</style>