<!-- src/components/features/users/profile/UserAvatarUpload.vue -->
<script setup lang="ts">
/**
 * UserAvatarUpload - Модалка загрузки аватара
 * ✅ ИСПРАВЛЕНО: использует useFileUpload
 */

import { watch, computed } from 'vue'
import { useFileUpload } from '@/composables/features/useFileUpload'
import { useCurrentUser } from '@/composables/api/useUserProfile'
import { useToast } from '@/composables/ui/useToast'
import { useScrollLock } from '@/composables/utils/useScrollLock'
import { ALLOWED_IMAGE_TYPES } from '@/utils/constants'
import BaseLoader from '@/components/ui/BaseLoader.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

export interface UserAvatarUploadProps {
  modelValue: boolean
}

const props = defineProps<UserAvatarUploadProps>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  uploaded: []
}>()

// Composables
const { uploadAvatar } = useCurrentUser()
const { success, error: showError } = useToast()

const { file, preview, validationError, isUploading, hasFile, selectFile, reset } = useFileUpload({
  accept: ALLOWED_IMAGE_TYPES.join(','),
  category: 'avatars',
})

// v-model
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

// Scroll lock
useScrollLock(isOpen)

// Reset on close
watch(isOpen, (open) => {
  if (!open) {
    reset()
  }
})

// Handlers
function close() {
  isOpen.value = false
}

function handleBackdropClick(e: MouseEvent) {
  if (e.target === e.currentTarget) {
    close()
  }
}

async function handleUpload() {
  if (!file.value) return

  try {
    await uploadAvatar(file.value)
    success('Avatar updated!')
    emit('uploaded')
    close()
  } catch (error: any) {
    showError(error?.message || 'Failed to upload avatar')
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="isOpen"
        class="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-6"
        @click="handleBackdropClick"
        @keydown.escape="close"
      >
        <div class="ml-20 bg-white rounded-xl shadow-xl max-w-md w-full p-8 relative">
          <!-- Loading -->
          <div v-if="isUploading" class="flex items-center justify-center min-h-[150px]">
            <BaseLoader variant="spinner" size="lg" color="red" />
          </div>

          <!-- Form -->
          <div v-else class="flex flex-col items-center justify-center gap-5">
            <h2 class="text-xl font-semibold text-gray-900">Update Profile Image</h2>

            <div class="flex flex-col items-center w-full">
              <label
                for="imageProfile"
                class="block mb-2 text-sm font-medium text-gray-700 text-center"
              >
                Select an image file
              </label>

              <input
                type="file"
                id="imageProfile"
                :accept="ALLOWED_IMAGE_TYPES.join(',')"
                @change="selectFile"
                class="block w-full text-sm text-gray-900 border border-gray-300 rounded-3xl cursor-pointer bg-gray-50 focus:outline-none focus:ring-1 focus:ring-red-500"
              />

              <!-- Validation error -->
              <p v-if="validationError" class="mt-2 text-sm text-red-500">
                {{ validationError }}
              </p>

              <!-- Preview -->
              <div v-if="preview" class="mt-4">
                <img
                  :src="preview"
                  alt="Preview"
                  class="rounded-full w-32 h-32 object-cover border-4 border-gray-300 shadow-lg"
                />
              </div>
            </div>

            <!-- Buttons -->
            <div class="flex gap-4 mt-4">
              <BaseButton variant="ghost" @click="close"> Cancel </BaseButton>
              <BaseButton variant="primary" :disabled="!hasFile" @click="handleUpload">
                Update
              </BaseButton>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
