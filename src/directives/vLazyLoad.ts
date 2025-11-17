import { DirectiveBinding } from 'vue'

interface LazyLoadElement extends HTMLElement {
  lazyLoadObserver?: IntersectionObserver
}

export default {
  mounted(el: LazyLoadElement, binding: DirectiveBinding) {
    const imageUrl = binding.value

    const loadImage = () => {
      if (el.tagName === 'IMG') {
        el.setAttribute('src', imageUrl)
      } else {
        el.style.backgroundImage = `url(${imageUrl})`
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadImage()
            observer.disconnect()
          }
        })
      },
      {
        rootMargin: '50px', // Загружаем за 50px до появления
      },
    )

    el.lazyLoadObserver = observer
    observer.observe(el)
  },

  beforeUnmount(el: LazyLoadElement) {
    if (el.lazyLoadObserver) {
      el.lazyLoadObserver.disconnect()
      delete el.lazyLoadObserver
    }
  },
}
