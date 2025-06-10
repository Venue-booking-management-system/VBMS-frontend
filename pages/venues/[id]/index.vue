<!-- pages/venues/[id]/index.vue -->
<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAxios } from '~/services/useAxios.js'
import { useVenueBookingStore } from '~/stores/venueBooking.js'

definePageMeta({
  middleware: ['auth'],
  auth: true,
})

const route = useRoute()
const router = useRouter()
const venueId = route.params.id
const api = useAxios()
const venueBookingStore = useVenueBookingStore()

// Reactive data
const venue = ref(null)
const loading = ref(false)
const error = ref(null)
const availabilitySlots = ref([])

// Handler options
const handlerOptions = [
  { value: 'sa', label: 'SA (Student Affairs)' },
  { value: 'ppk', label: 'PPK (Facility Management)' },
]

// Venue types for display
const venueTypes = [
  { value: 'conference', label: 'Conference Room' },
  { value: 'auditorium', label: 'Auditorium' },
  { value: 'sports', label: 'Sports Field' },
  { value: 'classroom', label: 'Classroom' },
  { value: 'other', label: 'Other' },
]

// Computed properties
const featureBadges = computed(() => {
  if (!venue.value?.features || typeof venue.value.features !== 'object') return []
  return Object.entries(venue.value.features)
      .filter(([_, value]) => value === true)
      .map(([key]) => key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' '))
})

const requirementBadges = computed(() => {
  if (!venue.value) return []
  const requirements = []
  if (venue.value.requires_approval) requirements.push('Requires Approval')
  if (venue.value.requires_payment) requirements.push('Payment Required')
  if (venue.value.requires_documents) requirements.push('Documents Required')
  if (venue.value.required_document_types?.length > 0) {
    requirements.push(`Required Documents: ${venue.value.required_document_types.join(', ')}`)
  }
  return requirements
})

const handlerLabel = computed(() => {
  if (!venue.value?.handled_by) return 'N/A'
  const handler = handlerOptions.find((h) => h.value === venue.value.handled_by)
  return handler ? handler.label : venue.value.handled_by
})

const categoryLabel = computed(() => {
  if (!venue.value?.category) return 'N/A'
  const type = venueTypes.find((t) => t.value === venue.value.category)
  return type ? type.label : venue.value.category
})

const priceDisplay = computed(() => {
  if (!venue.value) return 'N/A'
  if (venue.value.pricing_structure?.hourly) return `$${venue.value.pricing_structure.hourly} / hour`
  if (venue.value.pricing_structure?.daily) return `$${venue.value.pricing_structure.daily} / day`
  let basePrice = Math.floor(venue.value.capacity * 2.5)
  if (venue.value.requires_payment) basePrice *= 1.5
  if (venue.value.requires_approval) basePrice *= 1.2
  if (venue.value.requires_documents) basePrice *= 1.1
  return `$${Math.floor(basePrice)} / day`
})

const formattedAvailabilitySlots = computed(() => {
  return availabilitySlots.value.map(slot => ({
    ...slot,
    formatted: `${slot.date} from ${slot.start_time} to ${slot.end_time}`
  }))
})

// API functions
const fetchVenue = async () => {
  loading.value = true
  error.value = null
  try {
    const response = await api.get(`/api/venues/${venueId}/`)
    venue.value = response.data
    venueBookingStore.venue = response.data // Store venue for booking
  } catch (err) {
    error.value = err.response?.data?.detail || err.message
  } finally {
    loading.value = false
  }
}

const fetchAvailabilitySlots = async () => {
  if (!venue.value) return
  try {
    const response = await api.get(`/api/venues/${venueId}/availability/`)
    availabilitySlots.value = response.data || []
  } catch (err) {
    console.error('Error fetching availability slots:', err)
  }
}

// Start booking with optional slot
const startBooking = (slot = null) => {
  venueBookingStore.resetForm()
  if (slot) {
    venueBookingStore.bookingForm.date = slot.date
    venueBookingStore.bookingForm.customStartTime = slot.start_time
    venueBookingStore.bookingForm.customEndTime = slot.end_time
  }
  router.push(`/venues/${venueId}/book`)
}

// Watchers
watch(() => venue.value, (newVenue) => {
  if (newVenue) fetchAvailabilitySlots()
})

