<script setup lang="ts">
import { ref, watch } from 'vue'
import { useDebounce } from '@/composables/utils'
import BaseInput from '@/components/ui/BaseInput.vue'

export interface TagSearchInputProps {
  modelValue: string
  placeholder?: string
  debounceDelay?: number
}

const props = withDefaults(defineProps<TagSearchInputProps>(), {
  placeholder: 'Search tags...',
  debounceDelay: 300,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'search', value: string): void
}>()

const inputValue = ref(props.modelValue)
const debouncedValue = useDebounce(inputValue, props.debounceDelay)

watch(
  () => props.modelValue,
  (newValue) => {
    inputValue.value = newValue
  },
)

watch(debouncedValue, (newValue) => {
  emit('update:modelValue', newValue)
  emit('search', newValue)
})

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    event.preventDefault()
  }
}
</script>

<template>
  <BaseInput v-model="inputValue" type="text" :placeholder="placeholder" @keydown="handleKeydown">
    <template #icon>
      <i class="pi pi-search text-gray-400" />
    </template>
  </BaseInput>
</template>
