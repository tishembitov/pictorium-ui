<!-- src/components/features/user/profile/UserEditModal.vue -->
<script setup lang="ts">
/**
 * UserEditModal - Модалка редактирования профиля
 * Визуальный стиль из старого UserView.vue (showEditModal)
 */

import { ref, watch } from 'vue'
import { useCurrentUser } from '@/composables/api/useUserProfile'
import { useToast } from '@/composables/ui/useToast'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseTextarea from '@/components/ui/BaseTextarea.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseLoader from '@/components/ui/BaseLoader.vue'

export interface UserEditModalProps {
  modelValue: boolean
  user: {
    username: string
    description?: string | null
    instagram?: string | null
    tiktok?: string | null
    telegram?: string | null
    pinterest?: string | null
  }
}

const props = defineProps<UserEditModalProps>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'updated'): void
}>()

const { updateProfile } = useCurrentUser()
const { success, error: showError } = useToast()

// Form state
const editUsername = ref('')
const editDescription = ref('')
const editInstagram = ref('')
const editTiktok = ref('')
const editTelegram = ref('')
const editPinterest = ref('')
const isUpdating = ref(false)
const userAlreadyExistsError = ref(false)
const userHasTestAcc = ref(false)

// Sync with props
watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen && props.user) {
      editUsername.value = props.user.username || ''
      editDescription.value = props.user.description || ''
      editInstagram.value = props.user.instagram || ''
      editTiktok.value = props.user.tiktok || ''
      editTelegram.value = props.user.telegram || ''
      editPinterest.value = props.user.pinterest || ''
    }
  },
  { immediate: true },
)

function close() {
  emit('update:modelValue', false)
}

async function handleSubmit() {
  const data: any = {}
  let hasChanges = false

  if (editUsername.value.trim() && editUsername.value !== props.user.username) {
    data.username = editUsername.value.trim()
    hasChanges = true
  }
  if (editDescription.value.trim()) {
    data.description = editDescription.value.trim()
    hasChanges = true
  }
  if (editInstagram.value.trim()) {
    data.instagram = editInstagram.value.trim()
    hasChanges = true
  }
  if (editTiktok.value.trim()) {
    data.tiktok = editTiktok.value.trim()
    hasChanges = true
  }
  if (editTelegram.value.trim()) {
    data.telegram = editTelegram.value.trim()
    hasChanges = true
  }
  if (editPinterest.value.trim()) {
    data.pinterest = editPinterest.value.trim()
    hasChanges = true
  }

  if (!hasChanges) {
    close()
    return
  }

  try {
    isUpdating.value = true
    await updateProfile(data)
    success('Profile updated!')
    emit('updated')
    close()
  } catch (error: any) {
    if (error?.response?.status === 409) {
      userAlreadyExistsError.value = true
    } else if (error?.response?.status === 403) {
      userHasTestAcc.value = true
    } else {
      showError(error)
    }
  } finally {
    isUpdating.value = false
  }
}
</script>

<template>
  <!-- Modal backdrop -->
  <Transition name="fade">
    <div
      v-if="modelValue"
      class="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-6"
      @click.self="close"
    >
      <!-- Modal content -->
      <div class="ml-20 bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 relative">
        <!-- Loading state -->
        <div v-if="isUpdating" class="flex items-center justify-center min-h-[200px]">
          <BaseLoader variant="spinner" size="lg" color="red" />
        </div>

        <!-- Form -->
        <div v-else class="flex flex-col items-stretch gap-6">
          <h2 class="text-2xl font-semibold text-gray-900 text-center">Edit Profile</h2>

          <div class="space-y-6">
            <!-- Username -->
            <BaseInput
              v-model="editUsername"
              label="Username"
              placeholder="Your username"
              rounded="lg"
            />

            <!-- Description -->
            <BaseTextarea
              v-model="editDescription"
              label="Description"
              placeholder="Tell about yourself"
              :rows="4"
              rounded="lg"
            />
          </div>

          <!-- Social links -->
          <div class="flex flex-col gap-4">
            <div class="flex items-center space-x-3">
              <i class="pi pi-instagram text-3xl text-gray-700" />
              <BaseInput
                v-model="editInstagram"
                type="url"
                placeholder="Instagram URL"
                rounded="lg"
                class="flex-1"
              />
            </div>
            <div class="flex items-center space-x-3">
              <i class="pi pi-tiktok text-3xl text-gray-700" />
              <BaseInput
                v-model="editTiktok"
                type="url"
                placeholder="TikTok URL"
                rounded="lg"
                class="flex-1"
              />
            </div>
            <div class="flex items-center space-x-3">
              <i class="pi pi-telegram text-3xl text-gray-700" />
              <BaseInput
                v-model="editTelegram"
                type="url"
                placeholder="Telegram URL"
                rounded="lg"
                class="flex-1"
              />
            </div>
            <div class="flex items-center space-x-3">
              <i class="pi pi-pinterest text-3xl text-gray-700" />
              <BaseInput
                v-model="editPinterest"
                type="url"
                placeholder="Pinterest URL"
                rounded="lg"
                class="flex-1"
              />
            </div>
          </div>

          <!-- Buttons -->
          <div class="flex justify-center items-center gap-4 mt-6">
            <BaseButton variant="ghost" @click="close"> Cancel </BaseButton>
            <BaseButton variant="primary" @click="handleSubmit"> Save </BaseButton>
          </div>
        </div>
      </div>
    </div>
  </Transition>

  <!-- Error dialogs -->
  <Teleport to="body">
    <div
      v-if="userAlreadyExistsError"
      class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[60]"
    >
      <div class="relative p-4 w-full max-w-md ml-20">
        <div class="relative bg-white rounded-3xl shadow p-5 text-center">
          <svg class="mx-auto mb-4 text-gray-400 w-12 h-12" fill="none" viewBox="0 0 20 20">
            <path
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10 11V6m0 8h.01M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
          <h3 class="mb-5 text-lg font-normal text-black">
            User with that username already exists
          </h3>
          <button
            @click="userAlreadyExistsError = false"
            class="text-white bg-red-600 hover:bg-red-800 font-medium rounded-3xl text-sm px-5 py-2.5"
          >
            Ok, understand
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="userHasTestAcc"
      class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[60]"
    >
      <div class="relative p-4 w-full max-w-md ml-20">
        <div class="relative bg-white rounded-3xl shadow p-5 text-center">
          <svg class="mx-auto mb-4 text-gray-400 w-12 h-12" fill="none" viewBox="0 0 20 20">
            <path
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10 11V6m0 8h.01M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
          <h3 class="mb-5 text-lg font-normal text-black">
            You cannot change username of test profile
          </h3>
          <button
            @click="userHasTestAcc = false"
            class="text-white bg-red-600 hover:bg-red-800 font-medium rounded-3xl text-sm px-5 py-2.5"
          >
            Ok, understand
          </button>
        </div>
      </div>
    </div>
  </Teleport>
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
