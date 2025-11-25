// src/composables/utils/useMediaQuery.ts
/**
 * useMediaQuery - Reactive media queries
 */

import { ref, onMounted, onUnmounted, computed } from 'vue'

export function useMediaQuery(query: string) {
  const matches = ref(false)
  let mediaQuery: MediaQueryList | undefined

  const update = () => {
    matches.value = mediaQuery?.matches ?? false
  }

  onMounted(() => {
    if (typeof window === 'undefined') return

    mediaQuery = window.matchMedia(query)
    update()
    mediaQuery.addEventListener('change', update)
  })

  onUnmounted(() => {
    mediaQuery?.removeEventListener('change', update)
  })

  return matches
}

export function usePreferredDark() {
  return useMediaQuery('(prefers-color-scheme: dark)')
}

export function usePreferredReducedMotion() {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}

export function useBreakpoints() {
  const sm = useMediaQuery('(min-width: 640px)')
  const md = useMediaQuery('(min-width: 768px)')
  const lg = useMediaQuery('(min-width: 1024px)')
  const xl = useMediaQuery('(min-width: 1280px)')
  const xxl = useMediaQuery('(min-width: 1536px)')

  const current = computed(() => {
    if (xxl.value) return '2xl'
    if (xl.value) return 'xl'
    if (lg.value) return 'lg'
    if (md.value) return 'md'
    if (sm.value) return 'sm'
    return 'xs'
  })

  return {
    sm,
    md,
    lg,
    xl,
    xxl,
    current,
    isMobile: computed(() => !md.value),
    isTablet: computed(() => md.value && !lg.value),
    isDesktop: computed(() => lg.value),
  }
}
