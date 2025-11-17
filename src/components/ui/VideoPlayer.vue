<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { formatDuration, formatTimeRemaining } from '@/utils/formatters'

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
const isPlaying = ref(true)
const volume = ref(0)
const oldVolume = ref(0.5)
const currentTime = ref(0)
const duration = ref(0)
const showControls = ref(false)
const controlsTimeout = ref<ReturnType<typeof setTimeout> | null>(null)

const formattedTime = computed(() => formatDuration(currentTime.value))
const formattedDuration = computed(() => formatDuration(duration.value))
const formattedRemaining = computed(() => formatTimeRemaining(currentTime.value, duration.value))

const progressPercent = computed(() => {
  if (duration.value === 0) return 0
  return (currentTime.value / duration.value) * 100
})

const togglePlayPause = () => {
  if (!videoRef.value) return

  if (isPlaying.value) {
    videoRef.value.pause()
  } else {
    videoRef.value.play()
  }
  isPlaying.value = !isPlaying.value
}

const toggleMute = () => {
  if (!videoRef.value) return

  if (volume.value === 0) {
    volume.value = oldVolume.value
    videoRef.value.volume = volume.value
  } else {
    oldVolume.value = volume.value
    volume.value = 0
    videoRef.value.volume = 0
  }
}

const updateVolume = () => {
  if (!videoRef.value) return
  videoRef.value.volume = volume.value
}

const updateProgress = () => {
  if (videoRef.value) {
    currentTime.value = videoRef.value.currentTime
  }
}

const seek = (event: Event) => {
  if (!videoRef.value) return
  const input = event.target as HTMLInputElement
  currentTime.value = parseFloat(input.value)
  videoRef.value.currentTime = currentTime.value
}

const onLoadedMetadata = () => {
  if (videoRef.value) {
    duration.value = videoRef.value.duration
    videoRef.value.volume = volume.value
  }
}

const onVideoEnd = () => {
  isPlaying.value = false
}

const handleMouseMove = () => {
  if (!props.autoHideControls) return

  showControls.value = true

  if (controlsTimeout.value) {
    clearTimeout(controlsTimeout.value)
  }

  controlsTimeout.value = setTimeout(() => {
    showControls.value = false
  }, props.hideControlsDelay)
}

const handleMouseLeave = () => {
  if (props.autoHideControls) {
    showControls.value = false
  }
}

onMounted(() => {
  if (props.autoHideControls) {
    showControls.value = true
    controlsTimeout.value = setTimeout(() => {
      showControls.value = false
    }, props.hideControlsDelay)
  } else {
    showControls.value = true
  }
})

onBeforeUnmount(() => {
  if (controlsTimeout.value) {
    clearTimeout(controlsTimeout.value)
  }
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
      class="w-full rounded-3xl"
      :autoplay="autoplay"
      :loop="loop"
      :muted="muted"
      @loadedmetadata="onLoadedMetadata"
      @timeupdate="updateProgress"
      @ended="onVideoEnd"
      @click="togglePlayPause"
    ></video>

    <!-- Gradient overlay -->
    <div
      v-if="controls && showControls"
      class="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-red-900 to-transparent rounded-3xl pointer-events-none"
    ></div>

    <!-- Controls -->
    <Transition name="fade">
      <div v-if="controls && showControls" class="absolute bottom-0 left-0 right-0 p-4">
        <!-- Progress bar -->
        <input
          type="range"
          :max="duration"
          :value="currentTime"
          step="0.01"
          @input="seek"
          class="w-full h-0.5 bg-black rounded-lg cursor-pointer accent-white mb-4"
        />

        <!-- Control buttons -->
        <div class="flex items-center justify-between text-white">
          <!-- Left controls -->
          <div class="flex items-center gap-3">
            <button @click.stop="togglePlayPause" class="hover:scale-110 transition">
              <i v-if="isPlaying" class="pi pi-pause text-xl"></i>
              <i v-else class="pi pi-play text-xl"></i>
            </button>

            <span class="text-md"> {{ formattedTime }} / {{ formattedDuration }} </span>
          </div>

          <!-- Right controls -->
          <div class="flex items-center gap-3">
            <button @click.stop="toggleMute" class="hover:scale-110 transition">
              <i v-if="volume === 0" class="pi pi-volume-off text-xl"></i>
              <i v-else class="pi pi-volume-up text-xl"></i>
            </button>

            <input
              type="range"
              v-model="volume"
              @input="updateVolume"
              min="0"
              max="1"
              step="0.01"
              class="w-20 h-0.5 bg-black rounded-lg cursor-pointer accent-white"
            />
          </div>
        </div>
      </div>
    </Transition>

    <!-- Center play/pause button -->
    <Transition name="flash">
      <div
        v-if="showControls && controls"
        class="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
      >
        <i v-if="isPlaying" class="pi pi-pause text-5xl text-white glowing-icon"></i>
        <i v-else class="pi pi-play text-5xl text-white glowing-icon"></i>
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
  transform: scale(3);
}

.glowing-icon {
  text-shadow:
    0 0 15px rgba(255, 0, 0, 0.7),
    0 0 25px rgba(255, 0, 0, 0.6),
    0 0 35px rgba(255, 0, 0, 0.5);
}
</style>
