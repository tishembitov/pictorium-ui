<!-- src/components/features/tags/AdvancedTagsSelector.vue -->
<script setup lang="ts">
/**
 * AdvancedTagsSelector - Полнофункциональный селектор тегов
 *
 * ✅ ИСПРАВЛЕНО: TypeScript ошибки с groupedSuggestions
 */

import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import TagBadge from '@/components/features/tags/TagBadge.vue'
import SuggestionItem from './SuggestionItem.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseLoader from '@/components/ui/BaseLoader.vue'
import { useTagSearch } from '@/composables/api/useTagSearch'
import { useDebouncedRef } from '@/composables/utils/useDebounce'
import { useKeyboardShortcuts } from '@/composables/utils/useKeyboardShortcuts'
import { randomTagColor } from '@/utils/colors'
import { getTagError, validateTag } from '@/utils/validators'
import { TAG_MAX_LENGTH } from '@/utils/constants'
import type { Tag } from '@/types'

// ============================================================================
// TYPES
// ============================================================================

export interface SelectedTag {
  id: string
  name: string
  color: string
  isNew?: boolean
}

/** ✅ Типизация для grouped suggestions */
interface GroupedSuggestions {
  exact: Tag[]
  startsWith: Tag[]
  contains: Tag[]
}

export interface AdvancedTagsSelectorProps {
  modelValue: string[]
  maxTags?: number
  minTags?: number
  title?: string
  description?: string
  placeholder?: string
  allowCreate?: boolean
  allowSort?: boolean
  showPopular?: boolean
  popularLimit?: number
  disabled?: boolean
  readonly?: boolean
  showCounter?: boolean
  autofocus?: boolean
  groupSuggestions?: boolean
}

const props = withDefaults(defineProps<AdvancedTagsSelectorProps>(), {
  maxTags: 10,
  minTags: 0,
  title: '',
  description: '',
  placeholder: 'Search or create tags...',
  allowCreate: true,
  allowSort: true,
  showPopular: true,
  popularLimit: 8,
  disabled: false,
  readonly: false,
  showCounter: true,
  autofocus: false,
  groupSuggestions: true,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string[]): void
  (e: 'create', tagName: string): void
  (e: 'remove', tagName: string): void
  (e: 'reorder', tags: string[]): void
  (e: 'search', query: string): void
  (e: 'focus'): void
  (e: 'blur'): void
}>()

// ============================================================================
// REFS
// ============================================================================

const inputRef = ref<HTMLInputElement | null>(null)
const containerRef = ref<HTMLElement | null>(null)
const suggestionsRef = ref<HTMLElement | null>(null)

// ============================================================================
// STATE
// ============================================================================

const inputValue = ref('')
const debouncedInput = useDebouncedRef('', 300)
const inputError = ref<string | null>(null)
const isFocused = ref(false)
const showSuggestions = ref(false)
const highlightedIndex = ref(-1)

// Drag & Drop state
const draggedIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)

// ============================================================================
// COMPOSABLES
// ============================================================================

const { suggestions, search, clear: clearSuggestions, isSearching } = useTagSearch(200)

// ============================================================================
// COMPUTED
// ============================================================================

const selectedTags = computed<SelectedTag[]>(() => {
  return props.modelValue.map((name, index) => ({
    id: `selected-${index}-${name}`,
    name,
    color: randomTagColor(),
    isNew: false,
  }))
})

const canAddMore = computed(() => props.modelValue.length < props.maxTags)
const hasMinimum = computed(() => props.modelValue.length >= props.minTags)

const fillProgress = computed(() => {
  return Math.min(100, (props.modelValue.length / props.maxTags) * 100)
})

const progressColor = computed(() => {
  if (fillProgress.value >= 100) return 'bg-red-500'
  if (fillProgress.value >= 80) return 'bg-yellow-500'
  return 'bg-green-500'
})

const filteredSuggestions = computed(() => {
  return suggestions.value.filter(
    (s) => !props.modelValue.some((t) => t.toLowerCase() === s.name.toLowerCase()),
  )
})

/**
 * ✅ ИСПРАВЛЕНО: Всегда возвращает один и тот же тип
 */
