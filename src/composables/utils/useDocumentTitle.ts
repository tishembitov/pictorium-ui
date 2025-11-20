/**
 * useDocumentTitle Composable
 *
 * Управление document.title
 */

import { watch, unref, type MaybeRef, computed, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'

export interface UseDocumentTitleOptions {
  /**
   * Восстановить оригинальный title при unmount
   * @default true
   */
  restore?: boolean

  /**
   * Template для title
   * @example '%s | My App'
   */
  template?: string | ((title: string) => string)
}

/**
 * useDocumentTitle
 *
 * @example
 * ```ts
 * // Простое использование
 * useDocumentTitle('Pin Detail')
 *
 * // С template
 * useDocumentTitle('Pin Detail', {
 *   template: '%s | Pinterest Clone'
 * })
 *
 * // Reactive
 * const pinTitle = ref('My Pin')
 * useDocumentTitle(computed(() => `${pinTitle.value} | Pinterest Clone`))
 * ```
 */
export function useDocumentTitle(
  newTitle: MaybeRef<string | null | undefined>,
  options: UseDocumentTitleOptions = {},
) {
  const { restore = true, template } = options

  const originalTitle = document.title

  const formatTitle = (title: string): string => {
    if (!template) return title

    if (typeof template === 'function') {
      return template(title)
    }

    return template.replace('%s', title)
  }

  watch(
    () => unref(newTitle),
    (title) => {
      if (title) {
        document.title = formatTitle(title)
      }
    },
    { immediate: true },
  )

  if (restore) {
    onUnmounted(() => {
      document.title = originalTitle
    })
  }
}

/**
 * usePageTitle
 *
 * Helper для страниц с автоматическим template
 *
 * @example
 * ```ts
 * // В компоненте страницы
 * usePageTitle('Home')
 * // -> "Home | Pinterest Clone"
 * ```
 */
export function usePageTitle(title: MaybeRef<string>, appName: string = 'Pinterest Clone') {
  useDocumentTitle(title, {
    template: `%s | ${appName}`,
    restore: true,
  })
}

/**
 * useRouteTitle
 *
 * Автоматический title из route.meta.title
 *
 * @example
 * ```ts
 * // В router/index.ts
 * {
 *   path: '/pin/:id',
 *   meta: { title: 'Pin Detail' }
 * }
 *
 * // В App.vue или layout
 * useRouteTitle()
 * ```
 */
export function useRouteTitle(appName: string = 'Pinterest Clone') {
  const route = useRoute()

  const title = computed(() => {
    const metaTitle = route.meta.title as string | undefined
    return metaTitle || appName
  })

  useDocumentTitle(title, {
    template: (t) => (t === appName ? t : `${t} | ${appName}`),
  })
}
