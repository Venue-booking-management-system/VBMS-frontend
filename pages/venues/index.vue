<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAxios } from '~/services/useAxios.js'

const api = useAxios()

const venues = ref([])
const loading = ref(false)
const error = ref(null)

// Filter states
const searchQuery = ref('')
const selectedType = ref('')
const selectedCapacity = ref('')
const selectedDate = ref('')
const selectedTime = ref('')
const endTime = ref('')
const selectedHandledBy = ref('')
const selectedLocation = ref('')

// View and sorting states
const currentView = ref('grid')
const sortBy = ref('name')

// Available venue types based on your API
const venueTypes = [
  { value: 'conference', label: 'Conference Rooms' },
  { value: 'meeting', label: 'Meeting Rooms' },
  { value: 'event', label: 'Event Spaces' },
  { value: 'boardroom', label: 'Boardrooms' }
]

// Handler options
const handlerOptions = [
  { value: 'sa', label: 'SA' },
  { value: 'ppk', label: 'PPK' }
]

// Computed properties
const filteredAndSortedVenues = computed(() => {
  let result = [...venues.value]

  // Apply search filter (client-side for already fetched data)
  if (searchQuery.value && venues.value.length > 0) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(venue =>
        venue.name.toLowerCase().includes(query) ||
        venue.description?.toLowerCase().includes(query) ||
        venue.location.toLowerCase().includes(query)
    )
  }

  // Apply sorting
  switch (sortBy.value) {
    case 'name':
      result.sort((a, b) => a.name.localeCompare(b.name))
      break
    case 'capacity':
      result.sort((a, b) => b.capacity - a.capacity)
      break
    case 'location':
      result.sort((a, b) => a.location.localeCompare(b.location))
      break
  }

  return result
})

// API functions
const fetchVenues = async () => {
  loading.value = true
  error.value = null

  try {
    const response = await api.get('/api/venues/')
    venues.value = await response.data.results;
  } catch (err) {
    error.value = err.message
    console.error('Error fetching venues:', err)
  } finally {
    loading.value = false
  }
}

const searchVenues = async () => {
  loading.value = true
  error.value = null

  const params = new URLSearchParams()

  if (searchQuery.value) params.append('search', searchQuery.value)
  if (selectedType.value) params.append('category', selectedType.value)
  if (selectedHandledBy.value) params.append('handled_by', selectedHandledBy.value)
  if (selectedLocation.value) params.append('location', selectedLocation.value)

  // Handle capacity filtering
  if (selectedCapacity.value) {
    switch (selectedCapacity.value) {
      case 'small':
        params.append('max_capacity', '20')
        break
      case 'medium':
        params.append('min_capacity', '21')
        params.append('max_capacity', '50')
        break
      case 'large':
        params.append('min_capacity', '51')
        params.append('max_capacity', '100')
        break
      case 'xl':
        params.append('min_capacity', '101')
        break
    }
  }

  try {
    const response = await api.get(`/api/venues/search/?${params}`)
    if (!response.ok) throw new Error('Search failed')
    venues.value = await response.json()
  } catch (err) {
    error.value = err.message
    console.error('Error searching venues:', err)
  } finally {
    loading.value = false
  }
}

const findAvailableVenues = async () => {
  if (!selectedDate.value || !selectedTime.value || !endTime.value) {
    await fetchVenues()
    return
  }

  loading.value = true
  error.value = null

  const params = new URLSearchParams({
    date: selectedDate.value,
    start_time: selectedTime.value,
    end_time: endTime.value
  })

  try {
    const response = await api.get(`/api/venues/available/?${params}`)
    if (!response.ok) throw new Error('Failed to fetch available venues')
    venues.value = await response.json()
  } catch (err) {
    error.value = err.message
    console.error('Error fetching available venues:', err)
  } finally {
    loading.value = false
  }
}

// Utility functions
const formatPrice = (venue) => {
  // Calculate price based on capacity and requirements
  let basePrice = Math.floor(venue.capacity * 2.5)

  // Add premium for special requirements
  if (venue.requires_payment) basePrice *= 1.5
  if (venue.requires_approval) basePrice *= 1.2
  if (venue.requires_documents) basePrice *= 1.1

  return `$${Math.floor(basePrice)}`
}

const getFeatureBadges = (venue) => {
  if (!venue.features || typeof venue.features !== 'object') return []

  return Object.entries(venue.features)
      .filter(([key, value]) => value === true)
      .map(([key]) => key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))
      .slice(0, 5) // Limit to 5 badges for display
}

const getRequirementBadges = (venue) => {
  const requirements = []
  if (venue.requires_approval) requirements.push('Requires Approval')
  if (venue.requires_payment) requirements.push('Payment Required')
  if (venue.requires_documents) requirements.push('Documents Required')
  return requirements
}

