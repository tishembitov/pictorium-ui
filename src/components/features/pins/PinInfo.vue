<!-- src/components/features/pins/PinInfo.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { randomTagColor } from '@/utils/colors'
import { truncateText } from '@/utils/formatters'
import TagBadge from '@/components/features/tags/TagBadge.vue'

export interface PinInfoProps {
  title?: string | null
  description?: string | null
  href?: string | null
  tags?: string[]
  rgb?: string | null
  variant?: 'card' | 'detail'
  maxDescriptionLength?: number
}

const props = withDefaults(defineProps<PinInfoProps>(), {
  tags: () => [],
  variant: 'card',
  maxDescriptionLength: 200,
})

const router = useRouter()

// Computed
const tagsWithColors = computed(() =>
  props.tags.map((tag) => ({
    name: tag,
    color: randomTagColor(),
  })),
)

const displayDescription = computed(() => {
  if (!props.description) return null
  return truncateText(props.description, props.maxDescriptionLength)
})

const titleColor = computed(() => props.rgb || '#111827')

// Methods
function handleTagClick(tagName: string) {
  router.push({ path: '/', query: { tag: tagName } })
}
</script>

<template>
  <!-- Card variant -->
  <div v-if="variant === 'card'" class="mt-2">
    <p v-if="title" class="text-sm font-medium truncate text-gray-900">
      {{ title }}
    </p>
  </div>

  <!-- Detail variant -->
  <div v-else class="space-y-4">
    <!-- Title -->
    <h1 v-if="title" :style="{ color: titleColor }" class="font-bold text-2xl">
      {{ title }}
    </h1>

    <!-- Description -->
    <p v-if="description" class="text-gray-700 leading-relaxed">
      {{ displayDescription }}
    </p>

    <!-- External link -->
    <a
      v-if="href"
      :href="href"
      target="_blank"
      rel="noopener noreferrer"
      class="block w-full text-center py-3 bg-neutral-200 text-black font-medium rounded-full hover:bg-neutral-300 transition duration-300"
    >
      <i class="pi pi-external-link mr-2" />
      Visit site
    </a>

    <!-- Tags -->
    <!-- ✅ ИСПРАВЛЕНО: убран v-auto-animate или добавить импорт -->
    <div v-if="tags.length > 0" class="flex flex-wrap gap-2">
      <TagBadge
        v-for="tag in tagsWithColors"
        :key="tag.name"
        :name="tag.name"
        :color="tag.color"
        size="md"
        clickable
        @click="handleTagClick(tag.name)"
      />
    </div>
  </div>
</template>
