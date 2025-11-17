<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { scrollToTop as scrollToTopUtil } from '@/utils/scroll'
import { debounce } from '@/utils/helpers'
import { DEBOUNCE_DELAY } from '@/utils/constants'

export interface ScrollToTopProps {
  threshold?: number
  behavior?: 'smooth' | 'auto'
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center'
  offset?: number
  debounceDelay?: number
}

const props = withDefaults(defineProps<ScrollToTopProps>(), {
  threshold: 300,
  behavior: 'smooth',
  position: 'bottom-right',
  offset: 24,
  debounceDelay: DEBOUNCE_DELAY,
})

const showButton = ref(false)

const handleScroll = debounce(() => {
  showButton.value = window.scrollY > props.threshold
}, props.debounceDelay)

const scrollToTop = () => {
  scrollToTopUtil(props.behavior === 'smooth')
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  // Initial check
  handleScroll()
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
})

const positionClasses = {
  'bottom-right': 'bottom-6 right-6',
  'bottom-left': 'bottom-6 left-6',
  'bottom-center': 'bottom-6 left-1/2 -translate-x-1/2',
}
</script>

<template>
  <Transition name="fade-scale">
    <button
      v-if="showButton"
      @click="scrollToTop"
      :class="[
        'fixed z-40 p-4 rounded-full bg-white shadow-lg hover:shadow-xl transition-all duration-300',
        'hover:bg-red-50 active:scale-95 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2',
        positionClasses[position],
      ]"
      :style="{ bottom: `${offset}px` }"
      aria-label="Scroll to top"
      type="button"
    >
      <svg
        class="w-6 h-6 text-red-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M5 10l7-7m0 0l7 7m-7-7v18"
        />
      </svg>
    </button>
  </Transition>
</template>

<style scoped>
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.3s ease;
}

.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.8) translateY(20px);
}

.fade-scale-enter-to,
.fade-scale-leave-from {
  opacity: 1;
  transform: scale(1) translateY(0);
}
</style>
