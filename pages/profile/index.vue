<script>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useProfileStore } from '@/stores/profile'
import { useAxios } from '@/services/useAxios.js'
import profile from "~/pages/profile/index.vue";
// import { useAsyncData } from '#app';

export default {
  name: 'ProfilePage',
  computed: {
    profile() {
      return profile
    }
  },
  setup() {
    const profileStore = useProfileStore()
    const api = useAxios()

    const isEditMode = ref(false)
    const showSuccessMessage = ref(false)
    const imageUpload = ref(null)

    const uploadState = reactive({
      isUploading: false,
      preview: null,
      error: null
    })

    definePageMeta({
      middleware: ['auth'],
    })

    const formData = reactive({
      first_name: '',
      last_name: '',
      email: '',
      phone_number: '',
      profile: {
        bio: '',
        date_of_birth: '',
        gender: '',
        RoomNumber: '',
        student_id: '',
        major: '',
        organization: '',
        year: 1,
        staff_id: '',
        department: '',
        position: '',
      }
    })

    const hasChanges = computed(() => {
      if (!profileStore.user) return false

      const userFieldsChanged = [
        'first_name', 'last_name', 'email', 'phone_number'
      ].some(field => formData[field] !== (profileStore.user[field] || ''))

      const profileFieldsChanged = Object.keys(formData.profile).some(field => {
        const currentValue = formData.profile[field]
        const storedValue = profileStore.user.profile?.[field] || ''
        return currentValue !== storedValue
      })

      return userFieldsChanged || profileFieldsChanged
    })

    // Initialize form data from store
    // This function copies data from the store into our local form data
    const initializeFormData = () => {
      if (!profileStore.user) return

      // Copy user-level fields
      formData.first_name = profileStore.user.first_name || ''
      formData.last_name = profileStore.user.last_name || ''
      formData.email = profileStore.user.email || ''
      formData.phone_number = profileStore.user.phone_number || ''

      // Copy profile-level fields if profile exists
      if (profileStore.user.profile) {
        const profile = profileStore.user.profile
        formData.profile.bio = profile.bio || ''
        formData.profile.date_of_birth = profile.date_of_birth || ''
        formData.profile.gender = profile.gender || ''
        formData.profile.RoomNumber = profile.RoomNumber || ''
        formData.profile.student_id = profile.student_id || ''
        formData.profile.major = profile.major || ''
        formData.profile.organization = profile.organization || ''
        formData.profile.year = profile.year || 1
        formData.profile.staff_id = profile.staff_id || ''
        formData.profile.department = profile.department || ''
        formData.profile.position = profile.position || ''
      }
    }

    // Toggle between view and edit modes
    const toggleEditMode = () => {
      if (isEditMode.value && hasChanges.value) {
        // If leaving edit mode with unsaved changes, ask for confirmation
        if (confirm('You have unsaved changes. Are you sure you want to cancel?')) {
          isEditMode.value = false
          initializeFormData() // Reset form to original values
        }
      } else {
        isEditMode.value = !isEditMode.value
        if (isEditMode.value) {
          // Clear any existing errors when entering edit mode
          profileStore.clearError()
        }
      }
    }

    // Save profile changes to the server
    const saveProfile = async () => {
      try {
        // Prepare the update payload
        // We only send fields that have actually changed to be more efficient
        const updatePayload = {}

        // Check for user-level changes
        const userFields = ['first_name', 'last_name', 'email', 'phone_number']
        userFields.forEach(field => {
          if (formData[field] !== (profileStore.user[field] || '')) {
            updatePayload[field] = formData[field]
          }
        })

        // Check for profile-level changes
        const profileChanges = {}
        Object.keys(formData.profile).forEach(field => {
          const currentValue = formData.profile[field]
          const storedValue = profileStore.user.profile?.[field] || ''
          if (currentValue !== storedValue) {
            profileChanges[field] = currentValue
          }
        })

        // If there are profile changes, add them to the payload
        if (Object.keys(profileChanges).length > 0) {
          updatePayload.profile = profileChanges
        }

        // Only make API call if there are actual changes
        if (Object.keys(updatePayload).length === 0) {
          isEditMode.value = false
          return
        }

        // Call the store's update method
        await profileStore.updateProfile(updatePayload)

        // If successful, exit edit mode and show success message
        isEditMode.value = false
        showSuccessMessage.value = true

        // Hide success message after 3 seconds
        setTimeout(() => {
          showSuccessMessage.value = false
        }, 3000)

      } catch (error) {
        // The store already handles error, just log it here
        console.error('Failed to save profile:', error)
      }
    }

    // Handle profile image upload
    const openImageUpload = () => {
      if (imageUpload.value) {
        imageUpload.value.click()
      }
    }

    const handleImageUpload = async (event) => {
      const file = event.target.files?.[0]
      if (!file) return

      // Reset previous state
      uploadState.error = null

      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      if (!validTypes.includes(file.type)) {
        uploadState.error = 'Please select a valid image file (JPEG, PNG, GIF, or WebP).'
        return
      }

      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024
      if (file.size > maxSize) {
        uploadState.error = 'Image size must be less than 5MB.'
        return
      }

      try {
        // Create preview
        const previewUrl = URL.createObjectURL(file)
        uploadState.preview = previewUrl
        uploadState.isUploading = true

        // Create FormData for file upload
        const formData = new FormData()
        formData.append('profile_picture', file)

        // API call using axios (adjust endpoint as needed)
        const response = await api.put('/api/me/profile/picture/', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })

        // Handle successful upload
        console.log('Upload successful:', response.data)
        uploadState.isUploading = false
        uploadState.error = null

        // Update profile store with new image URL
        if (response.data.profile_picture) {
          const baseUrl = import.meta.env.NUXT_PUBLIC_BASE_URL || 'http://localhost:8000';
          const pictureUrl = response.data.profile_picture.startsWith('/media/')
              ? `${baseUrl}${response.data.profile_picture}`
              : response.data.profile_picture;
          profileStore.updateLocalUser({
            profile: {
              ...profileStore.user?.profile,
              profile_picture: pictureUrl
            }
          });
        }

        // Show success message
        showSuccessMessage.value = true
        setTimeout(() => {
          showSuccessMessage.value = false
        }, 3000)

      } catch (error) {
        console.error('Image upload failed:', error)
        uploadState.isUploading = false
        uploadState.error = error.response?.data?.message || 'Failed to upload image. Please try again.'
        uploadState.preview = null

        // Clean up preview URL on error
        if (uploadState.preview) {
          URL.revokeObjectURL(uploadState.preview)
        }
      }

      // Clear the input value to allow re-uploading the same file
      event.target.value = ''
    }

    // Handle image loading errors for preview/display
    const handleImageError = (event) => {
      // Set a fallback image or hide the image element
      event.target.src = '/images/default-avatar.png'
    }

    // Clean up preview URL when component unmounts or preview changes
    const cleanupPreview = () => {
      if (uploadState.preview) {
        URL.revokeObjectURL(uploadState.preview)
        uploadState.preview = null
      }
    }

    // Watch for preview changes to cleanup old URLs
    watch(() => uploadState.preview, (newPreview, oldPreview) => {
      if (oldPreview && oldPreview !== newPreview) {
        URL.revokeObjectURL(oldPreview)
      }
    })

    // Retry loading profile data
    const retryLoadProfile = async () => {
      try {
        await profileStore.fetchProfile()
      } catch (error) {
        console.error('Retry failed:', error)
      }
    }
    const profilePicture = ref(computed(() => profileStore.profilePicture));
    // Watch for changes in the store's user data and update form accordingly
    watch(
        () => profileStore.user,
        (newUser) => {
          if (newUser) {
            initializeFormData()
          }
        },
        { deep: true, immediate: true }
    )

    // Initialize component when mounted
    onMounted(async () => {
      profileStore.initialize()

      // If we don't have user data, try to fetch it
      if (!profileStore.user) {
        try {
          await profileStore.fetchProfile()
        } catch (error) {
          console.error('Failed to load profile:', error)
        }
      }
      cleanupPreview()
    })

    // Return everything that the template needs
    return {
      // Store reference
      profileStore,

      // Local state
      isEditMode,
      showSuccessMessage,
      formData,
      imageUpload,

      // Computed properties
      hasChanges,

      // Methods
      toggleEditMode,
      saveProfile,
      openImageUpload,
      handleImageUpload,
      handleImageError,
      retryLoadProfile
    }
  }
}
</script>
<template>
  <div class="profile-page">
    <!-- Loading State - Shows while fetching initial data -->
    <div v-if="profileStore.isLoading && !profileStore.user" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading your profile...</p>
    </div>

    <!-- Error State - Shows when there's an error and no cached data -->
    <div v-else-if="profileStore.hasError && !profileStore.user" class="error-container">
      <div class="error-message">
        <h3>Unable to load profile</h3>
        <p>{{ profileStore.error.message }}</p>
        <button class="retry-btn" @click="retryLoadProfile" >Try Again</button>
      </div>
    </div>

    <!-- Main Profile Content - Shows when we have user data -->
    <div v-else-if="profileStore.user" class="profile-content">
      <!-- Profile Header Section -->
      <div class="profile-header">
        <div class="profile-picture-section">
          <div class="profile-picture-container">
            <img
                :key="profileStore.profilePicture"
                :src="profileStore.profilePicture"
                :alt="`${profileStore.fullName}'s profile picture`"
                class="profile-picture"
                @error="handleImageError"
            />
            <div class="profile-picture-overlay">
              <button class="upload-btn" @click="openImageUpload">
                <span class="upload-icon">📷</span>
                Change Photo
              </button>
            </div>
          </div>
          <!-- Hidden file input for image upload -->
          <input
              ref="imageUpload"
              type="file"
              accept="image/*"
              style="display: none"
              @change="handleImageUpload"
          />
        </div>

        <div class="profile-info">
          <h1 class="profile-name">{{ profileStore.fullName }}</h1>
          <p class="profile-email">{{ profileStore.userEmail }}</p>
          <div class="profile-badges">
            <span :class="['user-type-badge', profileStore.userType]">
              {{ profileStore.userType }}
            </span>
          </div>

          <!-- Profile Completion Indicator -->
          <div class="completion-indicator">
            <div class="completion-text">
              Profile {{ profileStore.profileCompletionPercentage }}% complete
            </div>
            <div class="completion-bar">
              <div
                  class="completion-fill"
                  :style="{ width: profileStore.profileCompletionPercentage + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Edit Mode Toggle -->
      <div class="edit-controls">
        <button
            :class="['edit-toggle-btn', { active: isEditMode }]"
            :disabled="profileStore.isLoading"
            @click="toggleEditMode"
        >
          {{ isEditMode ? 'Cancel Edit' : 'Edit Profile' }}
        </button>

        <button
            v-if="isEditMode"
            :class="['save-btn', { loading: profileStore.isLoading }]"
            :disabled="!hasChanges || profileStore.isLoading"
            @click="saveProfile"
        >
          {{ profileStore.isLoading ? 'Saving...' : 'Save Changes' }}
        </button>
      </div>

      <!-- Error Display for Update Operations -->
      <div v-if="profileStore.hasError" class="update-error">
        <p class="error-text">{{ profileStore.error.message }}</p>
        <button class="dismiss-error" @click="profileStore.clearError">×</button>
      </div>

      <!-- Success Message -->
      <div v-if="showSuccessMessage" class="success-message">
        <p>Profile updated successfully!</p>
      </div>

      <!-- Profile Form -->
      <form class="profile-form" @submit.prevent="saveProfile" >
        <!-- Basic Information Section -->
        <div class="form-section">
          <h2 class="section-title">Basic Information</h2>

          <div class="form-row">
            <div class="form-field">
              <label for="firstName">First Name</label>
              <input
                  id="firstName"
                  v-model="formData.first_name"
                  type="text"
                  :disabled="!isEditMode"
                  :class="{ 'edit-mode': isEditMode }"
                  placeholder="Enter your first name"
              />
            </div>

            <div class="form-field">
              <label for="lastName">Last Name</label>
              <input
                  id="lastName"
                  v-model="formData.last_name"
                  type="text"
                  :disabled="!isEditMode"
                  :class="{ 'edit-mode': isEditMode }"
                  placeholder="Enter your last name"
              />
            </div>
          </div>

          <div class="form-field">
            <label for="email">Email Address</label>
            <input
                id="email"
                v-model="formData.email"
                type="email"
                :disabled="!isEditMode"
                :class="{ 'edit-mode': isEditMode }"
                placeholder="Enter your email address"
            />
          </div>

          <div class="form-field">
            <label for="phone">Phone Number</label>
            <input
                id="phone"
                v-model="formData.phone_number"
                type="tel"
                :disabled="!isEditMode"
                :class="{ 'edit-mode': isEditMode }"
                placeholder="Enter your phone number"
            />
          </div>
        </div>

        <!-- Profile Details Section -->
        <div class="form-section">
          <h2 class="section-title">Profile Details</h2>

          <div class="form-field">
            <label for="bio">Bio</label>
            <textarea
                id="bio"
                v-model="formData.profile.bio"
                :disabled="!isEditMode"
                :class="{ 'edit-mode': isEditMode }"
                placeholder="Tell us about yourself..."
                rows="4"
            ></textarea>
          </div>

          <div class="form-row">
            <div class="form-field">
              <label for="dateOfBirth">Date of Birth</label>
              <input
                  id="dateOfBirth"
                  v-model="formData.profile.date_of_birth"
                  type="date"
                  :disabled="!isEditMode"
                  :class="{ 'edit-mode': isEditMode }"
              />
            </div>

            <div class="form-field">
              <label for="gender">Gender</label>
              <select
                  id="gender"
                  v-model="formData.profile.gender"
                  :disabled="!isEditMode"
                  :class="{ 'edit-mode': isEditMode }"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Student-Specific Section (only shown for students) -->
        <div v-if="profileStore.isStudent" class="form-section">
          <h2 class="section-title">Academic Information</h2>

          <div class="form-row">
            <div class="form-field">
              <label for="studentId">Student ID</label>
              <input
                  id="studentId"
                  v-model="formData.profile.student_id"
                  type="text"
                  :disabled="!isEditMode"
                  :class="{ 'edit-mode': isEditMode }"
                  placeholder="Enter your student ID"
              />
            </div>

            <div class="form-field">
              <label for="year">Academic Year</label>
              <select
                  id="year"
                  v-model="formData.profile.year"
                  :disabled="!isEditMode"
                  :class="{ 'edit-mode': isEditMode }"
              >
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
              </select>
            </div>
          </div>

          <div class="form-field">
            <label for="major">Major</label>
            <input
                id="major"
                v-model="formData.profile.major"
                type="text"
                :disabled="!isEditMode"
                :class="{ 'edit-mode': isEditMode }"
                placeholder="Enter your major"
            />
          </div>

          <div class="form-field">
            <label for="organization">Organization</label>
            <input
                id="organization"
                v-model="formData.profile.organization"
                type="text"
                :disabled="!isEditMode"
                :class="{ 'edit-mode': isEditMode }"
                placeholder="Enter your organization"
            />
          </div>
          <div class="form-field">
            <label for="RoomNumber">Room Number</label>
            <input
                id="RoomNumber"
                v-model="formData.profile.RoomNumber"
                type="text"
                :disabled="!isEditMode"
                :class="{ 'edit-mode': isEditMode }"
                placeholder="Enter your Room Number"
            />
          </div>
        </div>
        <!-- Staff-specific form-->
        <div v-if="profileStore.isStaff" class="form-section">
          <h2 class="section-title">professional Information</h2>

          <div class="form-row">
            <div class="form-field">
              <label for="staffId">Staff ID</label>
              <input
                  id="staffId"
                  v-model="formData.profile.staff_id"
                  type="text"
                  :disabled="!isEditMode"
                  :class="{ 'edit-mode': isEditMode }"
                  placeholder="Enter your staff ID"
              />
            </div>

            <div class="form-field">
              <label for="department">Department</label>
              <select
                  id="department"
                  v-model="formData.profile.department"
                  :disabled="!isEditMode"
                  :class="{ 'edit-mode': isEditMode }"
              >
                <option value="PPK">PPK</option>
                <option value="SA">SA</option>
              </select>
            </div>
          </div>

          <div class="form-field">
            <label for="position">position</label>
            <input
                id="position"
                v-model="formData.profile.position"
                type="text"
                :disabled="!isEditMode"
                :class="{ 'edit-mode': isEditMode }"
                placeholder="Enter your position"
            />
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
/* Container and Layout Styles */
.profile-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

