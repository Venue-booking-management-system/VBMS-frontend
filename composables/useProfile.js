import { computed } from 'vue'
import { useAuthStore } from '~/stores/auth'

export const useProfile = () => {
    const authStore = useAuthStore()

    const profile = computed(() => authStore.user)
    const isStudent = computed(() => authStore.isStudent)
    const isStaff = computed(() => authStore.isStaff)
    const studentType = computed(() => authStore.studentType)
    const email = computed(() => authStore.user?.email || '')
    const profilePicture = computed(() => authStore.user?.profile_picture || '')

    const studentProfile = computed(() => {
        if (!isStudent.value) return null
        return {
            studentId: authStore.user.student_id,
            major: authStore.user.major,
            organization: authStore.user.organization,
            year: authStore.user.year,
        }
    })

    const staffProfile = computed(() => {
        if (!isStaff.value) return null
        return {
            staffId: authStore.user.staff_id,
            department: authStore.user.department,
            position: authStore.user.position,
        }
    })

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