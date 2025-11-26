<!-- src/components/features/user/profile/UserAvatarUpload.vue -->
<script setup lang="ts">
/**
 * UserAvatarUpload - Модалка загрузки аватара
 * Визуальный стиль из старого UserView.vue (showEditModalImage)
 */

import { ref, watch } from 'vue'
import { useCurrentUser } from '@/composables/api/useUserProfile'
import { useToast } from '@/composables/ui/useToast'
import BaseLoader from '@/components/ui/BaseLoader.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import MediaErrorDialog from '@/components/ui/MediaErrorDialog.vue'

export interface UserAvatarUploadProps {
  modelValue: boolean
}

const props = defineProps<UserAvatarUploadProps>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'uploaded'): void
}>()

const { uploadAvatar } = useCurrentUser()
const { success, warning } = useToast()

// State
const imageFile = ref<File | null>(null)
const imagePreview = ref<string | null>(null)
const isUploading = ref(false)
const showError = ref(false)

// Reset on close
watch(
  () => props.modelValue,
  (isOpen) => {
    if (!isOpen) {
      imageFile.value = null
      imagePreview.value = null
    }
  },
)

function close() {
  emit('update:modelValue', false)
}

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) return

  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/gif',
    'image/webp',
    'image/png',
    'image/bmp',
  ]

  if (!allowedTypes.includes(file.type)) {
    warning('Please select a valid image file (.jpg, .jpeg, .gif, .webp, .png, .bmp).')
    return
  }

  imageFile.value = file

  // Create preview
  const reader = new FileReader()
  reader.onload = (e) => {
    imagePreview.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

async function handleUpload() {
  if (!imageFile.value) return

  try {
    isUploading.value = true
    await uploadAvatar(imageFile.value)
    success('Avatar updated!')
    emit('uploaded')
    close()
  } catch (error: any) {
    if (error?.response?.status === 415) {
      showError.value = true
    } else {
      warning('Failed to upload avatar')
    }
  } finally {
    isUploading.value = false
  }
}
</script>

<template>
  <!-- Error dialog -->
  <MediaErrorDialog v-model="showError" />

  <!-- Modal -->
  <Transition name="fade">
    <div
      v-if="modelValue"
      class="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-6"
      @click.self="close"
    >
      <div class="bg-white rounded-xl shadow-xl max-w-md w-full p-8 relative ml-20">
        <!-- Loading -->
        <div v-if="isUploading" class="flex items-center justify-center min-h-[150px]">
          <BaseLoader variant="spinner" size="lg" color="red" />
        </div>

        <!-- Form -->
        <div v-else class="flex flex-col items-center justify-center gap-5">
          <div class="flex flex-col items-center w-full">
            <label for="imageProfile" class="block mb-2 text-sm font-medium text-gray-700">
              Your Profile Image (.jpg, .jpeg, .gif, .webp, .png, .bmp)
            </label>
            <input
              type="file"
              id="imageProfile"
              accept=".jpg,.jpeg,.gif,.webp,.png,.bmp"
              @change="handleFileSelect"
              class="block w-full text-sm text-gray-900 border border-gray-300 rounded-3xl cursor-pointer bg-gray-50 focus:outline-none focus:ring-1 focus:ring-red-500"
            />

            <!-- Preview -->
            <img
              v-if="imagePreview"
              :src="imagePreview"
              alt="Preview"
              class="mt-4 rounded-full w-32 h-32 object-cover border-4 border-gray-300"
              style="
                box-shadow:
                  0 0 15px rgba(255, 255, 255, 0.8),
                  0 0 30px rgba(255, 255, 255, 0.6);
              "
            />
          </div>

          <!-- Buttons -->
          <div class="flex space-x-4 mt-4">
            <BaseButton variant="ghost" @click="close"> Cancel </BaseButton>
            <BaseButton variant="primary" :disabled="!imageFile" @click="handleUpload">
              Update
            </BaseButton>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