const getHandlerLabel = (handlerCode) => {
  const handler = handlerOptions.find(h => h.value === handlerCode)
  return handler ? handler.label : handlerCode
}

const handleBookVenue = (venue) => {
  // Navigate to booking page or emit event
  console.log('Booking venue:', venue)
  // Example: navigateTo(`/bookings/venue/${venue.id}`)
}

const clearAllFilters = () => {
  searchQuery.value = ''
  selectedType.value = ''
  selectedCapacity.value = ''
  selectedDate.value = ''
  selectedTime.value = ''
  endTime.value = ''
  selectedHandledBy.value = ''
  selectedLocation.value = ''
  fetchVenues()
}

// Watchers
watch([searchQuery, selectedType, selectedCapacity, selectedHandledBy, selectedLocation], () => {
  if (selectedDate.value && selectedTime.value && endTime.value) {
    findAvailableVenues()
  } else if (searchQuery.value || selectedType.value || selectedCapacity.value || selectedHandledBy.value || selectedLocation.value) {
    searchVenues()
  } else {
    fetchVenues()
  }
}, { debounce: 300 })

watch([selectedDate, selectedTime, endTime], () => {
  findAvailableVenues()
})

// Lifecycle
onMounted(() => {
  fetchVenues()
})
</script>

<template>
  <section id="venues-page" class="container page-section">
    <h1 class="section-title">Browse Venues</h1>

    <!-- Search and Filters -->
    <div class="search-filters">
      <div class="filter">
        <label for="venue-search">Search:</label>
        <input
            type="text"
            id="venue-search"
            v-model="searchQuery"
            placeholder="Search venues..."
        >
      </div>

      <div class="filter">
        <label for="venue-type">Category:</label>
        <select id="venue-type" v-model="selectedType">
          <option value="">All Categories</option>
          <option
              v-for="type in venueTypes"
              :key="type.value"
              :value="type.value"
          >
            {{ type.label }}
          </option>
        </select>
      </div>

      <div class="filter">
        <label for="venue-capacity">Capacity:</label>
        <select id="venue-capacity" v-model="selectedCapacity">
          <option value="">Any Capacity</option>
          <option value="small">Small (up to 20)</option>
          <option value="medium">Medium (21-50)</option>
          <option value="large">Large (51-100)</option>
          <option value="xl">Extra Large (100+)</option>
        </select>
      </div>

      <div class="filter">
        <label for="venue-handler">Handled By:</label>
        <select id="venue-handler" v-model="selectedHandledBy">
          <option value="">Any Handler</option>
          <option
              v-for="handler in handlerOptions"
              :key="handler.value"
              :value="handler.value"
          >
            {{ handler.label }}
          </option>
        </select>
      </div>

      <div class="filter">
        <label for="venue-location">Location:</label>
        <input
            type="text"
            id="venue-location"
            v-model="selectedLocation"
            placeholder="Filter by location..."
        >
      </div>

      <div class="filter">
        <label for="venue-date">Date:</label>
        <input
            type="date"
            id="venue-date"
            v-model="selectedDate"
            :min="new Date().toISOString().split('T')[0]"
        >
      </div>

      <div class="filter" v-if="selectedDate">
        <label for="start-time">Start Time:</label>
        <input
            type="time"
            id="start-time"
            v-model="selectedTime"
        >
      </div>

      <div class="filter" v-if="selectedTime">
        <label for="end-time">End Time:</label>
        <input
            type="time"
            id="end-time"
            v-model="endTime"
            :min="selectedTime"
        >
      </div>
    </div>

    <!-- View Controls -->
    <div class="list-controls">
      <div class="view-options">
        <button
            class="view-option"
            :class="{ active: currentView === 'grid' }"
            @click="currentView = 'grid'"
        >
          Grid
        </button>
        <button
            class="view-option"
            :class="{ active: currentView === 'list' }"
            @click="currentView = 'list'"
        >
          List
        </button>
      </div>

      <div class="sort-filter">
        <label for="venue-sort">Sort by:</label>
        <select id="venue-sort" v-model="sortBy">
          <option value="name">Name</option>
          <option value="capacity">Capacity</option>
          <option value="location">Location</option>
        </select>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <p>Loading venues...</p>
    </div>

    <!-- Error State -->
    <div v-if="error" class="error-state">
      <p>Error: {{ error }}</p>
      <button class="btn btn-primary" @click="fetchVenues()">Retry</button>
    </div>

    <!-- Venues Grid -->
    <div
        v-if="!loading && !error"
        class="venues-container"
        :class="{
        'venues-grid': currentView === 'grid',
        'venues-list': currentView === 'list'
      }"
    >
      <div
          v-for="venue in filteredAndSortedVenues"
          :key="venue.id"
          class="venue-card"
          :class="{ 'list-view': currentView === 'list' }"
      >
        <img
            src="@/assets/images/venuePic.jpeg"
            :alt="venue.name"
            class="venue-image"
        >

        <div class="venue-details">
          <h3 class="venue-title">{{ venue.name }}</h3>
          <p class="venue-location">📍 {{ venue.location }}</p>

          <div class="venue-handler">
            <span class="handler-badge">Handled by: {{ getHandlerLabel(venue.handled_by) }}</span>
          </div>

          <div class="venue-description" v-if="venue.description">
            <p>{{ venue.description }}</p>
          </div>

          <div class="venue-features">
            <span class="badge badge-primary">
              👥 {{ venue.capacity }} people
            </span>
            <span
                v-if="venue.category"
                class="badge badge-info"
            >
              {{ venue.category }}
            </span>
            <span
                v-for="feature in getFeatureBadges(venue)"
                :key="feature"
                class="badge badge-secondary"
            >
              {{ feature }}
            </span>
          </div>

          <!-- Requirements badges -->
          <div class="venue-requirements" v-if="getRequirementBadges(venue).length > 0">
            <span
                v-for="requirement in getRequirementBadges(venue)"
                :key="requirement"
                class="badge badge-warning"
            >
              {{ requirement }}
            </span>
          </div>

          <div class="venue-meta">
            <div class="venue-price">{{ formatPrice(venue) }} / day</div>
            <div class="venue-status">
              <span
                  class="status-badge"
                  :class="{
                  'available': venue.is_available,
                  'unavailable': !venue.is_available
                }"
              >
                {{ venue.is_available ? 'Available' : 'Unavailable' }}
              </span>
            </div>
          </div>

          <div class="venue-card-footer">
            <button
                class="btn btn-small btn-primary"
                :disabled="!venue.is_available"
                @click="handleBookVenue(venue)"
            >
              {{ venue.is_available ? 'Book Now' : 'Unavailable' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- No Results -->
    <div
        v-if="!loading && !error && filteredAndSortedVenues.length === 0"
        class="no-results"
    >
      <p>No venues found matching your criteria.</p>
      <button @click="clearAllFilters()" class="btn btn-secondary">
        Clear All Filters
      </button>
    </div>
  </section>
</template>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.section-title {
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 2rem;
  text-align: center;
  color: #333;
}

.search-filters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.filter {
  display: flex;
  flex-direction: column;
}

.filter label {
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #555;
}

.filter input,
.filter select {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
}

.filter input:focus,
.filter select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.list-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.view-options {
  display: flex;
  gap: 0.5rem;
}

.view-option {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  background: white;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.view-option:hover {
  background: #f8f9fa;
}

.view-option.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.sort-filter {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.venues-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.venues-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.venue-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
}

.venue-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.venue-card.list-view {
  display: flex;
  flex-direction: row;
}

.venue-card.list-view .venue-image {
  width: 200px;
  height: 150px;
  flex-shrink: 0;
}

.venue-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.venue-details {
  padding: 1.5rem;
  flex-grow: 1;
}

.venue-title {
  font-size: 1.25rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
  color: #333;
}

.venue-location {
  color: #666;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.venue-handler {
  margin-bottom: 1rem;
}

.handler-badge {
  background: #e9ecef;
  color: #495057;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
}

.venue-description {
  margin-bottom: 1rem;
  color: #555;
  font-size: 0.9rem;
  line-height: 1.4;
}

.venue-features,
.venue-requirements {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
}

.badge-primary {
  background: #007bff;
  color: white;
}

.badge-secondary {
  background: #6c757d;
  color: white;
}

.badge-info {
  background: #17a2b8;
  color: white;
}

.badge-warning {
  background: #ffc107;
  color: #856404;
}

.venue-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.venue-price {
  font-size: 1.1rem;
  font-weight: bold;
  color: #28a745;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-badge.available {
  background: #d4edda;
  color: #155724;
}

.status-badge.unavailable {
  background: #f8d7da;
  color: #721c24;
}

.venue-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #545b62;
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

.loading-state,
.error-state,
.no-results {
  text-align: center;
  padding: 3rem;
}

.error-state {
  color: #dc3545;
}

@media (max-width: 768px) {
  .search-filters {
    grid-template-columns: 1fr;
  }

  .list-controls {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .venues-grid {
    grid-template-columns: 1fr;
  }

  .venue-card.list-view {
    flex-direction: column;
  }

  .venue-card.list-view .venue-image {
    width: 100%;
    height: 200px;
  }
}
</style>