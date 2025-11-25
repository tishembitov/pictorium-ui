<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useEscapeKey } from '@/composables/utils/useClickOutside'

export interface ImagePreviewProps {
  modelValue: boolean
  src: string
  alt?: string
}

const props = withDefaults(defineProps<ImagePreviewProps>(), {
  alt: 'Image preview',
})

const emit = defineEmits<(e: 'update:modelValue', value: boolean) => void>()

const zoom = ref(1)
const minZoom = 0.2
const maxZoom = 3
const zoomStep = 0.25

const close = () => {
  emit('update:modelValue', false)
  zoom.value = 1
}

// ✅ Используем useEscapeKey
const isOpen = computed(() => props.modelValue)
useEscapeKey(close, { enabled: isOpen })

const increaseZoom = () => {
  zoom.value = Math.min(maxZoom, zoom.value + zoomStep)
}

const decreaseZoom = () => {
  zoom.value = Math.max(minZoom, zoom.value - zoomStep)
}

const resetZoom = () => {
  zoom.value = 1
}

// Handle wheel zoom
const handleWheel = (event: WheelEvent) => {
  event.preventDefault()
  if (event.deltaY < 0) {
    increaseZoom()
  } else {
    decreaseZoom()
  }
}

// Body scroll lock
watch(
  () => props.modelValue,
  (newValue) => {
    document.body.classList.toggle('overflow-hidden', newValue)
  },
)
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80"
        @click.self="close"
        @wheel="handleWheel"
        role="dialog"
        aria-modal="true"
        :aria-label="alt"
      >
        <!-- Close button -->
        <button
          @click="close"
          class="absolute top-4 left-4 bg-white bg-opacity-80 rounded-full p-2 hover:bg-opacity-100 transition z-10"
          aria-label="Close preview"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <!-- Image -->
        <img
          :src="src"
          :alt="alt"
          class="max-h-full max-w-full rounded-3xl transition-transform duration-300 select-none"
          :style="{ transform: `scale(${zoom})` }"
          draggable="false"
        />

        <!-- Zoom controls -->
        <div class="absolute bottom-4 right-4 flex flex-col gap-2">
          <button
            @click="increaseZoom"
            :disabled="zoom >= maxZoom"
            class="bg-white bg-opacity-80 rounded-full p-2 hover:bg-opacity-100 transition disabled:opacity-50"
            aria-label="Zoom in"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>

          <button
            @click="resetZoom"
            :disabled="zoom === 1"
            class="bg-white bg-opacity-80 rounded-full p-2 hover:bg-opacity-100 transition disabled:opacity-50 text-sm font-medium"
            aria-label="Reset zoom"
          >
            {{ Math.round(zoom * 100) }}%
          </button>

          <button
            @click="decreaseZoom"
            :disabled="zoom <= minZoom"
            class="bg-white bg-opacity-80 rounded-full p-2 hover:bg-opacity-100 transition disabled:opacity-50"
            aria-label="Zoom out"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
            </svg>
          </button>
        </div>

        <!-- Zoom hint -->
        <div class="absolute bottom-4 left-4 text-white text-sm opacity-60">
          Scroll to zoom • Click outside to close
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