const groupedSuggestions = computed<GroupedSuggestions>(() => {
  const exact: Tag[] = []
  const startsWith: Tag[] = []
  const contains: Tag[] = []

  // Если группировка отключена - все в contains
  if (!props.groupSuggestions) {
    return {
      exact: [],
      startsWith: [],
      contains: filteredSuggestions.value,
    }
  }

  const query = inputValue.value.toLowerCase()

  filteredSuggestions.value.forEach((tag) => {
    const name = tag.name.toLowerCase()
    if (name === query) {
      exact.push(tag)
    } else if (name.startsWith(query)) {
      startsWith.push(tag)
    } else {
      contains.push(tag)
    }
  })

  return { exact, startsWith, contains }
})

/**
 * ✅ ИСПРАВЛЕНО: Безопасный spread с fallback на пустые массивы
 */
const flatSuggestions = computed<Tag[]>(() => {
  const { exact, startsWith, contains } = groupedSuggestions.value
  return [...exact, ...startsWith, ...contains]
})

const canCreateNew = computed(() => {
  if (!props.allowCreate) return false
  if (!inputValue.value.trim()) return false
  if (!canAddMore.value) return false

  const trimmed = inputValue.value.trim().toLowerCase()

  const exists =
    props.modelValue.some((t) => t.toLowerCase() === trimmed) ||
    flatSuggestions.value.some((s) => s.name.toLowerCase() === trimmed)

  if (exists) return false

  return validateTag(trimmed)
})

const showCreateButton = computed(() => {
  return canCreateNew.value && inputValue.value.trim().length > 0
})

// ============================================================================
// METHODS
// ============================================================================

const addTag = (name: string): boolean => {
  const trimmed = name.trim()

  if (!trimmed) {
    inputError.value = 'Tag cannot be empty'
    return false
  }

  const error = getTagError(trimmed)
  if (error) {
    inputError.value = error
    return false
  }

  if (!canAddMore.value) {
    inputError.value = `Maximum ${props.maxTags} tags allowed`
    shakeInput()
    return false
  }

  if (props.modelValue.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
    inputError.value = 'Tag already added'
    shakeInput()
    return false
  }

  emit('update:modelValue', [...props.modelValue, trimmed])

  inputValue.value = ''
  inputError.value = null
  highlightedIndex.value = -1
  clearSuggestions()

  return true
}

const removeTag = (name: string) => {
  if (props.disabled || props.readonly) return

  emit(
    'update:modelValue',
    props.modelValue.filter((t) => t !== name),
  )
  emit('remove', name)
}

const createTag = () => {
  if (!canCreateNew.value) return

  const name = inputValue.value.trim()
  if (addTag(name)) {
    emit('create', name)
  }
}

const selectSuggestion = (tag: Tag) => {
  addTag(tag.name)
  focusInput()
}

const shakeInput = () => {
  if (!inputRef.value) return

  inputRef.value.classList.add('shake-animation')
  setTimeout(() => {
    inputRef.value?.classList.remove('shake-animation')
  }, 500)
}

const focusInput = () => {
  inputRef.value?.focus()
}

// ============================================================================
// KEYBOARD NAVIGATION
// ============================================================================

const scrollToHighlighted = () => {
  nextTick(() => {
    const highlighted = suggestionsRef.value?.querySelector('.highlighted')
    highlighted?.scrollIntoView({ block: 'nearest' })
  })
}

const handleKeydown = (event: KeyboardEvent) => {
  if (props.disabled || props.readonly) return

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      if (flatSuggestions.value.length > 0) {
        highlightedIndex.value = Math.min(
          highlightedIndex.value + 1,
          flatSuggestions.value.length - 1,
        )
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
      // ✅ ИСПРАВЛЕНО: Сохраняем в переменную для type narrowing
      const selectedTag = flatSuggestions.value[highlightedIndex.value]
      if (highlightedIndex.value >= 0 && selectedTag) {
        selectSuggestion(selectedTag)
      } else if (showCreateButton.value) {
        createTag()
      }
      break
    }

    case 'Escape':
      event.preventDefault()
      showSuggestions.value = false
      highlightedIndex.value = -1
      break

    case 'Backspace': {
      if (!inputValue.value && props.modelValue.length > 0) {
        event.preventDefault()
        // ✅ ИСПРАВЛЕНО: Сохраняем в переменную
        const lastTag = props.modelValue[props.modelValue.length - 1]
        if (lastTag) {
          removeTag(lastTag)
        }
      }
      break
    }

    case 'Tab': {
      if (showCreateButton.value && !event.shiftKey) {
        event.preventDefault()
        createTag()
      }
      break
    }
  }
}

