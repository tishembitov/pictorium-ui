// src/utils/storage.ts
import { STORAGE_KEYS } from './constants'

// ============================================================================
// GENERIC STORAGE
// ============================================================================

export function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.error('Error reading from localStorage:', error)
    return defaultValue
  }
}

export function setToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error('Error writing to localStorage:', error)
  }
}

export function removeFromStorage(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error('Error removing from localStorage:', error)
  }
}

export function clearStorage(): void {
  try {
    localStorage.clear()
  } catch (error) {
    console.error('Error clearing localStorage:', error)
  }
}

// ============================================================================
// RECENT SEARCHES
// ============================================================================

export function getRecentSearches(): string[] {
  return getFromStorage<string[]>(STORAGE_KEYS.RECENT_SEARCHES, [])
}

export function addRecentSearch(query: string, maxItems: number = 10): void {
  const searches = getRecentSearches()
  const filtered = searches.filter((s) => s.toLowerCase() !== query.toLowerCase())
  filtered.unshift(query)
  setToStorage(STORAGE_KEYS.RECENT_SEARCHES, filtered.slice(0, maxItems))
}

export function removeRecentSearch(query: string): void {
  const searches = getRecentSearches()
  setToStorage(
    STORAGE_KEYS.RECENT_SEARCHES,
    searches.filter((s) => s !== query),
  )
}

export function clearRecentSearches(): void {
  removeFromStorage(STORAGE_KEYS.RECENT_SEARCHES)
}

// ============================================================================
// CHAT SETTINGS
// ============================================================================

export function getChatSize(): number {
  return getFromStorage<number>(STORAGE_KEYS.CHAT_SIZE, 400)
}

export function setChatSize(size: number): void {
  setToStorage(STORAGE_KEYS.CHAT_SIZE, size)
}

export function getChatSide(): boolean {
  return getFromStorage<boolean>(STORAGE_KEYS.CHAT_SIDE, false)
}

export function setChatSide(side: boolean): void {
  setToStorage(STORAGE_KEYS.CHAT_SIDE, side)
}

export function getChatColor(): string {
  return getFromStorage<string>(STORAGE_KEYS.CHAT_COLOR, 'red')
}

export function setChatColor(color: string): void {
  setToStorage(STORAGE_KEYS.CHAT_COLOR, color)
}
