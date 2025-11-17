import { DirectiveBinding } from 'vue'

interface ClickOutsideElement extends HTMLElement {
  clickOutsideEvent?: (event: MouseEvent) => void
}

export default {
  mounted(el: ClickOutsideElement, binding: DirectiveBinding) {
    el.clickOutsideEvent = (event: MouseEvent) => {
      // Проверяем, что клик был вне элемента
      if (!(el === event.target || el.contains(event.target as Node))) {
        // Вызываем функцию из binding.value
        if (typeof binding.value === 'function') {
          binding.value(event)
        }
      }
    }

    // Небольшая задержка, чтобы не сработало сразу
    setTimeout(() => {
      document.addEventListener('click', el.clickOutsideEvent!)
    }, 0)
  },

  beforeUnmount(el: ClickOutsideElement) {
    if (el.clickOutsideEvent) {
      document.removeEventListener('click', el.clickOutsideEvent)
      delete el.clickOutsideEvent
    }
  },
}
