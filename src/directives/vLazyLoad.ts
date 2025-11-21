import type { DirectiveBinding } from 'vue'

interface LazyLoadElement extends HTMLElement {
  lazyLoadObserver?: IntersectionObserver
  _lazyLoadUrl?: string // Храним текущий URL
}

// Функция загрузки
const loadImage = (el: LazyLoadElement, imageUrl: string) => {
  if (el.tagName === 'IMG') {
    el.setAttribute('src', imageUrl)
  } else {
    el.style.backgroundImage = `url(${imageUrl})`
  }
  // Добавляем класс для анимации появления (опционально)
  el.classList.add('loaded')
}

export default {
  mounted(el: LazyLoadElement, binding: DirectiveBinding) {
    el._lazyLoadUrl = binding.value

    // Изначально скрываем или ставим placeholder
    // el.style.opacity = '0'
    // el.style.transition = 'opacity 0.3s'

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Загружаем текущий URL
            if (el._lazyLoadUrl) {
              loadImage(el, el._lazyLoadUrl)
              // el.style.opacity = '1'
            }
            observer.disconnect()
          }
        })
      },
      {
        rootMargin: '50px',
      },
    )

    el.lazyLoadObserver = observer
    observer.observe(el)
  },

  // Добавляем updated для реактивности
  updated(el: LazyLoadElement, binding: DirectiveBinding) {
    if (binding.value !== binding.oldValue) {
      el._lazyLoadUrl = binding.value

      if (!el.lazyLoadObserver) {
        // Наблюдатель отключен, обновляем сразу
        loadImage(el, binding.value)
      }
      // Если наблюдатель активен, он сработает сам с новым _lazyLoadUrl
    }
  },

  beforeUnmount(el: LazyLoadElement) {
    if (el.lazyLoadObserver) {
      el.lazyLoadObserver.disconnect()
      delete el.lazyLoadObserver
    }
  },
}
