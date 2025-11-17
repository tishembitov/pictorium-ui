import { DirectiveBinding } from 'vue'

interface TooltipElement extends HTMLElement {
  tooltipElement?: HTMLElement
  showTooltip?: () => void
  hideTooltip?: () => void
}

export default {
  mounted(el: TooltipElement, binding: DirectiveBinding) {
    const tooltipText = binding.value
    const position = binding.arg || 'top' // top, bottom, left, right

    let tooltip: HTMLElement | null = null

    const showTooltip = () => {
      if (!tooltip && tooltipText) {
        tooltip = document.createElement('div')
        tooltip.className =
          'absolute z-50 px-3 py-2 text-sm text-white bg-black rounded-lg shadow-lg whitespace-nowrap pointer-events-none'
        tooltip.textContent = tooltipText

        document.body.appendChild(tooltip)

        const rect = el.getBoundingClientRect()
        const tooltipRect = tooltip.getBoundingClientRect()

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

        tooltip.style.top = `${top}px`
        tooltip.style.left = `${left}px`

        // Анимация появления
        tooltip.style.opacity = '0'
        setTimeout(() => {
          if (tooltip) tooltip.style.opacity = '1'
        }, 0)
      }
    }

    const hideTooltip = () => {
      if (tooltip) {
        tooltip.remove()
        tooltip = null
      }
    }

    el.showTooltip = showTooltip
    el.hideTooltip = hideTooltip
    el.tooltipElement = tooltip || undefined

    el.addEventListener('mouseenter', showTooltip)
    el.addEventListener('mouseleave', hideTooltip)
  },

  beforeUnmount(el: TooltipElement) {
    if (el.showTooltip) {
      el.removeEventListener('mouseenter', el.showTooltip)
    }
    if (el.hideTooltip) {
      el.removeEventListener('mouseleave', el.hideTooltip)
    }
    if (el.tooltipElement) {
      el.tooltipElement.remove()
    }
  },
}
