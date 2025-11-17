// Masonry layout utilities

export interface MasonryColumn {
  index: number
  height: number
  items: HTMLElement[]
}

// Calculate columns count based on container width
export function calculateColumnsCount(
  containerWidth: number,
  columnWidth: number = 272, // Default width из старого Pin.vue
  gap: number = 16,
): number {
  const columns = Math.floor((containerWidth + gap) / (columnWidth + gap))
  return Math.max(1, columns)
}

// Get shortest column
export function getShortestColumn(columns: MasonryColumn[]): MasonryColumn {
  return columns.reduce((shortest, current) =>
    current.height < shortest.height ? current : shortest,
  )
}

// Get tallest column
export function getTallestColumn(columns: MasonryColumn[]): MasonryColumn {
  return columns.reduce((tallest, current) => (current.height > tallest.height ? current : tallest))
}

// Calculate item height based on aspect ratio
export function calculateItemHeight(width: number, aspectRatio: number): number {
  return Math.round(width * aspectRatio)
}

// Distribute items across columns
export function distributeItems(items: HTMLElement[], columnsCount: number): MasonryColumn[] {
  const columns: MasonryColumn[] = Array.from({ length: columnsCount }, (_, index) => ({
    index,
    height: 0,
    items: [],
  }))

  items.forEach((item) => {
    const shortestColumn = getShortestColumn(columns)
    shortestColumn.items.push(item)
    shortestColumn.height += item.offsetHeight
  })

  return columns
}

// Calculate grid item position
export interface ItemPosition {
  column: number
  top: number
  left: number
}

export function calculateItemPosition(
  itemIndex: number,
  columns: MasonryColumn[],
  columnWidth: number,
  gap: number,
): ItemPosition {
  let currentIndex = 0

  for (const column of columns) {
    if (currentIndex + column.items.length > itemIndex) {
      const indexInColumn = itemIndex - currentIndex
      const top = column.items
        .slice(0, indexInColumn)
        .reduce((sum, item) => sum + item.offsetHeight + gap, 0)

      return {
        column: column.index,
        top,
        left: column.index * (columnWidth + gap),
      }
    }
    currentIndex += column.items.length
  }

  return { column: 0, top: 0, left: 0 }
}

// Calculate container height
export function calculateContainerHeight(columns: MasonryColumn[]): number {
  const tallestColumn = getTallestColumn(columns)
  return tallestColumn.height
}
