<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'

export interface BaseTextareaProps {
  modelValue: string
  placeholder?: string
  disabled?: boolean
  error?: string
  label?: string
  hint?: string
  required?: boolean
  maxLength?: number
  rows?: number
  autoResize?: boolean
  rounded?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<BaseTextareaProps>(), {
  placeholder: '',
  disabled: false,
  error: '',
  label: '',
  hint: '',
  required: false,
  rows: 4,
  autoResize: false,
  rounded: 'lg',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'blur', event: FocusEvent): void
  (e: 'focus', event: FocusEvent): void
  (e: 'keydown', event: KeyboardEvent): void
}>()

const textareaRef = ref<HTMLTextAreaElement | null>(null)

const textareaClasses = computed(() => {
  const baseClasses = [
    'w-full',
    'border',
    'bg-gray-50',
    'text-gray-900',
    'text-base',
    'px-5',
    'py-3',
    'transition-all',
    'duration-200',
    'focus:outline-none',
    'focus:ring-2',
    'disabled:opacity-50',
    'disabled:cursor-not-allowed',
    'resize-none',
  ]

  const roundedClasses = {
    sm: 'rounded',
    md: 'rounded-lg',
    lg: 'rounded-2xl',
  }

  const stateClasses = props.error
    ? ['border-red-500', 'focus:ring-red-500', 'focus:border-red-500']
    : ['border-gray-300', 'focus:ring-red-500', 'focus:border-red-500', 'hover:bg-red-100']

  return [...baseClasses, roundedClasses[props.rounded], ...stateClasses]
})

const handleInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement
  emit('update:modelValue', target.value)

  if (props.autoResize) {
    resizeTextarea()
  }
}

const resizeTextarea = async () => {
  await nextTick()
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto'
    textareaRef.value.style.height = `${textareaRef.value.scrollHeight}px`
  }
}

watch(
  () => props.modelValue,
  () => {
    if (props.autoResize) {
      resizeTextarea()
    }
  },
)
</script>

<template>
  <div class="w-full">
    <!-- Label -->
    <label v-if="label" class="block mb-2 text-sm font-medium text-gray-900">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>

    <!-- Textarea -->
    <textarea
      ref="textareaRef"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :maxlength="maxLength"
      :rows="autoResize ? 1 : rows"
      :class="textareaClasses"
      @input="handleInput"
      @blur="emit('blur', $event as FocusEvent)"
      @focus="emit('focus', $event as FocusEvent)"
      @keydown="emit('keydown', $event as KeyboardEvent)"
    />

    <!-- Hint -->
    <p v-if="hint && !error" class="mt-1 text-sm text-gray-500">
      {{ hint }}
    </p>

    <!-- Error -->
    <p v-if="error" class="mt-1 text-sm text-red-500">
      {{ error }}
    </p>

    <!-- Character count -->
    <p v-if="maxLength" class="mt-1 text-xs text-gray-400 text-right">
      {{ modelValue.length }}/{{ maxLength }}
    </p>
  </div>
</template>
