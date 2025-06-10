<!-- pages/staff/venues/index.vue -->
<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAxios } from '~/services/useAxios.js'
import { useProfileStore } from '~/stores/profile.js'

definePageMeta({
  middleware: ['auth'],
  auth: true,
})

const router = useRouter()
const api = useAxios()
const { isStaff } = useProfileStore()

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

// Available venue types
const venueTypes = [
  { value: 'conference', label: 'Conference Room' },
  { value: 'auditorium', label: 'Auditorium' },
  { value: 'sports', label: 'Sports Field' },
  { value: 'classroom', label: 'Classroom' },
  { value: 'other', label: 'Other' },
]

// Handler options
const handlerOptions = [
  { value: 'sa', label: 'SA (Student Affairs)' },
  { value: 'ppk', label: 'PPK (Facility Management)' },
]

// Computed properties
const filteredAndSortedVenues = computed(() => {
  let result = [...venues.value]
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(
        (venue) =>
            venue.name.toLowerCase().includes(query) ||
            venue.description?.toLowerCase().includes(query) ||
            venue.location.toLowerCase().includes(query)
    )
  }
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

const hasActiveFilters = computed(() => {
  return (
      searchQuery.value ||
      selectedType.value ||
      selectedCapacity.value ||
      selectedHandledBy.value ||
      selectedLocation.value ||
      selectedDate.value ||
      selectedTime.value ||
      endTime.value
  )
})

// API functions
const fetchVenues = async () => {
  loading.value = true
  error.value = null
  try {
    const response = await api.get('/api/venues/')
    venues.value = response.data.results || response.data
  } catch (err) {
    error.value = err.response?.data?.detail || err.message
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
    venues.value = response.data.results || response.data
  } catch (err) {
    error.value = err.response?.data?.detail || err.message
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
    end_time: endTime.value,
  })
  try {
    const response = await api.get(`/api/venues/available/?${params}`)
    venues.value = response.data.results || response.data
  } catch (err) {
    error.value = err.response?.data?.detail || err.message
  } finally {
    loading.value = false
  }
}

// Utility functions
const formatPrice = (venue) => {
  if (venue.pricing_structure?.hourly) return `$${venue.pricing_structure.hourly} / hour`
  if (venue.pricing_structure?.daily) return `$${venue.pricing_structure.daily} / day`
  let basePrice = Math.floor(venue.capacity * 2.5)
  if (venue.requires_payment) basePrice *= 1.5
  if (venue.requires_approval) basePrice *= 1.2
  if (venue.requires_documents) basePrice *= 1.1
  return `$${Math.floor(basePrice)} / day`
}

const getFeatureBadges = (venue) => {
  if (!venue.features || typeof venue.features !== 'object') return []
  return Object.entries(venue.features)
      .filter(([_, value]) => value === true)
      .map(([key]) => key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' '))
      .slice(0, 5)
}

const getRequirementBadges = (venue) => {
  const requirements = []
  if (venue.requires_approval) requirements.push('Requires Approval')
  if (venue.requires_payment) requirements.push('Payment Required')
  if (venue.requires_documents) requirements.push('Documents Required')
  return requirements
}

const getHandlerLabel = (handlerCode) => {
  const handler = handlerOptions.find((h) => h.value === handlerCode)
  return handler ? handler.label : handlerCode
}

// Navigation functions
const handleViewVenueDetail = (venue) => {
  router.push(`/venues/${venue.id}`)
}

const handleBookVenue = (venue) => {
  router.push(`/venues/${venue.id}/book`)
}

const goToAddVenue = () => {
  router.push('/staff/venues/add')
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

// Debounced search
let searchTimeout = null
const performSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    if (selectedDate.value && selectedTime.value && endTime.value) {
      findAvailableVenues()
    } else if (hasActiveFilters.value) {
      searchVenues()
    } else {
      fetchVenues()
    }
  }, 300)
}

// Watchers
watch(
    [searchQuery, selectedType, selectedCapacity, selectedHandledBy, selectedLocation],
    performSearch
)
watch([selectedDate, selectedTime, endTime], findAvailableVenues)

// Lifecycle
onMounted(fetchVenues)
</script>

