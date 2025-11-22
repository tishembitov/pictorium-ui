<script setup lang="ts">
import { ref } from 'vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { validateTag, getTagError } from '@/utils/validators'

export interface TagCreateInputProps {
  placeholder?: string
  buttonText?: string
}

const props = withDefaults(defineProps<TagCreateInputProps>(), {
  placeholder: 'Create new tag',
  buttonText: 'Create',
})

const emit = defineEmits<{
  (e: 'create', tagName: string): void
}>()

const inputValue = ref('')
const error = ref<string | null>(null)

const handleCreate = () => {
  const trimmed = inputValue.value.trim().toLowerCase()

  if (!trimmed) {
    error.value = 'Tag name is required'
    return
  }

  const validationError = getTagError(trimmed)
  if (validationError) {
    error.value = validationError
    return
  }

  emit('create', trimmed)
  inputValue.value = ''
  error.value = null
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    event.preventDefault()
    handleCreate()
  }
}

const handleInput = () => {
  error.value = null
}
</script>

<template>
  <div class="flex items-start space-x-2">
    <BaseButton :variant="'primary'" :size="'md'" @click="handleCreate">
      {{ buttonText }}
    </BaseButton>

    <div class="flex-1">
      <BaseInput
        v-model="inputValue"
        type="text"
        :placeholder="placeholder"
        :error="error || ''"
        @keydown="handleKeydown"
        @input="handleInput"
      />
    </div>
  </div>
</template>
