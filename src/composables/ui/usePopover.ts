// src/composables/ui/usePopover.ts
import { ref, unref, nextTick, watch, onUnmounted, type Ref } from 'vue'
import { calculatePopoverPosition, applyPosition, type PopoverPosition } from '@/utils/positioning'

export interface PopoverOptions {
  position?: PopoverPosition
  offset?: number
  closeOnClickOutside?: boolean
  closeOnEscape?: boolean
}

export function usePopover(
  triggerRef: Ref<HTMLElement | null>,
  popoverRef: Ref<HTMLElement | null>,
  options: PopoverOptions = {},
) {
  const {
    position = 'bottom',
    offset = 10,
    closeOnClickOutside = true,
    closeOnEscape = true,
  } = options

  const isOpen = ref(false)

  const updatePosition = () => {
    const trigger = unref(triggerRef)
    const popover = unref(popoverRef)
    if (!trigger || !popover) return

    const pos = calculatePopoverPosition(trigger, popover, position, { offset })
    applyPosition(popover, pos)
  }

  const open = async () => {
    isOpen.value = true
    await nextTick()
    updatePosition()
  }

  const close = () => {
    isOpen.value = false
  }

  const toggle = () => {
    isOpen.value ? close() : open()
  }

  // ✅ ИСПРАВЛЕНО: правильный cleanup
  let clickOutsideHandler: ((e: MouseEvent) => void) | undefined
  let escapeHandler: ((e: KeyboardEvent) => void) | undefined

  watch(isOpen, (open) => {
    // Cleanup previous handlers
    if (clickOutsideHandler) {
      document.removeEventListener('click', clickOutsideHandler)
      clickOutsideHandler = undefined
    }
    if (escapeHandler) {
      document.removeEventListener('keydown', escapeHandler)
      escapeHandler = undefined
    }

    if (!open) return

    // Click outside
    if (closeOnClickOutside) {
      clickOutsideHandler = (e: MouseEvent) => {
        const trigger = unref(triggerRef)
        const popover = unref(popoverRef)
        const target = e.target as Node

        if (trigger?.contains(target) || popover?.contains(target)) return
        close()
      }
      // Delay to prevent immediate close on open click
      setTimeout(() => {
        if (clickOutsideHandler) {
          document.addEventListener('click', clickOutsideHandler)
        }
      }, 0)
    }

    // Escape key
    if (closeOnEscape) {
      escapeHandler = (e: KeyboardEvent) => {
        if (e.key === 'Escape') close()
      }
      document.addEventListener('keydown', escapeHandler)
    }
  })

  // Cleanup on unmount
  onUnmounted(() => {
    if (clickOutsideHandler) {
      document.removeEventListener('click', clickOutsideHandler)
    }
    if (escapeHandler) {
      document.removeEventListener('keydown', escapeHandler)
    }
  })

  return { isOpen, open, close, toggle, updatePosition }
}

/**
 * useDropdown - Dropdown preset
 */
export function useDropdown(
  triggerRef: Ref<HTMLElement | null>,
  menuRef: Ref<HTMLElement | null>,
  options: Omit<PopoverOptions, 'position'> = {},
) {
  return usePopover(triggerRef, menuRef, { ...options, position: 'bottom' })
}

/**
 * useTooltip - Tooltip с задержкой
 */
export function useTooltip(
  targetRef: Ref<HTMLElement | null>,
  tooltipRef: Ref<HTMLElement | null>,
  options: { position?: PopoverPosition; delay?: number; offset?: number } = {},
) {
  const { position = 'top', delay = 200, offset = 8 } = options

  const isVisible = ref(false)
  let showTimeout: ReturnType<typeof setTimeout> | undefined

  const show = async () => {
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
    isVisible.value = false
  }

  // ✅ ИСПРАВЛЕНО: правильный cleanup
  watch(
    targetRef,
    (target, _, onCleanup) => {
      if (!target) return

      target.addEventListener('mouseenter', show)
      target.addEventListener('mouseleave', hide)

      onCleanup(() => {
        target.removeEventListener('mouseenter', show)
        target.removeEventListener('mouseleave', hide)
      })
    },
    { immediate: true },
  )

  onUnmounted(() => {
    if (showTimeout) clearTimeout(showTimeout)
  })

  return { isVisible, show, hide }
}
