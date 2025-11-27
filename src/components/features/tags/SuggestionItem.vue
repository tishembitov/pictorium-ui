<!-- src/components/features/tags/SuggestionItem.vue -->
<script setup lang="ts">
/**
 * SuggestionItem - Элемент suggestion для AdvancedTagsSelector
 */
import type { Tag } from '@/types'

export interface SuggestionItemProps {
  tag: Tag
  highlighted?: boolean
}

withDefaults(defineProps<SuggestionItemProps>(), {
  highlighted: false,
})

const emit = defineEmits<(e: 'click') => void>()
</script>

<template>
  <div
    :class="[
      'flex items-center gap-3 px-4 py-3 cursor-pointer transition',
      highlighted ? 'bg-purple-50 highlighted' : 'hover:bg-gray-50',
    ]"
    @click="emit('click')"
  >
    <i class="pi pi-hashtag text-gray-400" />
    <span class="text-gray-900">{{ tag.name }}</span>
  </div>
</template>
