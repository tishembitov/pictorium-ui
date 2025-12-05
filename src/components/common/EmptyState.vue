<script setup lang="ts">
import { computed, useSlots } from 'vue'
import { truncateText } from '@/utils/formatters'

const slots = useSlots()

export interface EmptyStateProps {
  title?: string
  message?: string
  image?: string
  icon?: string
  actionText?: string
  actionIcon?: string
  variant?: 'default' | 'minimal' | 'illustration'
  maxMessageLength?: number
}

const props = withDefaults(defineProps<EmptyStateProps>(), {
  title: 'No items found',
  message: '',
  image: '',
  icon: '',
  actionText: '',
  actionIcon: '',
  variant: 'default',
  maxMessageLength: 0,
})

const emit = defineEmits<{
  (e: 'action'): void
}>()

const displayMessage = computed(() => {
  if (!props.message) return ''
  if (props.maxMessageLength && props.message.length > props.maxMessageLength) {
    return truncateText(props.message, props.maxMessageLength)
  }
  return props.message
})

const hasCustomMessage = computed(() => !!slots.message)
const hasCustomAction = computed(() => !!slots.action)
</script>

<template>
  <!-- Default variant -->
  <div
    v-if="variant === 'default'"
    class="flex flex-col items-center justify-center py-12 px-4 text-center"
    role="status"
    aria-live="polite"
  >
    <!-- Image -->
    <img
      v-if="image"
      :src="image"
      :alt="title"
      class="w-72 h-72 object-cover rounded-xl mb-6 shadow-lg"
      loading="lazy"
    />

    <!-- Icon -->
    <div
      v-else-if="icon"
      class="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-6"
      aria-hidden="true"
    >
      <i :class="['pi', icon, 'text-5xl', 'text-gray-400']"></i>
    </div>

    <!-- Default icon -->
    <div v-else class="text-8xl mb-6" aria-hidden="true">📭</div>

    <!-- Title -->
    <h2 class="text-2xl font-bold text-gray-900 mb-2">{{ title }}</h2>

    <!-- Message -->
    <p v-if="displayMessage && !hasCustomMessage" class="text-gray-600 mb-6 max-w-md">
      {{ displayMessage }}
    </p>

    <!-- Slot for custom message -->
    <div v-if="hasCustomMessage" class="text-gray-600 mb-6 max-w-md">
      <slot name="message" />
    </div>

    <!-- Action button -->
    <button
      v-if="actionText && !hasCustomAction"
      @click="emit('action')"
      type="button"
      class="px-6 py-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors duration-200 font-semibold flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
    >
      <i v-if="actionIcon" :class="['pi', actionIcon]"></i>
      {{ actionText }}
    </button>

    <!-- Slot for custom action -->
    <slot v-if="hasCustomAction" name="action" />
  </div>

  <!-- Minimal variant -->
  <div
    v-else-if="variant === 'minimal'"
    class="flex flex-col items-center justify-center py-8 px-4 text-center"
    role="status"
    aria-live="polite"
  >
    <i
      v-if="icon"
      :class="['pi', icon, 'text-4xl', 'text-gray-400', 'mb-3']"
      aria-hidden="true"
    ></i>
    <p class="text-gray-600 font-medium">{{ title }}</p>
  </div>

  <!-- Illustration variant -->
  <div
    v-else-if="variant === 'illustration'"
    class="flex flex-col items-center justify-center py-16 px-4 text-center"
    role="status"
    aria-live="polite"
  >
    <div class="relative mb-8">
      <div
        class="w-64 h-64 bg-gradient-to-br from-red-100 to-purple-100 rounded-full opacity-50 blur-3xl absolute"
        aria-hidden="true"
      ></div>
      <img
        v-if="image"
        :src="image"
        :alt="title"
        class="w-64 h-64 object-cover rounded-3xl relative z-10 shadow-xl"
        loading="lazy"
      />
      <div v-else class="text-9xl relative z-10" aria-hidden="true">🎨</div>
    </div>

    <h2 class="text-3xl font-bold text-gray-900 mb-3">{{ title }}</h2>
    <p v-if="displayMessage" class="text-lg text-gray-600 mb-8 max-w-lg">
      {{ displayMessage }}
    </p>

    <slot name="action" />
  </div>
</template>
