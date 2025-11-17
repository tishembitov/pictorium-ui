<script setup lang="ts">
import { ref, watch } from 'vue'

export interface ImagePreviewProps {
  modelValue: boolean
  src: string
  alt?: string
}

const props = withDefaults(defineProps<ImagePreviewProps>(), {
  alt: 'Image preview',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const zoom = ref(1)

const close = () => {
  emit('update:modelValue', false)
  zoom.value = 1
}

const increaseZoom = () => {
  zoom.value += 0.1
}

const decreaseZoom = () => {
  if (zoom.value > 0.2) {
    zoom.value -= 0.1
  }
}

watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      document.body.classList.add('overflow-hidden')
    } else {
      document.body.classList.remove('overflow-hidden')
    }
  },
)
</script>

<template>
  <Transition name="fade">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80"
      @click.self="close"
    >
      <!-- Close button -->
      <button
        @click="close"
        class="absolute top-4 left-4 bg-white bg-opacity-80 rounded-full p-2 hover:bg-opacity-100 transition"
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
        class="max-h-full max-w-full rounded-3xl transition-transform duration-300"
        :style="{ transform: `scale(${zoom})` }"
      />

      <!-- Zoom controls -->
      <div class="absolute bottom-4 right-4 flex flex-col gap-2">
        <button
          @click="increaseZoom"
          class="bg-white bg-opacity-80 rounded-full p-2 hover:bg-opacity-100 transition"
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
          @click="decreaseZoom"
          class="bg-white bg-opacity-80 rounded-full p-2 hover:bg-opacity-100 transition"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
          </svg>
        </button>
      </div>
    </div>
  </Transition>
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
