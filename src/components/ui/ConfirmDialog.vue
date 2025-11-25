<script setup lang="ts">
import BaseModal from './BaseModal.vue'
import BaseButton from './BaseButton.vue'

export interface ConfirmDialogProps {
  modelValue: boolean
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
  loading?: boolean
}

const props = withDefaults(defineProps<ConfirmDialogProps>(), {
  modelValue: false,
  title: 'Confirm Action',
  message: 'Are you sure you want to continue?',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  variant: 'danger',
  loading: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

const variantConfig = {
  danger: {
    iconColor: 'text-red-600',
    buttonVariant: 'danger' as const,
  },
  warning: {
    iconColor: 'text-yellow-600',
    buttonVariant: 'primary' as const,
  },
  info: {
    iconColor: 'text-blue-600',
    buttonVariant: 'primary' as const,
  },
}

const handleConfirm = () => {
  emit('confirm')
}

const handleCancel = () => {
  emit('cancel')
  emit('update:modelValue', false)
}
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    :closable="!loading"
    :persistent="loading"
    :close-on-overlay="!loading"
    size="sm"
    :show-header="false"
    :show-footer="false"
  >
    <div class="p-5 text-center">
      <!-- Icon -->
      <svg
        :class="['mx-auto mb-4 w-12 h-12', variantConfig[variant].iconColor]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          v-if="variant === 'danger' || variant === 'warning'"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
        <path
          v-else
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>

      <!-- Title -->
      <h3 class="mb-5 text-lg font-normal text-black">
        {{ title }}
      </h3>

      <!-- Message -->
      <p v-if="message" class="text-gray-600 mb-6">
        {{ message }}
      </p>

      <!-- Slot for custom content -->
      <div v-if="$slots.default" class="mb-6">
        <slot />
      </div>

      <!-- Buttons -->
      <div class="flex items-center justify-center gap-3">
        <BaseButton variant="secondary" @click="handleCancel" :disabled="loading">
          {{ cancelText }}
        </BaseButton>

        <BaseButton
          :variant="variantConfig[variant].buttonVariant"
          @click="handleConfirm"
          :loading="loading"
        >
          {{ confirmText }}
        </BaseButton>
      </div>
    </div>
  </BaseModal>
</template>
