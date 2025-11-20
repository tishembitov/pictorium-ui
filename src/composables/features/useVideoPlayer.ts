/**
 * useVideoPlayer Composable
 *
 * Custom video player controls
 */

import { ref, computed, watch, onUnmounted, type Ref } from 'vue'
import { formatDuration } from '@/utils/formatters'

export interface UseVideoPlayerOptions {
  /**
   * Autoplay
   * @default false
   */
  autoplay?: boolean

  /**
   * Loop
   * @default false
   */
  loop?: boolean

  /**
   * Muted
   * @default false
   */
  muted?: boolean

  /**
   * Volume (0-1)
   * @default 1
   */
  volume?: number

  /**
   * Playback rate
   * @default 1
   */
  playbackRate?: number

  /**
   * Автоскрытие controls (ms)
   * @default 2000
   */
  controlsTimeout?: number
}

/**
 * useVideoPlayer
 *
 * @example
 * ```ts
 * const videoRef = ref<HTMLVideoElement>()
 *
 * const {
 *   isPlaying,
 *   currentTime,
 *   duration,
 *   volume,
 *   play,
 *   pause,
 *   seek,
 *   togglePlay
 * } = useVideoPlayer(videoRef)
 * ```
 */
export function useVideoPlayer(
  videoRef: Ref<HTMLVideoElement | null | undefined>,
  options: UseVideoPlayerOptions = {},
) {
  const {
    autoplay = false,
    loop = false,
    muted = false,
    volume: initialVolume = 1,
    playbackRate: initialPlaybackRate = 1,
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
  const playbackRate = ref(initialPlaybackRate)
  const isFullscreen = ref(false)
  const showControls = ref(true)

  // Computed
  const progress = computed(() => {
    if (duration.value === 0) return 0
    return (currentTime.value / duration.value) * 100
  })

  const formattedCurrentTime = computed(() => formatDuration(currentTime.value))
  const formattedDuration = computed(() => formatDuration(duration.value))
  const formattedRemaining = computed(() => formatDuration(duration.value - currentTime.value))

  const canPlay = computed(() => duration.value > 0)
  const hasEnded = computed(() => currentTime.value >= duration.value && duration.value > 0)

  // Controls timeout
  let controlsTimeoutId: ReturnType<typeof setTimeout> | undefined

  const resetControlsTimeout = () => {
    showControls.value = true

    if (controlsTimeoutId) clearTimeout(controlsTimeoutId)

    if (isPlaying.value) {
      controlsTimeoutId = setTimeout(() => {
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
    } catch (error) {
      console.error('[useVideoPlayer] Play failed:', error)
    }
  }

  const pause = () => {
    const video = unref(videoRef)
    if (!video) return

    video.pause()
    isPlaying.value = false
    isPaused.value = true
    showControls.value = true

    if (controlsTimeoutId) clearTimeout(controlsTimeoutId)
  }

  const togglePlay = () => {
    if (isPlaying.value) {
      pause()
    } else {
      play()
    }
  }

  const seek = (time: number) => {
    const video = unref(videoRef)
    if (!video) return

    video.currentTime = Math.max(0, Math.min(time, duration.value))
    currentTime.value = video.currentTime
  }

  const seekBy = (delta: number) => {
    seek(currentTime.value + delta)
  }

  const seekToPercent = (percent: number) => {
    const time = (percent / 100) * duration.value
    seek(time)
  }

  const setVolume = (value: number) => {
    const video = unref(videoRef)
    if (!video) return

    const clampedVolume = Math.max(0, Math.min(1, value))
    video.volume = clampedVolume
    volume.value = clampedVolume

    if (clampedVolume === 0) {
      isMuted.value = true
    } else if (isMuted.value) {
      isMuted.value = false
    }
  }

  const toggleMute = () => {
    const video = unref(videoRef)
    if (!video) return

    video.muted = !video.muted
    isMuted.value = video.muted
  }

  const setPlaybackRate = (rate: number) => {
    const video = unref(videoRef)
    if (!video) return

    video.playbackRate = rate
    playbackRate.value = rate
  }

  const toggleFullscreen = async () => {
    const video = unref(videoRef)
    if (!video) return

    try {
      if (!isFullscreen.value) {
        if (video.requestFullscreen) {
          await video.requestFullscreen()
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen()
        }
      }
    } catch (error) {
      console.error('[useVideoPlayer] Fullscreen toggle failed:', error)
    }
  }

  const restart = () => {
    seek(0)
    play()
  }

  // Event listeners
  const setupEventListeners = (video: HTMLVideoElement) => {
    const handlePlay = () => {
      isPlaying.value = true
      isPaused.value = false
    }

    const handlePause = () => {
      isPlaying.value = false
      isPaused.value = true
    }

    const handleTimeUpdate = () => {
      currentTime.value = video.currentTime
    }

    const handleDurationChange = () => {
      duration.value = video.duration
    }

    const handleVolumeChange = () => {
      volume.value = video.volume
      isMuted.value = video.muted
    }

    const handleWaiting = () => {
      isBuffering.value = true
    }

    const handleCanPlay = () => {
      isBuffering.value = false
    }

    const handleEnded = () => {
      isPlaying.value = false
      isPaused.value = true
      showControls.value = true
    }

    const handleFullscreenChange = () => {
      isFullscreen.value = !!document.fullscreenElement
    }

    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('durationchange', handleDurationChange)
    video.addEventListener('volumechange', handleVolumeChange)
    video.addEventListener('waiting', handleWaiting)
    video.addEventListener('canplay', handleCanPlay)
    video.addEventListener('ended', handleEnded)
    document.addEventListener('fullscreenchange', handleFullscreenChange)

    return () => {
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('durationchange', handleDurationChange)
      video.removeEventListener('volumechange', handleVolumeChange)
      video.removeEventListener('waiting', handleWaiting)
      video.removeEventListener('canplay', handleCanPlay)
      video.removeEventListener('ended', handleEnded)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }

  // Watch video ref
  watch(
    videoRef,
    (video, oldVideo) => {
      if (oldVideo && cleanup) {
        cleanup()
      }

      if (!video) return

      // Setup
      video.autoplay = autoplay
      video.loop = loop
      video.muted = muted
      video.volume = initialVolume
      video.playbackRate = initialPlaybackRate

      cleanup = setupEventListeners(video)
    },
    { immediate: true },
  )

  let cleanup: (() => void) | undefined

  onUnmounted(() => {
    cleanup?.()
    if (controlsTimeoutId) clearTimeout(controlsTimeoutId)
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
    playbackRate,
    isFullscreen,
    showControls,

    // Computed
    progress,
    formattedCurrentTime,
    formattedDuration,
    formattedRemaining,
    canPlay,
    hasEnded,

    // Actions
    play,
    pause,
    togglePlay,
    seek,
    seekBy,
    seekToPercent,
    setVolume,
    toggleMute,
    setPlaybackRate,
    toggleFullscreen,
    restart,
    resetControlsTimeout,
  }
}

/**
 * useVideoKeyboardControls
 *
 * Keyboard shortcuts для video player
 *
 * @example
 * ```ts
 * const videoPlayer = useVideoPlayer(videoRef)
 *
 * useVideoKeyboardControls(videoRef, videoPlayer, {
 *   enabled: isHovering
 * })
 * ```
 */
export function useVideoKeyboardControls(
  videoRef: Ref<HTMLVideoElement | null | undefined>,
  player: ReturnType<typeof useVideoPlayer>,
  options: {
    enabled?: Ref<boolean>
  } = {},
) {
  const { enabled = ref(true) } = options

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!enabled.value) return

    const { key } = event

    switch (key) {
      case ' ':
      case 'k':
        event.preventDefault()
        player.togglePlay()
        break

      case 'ArrowLeft':
        event.preventDefault()
        player.seekBy(-5)
        break

      case 'ArrowRight':
        event.preventDefault()
        player.seekBy(5)
        break

      case 'ArrowUp':
        event.preventDefault()
        player.setVolume(player.volume.value + 0.1)
        break

      case 'ArrowDown':
        event.preventDefault()
        player.setVolume(player.volume.value - 0.1)
        break

      case 'm':
        event.preventDefault()
        player.toggleMute()
        break

      case 'f':
        event.preventDefault()
        player.toggleFullscreen()
        break

      case '0':
      case 'Home':
        event.preventDefault()
        player.seek(0)
        break

      case 'End':
        event.preventDefault()
        player.seek(player.duration.value)
        break
    }
  }

  watch(
    videoRef,
    (video) => {
      if (!video) return

      video.addEventListener('keydown', handleKeyDown)

      return () => {
        video.removeEventListener('keydown', handleKeyDown)
      }
    },
    { immediate: true },
  )
}
