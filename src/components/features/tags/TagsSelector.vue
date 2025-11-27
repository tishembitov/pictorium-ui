<!-- src/components/features/tags/TagsSelector.vue -->
<script setup lang="ts">
/**
 * TagsSelector - Выбор тегов для пина (как в CreatePinView)
 *
 * ✅ ИСПРАВЛЕНО: Удалены неиспользуемые импорты
 */

import { ref, computed, watch } from 'vue'
import TagBadge from './TagBadge.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { useTagSearch } from '@/composables/api/useTagSearch'
import { randomTagColor } from '@/utils/colors'
import { validateTag, getTagError } from '@/utils/validators'
import type { Tag } from '@/types'

export interface TagsSelectorProps {
  /** Выбранные теги (имена) */
  modelValue: string[]
  /** Максимальное количество тегов */
  maxTags?: number
  /** Заголовок секции */
  title?: string
  /** Placeholder для поиска */
  searchPlaceholder?: string
  /** Placeholder для создания */
  createPlaceholder?: string
  /** Показывать кнопку создания */
  showCreate?: boolean
  /** Доступные теги (если не используется API) */
  availableTags?: Tag[]
  /** Отключено */
  disabled?: boolean
}

const props = withDefaults(defineProps<TagsSelectorProps>(), {
  maxTags: 10,
  title: 'Add Tags to Pin',
  searchPlaceholder: 'Search Tag',
  createPlaceholder: 'Create Tag',
  showCreate: true,
  disabled: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string[]): void
}>()

// Состояние
const newTagInput = ref('')
const searchInput = ref('')
const inputError = ref<string | null>(null)

// Поиск тегов
const { suggestions, search, clear: clearSuggestions } = useTagSearch()

// Теги с цветами (для локальных тегов)
interface TagWithColor extends Tag {
  color: string
}

const localTags = ref<TagWithColor[]>([])

// Все доступные теги (API suggestions + локальные + props)
const allAvailableTags = computed(() => {
  const apiTags = suggestions.value.map((t) => ({
    ...t,
    color: randomTagColor(),
  }))

  const propTags = (props.availableTags || []).map((t) => ({
    ...t,
    color: randomTagColor(),
  }))

  // Объединяем и убираем дубликаты
  const combined = [...apiTags, ...localTags.value, ...propTags]
  const unique = combined.filter(
    (tag, index, self) =>
      index === self.findIndex((t) => t.name.toLowerCase() === tag.name.toLowerCase()),
  )

  return unique
})

// Отфильтрованные теги по поиску
const filteredTags = computed(() => {
  if (!searchInput.value.trim()) {
    return allAvailableTags.value
  }

  const searchWords = searchInput.value.toLowerCase().split(/\s+/)
  return allAvailableTags.value.filter((tag) =>
    searchWords.some((word) => tag.name.toLowerCase().includes(word)),
  )
})

// Можно ли добавить еще теги
const canAddMore = computed(() => props.modelValue.length < props.maxTags)

// Проверка, добавлен ли тег
const isTagAdded = (name: string) => {
  return props.modelValue.some((t) => t.toLowerCase() === name.toLowerCase())
}

// Создание нового тега
const createTag = () => {
  const name = newTagInput.value.trim()

  if (!name) return

  // Валидация
  const error = getTagError(name)
  if (error) {
    inputError.value = error
    return
  }

  if (isTagAdded(name)) {
    inputError.value = 'Tag already added'
    return
  }

  if (!canAddMore.value) {
    inputError.value = `Maximum ${props.maxTags} tags`
    return
  }

  // Добавляем в локальные теги
  localTags.value.unshift({
    id: `local-${Date.now()}`,
    name,
    color: randomTagColor(),
  })

  newTagInput.value = ''
  inputError.value = null
}

// Переключение тега
const toggleTag = (name: string) => {
  if (props.disabled) return

  if (isTagAdded(name)) {
    // Удаляем
    emit(
      'update:modelValue',
      props.modelValue.filter((t) => t.toLowerCase() !== name.toLowerCase()),
    )
  } else {
    // Добавляем
    if (!canAddMore.value) {
      inputError.value = `Maximum ${props.maxTags} tags`
      return
    }
    emit('update:modelValue', [...props.modelValue, name])
  }

  inputError.value = null
}

// Удаление тега
const removeTag = (name: string) => {
  emit(
    'update:modelValue',
    props.modelValue.filter((t) => t.toLowerCase() !== name.toLowerCase()),
  )
}

// Поиск при вводе
watch(searchInput, async (value) => {
  if (value.trim()) {
    await search(value)
  } else {
    clearSuggestions()
  }
})

// Обработка Enter в создании
const handleCreateKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    e.preventDefault()
    createTag()
  }
}
</script>

<template>
  <div class="space-y-4">
    <!-- Заголовок -->
    <h3 v-if="title" class="text-md text-gray-600">{{ title }}</h3>

    <!-- Создание нового тега -->
    <div v-if="showCreate" class="flex items-center gap-2">
      <BaseButton
        variant="primary"
        size="sm"
        @click="createTag"
        :disabled="disabled || !newTagInput.trim()"
      >
        Create
      </BaseButton>

      <input
        v-model="newTagInput"
        type="text"
        :placeholder="createPlaceholder"
        :disabled="disabled"
        @keydown="handleCreateKeydown"
        class="flex-grow py-3 px-5 text-sm bg-gray-50 border border-gray-900 rounded-full hover:bg-purple-100 transition duration-100 cursor-pointer focus:ring-purple-500 focus:border-purple-500 focus:outline-none"
      />
    </div>

    <!-- Поле поиска -->
    <input
      v-model="searchInput"
      type="text"
      :placeholder="searchPlaceholder"
      :disabled="disabled"
      class="w-full py-3 px-5 text-sm bg-gray-50 border border-gray-900 rounded-full hover:bg-purple-100 transition duration-100 cursor-pointer focus:ring-purple-500 focus:border-purple-500 focus:outline-none"
    />

    <!-- Ошибка -->
    <p v-if="inputError" class="text-sm text-red-500">{{ inputError }}</p>

    <!-- Выбранные теги -->
    <div v-if="modelValue.length > 0" class="flex flex-wrap gap-2">
      <TagBadge
        v-for="name in modelValue"
        :key="name"
        :name="name"
        selected
        removable
        @remove="removeTag"
      />
    </div>

    <!-- Счетчик -->
    <p class="text-xs text-gray-400 text-right">{{ modelValue.length }}/{{ maxTags }} tags</p>

    <!-- Доступные теги -->
    <div class="flex flex-wrap gap-2">
      <TagBadge
        v-for="tag in filteredTags"
        :key="tag.id"
        :name="tag.name"
        :color="tag.color"
        :selected="isTagAdded(tag.name)"
        clickable
        @click="toggleTag(tag.name)"
      />
    </div>

    <!-- Пустое состояние -->
    <p
      v-if="filteredTags.length === 0 && searchInput.trim()"
      class="text-sm text-gray-500 text-center py-4"
    >
      No tags found. Create a new one!
    </p>
  </div>
</template>
