<!-- src/components/features/tag/TagSearchInput.vue -->
<script setup lang="ts">
/**
 * TagSearchInput - Input для поиска тегов с автокомплитом
 */

import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import TagBadge from './TagBadge.vue'
import BaseLoader from '@/components/ui/BaseLoader.vue'
import { useTagSearch } from '@/composables/api/useTagSearch'
import { useDebouncedRef } from '@/composables/utils/useDebounce'
import { useLocalStorage } from '@/composables/utils/useLocalStorage'
import { randomTagColor } from '@/utils/colors'
import type { Tag } from '@/types'

export interface TagSearchInputProps {
  modelValue?: string
  placeholder?: string
  label?: string
  minSearchLength?: number
  showRecent?: boolean
  maxRecent?: number
  showPopular?: boolean
  popularTags?: Tag[]
  maxPopular?: number
  disabled?: boolean
  autofocus?: boolean
  size?: 'sm' | 'md' | 'lg'
  clearOnSelect?: boolean
  highlightMatch?: boolean
  recentStorageKey?: string
}

const props = withDefaults(defineProps<TagSearchInputProps>(), {
  modelValue: '',
  placeholder: 'Search tags...',
  label: '',
  minSearchLength: 2,
  showRecent: true,
  maxRecent: 5,
  showPopular: true,
  popularTags: () => [],
  maxPopular: 8,
  disabled: false,
  autofocus: false,
  size: 'md',
  clearOnSelect: false,
  highlightMatch: true,
  recentStorageKey: 'tag_search_recent',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  select: [tag: Tag]
  search: [query: string]
  clear: []
  focus: []
  blur: []
}>()

// ============================================================================
// REFS
// ============================================================================

const inputRef = ref<HTMLInputElement | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)

// ============================================================================
// STATE
// ============================================================================

const inputValue = ref(props.modelValue)
const debouncedInput = useDebouncedRef('', 250)
const isFocused = ref(false)
const showDropdown = ref(false)
const highlightedIndex = ref(-1)

// Recent searches
const recentSearches = useLocalStorage<string[]>(props.recentStorageKey, [])

// ============================================================================
// COMPOSABLES
// ============================================================================

const { suggestions, search, clear: clearSuggestions, isSearching } = useTagSearch(200)

// ============================================================================
// COMPUTED
// ============================================================================

const sizeClasses = computed(() => {
  const sizes = {
    sm: 'py-2 px-3 text-sm',
    md: 'py-3 px-4 text-base',
    lg: 'py-4 px-5 text-lg',
  }
  return sizes[props.size]
})

const suggestionsWithColors = computed(() => {
  return suggestions.value.map((tag) => ({
    ...tag,
    color: randomTagColor(),
  }))
})

const popularWithColors = computed(() => {
  return props.popularTags.slice(0, props.maxPopular).map((tag) => ({
    ...tag,
    color: randomTagColor(),
  }))
})

const recentAsTags = computed(() => {
  return recentSearches.value.slice(0, props.maxRecent).map((name, i) => ({
    id: `recent-${i}`,
    name,
    color: randomTagColor(),
  }))
})

const shouldShowDropdown = computed(() => {
  if (!isFocused.value) return false
  if (suggestionsWithColors.value.length > 0) return true
  if (props.showRecent && recentAsTags.value.length > 0 && !inputValue.value) return true
  if (props.showPopular && popularWithColors.value.length > 0 && !inputValue.value) return true
  return false
})

const allItems = computed(() => {
  if (suggestionsWithColors.value.length > 0) {
    return suggestionsWithColors.value
  }

  const items: Array<Tag & { color: string }> = []

  if (props.showRecent && !inputValue.value) {
    items.push(...recentAsTags.value)
  }

  if (props.showPopular && !inputValue.value) {
    items.push(...popularWithColors.value)
  }

  return items
})

// ============================================================================
// METHODS
// ============================================================================

function selectTag(tag: Tag): void {
  addToRecent(tag.name)
  emit('select', tag)
  emit('update:modelValue', tag.name)

  if (props.clearOnSelect) {
    inputValue.value = ''
  } else {
    inputValue.value = tag.name
  }

  closeDropdown()
}

function addToRecent(name: string): void {
  if (!props.showRecent) return
  const filtered = recentSearches.value.filter((s) => s.toLowerCase() !== name.toLowerCase())
  recentSearches.value = [name, ...filtered].slice(0, props.maxRecent)
}