<template>
  <section id="venues-page" class="container page-section">
    <!-- Header with Add Venue Button -->
    <div class="header">
      <h1>Venues</h1>
      <button
          v-if="isStaff"
          class="btn btn-primary"
          @click="goToAddVenue"
          :disabled="loading"
      >
        Add New Venue
      </button>
    </div>

    <!-- Search and Filters -->
    <div class="search-filters">
      <div class="filter">
        <label for="venue-search">Search</label>
        <input
            id="venue-search"
            v-model="searchQuery"
            type="text"
            placeholder="Search venues..."
            :disabled="loading"
        />
      </div>
      <div class="filter">
        <label for="venue-type">Category</label>
        <select id="venue-type" v-model="selectedType" :disabled="loading">
          <option value="">All Categories</option>
          <option v-for="type in venueTypes" :key="type.value" :value="type.value">
            {{ type.label }}
          </option>
        </select>
      </div>
      <div class="filter">
        <label for="venue-capacity">Capacity</label>
        <select id="venue-capacity" v-model="selectedCapacity" :disabled="loading">
          <option value="">Any Capacity</option>
          <option value="small">Small (up to 20)</option>
          <option value="medium">Medium (21-50)</option>
          <option value="large">Large (51-100)</option>
          <option value="xl">Extra Large (100+)</option>
        </select>
      </div>
      <div class="filter">
        <label for="venue-handler">Handled By</label>
        <select id="venue-handler" v-model="selectedHandledBy" :disabled="loading">
          <option value="">Any Handler</option>
          <option v-for="handler in handlerOptions" :key="handler.value" :value="handler.value">
            {{ handler.label }}
          </option>
        </select>
      </div>
      <div class="filter">
        <label for="venue-location">Location</label>
        <input
            id="venue-location"
            v-model="selectedLocation"
            type="text"
            placeholder="Filter by location..."
            :disabled="loading"
        />
      </div>
      <div class="filter">
        <label for="venue-date">Date</label>
        <input
            id="venue-date"
            v-model="selectedDate"
            type="date"
            :min="new Date().toISOString().split('T')[0]"
            :disabled="loading"
        />
      </div>
      <div v-if="selectedDate" class="filter">
        <label for="start-time">Start Time</label>
        <input id="start-time" v-model="selectedTime" type="time" :disabled="loading" />
      </div>
      <div v-if="selectedTime" class="filter">
        <label for="end-time">End Time</label>
        <input
            id="end-time"
            v-model="endTime"
            type="time"
            :min="selectedTime"
            :disabled="loading"
        />
      </div>
      <div v-if="hasActiveFilters" class="filter filter-actions">
        <button
            @click="clearAllFilters"
            class="btn btn-secondary btn-small"
            :disabled="loading"
        >
          Clear Filters
        </button>
      </div>
    </div>

    <!-- Results Summary -->
    <div v-if="!loading && !error" class="results-summary">
      <p>{{ filteredAndSortedVenues.length }} venue{{ filteredAndSortedVenues.length !== 1 ? 's' : '' }} found</p>
    </div>

    <!-- View Controls -->
    <div class="list-controls">
      <div class="view-options">
        <button
            class="view-option"
            :class="{ active: currentView === 'grid' }"
            @click="currentView = 'grid'"
            aria-label="Grid view"
            :disabled="loading"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="1" y="1" width="6" height="6" rx="1" />
            <rect x="9" y="1" width="6" height="6" rx="1" />
            <rect x="1" y="9" width="6" height="6" rx="1" />
            <rect x="9" y="9" width="6" height="6" rx="1" />
          </svg>
          Grid
        </button>
        <button
            class="view-option"
            :class="{ active: currentView === 'list' }"
            @click="currentView = 'list'"
            aria-label="List view"
            :disabled="loading"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="2" y="3" width="12" height="2" rx="1" />
            <rect x="2" y="7" width="12" height="2" rx="1" />
            <rect x="2" y="11" width="12" height="2" rx="1" />
          </svg>
          List
        </button>
      </div>
      <div class="sort-filter">
        <label for="venue-sort">Sort by</label>
        <select id="venue-sort" v-model="sortBy" :disabled="loading">
          <option value="name">Name</option>
          <option value="capacity">Capacity</option>
          <option value="location">Location</option>
        </select>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading venues...</p>
    </div>

    <!-- Error State -->
    <div v-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <p>Error: {{ error }}</p>
      <button class="btn btn-primary" @click="fetchVenues" :disabled="loading">
        Retry
      </button>
    </div>

    <!-- Venues Display -->
    <div
        v-if="!loading && !error"
        class="venues-container"
        :class="{ 'venues-grid': currentView === 'grid', 'venues-list': currentView === 'list' }"
    >
      <div
          v-for="venue in filteredAndSortedVenues"
          :key="venue.id"
          class="venue-card"
          :class="{ 'list-view': currentView === 'list' }"
      >
        <div class="venue-image-container" @click="handleViewVenueDetail(venue)">
          <img
              src="@/assets/images/venuePic.jpeg"
              :alt="venue.name"
              class="venue-image"
              loading="lazy"
          />
          <div class="image-overlay">
            <span class="view-details-text">View Details</span>
          </div>
        </div>
        <div class="venue-details">
          <h3 class="venue-title" @click="handleViewVenueDetail(venue)">
            {{ venue.name }}
          </h3>
          <p class="venue-location">📍 {{ venue.location }}</p>
          <div class="venue-handler">
            <span class="handler-badge">Handled by: {{ getHandlerLabel(venue.handled_by) }}</span>
          </div>
          <div class="venue-description" v-if="venue.description">
            <p>{{ venue.description.substring(0, 100) }}...</p>
          </div>
          <div class="venue-features">
            <span class="badge badge-primary">👥 {{ venue.capacity }} people</span>
            <span v-if="venue.category" class="badge badge-info">
              {{ venueTypes.find((t) => t.value === venue.category)?.label || venue.category }}
            </span>
            <span
                v-for="feature in getFeatureBadges(venue)"
                :key="feature"
                class="badge badge-secondary"
            >
              {{ feature }}
            </span>
          </div>
          <div class="venue-requirements" v-if="getRequirementBadges(venue).length">
            <span
                v-for="requirement in getRequirementBadges(venue)"
                :key="requirement"
                class="badge badge-warning"
            >
              {{ requirement }}
            </span>
          </div>
          <div class="venue-meta">
            <div class="venue-price">{{ formatPrice(venue) }}</div>
            <div class="venue-status">
              <span
                  class="status-badge"
                  :class="{ available: venue.is_available, unavailable: !venue.is_available }"
              >
                {{ venue.is_available ? 'Available' : 'Unavailable' }}
              </span>
            </div>
          </div>
          <div class="venue-card-footer">
            <button
                class="btn btn-small btn-outline"
                @click="handleViewVenueDetail(venue)"
            >
              View Details
            </button>
            <button
                class="btn btn-small btn-primary"
                :disabled="!venue.is_available || loading"
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
      <div class="no-results-icon">🔍</div>
      <h3>No Venues Found</h3>
      <p>No venues match your current search criteria.</p>
      <button @click="clearAllFilters" class="btn btn-secondary" :disabled="loading">
        Clear Filters
      </button>
    </div>

    <!-- Empty State -->
    <div v-if="!loading && !error && !venues.length" class="empty-state">
      <div class="no-results-icon">🏛️</div>
      <h3>No Venues Available</h3>
      <p>Get started by adding your first venue.</p>
      <button
          v-if="isStaff"
          class="btn btn-primary"
          @click="goToAddVenue"
          :disabled="loading"
      >
        Add Your First Venue
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

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header h1 {
  font-size: 2.5rem;
  font-weight: bold;
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

.filter-actions {
  justify-content: flex-end;
  align-items: flex-end;
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

.results-summary {
  margin-bottom: 1rem;
  color: #666;
  font-size: 0.9rem;
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
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  background: white;
  cursor: pointer;
  border-radius: 4px;
}

.view-option:hover:not(.active):not(:disabled) {
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
}

.venue-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.venue-card.list-view {
  display: flex;
  flex-direction: row;
}

.venue-card.list-view .venue-image-container {
  flex-shrink: 0;
}

.venue-card.list-view .venue-image {
  width: 200px;
  height: 150px;
}

.venue-image-container {
  position: relative;
  cursor: pointer;
  overflow: hidden;
}

.venue-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.venue-image-container:hover .venue-image {
  transform: scale(1.05);
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
}

.venue-image-container:hover .image-overlay {
  opacity: 1;
}

.view-details-text {
  color: white;
  font-weight: 600;
  font-size: 1.1rem;
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
  cursor: pointer;
}

.venue-title:hover {
  color: #007bff;
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
}

.venue-description p {
  margin: 0;
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
  gap: 0.5rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  text-decoration: none;
  display: inline-block;
}

.btn-primary {
  background: #007bff;
  color: white;
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

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
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

.error-state {
  text-align: center;
  padding: 3rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
  border-radius: 8px;
}

.error-icon {
  font-size: 2rem;
}

.no-results,
.empty-state {
  text-align: center;
  padding: 3rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.no-results-icon {
  font-size: 3rem;
}

.no-results h3,
.empty-state h3 {
  margin-bottom: 0.5rem;
  color: #333;
}

.no-results p,
.empty-state p {
  color: #666;
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
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
  .venue-card-footer {
    flex-direction: column;
    gap: 0.5rem;
  }
  .venue-card-footer .btn {
    width: 100%;
  }
}
</style>