// ============================================================================
// DRAG & DROP
// ============================================================================

const handleDragStart = (index: number, event: DragEvent) => {
  if (!props.allowSort || props.disabled || props.readonly) {
    event.preventDefault()
    return
  }

  draggedIndex.value = index

  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(index))
  }
}

const handleDragOver = (index: number, event: DragEvent) => {
  if (draggedIndex.value === null) return

  event.preventDefault()
  dragOverIndex.value = index
}

const handleDragLeave = () => {
  dragOverIndex.value = null
}

const handleDrop = (index: number, event: DragEvent) => {
  event.preventDefault()

  if (draggedIndex.value === null || draggedIndex.value === index) {
    resetDragState()
    return
  }

  const newTags = [...props.modelValue]
  const [removed] = newTags.splice(draggedIndex.value, 1)
  if (removed) {
    newTags.splice(index, 0, removed)
    emit('update:modelValue', newTags)
    emit('reorder', newTags)
  }

  resetDragState()
}

const handleDragEnd = () => {
  resetDragState()
}

const resetDragState = () => {
  draggedIndex.value = null
  dragOverIndex.value = null
}

// ============================================================================
// FOCUS HANDLERS
// ============================================================================

const handleFocus = () => {
  isFocused.value = true
  showSuggestions.value = true
  emit('focus')
}

const handleBlur = () => {
  setTimeout(() => {
    isFocused.value = false
    showSuggestions.value = false
    highlightedIndex.value = -1
  }, 200)
  emit('blur')
}

// ============================================================================
// INPUT HANDLER
// ============================================================================

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  inputValue.value = target.value
  inputError.value = null
  highlightedIndex.value = -1
  emit('search', target.value)
}

// ============================================================================
// WATCHERS
// ============================================================================

watch(inputValue, (value) => {
  debouncedInput.value = value
})

watch(debouncedInput, async (value) => {
  if (value.trim().length >= 2) {
    await search(value)
    showSuggestions.value = true
  } else {
    clearSuggestions()
  }
})

// ============================================================================
// LIFECYCLE
// ============================================================================

onMounted(() => {
  if (props.autofocus) {
    nextTick(() => focusInput())
  }
})

onUnmounted(() => {
  clearSuggestions()
})

// ============================================================================
// KEYBOARD SHORTCUTS
// ============================================================================

useKeyboardShortcuts([
  {
    key: '/',
    handler: () => {
      if (!isFocused.value) {
        focusInput()
      }
    },
    preventDefault: true,
  },
])

// ============================================================================
// HELPER: Get highlighted index for grouped suggestions
// ============================================================================

/**
 * ✅ ИСПРАВЛЕНО: Безопасный расчёт индекса
 */
const getHighlightedIndexForGroup = (
  groupName: 'exact' | 'startsWith' | 'contains',
  index: number,
): number => {
  const { exact, startsWith } = groupedSuggestions.value

  if (groupName === 'exact') return index
  if (groupName === 'startsWith') return exact.length + index
  return exact.length + startsWith.length + index
}

/**
 * ✅ Проверка есть ли suggestions для отображения
 */
const hasAnySuggestions = computed(() => {
  const { exact, startsWith, contains } = groupedSuggestions.value
  return exact.length > 0 || startsWith.length > 0 || contains.length > 0
})
</script>

