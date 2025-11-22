<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTagSearch } from '@/composables/api/useTags'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import TagCloud from './TagCloud.vue'
import type { Tag } from '@/types'
import { randomTagColor } from '@/utils/colors'

export interface TagsSelectorProps {
  /**
   * Выбранные теги
   */
  modelValue: string[]

  /**
   * Максимальное количество тегов
   * @default 10
   */
  maxTags?: number

  /**
   * Label
   */
  label?: string

  /**
   * Placeholder для поиска
   */
  searchPlaceholder?: string

  /**
   * Placeholder для создания
   */
  createPlaceholder?: string
}

const props = withDefaults(defineProps<TagsSelectorProps>(), {
  maxTags: 10,
  label: 'Add Tags to Pin',
  searchPlaceholder: 'Search Tag',
  createPlaceholder: 'Create Tag',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string[]): void
}>()

const { suggestions, search, clear } = useTagSearch()

const searchQuery = ref('')
const createTagInput = ref('')

const selectedTags = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const canAddMore = computed(() => selectedTags.value.length < props.maxTags)

// Все доступные теги (поисковые + выбранные)
const allTags = computed(() => {
  const tagsMap = new Map<string, Tag>()

  // Добавляем выбранные теги
  selectedTags.value.forEach((tagName) => {
    if (!tagsMap.has(tagName)) {
      tagsMap.set(tagName, {
        id: tagName,
        name: tagName,
        color: randomTagColor(),
      })
    }
  })

  // Добавляем теги из поиска
  suggestions.value.forEach((tag) => {
    if (!tagsMap.has(tag.name)) {
      tagsMap.set(tag.name, {
        ...tag,
        color: randomTagColor(),
      })
    }
  })

  return Array.from(tagsMap.values())
})

// Фильтрация тегов
const filteredTags = computed(() => {
  if (!searchQuery.value.trim()) {
    return allTags.value
  }

  const query = searchQuery.value.toLowerCase().trim()
  const searchWords = query.split(/\s+/)

  return allTags.value.filter((tag) =>
    searchWords.some((word) => tag.name.toLowerCase().includes(word)),
  )
})

const handleSearch = async (value: string) => {
  if (value.trim()) {
    await search(value)
  } else {
    clear()
  }
}

const createTag = () => {
  const tagName = createTagInput.value.trim().toLowerCase()

  if (!tagName) return

  if (!allTags.value.some((tag) => tag.name === tagName)) {
    // Добавляем новый тег в suggestions для отображения
    suggestions.value.unshift({
      id: `new-${tagName}`,
      name: tagName,
    })
  }

  createTagInput.value = ''
}

const toggleTag = (tag: Tag) => {
  const index = selectedTags.value.indexOf(tag.name)

  if (index !== -1) {
    // Удаляем
    const newTags = [...selectedTags.value]
    newTags.splice(index, 1)
    selectedTags.value = newTags
  } else if (canAddMore.value) {
    // Добавляем
    selectedTags.value = [...selectedTags.value, tag.name]
  }
}

const removeTag = (tag: Tag) => {
  selectedTags.value = selectedTags.value.filter((t) => t !== tag.name)
}

const isSelected = (tagId: string | number) => {
  const tag = allTags.value.find((t) => t.id === tagId)
  return tag ? selectedTags.value.includes(tag.name) : false
}

const handleKeydownCreate = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    event.preventDefault()
    createTag()
  }
}

const handleKeydownSearch = (event: KeyboardEvent) => {
  // Prevent form submission
  if (event.key === 'Enter') {
    event.preventDefault()
  }
}
</script>

<template>
  <div class="w-full">
    <!-- Heading -->
    <h3 v-if="label" class="text-md mb-2 text-gray-600">{{ label }}</h3>

    <!-- Create Tag Section -->
    <div class="flex items-center space-x-2 mb-4">
      <BaseButton variant="primary" size="sm" @click="createTag"> Create </BaseButton>

      <BaseInput
        v-model="createTagInput"
        type="text"
        :placeholder="createPlaceholder"
        @keydown="handleKeydownCreate"
      />
    </div>

    <!-- Search -->
    <BaseInput
      v-model="searchQuery"
      type="text"
      :placeholder="searchPlaceholder"
      @input="handleSearch(searchQuery)"
      @keydown="handleKeydownSearch"
      class="mb-4"
    />

    <!-- Tags Cloud -->
    <TagCloud
      :tags="filteredTags"
      :selected-tags="filteredTags.filter((t) => selectedTags.includes(t.name)).map((t) => t.id)"
      :clickable="true"
      :removable="false"
      size="md"
      @select="toggleTag"
    />

    <!-- Tag Count -->
    <p class="mt-2 text-xs text-gray-400 text-right">
      {{ selectedTags.length }}/{{ maxTags }} tags
    </p>
  </div>
</template>
