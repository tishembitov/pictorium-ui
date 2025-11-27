<!-- src/components/features/users/profile/UserEditModal.vue -->
<script setup lang="ts">
/**
 * UserEditModal - Модалка редактирования профиля
 * ✅ ИСПРАВЛЕНО: использует useForm, типизированные данные
 */

import { watch, computed } from 'vue'
import { useForm } from '@/composables/form/useForm'
import { validators } from '@/composables/form/useFormValidation'
import { useCurrentUser } from '@/composables/api/useUserProfile'
import { useToast } from '@/composables/ui/useToast'
import { useScrollLock } from '@/composables/utils/useScrollLock'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseTextarea from '@/components/ui/BaseTextarea.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseLoader from '@/components/ui/BaseLoader.vue'
import type { UserUpdateRequest, User } from '@/types'

// ============ TYPES ============

// ✅ FIX 1: Добавляем index signature для совместимости с Record<string, unknown>
interface UserEditForm {
  username: string
  description: string
  instagram: string
  tiktok: string
  telegram: string
  pinterest: string
  [key: string]: string // Index signature
}

export interface UserEditModalProps {
  modelValue: boolean
  user: Pick<User, 'username' | 'description' | 'instagram' | 'tiktok' | 'telegram' | 'pinterest'>
}

// ============ PROPS & EMITS ============

const props = defineProps<UserEditModalProps>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  updated: []
}>()

// ============ COMPOSABLES ============

const { updateProfile } = useCurrentUser()
const { success, error: showError } = useToast()

// v-model
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

// Scroll lock
useScrollLock(isOpen)

// ============ FORM ============

const {
  values,
  errors,
  touched,
  isSubmitting,
  isDirty,
  setFieldValue,
  setFieldTouched,
  handleSubmit,
  reset,
} = useForm<UserEditForm>({
  initialValues: {
    username: '',
    description: '',
    instagram: '',
    tiktok: '',
    telegram: '',
    pinterest: '',
  },
  validationRules: {
    username: validators.usernameField,
    instagram: validators.url(),
    tiktok: validators.url(),
    telegram: validators.url(),
    pinterest: validators.url(),
  },
  onSubmit: async (formValues) => {
    await submitForm(formValues)
  },
})

// ============ HELPERS ============

// ✅ FIX 2: Типизированные обработчики для полей формы
function updateField(field: keyof UserEditForm) {
  return (value: string | number) => {
    setFieldValue(field, String(value))
  }
}

function touchField(field: keyof UserEditForm) {
  return () => setFieldTouched(field)
}

// ============ SYNC WITH PROPS ============

watch(
  isOpen,
  (open) => {
    if (open && props.user) {
      // Reset form with user data
      setFieldValue('username', props.user.username || '')
      setFieldValue('description', props.user.description || '')
      setFieldValue('instagram', props.user.instagram || '')
      setFieldValue('tiktok', props.user.tiktok || '')
      setFieldValue('telegram', props.user.telegram || '')
      setFieldValue('pinterest', props.user.pinterest || '')
    }
  },
  { immediate: true },
)

// ============ HANDLERS ============

async function submitForm(formValues: UserEditForm) {
  // Build update request - only changed fields
  const data: UserUpdateRequest = {}

  if (formValues.username && formValues.username !== props.user.username) {
    data.username = formValues.username
  }
  if (formValues.description) {
    data.description = formValues.description
  }
  if (formValues.instagram) {
    data.instagram = formValues.instagram
  }
  if (formValues.tiktok) {
    data.tiktok = formValues.tiktok
  }
  if (formValues.telegram) {
    data.telegram = formValues.telegram
  }
  if (formValues.pinterest) {
    data.pinterest = formValues.pinterest
  }

  // Check if there are any changes
  if (Object.keys(data).length === 0) {
    close()
    return
  }

  try {
    await updateProfile(data)
    success('Profile updated!')
    emit('updated')
    close()
  } catch (err: unknown) {
    const error = err as { response?: { status?: number }; message?: string }
    if (error?.response?.status === 409) {
      showError('Username already exists')
    } else if (error?.response?.status === 403) {
      showError('Cannot change username of test profile')
    } else {
      showError(error?.message || 'Failed to update profile')
    }
    throw err // Re-throw to keep form in submitting state
  }
}

