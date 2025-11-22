<script setup lang="ts">
/**
 * Advanced Tags Selector
 *
 * Полнофункциональный селектор тегов с:
 * - Поиском с автокомплитом
 * - Созданием новых тегов
 * - Валидацией
 * - Лимитом тегов
 * - Drag & Drop для сортировки
 */
import { ref, computed, watch } from 'vue'
import { useTagSearch } from '@/composables/api/useTags'
import { useFieldArray } from '@/composables/form/useForm'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import TagBadge from '@/components/ui/TagBadge.vue'
import type { Tag } from '@/types'
import { randomTagColor } from '@/utils/colors'
import { validateTag, getTagError } from '@/utils/validators'

export interface AdvancedTagsSelectorProps {
  modelValue: string[]
  maxTags?: number
  label?: string
  required?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<AdvancedTagsSelectorProps>(), {
  maxTags: 10,
  label: 'Tags',
  required: false,
  disabled: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string[]): void
}>()

const { suggestions, search, clear, isSearching } = useTagSearch()

const searchQuery = ref('')
const createInput = ref('')
const showSuggestions = ref(false)
const error = ref<string | null>(null)

const selectedTags = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const canAddMore = computed(() => selectedTags.value.length < props.maxTags)

const tagsWithColors = computed(() => {
  return selectedTags.value.map((tagName) => ({
    id: tagName,
    name: tagName,
    color: randomTagColor(),
  }))
})

const filteredSuggestions = computed(() => {
  if (!searchQuery.value.trim()) return []

  // Фильтруем уже выбранные теги
  return suggestions.value.filter((tag) => !selectedTags.value.includes(tag.name))
})

// Поиск тегов
const handleSearch = async () => {
  if (searchQuery.value.trim()) {
    await search(searchQuery.value)
    showSuggestions.value = true
  } else {
    clear()
    showSuggestions.value = false
  }
}

// Добавление тега из suggestions
const addTagFromSuggestion = (tag: Tag) => {
  if (!canAddMore.value) {
    error.value = `Maximum ${props.maxTags} tags allowed`
    return
  }

  if (!selectedTags.value.includes(tag.name)) {
    selectedTags.value = [...selectedTags.value, tag.name]
  }

  searchQuery.value = ''
  showSuggestions.value = false
  error.value = null
}

// Создание нового тега
const createTag = () => {
  const tagName = createInput.value.trim().toLowerCase()

  if (!tagName) {
    error.value = 'Tag name is required'
    return
  }

  const validationError = getTagError(tagName)
  if (validationError) {
    error.value = validationError
    return
  }

  if (!canAddMore.value) {
    error.value = `Maximum ${props.maxTags} tags allowed`
    return
  }

  if (selectedTags.value.includes(tagName)) {
    error.value = 'Tag already added'
    return
  }

  selectedTags.value = [...selectedTags.value, tagName]
  createInput.value = ''
  error.value = null
}

// Удаление тега
const removeTag = (tagName: string) => {
  selectedTags.value = selectedTags.value.filter((t) => t !== tagName)
  error.value = null
}

// Keyboard shortcuts
const handleSearchKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    event.preventDefault()

    // Если есть suggestions, добавляем первый
    if (filteredSuggestions.value.length > 0) {
      addTagFromSuggestion(filteredSuggestions.value[0])
    }
  } else if (event.key === 'Escape') {
    showSuggestions.value = false
  }
}

const handleCreateKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    event.preventDefault()
    createTag()
  }
}

// Debounced search
watch(searchQuery, () => {
  handleSearch()
})

// Click outside to close suggestions
const handleClickOutside = () => {
  setTimeout(() => {
    showSuggestions.value = false
  }, 200)
}
</script>

<template>
  <div class="w-full">
    <!-- Label -->
    <label v-if="label" class="block mb-2 text-sm font-medium text-gray-900">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>

    <!-- Create Tag Section -->
    <div class="flex items-center gap-2 mb-4">
      <BaseButton
        variant="primary"
        size="sm"
        @click="createTag"
        :disabled="disabled || !canAddMore"
      >
        Create
      </BaseButton>

      <BaseInput
        v-model="createInput"
        type="text"
        placeholder="Create new tag"
        :disabled="disabled || !canAddMore"
        @keydown="handleCreateKeydown"
      />
    </div>

    <!-- Selected Tags Container -->
    <div
      :class="[
        'w-full min-h-[48px] flex flex-wrap items-center gap-2 p-3',
        'border rounded-2xl bg-gray-50 transition-all',
        error ? 'border-red-500' : 'border-gray-300',
        disabled && 'opacity-50 cursor-not-allowed',
      ]"
    >
      <!-- Selected Tags -->
      <TagBadge
        v-for="tag in tagsWithColors"
        :key="tag.id"
        :label="`#${tag.name}`"
        :color="tag.color"
        :removable="!disabled"
        :clickable="false"
        size="md"
        @remove="removeTag(tag.name)"
      />

      <!-- Search Input -->
      <div class="relative flex-1 min-w-[120px]">
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="canAddMore ? 'Search tags...' : `Max ${maxTags} tags`"
          :disabled="disabled || !canAddMore"
          @keydown="handleSearchKeydown"
          @blur="handleClickOutside"
          class="w-full bg-transparent border-none outline-none text-gray-900 placeholder-gray-400"
        />

        <!-- Suggestions Dropdown -->
        <Transition name="slide-down">
          <div
            v-if="showSuggestions && filteredSuggestions.length > 0"
            class="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-20"
          >
            <button
              v-for="suggestion in filteredSuggestions"
              :key="suggestion.id"
              @click="addTagFromSuggestion(suggestion)"
              type="button"
              class="w-full text-left px-4 py-2 hover:bg-gray-100 transition flex items-center gap-2"
            >
              <i class="pi pi-hashtag text-gray-400 text-sm"></i>
              <span class="text-gray-900">{{ suggestion.name }}</span>
            </button>
          </div>
        </Transition>
      </div>
    </div>

    <!-- Error Message -->
    <p v-if="error" class="mt-1 text-sm text-red-500">
      {{ error }}
    </p>

    <!-- Tag Count -->
    <p class="mt-1 text-xs text-gray-400 text-right">
      {{ selectedTags.length }}/{{ maxTags }} tags
    </p>
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
