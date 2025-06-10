<script setup>
import { useRoute, useRouter } from 'vue-router'
import { useAxios } from '~/services/useAxios.js'
import { useVenueBookingStore } from '~/stores/venueBooking'
import { watch } from 'vue'
import { useProfileStore } from '~/stores/profile.js'

const route = useRoute()
const router = useRouter()
const venueId = route.params.id
const api = useAxios()
const store = useVenueBookingStore()

const userId = useProfileStore().user?.id

const fetchVenue = async () => {
  store.venueLoading = true
  store.venueError = null
  try {
    const response = await api.get(`/api/venues/${venueId}/`)
    store.venue = response.data
  } catch (err) {
    console.error('fetchVenue Error:', err.response?.status, err.response?.data)
    if (err.response?.status === 404) {
      store.venueError = `Venue with ID ${venueId} not found. Please check the venue ID or contact support.`
    } else {
      store.venueError = err.response?.data?.detail || err.message || 'Failed to load venue details.'
    }
    await router.push('/venues')
  } finally {
    store.venueLoading = false
  }
}
const saveBasicBooking = async () => {
  if (!store.isStep1Valid) {
    store.formErrors = {
      title: !store.bookingForm.title ? 'Event Title is required.' : '',
      date: !store.bookingForm.date ? 'Event Date is required.' : '',
      attendeesCount: !store.bookingForm.attendeesCount ? 'Number of Attendees is required.' : '',
      customStartTime: !store.bookingForm.customStartTime ? 'Start Time is required.' : '',
      customEndTime: !store.bookingForm.customEndTime ? 'End Time is required.' : '',
    }
    return false
  }
  if (!store.venue) {
    store.formErrors = { general: 'Cannot save booking: Venue details are not loaded.' }
    return false
  }
  store.stepLoading[1] = true
  store.formErrors = {}
  try {
    const date = store.bookingForm.date
    const startTime = store.bookingForm.customStartTime
    const endTime = store.bookingForm.customEndTime
    const startDateTime = new Date(`${date}T${startTime}:00+08:00`).toISOString()
    const endDateTime = new Date(`${date}T${endTime}:00+08:00`).toISOString()

    const bookingData = {
      user: userId,
      venue_id: venueId,
      title: store.bookingForm.title,
      description: store.bookingForm.description,
      date: store.bookingForm.date,
      start_time: startDateTime,
      end_time: endDateTime,
      attendees_count: store.bookingForm.attendeesCount,
      status: 'draft',
    }
    console.log('Sending bookingData:', bookingData)
    let response;
    if (store.createdBookingId) {
      response = await api.put(`/api/bookings/${store.createdBookingId}/`, bookingData)
    } else {
      response = await api.post('/api/bookings/', bookingData)
    }
    console.log('API response:', response.data)
    store.setBookingData(response.data)
    store.stepCompleted[1] = true
    return true
  } catch (err) {
    console.error('saveBasicBooking Error:', err.response?.status, err.response?.data)
    if (err.response?.status === 404) {
      store.formErrors = { venue_id: `Venue with ID ${venueId} not found.` }
    } else if (err.response?.status === 400) {
      store.formErrors = err.response?.data || { general: 'Invalid booking data.' }
    } else {
      store.formErrors = { general: err.message || 'Failed to save booking.' }
    }
    return false
  } finally {
    store.stepLoading[1] = false
  }
}

