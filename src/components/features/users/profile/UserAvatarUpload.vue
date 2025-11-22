<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import FileUpload from '@/components/ui/FileUpload.vue'
import { useAuthStore } from '@/stores/auth.store'
import { useToast } from '@/composables/ui/useToast'

export interface UserAvatarUploadProps {
  modelValue: boolean
}

const props = defineProps<UserAvatarUploadProps>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'uploaded'): void
}>()

const authStore = useAuthStore()
const { showToast } = useToast()

const file = ref<File | null>(null)
const isUploading = ref(false)

// Reset file when modal closes
watch(
  () => props.modelValue,
  (isOpen) => {
    if (!isOpen) {
      file.value = null
    }
  },
)

const handleUpload = async () => {
  if (!file.value) return

  try {
    isUploading.value = true

    await authStore.uploadAvatar(file.value)

    showToast('Avatar updated successfully!', 'success')
    emit('uploaded')
    emit('update:modelValue', false)
  } catch (error) {
    console.error('[UserAvatarUpload] Upload failed:', error)
    showToast('Failed to update avatar', 'error')
  } finally {
    isUploading.value = false
  }
}

const handleCancel = () => {
  emit('update:modelValue', false)
}
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    title="Update Profile Picture"
    size="md"
    :show-footer="false"
  >
    <div class="space-y-6">
      <!-- File Upload -->
      <FileUpload
        v-model="file"
        accept=".jpg,.jpeg,.gif,.webp,.png,.bmp"
        :max-size="10 * 1024 * 1024"
        :show-preview="true"
        preview-width="200px"
        preview-height="200px"
      />

      <!-- Actions -->
      <div class="flex items-center justify-end gap-3">
        <BaseButton variant="outline" @click="handleCancel" :disabled="isUploading">
          Cancel
        </BaseButton>

        <BaseButton
          variant="primary"
          @click="handleUpload"
          :loading="isUploading"
          :disabled="!file"
        >
          Upload
        </BaseButton>
      </div>
    </div>
  </BaseModal>
</template>
