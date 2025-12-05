import type { DirectiveBinding } from 'vue'
import autoAnimate from '@formkit/auto-animate'

interface AutoAnimateElement extends HTMLElement {
  autoAnimateCleanup?: () => void
}

export default {
  mounted(el: AutoAnimateElement, binding: DirectiveBinding) {
    const options = binding.value || {}
    const cleanup = autoAnimate(el, options)
    el.autoAnimateCleanup = cleanup as unknown as () => void
  },

  beforeUnmount(el: AutoAnimateElement) {
    if (el.autoAnimateCleanup) {
      el.autoAnimateCleanup()
      delete el.autoAnimateCleanup
    }
  },
}
