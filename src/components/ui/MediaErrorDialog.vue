<!-- src/components/ui/MediaErrorDialog.vue -->
<script setup lang="ts">
/**
 * MediaErrorDialog - Диалог ошибки медиа файлов
 * Визуальный стиль из старого проекта
 */

import { watch } from 'vue'
import { useEscapeKey } from '@/composables/utils/useClickOutside'

export interface MediaErrorDialogProps {
  modelValue: boolean
  title?: string
  message?: string
  buttonText?: string
}

const props = withDefaults(defineProps<MediaErrorDialogProps>(), {
  title: '',
  message: 'Invalid file type. Allowed types: .jpg, .jpeg, .gif, .webp, .png, .bmp, .mp4, .webm',
  buttonText: 'Ok, understand',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'close'): void
}>()

function close() {
  emit('update:modelValue', false)
  emit('close')
}

// Escape key
useEscapeKey(close, { enabled: () => props.modelValue })

// Body scroll lock
watch(
  () => props.modelValue,
  (isOpen) => {
    document.body.classList.toggle('overflow-hidden', isOpen)
  },
)
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[60]"
        @click.self="close"
        role="alertdialog"
        aria-modal="true"
        :aria-labelledby="title ? 'media-error-title' : undefined"
        aria-describedby="media-error-message"
      >
        <div class="relative p-4 w-full max-w-md max-h-full">
          <div class="relative bg-white rounded-3xl shadow">
            <div class="p-5 text-center">
              <!-- Icon -->
              <svg
                class="mx-auto mb-4 text-gray-400 w-12 h-12"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10 11V6m0 8h.01M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>

              <!-- Title (optional) -->
              <h3 v-if="title" id="media-error-title" class="mb-2 text-xl font-semibold text-black">
                {{ title }}
              </h3>

              <!-- Message -->
              <p id="media-error-message" class="mb-5 text-lg font-normal text-black">
                {{ message }}
              </p>

              <!-- Button -->
              <button
                @click="close"
                type="button"
                class="text-white bg-red-600 hover:bg-red-800 font-medium rounded-3xl text-sm inline-flex items-center px-5 py-2.5 text-center transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                {{ buttonText }}
              </button>
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
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