/* Loading State Styles */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Error State Styles */
.error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.error-message {
  text-align: center;
  padding: 2rem;
  background-color: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #dc3545;
}

.error-message h3 {
  color: #dc3545;
  margin: 0 0 1rem 0;
}

.retry-btn {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 1rem;
}

.retry-btn:hover {
  background-color: #0056b3;
}

/* Profile Header Styles */
.profile-header {
  display: flex;
  gap: 2rem;
  margin-bottom: 2rem;
  padding: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
}

.profile-picture-section {
  flex-shrink: 0;
}

.profile-picture-container {
  position: relative;
  width: 120px;
  height: 120px;
}

.profile-picture {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid rgba(255, 255, 255, 0.3);
}

.profile-picture-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 0 0 50px 50px;
  padding: 0.5rem;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.profile-picture-container:hover .profile-picture-overlay {
  opacity: 1;
}

.upload-btn {
  background: none;
  border: none;
  color: white;
  font-size: 0.75rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  width: 100%;
  justify-content: center;
}

.profile-info {
  flex: 1;
}

.profile-name {
  margin: 0 0 0.5rem 0;
  font-size: 2rem;
  font-weight: 300;
}

.profile-email {
  margin: 0 0 1rem 0;
  opacity: 0.9;
}

.user-type-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
  text-transform: capitalize;
  background-color: rgba(255, 255, 255, 0.2);
  margin-bottom: 1rem;
}

