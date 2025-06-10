import { defineStore } from 'pinia'
import { useAxios } from '~/services/useAxios.js'

const API_ROUTES = {
    PROFILE: '/api/me/profile/',
    PROFILE_PICTURE: '/api/me/profile/picture/',
}

const STORAGE_KEYS = {
    USER: 'user'
}

export const useProfileStore = defineStore('profile', {
    state: () => ({
        user: null,
        loading: false,
        error: null,
        profilePictureTimestamp: Date.now(),
    }),

    getters: {
        isProfileLoaded: (state) => !!state.user,
        isLoading: (state) => state.loading,
        hasError: (state) => !!state.error,

        isStudent: (state) => state.user?.user_type === 'student',
        isStaff: (state) => state.user?.user_type === 'staff' || state.user?.is_staff,

        userEmail: (state) => state.user?.email || '',
        userId: (state) => state.user?.id || null,
        firstName: (state) => state.user?.first_name || '',
        lastName: (state) => state.user?.last_name || '',
        phoneNumber: (state) => state.user?.phone_number || '',

        fullName: (state) => {
            if (!state.user) return ''
            const { first_name, last_name } = state.user
            return `${first_name || ''} ${last_name || ''}`.trim() || 'User'
        },

        profile: (state) => state.user?.profile || null,
        profileId: (state) => state.user?.profile?.id || null,
        profilePicture:(state) => {
            const baseUrl = import.meta.env.NUXT_PUBLIC_BASE_URL || 'http://localhost:8000';
            const picture = state.user?.profile?.profile_picture;
            if (!picture) return '/images/default-avatar.png';
            return picture.startsWith('/media/')
                ? `${baseUrl}${picture}?t=${state.profilePictureTimestamp}`
                : picture;
        },
        bio: (state) => state.user?.profile?.bio || '',
        dateOfBirth: (state) => state.user?.profile?.date_of_birth || null,
        gender: (state) => state.user?.profile?.gender || null,

        // Student-specific profile fields
        studentId: (state) => state.user?.profile?.student_id || null,
        major: (state) => state.user?.profile?.major || null,
        organization: (state) => state.user?.profile?.organization || null,
        year: (state) => state.user?.profile?.year || 1,
        RoomNumber: (state) => state.user?.profile?.RoomNumber  || null,

        // staff-specific profile fields

        staffId: (state) => state.user?.profile?.staff_id || null,
        department: (state) => state.user?.profile?.department || null,
        position: (state) => state.user?.profile?.position || null,

        // Profile completion status - helps determine if user needs to complete their profile
        isProfileComplete: (state) => {
            const profile = state.user?.profile
            if (!profile) return false

            // Define what constitutes a complete profile based on your requirements
            const requiredFields = ['bio', 'date_of_birth', 'gender']
            const hasRequiredFields = requiredFields.every(field =>
                profile[field] && profile[field] !== null && profile[field] !== ''
            )

            // For students, also check student-specific fields
            if (state.user?.user_type === 'student') {
                return hasRequiredFields && profile.major && profile.organization && profile.RoomNumber;
            }
            if (state.user?.user_type === 'staff') {
                return hasRequiredFields && profile.staffId && profile.department && profile.position;
            }

            return hasRequiredFields
        },

        profileCompletionPercentage: (state) => {
            const profile = state.user?.profile
            if (!profile) return 0

            let totalFields = ['bio', 'date_of_birth', 'gender']
            if (state.user?.user_type === 'student') {
                totalFields = [...totalFields, 'student_id', 'major', 'organization', 'RoomNumber']
            }

            if (state.user?.user_type === 'staff') {
                totalFields = [...totalFields, 'staff_id', 'department', 'position']
            }

            const filledFields = totalFields.filter(field => {
                const value = profile[field]
                return value && value !== null && value !== ''
            }).length

            return Math.round((filledFields / totalFields.length) * 100)
        }
    },

    actions: {
        // Storage utility methods - these handle localStorage operations safely
        loadFromStorage() {
            this.user = this.getFromStorage(STORAGE_KEYS.USER, true)
        },

        getFromStorage(key, parseJson = false) {
            try {
                const value = localStorage.getItem(key)
                return parseJson && value ? JSON.parse(value) : value
            } catch (error) {
                console.warn(`Failed to parse stored data for key: ${key}`, error)
                return null
            }
        },

        saveToStorage(key, value) {
            try {
                const storableValue = typeof value === 'object' ? JSON.stringify(value) : value
                localStorage.setItem(key, storableValue)
            } catch (error) {
                console.warn(`Failed to save to localStorage for key: ${key}`, error)
            }
        },

        // Error handling - provides consistent error processing across all actions
        handleError(error) {
            this.loading = false
            const message = error.response?.data?.message || 'An unexpected error occurred'
            this.error = { message, details: error.response?.data || error }

            console.error('Profile store error:', this.error)
            return Promise.reject(this.error)
        },

        // Clear error state - useful for retry scenarios
        clearError() {
            this.error = null
        },

        // Fetch profile - gets the complete user profile from the API
        async fetchProfile() {
            this.loading = true
            this.error = null

            try {
                const api = useAxios()
                const response = await api.get(API_ROUTES.PROFILE)

                // Store the complete user object with nested profile
                // This preserves the original data structure from your API
                this.user = response.data

                // Save to localStorage for persistence across sessions
                this.saveToStorage(STORAGE_KEYS.USER, this.user)

                this.loading = false
                return this.user
            } catch (error) {
                return this.handleError(error)
            }
        },

        // Update profile - handles both user-level and profile-level updates
        async updateProfile(profileData) {
            this.loading = true
            this.error = null

            try {
                const api = useAxios()
                const response = await api.put(API_ROUTES.PROFILE, profileData)

                // The API should return the complete updated user object
                // Merge the response with existing user data to ensure we don't lose any fields
                this.user = {
                    ...this.user,
                    ...response.data
                }

                // If the response includes a nested profile, ensure it's properly merged
                if (response.data.profile) {
                    this.user.profile = {
                        ...this.user.profile,
                        ...response.data.profile
                    }
                }

                this.saveToStorage(STORAGE_KEYS.USER, this.user)
                this.loading = false

                return this.user
            } catch (error) {
                return this.handleError(error)
            }
        },

        // Update specific profile fields - useful for partial updates
        async updateProfileField(fieldName, value) {
            // Determine if this is a user-level or profile-level field
            const userLevelFields = ['first_name', 'last_name', 'email', 'phone_number']
            const isUserLevelField = userLevelFields.includes(fieldName)

            const updateData = isUserLevelField
                ? { [fieldName]: value }
                : { profile: { [fieldName]: value } }

            return await this.updateProfile(updateData)
        },

        updateLocalUser(userData) {
            if (!this.user) return;
            Object.keys(userData).forEach((key) => {
                if (key !== 'profile') {
                    this.user[key] = userData[key];
                }
            });
            if (userData.profile && this.user.profile) {
                this.user.profile = {
                    ...this.user.profile,
                    ...userData.profile,
                };
                this.profilePictureTimestamp = Date.now(); // Update timestamp for cache-busting
            }
            this.saveToStorage(STORAGE_KEYS.USER, this.user);
        },
        // Clear profile - useful for logout scenarios
        clearProfile() {
            this.user = null
            this.loading = false
            this.error = null
            localStorage.removeItem(STORAGE_KEYS.USER)
        },

        // Set user data directly - useful when receiving user data from login
        setUser(userData) {
            this.user = userData
            this.saveToStorage(STORAGE_KEYS.USER, this.user)
        },

        // Initialize store - called when the app starts
        initialize() {
            // Check if we're in a browser environment before accessing localStorage
            if (typeof localStorage === 'undefined') return

            this.loadFromStorage()

            // If we have stored user data but it's stale, you might want to refresh it
            // This is optional and depends on your app's requirements
            if (this.user && this.shouldRefreshProfile()) {
                this.fetchProfile().catch(error => {
                    console.warn('Failed to refresh profile on initialization:', error)
                })
            }
        },

        // Helper method to determine if profile should be refreshed
        shouldRefreshProfile() {
            // You could implement logic here to check if the stored data is too old
            // For example, check a timestamp and refresh if it's older than X minutes
            // This is a placeholder - implement based on your needs
            return false
        }
    }
})