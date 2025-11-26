<!-- src/components/features/user/UserBannerUpload.vue -->
<script setup lang="ts">
/**
 * UserBannerUpload - Загрузка баннера профиля
 * Визуальный стиль из старого UserView.vue (showEditModalBanner)
 */

import { ref, watch } from 'vue'
import { useCurrentUser } from '@/composables/api/useUserProfile'
import { useToast } from '@/composables/ui/useToast'
import BaseLoader from '@/components/ui/BaseLoader.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import MediaErrorDialog from '@/components/ui/MediaErrorDialog.vue'

export interface UserBannerUploadProps {
  modelValue: boolean
}

const props = defineProps<UserBannerUploadProps>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'uploaded'): void
}>()

const { uploadBanner } = useCurrentUser()
const { success, warning } = useToast()

// State
const bannerFile = ref<File | null>(null)
const bannerPreview = ref<string | null>(null)
const isUploading = ref(false)
const showError = ref(false)

// Reset on close
watch(
  () => props.modelValue,
  (isOpen) => {
    if (!isOpen) {
      bannerFile.value = null
      bannerPreview.value = null
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

  // Check minimum dimensions
  const minWidth = 200
  const minHeight = 300

  const img = new Image()
  img.onload = () => {
    if (img.width < minWidth || img.height < minHeight) {
      warning(`Image must be at least ${minWidth}x${minHeight}.`)
      return
    }

    bannerFile.value = file

    const reader = new FileReader()
    reader.onload = (e) => {
      bannerPreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
  img.src = URL.createObjectURL(file)
}

async function handleUpload() {
  if (!bannerFile.value) return

  try {
    isUploading.value = true
    await uploadBanner(bannerFile.value)
    success('Banner updated!')
    emit('uploaded')
    close()
  } catch (error: any) {
    if (error?.response?.status === 415) {
      showError.value = true
    } else {
      warning('Failed to upload banner')
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
      class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      @click.self="close"
    >
      <div class="bg-white rounded-xl shadow-lg p-6 max-w-lg w-full ml-20">
        <!-- Loading -->
        <div v-if="isUploading" class="flex items-center justify-center min-h-[300px]">
          <BaseLoader variant="spinner" size="lg" color="red" />
        </div>

        <div v-else>
          <h2 class="text-center text-2xl font-bold text-gray-800 mb-4">Update Banner</h2>

          <!-- Upload area -->
          <div class="mb-6">
            <label for="imageBanner" class="block mb-2 text-sm font-semibold text-gray-700">
              Select Banner Image (.jpg, .jpeg, .gif, .webp, .png, .bmp)
            </label>
            <input
              type="file"
              id="imageBanner"
              accept=".jpg,.jpeg,.gif,.webp,.png,.bmp"
              @change="handleFileSelect"
              class="block w-full text-sm text-gray-900 border border-gray-300 rounded-md cursor-pointer bg-gray-50 focus:outline-none focus:ring focus:ring-red-500"
            />

            <!-- Preview -->
            <img
              v-if="bannerPreview"
              :src="bannerPreview"
              class="mt-4 rounded-xl w-full object-cover"
              style="max-height: 300px"
              alt="Banner Preview"
            />
          </div>

          <!-- Buttons -->
          <div class="flex justify-end space-x-4">
            <BaseButton variant="ghost" @click="close"> Cancel </BaseButton>
            <BaseButton variant="primary" :disabled="!bannerFile" @click="handleUpload">
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
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
