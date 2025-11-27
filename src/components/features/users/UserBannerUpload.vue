<!-- src/components/features/users/UserBannerUpload.vue -->
<script setup lang="ts">
/**
 * UserBannerUpload - Загрузка баннера профиля
 * ✅ ИСПРАВЛЕНО: использует useFileUpload
 */

import { watch, computed } from 'vue'
import { useFileUpload } from '@/composables/features/useFileUpload'
import { useCurrentUser } from '@/composables/api/useUserProfile'
import { useToast } from '@/composables/ui/useToast'
import { ALLOWED_IMAGE_TYPES } from '@/utils/constants'
import BaseLoader from '@/components/ui/BaseLoader.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'

export interface UserBannerUploadProps {
  modelValue: boolean
}

const props = defineProps<UserBannerUploadProps>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  uploaded: []
}>()

// Composables
const { uploadBanner } = useCurrentUser()
const { success } = useToast()

const { file, preview, validationError, isUploading, hasFile, selectFile, reset } = useFileUpload({
  accept: ALLOWED_IMAGE_TYPES.join(','),
  category: 'banners',
})

// Computed
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

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

async function handleUpload() {
  if (!file.value) return

  try {
    await uploadBanner(file.value)
    success('Banner updated!')
    emit('uploaded')
    close()
  } catch (error) {
    // Error handled by useFileUpload
    console.error('[UserBannerUpload] Upload failed:', error)
  }
}
</script>

<template>
  <BaseModal v-model="isOpen" title="Update Banner" max-width="lg" @close="close">
    <!-- Loading -->
    <div v-if="isUploading" class="flex items-center justify-center min-h-[300px]">
      <BaseLoader variant="spinner" size="lg" color="red" />
    </div>

    <div v-else class="space-y-6">
      <!-- Upload area -->
      <div>
        <label for="imageBanner" class="block mb-2 text-sm font-semibold text-gray-700">
          Select Banner Image
        </label>
        <input
          type="file"
          id="imageBanner"
          :accept="ALLOWED_IMAGE_TYPES.join(',')"
          @change="selectFile"
          class="block w-full text-sm text-gray-900 border border-gray-300 rounded-md cursor-pointer bg-gray-50 focus:outline-none focus:ring focus:ring-red-500"
        />

        <!-- Validation error -->
        <p v-if="validationError" class="mt-2 text-sm text-red-500">
          {{ validationError }}
        </p>

        <!-- Preview -->
        <img
          v-if="preview"
          :src="preview"
          class="mt-4 rounded-xl w-full object-cover max-h-[300px]"
          alt="Banner Preview"
        />
      </div>

      <!-- Buttons -->
      <div class="flex justify-end gap-4">
        <BaseButton variant="ghost" @click="close"> Cancel </BaseButton>
        <BaseButton variant="primary" :disabled="!hasFile" @click="handleUpload">
          Update
        </BaseButton>
      </div>
    </div>
  </BaseModal>
</template>
