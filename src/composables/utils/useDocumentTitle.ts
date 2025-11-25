// src/composables/utils/useDocumentTitle.ts
/**
 * useDocumentTitle - Document title management
 * НЕТ аналога в directives
 */

import { watch, unref, computed, onUnmounted, type MaybeRef } from 'vue'
import { useRoute } from 'vue-router'

export interface UseDocumentTitleOptions {
  restore?: boolean
  template?: string | ((title: string) => string)
}

export function useDocumentTitle(
  newTitle: MaybeRef<string | null | undefined>,
  options: UseDocumentTitleOptions = {},
) {
  const { restore = true, template } = options
  const originalTitle = document.title

  const formatTitle = (title: string): string => {
    if (!template) return title
    if (typeof template === 'function') return template(title)
    return template.replace('%s', title)
  }

  watch(
    () => unref(newTitle),
    (title) => {
      if (title) document.title = formatTitle(title)
    },
    { immediate: true },
  )

  if (restore) {
    onUnmounted(() => {
      document.title = originalTitle
    })
  }
}

export function usePageTitle(title: MaybeRef<string>, appName = 'Pinterest Clone') {
  useDocumentTitle(title, { template: `%s | ${appName}`, restore: true })
}

export function useRouteTitle(appName = 'Pinterest Clone') {
  const route = useRoute()
  const title = computed(() => (route.meta.title as string) || appName)
  useDocumentTitle(title, {
    template: (t) => (t === appName ? t : `${t} | ${appName}`),
  })
}