.completion-indicator {
  margin-top: 1rem;
}

.completion-text {
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
  opacity: 0.9;
}

.completion-bar {
  height: 8px;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  overflow: hidden;
}

.completion-fill {
  height: 100%;
  background-color: #28a745;
  transition: width 0.3s ease;
}

/* Edit Controls */
.edit-controls {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  justify-content: center;
}

.edit-toggle-btn, .save-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.edit-toggle-btn {
  background-color: #6c757d;
  color: white;
}

.edit-toggle-btn.active {
  background-color: #dc3545;
}

.edit-toggle-btn:hover {
  background-color: #5a6268;
}

.edit-toggle-btn.active:hover {
  background-color: #c82333;
}

.save-btn {
  background-color: #28a745;
  color: white;
}

.save-btn:hover:not(:disabled) {
  background-color: #218838;
}

.save-btn:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.save-btn.loading {
  background-color: #6c757d;
}

/* Message Styles */
.update-error {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f8d7da;
  color: #721c24;
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  border: 1px solid #f5c6cb;
}

.dismiss-error {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #721c24;
  padding: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.success-message {
  background-color: #d4edda;
  color: #155724;
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  border: 1px solid #c3e6cb;
  text-align: center;
}

/* Form Styles */
.profile-form {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.form-section {
  padding: 2rem;
  border-bottom: 1px solid #e9ecef;
}

.form-section:last-child {
  border-bottom: none;
}

.section-title {
  margin: 0 0 1.5rem 0;
  color: #495057;
  font-size: 1.25rem;
  font-weight: 600;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-field {
  margin-bottom: 1rem;
}

.form-field label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #495057;
}

.form-field input,
.form-field select,
.form-field textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e9ecef;
  border-radius: 6px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background-color: #f8f9fa;
}

.form-field input:disabled,
.form-field select:disabled,
.form-field textarea:disabled {
  background-color: #f8f9fa;
  color: #6c757d;
  cursor: not-allowed;
}

.form-field input.edit-mode,
.form-field select.edit-mode,
.form-field textarea.edit-mode {
  background-color: white;
  border-color: #007bff;
}

.form-field input.edit-mode:focus,
.form-field select.edit-mode:focus,
.form-field textarea.edit-mode:focus {
  outline: none;
  border-color: #0056b3;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.form-field textarea {
  resize: vertical;
  min-height: 100px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .profile-page {
    padding: 1rem;
  }

  .profile-header {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .edit-controls {
    flex-direction: column;
  }

  .form-section {
    padding: 1rem;
  }
}
</style>