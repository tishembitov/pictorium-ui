<!-- src/components/features/pins/detail/PinDetailMedia.vue -->
<script setup lang="ts">
/**
 * PinDetailMedia - Медиа компонент с кастомным видеоплеером
 * Использует: useVideoPlayer, useHover, formatDuration из utils
 * Анимация лайка встроена напрямую (без отдельного компонента)
 */

import { ref, computed, onActivated, onDeactivated } from 'vue'
import { useVideoPlayer } from '@/composables/features/useVideoPlayer'
import { useHover } from '@/composables/features/useHover'
import { formatDuration } from '@/utils/formatters'

export interface PinDetailMediaProps {
  imageSrc?: string | null
  videoSrc?: string | null
  alt?: string
  rgb?: string | null
  href?: string | null
  isGif?: boolean
}

const props = defineProps<PinDetailMediaProps>()

const emit = defineEmits<{
  (e: 'load'): void
  (e: 'openFullscreen'): void
  (e: 'doubleTap'): void
}>()

// Refs
const containerRef = ref<HTMLElement | null>(null)
const videoRef = ref<HTMLVideoElement | null>(null)

// State
const isMediaLoaded = ref(false)
const showViewLarge = ref(false)

// Like animation state (встроенная анимация)
const showLikeAnimation = ref(false)
const showDislikeAnimation = ref(false)

// Hover
const { isHovered } = useHover(containerRef, { enterDelay: 0, leaveDelay: 0 })

// Video player composable
const videoPlayer = props.videoSrc
  ? useVideoPlayer(videoRef, {
      autoplay: true,
      loop: true,
      muted: true,
      volume: 0,
      controlsTimeout: 2000,
    })
  : null

// Computed
const isVideo = computed(() => !!props.videoSrc)
const isImage = computed(() => !!props.imageSrc && !props.videoSrc)

const formattedTime = computed(() => videoPlayer?.formattedTime.value || '0:00')
const formattedVideoDuration = computed(() => videoPlayer?.formattedDuration.value || '0:00')

// Simulate hover on load (из старого проекта)
function simulateHover() {
  showViewLarge.value = true
  setTimeout(() => {
    showViewLarge.value = false
  }, 2000)
}

// Handlers
function onImageLoad() {
  isMediaLoaded.value = true
  simulateHover()
  emit('load')
}

function onVideoLoad() {
  isMediaLoaded.value = true
  emit('load')
}

function handleOpenFullscreen() {
  if (isImage.value) {
    emit('openFullscreen')
  }
}

// Double tap detection
let lastTap = 0
function handleTap() {
  const now = Date.now()
  if (now - lastTap < 300) {
    emit('doubleTap')
    lastTap = 0
  } else {
    lastTap = now
  }
}

function handleVideoClick() {
  videoPlayer?.togglePlay()
  handleTap()
}

function handleVolumeChange(event: Event) {
  const input = event.target as HTMLInputElement
  videoPlayer?.setVolume(parseFloat(input.value))
}

function handleSeek(event: Event) {
  const input = event.target as HTMLInputElement
  videoPlayer?.seek(parseFloat(input.value))
}

// KeepAlive lifecycle
onActivated(() => {
  if (videoPlayer && videoRef.value) {
    videoPlayer.play()
    videoPlayer.resetControlsTimeout()
  }
})

onDeactivated(() => {
  videoPlayer?.pause()
})

// Expose для parent
defineExpose({
  triggerLikeAnimation: () => {
    showLikeAnimation.value = true
    showDislikeAnimation.value = false
    setTimeout(() => {
      showLikeAnimation.value = false
    }, 500)
  },
  triggerDislikeAnimation: () => {
    showDislikeAnimation.value = true
    showLikeAnimation.value = false
    setTimeout(() => {
      showDislikeAnimation.value = false
    }, 500)
  },
})
</script>

