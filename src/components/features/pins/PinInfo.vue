<script setup lang="ts">
import { computed } from 'vue'
import { truncateText } from '@/utils/formatters'
import type { Pin } from '@/types'

export interface PinInfoProps {
  pin: Pin
  maxTitleLength?: number
  maxDescriptionLength?: number
  showTags?: boolean
}

const props = withDefaults(defineProps<PinInfoProps>(), {
  maxTitleLength: 200,
  maxDescriptionLength: 400,
  showTags: false,
})

const displayTitle = computed(() => {
  if (!props.pin.title) return ''
  return truncateText(props.pin.title, props.maxTitleLength)
})

const displayDescription = computed(() => {
  if (!props.pin.description) return ''
  return truncateText(props.pin.description, props.maxDescriptionLength)
})
</script>

<template>
  <div class="space-y-1">
    <!-- Title -->
    <p v-if="pin.title" class="text-sm font-medium text-gray-900">
      {{ displayTitle }}
    </p>

    <!-- Description -->
    <p v-if="pin.description" class="text-sm text-gray-600">
      {{ displayDescription }}
    </p>

    <!-- Tags -->
    <div v-if="showTags && pin.tags && pin.tags.length > 0" class="flex flex-wrap gap-2 mt-2">
      <span
        v-for="tag in pin.tags"
        :key="tag"
        class="px-2 py-1 text-xs bg-gray-100 rounded-full hover:bg-gray-200 cursor-pointer"
      >
        #{{ tag }}
      </span>
    </div>
  </div>
</template>
