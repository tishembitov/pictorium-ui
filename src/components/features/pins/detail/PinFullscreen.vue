<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useKeyboardShortcuts } from '@/composables/utils'
import PinDetailMedia from './PinDetailMedia.vue'
import type { Pin } from '@/types'

export interface PinFullscreenProps {
  modelValue: boolean
  pin: Pin
}

const props = defineProps<PinFullscreenProps>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'close'): void
}>()

const containerRef = ref<HTMLElement | null>(null)

const close = () => {
  emit('update:modelValue', false)
  emit('close')
}

// Keyboard shortcuts
useKeyboardShortcuts([
  {
    key: 'Escape',
    handler: close,
  },
  {
    key: 'f',
    handler: close,
  },
])

// Lock body scroll
onMounted(() => {
  if (props.modelValue) {
    document.body.classList.add('overflow-hidden')
  }
})

onBeforeUnmount(() => {
  document.body.classList.remove('overflow-hidden')
})

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      document.body.classList.add('overflow-hidden')
    } else {
      document.body.classList.remove('overflow-hidden')
    }
  },
)
</script>

<template>
  <Transition name="fullscreen-fade">
    <div
      v-if="modelValue"
      ref="containerRef"
      class="fixed inset-0 z-[100] bg-black flex items-center justify-center"
      @click.self="close"
    >
      <!-- Close Button -->
      <button
        @click="close"
        class="absolute top-6 right-6 z-10 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-full transition-all"
        title="Close (Esc)"
      >
        <i class="pi pi-times text-2xl"></i>
      </button>

      <!-- Fullscreen Media -->
      <div class="w-full h-full flex items-center justify-center p-8">
        <PinDetailMedia :pin="pin" @fullscreen="close" />
      </div>

      <!-- Hint -->
      <div
        class="absolute bottom-6 left-1/2 transform -translate-x-1/2 text-white/70 text-sm font-medium"
      >
        Press <kbd class="px-2 py-1 bg-white/10 rounded">Esc</kbd> to close
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fullscreen-fade-enter-active,
.fullscreen-fade-leave-active {
  transition: opacity 0.3s ease;
}

.fullscreen-fade-enter-from,
.fullscreen-fade-leave-to {
  opacity: 0;
}

kbd {
  font-family: monospace;
}
</style>
