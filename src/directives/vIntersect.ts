import type { DirectiveBinding } from 'vue'

interface IntersectElement extends HTMLElement {
  intersectObserver?: IntersectionObserver
}

export default {
  mounted(el: IntersectElement, binding: DirectiveBinding) {
    const options = {
      root: null,
      rootMargin: binding.arg || '0px',
      threshold: typeof binding.value === 'object' ? binding.value.threshold : 0,
    }

    const callback = typeof binding.value === 'function' ? binding.value : binding.value?.callback

    if (!callback) {
      console.warn('v-intersect: callback function not provided')
      return
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        callback(entry.isIntersecting, entry)
      })
    }, options)

    el.intersectObserver = observer
    observer.observe(el)
  },

  beforeUnmount(el: IntersectElement) {
    if (el.intersectObserver) {
      el.intersectObserver.disconnect()
      delete el.intersectObserver
    }
  },
}
