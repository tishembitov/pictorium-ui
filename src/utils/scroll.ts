// Smooth scroll to element (из старого PortfolioView.vue)
export function scrollToElement(
  selector: string,
  offset: number = 80,
  duration: number = 1000,
): void {
  const target = document.querySelector(selector)
  if (!target) return

  const targetPosition = (target as HTMLElement).offsetTop - offset
  const startPosition = window.pageYOffset
  const distance = targetPosition - startPosition
  let startTime: number | null = null

  function animation(currentTime: number) {
    startTime ??= currentTime
    const timeElapsed = currentTime - startTime
    const run = easeInOutCubic(timeElapsed, startPosition, distance, duration)
    window.scrollTo(0, run)
    if (timeElapsed < duration) {
      requestAnimationFrame(animation)
    }
  }

  requestAnimationFrame(animation)
}

// Easing function
function easeInOutCubic(t: number, b: number, c: number, d: number): number {
  const ts = (t /= d) * t
  const tc = ts * t
  return b + c * (tc + -3 * ts + 3 * t)
}

// Scroll to top
export function scrollToTop(smooth: boolean = true): void {
  window.scrollTo({
    top: 0,
    behavior: smooth ? 'smooth' : 'auto',
  })
}

// Scroll to bottom
export function scrollToBottom(smooth: boolean = true): void {
  window.scrollTo({
    top: document.documentElement.scrollHeight,
    behavior: smooth ? 'smooth' : 'auto',
  })
}

// Check if scrolled to bottom
export function isScrolledToBottom(offset: number = 200): boolean {
  const scrollableHeight = document.documentElement.scrollHeight
  const currentScrollPosition = window.innerHeight + window.scrollY
  return currentScrollPosition + offset >= scrollableHeight
}

// Disable body scroll (для модалок)
export function disableBodyScroll(): void {
  document.body.classList.add('overflow-hidden')
}

// Enable body scroll
export function enableBodyScroll(): void {
  document.body.classList.remove('overflow-hidden')
}

// Get scroll position
export function getScrollPosition(): { x: number; y: number } {
  return {
    x: window.pageXOffset || document.documentElement.scrollLeft,
    y: window.pageYOffset || document.documentElement.scrollTop,
  }
}

// Set scroll position
export function setScrollPosition(x: number, y: number): void {
  window.scrollTo(x, y)
}

// Smooth horizontal scroll (для тегов)
export function smoothScrollHorizontal(
  container: HTMLElement,
  amount: number,
  duration: number = 300,
): void {
  const start = container.scrollLeft
  const startTime = performance.now()

  function scrollStep(currentTime: number) {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)
    const easeValue = easeInOutQuad(progress)

    container.scrollLeft = start + amount * easeValue

    if (elapsed < duration) {
      requestAnimationFrame(scrollStep)
    }
  }

  requestAnimationFrame(scrollStep)
}

// Easing for horizontal scroll
function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

// Check if element is in viewport
export function isInViewport(element: HTMLElement, offset: number = 0): boolean {
  const rect = element.getBoundingClientRect()
  return (
    rect.top >= -offset &&
    rect.left >= -offset &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + offset &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth) + offset
  )
}
