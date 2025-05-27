import { ref, watch } from 'vue'
import { useAxios } from '~/services/useAxios'

export function useBookings() {
    const axios = useAxios()
    const bookings = ref([])
    const errors = ref({})

    // Fetch bookings
    async function fetchBookings() {
        try {
            const response = await axios.get('/api/bookings/')
            bookings.value = response.data
            return response.data
        } catch (error) {
            errors.value.bookings = error.response?.data || 'Failed to fetch bookings'
            throw error
        }
    }

    // Cancel booking
    async function cancelBooking(bookingId) {
        try {
            await axios.post(`/api/bookings/${bookingId}/cancel/`)
            await fetchBookings()
        } catch (error) {
            errors.value.cancel = error.response?.data || 'Failed to cancel booking'
            throw error
        }
    }

    return {
        bookings,
        errors,
        fetchBookings,
        cancelBooking
    }
}
