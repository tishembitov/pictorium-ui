<!-- src/components/features/tag/AdvancedTagsSelector.vue -->
<script setup lang="ts">
/**
 * AdvancedTagsSelector - Полнофункциональный селектор тегов
 *
 * Features:
 * - Поиск с автокомплитом (debounced)
 * - Создание новых тегов с валидацией
 * - Лимит тегов с визуальным индикатором
 * - Drag & Drop для сортировки
 * - Keyboard navigation
 * - Группировка по популярности
 * - Анимации
 */

import {
  ref,
  computed,
  watch,
  onMounted,
  onUnmounted,
  nextTick,
  type PropType,
  defineComponent,
  h,
} from 'vue'
import TagBadge from '@/components/features/tags/TagBadge.vue'
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

export interface AdvancedTagsSelectorProps {
  /** Выбранные теги (имена) */
  modelValue: string[]
  /** Максимальное количество тегов */
  maxTags?: number
  /** Минимальное количество тегов */
  minTags?: number
  /** Заголовок */
  title?: string
  /** Подзаголовок/описание */
  description?: string
  /** Placeholder для поиска */
  placeholder?: string
  /** Разрешить создание новых тегов */
  allowCreate?: boolean
  /** Разрешить сортировку drag & drop */
  allowSort?: boolean
  /** Показывать популярные теги */
  showPopular?: boolean
  /** Количество популярных тегов */
  popularLimit?: number
  /** Отключено */
  disabled?: boolean
  /** Режим только чтение */
  readonly?: boolean
  /** Показывать счетчик */
  showCounter?: boolean
  /** Автофокус на input */
  autofocus?: boolean
  /** Группировать suggestions */
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

// Выбранные теги с метаданными
const selectedTags = computed<SelectedTag[]>(() => {
  return props.modelValue.map((name, index) => ({
    id: `selected-${index}-${name}`,
    name,
    color: randomTagColor(),
    isNew: false,
  }))
})

// Можно добавить еще
const canAddMore = computed(() => props.modelValue.length < props.maxTags)

// Достигнут минимум
const hasMinimum = computed(() => props.modelValue.length >= props.minTags)

// Прогресс заполнения
const fillProgress = computed(() => {
  return Math.min(100, (props.modelValue.length / props.maxTags) * 100)
})

// Цвет прогресса
const progressColor = computed(() => {
  if (fillProgress.value >= 100) return 'bg-red-500'
  if (fillProgress.value >= 80) return 'bg-yellow-500'
  return 'bg-green-500'
})

// Отфильтрованные suggestions (исключая уже добавленные)
const filteredSuggestions = computed(() => {
  return suggestions.value.filter(
    (s) => !props.modelValue.some((t) => t.toLowerCase() === s.name.toLowerCase()),
  )
})

// Группированные suggestions
const groupedSuggestions = computed(() => {
  if (!props.groupSuggestions) {
    return { all: filteredSuggestions.value }
  }

  const exact: Tag[] = []
  const startsWith: Tag[] = []
  const contains: Tag[] = []
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

// Все suggestions в плоском виде для навигации
const flatSuggestions = computed(() => {
  if (!props.groupSuggestions) {
    return filteredSuggestions.value
  }
  return [
    ...groupedSuggestions.value.exact,
    ...groupedSuggestions.value.startsWith,
    ...groupedSuggestions.value.contains,
  ]
})

// Можно создать новый тег
const canCreateNew = computed(() => {
  if (!props.allowCreate) return false
  if (!inputValue.value.trim()) return false
  if (!canAddMore.value) return false

  const trimmed = inputValue.value.trim().toLowerCase()

  // Проверяем, нет ли уже такого тега
  const exists =
    props.modelValue.some((t) => t.toLowerCase() === trimmed) ||
    flatSuggestions.value.some((s) => s.name.toLowerCase() === trimmed)

  if (exists) return false

  // Валидация
  return validateTag(trimmed)
})

// Показывать кнопку создания
const showCreateButton = computed(() => {
  return canCreateNew.value && inputValue.value.trim().length > 0
})

// ============================================================================
// METHODS
// ============================================================================

// Добавить тег
const addTag = (name: string): boolean => {
  const trimmed = name.trim()

  if (!trimmed) {
    inputError.value = 'Tag cannot be empty'
    return false
  }

  // Валидация
  const error = getTagError(trimmed)
  if (error) {
    inputError.value = error
    return false
  }

  // Проверка лимита
  if (!canAddMore.value) {
    inputError.value = `Maximum ${props.maxTags} tags allowed`
    shakeInput()
    return false
  }

  // Проверка дубликата
  if (props.modelValue.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
    inputError.value = 'Tag already added'
    shakeInput()
    return false
  }

  // Добавляем
  emit('update:modelValue', [...props.modelValue, trimmed])

  // Очищаем
  inputValue.value = ''
  inputError.value = null
  highlightedIndex.value = -1
  clearSuggestions()

  return true
}

// Удалить тег
const removeTag = (name: string) => {
  if (props.disabled || props.readonly) return

  emit(
    'update:modelValue',
    props.modelValue.filter((t) => t !== name),
  )
  emit('remove', name)
}

// Создать новый тег
const createTag = () => {
  if (!canCreateNew.value) return

  const name = inputValue.value.trim()
  if (addTag(name)) {
    emit('create', name)
  }
}

// Выбрать suggestion
const selectSuggestion = (tag: Tag) => {
  addTag(tag.name)
  focusInput()
}

// Shake анимация для ошибок
const shakeInput = () => {
  if (!inputRef.value) return

  inputRef.value.classList.add('shake-animation')
  setTimeout(() => {
    inputRef.value?.classList.remove('shake-animation')
  }, 500)
}

// Focus input
const focusInput = () => {
  inputRef.value?.focus()
}

// ============================================================================
// KEYBOARD NAVIGATION
// ============================================================================

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

    case 'Enter':
      event.preventDefault()
      if (highlightedIndex.value >= 0 && flatSuggestions.value[highlightedIndex.value]) {
        selectSuggestion(flatSuggestions.value[highlightedIndex.value])
      } else if (showCreateButton.value) {
        createTag()
      }
      break

    case 'Escape':
      event.preventDefault()
      showSuggestions.value = false
      highlightedIndex.value = -1
      break

    case 'Backspace':
      if (!inputValue.value && props.modelValue.length > 0) {
        event.preventDefault()
        const lastTag = props.modelValue[props.modelValue.length - 1]
        removeTag(lastTag)
      }
      break

    case 'Tab':
      if (showCreateButton.value && !event.shiftKey) {
        event.preventDefault()
        createTag()
      }
      break
  }
}

// Scroll к выделенному элементу
const scrollToHighlighted = () => {
  nextTick(() => {
    const highlighted = suggestionsRef.value?.querySelector('.highlighted')
    highlighted?.scrollIntoView({ block: 'nearest' })
  })
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

  // Ghost image
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

  // Реорганизуем теги
  const newTags = [...props.modelValue]
  const [removed] = newTags.splice(draggedIndex.value, 1)
  newTags.splice(index, 0, removed)

  emit('update:modelValue', newTags)
  emit('reorder', newTags)

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
  // Задержка для клика по suggestion
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

  // Emit для внешнего использования
  emit('search', target.value)
}

// ============================================================================
// WATCHERS
// ============================================================================

// Sync debounced input
watch(inputValue, (value) => {
  debouncedInput.value = value
})

// Search on debounced input change
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

