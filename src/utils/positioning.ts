// Popover positioning utilities (из старого кода CommentSection, Pin.vue)

export type PopoverPosition = 'top' | 'bottom' | 'left' | 'right' | 'auto'

export interface Position {
  top?: number
  bottom?: number
  left?: number
  right?: number
}

export interface PositionOptions {
  offset?: number
  container?: HTMLElement
}

// Calculate if element should be positioned on top or bottom
export function shouldPositionTop(
  element: HTMLElement,
  container: HTMLElement = document.body,
  threshold: number = 320,
): boolean {
  const rect = element.getBoundingClientRect()
  const containerRect = container.getBoundingClientRect()
  const distanceToBottom = containerRect.bottom - rect.bottom

  return distanceToBottom >= threshold
}

// Calculate popover position
export function calculatePopoverPosition(
  triggerElement: HTMLElement,
  popoverElement: HTMLElement,
  preferredPosition: PopoverPosition = 'bottom',
  options: PositionOptions = {},
): Position {
  const { offset = 10, container = document.body } = options

  const triggerRect = triggerElement.getBoundingClientRect()
  const popoverRect = popoverElement.getBoundingClientRect()
  const containerRect = container.getBoundingClientRect()

  const position: Position = {}

  // Auto-detect best position if needed
  let finalPosition = preferredPosition
  if (preferredPosition === 'auto') {
    finalPosition = shouldPositionTop(triggerElement, container) ? 'top' : 'bottom'
  }

  switch (finalPosition) {
    case 'top':
      position.bottom = containerRect.height - triggerRect.top + offset
      position.left = triggerRect.left - containerRect.left
      break

    case 'bottom':
      position.top = triggerRect.bottom - containerRect.top + offset
      position.left = triggerRect.left - containerRect.left
      break

    case 'left':
      position.top = triggerRect.top - containerRect.top
      position.right = containerRect.width - triggerRect.left + offset
      break

    case 'right':
      position.top = triggerRect.top - containerRect.top
      position.left = triggerRect.right - containerRect.left + offset
      break
  }

  return position
}

// Check if element fits in viewport
export function fitsInViewport(
  element: HTMLElement,
  position: PopoverPosition,
): boolean {
  if (position === 'auto') return true
  const rect = element.getBoundingClientRect()
  const viewportHeight = window.innerHeight
  const viewportWidth = window.innerWidth

  switch (position) {
    case 'top':
      return rect.top >= 0
    case 'bottom':
      return rect.bottom <= viewportHeight
    case 'left':
      return rect.left >= 0
    case 'right':
      return rect.right <= viewportWidth
    default:
      return true
  }
}

// Get optimal position (tries to fit in viewport)
export function getOptimalPosition(
  triggerElement: HTMLElement,
  popoverElement: HTMLElement,
  preferredPosition: PopoverPosition = 'bottom',
): PopoverPosition {
  if (preferredPosition !== 'auto') {
    const tempPosition = calculatePopoverPosition(triggerElement, popoverElement, preferredPosition)
    applyPosition(popoverElement, tempPosition)

    if (fitsInViewport(popoverElement, preferredPosition)) {
      return preferredPosition
    }
  }

  // Try all positions
  const positions: PopoverPosition[] = ['bottom', 'top', 'right', 'left']

  for (const pos of positions) {
    const tempPosition = calculatePopoverPosition(triggerElement, popoverElement, pos)
    applyPosition(popoverElement, tempPosition)

    if (fitsInViewport(popoverElement, pos)) {
      return pos
    }
  }

  return 'bottom' // Default fallback
}

// Apply position to element
export function applyPosition(element: HTMLElement, position: Position): void {
  if (position.top !== undefined) {
    element.style.top = `${position.top}px`
    element.style.bottom = 'auto'
  }

  if (position.bottom !== undefined) {
    element.style.bottom = `${position.bottom}px`
    element.style.top = 'auto'
  }

  if (position.left !== undefined) {
    element.style.left = `${position.left}px`
    element.style.right = 'auto'
  }

  if (position.right !== undefined) {
    element.style.right = `${position.right}px`
    element.style.left = 'auto'
  }
}

// Center element in viewport
export function centerInViewport(element: HTMLElement): void {
  const rect = element.getBoundingClientRect()
  const left = (window.innerWidth - rect.width) / 2
  const top = (window.innerHeight - rect.height) / 2

  element.style.left = `${left}px`
  element.style.top = `${top}px`
}
