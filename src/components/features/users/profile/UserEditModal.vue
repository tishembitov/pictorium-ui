<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseTextarea from '@/components/ui/BaseTextarea.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { useAuthStore } from '@/stores/auth.store'
import { useToast } from '@/composables/ui/useToast'
import type { User } from '@/types'

export interface UserEditModalProps {
  modelValue: boolean
  user: User
}

const props = defineProps<UserEditModalProps>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'updated', user: User): void
}>()

const authStore = useAuthStore()
const { showToast } = useToast()

const isLoading = ref(false)
const formData = ref({
  username: '',
  description: '',
  instagram: '',
  tiktok: '',
  telegram: '',
  pinterest: '',
})

const errors = ref({
  username: '',
  general: '',
})

// Initialize form data when modal opens
watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      formData.value = {
        username: props.user.username || '',
        description: props.user.description || '',
        instagram: props.user.instagram || '',
        tiktok: props.user.tiktok || '',
        telegram: props.user.telegram || '',
        pinterest: props.user.pinterest || '',
      }
      errors.value = { username: '', general: '' }
    }
  },
)

const handleSubmit = async () => {
  try {
    isLoading.value = true
    errors.value = { username: '', general: '' }

    // Prepare update data (only changed fields)
    const updateData: any = {}

    if (formData.value.username.trim() !== props.user.username) {
      updateData.username = formData.value.username.trim()
    }
    if (formData.value.description.trim() !== (props.user.description || '')) {
      updateData.description = formData.value.description.trim()
    }
    if (formData.value.instagram.trim() !== (props.user.instagram || '')) {
      updateData.instagram = formData.value.instagram.trim()
    }
    if (formData.value.tiktok.trim() !== (props.user.tiktok || '')) {
      updateData.tiktok = formData.value.tiktok.trim()
    }
    if (formData.value.telegram.trim() !== (props.user.telegram || '')) {
      updateData.telegram = formData.value.telegram.trim()
    }
    if (formData.value.pinterest.trim() !== (props.user.pinterest || '')) {
      updateData.pinterest = formData.value.pinterest.trim()
    }

    // Update profile
    const updatedUser = await authStore.updateProfile(updateData)

    showToast('Profile updated successfully!', 'success')
    emit('updated', updatedUser)
    emit('update:modelValue', false)
  } catch (error: any) {
    console.error('[UserEditModal] Update failed:', error)

    if (error.response?.status === 409) {
      errors.value.username = 'Username already exists'
    } else if (error.response?.status === 403) {
      errors.value.general = 'You cannot change username of test profile'
    } else {
      errors.value.general = 'Failed to update profile'
    }
  } finally {
    isLoading.value = false
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
    title="Edit Profile"
    size="lg"
    :show-footer="false"
  >
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- General Error -->
      <div v-if="errors.general" class="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p class="text-sm text-red-700">{{ errors.general }}</p>
      </div>

      <!-- Username -->
      <BaseInput
        v-model="formData.username"
        label="Username"
        placeholder="Enter username"
        :error="errors.username"
        required
        maxLength="30"
      />

      <!-- Description -->
      <BaseTextarea
        v-model="formData.description"
        label="Description"
        placeholder="Tell us about yourself"
        rows="4"
        maxLength="500"
      />

      <!-- Social Links -->
      <div class="space-y-4">
        <h3 class="text-lg font-semibold text-gray-900">Social Links</h3>

        <BaseInput
          v-model="formData.instagram"
          label="Instagram"
          placeholder="https://instagram.com/username"
          type="url"
        >
          <template #icon>
            <i class="pi pi-instagram text-gray-500"></i>
          </template>
        </BaseInput>

        <BaseInput
          v-model="formData.tiktok"
          label="TikTok"
          placeholder="https://tiktok.com/@username"
          type="url"
        >
          <template #icon>
            <i class="pi pi-tiktok text-gray-500"></i>
          </template>
        </BaseInput>

        <BaseInput
          v-model="formData.telegram"
          label="Telegram"
          placeholder="https://t.me/username"
          type="url"
        >
          <template #icon>
            <i class="pi pi-telegram text-gray-500"></i>
          </template>
        </BaseInput>

        <BaseInput
          v-model="formData.pinterest"
          label="Pinterest"
          placeholder="https://pinterest.com/username"
          type="url"
        >
          <template #icon>
            <i class="pi pi-pinterest text-gray-500"></i>
          </template>
        </BaseInput>
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-end gap-3 pt-4">
        <BaseButton type="button" variant="outline" @click="handleCancel" :disabled="isLoading">
          Cancel
        </BaseButton>

        <BaseButton type="submit" variant="primary" :loading="isLoading"> Save Changes </BaseButton>
      </div>
    </form>
  </BaseModal>
</template>
