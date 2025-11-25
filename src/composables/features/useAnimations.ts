// src/composables/features/useAnimations.ts
/**
 * useAnimations - Like/Save animations
 *
 * Reactive обертки над utils/animations.ts
 * Добавляют isAnimating state и lifecycle management
 */

import { ref, unref, watch, onUnmounted, type Ref } from 'vue'
import { flashAnimation, glowEffect, scaleUp, scaleDown, bounce } from '@/utils/animations'

/**
 * useLikeAnimation - Heart animation для лайков
 */
export function useLikeAnimation(elementRef: Ref<HTMLElement | null>) {
  const isAnimating = ref(false)

  const animate = () => {
    const el = unref(elementRef)
    if (!el || isAnimating.value) return

    isAnimating.value = true

    flashAnimation(el, 500)
    scaleUp(el, 1.2, 150)

    setTimeout(() => scaleDown(el, 150), 150)
    setTimeout(() => {
      isAnimating.value = false
    }, 500)
  }

  return { isAnimating, animate }
}

/**
 * useHeartBurst - Double-tap heart effect
 */
export function useHeartBurst(containerRef: Ref<HTMLElement | null>) {
  const burst = (x?: number, y?: number) => {
    const container = unref(containerRef)
    if (!container) return

    const heart = document.createElement('div')
    heart.innerHTML = '❤️'
    heart.className = 'absolute text-6xl pointer-events-none z-50 animate-heart-burst'
    heart.style.left = x !== undefined ? `${x}px` : '50%'
    heart.style.top = y !== undefined ? `${y}px` : '50%'

    if (x === undefined) heart.style.transform = 'translate(-50%, -50%)'

    container.appendChild(heart)
    setTimeout(() => heart.remove(), 1000)
  }

  return { burst }
}

/**
 * useDoubleTap - Double tap detection
 */
export function useDoubleTap(
  elementRef: Ref<HTMLElement | null>,
  onDoubleTap: (e: MouseEvent | TouchEvent) => void,
  delay = 300,
) {
  let lastTap = 0

  const handleTap = (e: MouseEvent | TouchEvent) => {
    const now = Date.now()
    if (now - lastTap < delay && now - lastTap > 0) {
      e.preventDefault()
      onDoubleTap(e)
      lastTap = 0
    } else {
      lastTap = now
    }
  }

  watch(
    elementRef,
    (el, _, onCleanup) => {
      if (!el) return

      el.addEventListener('click', handleTap)
      el.addEventListener('touchend', handleTap)

      onCleanup(() => {
        el.removeEventListener('click', handleTap)
        el.removeEventListener('touchend', handleTap)
      })
    },
    { immediate: true },
  )
}

/**
 * useSaveAnimation - Pin save animation
 */
export function useSaveAnimation(elementRef: Ref<HTMLElement | null>) {
  const isAnimating = ref(false)

  const animate = () => {
    const el = unref(elementRef)
    if (!el || isAnimating.value) return

    isAnimating.value = true
    bounce(el, 500)
    setTimeout(() => {
      isAnimating.value = false
    }, 500)
  }

  return { isAnimating, animate }
}

/**
 * useCommentLikeAnimation - Subtle animation для комментариев
 */
export function useCommentLikeAnimation(elementRef: Ref<HTMLElement | null>) {
  const isAnimating = ref(false)

  const animate = () => {
    const el = unref(elementRef)
    if (!el || isAnimating.value) return

    isAnimating.value = true
    glowEffect(el, 300)
    scaleUp(el, 1.1, 100)

    setTimeout(() => scaleDown(el, 100), 100)
    setTimeout(() => {
      isAnimating.value = false
    }, 300)
  }

  return { isAnimating, animate }
}
