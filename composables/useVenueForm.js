import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAxios } from '~/services/useAxios.js'

export function useVenueForm() {
  const router = useRouter()
  const api = useAxios()

  // Form data
  const venueForm = ref({
    name: '',
    description: '',
    location: '',
    capacity: 1,
    category: '',
    handled_by: 'sa',
    requires_payment: false,
    requires_approval: true,
    requires_documents: false,
    required_document_types: [],
    pricing_structure: { hourly: null, daily: null },
    features: {
      wifi: false,
      projector: false,
      sound_system: false,
      parking: false,
      catering: false,
    },
  })

  // Available document types
  const documentTypes = ref([
    { value: 'dean_approval', label: 'Dean Approval' },
    { value: 'budget_plan', label: 'Budget Plan' },
    { value: 'event_schedule', label: 'Event Schedule' },
    { value: 'payment_proof', label: 'Payment Proof' },
    { value: 'permission_letter', label: 'Permission Letter' },
    { value: 'venue_setup', label: 'Venue Setup Plan' },
    { value: 'other', label: 'Other Document' },
  ])

  // Form state
  const formErrors = ref({})
  const loading = ref(false)
  const error = ref(null)

  // Validate form
  const validateForm = () => {
    const errors = {}
    if (!venueForm.value.name.trim()) errors.name = 'Venue name is required'
    if (!venueForm.value.location.trim()) errors.location = 'Location is required'
    if (!venueForm.value.capacity || venueForm.value.capacity < 1) {
      errors.capacity = 'Capacity must be at least 1'
    }
    if (venueForm.value.requires_payment) {
      if (!venueForm.value.pricing_structure.hourly && !venueForm.value.pricing_structure.daily) {
        errors.pricing_structure = 'At least one pricing option (hourly or daily) is required'
      } else {
        if (venueForm.value.pricing_structure.hourly && venueForm.value.pricing_structure.hourly < 0) {
          errors.pricing_structure = 'Hourly rate cannot be negative'
        }
        if (venueForm.value.pricing_structure.daily && venueForm.value.pricing_structure.daily < 0) {
          errors.pricing_structure = 'Daily rate cannot be negative'
        }
      }
    }
    if (venueForm.value.requires_documents && venueForm.value.required_document_types.length === 0) {
      errors.required_document_types = 'At least one document type is required'
    }
    formErrors.value = errors
    return Object.keys(errors).length === 0
  }

  // Submit venue
  const submitVenue = async () => {
    if (!validateForm()) return
    loading.value = true
    error.value = null
    try {
      await api.post('/api/venues/', venueForm.value)
      router.push('/venues')
    } catch (err) {
      error.value = err.response?.data?.detail || err.message
      if (err.response?.data) {
        formErrors.value = { ...formErrors.value, ...err.response.data }
      }
    } finally {
      loading.value = false
    }
  }

  // Reset form
  const resetForm = () => {
    venueForm.value = {
      name: '',
      description: '',
      location: '',
      capacity: 1,
      category: '',
      handled_by: 'sa',
      requires_payment: false,
      requires_approval: true,
      requires_documents: false,
      required_document_types: [],
      pricing_structure: { hourly: null, daily: null },
      features: {
        wifi: false,
        projector: false,
        sound_system: false,
        parking: false,
        catering: false,
      },
    }
    formErrors.value = {}
    error.value = null
  }

  // Toggle document type
  const toggleDocumentType = (docType) => {
    const index = venueForm.value.required_document_types.indexOf(docType)
    if (index === -1) {
      venueForm.value.required_document_types.push(docType)
    } else {
      venueForm.value.required_document_types.splice(index, 1)
    }
  }

  return {
    venueForm,
    documentTypes,
    formErrors,
    loading,
    error,
    validateForm,
    submitVenue,
    resetForm,
    toggleDocumentType,
  }
}