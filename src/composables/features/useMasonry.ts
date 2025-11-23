/**
 * useMasonry Composable
 *
 * Masonry layout calculations
 */

import { ref, computed, watch, onMounted, onUnmounted, type Ref } from 'vue'
import { useWindowSize } from '@/composables'
import {
  calculateColumnsCount,
  distributeItems,
  calculateContainerHeight,
  type MasonryColumn,
} from '@/utils/masonry'

export interface UseMasonryOptions {
  /**
   * Ширина колонки (px)
   * @default 272
   */
  columnWidth?: number

  /**
   * Gap между элементами (px)
   * @default 16
   */
  gap?: number

  /**
   * Минимальное количество колонок
   * @default 1
   */
  minColumns?: number

  /**
   * Максимальное количество колонок
   * @default Infinity
   */
  maxColumns?: number

  /**
   * Debounce для resize (ms)
   * @default 100
   */
  resizeDebounce?: number
}

/**
 * useMasonry
 *
 * @example
 * ```ts
 * const containerRef = ref<HTMLElement>()
 *
 * const { columnsCount, containerHeight, recalculate } = useMasonry(containerRef, {
 *   columnWidth: 272,
 *   gap: 16
 * })
 * ```
 */
export function useMasonry(
  containerRef: Ref<HTMLElement | null | undefined>,
  options: UseMasonryOptions = {},
) {
  const {
    columnWidth = 272,
    gap = 16,
    minColumns = 1,
    maxColumns = Infinity,
    resizeDebounce = 100,
  } = options

  const { width: windowWidth } = useWindowSize()

  const columnsCount = ref(1)
  const columns = ref<MasonryColumn[]>([])
  const containerHeight = ref(0)

  const calculate = () => {
    const container = unref(containerRef)
    if (!container) return

    const containerWidth = container.offsetWidth
    let cols = calculateColumnsCount(containerWidth, columnWidth, gap)

    // Clamp columns
    cols = Math.max(minColumns, Math.min(maxColumns, cols))
    columnsCount.value = cols

    // Get items
    const items = Array.from(container.children) as HTMLElement[]
    if (items.length === 0) return

    // Distribute items
    const distributedColumns = distributeItems(items, cols)
    columns.value = distributedColumns

    // Calculate height
    const height = calculateContainerHeight(distributedColumns)
    containerHeight.value = height
  }

  const recalculate = () => {
    calculate()
  }

  // Watch window resize
  let resizeTimeout: ReturnType<typeof setTimeout> | undefined
  watch(windowWidth, () => {
    if (resizeTimeout) clearTimeout(resizeTimeout)
    resizeTimeout = setTimeout(recalculate, resizeDebounce)
  })

  // Initial calculation
  onMounted(() => {
    calculate()
  })

  onUnmounted(() => {
    if (resizeTimeout) clearTimeout(resizeTimeout)
  })

  return {
    columnsCount,
    columns,
    containerHeight,
    recalculate,
  }
}

/**
 * useMasonryGrid
 *
 * CSS Grid masonry fallback
 *
 * @example
 * ```ts
 * const { gridTemplateColumns, gap } = useMasonryGrid()
 * ```
 */
export function useMasonryGrid(options: UseMasonryOptions = {}) {
  const { columnWidth = 272, gap = 16 } = options
  const { width: windowWidth } = useWindowSize()

  const columnsCount = computed(() => {
    return calculateColumnsCount(windowWidth.value, columnWidth, gap)
  })

  const gridTemplateColumns = computed(() => {
    return `repeat(${columnsCount.value}, 1fr)`
  })

  const gridGap = computed(() => {
    return `${gap}px`
  })

  const containerStyle = computed(() => ({
    display: 'grid',
    gridTemplateColumns: gridTemplateColumns.value,
    gap: gridGap.value,
  }))

  return {
    columnsCount,
    gridTemplateColumns,
    gridGap,
    containerStyle,
  }
}
