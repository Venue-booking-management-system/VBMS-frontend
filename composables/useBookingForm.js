import { ref, computed, watch } from 'vue'
import { useAxios } from '~/services/useAxios.js'
import { useRouter } from 'vue-router'

export function useBookingForm(venueId, venue) {
    const router = useRouter()
    const api = useAxios()

    // Reactive form data
    const bookingForm = ref({
        title: '',
        description: '',
        date: '',
        startTime: '',
        endTime: '',
        attendeesCount: 1,
        timeSlot: '',
        customStartTime: '',
        customEndTime: '',
    })

    const eventDetailsForm = ref({
        eventType: '',
        purpose: '',
        equipmentNeeded: '',
        specialRequests: '',
        organizerName: '',
        organizerContact: '',
        eventSchedule: '',
        budget: null,
    })

    const files = ref([])
    const formErrors = ref({})
    const bookingLoading = ref(false)
    const bookingError = ref(null)
    const bookingSuccess = ref(false)
    const bookingId = ref(null)

    // Time slot options
    const timeSlots = [
        { value: 'custom', label: 'Custom Time Range' },
    ]

    // Form validation
    const validateForm = () => {
        const errors = {}

        if (!bookingForm.value.title) errors.title = 'Event title is required'
        if (!bookingForm.value.date) errors.date = 'Date is required'
        else {
            const selectedDate = new Date(bookingForm.value.date)
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            if (selectedDate < today) errors.date = 'Cannot book for past dates'
        }

        if (!bookingForm.value.attendeesCount || bookingForm.value.attendeesCount < 1)
            errors.attendeesCount = 'Number of attendees is required'
        else if (venue.value && bookingForm.value.attendeesCount > venue.value.capacity)
            errors.attendeesCount = `Cannot exceed venue capacity of ${venue.value.capacity}`

        if (bookingForm.value.timeSlot === 'custom') {
            if (!bookingForm.value.customStartTime) errors.customStartTime = 'Start time is required'
            if (!bookingForm.value.customEndTime) errors.customEndTime = 'End time is required'
            if (bookingForm.value.customStartTime && bookingForm.value.customEndTime) {
                if (bookingForm.value.customStartTime >= bookingForm.value.customEndTime)
                    errors.customEndTime = 'End time must be after start time'
            }
        } else if (!bookingForm.value.timeSlot) errors.timeSlot = 'Time slot is required'

        if (!eventDetailsForm.value.eventType) errors.eventType = 'Event type is required'
        if (!eventDetailsForm.value.purpose) errors.purpose = 'Purpose is required'

        if (venue.value?.documents_required && files.value.length === 0)
            errors.files = 'At least one document is required'

        formErrors.value = errors
        return Object.keys(errors).length === 0
    }

    // Computed property for form validity
    const isBookingFormValid = computed(() => {
        const hasRequiredFields =
            bookingForm.value.title &&
            bookingForm.value.date &&
            bookingForm.value.attendeesCount > 0 &&
            eventDetailsForm.value.eventType &&
            eventDetailsForm.value.purpose

        const hasValidTimes = bookingForm.value.timeSlot === 'custom'
            ? bookingForm.value.customStartTime && bookingForm.value.customEndTime
            : bookingForm.value.timeSlot

        return hasRequiredFields && hasValidTimes && Object.keys(formErrors.value).length === 0
    })

    // Handle time slot changes
    const handleTimeSlotChange = () => {
        if (bookingForm.value.timeSlot && bookingForm.value.timeSlot !== 'custom') {
            const [start, end] = bookingForm.value.timeSlot.split('-')
            bookingForm.value.startTime = start
            bookingForm.value.endTime = end
            bookingForm.value.customStartTime = ''
            bookingForm.value.customEndTime = ''
        } else if (bookingForm.value.timeSlot === 'custom') {
            bookingForm.value.startTime = ''
            bookingForm.value.endTime = ''
        }

        if (formErrors.value.timeSlot) delete formErrors.value.timeSlot
        if (formErrors.value.customStartTime) delete formErrors.value.customStartTime
        if (formErrors.value.customEndTime) delete formErrors.value.customEndTime
    }

    // Handle custom time changes
    const handleCustomTimeChange = () => {
        if (bookingForm.value.customStartTime && bookingForm.value.customEndTime) {
            bookingForm.value.startTime = bookingForm.value.customStartTime
            bookingForm.value.endTime = bookingForm.value.customEndTime
        }

        if (formErrors.value.customStartTime) delete formErrors.value.customStartTime
        if (formErrors.value.customEndTime) delete formErrors.value.customEndTime
    }

    // File upload handler
    const handleFileUpload = (event) => {
        const uploadedFiles = Array.from(event.target.files)
        files.value = [...files.value, ...uploadedFiles]
        if (formErrors.value.files) delete formErrors.value.files
    }

    // Remove file
    const removeFile = (index) => {
        files.value.splice(index, 1)
    }

    // Submit booking
    const submitBooking = async () => {
        if (!validateForm()) return

        bookingLoading.value = true
        bookingError.value = null
        bookingSuccess.value = false

        try {
            // Prepare booking data
            const startDateTime = new Date(`${bookingForm.value.date}T${bookingForm.value.startTime}:00`)
            const endDateTime = new Date(`${bookingForm.value.date}T${bookingForm.value.endTime}:00`)

            const bookingData = {
                venue: venueId,
                title: bookingForm.value.title,
                description: bookingForm.value.description,
                start_time: startDateTime.toISOString(),
                end_time: endDateTime.toISOString(),
                attendees_count: bookingForm.value.attendeesCount,
            }

            // Create booking
            const bookingResponse = await api.post('/api/bookings/', bookingData)
            bookingId.value = bookingResponse.data.id

            // Submit event details
            const eventDetailsData = {
                event_type: eventDetailsForm.value.eventType,
                purpose: eventDetailsForm.value.purpose,
                equipment_needed: eventDetailsForm.value.equipmentNeeded,
                special_requests: eventDetailsForm.value.specialRequests,
                organizer_name: eventDetailsForm.value.organizerName,
                organizer_contact: eventDetailsForm.value.organizerContact,
                event_schedule: eventDetailsForm.value.eventSchedule,
                budget: eventDetailsForm.value.budget,
            }

            await api.post(`/api/bookings/${bookingId.value}/event-details/`, eventDetailsData)

            // Upload files
            if (files.value.length > 0) {
                const formData = new FormData()
                files.value.forEach((file, index) => {
                    formData.append(`file_${index}`, file)
                    formData.append(`file_name_${index}`, file.name)
                    formData.append(`file_type_${index}`, file.type)
                    formData.append(`document_type_${index}`, 'other') // Adjust based on UI selection if needed
                })

                await api.post(`/api/bookings/${bookingId.value}/files/`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                })
            }

            bookingSuccess.value = true
            setTimeout(() => {
                router.push(`/bookings/${bookingId.value}`)
            }, 2000)
        } catch (err) {
            bookingError.value = err.response?.data?.message || 'Booking failed'
            if (err.response?.data) {
                const apiErrors = {}
                Object.keys(err.response.data).forEach((field) => {
                    apiErrors[field] = Array.isArray(err.response.data[field])
                        ? err.response.data[field][0]
                        : err.response.data[field]
                })
                formErrors.value = { ...formErrors.value, ...apiErrors }
            }
        } finally {
            bookingLoading.value = false
        }
    }

    // Reset form
    const resetForm = () => {
        bookingForm.value = {
            title: '',
            description: '',
            date: '',
            startTime: '',
            endTime: '',
            attendeesCount: 1,
            timeSlot: '',
            customStartTime: '',
            customEndTime: '',
        }
        eventDetailsForm.value = {
            eventType: '',
            purpose: '',
            equipmentNeeded: '',
            specialRequests: '',
            organizerName: '',
            organizerContact: '',
            eventSchedule: '',
            budget: null,
        }
        files.value = []
        formErrors.value = {}
        bookingError.value = null
        bookingSuccess.value = false
    }

    // Watch attendees count for validation
    watch(() => bookingForm.value.attendeesCount, () => {
        if (formErrors.value.attendeesCount) validateForm()
    })

    return {
        bookingForm,
        eventDetailsForm,
        files,
        formErrors,
        bookingLoading,
        bookingError,
        bookingSuccess,
        bookingId,
        timeSlots,
        isBookingFormValid,
        handleTimeSlotChange,
        handleCustomTimeChange,
        handleFileUpload,
        removeFile,
        submitBooking,
        resetForm,
    }
}