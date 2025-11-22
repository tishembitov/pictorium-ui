<script setup lang="ts">
import { computed, type ComputedRef } from 'vue'
import TagBadge from '@/components/ui/TagBadge.vue'
import type { Tag } from '@/types'

export interface TagCloudProps {
  tags: Tag[]
  selectedTags?: (string | number)[]
  maxTags?: number
  size?: 'sm' | 'md' | 'lg'
  clickable?: boolean
  removable?: boolean
}

const props = withDefaults(defineProps<TagCloudProps>(), {
  selectedTags: () => [],
  maxTags: 0,
  size: 'md',
  clickable: true,
  removable: false,
})

const emit = defineEmits<{
  (e: 'select', tag: Tag): void
  (e: 'remove', tag: Tag): void
}>()

const visibleTags: ComputedRef<Tag[]> = computed(() => {
  if (props.maxTags > 0) {
    return props.tags.slice(0, props.maxTags)
  }
  return props.tags
})

const hiddenCount = computed(() => {
  if (props.maxTags > 0 && props.tags.length > props.maxTags) {
    return props.tags.length - props.maxTags
  }
  return 0
})

const isSelected = (tagId: string | number) => {
  return props.selectedTags.includes(tagId)
}

const handleSelect = (tag: Tag) => {
  if (props.clickable) {
    emit('select', tag)
  }
}

const handleRemove = (tag: Tag) => {
  emit('remove', tag)
}
</script>

<template>
  <div class="flex flex-wrap gap-2" v-auto-animate>
    <TagBadge
      v-for="tag in visibleTags"
      :key="tag.id"
      :label="tag.name"
      :color="tag.color"
      :selected="isSelected(tag.id)"
      :removable="removable"
      :clickable="clickable"
      :size="size"
      @click="handleSelect(tag)"
      @remove="handleRemove(tag)"
    />

    <span
      v-if="hiddenCount > 0"
      :class="[
        'inline-flex items-center rounded-full font-medium bg-gray-200 text-gray-700',
        size === 'sm'
          ? 'text-xs px-2 py-1'
          : size === 'md'
            ? 'text-sm px-3 py-2'
            : 'text-base px-4 py-2',
      ]"
    >
      +{{ hiddenCount }}
    </span>
  </div>
</template>
