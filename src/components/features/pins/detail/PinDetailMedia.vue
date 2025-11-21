<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { storageApi } from '@/api/storage.api'
import { useVideoPlayer } from '@/composables/features/useVideoPlayer'
import { formatDuration } from '@/utils/formatters'
import type { Pin } from '@/types'

export interface PinDetailMediaProps {
  pin: Pin
}

const props = defineProps<PinDetailMediaProps>()

const emit = defineEmits<{
  (e: 'fullscreen'): void
}>()

// State
const mediaBlobUrl = ref<string | null>(null)
const isLoading = ref(true)
const videoRef = ref<HTMLVideoElement | null>(null)

const isImage = computed(() => {
  return !props.pin.videoPreviewUrl && !!props.pin.imageUrl
})

const isVideo = computed(() => {
  return !!props.pin.videoPreviewUrl
})

const isGif = computed(() => {
  return props.pin.contentType === 'image/gif'
})

// Video player
const {
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  progress,
  formattedCurrentTime,
  formattedDuration,
  play,
  pause,
  togglePlay,
  seek,
  seekToPercent,
  toggleMute,
  setVolume,
  showControls,
  resetControlsTimeout,
} = useVideoPlayer(videoRef, {
  autoplay: false,
  muted: false,
  volume: 0.7,
  controlsTimeout: 3000,
})

// Load media
onMounted(async () => {
  try {
    const mediaId = props.pin.videoPreviewUrl || props.pin.imageUrl
    if (!mediaId) {
      isLoading.value = false
      return
    }

    const blob = await storageApi.downloadImage(mediaId)
    mediaBlobUrl.value = URL.createObjectURL(blob)
  } catch (error) {
    console.error('[PinDetailMedia] Load failed:', error)
  } finally {
    isLoading.value = false
  }
})

// Cleanup
onBeforeUnmount(() => {
  if (mediaBlobUrl.value && mediaBlobUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(mediaBlobUrl.value)
  }
})

const handleProgressClick = (event: MouseEvent) => {
  if (!isVideo.value) return

  const progressBar = event.currentTarget as HTMLElement
  const rect = progressBar.getBoundingClientRect()
  const percent = ((event.clientX - rect.left) / rect.width) * 100
  seekToPercent(percent)
}

const handleVolumeChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  setVolume(Number(target.value))
}
</script>

<template>
  <div class="relative w-full h-full flex items-center justify-center group">
    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center justify-center w-full h-96">
      <BaseLoader variant="spinner" size="lg" color="white" />
    </div>

    <!-- Image -->
    <div v-else-if="isImage && mediaBlobUrl" class="relative max-w-full max-h-[90vh]">
      <!-- GIF Badge -->
      <div
        v-if="isGif"
        class="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-black rounded-2xl px-4 py-2 text-sm font-semibold z-10"
      >
        GIF
      </div>

      <!-- Image -->
      <img
        :src="mediaBlobUrl"
        :alt="pin.title || 'Pin image'"
        class="max-w-full max-h-[90vh] object-contain cursor-zoom-in"
        @click="emit('fullscreen')"
      />

      <!-- Fullscreen Button -->
      <button
        @click="emit('fullscreen')"
        class="absolute top-4 right-4 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition opacity-0 group-hover:opacity-100"
      >
        <i class="pi pi-window-maximize text-xl"></i>
      </button>
    </div>

    <!-- Video -->
    <div
      v-else-if="isVideo && mediaBlobUrl"
      class="relative w-full max-h-[90vh]"
      @mousemove="resetControlsTimeout"
    >
      <video
        ref="videoRef"
        :src="mediaBlobUrl"
        class="w-full max-h-[90vh] object-contain"
        @click="togglePlay"
      />

      <!-- Video Controls Overlay -->
      <Transition name="fade">
        <div
          v-if="showControls || !isPlaying"
          class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 pointer-events-none"
        >
          <!-- Play/Pause Center Button -->
          <div
            v-if="!isPlaying"
            class="absolute inset-0 flex items-center justify-center pointer-events-auto"
          >
            <button
              @click="play"
              class="w-20 h-20 flex items-center justify-center bg-white/30 backdrop-blur-sm rounded-full hover:bg-white/50 transition"
            >
              <i class="pi pi-play text-4xl text-white ml-1"></i>
            </button>
          </div>

          <!-- Bottom Controls -->
          <div class="absolute bottom-0 left-0 right-0 p-6 pointer-events-auto">
            <!-- Progress Bar -->
            <div
              @click="handleProgressClick"
              class="w-full h-2 bg-white/30 rounded-full cursor-pointer mb-4 group/progress"
            >
              <div
                class="h-full bg-red-500 rounded-full transition-all group-hover/progress:bg-red-600"
                :style="{ width: `${progress}%` }"
              ></div>
            </div>

            <!-- Controls Row -->
            <div class="flex items-center justify-between text-white">
              <!-- Left: Play/Pause + Time -->
              <div class="flex items-center gap-4">
                <button
                  @click="togglePlay"
                  class="w-10 h-10 flex items-center justify-center hover:bg-white/20 rounded-full transition"
                >
                  <i :class="['pi', isPlaying ? 'pi-pause' : 'pi-play', 'text-xl']"></i>
                </button>

                <span class="text-sm font-medium">
                  {{ formattedCurrentTime }} / {{ formattedDuration }}
                </span>
              </div>

              <!-- Right: Volume + Fullscreen -->
              <div class="flex items-center gap-4">
                <!-- Volume -->
                <div class="flex items-center gap-2 group/volume">
                  <button
                    @click="toggleMute"
                    class="w-10 h-10 flex items-center justify-center hover:bg-white/20 rounded-full transition"
                  >
                    <i
                      :class="[
                        'pi',
                        isMuted || volume === 0 ? 'pi-volume-off' : 'pi-volume-up',
                        'text-xl',
                      ]"
                    ></i>
                  </button>

                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    :value="volume"
                    @input="handleVolumeChange"
                    class="w-0 group-hover/volume:w-24 transition-all duration-300 accent-red-500"
                  />
                </div>

                <!-- Fullscreen -->
                <button
                  @click="emit('fullscreen')"
                  class="w-10 h-10 flex items-center justify-center hover:bg-white/20 rounded-full transition"
                >
                  <i class="pi pi-window-maximize text-xl"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Fallback -->
    <div v-else class="text-white text-center">
      <i class="pi pi-image text-6xl mb-4 opacity-50"></i>
      <p>Media not available</p>
    </div>
  </div>
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
