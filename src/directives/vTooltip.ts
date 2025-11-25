// src/directives/vTooltip.ts
import type { DirectiveBinding } from 'vue'

interface TooltipElement extends HTMLElement {
  _tooltip?: {
    element: HTMLElement | null
    showHandler: () => void
    hideHandler: () => void
    text: string
    position: 'top' | 'bottom' | 'left' | 'right'
    timeoutId?: ReturnType<typeof setTimeout> // ✅ ДОБАВЛЕНО
  }
}

export default {
  mounted(el: TooltipElement, binding: DirectiveBinding) {
    const tooltipText = binding.value
    if (!tooltipText) return

    const position = (binding.arg as 'top' | 'bottom' | 'left' | 'right') || 'top'

    let tooltipElement: HTMLElement | null = null

    const showTooltip = () => {
      if (tooltipElement) {
        hideTooltip()
      }

      tooltipElement = document.createElement('div')
      tooltipElement.className =
        'fixed z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg whitespace-nowrap pointer-events-none transition-opacity duration-200'
      tooltipElement.textContent = tooltipText
      tooltipElement.style.opacity = '0'

      document.body.appendChild(tooltipElement)

      const rect = el.getBoundingClientRect()
      const tooltipRect = tooltipElement.getBoundingClientRect()

      let top = 0
      let left = 0

      switch (position) {
        case 'top':
          top = rect.top - tooltipRect.height - 8
          left = rect.left + (rect.width - tooltipRect.width) / 2
          break
        case 'bottom':
          top = rect.bottom + 8
          left = rect.left + (rect.width - tooltipRect.width) / 2
          break
        case 'left':
          top = rect.top + (rect.height - tooltipRect.height) / 2
          left = rect.left - tooltipRect.width - 8
          break
        case 'right':
          top = rect.top + (rect.height - tooltipRect.height) / 2
          left = rect.right + 8
          break
      }

      const padding = 8
      top = Math.max(padding, Math.min(top, window.innerHeight - tooltipRect.height - padding))
      left = Math.max(padding, Math.min(left, window.innerWidth - tooltipRect.width - padding))

      tooltipElement.style.top = `${top}px`
      tooltipElement.style.left = `${left}px`

      requestAnimationFrame(() => {
        if (tooltipElement) {
          tooltipElement.style.opacity = '1'
        }
      })
    }

    const hideTooltip = () => {
      // ✅ ИСПРАВЛЕНО: очищаем timeout
      if (el._tooltip?.timeoutId) {
        clearTimeout(el._tooltip.timeoutId)
      }

      if (tooltipElement) {
        const elementToRemove = tooltipElement
        elementToRemove.style.opacity = '0'

        // ✅ ИСПРАВЛЕНО: сохраняем timeout ID
        el._tooltip!.timeoutId = setTimeout(() => {
          elementToRemove.remove()
        }, 200)

        tooltipElement = null
      }
    }

    el._tooltip = {
      element: tooltipElement,
      showHandler: showTooltip,
      hideHandler: hideTooltip,
      text: tooltipText,
      position,
    }

    el.addEventListener('mouseenter', showTooltip)
    el.addEventListener('mouseleave', hideTooltip)
    el.addEventListener('click', hideTooltip)
  },

  updated(el: TooltipElement, binding: DirectiveBinding) {
    if (binding.value !== binding.oldValue && el._tooltip) {
      el._tooltip.hideHandler()
      el._tooltip.text = binding.value
    }
  },

  beforeUnmount(el: TooltipElement) {
    if (el._tooltip) {
      const { showHandler, hideHandler, timeoutId } = el._tooltip

      // ✅ ИСПРАВЛЕНО: очищаем timeout при unmount
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      el.removeEventListener('mouseenter', showHandler)
      el.removeEventListener('mouseleave', hideHandler)
      el.removeEventListener('click', hideHandler)

      // Немедленно удаляем tooltip
      if (el._tooltip.element) {
        el._tooltip.element.remove()
      }

      delete el._tooltip
    }
  },
}