<template>
  <div
    ref="containerRef"
    class="w-full space-y-4"
    :class="{ 'opacity-50 pointer-events-none': disabled }"
  >
    <!-- Header -->
    <div v-if="title || description" class="space-y-1">
      <div class="flex items-center justify-between">
        <h3 v-if="title" class="text-lg font-semibold text-gray-900">
          {{ title }}
        </h3>

        <span
          v-if="showCounter"
          :class="[
            'text-sm font-medium px-2 py-0.5 rounded-full',
            modelValue.length >= maxTags ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600',
          ]"
        >
          {{ modelValue.length }}/{{ maxTags }}
        </span>
      </div>

      <p v-if="description" class="text-sm text-gray-500">
        {{ description }}
      </p>
    </div>

    <!-- Progress Bar -->
    <div
      v-if="showCounter && maxTags > 0"
      class="relative h-1.5 bg-gray-200 rounded-full overflow-hidden"
    >
      <div
        :class="['absolute inset-y-0 left-0 transition-all duration-300', progressColor]"
        :style="{ width: `${fillProgress}%` }"
      />
    </div>

    <!-- Selected Tags (Sortable) -->
    <div
      v-if="selectedTags.length > 0"
      class="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-2xl border border-gray-200 min-h-[52px]"
    >
      <div
        v-for="(tag, index) in selectedTags"
        :key="tag.id"
        :draggable="allowSort && !disabled && !readonly"
        @dragstart="handleDragStart(index, $event)"
        @dragover="handleDragOver(index, $event)"
        @dragleave="handleDragLeave"
        @drop="handleDrop(index, $event)"
        @dragend="handleDragEnd"
        :class="[
          'transition-all duration-200',
          draggedIndex === index && 'opacity-50 scale-95',
          dragOverIndex === index && draggedIndex !== index && 'transform translate-x-2',
          allowSort && !disabled && !readonly && 'cursor-grab active:cursor-grabbing',
        ]"
      >
        <TagBadge
          :name="tag.name"
          :color="tag.color"
          :removable="!readonly"
          :clickable="false"
          size="md"
          @remove="removeTag(tag.name)"
        >
          <template v-if="allowSort && !readonly" #prepend>
            <svg class="w-3 h-3 text-gray-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path
                d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"
              />
            </svg>
          </template>
        </TagBadge>
      </div>

      <div v-if="!hasMinimum && minTags > 0" class="flex items-center text-xs text-amber-600">
        <i class="pi pi-info-circle mr-1" />
        Add at least {{ minTags - modelValue.length }} more
      </div>
    </div>

    <!-- Input Container -->
    <div class="relative">
      <div
        :class="[
          'flex items-center gap-2 px-4 py-3 rounded-2xl border-2 transition-all duration-200',
          'bg-white',
          isFocused
            ? 'border-purple-500 ring-2 ring-purple-100'
            : 'border-gray-300 hover:border-gray-400',
          inputError && 'border-red-500 ring-2 ring-red-100',
          !canAddMore && 'bg-gray-50',
        ]"
      >
        <i class="pi pi-search text-gray-400" />

        <input
          ref="inputRef"
          :value="inputValue"
          type="text"
          :placeholder="canAddMore ? placeholder : 'Maximum tags reached'"
          :disabled="disabled || readonly || !canAddMore"
          :maxlength="TAG_MAX_LENGTH"
          @input="handleInput"
          @keydown="handleKeydown"
          @focus="handleFocus"
          @blur="handleBlur"
          class="flex-1 bg-transparent border-none outline-none text-gray-900 placeholder-gray-400"
          autocomplete="off"
          spellcheck="false"
        />

        <BaseLoader v-if="isSearching" variant="spinner" size="sm" />

        <button
          v-else-if="inputValue"
          type="button"
          @click="
            inputValue = ''
            clearSuggestions()
          "
          class="p-1 text-gray-400 hover:text-gray-600 transition"
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

        <BaseButton v-if="showCreateButton" variant="primary" size="sm" @click="createTag">
          <i class="pi pi-plus mr-1" />
          Create
        </BaseButton>
      </div>

      <div
        v-if="inputValue && inputValue.length > TAG_MAX_LENGTH * 0.7"
        class="absolute right-4 -bottom-5 text-xs"
        :class="inputValue.length >= TAG_MAX_LENGTH ? 'text-red-500' : 'text-gray-400'"
      >
        {{ inputValue.length }}/{{ TAG_MAX_LENGTH }}
      </div>

      <p v-if="inputError" class="mt-2 text-sm text-red-500 flex items-center gap-1">
        <i class="pi pi-exclamation-circle" />
        {{ inputError }}
      </p>

      <!-- Suggestions Dropdown -->
      <Transition name="dropdown">
        <div
          v-if="showSuggestions && (hasAnySuggestions || showCreateButton)"
          ref="suggestionsRef"
          class="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-200 max-h-80 overflow-y-auto"
        >
          <!-- Create New Option -->
          <div
            v-if="showCreateButton"
            @click="createTag"
            :class="[
              'flex items-center gap-3 px-4 py-3 cursor-pointer transition',
              'border-b border-gray-100',
              highlightedIndex === -1 ? 'bg-purple-50' : 'hover:bg-gray-50',
            ]"
          >
            <div class="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
              <i class="pi pi-plus text-purple-600" />
            </div>
            <div>
              <p class="font-medium text-gray-900">
                Create "<span class="text-purple-600">{{ inputValue.trim() }}</span
                >"
              </p>
              <p class="text-xs text-gray-500">Press Enter or Tab to create</p>
            </div>
          </div>

          <!-- Grouped Suggestions -->
          <template v-if="groupSuggestions">
            <!-- Exact matches -->
            <template v-if="groupedSuggestions.exact.length > 0">
              <div class="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50">
                Exact Match
              </div>
              <SuggestionItem
                v-for="(tag, index) in groupedSuggestions.exact"
                :key="tag.id"
                :tag="tag"
                :highlighted="highlightedIndex === getHighlightedIndexForGroup('exact', index)"
                @click="selectSuggestion(tag)"
              />
            </template>

            <!-- Starts with -->
            <template v-if="groupedSuggestions.startsWith.length > 0">
              <div class="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50">
                Starts With
              </div>
              <SuggestionItem
                v-for="(tag, index) in groupedSuggestions.startsWith"
                :key="tag.id"
                :tag="tag"
                :highlighted="highlightedIndex === getHighlightedIndexForGroup('startsWith', index)"
                @click="selectSuggestion(tag)"
              />
            </template>

            <!-- Contains -->
            <template v-if="groupedSuggestions.contains.length > 0">
              <div class="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50">Related</div>
              <SuggestionItem
                v-for="(tag, index) in groupedSuggestions.contains"
                :key="tag.id"
                :tag="tag"
                :highlighted="highlightedIndex === getHighlightedIndexForGroup('contains', index)"
                @click="selectSuggestion(tag)"
              />
            </template>
          </template>

          <!-- Flat Suggestions (non-grouped) -->
          <template v-else>
            <SuggestionItem
              v-for="(tag, index) in flatSuggestions"
              :key="tag.id"
              :tag="tag"
              :highlighted="highlightedIndex === index"
              @click="selectSuggestion(tag)"
            />
          </template>

          <!-- No Results -->
          <div
            v-if="!hasAnySuggestions && !showCreateButton && inputValue.trim()"
            class="px-4 py-8 text-center text-gray-500"
          >
            <i class="pi pi-search text-3xl mb-2 opacity-50" />
            <p>No tags found</p>
            <p v-if="allowCreate" class="text-sm mt-1">Type to create a new tag</p>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Keyboard Hints -->
    <div class="flex flex-wrap gap-4 text-xs text-gray-400">
      <span><kbd class="px-1.5 py-0.5 bg-gray-100 rounded">↑↓</kbd> Navigate</span>
      <span><kbd class="px-1.5 py-0.5 bg-gray-100 rounded">Enter</kbd> Select/Create</span>
      <span><kbd class="px-1.5 py-0.5 bg-gray-100 rounded">Backspace</kbd> Remove last</span>
      <span><kbd class="px-1.5 py-0.5 bg-gray-100 rounded">Esc</kbd> Close</span>
      <span v-if="allowSort"
        ><kbd class="px-1.5 py-0.5 bg-gray-100 rounded">Drag</kbd> Reorder</span
      >
    </div>
  </div>
</template>

<style scoped>
@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  10%,
  30%,
  50%,
  70%,
  90% {
    transform: translateX(-4px);
  }
  20%,
  40%,
  60%,
  80% {
    transform: translateX(4px);
  }
}

.shake-animation {
  animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}

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

kbd {
  font-family: inherit;
  font-size: 0.7rem;
}
</style>
