// src/composables/features/useAnimations.ts
/**
 * useAnimations - Like/Save animations
 *
 * Reactive обертки над utils/animations.ts
 */

import { ref, unref, watch, onUnmounted, type Ref } from 'vue'

/**
 * useLikeAnimation - Heart animation для лайков
 */
export function useLikeAnimation(elementRef: Ref<HTMLElement | null>) {
  const isAnimating = ref(false)

  const animate = () => {
    const el = unref(elementRef)
    if (!el || isAnimating.value) return

    isAnimating.value = true

    // Добавляем CSS класс для анимации
    el.classList.add('like-animation')

    // Scale up then down
    el.style.transition = 'transform 150ms ease-out'
    el.style.transform = 'scale(1.2)'

    setTimeout(() => {
      el.style.transform = 'scale(1)'
    }, 150)

    setTimeout(() => {
      el.classList.remove('like-animation')
      el.style.transition = ''
      el.style.transform = ''
      isAnimating.value = false
    }, 500)
  }

  return { isAnimating, animate }
}

/**
 * useHeartBurst - Double-tap heart effect
 */
export function useHeartBurst(containerRef: Ref<HTMLElement | null>) {
  const hearts: HTMLElement[] = []

  const burst = (x?: number, y?: number) => {
    const container = unref(containerRef)
    if (!container) return

    const heart = document.createElement('div')
    heart.innerHTML = '❤️'
    heart.className = 'absolute text-6xl pointer-events-none z-50'
    heart.style.cssText = `
      left: ${x !== undefined ? `${x}px` : '50%'};
      top: ${y !== undefined ? `${y}px` : '50%'};
      transform: ${x === undefined ? 'translate(-50%, -50%)' : 'none'};
      animation: heart-burst 1s ease-out forwards;
    `

    container.appendChild(heart)
    hearts.push(heart)

    setTimeout(() => {
      heart.remove()
      const index = hearts.indexOf(heart)
      if (index > -1) hearts.splice(index, 1)
    }, 1000)
  }

  // Cleanup
  onUnmounted(() => {
    hearts.forEach((heart) => heart.remove())
  })

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
  let cleanup: (() => void) | undefined

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
      el.addEventListener('touchend', handleTap, { passive: false })

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
    el.classList.add('bounce-animation')

    setTimeout(() => {
      el.classList.remove('bounce-animation')
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

    el.style.transition = 'transform 100ms ease-out, filter 300ms ease-out'
    el.style.transform = 'scale(1.1)'
    el.style.filter = 'drop-shadow(0 0 4px currentColor)'

    setTimeout(() => {
      el.style.transform = 'scale(1)'
    }, 100)

    setTimeout(() => {
      el.style.transition = ''
      el.style.transform = ''
      el.style.filter = ''
      isAnimating.value = false
    }, 300)
  }

  return { isAnimating, animate }
}

/**
 * usePulseAnimation - Generic pulse для loading states
 */
export function usePulseAnimation(elementRef: Ref<HTMLElement | null>) {
  const isAnimating = ref(false)

  const start = () => {
    const el = unref(elementRef)
    if (!el) return

    isAnimating.value = true
    el.classList.add('animate-pulse')
  }

  const stop = () => {
    const el = unref(elementRef)
    if (!el) return

    isAnimating.value = false
    el.classList.remove('animate-pulse')
  }

  onUnmounted(stop)

  return { isAnimating, start, stop }
}
