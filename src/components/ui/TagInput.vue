<script setup lang="ts">
import { ref, computed } from 'vue'
import { randomTagColor } from '@/utils/colors'
import { validateTag, getTagError } from '@/utils/validators'
import { useTagSearch } from '@/composables/api/useTagSearch'

export interface TagInputProps {
  modelValue: string[]
  label?: string
  placeholder?: string
  maxTags?: number
  disabled?: boolean
  showSuggestions?: boolean
  allowCustom?: boolean
}

const props = withDefaults(defineProps<TagInputProps>(), {
  label: '',
  placeholder: 'Add a tag...',
  maxTags: 10,
  disabled: false,
  showSuggestions: true,
  allowCustom: true,
})

const emit = defineEmits<(e: 'update:modelValue', value: string[]) => void>()

const inputValue = ref('')
const inputError = ref<string | null>(null)
const showSuggestionsDropdown = ref(false)

// Tag search composable
const { suggestions, search, clear: clearSuggestions } = useTagSearch()

// Computed
const canAddMore = computed(() => {
  return props.modelValue.length < props.maxTags
})

const tagsWithColors = computed(() => {
  return props.modelValue.map((tag) => ({
    name: tag,
    color: randomTagColor(),
  }))
})

// Methods
const handleInput = async (event: Event) => {
  const target = event.target as HTMLInputElement
  inputValue.value = target.value
  inputError.value = null

  // Search suggestions
  if (props.showSuggestions && inputValue.value.trim()) {
    await search(inputValue.value)
    showSuggestionsDropdown.value = suggestions.value.length > 0
  } else {
    clearSuggestions()
    showSuggestionsDropdown.value = false
  }
}

const addTag = (tagName: string) => {
  const trimmed = tagName.trim().toLowerCase()

  // Validation
  if (!trimmed) {
    inputError.value = 'Tag cannot be empty'
    return
  }

  const error = getTagError(trimmed)
  if (error) {
    inputError.value = error
    return
  }

  if (!canAddMore.value) {
    inputError.value = `Maximum ${props.maxTags} tags allowed`
    return
  }

  if (props.modelValue.includes(trimmed)) {
    inputError.value = 'Tag already added'
    return
  }

  // Add tag
  emit('update:modelValue', [...props.modelValue, trimmed])
  inputValue.value = ''
  inputError.value = null
  clearSuggestions()
  showSuggestionsDropdown.value = false
}

const removeTag = (index: number) => {
  const newTags = [...props.modelValue]
  newTags.splice(index, 1)
  emit('update:modelValue', newTags)
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    event.preventDefault()
    if (props.allowCustom) {
      addTag(inputValue.value)
    }
  } else if (event.key === 'Backspace' && !inputValue.value && props.modelValue.length > 0) {
    // Remove last tag on backspace
    removeTag(props.modelValue.length - 1)
  } else if (event.key === 'Escape') {
    showSuggestionsDropdown.value = false
  }
}

const selectSuggestion = (tagName: string) => {
  addTag(tagName)
}

const handleBlur = () => {
  // Delay to allow click on suggestion
  setTimeout(() => {
    showSuggestionsDropdown.value = false
  }, 200)
}
</script>

<template>
  <div class="w-full">
    <!-- Label -->
    <label v-if="label" class="block mb-2 text-sm font-medium text-gray-900">
      {{ label }}
    </label>

    <!-- Tags Container -->
    <div
      :class="[
        'w-full min-h-[48px] flex flex-wrap items-center gap-2 p-3',
        'border rounded-2xl bg-gray-50 transition-all',
        'focus-within:ring-2 focus-within:ring-red-500 focus-within:border-red-500',
        inputError ? 'border-red-500' : 'border-gray-300',
        disabled && 'opacity-50 cursor-not-allowed',
      ]"
    >
      <!-- Existing Tags -->
      <div
        v-for="(tag, index) in tagsWithColors"
        :key="index"
        :class="[
          'flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium',
          tag.color,
          'text-gray-800',
        ]"
      >
        <span>#{{ tag.name }}</span>
        <button
          v-if="!disabled"
          @click="removeTag(index)"
          class="hover:text-red-600 transition"
          type="button"
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
        @blur="handleBlur"
        @focus="showSuggestionsDropdown = suggestions.length > 0"
        class="flex-1 min-w-[120px] bg-transparent border-none outline-none text-gray-900 placeholder-gray-400"
      />
    </div>

    <!-- Error -->
    <p v-if="inputError" class="mt-1 text-sm text-red-500">
      {{ inputError }}
    </p>

    <!-- Tag Count -->
    <p class="mt-1 text-xs text-gray-400 text-right">{{ modelValue.length }}/{{ maxTags }} tags</p>

    <!-- Suggestions Dropdown -->
    <Transition name="slide-down">
      <div v-if="showSuggestionsDropdown && suggestions.length > 0" class="relative mt-2">
        <div
          class="absolute z-20 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
        >
          <button
            v-for="suggestion in suggestions"
            :key="suggestion.id"
            @click="selectSuggestion(suggestion.name)"
            type="button"
            class="w-full text-left px-4 py-2 hover:bg-gray-100 transition flex items-center gap-2"
          >
            <i class="pi pi-hashtag text-gray-400 text-sm"></i>
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
