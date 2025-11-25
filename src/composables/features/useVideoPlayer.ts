// src/composables/features/useVideoPlayer.ts
/**
 * useVideoPlayer - Custom video player controls
 *
 * Уникальный composable - нет аналога в stores/utils
 */

import { ref, computed, watch, unref, onUnmounted, type Ref } from 'vue'
import { formatDuration } from '@/utils/formatters'

export interface UseVideoPlayerOptions {
  autoplay?: boolean
  loop?: boolean
  muted?: boolean
  volume?: number
  controlsTimeout?: number
}

export function useVideoPlayer(
  videoRef: Ref<HTMLVideoElement | null>,
  options: UseVideoPlayerOptions = {},
) {
  const {
    autoplay = false,
    loop = false,
    muted = false,
    volume: initialVolume = 1,
    controlsTimeout = 2000,
  } = options

  // State
  const isPlaying = ref(false)
  const isPaused = ref(true)
  const isBuffering = ref(false)
  const currentTime = ref(0)
  const duration = ref(0)
  const volume = ref(initialVolume)
  const isMuted = ref(muted)
  const isFullscreen = ref(false)
  const showControls = ref(true)

  // Computed
  const progress = computed(() =>
    duration.value > 0 ? (currentTime.value / duration.value) * 100 : 0,
  )
  const formattedTime = computed(() => formatDuration(currentTime.value))
  const formattedDuration = computed(() => formatDuration(duration.value))
  const canPlay = computed(() => duration.value > 0)

  // Controls timeout
  let controlsTimer: ReturnType<typeof setTimeout> | undefined

  const resetControlsTimeout = () => {
    showControls.value = true
    if (controlsTimer) clearTimeout(controlsTimer)

    if (isPlaying.value) {
      controlsTimer = setTimeout(() => {
        showControls.value = false
      }, controlsTimeout)
    }
  }

  // Actions
  const play = async () => {
    const video = unref(videoRef)
    if (!video) return

    try {
      await video.play()
      isPlaying.value = true
      isPaused.value = false
      resetControlsTimeout()
    } catch (err) {
      console.error('[VideoPlayer] Play failed:', err)
    }
  }

  const pause = () => {
    const video = unref(videoRef)
    if (!video) return

    video.pause()
    isPlaying.value = false
    isPaused.value = true
    showControls.value = true
    if (controlsTimer) clearTimeout(controlsTimer)
  }

  const togglePlay = () => (isPlaying.value ? pause() : play())

  const seek = (time: number) => {
    const video = unref(videoRef)
    if (!video) return

    video.currentTime = Math.max(0, Math.min(time, duration.value))
    currentTime.value = video.currentTime
  }

  const seekBy = (delta: number) => seek(currentTime.value + delta)

  const setVolume = (value: number) => {
    const video = unref(videoRef)
    if (!video) return

    const v = Math.max(0, Math.min(1, value))
    video.volume = v
    volume.value = v
    isMuted.value = v === 0
  }

  const toggleMute = () => {
    const video = unref(videoRef)
    if (!video) return

    video.muted = !video.muted
    isMuted.value = video.muted
  }

  const toggleFullscreen = async () => {
    const video = unref(videoRef)
    if (!video) return

    try {
      if (!isFullscreen.value) {
        await video.requestFullscreen?.()
      } else {
        await document.exitFullscreen?.()
      }
    } catch (err) {
      console.error('[VideoPlayer] Fullscreen failed:', err)
    }
  }

  // Event setup
  let cleanup: (() => void) | undefined

  watch(
    videoRef,
    (video) => {
      cleanup?.()
      if (!video) return

      video.autoplay = autoplay
      video.loop = loop
      video.muted = muted
      video.volume = initialVolume

      const handlers = {
        play: () => {
          isPlaying.value = true
          isPaused.value = false
        },
        pause: () => {
          isPlaying.value = false
          isPaused.value = true
        },
        timeupdate: () => {
          currentTime.value = video.currentTime
        },
        durationchange: () => {
          duration.value = video.duration
        },
        volumechange: () => {
          volume.value = video.volume
          isMuted.value = video.muted
        },
        waiting: () => {
          isBuffering.value = true
        },
        canplay: () => {
          isBuffering.value = false
        },
        ended: () => {
          isPlaying.value = false
          isPaused.value = true
          showControls.value = true
        },
      }

      const fullscreenHandler = () => {
        isFullscreen.value = !!document.fullscreenElement
      }

      Object.entries(handlers).forEach(([event, handler]) => video.addEventListener(event, handler))
      document.addEventListener('fullscreenchange', fullscreenHandler)

      cleanup = () => {
        Object.entries(handlers).forEach(([event, handler]) =>
          video.removeEventListener(event, handler),
        )
        document.removeEventListener('fullscreenchange', fullscreenHandler)
      }
    },
    { immediate: true },
  )

  onUnmounted(() => {
    cleanup?.()
    if (controlsTimer) clearTimeout(controlsTimer)
  })

  return {
    // State
    isPlaying,
    isPaused,
    isBuffering,
    currentTime,
    duration,
    volume,
    isMuted,
    isFullscreen,
    showControls,

    // Computed
    progress,
    formattedTime,
    formattedDuration,
    canPlay,

    // Actions
    play,
    pause,
    togglePlay,
    seek,
    seekBy,
    setVolume,
    toggleMute,
    toggleFullscreen,
    resetControlsTimeout,
  }
}