        <!-- Counter Badge -->
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
      v-auto-animate
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
          <!-- Drag handle -->
          <template v-if="allowSort && !readonly" #prepend>
            <svg class="w-3 h-3 text-gray-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path
                d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"
              />
            </svg>
          </template>
        </TagBadge>
      </div>

      <!-- Minimum indicator -->
      <div v-if="!hasMinimum && minTags > 0" class="flex items-center text-xs text-amber-600">
        <i class="pi pi-info-circle mr-1" />
        Add at least {{ minTags - modelValue.length }} more
      </div>
    </div>

    <!-- Input Container -->
    <div class="relative">
      <!-- Input Field -->
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
        <!-- Search Icon -->
        <i class="pi pi-search text-gray-400" />

        <!-- Input -->
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

        <!-- Loading -->
        <BaseLoader v-if="isSearching" variant="spinner" size="sm" />

        <!-- Clear Button -->
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

        <!-- Create Button -->
        <BaseButton v-if="showCreateButton" variant="primary" size="sm" @click="createTag">
          <i class="pi pi-plus mr-1" />
          Create
        </BaseButton>
      </div>

      <!-- Character Count -->
      <div
        v-if="inputValue && inputValue.length > TAG_MAX_LENGTH * 0.7"
        class="absolute right-4 -bottom-5 text-xs"
        :class="inputValue.length >= TAG_MAX_LENGTH ? 'text-red-500' : 'text-gray-400'"
      >
        {{ inputValue.length }}/{{ TAG_MAX_LENGTH }}
      </div>

