<!-- src/components/features/users/MediaUploadModal.vue -->
<script setup lang="ts">
/**
 * MediaUploadModal - Unified upload modal for Avatar & Banner
 * ✅ НОВЫЙ: Объединяет UserAvatarUpload и UserBannerUpload
 */

import { watch, computed } from 'vue'
import { useFileUpload } from '@/composables/features/useFileUpload'
import { useCurrentUser } from '@/composables/api/useUserProfile'
import { useToast } from '@/composables/ui/useToast'
import { useScrollLock } from '@/composables/utils/useScrollLock'
import { ALLOWED_IMAGE_TYPES } from '@/utils/constants'
import BaseLoader from '@/components/ui/BaseLoader.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

export interface MediaUploadModalProps {
  modelValue: boolean
  type: 'avatar' | 'banner'
}

const props = defineProps<MediaUploadModalProps>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  uploaded: []
}>()

// Composables
const { uploadAvatar, uploadBanner } = useCurrentUser()
const { success, error: showError } = useToast()

const { file, preview, validationError, isUploading, hasFile, selectFile, reset } = useFileUpload({
  accept: ALLOWED_IMAGE_TYPES.join(','),
  category: props.type === 'avatar' ? 'avatars' : 'banners',
})

// Computed
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const title = computed(() => (props.type === 'avatar' ? 'Update Avatar' : 'Update Banner'))

const previewClass = computed(() =>
  props.type === 'avatar'
    ? 'rounded-full w-32 h-32 object-cover border-4 border-gray-300 shadow-lg'
    : 'rounded-xl w-full object-cover max-h-[300px]',
)

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
    if (props.type === 'avatar') {
      await uploadAvatar(file.value)
    } else {
      await uploadBanner(file.value)
    }

    success(`${props.type === 'avatar' ? 'Avatar' : 'Banner'} updated!`)
    emit('uploaded')
    close()
  } catch (error: any) {
    showError(error?.message || `Failed to upload ${props.type}`)
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
            <h2 class="text-xl font-semibold text-gray-900">{{ title }}</h2>

            <div class="flex flex-col items-center w-full">
              <label
                :for="`file-${type}`"
                class="block mb-2 text-sm font-medium text-gray-700 text-center"
              >
                Select an image file
              </label>

              <input
                :id="`file-${type}`"
                type="file"
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
                <img :src="preview" :alt="`${type} preview`" :class="previewClass" />
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