function removeFromRecent(name: string): void {
  recentSearches.value = recentSearches.value.filter((s) => s !== name)
}

function clearRecent(): void {
  recentSearches.value = []
}

function clear(): void {
  inputValue.value = ''
  clearSuggestions()
  emit('clear')
  emit('update:modelValue', '')
}

function closeDropdown(): void {
  showDropdown.value = false
  highlightedIndex.value = -1
}

function focus(): void {
  inputRef.value?.focus()
}

function highlightText(text: string, query: string): string {
  if (!props.highlightMatch || !query) return text
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  return text.replace(regex, '<mark class="bg-yellow-200 rounded px-0.5">$1</mark>')
}

function scrollToHighlighted(): void {
  nextTick(() => {
    const highlighted = dropdownRef.value?.querySelector('.highlighted')
    highlighted?.scrollIntoView({ block: 'nearest' })
  })
}

// ============================================================================
// EVENT HANDLERS (с уникальными именами)
// ============================================================================

function onInputChange(event: Event): void {
  const target = event.target as HTMLInputElement
  inputValue.value = target.value
  emit('search', target.value)
}

function onInputKeydown(event: KeyboardEvent): void {
  if (props.disabled) return

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      if (allItems.value.length > 0) {
        highlightedIndex.value = Math.min(highlightedIndex.value + 1, allItems.value.length - 1)
        scrollToHighlighted()
      }
      break

    case 'ArrowUp':
      event.preventDefault()
      if (highlightedIndex.value > 0) {
        highlightedIndex.value--
        scrollToHighlighted()
      }
      break

    case 'Enter': {
      event.preventDefault()
      const selectedItem = allItems.value[highlightedIndex.value]
      if (highlightedIndex.value >= 0 && selectedItem) {
        selectTag(selectedItem)
      } else if (inputValue.value.trim()) {
        emit('search', inputValue.value.trim())
      }
      break
    }

    case 'Escape':
      event.preventDefault()
      closeDropdown()
      inputRef.value?.blur()
      break

    case 'Tab': {
      const tabSelectedItem = allItems.value[highlightedIndex.value]
      if (highlightedIndex.value >= 0 && tabSelectedItem) {
        event.preventDefault()
        selectTag(tabSelectedItem)
      }
      break
    }
  }
}

function onInputFocus(): void {
  isFocused.value = true
  showDropdown.value = true
  emit('focus')
}

function onInputBlur(): void {
  setTimeout(() => {
    isFocused.value = false
    closeDropdown()
    emit('blur')
  }, 200)
}

// ============================================================================
// WATCHERS
// ============================================================================

watch(
  () => props.modelValue,
  (value) => {
    inputValue.value = value
  },
)

watch(inputValue, (value) => {
  debouncedInput.value = value
})

watch(debouncedInput, async (value) => {
  if (value.trim().length >= props.minSearchLength) {
    await search(value)
    showDropdown.value = true
    highlightedIndex.value = -1
  } else {
    clearSuggestions()
  }
})

// ============================================================================
// LIFECYCLE
// ============================================================================

onMounted(() => {
  if (props.autofocus) {
    nextTick(() => focus())
  }
})

onUnmounted(() => {
  clearSuggestions()
})

// ============================================================================
// EXPOSE
// ============================================================================

defineExpose({
  focus,
  clear,
  clearRecent,
})
</script>