      <!-- Error Message -->
      <p v-if="inputError" class="mt-2 text-sm text-red-500 flex items-center gap-1">
        <i class="pi pi-exclamation-circle" />
        {{ inputError }}
      </p>

      <!-- Suggestions Dropdown -->
      <Transition name="dropdown">
        <div
          v-if="showSuggestions && (flatSuggestions.length > 0 || showCreateButton)"
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
            <div v-if="groupedSuggestions.exact.length > 0">
              <div class="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50">
                Exact Match
              </div>
              <SuggestionItem
                v-for="(tag, index) in groupedSuggestions.exact"
                :key="tag.id"
                :tag="tag"
                :highlighted="highlightedIndex === index"
                @click="selectSuggestion(tag)"
              />
            </div>

            <!-- Starts with -->
            <div v-if="groupedSuggestions.startsWith.length > 0">
              <div class="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50">
                Starts With
              </div>
              <SuggestionItem
                v-for="(tag, index) in groupedSuggestions.startsWith"
                :key="tag.id"
                :tag="tag"
                :highlighted="highlightedIndex === groupedSuggestions.exact.length + index"
                @click="selectSuggestion(tag)"
              />
            </div>

            <!-- Contains -->
            <div v-if="groupedSuggestions.contains.length > 0">
              <div class="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50">Related</div>
              <SuggestionItem
                v-for="(tag, index) in groupedSuggestions.contains"
                :key="tag.id"
                :tag="tag"
                :highlighted="
                  highlightedIndex ===
                  groupedSuggestions.exact.length + groupedSuggestions.startsWith.length + index
                "
                @click="selectSuggestion(tag)"
              />
            </div>
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
            v-if="flatSuggestions.length === 0 && !showCreateButton && inputValue.trim()"
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

<!-- Suggestion Item Component (inline) -->
<script lang="ts">
const SuggestionItem = defineComponent({
  name: 'SuggestionItem',
  props: {
    tag: {
      type: Object as PropType<Tag>,
      required: true,
    },
    highlighted: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['click'],
  setup(props, { emit }) {
    return () =>
      h(
        'div',
        {
          class: [
            'flex items-center gap-3 px-4 py-3 cursor-pointer transition',
            props.highlighted ? 'bg-purple-50 highlighted' : 'hover:bg-gray-50',
          ],
          onClick: () => emit('click'),
        },
        [
          h('i', { class: 'pi pi-hashtag text-gray-400' }),
          h('span', { class: 'text-gray-900' }, props.tag.name),
        ],
      )
  },
})

export { SuggestionItem }
</script>

<style scoped>
/* Shake animation */
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

/* Dropdown animation */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* Scrollbar */
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

/* Keyboard hints */
kbd {
  font-family: inherit;
  font-size: 0.7rem;
}
</style>
