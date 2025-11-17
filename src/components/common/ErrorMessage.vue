<script setup lang="ts">
import { computed } from 'vue'

export interface ErrorMessageProps {
  error?: string | Error | null
  title?: string
  variant?: 'inline' | 'card' | 'fullscreen'
  retryable?: boolean
  closable?: boolean
  icon?: boolean
}

const props = withDefaults(defineProps<ErrorMessageProps>(), {
  error: null,
  title: 'Something went wrong',
  variant: 'card',
  retryable: false,
  closable: false,
  icon: true,
})

const emit = defineEmits<{
  (e: 'retry'): void
  (e: 'close'): void
}>()

const errorMessage = computed(() => {
  if (!props.error) return ''
  if (typeof props.error === 'string') return props.error
  if (props.error instanceof Error) return props.error.message
  return 'An unexpected error occurred'
})
</script>

<template>
  <!-- Inline variant -->
  <div
    v-if="variant === 'inline' && error"
    class="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg"
  >
    <svg
      v-if="icon"
      class="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>

    <div class="flex-1">
      <p v-if="title" class="font-semibold text-red-800 mb-1">{{ title }}</p>
      <p class="text-sm text-red-700">{{ errorMessage }}</p>
    </div>

    <button
      v-if="closable"
      @click="emit('close')"
      class="text-red-600 hover:text-red-800 transition"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>
  </div>

  <!-- Card variant -->
  <div
    v-if="variant === 'card' && error"
    class="flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-lg border border-gray-200"
  >
    <svg
      v-if="icon"
      class="w-16 h-16 text-red-600 mb-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>

    <h3 class="text-xl font-bold text-gray-900 mb-2">{{ title }}</h3>
    <p class="text-gray-600 text-center mb-6 max-w-md">{{ errorMessage }}</p>

    <div class="flex items-center gap-3">
      <button
        v-if="retryable"
        @click="emit('retry')"
        class="px-6 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition font-medium"
      >
        Try Again
      </button>

      <button
        v-if="closable"
        @click="emit('close')"
        class="px-6 py-2 bg-gray-200 text-gray-800 rounded-full hover:bg-gray-300 transition font-medium"
      >
        Close
      </button>

      <slot name="actions" />
    </div>
  </div>

  <!-- Fullscreen variant -->
  <div
    v-if="variant === 'fullscreen' && error"
    class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white"
  >
    <svg
      v-if="icon"
      class="w-24 h-24 text-red-600 mb-6 animate-pulse"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>

    <h1 class="text-4xl font-bold text-gray-900 mb-4">{{ title }}</h1>
    <p class="text-lg text-gray-600 text-center mb-8 max-w-lg">{{ errorMessage }}</p>

    <div class="flex items-center gap-4">
      <button
        v-if="retryable"
        @click="emit('retry')"
        class="px-8 py-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition font-semibold text-lg"
      >
        Try Again
      </button>

      <slot name="actions" />
    </div>
  </div>
</template>
