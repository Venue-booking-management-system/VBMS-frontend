import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useVenueBookingStore = defineStore('venueBooking', () => {
    let venue = ref(null)
    const venueLoading = ref(false)
    const venueError = ref(null)

    const createdBookingId = ref(null)
    const bookingDraft = ref(null)
    const bookingCode = ref(null)
    const bookingForm = ref({
        title: '',
        description: '',
        date: '',
        timeSlot: '',
        customStartTime: '',
        customEndTime: '',
        attendeesCount: null,
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

    const uploadedFiles = ref([])
    const fileUploadProgress = ref({})

    const currentStep = ref(1)
    let formErrors = ref({})
    const stepLoading = ref({})
    const stepCompleted = ref({})

    const timeSlots = computed(() => [
        { value: 'custom', label: 'Custom Time Range' },
    ])

    const steps = computed(() => {
        const baseSteps = [
            { id: 1, title: 'Basic Information', required: true },
            { id: 2, title: 'Event Details', required: true },
        ]
        if (venue.value?.requires_documents) {
            baseSteps.push({ id: 3, title: 'Document Upload', required: true })
        }
        baseSteps.push({
            id: venue.value?.requires_documents ? 4 : 3,
            title: 'Review & Submit',
            required: true,
        })
        return baseSteps
    })

    const isStep1Valid = computed(() => {
        return (
            bookingForm.value.title &&
            bookingForm.value.date &&
            bookingForm.value.timeSlot &&
            bookingForm.value.attendeesCount &&
            (bookingForm.value.timeSlot !== 'custom' ||
                (bookingForm.value.customStartTime && bookingForm.value.customEndTime))
        )
    })

    const isStep2Valid = computed(() => {
        return eventDetailsForm.value.eventType && eventDetailsForm.value.purpose
    })

    const isStep3Valid = computed(() => {
        const isFileStep = steps.value.find((s) => s.id === 3)?.title === 'Document Upload'
        if (isFileStep && venue.value?.requires_documents) {
            return uploadedFiles.value.length > 0
        }
        return true
    })

    const canProceedToNextStep = computed(() => {
        switch (currentStep.value) {
            case 1:
                return isStep1Valid.value
            case 2:
                return isStep2Valid.value
            case 3:
                return isStep3Valid.value
            default:
                return true
        }
    })

    // Methods (actions)
    const resetForm = () => {
        bookingForm.value = {
            title: '',
            description: '',
            date: '',
            timeSlot: '',
            customStartTime: '',
            customEndTime: '',
            attendeesCount: null,
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
        uploadedFiles.value = []
        fileUploadProgress.value = {}
        currentStep.value = 1
        formErrors.value = {}
        stepLoading.value = {}
        stepCompleted.value = {}
        bookingCode.value = null
        createdBookingId.value = null
        bookingDraft.value = null
    }

    const setBookingData = (data) => {
        if (!data) {
            console.error('setBookingData: No data provided')
            return
        }
        createdBookingId.value = data.id || data.pk || null
        bookingCode.value = data.booking_code || data.code || null
        bookingDraft.value = { ...data }
        console.log('setBookingData output:', {
            createdBookingId: createdBookingId.value,
            bookingCode: bookingCode.value,
            bookingDraft: bookingDraft.value,
        })
    }
    return {
        venue,
        venueLoading,
        setBookingData,
        venueError,
        createdBookingId,
        bookingDraft,
        bookingForm,
        eventDetailsForm,
        uploadedFiles,
        fileUploadProgress,
        currentStep,
        formErrors,
        stepLoading,
        stepCompleted,
        timeSlots,
        steps,
        isStep1Valid,
        isStep2Valid,
        isStep3Valid,
        canProceedToNextStep,
        resetForm,
        bookingCode,
    }
})