const saveEventDetails = async () => {
  if (!store.isStep2Valid) {
    store.formErrors = {
      eventType: !store.eventDetailsForm.eventType ? 'Event Type is required.' : '',
      purpose: !store.eventDetailsForm.purpose ? 'Event purpose is required.' : '',
    }
    return false
  }
  if (!store.createdBookingId) {
    console.error('saveEventDetails: No createdBookingId', {
      createdBookingId: store.createdBookingId,
      bookingDraft: store.bookingDraft,
    })
    store.formErrors = { general: 'Cannot save event details: Booking ID not found.' }
    return false
  }
  store.stepLoading[2] = true
  store.formErrors = {}
  try {
    const eventData = {
      booking: store.createdBookingId,
      event_type: store.eventDetailsForm.eventType,
      purpose: store.eventDetailsForm.purpose,
      equipment_needed: store.eventDetailsForm.equipmentNeeded || '',
      special_requests: store.eventDetailsForm.specialRequests || '',
      organizer_name: store.eventDetailsForm.organizerName || '',
      organizer_contact: store.eventDetailsForm.organizerContact || '',
      event_schedule: store.eventDetailsForm.eventSchedule || '',
      budget: store.eventDetailsForm.budget || 0,
    }
    console.log('Sending eventData:', eventData)
    await api.post(`/api/bookings/${store.createdBookingId}/event-details/`, eventData)
    store.stepCompleted[2] = true
    return true
  } catch (err) {
    console.error('saveEventDetails Error:', err.response?.status, err.response?.data)
    store.formErrors = err.response?.data || { general: err.message || 'Failed to save event details.' }
    return false
  } finally {
    store.stepLoading[2] = false
  }
}

const handleFileUpload = async (event) => {
  if (!store.createdBookingId) {
    store.formErrors = { files: 'Please complete the basic booking information first.' }
    return
  }
  const selectedFiles = Array.from(event.target.files)
  for (const file of selectedFiles) {
    await uploadSingleFile(file)
  }
}

const uploadSingleFile = async (file) => {
  const fileId = Date.now() + Math.random()
  store.fileUploadProgress[fileId] = 0
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('document_type', 'general')
    const response = await api.post(
        `/api/bookings/${store.createdBookingId}/files/`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            store.fileUploadProgress[fileId] = progress
          },
        }
    )
    store.uploadedFiles.push({
      id: response.data.id,
      name: file.name,
      size: file.size,
      tempId: fileId,
    })
    delete store.fileUploadProgress[fileId]
  } catch (err) {
    store.formErrors = {
      files: `Failed to upload ${file.name}: ${err.response?.data?.detail || err.message}`,
    }
    delete store.fileUploadProgress[fileId]
  }
}

const removeUploadedFile = async (fileIndex) => {
  const fileToRemove = store.uploadedFiles[fileIndex]
  try {
    await api.delete(`/api/bookings/${store.createdBookingId}/files/${fileToRemove.id}/`)
    store.uploadedFiles.splice(fileIndex, 1)
  } catch (err) {
    store.formErrors = { files: `Failed to remove file: ${err.message}` }
  }
}

const submitFinalBooking = async () => {
  if (!store.createdBookingId) return false
  store.stepLoading[store.currentStep] = true
  try {
    await api.put(`/api/bookings/${store.createdBookingId}/status/`, {
      status: 'pending',
    })
    await router.push(`/bookings/${store.createdBookingId}`)
    store.resetForm()
    return true
  } catch (err) {
    store.formErrors = { general: err.response?.data?.detail || err.message }
    return false
  } finally {
    store.stepLoading[store.currentStep] = false
  }
}

const nextStep = async () => {
  let canProceed = false
  switch (store.currentStep) {
    case 1:
      canProceed = await saveBasicBooking()
      break
    case 2:
      canProceed = await saveEventDetails()
      break
    case 3:
      if (store.venue?.requires_documents && store.uploadedFiles.length === 0) {
        store.formErrors = { files: 'Please upload at least one document.' }
        canProceed = false
      } else {
        store.stepCompleted[3] = true
        canProceed = true
      }
      break
    default:
      canProceed = true
  }
  if (canProceed && store.currentStep < store.steps.length) {
    store.currentStep++
    store.formErrors = {}
  }
}

const prevStep = () => {
  if (store.currentStep > 1) {
    store.currentStep--
    store.formErrors = {}
  }
}

const handleFinalSubmit = async () => {
  await submitFinalBooking()
}

const handleTimeSlotChange = () => {
  if (store.bookingForm.timeSlot !== 'custom') {
    store.bookingForm.customStartTime = ''
    store.bookingForm.customEndTime = ''
  }
}

watch([() => store.bookingForm, () => store.eventDetailsForm], () => {
  store.formErrors = {}
}, { deep: true })