<template>
  <div class="w-full space-y-2">
    <!-- Label -->
    <label v-if="label" class="block text-sm font-medium text-gray-900">
      {{ label }}
    </label>

    <!-- Input Container -->
    <div class="relative">
      <!-- Input -->
      <div
        :class="[
          'flex items-center rounded-full border-2 transition-all duration-200',
          'bg-white overflow-hidden',
          isFocused
            ? 'border-purple-500 ring-2 ring-purple-100'
            : 'border-gray-300 hover:border-gray-400',
          disabled && 'opacity-50 cursor-not-allowed bg-gray-50',
        ]"
      >
        <!-- Search Icon -->
        <div class="pl-4">
          <i class="pi pi-search text-gray-400" />
        </div>

        <!-- Input -->
        <input
          ref="inputRef"
          :value="inputValue"
          type="text"
          :placeholder="placeholder"
          :disabled="disabled"
          :class="[
            'flex-1 bg-transparent border-none outline-none text-gray-900 placeholder-gray-400',
            sizeClasses,
          ]"
          autocomplete="off"
          spellcheck="false"
          role="combobox"
          aria-haspopup="listbox"
          :aria-expanded="shouldShowDropdown"
          @input="onInputChange"
          @keydown="onInputKeydown"
          @focus="onInputFocus"
          @blur="onInputBlur"
        />

        <!-- Loading -->
        <div v-if="isSearching" class="pr-4">
          <BaseLoader variant="spinner" size="sm" />
        </div>

        <!-- Clear Button -->
        <button
          v-else-if="inputValue && !disabled"
          type="button"
          class="pr-4 text-gray-400 hover:text-gray-600 transition"
          tabindex="-1"
          @click.stop="clear"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <!-- Dropdown -->
      <Transition name="dropdown">
        <div
          v-if="shouldShowDropdown"
          ref="dropdownRef"
          class="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-200 max-h-80 overflow-y-auto"
          role="listbox"
        >
          <!-- Suggestions -->
          <template v-if="suggestionsWithColors.length > 0">
            <div class="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50 sticky top-0">
              Suggestions
            </div>

            <div
              v-for="(tag, index) in suggestionsWithColors"
              :key="tag.id"
              :class="[
                'flex items-center gap-3 px-4 py-3 cursor-pointer transition',
                highlightedIndex === index ? 'bg-purple-50 highlighted' : 'hover:bg-gray-50',
              ]"
              role="option"
              :aria-selected="highlightedIndex === index"
              @click="selectTag(tag)"
            >
              <TagBadge :name="tag.name" :color="tag.color" size="sm" :clickable="false" />
              <span class="text-gray-600 text-sm" v-html="highlightText(tag.name, inputValue)" />
            </div>
          </template>

          <!-- Recent Searches -->
          <template v-else-if="showRecent && recentAsTags.length > 0 && !inputValue">
            <div class="flex items-center justify-between px-4 py-2 bg-gray-50 sticky top-0">
              <span class="text-xs font-semibold text-gray-500">Recent</span>
              <button
                class="text-xs text-gray-400 hover:text-red-500 transition"
                @click.stop="clearRecent"
              >
                Clear all
              </button>
            </div>

            <div
              v-for="(tag, index) in recentAsTags"
              :key="tag.id"
              :class="[
                'flex items-center justify-between gap-3 px-4 py-3 cursor-pointer transition group',
                highlightedIndex === index ? 'bg-purple-50 highlighted' : 'hover:bg-gray-50',
              ]"
              role="option"
              @click="selectTag(tag)"
            >
              <div class="flex items-center gap-2">
                <i class="pi pi-history text-gray-400 text-sm" />
                <span class="text-gray-700">{{ tag.name }}</span>
              </div>

              <button
                class="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                @click.stop="removeFromRecent(tag.name)"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </template>

          <!-- Popular Tags -->
          <template
            v-if="
              showPopular &&
              popularWithColors.length > 0 &&
              !inputValue &&
              suggestionsWithColors.length === 0
            "
          >
            <div class="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50 sticky top-0">
              Popular Tags
            </div>

            <div class="p-3 flex flex-wrap gap-2">
              <TagBadge
                v-for="tag in popularWithColors"
                :key="tag.id"
                :name="tag.name"
                :color="tag.color"
                size="sm"
                clickable
                @click="selectTag(tag)"
              />
            </div>
          </template>

          <!-- No Results -->
          <div
            v-if="
              !isSearching &&
              suggestionsWithColors.length === 0 &&
              inputValue.trim().length >= minSearchLength
            "
            class="px-4 py-8 text-center text-gray-500"
          >
            <i class="pi pi-search text-3xl mb-2 opacity-50" />
            <p>No tags found for "{{ inputValue }}"</p>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Keyboard Hints -->
    <div class="text-xs text-gray-400 flex gap-3">
      <span><kbd class="px-1 py-0.5 bg-gray-100 rounded text-[10px]">↑↓</kbd> Navigate</span>
      <span><kbd class="px-1 py-0.5 bg-gray-100 rounded text-[10px]">Enter</kbd> Select</span>
      <span><kbd class="px-1 py-0.5 bg-gray-100 rounded text-[10px]">Esc</kbd> Close</span>
    </div>
  </div>
</template>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
</style>