// Lifecycle
onMounted(() => fetchVenue())
</script>

<template>
  <section id="venue-detail-page" class="container page-section">
    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading venue details...</p>
    </div>

    <!-- Error State -->
    <div v-if="error" class="alert-error">
      <div class="error-icon">⚠️</div>
      <h3>Failed to Load Venue</h3>
      <p>{{ error }}</p>
      <button class="btn btn-primary" @click="fetchVenue" :disabled="loading">
        Try Again
      </button>
    </div>

    <!-- Venue Detail Content -->
    <div v-if="!loading && !error && venue" class="venue-detail-content">
      <!-- Header with Image -->
      <div class="venue-detail-header">
        <img src="@/assets/images/venuePic.jpeg" :alt="venue.name" class="venue-detail-image" />
        <div class="venue-detail-overlay">
          <h1 class="venue-detail-title">{{ venue.name }}</h1>
          <div class="venue-detail-meta">
            <div class="venue-location">📍 {{ venue.location }}</div>
            <div class="venue-handler">
              <span class="handler-badge">Handled by: {{ handlerLabel }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="venue-detail-info">
        <div class="venue-detail-main">
          <!-- About Section -->
          <div class="card venue-detail-section">
            <h2>About this Venue</h2>
            <p v-if="venue.description">{{ venue.description }}</p>
            <p v-else>A professional venue space perfect for your events and meetings.</p>

            <div class="venue-specs">
              <div class="spec-item"><strong>Capacity:</strong> {{ venue.capacity }} people</div>
              <div class="spec-item"><strong>Category:</strong> {{ categoryLabel }}</div>
              <div class="spec-item"><strong>Price:</strong> {{ priceDisplay }}</div>
            </div>

            <h3 v-if="featureBadges.length > 0">Features & Amenities</h3>
            <div class="venue-features">
              <span v-for="feature in featureBadges" :key="feature" class="badge badge-secondary">{{ feature }}</span>
            </div>

            <div v-if="requirementBadges.length > 0" class="venue-requirements">
              <h3>Requirements</h3>
              <div class="requirements-list">
                <span v-for="requirement in requirementBadges" :key="requirement" class="badge badge-warning">{{ requirement }}</span>
              </div>
            </div>
          </div>

          <!-- Availability Slots -->
          <div class="card venue-detail-section">
            <h2>Available Time Slots</h2>
            <div v-if="availabilitySlots.length > 0" class="availability-slots">
              <div v-for="slot in formattedAvailabilitySlots" :key="slot.formatted" class="slot-item">
                <span>{{ slot.formatted }}</span>
                <button
                    class="btn btn-primary btn-small"
                    @click="startBooking(slot)"
                    :disabled="loading || !venue.is_available"
                >
                  Book This Slot
                </button>
              </div>
            </div>
            <p v-else>No specific time slots defined. Check with the venue handler for availability.</p>
          </div>

          <!-- Booking Button -->
          <div class="card venue-detail-section">
            <button class="btn btn-primary" @click="startBooking" :disabled="loading || !venue.is_available">
              Book This Venue (Custom Time)
            </button>
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

.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
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

.venue-detail-header {
  position: relative;
  margin-bottom: 2rem;
  border-radius: 8px;
  overflow: hidden;
}

.venue-detail-image {
  width: 100%;
  height: 400px;
  object-fit: cover;
}

.venue-detail-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  color: white;
  padding: 2rem;
}

.venue-detail-title {
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.venue-detail-meta {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.venue-location {
  font-size: 1.1rem;
}

.handler-badge {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.9rem;
}

.venue-detail-info {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
}

.venue-detail-main {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.venue-detail-section {
  padding: 0;
}

.venue-specs {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 1rem 0;
}

.spec-item {
  font-size: 0.95rem;
}

.venue-features,
.requirements-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.venue-requirements {
  margin-top: 1.5rem;
}

.availability-slots {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.slot-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 4px;
}

.badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
}

.badge-secondary {
  background: #6c757d;
  color: white;
}

.badge-warning {
  background: #ffc107;
  color: #856404;
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

.btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
  opacity: 0.6;
}

.btn-small {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
}

@media (max-width: 768px) {
  .venue-detail-image {
    height: 200px;
  }
  .venue-detail-title {
    font-size: 2rem;
  }
  .slot-item {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }
}
</style>