function close() {
  reset()
  isOpen.value = false
}

function handleBackdropClick(e: MouseEvent) {
  if (e.target === e.currentTarget) {
    close()
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
        <!-- Modal content -->
        <div class="ml-20 bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 relative">
          <!-- Loading state -->
          <div v-if="isSubmitting" class="flex items-center justify-center min-h-[200px]">
            <BaseLoader variant="spinner" size="lg" color="red" />
          </div>

          <!-- Form -->
          <form v-else @submit.prevent="handleSubmit" class="flex flex-col gap-6">
            <h2 class="text-2xl font-semibold text-gray-900 text-center">Edit Profile</h2>

            <!-- Basic info -->
            <div class="space-y-4">
              <!-- ✅ FIX 2: Используем helper функции -->
              <BaseInput
                :model-value="values.username"
                @update:model-value="updateField('username')"
                @blur="touchField('username')"
                label="Username"
                placeholder="Your username"
                :error="touched.username ? errors.username : undefined"
                rounded="lg"
              />

              <BaseTextarea
                :model-value="values.description"
                @update:model-value="updateField('description')"
                @blur="touchField('description')"
                label="Description"
                placeholder="Tell about yourself"
                :rows="4"
                rounded="lg"
              />
            </div>

            <!-- Social links -->
            <div class="space-y-4">
              <h3 class="text-sm font-medium text-gray-700">Social Links</h3>

              <div class="flex items-center gap-3">
                <i class="pi pi-instagram text-2xl text-gray-500 w-8" />
                <BaseInput
                  :model-value="values.instagram"
                  @update:model-value="updateField('instagram')"
                  @blur="touchField('instagram')"
                  type="url"
                  placeholder="Instagram URL"
                  :error="touched.instagram ? errors.instagram : undefined"
                  rounded="lg"
                  class="flex-1"
                />
              </div>

              <div class="flex items-center gap-3">
                <i class="pi pi-tiktok text-2xl text-gray-500 w-8" />
                <BaseInput
                  :model-value="values.tiktok"
                  @update:model-value="updateField('tiktok')"
                  @blur="touchField('tiktok')"
                  type="url"
                  placeholder="TikTok URL"
                  :error="touched.tiktok ? errors.tiktok : undefined"
                  rounded="lg"
                  class="flex-1"
                />
              </div>

              <div class="flex items-center gap-3">
                <i class="pi pi-telegram text-2xl text-gray-500 w-8" />
                <BaseInput
                  :model-value="values.telegram"
                  @update:model-value="updateField('telegram')"
                  @blur="touchField('telegram')"
                  type="url"
                  placeholder="Telegram URL"
                  :error="touched.telegram ? errors.telegram : undefined"
                  rounded="lg"
                  class="flex-1"
                />
              </div>

              <div class="flex items-center gap-3">
                <i class="pi pi-pinterest text-2xl text-gray-500 w-8" />
                <BaseInput
                  :model-value="values.pinterest"
                  @update:model-value="updateField('pinterest')"
                  @blur="touchField('pinterest')"
                  type="url"
                  placeholder="Pinterest URL"
                  :error="touched.pinterest ? errors.pinterest : undefined"
                  rounded="lg"
                  class="flex-1"
                />
              </div>
            </div>

            <!-- Buttons -->
            <div class="flex justify-center items-center gap-4 mt-4">
              <BaseButton type="button" variant="ghost" @click="close"> Cancel </BaseButton>
              <BaseButton type="submit" variant="primary" :disabled="!isDirty || isSubmitting">
                Save
              </BaseButton>
            </div>
          </form>
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
