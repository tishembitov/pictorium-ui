// src/directives/vClickOutside.ts
import type { DirectiveBinding } from 'vue'

interface ClickOutsideElement extends HTMLElement {
  _clickOutside?: {
    handler: (event: MouseEvent) => void
    stopPropagation: boolean
  }
}

export default {
  mounted(el: ClickOutsideElement, binding: DirectiveBinding) {
    const handler = (event: MouseEvent) => {
      // Проверяем, что клик был вне элемента
      const target = event.target as Node
      if (!(el === target || el.contains(target))) {
        // Вызываем callback
        if (typeof binding.value === 'function') {
          binding.value(event)
        } else if (typeof binding.value?.handler === 'function') {
          binding.value.handler(event)
        }
      }
    }

    // Опция для остановки всплытия
    const stopPropagation = binding.value?.stopPropagation ?? false

    // Сохраняем handler
    el._clickOutside = {
      handler,
      stopPropagation,
    }

    // Используем capture phase для более надежного определения
    // И добавляем в microtask queue чтобы пропустить текущий клик
    setTimeout(() => {
      document.addEventListener('click', handler, true)
    }, 0)
  },

  updated(el: ClickOutsideElement, binding: DirectiveBinding) {
    // Обновляем handler если изменился
    if (el._clickOutside && binding.value !== binding.oldValue) {
      const oldHandler = el._clickOutside.handler

      // Удаляем старый
      document.removeEventListener('click', oldHandler, true)

      // Создаем новый
      const newHandler = (event: MouseEvent) => {
        const target = event.target as Node
        if (!(el === target || el.contains(target))) {
          if (typeof binding.value === 'function') {
            binding.value(event)
          } else if (typeof binding.value?.handler === 'function') {
            binding.value.handler(event)
          }
        }
      }

      el._clickOutside.handler = newHandler
      document.addEventListener('click', newHandler, true)
    }
  },

  beforeUnmount(el: ClickOutsideElement) {
    if (el._clickOutside) {
      document.removeEventListener('click', el._clickOutside.handler, true)
      delete el._clickOutside
    }
  },
}
