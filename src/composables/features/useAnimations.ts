/**
 * useAnimations Composable
 *
 * Like/Dislike animations для пинов и комментариев
 */

import { ref, type Ref } from 'vue'
import {
  flashAnimation,
  glowEffect,
  scaleUp,
  scaleDown,
  bounce,
  triggerAnimation,
  type AnimationCallbacks,
} from '@/utils/animations'

/**
 * useLikeAnimation
 *
 * Анимация лайка с heart effect
 *
 * @example
 * ```ts
 * const buttonRef = ref<HTMLElement>()
 *
 * const { animate, isAnimating } = useLikeAnimation(buttonRef)
 *
 * async function handleLike() {
 *   await animate()
 *   // Perform like action
 * }
 * ```
 */
export function useLikeAnimation(elementRef: Ref<HTMLElement | null | undefined>) {
  const isAnimating = ref(false)

  const animate = async (callbacks?: AnimationCallbacks) => {
    const element = unref(elementRef)
    if (!element || isAnimating.value) return

    isAnimating.value = true

    callbacks?.onStart?.()

    // Flash + Scale animation
    flashAnimation(element, 500)
    scaleUp(element, 1.2, 150)

    setTimeout(() => {
      scaleDown(element, 150)
    }, 150)

    setTimeout(() => {
      isAnimating.value = false
      callbacks?.onEnd?.()
    }, 500)
  }

  return {
    isAnimating,
    animate,
  }
}

/**
 * useHeartBurst
 *
 * Heart burst effect (как в Instagram/Pinterest)
 *
 * @example
 * ```ts
 * const containerRef = ref<HTMLElement>()
 *
 * const { burst } = useHeartBurst(containerRef)
 *
 * function handleDoubleTap() {
 *   burst()
 * }
 * ```
 */
export function useHeartBurst(containerRef: Ref<HTMLElement | null | undefined>) {
  const burst = (x?: number, y?: number) => {
    const container = unref(containerRef)
    if (!container) return

    const heart = document.createElement('div')
    heart.innerHTML = '❤️'
    heart.className = 'absolute text-6xl pointer-events-none z-50 heart-burst'

    // Position
    if (x !== undefined && y !== undefined) {
      heart.style.left = `${x}px`
      heart.style.top = `${y}px`
    } else {
      heart.style.left = '50%'
      heart.style.top = '50%'
      heart.style.transform = 'translate(-50%, -50%)'
    }

    container.appendChild(heart)

    // Animate
    setTimeout(() => {
      heart.classList.add('animate-heart-burst')
    }, 10)

    // Remove after animation
    setTimeout(() => {
      heart.remove()
    }, 1000)
  }

  return {
    burst,
  }
}

/**
 * useDoubleTap
 *
 * Double tap detection для мобильных устройств
 *
 * @example
 * ```ts
 * const imageRef = ref<HTMLElement>()
 *
 * useDoubleTap(imageRef, () => {
 *   likePin()
 *   burst()
 * })
 * ```
 */
export function useDoubleTap(
  elementRef: Ref<HTMLElement | null | undefined>,
  onDoubleTap: (event: MouseEvent | TouchEvent) => void,
  delay = 300,
) {
  let lastTap = 0

  const handleTap = (event: MouseEvent | TouchEvent) => {
    const now = Date.now()
    const timeSinceLastTap = now - lastTap

    if (timeSinceLastTap < delay && timeSinceLastTap > 0) {
      event.preventDefault()
      onDoubleTap(event)
      lastTap = 0
    } else {
      lastTap = now
    }
  }

  watch(
    elementRef,
    (element) => {
      if (!element) return

      element.addEventListener('click', handleTap)
      element.addEventListener('touchend', handleTap)

      return () => {
        element.removeEventListener('click', handleTap)
        element.removeEventListener('touchend', handleTap)
      }
    },
    { immediate: true },
  )
}

/**
 * useCommentLikeAnimation
 *
 * Subtle like animation для комментариев
 */
export function useCommentLikeAnimation(elementRef: Ref<HTMLElement | null | undefined>) {
  const isAnimating = ref(false)

  const animate = async () => {
    const element = unref(elementRef)
    if (!element || isAnimating.value) return

    isAnimating.value = true

    // Subtle glow + scale
    glowEffect(element, 300)
    scaleUp(element, 1.1, 100)

    setTimeout(() => {
      scaleDown(element, 100)
    }, 100)

    setTimeout(() => {
      isAnimating.value = false
    }, 300)
  }

  return {
    isAnimating,
    animate,
  }
}

/**
 * useSaveAnimation
 *
 * Pin save animation
 */
export function useSaveAnimation(elementRef: Ref<HTMLElement | null | undefined>) {
  const isAnimating = ref(false)

  const animate = async () => {
    const element = unref(elementRef)
    if (!element || isAnimating.value) return

    isAnimating.value = true

    // Bounce animation
    bounce(element, 500)

    setTimeout(() => {
      isAnimating.value = false
    }, 500)
  }

  return {
    isAnimating,
    animate,
  }
}

/**
 * useRippleEffect
 *
 * Material Design ripple effect
 *
 * @example
 * ```ts
 * const buttonRef = ref<HTMLElement>()
 *
 * useRippleEffect(buttonRef)
 * ```
 */
export function useRippleEffect(elementRef: Ref<HTMLElement | null | undefined>) {
  const createRipple = (event: MouseEvent) => {
    const element = unref(elementRef)
    if (!element) return

    const rect = element.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    const x = event.clientX - rect.left - size / 2
    const y = event.clientY - rect.top - size / 2

    const ripple = document.createElement('span')
    ripple.className = 'ripple'
    ripple.style.width = ripple.style.height = `${size}px`
    ripple.style.left = `${x}px`
    ripple.style.top = `${y}px`

    element.appendChild(ripple)

    setTimeout(() => {
      ripple.remove()
    }, 600)
  }

  watch(
    elementRef,
    (element) => {
      if (!element) return

      element.classList.add('ripple-container')
      element.addEventListener('click', createRipple)

      return () => {
        element.removeEventListener('click', createRipple)
      }
    },
    { immediate: true },
  )
}
