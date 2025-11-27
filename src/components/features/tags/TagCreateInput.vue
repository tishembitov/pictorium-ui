<!-- src/components/features/tag/TagCreateInput.vue -->
<script setup lang="ts">
/**
 * TagCreateInput - Input для создания новых тегов
 *
 * Features:
 * - Валидация в реальном времени
 * - Предпросмотр тега
 * - Проверка на дубликаты
 * - Keyboard shortcuts (Enter, Escape)
 * - Character counter
 */

import { ref, computed, watch } from 'vue'
import TagBadge from './TagBadge.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { getTagError, validateTag } from '@/utils/validators'
import { randomTagColor } from '@/utils/colors'
import { TAG_MAX_LENGTH } from '@/utils/constants'

export interface TagCreateInputProps {
  /** Уже существующие теги (для проверки дубликатов) */
  existingTags?: string[]
  /** Placeholder */
  placeholder?: string
  /** Label */
  label?: string
  /** Hint под input */
  hint?: string
  /** Показывать превью */
  showPreview?: boolean
  /** Показывать счетчик символов */
  showCounter?: boolean
  /** Автоочистка после создания */
  autoClear?: boolean
  /** Отключено */
  disabled?: boolean
  /** Размер */
  size?: 'sm' | 'md' | 'lg'
  /** Вариант кнопки */
  buttonVariant?: 'primary' | 'secondary' | 'outline'
  /** Текст кнопки */
  buttonText?: string
  /** Показывать иконку */
  showIcon?: boolean
}

const props = withDefaults(defineProps<TagCreateInputProps>(), {
  existingTags: () => [],
  placeholder: 'Enter tag name...',
  label: '',
  hint: '',
  showPreview: true,
  showCounter: true,
  autoClear: true,
  disabled: false,
  size: 'md',
  buttonVariant: 'primary',
  buttonText: 'Create',
  showIcon: true,
})

const emit = defineEmits<{
  (e: 'create', tagName: string): void
  (e: 'input', value: string): void
  (e: 'error', error: string): void
  (e: 'clear'): void
}>()

// ============================================================================
// STATE
// ============================================================================

const inputValue = ref('')
const inputError = ref<string | null>(null)
const isFocused = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)
const isShaking = ref(false)

// Превью цвет (генерируется один раз при вводе)
const previewColor = ref(randomTagColor())

// ============================================================================
// COMPUTED
// ============================================================================

// Нормализованное значение
const normalizedValue = computed(() => inputValue.value.trim().toLowerCase())

// Можно ли создать
const canCreate = computed(() => {
  if (!normalizedValue.value) return false
  if (inputError.value) return false
  return validateTag(normalizedValue.value)
})

// Есть дубликат
const isDuplicate = computed(() => {
  return props.existingTags.some((tag) => tag.toLowerCase() === normalizedValue.value)
})

// Показывать превью
const shouldShowPreview = computed(() => {
  return props.showPreview && normalizedValue.value && !inputError.value
})

// Показывать счетчик
const shouldShowCounter = computed(() => {
  return props.showCounter && inputValue.value.length > TAG_MAX_LENGTH * 0.5
})

// Классы размера
const sizeClasses = computed(() => {
  const sizes = {
    sm: 'py-2 px-3 text-sm',
    md: 'py-3 px-4 text-base',
    lg: 'py-4 px-5 text-lg',
  }
  return sizes[props.size]
})

// ============================================================================
// METHODS
// ============================================================================

// Валидация
const validate = (): boolean => {
  inputError.value = null

  if (!normalizedValue.value) {
    inputError.value = 'Tag name is required'
    return false
  }

  // Проверка на дубликат
  if (isDuplicate.value) {
    inputError.value = 'This tag already exists'
    return false
  }

  // Стандартная валидация
  const error = getTagError(normalizedValue.value)
  if (error) {
    inputError.value = error
    return false
  }

  return true
}

// Создать тег
const createTag = () => {
  if (props.disabled) return

  if (!validate()) {
    triggerShake()
    emit('error', inputError.value!)
    return
  }

  emit('create', normalizedValue.value)

  if (props.autoClear) {
    clear()
  }
}

// Очистить
const clear = () => {
  inputValue.value = ''
  inputError.value = null
  previewColor.value = randomTagColor()
  emit('clear')
}

// Shake анимация
const triggerShake = () => {
  isShaking.value = true
  setTimeout(() => {
    isShaking.value = false
  }, 500)
}

// Focus input
const focus = () => {
  inputRef.value?.focus()
}