<template>
  <div ref="containerRef" class="relative w-full max-w-2xl mx-auto">
    <!-- Image -->
    <div v-if="isImage" class="relative">
      <img
        :src="imageSrc!"
        :alt="alt || 'Pin image'"
        class="h-auto w-full rounded-3xl"
        @load="onImageLoad"
        @click="handleTap"
      />

      <!-- Like Animation (встроенная из старого проекта) -->
      <div
        class="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
      >
        <div class="relative flex items-center justify-center w-12 h-12">
          <Transition name="flash2">
            <i
              v-if="showDislikeAnimation"
              class="absolute pi pi-heart text-8xl text-white glowing-icon"
            />
          </Transition>
          <Transition name="flash2">
            <i
              v-if="showLikeAnimation"
              class="absolute pi pi-heart-fill text-8xl text-white glowing-icon"
            />
          </Transition>
        </div>
      </div>

      <!-- View larger button -->
      <div
        class="absolute right-2 bottom-2 cursor-pointer"
        @mouseover="showViewLarge = true"
        @click="handleOpenFullscreen"
        @mouseleave="showViewLarge = false"
      >
        <div
          :class="[
            'bg-white rounded-2xl bg-opacity-80 hover:bg-opacity-100 p-4 flex items-center justify-center transition-all duration-200 ease-in origin-right h-12',
            showViewLarge ? 'w-40' : 'w-12',
          ]"
          class="min-w-[3rem]"
        >
          <span
            v-if="showViewLarge"
            class="mr-2 transition-opacity duration-300 ease-in-out text-md text-nowrap truncate"
          >
            View larger
          </span>
          <i class="pi pi-arrow-up-right-and-arrow-down-left-from-center rotate-90" />
        </div>
      </div>

      <!-- Visit site button -->
      <div v-if="href && isHovered" class="absolute left-2 bottom-2 cursor-pointer font-semibold">
        <a :href="href" target="_blank" rel="noopener noreferrer" class="w-full inline-block">
          <div
            class="bg-white rounded-full bg-opacity-80 hover:bg-opacity-100 p-4 flex items-center justify-center transition-all duration-200 ease-in origin-right h-12"
          >
            <i class="pi pi-arrow-up-right mr-2" />
            <span
              class="mr-2 transition-opacity duration-300 ease-in-out text-md text-nowrap truncate"
            >
              Visit site
            </span>
          </div>
        </a>
      </div>
    </div>

    <!-- Video с custom controls -->
    <div
      v-if="isVideo && videoPlayer"
      class="relative"
      @mousemove="videoPlayer.resetControlsTimeout()"
    >
      <video
        ref="videoRef"
        :src="videoSrc!"
        class="w-full rounded-3xl block cursor-pointer"
        loop
        @loadeddata="onVideoLoad"
        @click="handleVideoClick"
      />

      <!-- GIF Badge -->
      <div
        v-if="isGif"
        class="absolute top-2 left-2 bg-gray-200 text-black rounded-2xl px-3 py-1 text-sm z-10"
      >
        GIF
      </div>

      <!-- Gradient Overlay -->
      <div
        v-if="videoPlayer.showControls.value"
        class="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-red-900 to-transparent rounded-3xl"
      />

      <!-- Controls -->
      <div
        v-if="videoPlayer.showControls.value"
        class="absolute bottom-10 left-4 right-4 flex items-center justify-between text-white"
      >
        <!-- Left: Play/Pause and Time -->
        <div class="flex items-center gap-3">
          <i
            v-if="videoPlayer.isPlaying.value"
            @click.stop="videoPlayer.pause()"
            class="pi pi-pause cursor-pointer text-xl"
          />
          <i v-else @click.stop="videoPlayer.play()" class="pi pi-play cursor-pointer text-xl" />
          <span class="text-md">{{ formattedTime }} / {{ formattedVideoDuration }}</span>
        </div>

        <!-- Right: Volume -->
        <div class="flex items-center gap-3 text-white">
          <i
            v-if="videoPlayer.isMuted.value || videoPlayer.volume.value === 0"
            @click.stop="videoPlayer.toggleMute()"
            class="pi pi-volume-off text-xl cursor-pointer"
          />
          <i
            v-else
            @click.stop="videoPlayer.toggleMute()"
            class="pi pi-volume-up text-xl cursor-pointer"
          />
          <input
            type="range"
            class="w-20 h-0.5 bg-black rounded-lg cursor-pointer accent-white"
            min="0"
            max="1"
            step="0.0005"
            :value="videoPlayer.volume.value"
            @input="handleVolumeChange"
          />
        </div>
      </div>

      <!-- Progress Bar -->
      <div v-if="videoPlayer.showControls.value" class="absolute bottom-4 left-4 right-4">
        <input
          type="range"
          class="w-full h-0.5 bg-black rounded-lg cursor-pointer accent-white"
          :max="videoPlayer.duration.value"
          min="0"
          step="0.01"
          :value="videoPlayer.currentTime.value"
          @input="handleSeek"
        />
      </div>

      <!-- Center Play/Pause indicator -->
      <div
        v-if="videoPlayer.showControls.value"
        class="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
      >
        <Transition name="flash">
          <i
            v-if="videoPlayer.isPlaying.value"
            class="pi pi-pause text-5xl text-white glowing-icon"
          />
        </Transition>
        <Transition name="flash">
          <i
            v-if="!videoPlayer.isPlaying.value"
            class="pi pi-play text-5xl text-white glowing-icon"
          />
        </Transition>
      </div>

      <!-- Like Animation on video -->
      <div
        class="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
      >
        <div class="relative flex items-center justify-center w-12 h-12">
          <Transition name="flash2">
            <i
              v-if="showDislikeAnimation"
              class="absolute pi pi-heart text-8xl text-white glowing-icon"
            />
          </Transition>
          <Transition name="flash2">
            <i
              v-if="showLikeAnimation"
              class="absolute pi pi-heart-fill text-8xl text-white glowing-icon"
            />
          </Transition>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Анимация play/pause */
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

.flash-enter-to,
.flash-leave-from {
  opacity: 1;
  transform: scale(1);
}

/* Анимация лайка из старого проекта */
.flash2-enter-active,
.flash2-leave-active {
  transition:
    opacity 0.5s ease-out,
    transform 0.5s cubic-bezier(0.3, 0.8, 0.2, 1);
}

.flash2-enter-from,
.flash2-leave-to {
  opacity: 0;
  transform: scale(3);
}

.flash2-enter-to,
.flash2-leave-from {
  opacity: 1;
  transform: scale(1);
}

.glowing-icon {
  text-shadow:
    0 0 15px rgba(255, 0, 0, 0.7),
    0 0 25px rgba(255, 0, 0, 0.6),
    0 0 35px rgba(255, 0, 0, 0.5);
}
</style>
