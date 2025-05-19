// composables/useProfile.js
import { computed } from 'vue'
import { useAuthStore } from '~/stores/auth'

export const useProfile = () => {
    const authStore = useAuthStore()

    // Computed properties
    const profile = computed(() => authStore.user)
    const isStudent = computed(() => authStore.isStudent)
    const isStaff = computed(() => authStore.isStaff)
    const studentType = computed(() => authStore.studentType)
    const email = computed(() => authStore.user?.email || '')
    const profilePicture = computed(() => authStore.user?.picture || '')

    // Student-specific data
    const studentProfile = computed(() => {
        if (!isStudent.value) return null
        return {
            studentId: authStore.user.student_id,
            // Add other student-specific fields (e.g., grade_level) when known
        }
    })

    // Staff-specific data
    const staffProfile = computed(() => {
        if (!isStaff.value) return null
        return {
            // Add staff-specific fields (e.g., employee_id, department) when known
        }
    })

    // Update profile
    const updateProfile = async (profileData) => {
        return await authStore.updateProfile(profileData)
    }

    return {
        profile,
        isStudent,
        isStaff,
        studentType,
        email,
        profilePicture,
        studentProfile,
        staffProfile,
        updateProfile
    }
}