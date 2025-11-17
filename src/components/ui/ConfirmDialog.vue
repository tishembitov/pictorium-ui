<script setup lang="ts">
import { watch } from 'vue'
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

const variantIcons = {
  danger: `
    <svg class="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  `,
  warning: `
    <svg class="w-12 h-12 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  `,
  info: `
    <svg class="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  `,
}

const handleConfirm = () => {
  emit('confirm')
}

const handleCancel = () => {
  emit('cancel')
  emit('update:modelValue', false)
}

const handleClose = () => {
  if (!props.loading) {
    handleCancel()
  }
}

watch(
  () => props.modelValue,
  (newValue) => {
    if (!newValue) {
      // Reset state when dialog closes
    }
  },
)
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
    <div class="text-center">
      <!-- Icon -->
      <div class="flex justify-center mb-4" v-html="variantIcons[variant]"></div>

      <!-- Title -->
      <h3 class="text-xl font-semibold text-gray-900 mb-2">
        {{ title }}
      </h3>

      <!-- Message -->
      <p class="text-gray-600 mb-6">
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
          :variant="variant === 'danger' ? 'danger' : 'primary'"
          @click="handleConfirm"
          :loading="loading"
        >
          {{ confirmText }}
        </BaseButton>
      </div>
    </div>
  </BaseModal>
</template>