fetchVenue()
</script>

<template>
  <section class="container page-section">
    <h1>Book Venue: {{ store.venue?.name || 'Loading...' }}</h1>

    <!-- Loading and Error States -->
    <div v-if="store.venueLoading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading venue details...</p>
    </div>
    <div v-if="store.venueError" class="error-state">
      <div class="error-icon">⚠️</div>
      <h3>Failed to Load Venue</h3>
      <p>{{ store.venueError }}</p>
      <button class="btn btn-primary" @click="fetchVenue">Try Again</button>
    </div>

    <!-- Booking Form -->
    <div v-if="!store.venueLoading && !store.venueError && store.venue" class="booking-form">
      <!-- Step Navigation -->
      <div class="step-nav">
        <div
            v-for="step in store.steps"
            :key="step.id"
            class="step"
            :class="{
            active: store.currentStep === step.id,
            completed: store.stepCompleted[step.id],
            loading: store.stepLoading[step.id],
          }"
        >
          <div class="step-indicator">
            <span v-if="store.stepCompleted[step.id]" class="step-check">✓</span>
            <span v-else-if="store.stepLoading[step.id]" class="step-spinner"></span>
            <span v-else>{{ step.id }}</span>
          </div>
          <span class="step-title">{{ step.title }}</span>
        </div>
      </div>

      <!-- General Error Message -->
      <div v-if="store.formErrors.general" class="alert alert-error">
        <div class="error-icon">❌</div>
        <p>{{ store.formErrors.general }}</p>
      </div>

      <!-- Draft Booking Confirmation -->
      <div v-if="store.createdBookingId && store.bookingDraft" class="alert alert-info">
        <div class="info-icon">ℹ️</div>
        <div>
          <p><strong>Draft Booking Created</strong></p>
          <p>Booking Code: {{ store.bookingCode || 'Generating...' }}</p>
          <p>Booking ID: #{{ store.createdBookingId }}</p>
          <p>Your booking is being saved as you complete each step.</p>
        </div>
      </div>

      <form @submit.prevent="handleFinalSubmit">
        <!-- Step 1: Basic Booking Information -->
        <div v-if="store.currentStep === 1">
          <h2>Basic Booking Information</h2>
          <p class="step-description">
            Let's start with the essential details for your booking. This information will be saved immediately.
          </p>

          <div class="form-group">
            <label for="booking-title">Event Title *</label>
            <input
                id="booking-title"
                v-model="store.bookingForm.title"
                type="text"
                class="form-control"
                :class="{ 'error': store.formErrors.title }"
                placeholder="e.g., Annual Conference"
                maxlength="255"
                required
            />
            <div v-if="store.formErrors.title" class="field-error">{{ store.formErrors.title }}</div>
          </div>

          <div class="form-group">
            <label for="booking-description">Brief Description</label>
            <textarea
                id="booking-description"
                v-model="store.bookingForm.description"
                class="form-control"
                rows="3"
                placeholder="Brief description of the event..."
                maxlength="500"
            ></textarea>
            <small class="form-help">{{ 500 - (store.bookingForm.description?.length || 0) }} characters remaining</small>
          </div>

          <div class="form-group">
            <label for="booking-date">Event Date *</label>
            <input
                id="booking-date"
                v-model="store.bookingForm.date"
                type="date"
                class="form-control"
                :class="{ 'error': store.formErrors.date }"
                :min="new Date().toISOString().split('T')[0]"
                required
            />
            <div v-if="store.formErrors.date" class="field-error">{{ store.formErrors.date }}</div>
          </div>

          <div class="form-group">
            <label for="booking-time-slot">Time Slot *</label>
            <select
                id="booking-time-slot"
                v-model="store.bookingForm.timeSlot"
                class="form-control"
                :class="{ 'error': store.formErrors.timeSlot }"
                required
                @change="handleTimeSlotChange"
            >
              <option value="">Select time slot</option>
              <option v-for="slot in store.timeSlots" :key="slot.value" :value="slot.value">
                {{ slot.label }}
              </option>
            </select>
            <div v-if="store.formErrors.timeSlot" class="field-error">{{ store.formErrors.timeSlot }}</div>
          </div>

          <div v-if="store.bookingForm.timeSlot === 'custom'" class="time-inputs">
            <div class="form-group">
              <label for="custom-start-time">Start Time *</label>
              <input
                  type="time"
                  id="custom-start-time"
                  v-model="store.bookingForm.customStartTime"
                  class="form-control"
                  :class="{ 'error': store.formErrors.customStartTime }"
                  required
              />
              <div v-if="store.formErrors.customStartTime" class="field-error">{{ store.formErrors.customStartTime }}</div>
            </div>
            <div class="form-group">
              <label for="custom-end-time">End Time *</label>
              <input
                  type="time"
                  id="custom-end-time"
                  v-model="store.bookingForm.customEndTime"
                  class="form-control"
                  :class="{ 'error': store.formErrors.customEndTime }"
                  :min="store.bookingForm.customStartTime"
                  required
              />
              <div v-if="store.formErrors.customEndTime" class="field-error">{{ store.formErrors.customEndTime }}</div>
            </div>
          </div>

          <div class="form-group">
            <label for="booking-attendees">Expected Number of Attendees *</label>
            <input
                type="number"
                id="booking-attendees"
                v-model.number="store.bookingForm.attendeesCount"
                class="form-control"
                :class="{ 'error': store.formErrors.attendeesCount }"
                :min="1"
                :max="store.venue.capacity"
                required
            />
            <small class="form-help">Maximum capacity: {{ store.venue.capacity }} people</small>
            <div v-if="store.formErrors.attendeesCount" class="field-error">{{ store.formErrors.attendeesCount }}</div>
          </div>
        </div>

        <!-- Step 2: Event Details -->
        <div v-if="store.currentStep === 2">
          <h2>Event Details</h2>
          <p class="step-description">
            Now let's add detailed information about your event. These details help us better understand your needs.
          </p>

          <div class="form-group">
            <label for="event-type">Event Type *</label>
            <input
                type="text"
                id="event-type"
                v-model="store.eventDetailsForm.eventType"
                class="form-control"
                :class="{ 'error': store.formErrors.eventType }"
                placeholder="e.g., Conference, Workshop, Football Match"
                required
            />
            <div v-if="store.formErrors.eventType" class="field-error">{{ store.formErrors.eventType }}</div>
          </div>

          <div class="form-group">
            <label for="event-purpose">Purpose of Event *</label>
            <textarea
                id="event-purpose"
                v-model="store.eventDetailsForm.purpose"
                class="form-control"
                :class="{ 'error': store.formErrors.purpose }"
                rows="3"
                placeholder="Describe the purpose and goals of your event..."
                required
            ></textarea>
            <div v-if="store.formErrors.purpose" class="field-error">{{ store.formErrors.purpose }}</div>
          </div>

          <div class="form-group">
            <label for="equipment-needed">Equipment Needed</label>
            <textarea
                id="equipment-needed"
                v-model="store.eventDetailsForm.equipmentNeeded"
                class="form-control"
                rows="3"
                placeholder="e.g., Projector, Microphone, Tables, Chairs"
            ></textarea>
          </div>

          <div class="form-group">
            <label for="special-requests">Special Requests</label>
            <textarea
                id="special-requests"
                v-model="store.eventDetailsForm.specialRequests"
                class="form-control"
                rows="3"
                placeholder="Any special requirements or accommodations needed..."
            ></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="organizer-name">Organizer Name</label>
              <input
                  type="text"
                  id="organizer-name"
                  v-model="store.eventDetailsForm.organizerName"
                  class="form-control"
                  placeholder="Primary event organizer"
              />
            </div>

            <div class="form-group">
              <label for="organizer-contact">Organizer Contact</label>
              <input
                  type="text"
                  id="organizer-contact"
                  v-model="store.eventDetailsForm.organizerContact"
                  class="form-control"
                  placeholder="Email or phone number"
              />
            </div>
          </div>

          <div class="form-group">
            <label for="event-schedule">Detailed Event Schedule</label>
            <textarea
                id="event-schedule"
                v-model="store.eventDetailsForm.eventSchedule"
                class="form-control"
                rows="4"
                placeholder="Provide a detailed timeline of your event..."
            ></textarea>
          </div>

          <div class="form-group">
            <label for="budget">Estimated Budget</label>
            <input
                type="number"
                id="budget"
                v-model.number="store.eventDetailsForm.budget"
                class="form-control"
                placeholder="Estimated budget (optional)"
                min="0"
            />
            <small class="form-help">This helps us suggest appropriate services and options</small>
          </div>
        </div>

        <!-- Step 3: File Upload (if required) -->
        <div v-if="store.currentStep === 3 && store.venue.requires_documents">
          <h2>Document Upload</h2>
          <p class="step-description">
            Please upload the required documents. Files will be uploaded immediately and you can add more as needed.
          </p>

          <div class="form-group">
            <label for="booking-files">Upload Required Documents *</label>
            <input
                type="file"
                id="booking-files"
                multiple
                class="form-control"
                @change="handleFileUpload"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            />
            <small class="form-help">
              Required documents: {{ store.venue.required_document_types?.join(', ') || 'Various documents' }}
            </small>
            <small class="form-help">
              Accepted formats: PDF, Word documents, Images (JPG, PNG)
            </small>
            <div v-if="store.formErrors.files" class="field-error">{{ store.formErrors.files }}</div>
          </div>

          <!-- File Upload Progress -->
          <div v-if="Object.keys(store.fileUploadProgress).length" class="upload-progress">
            <h4>Uploading Files...</h4>
            <div v-for="(progress, fileId) in store.fileUploadProgress" :key="fileId" class="progress-bar">
              <div class="progress-fill" :style="{ width: progress + '%' }"></div>
              <span class="progress-text">{{ progress }}%</span>
            </div>
          </div>

          <!-- Uploaded Files List -->
          <div v-if="store.uploadedFiles.length" class="uploaded-files">
            <h4>Uploaded Documents</h4>
            <div v-for="(file, index) in store.uploadedFiles" :key="file.id" class="file-item">
              <div class="file-info">
                <span class="file-name">{{ file.name }}</span>
                <span class="file-size">({{ Math.round(file.size / 1024) }} KB)</span>
                <span class="file-status success">✓ Uploaded</span>
              </div>
              <button
                  type="button"
                  class="btn btn-small btn-danger"
                  @click="removeUploadedFile(index)"
              >
                Remove
              </button>
            </div>
          </div>
        </div>

        <!-- Final Step: Review & Submit -->
        <div v-if="store.currentStep === store.steps[store.steps.length - 1].id">
          <h2>Review & Submit</h2>
          <p class="step-description">
            Please review all your booking details before final submission. Once submitted, your booking will be reviewed by our team.
          </p>

          <div class="review-section">
            <h3>Booking Summary</h3>
            <div class="review-grid">
              <div class="review-item">
                <strong>Booking Code:</strong>
                <span>{{ store.bookingCode || 'N/A' }}</span>
              </div>
              <div class="review-item">
                <strong>Venue:</strong>
                <span>{{ store.venue.name }}</span>
              </div>
              <div class="review-item">
                <strong>Event Title:</strong>
                <span>{{ store.bookingForm.title }}</span>
              </div>
              <div class="review-item">
                <strong>Date:</strong>
                <span>{{ store.bookingForm.date }}</span>
              </div>
              <div class="review-item">
                <strong>Time:</strong>
                <span>
                  {{ store.bookingForm.timeSlot === 'custom'
                    ? `${store.bookingForm.customStartTime} - ${store.bookingForm.customEndTime}`
                    : store.bookingForm.timeSlot }}
                </span>
              </div>
              <div class="review-item">
                <strong>Attendees:</strong>
                <span>{{ store.bookingForm.attendeesCount }} people</span>
              </div>
              <div class="review-item">
                <strong>Event Type:</strong>
                <span>{{ store.eventDetailsForm.eventType }}</span>
              </div>
              <div v-if="store.venue.requires_documents" class="review-item">
                <strong>Uploaded Documents:</strong>
                <span>{{ store.uploadedFiles.length }} file(s)</span>
              </div>
            </div>
          </div>

          <div class="booking-notes">
            <h4>Important Notes:</h4>
            <ul>
              <li>All bookings are subject to approval and availability confirmation</li>
              <li v-if="store.venue.requires_approval">This venue requires additional approval which may take 2-3 business days</li>
              <li v-if="store.venue.requires_payment">Payment will be required upon booking confirmation</li>
              <li>You will receive email updates about your booking status</li>
            </ul>
          </div>
        </div>

        <!-- Navigation Buttons -->
        <div class="form-actions">
          <button
              type="button"
              class="btn btn-outline"
              @click="prevStep"
              :disabled="store.currentStep === 1 || Object.values(store.stepLoading).some(loading => loading)"
          >
            Previous
          </button>
          <button
              v-if="store.currentStep < store.steps.length"
              type="button"
              class="btn btn-primary"
              @click="nextStep"
              :disabled="!store.canProceedToNextStep || store.stepLoading[store.currentStep]"
          >
            <span v-if="store.stepLoading[store.currentStep]" class="loading-spinner small"></span>
            {{ store.stepLoading[store.currentStep] ? 'Saving...' : 'Save & Continue' }}
          </button>
          <button
              v-if="store.currentStep === store.steps.length"
              type="submit"
              class="btn btn-primary btn-submit"
              :disabled="store.stepLoading[store.currentStep]"
          >
            <span v-if="store.stepLoading[store.currentStep]" class="loading-spinner small"></span>
            {{ store.stepLoading[store.currentStep] ? 'Submitting...' : 'Submit Booking Request' }}
          </button>
        </div>
      </form>
    </div>
  </section>
