/**
 * usePopover Composable
 *
 * Popover positioning и управление
 */

import { ref, computed, watch, unref, nextTick, type Ref } from 'vue'
import {
  calculatePopoverPosition,
  shouldPositionTop,
  applyPosition,
  centerInViewport,
  type PopoverPosition,
  type Position,
} from '@/utils/positioning'

export interface PopoverOptions {
  position?: PopoverPosition
  offset?: number
  container?: HTMLElement
  closeOnClickOutside?: boolean
  closeOnEscape?: boolean
}

/**
 * usePopover
 *
 * Управление popover с positioning
 *
 * @example
 * ```ts
 * const triggerRef = ref<HTMLElement>()
 * const popoverRef = ref<HTMLElement>()
 *
 * const { isOpen, open, close, toggle } = usePopover(triggerRef, popoverRef, {
 *   position: 'bottom',
 *   offset: 10,
 *   closeOnClickOutside: true
 * })
 * ```
 */
export function usePopover(
  triggerRef: Ref<HTMLElement | null | undefined>,
  popoverRef: Ref<HTMLElement | null | undefined>,
  options: PopoverOptions = {},
) {
  const {
    position = 'bottom',
    offset = 10,
    container = document.body,
    closeOnClickOutside = true,
    closeOnEscape = true,
  } = options

  const isOpen = ref(false)
  const currentPosition = ref<Position>({})

  const open = async () => {
    isOpen.value = true

    await nextTick()

    const trigger = unref(triggerRef)
    const popover = unref(popoverRef)

    if (!trigger || !popover) return

    const pos = calculatePopoverPosition(trigger, popover, position, { offset, container })
    currentPosition.value = pos
    applyPosition(popover, pos)
  }

  const close = () => {
    isOpen.value = false
  }

  const toggle = () => {
    if (isOpen.value) {
      close()
    } else {
      open()
    }
  }

  // Close on click outside
  if (closeOnClickOutside) {
    watch(isOpen, (open) => {
      if (!open) return

      const handleClickOutside = (event: MouseEvent) => {
        const trigger = unref(triggerRef)
        const popover = unref(popoverRef)

        if (!trigger || !popover) return

        const target = event.target as Node

        if (!trigger.contains(target) && !popover.contains(target)) {
          close()
        }
      }

      setTimeout(() => {
        document.addEventListener('click', handleClickOutside)
      }, 0)

      return () => {
        document.removeEventListener('click', handleClickOutside)
      }
    })
  }

  // Close on Escape
  if (closeOnEscape) {
    watch(isOpen, (open) => {
      if (!open) return

      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          close()
        }
      }

      document.addEventListener('keydown', handleEscape)

      return () => {
        document.removeEventListener('keydown', handleEscape)
      }
    })
  }

  return {
    isOpen,
    currentPosition,
    open,
    close,
    toggle,
  }
}

/**
 * useDropdown
 *
 * Specialized popover для dropdown меню
 *
 * @example
 * ```ts
 * const buttonRef = ref<HTMLElement>()
 * const menuRef = ref<HTMLElement>()
 *
 * const { isOpen, toggle } = useDropdown(buttonRef, menuRef)
 * ```
 */
export function useDropdown(
  triggerRef: Ref<HTMLElement | null | undefined>,
  menuRef: Ref<HTMLElement | null | undefined>,
  options: Omit<PopoverOptions, 'position'> = {},
) {
  return usePopover(triggerRef, menuRef, {
    ...options,
    position: 'bottom',
  })
}

/**
 * useTooltip
 *
 * Tooltip с hover behavior
 *
 * @example
 * ```ts
 * const targetRef = ref<HTMLElement>()
 * const tooltipRef = ref<HTMLElement>()
 *
 * const { isVisible } = useTooltip(targetRef, tooltipRef, {
 *   delay: 200
 * })
 * ```
 */
export function useTooltip(
  targetRef: Ref<HTMLElement | null | undefined>,
  tooltipRef: Ref<HTMLElement | null | undefined>,
  options: {
    position?: PopoverPosition
    delay?: number
    offset?: number
  } = {},
) {
  const { position = 'top', delay = 200, offset = 8 } = options

  const isVisible = ref(false)
  let showTimeout: ReturnType<typeof setTimeout> | undefined
  let hideTimeout: ReturnType<typeof setTimeout> | undefined

  const show = async () => {
    if (hideTimeout) clearTimeout(hideTimeout)

    showTimeout = setTimeout(async () => {
      isVisible.value = true

      await nextTick()

      const target = unref(targetRef)
      const tooltip = unref(tooltipRef)

      if (!target || !tooltip) return

      const pos = calculatePopoverPosition(target, tooltip, position, { offset })
      applyPosition(tooltip, pos)
    }, delay)
  }

  const hide = () => {
    if (showTimeout) clearTimeout(showTimeout)

    hideTimeout = setTimeout(() => {
      isVisible.value = false
    }, 100)
  }

  // Setup event listeners
  watch(
    targetRef,
    (target) => {
      if (!target) return

      target.addEventListener('mouseenter', show)
      target.addEventListener('mouseleave', hide)
      target.addEventListener('focus', show)
      target.addEventListener('blur', hide)

      return () => {
        target.removeEventListener('mouseenter', show)
        target.removeEventListener('mouseleave', hide)
        target.removeEventListener('focus', show)
        target.removeEventListener('blur', hide)
      }
    },
    { immediate: true },
  )

  return {
    isVisible,
    show,
    hide,
  }
}

/**
 * useContextMenu
 *
 * Context menu (right-click menu)
 *
 * @example
 * ```ts
 * const targetRef = ref<HTMLElement>()
 * const menuRef = ref<HTMLElement>()
 *
 * const { isOpen, position } = useContextMenu(targetRef, menuRef)
 * ```
 */
export function useContextMenu(
  targetRef: Ref<HTMLElement | null | undefined>,
  menuRef: Ref<HTMLElement | null | undefined>,
) {
  const isOpen = ref(false)
  const position = ref<{ x: number; y: number }>({ x: 0, y: 0 })

  const open = (event: MouseEvent) => {
    event.preventDefault()

    isOpen.value = true
    position.value = { x: event.clientX, y: event.clientY }

    nextTick(() => {
      const menu = unref(menuRef)
      if (!menu) return

      menu.style.position = 'fixed'
      menu.style.left = `${event.clientX}px`
      menu.style.top = `${event.clientY}px`
    })
  }

  const close = () => {
    isOpen.value = false
  }

  // Setup context menu listener
  watch(
    targetRef,
    (target) => {
      if (!target) return

      target.addEventListener('contextmenu', open)

      return () => {
        target.removeEventListener('contextmenu', open)
      }
    },
    { immediate: true },
  )

  // Close on click outside
  watch(isOpen, (open) => {
    if (!open) return

    const handleClickOutside = () => {
      close()
    }

    setTimeout(() => {
      document.addEventListener('click', handleClickOutside)
    }, 0)

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  })

  return {
    isOpen,
    position,
    open,
    close,
  }
}
