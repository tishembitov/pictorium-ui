<script setup lang="ts">
import { computed } from 'vue'

export interface BaseInputProps {
  modelValue: string | number
  type?: 'text' | 'email' | 'password' | 'url' | 'number' | 'search'
  placeholder?: string
  disabled?: boolean
  error?: string
  label?: string
  hint?: string
  required?: boolean
  maxLength?: number
  rounded?: 'sm' | 'md' | 'lg' | 'full'
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<BaseInputProps>(), {
  type: 'text',
  placeholder: '',
  disabled: false,
  error: '',
  label: '',
  hint: '',
  required: false,
  rounded: 'full',
  size: 'md',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void
  (e: 'blur', event: FocusEvent): void
  (e: 'focus', event: FocusEvent): void
  (e: 'keydown', event: KeyboardEvent): void
  (e: 'keyup', event: KeyboardEvent): void
  (e: 'enter', event: KeyboardEvent): void
}>()

const inputClasses = computed(() => {
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
  ]

  const sizeClasses = {
    sm: ['text-sm', 'px-3', 'py-2'],
    md: ['text-base', 'px-5', 'py-3'],
    lg: ['text-lg', 'px-6', 'py-4'],
  }

  const roundedClasses = {
    sm: 'rounded',
    md: 'rounded-lg',
    lg: 'rounded-2xl',
    full: 'rounded-full',
  }

  const stateClasses = props.error
    ? ['border-red-500', 'focus:ring-red-500', 'focus:border-red-500']
    : ['border-gray-300', 'focus:ring-red-500', 'focus:border-red-500', 'hover:bg-red-100']

  return [
    ...baseClasses,
    ...sizeClasses[props.size],
    roundedClasses[props.rounded],
    ...stateClasses,
  ]
})

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}

const handleKeydown = (event: KeyboardEvent) => {
  emit('keydown', event)
  if (event.key === 'Enter') {
    emit('enter', event)
  }
}
</script>

<template>
  <div class="w-full">
    <!-- Label -->
    <label v-if="label" class="block mb-2 text-sm font-medium text-gray-900">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>

    <!-- Input -->
    <input
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :maxlength="maxLength"
      :class="inputClasses"
      autocomplete="off"
      @input="handleInput"
      @blur="emit('blur', $event as FocusEvent)"
      @focus="emit('focus', $event as FocusEvent)"
      @keydown="handleKeydown"
      @keyup="emit('keyup', $event as KeyboardEvent)"
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
      {{ String(modelValue).length }}/{{ maxLength }}
    </p>
  </div>
</template>
