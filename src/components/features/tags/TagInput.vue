<!-- src/components/features/tag/TagInput.vue -->
<script setup lang="ts">
/**
 * TagInput - Поле ввода тегов с автодополнением
 *
 * Отличается от ui/TagInput.vue:
 * - Использует stores напрямую
 * - Интегрирован с API
 * - Более богатый функционал
 */

import { ref, computed, watch, onUnmounted } from 'vue'
import TagBadge from '@/components/features/tags/TagBadge.vue'
import { useTagSearch } from '@/composables/api/useTagSearch'
import { randomTagColor } from '@/utils/colors'
import { getTagError } from '@/utils/validators'

export interface TagInputProps {
  /** Выбранные теги */
  modelValue: string[]
  /** Label */
  label?: string
  /** Placeholder */
  placeholder?: string
  /** Максимум тегов */
  maxTags?: number
  /** Отключено */
  disabled?: boolean
  /** Показывать suggestions */
  showSuggestions?: boolean
  /** Разрешить создание новых */
  allowCreate?: boolean
  /** Минимальная длина для поиска */
  minSearchLength?: number
}

const props = withDefaults(defineProps<TagInputProps>(), {
  label: '',
  placeholder: 'Add a tag...',
  maxTags: 10,
  disabled: false,
  showSuggestions: true,
  allowCreate: true,
  minSearchLength: 2,
})

const emit = defineEmits<(e: 'update:modelValue', value: string[]) => void>()

// Состояние
const inputValue = ref('')
const inputError = ref<string | null>(null)
const isFocused = ref(false)
const showDropdown = ref(false)

// Поиск
const { suggestions, search, clear: clearSuggestions, isSearching } = useTagSearch()

// Теги с цветами
const tagsWithColors = computed(() => {
  return props.modelValue.map((name) => ({
    name,
    color: randomTagColor(),
  }))
})

// Можно добавить
const canAddMore = computed(() => props.modelValue.length < props.maxTags)

// Отфильтрованные suggestions (исключая уже добавленные)
const filteredSuggestions = computed(() => {
  return suggestions.value.filter(
    (s) => !props.modelValue.some((t) => t.toLowerCase() === s.name.toLowerCase()),
  )
})

// Добавить тег
const addTag = (name: string) => {
  const trimmed = name.trim().toLowerCase()

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
    inputError.value = `Maximum ${props.maxTags} tags`
    return false
  }

  if (props.modelValue.some((t) => t.toLowerCase() === trimmed)) {
    inputError.value = 'Tag already added'
    return false
  }

  emit('update:modelValue', [...props.modelValue, trimmed])
  inputValue.value = ''
  inputError.value = null
  clearSuggestions()
  showDropdown.value = false

  return true
}

// Удалить тег
const removeTag = (index: number) => {
  const newTags = [...props.modelValue]
  newTags.splice(index, 1)
  emit('update:modelValue', newTags)
}

// Обработка ввода
const handleInput = async (event: Event) => {
  const target = event.target as HTMLInputElement
  inputValue.value = target.value
  inputError.value = null

  if (props.showSuggestions && inputValue.value.length >= props.minSearchLength) {
    await search(inputValue.value)
    showDropdown.value = filteredSuggestions.value.length > 0
  } else {
    clearSuggestions()
    showDropdown.value = false
  }
}

// Обработка клавиш
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    event.preventDefault()
    if (props.allowCreate) {
      addTag(inputValue.value)
    }
  } else if (event.key === 'Backspace' && !inputValue.value && props.modelValue.length > 0) {
    removeTag(props.modelValue.length - 1)
  } else if (event.key === 'Escape') {
    showDropdown.value = false
  }
}

// Выбор suggestion
const selectSuggestion = (name: string) => {
  addTag(name)
}

// Focus/Blur
const handleFocus = () => {
  isFocused.value = true
  if (filteredSuggestions.value.length > 0) {
    showDropdown.value = true
  }
}

const handleBlur = () => {
  // Задержка для клика по suggestion
  setTimeout(() => {
    isFocused.value = false
    showDropdown.value = false
  }, 200)
}

// Cleanup
onUnmounted(() => {
  clearSuggestions()
})
</script>

<template>
  <div class="w-full">
    <!-- Label -->
    <label v-if="label" class="block mb-2 text-sm font-medium text-gray-900">
      {{ label }}
    </label>

    <!-- Container -->
    <div
      :class="[
        'w-full min-h-[48px] flex flex-wrap items-center gap-2 p-3',
        'border rounded-2xl bg-gray-50 transition-all',
        'focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-purple-500',
        inputError ? 'border-red-500' : 'border-gray-300',
        disabled && 'opacity-50 cursor-not-allowed',
      ]"
    >
      <!-- Добавленные теги -->
      <div
        v-for="(tag, index) in tagsWithColors"
        :key="index"
        :class="['flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium', tag.color]"
      >
        <span>#{{ tag.name }}</span>
        <button
          v-if="!disabled"
          type="button"
          @click="removeTag(index)"
          class="hover:text-red-600 transition"
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

      <!-- Input -->
      <input
        v-model="inputValue"
        type="text"
        :placeholder="canAddMore ? placeholder : `Max ${maxTags} tags`"
        :disabled="disabled || !canAddMore"
        @input="handleInput"
        @keydown="handleKeydown"
        @focus="handleFocus"
        @blur="handleBlur"
        class="flex-1 min-w-[120px] bg-transparent border-none outline-none text-gray-900 placeholder-gray-400"
      />
    </div>

    <!-- Error -->
    <p v-if="inputError" class="mt-1 text-sm text-red-500">{{ inputError }}</p>

    <!-- Counter -->
    <p class="mt-1 text-xs text-gray-400 text-right">{{ modelValue.length }}/{{ maxTags }} tags</p>

    <!-- Suggestions Dropdown -->
    <Transition name="slide-down">
      <div v-if="showDropdown && filteredSuggestions.length > 0" class="relative mt-2">
        <div
          class="absolute z-20 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
        >
          <!-- Loading -->
          <div v-if="isSearching" class="px-4 py-2 text-gray-500">Searching...</div>

          <!-- Suggestions -->
          <button
            v-for="suggestion in filteredSuggestions"
            :key="suggestion.id"
            type="button"
            @click="selectSuggestion(suggestion.name)"
            class="w-full text-left px-4 py-2 hover:bg-gray-100 transition flex items-center gap-2"
          >
            <i class="pi pi-hashtag text-gray-400 text-sm" />
            <span class="text-gray-900">{{ suggestion.name }}</span>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.2s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
