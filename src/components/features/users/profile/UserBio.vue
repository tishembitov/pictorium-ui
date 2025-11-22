<script setup lang="ts">
import { ref, computed } from 'vue'

export interface UserBioProps {
  description?: string | null
  maxLength?: number
  expandable?: boolean
}

const props = withDefaults(defineProps<UserBioProps>(), {
  maxLength: 200,
  expandable: true,
})

const showFullDescription = ref(false)

const shouldTruncate = computed(() => {
  if (!props.description) return false
  return props.expandable && props.description.length > props.maxLength
})

const displayDescription = computed(() => {
  if (!props.description) return ''

  if (shouldTruncate.value && !showFullDescription.value) {
    return props.description.substring(0, props.maxLength) + '...'
  }

  return props.description
})

const toggleDescription = () => {
  showFullDescription.value = !showFullDescription.value
}
</script>

<template>
  <div v-if="description" class="mt-4 max-w-lg">
    <p class="text-gray-800 whitespace-pre-line">
      {{ displayDescription }}
    </p>

    <button
      v-if="shouldTruncate"
      @click="toggleDescription"
      class="mt-2 font-bold text-black hover:underline transition"
    >
      {{ showFullDescription ? 'Show less' : 'More' }}
    </button>
  </div>
</template>