</template>

<style scoped>
.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.page-section {
  margin-bottom: 2rem;
}

.loading-state,
.error-state {
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

.loading-spinner.small {
  width: 16px;
  height: 16px;
  border-width: 2px;
  margin-right: 8px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-state {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #991b1b;
}

.error-icon {
  font-size: 2rem;
}

/* Step Navigation Styles */
.step-nav {
  display: flex;
  justify-content: space-between;
  margin-bottom: 2rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  position: relative;
  padding: 0.5rem;
  transition: all 0.3s ease;
}

.step:not(:last-child)::after {
  content: '';
  position: absolute;
  top: 20px;
  right: -50%;
  width: 100%;
  height: 2px;
  background: #e2e8f0;
  z-index: 1;
}

.step.completed:not(:last-child)::after {
  background: #10b981;
}

.step-indicator {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  position: relative;
  z-index: 2;
  transition: all 0.3s ease;
  background: white;
  border: 2px solid #e2e8f0;
  color: #64748b;
}

.step.active .step-indicator {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}

.step.completed .step-indicator {
  background: #10b981;
  border-color: #10b981;
  color: white;
}

.step.loading .step-indicator {
  background: #f59e0b;
  border-color: #f59e0b;
  color: white;
}

.step-check {
  font-size: 1.2rem;
  font-weight: bold;
}

.step-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.step-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748b;
  text-align: center;
  transition: color 0.3s ease;
}

.step.active .step-title {
  color: #3b82f6;
  font-weight: 600;
}

.step.completed .step-title {
  color: #10b981;
  font-weight: 600;
}

/* Alert Styles */
.alert {
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.alert-error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
}

.alert-info {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1e40af;
}

.info-icon {
  font-size: 1.25rem;
  margin-top: 0.125rem;
}

/* Form Styles */
.booking-form {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.step-description {
  color: #64748b;
  margin-bottom: 2rem;
  line-height: 1.6;
  font-size: 1rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group label {
  display: block;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.form-control {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s ease;
  background: white;
  box-sizing: border-box;
}

.form-control:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-control.error {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.form-control:disabled {
  background: #f9fafb;
  color: #9ca3af;
  cursor: not-allowed;
}

.form-help {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: #6b7280;
  line-height: 1.4;
}

.field-error {
  color: #ef4444;
  font-size: 0.75rem;
  margin-top: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.field-error::before {
  content: '⚠';
  font-size: 0.875rem;
}

/* Time Input Styles */
.time-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-top: 1rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

/* File Upload Styles */
.upload-progress {
  margin: 1rem 0;
  padding: 1rem;
  background: #f0f9ff;
  border-radius: 8px;
  border: 1px solid #bae6fd;
}

.upload-progress h4 {
  margin: 0 0 1rem 0;
  color: #0369a1;
  font-size: 0.875rem;
  font-weight: 600;
}

.progress-bar {
  position: relative;
  height: 8px;
  background: #e0f2fe;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #0ea5e9, #0284c7);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  position: absolute;
  top: -20px;
  right: 0;
  font-size: 0.75rem;
  color: #0369a1;
  font-weight: 600;
}

.uploaded-files {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #f0fdf4;
  border-radius: 8px;
  border: 1px solid #bbf7d0;
}

.uploaded-files h4 {
  margin: 0 0 1rem 0;
  color: #166534;
  font-size: 0.875rem;
  font-weight: 600;
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: white;
  border-radius: 6px;
  margin-bottom: 0.5rem;
  border: 1px solid #dcfce7;
}

.file-item:last-child {
  margin-bottom: 0;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.file-name {
  font-weight: 500;
  color: #374151;
}

.file-size {
  color: #6b7280;
  font-size: 0.875rem;
}

.file-status.success {
  color: #059669;
  font-weight: 600;
  font-size: 0.875rem;
}

/* Review Section Styles */
.review-section {
  background: #f8fafc;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 1px solid #e2e8f0;
}

.review-section h3 {
  margin: 0 0 1.5rem 0;
  color: #1e293b;
  font-size: 1.25rem;
  font-weight: 600;
}

.review-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.review-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.review-item strong {
  color: #374151;
  font-weight: 600;
}

.review-item span {
  color: #1f2937;
  text-align: right;
  flex: 1;
  margin-left: 1rem;
}

.price-highlight {
  font-weight: 700;
  color: #059669;
  font-size: 1.1rem;
}

.booking-notes {
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.booking-notes h4 {
  margin: 0 0 1rem 0;
  color: #92400e;
  font-size: 1rem;
  font-weight: 600;
}

.booking-notes ul {
  margin: 0;
  padding-left: 1.25rem;
  color: #78350f;
  line-height: 1.6;
}

.booking-notes li {
  margin-bottom: 0.5rem;
}

/* Button Styles */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.875rem;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
  min-height: 44px;
  gap: 0.5rem;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.btn-primary {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
  border-color: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn-outline {
  background: transparent;
  color: #374151;
  border-color: #d1d5db;
}

.btn-outline:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #9ca3af;
}

.btn-danger {
  background: #ef4444;
  color: white;
  border-color: #ef4444;
}

.btn-danger:hover:not(:disabled) {
  background: #dc2626;
  border-color: #dc2626;
}

.btn-small {
  padding: 0.5rem 1rem;
  font-size: 0.75rem;
  min-height: 32px;
}

.btn-submit {
  background: linear-gradient(135deg, #10b981, #059669);
  border-color: #10b981;
  font-size: 1rem;
  padding: 1rem 2rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.btn-submit:hover:not(:disabled) {
  background: linear-gradient(135deg, #059669, #047857);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
}

/* Form Actions */
.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e2e8f0;
  gap: 1rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .container {
    padding: 1rem;
  }

  .booking-form {
    padding: 1.5rem;
  }

  .step-nav {
    flex-direction: column;
    gap: 1rem;
  }

  .step {
    flex-direction: row;
    justify-content: flex-start;
    text-align: left;
  }

  .step:not(:last-child)::after {
    display: none;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .time-inputs {
    grid-template-columns: 1fr;
  }

  .review-grid {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column-reverse;
    gap: 1rem;
  }

  .form-actions .btn {
    width: 100%;
  }

  .review-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .review-item span {
    text-align: left;
    margin-left: 0;
  }
}
</style>