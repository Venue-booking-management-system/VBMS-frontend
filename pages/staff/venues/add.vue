<script setup>
import { useRouter } from 'vue-router'
import { useVenueForm } from '~/composables/useVenueForm.js'

definePageMeta({
  middleware: ['staff'],
})

const router = useRouter()
const {
  venueForm,
  documentTypes,
  formErrors,
  loading,
  error,
  validateForm,
  submitVenue,
  resetForm,
  toggleDocumentType,
} = useVenueForm()

// Computed property for dynamic submit button text
const submitText = computed(() => (loading.value ? 'Submitting...' : 'Add Venue'))
</script>

<template>
  <section class="container page-section">
    <h1>Add New Venue</h1>

    <!-- Error State -->
    <div v-if="error" class="alert alert-error">
      <div class="error-icon">❌</div>
      <p>{{ error }}</p>
    </div>

    <form @submit.prevent="submitVenue">
      <!-- Venue Details -->
      <h2>Venue Details</h2>
      <div class="form-group">
        <label for="venue-name">Venue Name *</label>
        <input
            type="text"
            id="venue-name"
            v-model="venueForm.name"
            class="form-control"
            :class="{ 'error': formErrors.name }"
            placeholder="e.g., Main Hall"
            maxlength="255"
            required
        />
        <div v-if="formErrors.name" class="field-error">{{ formErrors.name }}</div>
      </div>

      <div class="form-group">
        <label for="venue-description">Description</label>
        <textarea
            id="venue-description"
            v-model="venueForm.description"
            class="form-control"
            rows="4"
            placeholder="Describe the venue..."
            maxlength="500"
        ></textarea>
        <small class="form-help">{{ 500 - (venueForm.description?.length || 0) }} characters remaining</small>
      </div>

      <div class="form-group">
        <label for="venue-location">Location *</label>
        <input
            type="text"
            id="venue-location"
            v-model="venueForm.location"
            class="form-control"
            :class="{ 'error': formErrors.location }"
            placeholder="e.g., Building A, Room 101"
            maxlength="255"
            required
        />
        <div v-if="formErrors.location" class="field-error">{{ formErrors.location }}</div>
      </div>

      <div class="form-group">
        <label for="venue-capacity">Capacity *</label>
        <input
            type="number"
            id="venue-capacity"
            v-model.number="venueForm.capacity"
            class="form-control"
            :class="{ 'error': formErrors.capacity }"
            min="1"
            required
        />
        <small class="form-help">Maximum number of attendees</small>
        <div v-if="formErrors.capacity" class="field-error">{{ formErrors.capacity }}</div>
      </div>

      <div class="form-group">
        <label for="venue-category">Category</label>
        <select
            id="venue-category"
            v-model="venueForm.category"
            class="form-control"
        >
          <option value="">Select category</option>
          <option value="conference">Conference Room</option>
          <option value="auditorium">Auditorium</option>
          <option value="sports">Sports Field</option>
          <option value="classroom">Classroom</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div class="form-group">
        <label for="handled-by">Handled By *</label>
        <select
            id="handled-by"
            v-model="venueForm.handled_by"
            class="form-control"
            required
        >
          <option value="sa">SA (Student Affairs)</option>
          <option value="ppk">PPK (Facility Management)</option>
        </select>
      </div>

      <!-- Requirements -->
      <h2>Requirements</h2>
      <div class="form-group">
        <label>Booking Requirements</label>
        <div class="checkbox-group">
          <label>
            <input type="checkbox" v-model="venueForm.requires_payment" />
            Requires Payment
          </label>
          <label>
            <input type="checkbox" v-model="venueForm.requires_approval" />
            Requires Approval
          </label>
          <label>
            <input type="checkbox" v-model="venueForm.requires_documents" />
            Requires Documents
          </label>
        </div>
      </div>

      <div v-if="venueForm.requires_payment" class="form-group">
        <label>Pricing Structure *</label>
        <div class="pricing-inputs">
          <div>
            <label for="hourly-price">Hourly Rate ($)</label>
            <input
                type="number"
                id="hourly-price"
                v-model.number="venueForm.pricing_structure.hourly"
                class="form-control"
                placeholder="e.g., 10"
                min="0"
                step="0.01"
            />
          </div>
          <div>
            <label for="daily-price">Daily Rate ($)</label>
            <input
                type="number"
                id="daily-price"
                v-model.number="venueForm.pricing_structure.daily"
                class="form-control"
                placeholder="e.g., 100"
                min="0"
                step="0.01"
            />
          </div>
        </div>
        <div v-if="formErrors.pricing_structure" class="field-error">{{ formErrors.pricing_structure }}</div>
        <small class="form-help">Enter at least one rate (hourly or daily)</small>
      </div>

      <div v-if="venueForm.requires_documents" class="form-group">
        <label>Required Document Types *</label>
        <div class="checkbox-group">
          <label v-for="docType in documentTypes" :key="docType.value">
            <input
                type="checkbox"
                :value="docType.value"
                :checked="venueForm.required_document_types.includes(docType.value)"
                @change="toggleDocumentType(docType.value)"
            />
            {{ docType.label }}
          </label>
        </div>
        <div v-if="formErrors.required_document_types" class="field-error">{{ formErrors.required_document_types }}</div>
      </div>

      <!-- Features -->
      <h2>Features</h2>
      <div class="form-group">
        <label>Available Features</label>
        <div class="checkbox-group">
          <label v-for="(value, key) in venueForm.features" :key="key">
            <input type="checkbox" v-model="venueForm.features[key]" />
            {{ key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' ') }}
          </label>
        </div>
      </div>

      <!-- Form Actions -->
      <div class="form-actions">
        <button
            type="button"
            class="btn btn-outline"
            @click="resetForm"
            :disabled="loading"
        >
          Reset
        </button>
        <button
            type="submit"
            class="btn btn-primary"
            :disabled="loading"
        >
          <span v-if="loading" class="loading-spinner small"></span>
          {{ submitText }}
        </button>
      </div>
    </form>
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

h2 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #333;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-control {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.form-control.error {
  border-color: #dc3545;
}

.field-error {
  color: #dc3545;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.form-help {
  font-size: 0.875rem;
  color: #666;
  margin-top: 0.25rem;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.pricing-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}

.btn-outline {
  padding: 0.5rem 1rem;
  border: 1px solid #007bff;
  color: #007bff;
  background: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-outline:hover {
  background: #e9ecef;
}

.btn-primary {
  padding: 0.5rem 1rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-primary:hover {
  background-color: #0056b3;
}

.btn-primary:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
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
  font-size: 2rem;
}
</style>