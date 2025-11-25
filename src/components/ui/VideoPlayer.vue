<script setup lang="ts">
import { ref, computed } from 'vue'
import { useVideoPlayer } from '@/composables/features/useVideoPlayer'

export interface VideoPlayerProps {
  src: string
  autoplay?: boolean
  loop?: boolean
  muted?: boolean
  controls?: boolean
  autoHideControls?: boolean
  hideControlsDelay?: number
}

const props = withDefaults(defineProps<VideoPlayerProps>(), {
  autoplay: true,
  loop: true,
  muted: true,
  controls: true,
  autoHideControls: true,
  hideControlsDelay: 2000,
})

const videoRef = ref<HTMLVideoElement | null>(null)

// ✅ Используем useVideoPlayer composable
const {
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  progress,
  formattedTime,
  formattedDuration,
  showControls,
  togglePlay,
  seek,
  setVolume,
  toggleMute,
  resetControlsTimeout,
} = useVideoPlayer(videoRef, {
  autoplay: props.autoplay,
  loop: props.loop,
  muted: props.muted,
  volume: 0,
  controlsTimeout: props.hideControlsDelay,
})

// UI handlers
const handleSeek = (event: Event) => {
  const input = event.target as HTMLInputElement
  seek(parseFloat(input.value))
}

const handleVolumeChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  setVolume(parseFloat(input.value))
}

const handleMouseMove = () => {
  if (props.autoHideControls) {
    resetControlsTimeout()
  }
}

const handleMouseLeave = () => {
  if (props.autoHideControls && isPlaying.value) {
    // Controls will auto-hide via timeout
  }
}

// Computed for UI
const shouldShowControls = computed(() => {
  return props.controls && (showControls.value || !props.autoHideControls)
})
</script>

<template>
  <div
    class="relative w-full max-w-2xl mx-auto"
    @mousemove="handleMouseMove"
    @mouseleave="handleMouseLeave"
  >
    <!-- Video -->
    <video
      ref="videoRef"
      :src="src"
      class="w-full rounded-3xl cursor-pointer"
      :autoplay="autoplay"
      :loop="loop"
      :muted="muted"
      @click="togglePlay"
    />

    <!-- Gradient overlay -->
    <div
      v-if="shouldShowControls"
      class="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-red-900 to-transparent rounded-3xl pointer-events-none"
    />

    <!-- Controls -->
    <Transition name="fade">
      <div v-if="shouldShowControls" class="absolute bottom-0 left-0 right-0 p-4">
        <!-- Progress bar -->
        <input
          type="range"
          :max="duration"
          :value="currentTime"
          step="0.01"
          @input="handleSeek"
          class="w-full h-0.5 bg-black rounded-lg cursor-pointer accent-white mb-4"
        />

        <!-- Control buttons -->
        <div class="flex items-center justify-between text-white">
          <!-- Left controls -->
          <div class="flex items-center gap-3">
            <button @click.stop="togglePlay" class="hover:scale-110 transition">
              <i v-if="isPlaying" class="pi pi-pause text-xl" />
              <i v-else class="pi pi-play text-xl" />
            </button>

            <span class="text-md"> {{ formattedTime }} / {{ formattedDuration }} </span>
          </div>

          <!-- Right controls -->
          <div class="flex items-center gap-3">
            <button @click.stop="toggleMute" class="hover:scale-110 transition">
              <i v-if="isMuted || volume === 0" class="pi pi-volume-off text-xl" />
              <i v-else class="pi pi-volume-up text-xl" />
            </button>

            <input
              type="range"
              :value="volume"
              @input="handleVolumeChange"
              min="0"
              max="1"
              step="0.01"
              class="w-20 h-0.5 bg-black rounded-lg cursor-pointer accent-white"
            />
          </div>
        </div>
      </div>
    </Transition>

    <!-- Center play/pause indicator -->
    <Transition name="flash">
      <div
        v-if="shouldShowControls"
        class="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
      >
        <i
          :class="['text-5xl text-white glowing-icon', isPlaying ? 'pi pi-pause' : 'pi pi-play']"
        />
      </div>
    </Transition>
  </div>
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

.flash-enter-active,
.flash-leave-active {
  transition:
    opacity 0.2s,
    transform 0.2s;
}

.flash-enter-from,
.flash-leave-to {
  opacity: 0;
  transform: translate(-50%, -50%) scale(3);
}

.flash-enter-to,
.flash-leave-from {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
}

.glowing-icon {
  text-shadow:
    0 0 15px rgba(255, 0, 0, 0.7),
    0 0 25px rgba(255, 0, 0, 0.6),
    0 0 35px rgba(255, 0, 0, 0.5);
}
</style>
