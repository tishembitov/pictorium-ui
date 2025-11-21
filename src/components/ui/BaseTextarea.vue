<script setup lang="ts">
import { computed } from 'vue'

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
  resize?: 'none' | 'vertical' | 'horizontal' | 'both'
  rounded?: 'sm' | 'md' | 'lg' | 'xl'
}

const props = withDefaults(defineProps<BaseTextareaProps>(), {
  placeholder: '',
  disabled: false,
  error: '',
  label: '',
  hint: '',
  required: false,
  rows: 4,
  resize: 'vertical',
  rounded: 'lg',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'blur', event: FocusEvent): void
  (e: 'focus', event: FocusEvent): void
}>()

const textareaClasses = computed(() => {
  const baseClasses = [
    'w-full',
    'border',
    'bg-gray-50',
    'text-gray-900',
    'transition-all',
    'duration-200',
    'focus:outline-none',
    'focus:ring-2',
    'disabled:opacity-50',
    'disabled:cursor-not-allowed',
    'px-5',
    'py-3',
  ]

  const roundedClasses = {
    sm: 'rounded',
    md: 'rounded-lg',
    lg: 'rounded-2xl',
    xl: 'rounded-3xl',
  }

  const resizeClasses = {
    none: 'resize-none',
    vertical: 'resize-y',
    horizontal: 'resize-x',
    both: 'resize',
  }

  const stateClasses = props.error
    ? ['border-red-500', 'focus:ring-red-500', 'focus:border-red-500']
    : ['border-gray-300', 'focus:ring-red-500', 'focus:border-red-500', 'hover:bg-red-50']

  return [
    ...baseClasses,
    roundedClasses[props.rounded],
    resizeClasses[props.resize],
    ...stateClasses,
  ]
})

const handleInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement
  emit('update:modelValue', target.value)
}
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
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :maxlength="maxLength"
      :rows="rows"
      :class="textareaClasses"
      @input="handleInput"
      @blur="emit('blur', $event as FocusEvent)"
      @focus="emit('focus', $event as FocusEvent)"
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