// ============================================================================
// HANDLERS
// ============================================================================

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  inputValue.value = target.value

  // Сбрасываем ошибку при вводе
  if (inputError.value) {
    inputError.value = null
  }

  // Генерируем новый цвет если поле было пустым
  if (target.value.length === 1) {
    previewColor.value = randomTagColor()
  }

  emit('input', target.value)
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    event.preventDefault()
    createTag()
  } else if (event.key === 'Escape') {
    event.preventDefault()
    clear()
    inputRef.value?.blur()
  }
}

const handleFocus = () => {
  isFocused.value = true
}

const handleBlur = () => {
  isFocused.value = false
}

// ============================================================================
// WATCH
// ============================================================================

// Валидация при изменении existingTags
watch(
  () => props.existingTags,
  () => {
    if (normalizedValue.value && isDuplicate.value) {
      inputError.value = 'This tag already exists'
    }
  },
)

// ============================================================================
// EXPOSE
// ============================================================================

defineExpose({
  focus,
  clear,
  validate,
})
</script>

<template>
  <div class="w-full space-y-2">
    <!-- Label -->
    <label v-if="label" class="block text-sm font-medium text-gray-900">
      {{ label }}
    </label>

    <!-- Input Container -->
    <div class="flex items-stretch gap-2">
      <!-- Input Wrapper -->
      <div class="relative flex-1">
        <div
          :class="[
            'flex items-center rounded-full border-2 transition-all duration-200',
            'bg-white overflow-hidden',
            isFocused
              ? 'border-purple-500 ring-2 ring-purple-100'
              : 'border-gray-300 hover:border-gray-400',
            inputError && 'border-red-500 ring-2 ring-red-100',
            isShaking && 'shake-animation',
            disabled && 'opacity-50 cursor-not-allowed bg-gray-50',
          ]"
        >
          <!-- Icon -->
          <div v-if="showIcon" class="pl-4">
            <i class="pi pi-hashtag text-gray-400" />
          </div>

          <!-- Input -->
          <input
            ref="inputRef"
            :value="inputValue"
            type="text"
            :placeholder="placeholder"
            :disabled="disabled"
            :maxlength="TAG_MAX_LENGTH"
            @input="handleInput"
            @keydown="handleKeydown"
            @focus="handleFocus"
            @blur="handleBlur"
            :class="[
              'flex-1 bg-transparent border-none outline-none text-gray-900 placeholder-gray-400',
              sizeClasses,
              !showIcon && 'pl-4',
            ]"
            autocomplete="off"
            spellcheck="false"
          />

          <!-- Clear Button -->
          <button
            v-if="inputValue && !disabled"
            type="button"
            @click="clear"
            class="px-3 text-gray-400 hover:text-gray-600 transition"
            tabindex="-1"
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

        <!-- Character Counter -->
        <span
          v-if="shouldShowCounter"
          :class="[
            'absolute right-3 -bottom-5 text-xs',
            inputValue.length >= TAG_MAX_LENGTH ? 'text-red-500' : 'text-gray-400',
          ]"
        >
          {{ inputValue.length }}/{{ TAG_MAX_LENGTH }}
        </span>
      </div>

      <!-- Create Button -->
      <BaseButton
        :variant="buttonVariant"
        :size="size"
        :disabled="disabled || !canCreate"
        @click="createTag"
        class="flex-shrink-0"
      >
        <i v-if="showIcon" class="pi pi-plus mr-1" />
        {{ buttonText }}
      </BaseButton>
    </div>

    <!-- Error Message -->
    <p v-if="inputError" class="text-sm text-red-500 flex items-center gap-1">
      <i class="pi pi-exclamation-circle text-xs" />
      {{ inputError }}
    </p>

    <!-- Hint -->
    <p v-else-if="hint" class="text-sm text-gray-500">
      {{ hint }}
    </p>

    <!-- Preview -->
    <Transition name="fade">
      <div v-if="shouldShowPreview" class="flex items-center gap-2">
        <span class="text-sm text-gray-500">Preview:</span>
        <TagBadge :name="normalizedValue" :color="previewColor" :clickable="false" size="md" />
      </div>
    </Transition>

    <!-- Keyboard Hint -->
    <div class="text-xs text-gray-400 flex gap-3">
      <span><kbd class="px-1 py-0.5 bg-gray-100 rounded text-[10px]">Enter</kbd> Create</span>
      <span><kbd class="px-1 py-0.5 bg-gray-100 rounded text-[10px]">Esc</kbd> Clear</span>
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
    transform: translateX(-3px);
  }
  20%,
  40%,
  60%,
  80% {
    transform: translateX(3px);
  }
}

.shake-animation {
  animation: shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
