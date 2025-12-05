<!-- src/components/features/pins/detail/PinFullscreen.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useEscapeKey } from '@/composables/utils/useClickOutside'
import { useScrollLock } from '@/composables/utils/useScrollLock'
import { useBoards } from '@/composables/api/useBoards'
import { usePinActions } from '@/composables/api/usePinActions'

export interface PinFullscreenProps {
  modelValue: boolean
  src: string
  alt?: string
  pinId: string
  rgb?: string
}

const props = withDefaults(defineProps<PinFullscreenProps>(), {
  alt: 'Fullscreen image',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'openBoardSelector'): void
}>()

// ✅ ИСПРАВЛЕНО: getter для реактивности
const { selectedBoard } = useBoards()
const boardTitle = computed(() => selectedBoard.value?.title || 'Save to profile')
const { saveState, saveButtonText, save } = usePinActions(() => props.pinId)

// State
const zoom = ref(1)
const minZoom = 0.2
const maxZoom = 3
const zoomStep = 0.1

// ✅ ИСПРАВЛЕНО: useScrollLock вместо document напрямую
const isOpen = computed(() => props.modelValue)
useScrollLock(isOpen)

// Close handler
function close() {
  emit('update:modelValue', false)
  zoom.value = 1
}

// Escape key
useEscapeKey(close, { enabled: isOpen })

// Zoom controls
function increaseZoom() {
  zoom.value = Math.min(maxZoom, zoom.value + zoomStep)
}

function decreaseZoom() {
  zoom.value = Math.max(minZoom, zoom.value - zoomStep)
}

function handleWheel(event: WheelEvent) {
  event.preventDefault()
  if (event.deltaY < 0) {
    increaseZoom()
  } else {
    decreaseZoom()
  }
}

// Save handler
async function handleSave() {
  await save()
}
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
          class="absolute top-4 left-4 bg-white bg-opacity-80 rounded-full p-2 focus:outline-none justify-center text-center items-center flex hover:bg-opacity-100 transition z-10"
          aria-label="Close fullscreen"
        >
          <i class="pi pi-times text-3xl font-bold" />
        </button>

        <!-- Actions -->
        <div class="absolute top-4 right-4 flex flex-row gap-1 z-10">
          <button
            @click.stop="emit('openBoardSelector')"
            class="px-6 py-3 text-sm bg-gray-800 hover:bg-black text-white rounded-3xl transition cursor-pointer"
          >
            {{ boardTitle || 'Profile' }}
          </button>
          <button
            @click="handleSave"
            :style="{ backgroundColor: saveState === 'idle' ? rgb || '#dc2626' : '#000' }"
            class="px-6 py-3 text-sm text-white rounded-3xl transition transform hover:scale-105"
            :disabled="saveState === 'saving'"
          >
            {{ saveButtonText }}
          </button>
        </div>

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
            class="bg-white bg-opacity-80 rounded-full p-2 focus:outline-none hover:bg-opacity-100 transition disabled:opacity-50"
            aria-label="Zoom in"
          >
            <i class="pi pi-plus text-2xl font-bold" />
          </button>

          <button
            @click="decreaseZoom"
            :disabled="zoom <= minZoom"
            class="bg-white bg-opacity-80 rounded-full p-2 focus:outline-none hover:bg-opacity-100 transition disabled:opacity-50"
            aria-label="Zoom out"
          >
            <i class="pi pi-minus text-2xl font-bold" />
          </button>
        </div>

        <!-- Zoom hint -->
        <div class="absolute bottom-4 left-4 text-white text-sm opacity-60">
          Scroll to zoom • {{ Math.round(zoom * 100) }}%
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
