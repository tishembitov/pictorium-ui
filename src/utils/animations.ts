// Like/Dislike animations (из старого кода комментариев и пинов)
export interface AnimationCallbacks {
  onStart?: () => void
  onEnd?: () => void
}

// Flash animation для лайков
export function flashAnimation(
  element: HTMLElement,
  duration: number = 500,
  callbacks?: AnimationCallbacks,
): void {
  callbacks?.onStart?.()

  element.classList.add('flash-animation')

  setTimeout(() => {
    element.classList.remove('flash-animation')
    callbacks?.onEnd?.()
  }, duration)
}

// Glow effect для иконок
export function glowEffect(element: HTMLElement, duration: number = 500): void {
  element.classList.add('glowing-icon')

  setTimeout(() => {
    element.classList.remove('glowing-icon')
  }, duration)
}

// Pulse scale animation (логотип загрузки)
export function pulseScale(element: HTMLElement): void {
  element.classList.add('pulse-scale')
}

export function stopPulseScale(element: HTMLElement): void {
  element.classList.remove('pulse-scale')
}

// Fade in/out
export function fadeIn(element: HTMLElement, duration: number = 300): Promise<void> {
  return new Promise((resolve) => {
    element.style.opacity = '0'
    element.style.display = 'block'

    requestAnimationFrame(() => {
      element.style.transition = `opacity ${duration}ms ease-in-out`
      element.style.opacity = '1'
    })

    setTimeout(() => {
      element.style.transition = ''
      resolve()
    }, duration)
  })
}

/**
 * Animation cleanup helper
 */
export function cleanupAnimation(element: HTMLElement, animationClass: string): void {
  element.classList.remove(animationClass)
  element.removeEventListener('animationend', () => {})
}

/**
 * Remove all animation classes
 */
export function removeAllAnimations(element: HTMLElement): void {
  const animationClasses = [
    'flash-animation',
    'glowing-icon',
    'pulse-scale',
    'shake-animation',
    'bounce-animation',
  ]

  animationClasses.forEach((className) => {
    element.classList.remove(className)
  })

  element.style.transition = ''
  element.style.transform = ''
  element.style.opacity = ''
}

export function fadeOut(element: HTMLElement, duration: number = 300): Promise<void> {
  return new Promise((resolve) => {
    element.style.transition = `opacity ${duration}ms ease-in-out`
    element.style.opacity = '0'

    setTimeout(() => {
      element.style.display = 'none'
      element.style.transition = ''
      resolve()
    }, duration)
  })
}

// Scale animation
export function scaleUp(element: HTMLElement, scale: number = 1.1, duration: number = 200): void {
  element.style.transition = `transform ${duration}ms ease-in-out`
  element.style.transform = `scale(${scale})`
}

export function scaleDown(element: HTMLElement, duration: number = 200): void {
  element.style.transition = `transform ${duration}ms ease-in-out`
  element.style.transform = 'scale(1)'
}

// Shake animation (для ошибок)
export function shake(element: HTMLElement, duration: number = 500): void {
  element.classList.add('shake-animation')

  setTimeout(() => {
    element.classList.remove('shake-animation')
  }, duration)
}

// Bounce animation
export function bounce(element: HTMLElement, duration: number = 1000): void {
  element.classList.add('bounce-animation')

  setTimeout(() => {
    element.classList.remove('bounce-animation')
  }, duration)
}

// Trigger CSS animation
export function triggerAnimation(
  element: HTMLElement,
  animationClass: string,
  duration?: number,
): Promise<void> {
  return new Promise((resolve) => {
    element.classList.add(animationClass)

    const handleAnimationEnd = () => {
      element.classList.remove(animationClass)
      element.removeEventListener('animationend', handleAnimationEnd)
      resolve()
    }

    if (duration) {
      setTimeout(handleAnimationEnd, duration)
    } else {
      element.addEventListener('animationend', handleAnimationEnd)
    }
  })
}
