// src/directives/vTooltip.ts
import type { DirectiveBinding } from 'vue'

interface TooltipElement extends HTMLElement {
  _tooltip?: {
    element: HTMLElement
    showHandler: () => void
    hideHandler: () => void
  }
}

export default {
  mounted(el: TooltipElement, binding: DirectiveBinding) {
    const tooltipText = binding.value
    if (!tooltipText) return

    const position = (binding.arg as 'top' | 'bottom' | 'left' | 'right') || 'top'

    let tooltipElement: HTMLElement | null = null

    const showTooltip = () => {
      // Удаляем предыдущий tooltip если есть
      if (tooltipElement) {
        hideTooltip()
      }

      tooltipElement = document.createElement('div')
      tooltipElement.className =
        'absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg whitespace-nowrap pointer-events-none transition-opacity duration-200'
      tooltipElement.textContent = tooltipText
      tooltipElement.style.opacity = '0'

      document.body.appendChild(tooltipElement)

      // Вычисляем позицию
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

      // Проверяем границы viewport
      const padding = 8
      top = Math.max(padding, Math.min(top, window.innerHeight - tooltipRect.height - padding))
      left = Math.max(padding, Math.min(left, window.innerWidth - tooltipRect.width - padding))

      tooltipElement.style.top = `${top}px`
      tooltipElement.style.left = `${left}px`

      // Анимация появления
      requestAnimationFrame(() => {
        if (tooltipElement) {
          tooltipElement.style.opacity = '1'
        }
      })
    }

    const hideTooltip = () => {
      if (tooltipElement) {
        tooltipElement.style.opacity = '0'
        setTimeout(() => {
          if (tooltipElement) {
            tooltipElement.remove()
            tooltipElement = null
          }
        }, 200) // Ждем завершения анимации
      }
    }

    // Сохраняем обработчики
    el._tooltip = {
      element: tooltipElement!,
      showHandler: showTooltip,
      hideHandler: hideTooltip,
    }

    el.addEventListener('mouseenter', showTooltip)
    el.addEventListener('mouseleave', hideTooltip)
    el.addEventListener('click', hideTooltip) // Скрываем при клике
  },

  updated(el: TooltipElement, binding: DirectiveBinding) {
    // Если текст изменился - пересоздаем tooltip
    if (binding.value !== binding.oldValue) {
      if (el._tooltip) {
        el._tooltip.hideHandler()
      }
      // Обновляем будет при следующем hover
    }
  },

  beforeUnmount(el: TooltipElement) {
    if (el._tooltip) {
      const { showHandler, hideHandler } = el._tooltip

      el.removeEventListener('mouseenter', showHandler)
      el.removeEventListener('mouseleave', hideHandler)
      el.removeEventListener('click', hideHandler)

      // Удаляем tooltip элемент
      hideHandler()

      delete el._tooltip
    }
  },
}
