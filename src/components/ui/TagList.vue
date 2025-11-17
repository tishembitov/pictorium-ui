<script setup lang="ts">
import { computed } from 'vue'
import TagBadge from './TagBadge.vue'

export interface Tag {
  id: string | number
  name: string
  color?: string
}

export interface TagListProps {
  tags: Tag[]
  selectedTags?: (string | number)[]
  selectable?: boolean
  removable?: boolean
  maxVisible?: number
  size?: 'sm' | 'md' | 'lg'
  wrap?: boolean
}

const props = withDefaults(defineProps<TagListProps>(), {
  selectedTags: () => [],
  selectable: false,
  removable: false,
  maxVisible: 0,
  size: 'md',
  wrap: true,
})

const emit = defineEmits<{
  (e: 'select', tag: Tag): void
  (e: 'remove', tag: Tag): void
}>()

const visibleTags = computed(() => {
  if (props.maxVisible > 0) {
    return props.tags.slice(0, props.maxVisible)
  }
  return props.tags
})

const hiddenTagsCount = computed(() => {
  if (props.maxVisible > 0 && props.tags.length > props.maxVisible) {
    return props.tags.length - props.maxVisible
  }
  return 0
})

const isSelected = (tagId: string | number) => {
  return props.selectedTags.includes(tagId)
}

const handleSelect = (tag: Tag) => {
  emit('select', tag)
}

const handleRemove = (tag: Tag) => {
  emit('remove', tag)
}
</script>

<template>
  <div :class="['flex items-center gap-2', wrap ? 'flex-wrap' : 'flex-nowrap overflow-x-auto']">
    <TagBadge
      v-for="tag in visibleTags"
      :key="tag.id"
      :label="tag.name"
      :color="tag.color"
      :selected="isSelected(tag.id)"
      :removable="removable"
      :clickable="selectable"
      :size="size"
      @click="handleSelect(tag)"
      @remove="handleRemove(tag)"
    />

    <span
      v-if="hiddenTagsCount > 0"
      :class="[
        'inline-flex items-center rounded-full font-medium bg-gray-200 text-gray-700',
        size === 'sm'
          ? 'text-xs px-2 py-1'
          : size === 'md'
            ? 'text-sm px-3 py-2'
            : 'text-base px-4 py-2',
      ]"
    >
      +{{ hiddenTagsCount }}
    </span>
  </div>
</template>
