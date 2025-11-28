<!-- src/components/features/users/profile/UserPins.vue -->
<script setup lang="ts">
/**
 * UserPins - Пины пользователя с infinite scroll
 * ✅ ИСПРАВЛЕНО: убран unsafe type assertion, добавлена валидация
 */

import { ref, computed, watch, onMounted } from 'vue'
import { usePinsStore } from '@/stores/pins.store'
import { useInfiniteScroll } from '@/composables/utils/useIntersectionObserver'
import PinMasonry from '@/components/features/pins/PinMasonry.vue'
import BaseLoader from '@/components/ui/BaseLoader.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import type { PinFilter, PinWithBlob, Pin } from '@/types'
import type { PinGroup } from '@/components/features/pins/PinMasonry.vue'

export interface UserPinsProps {
  userId: string
  variant: 'created' | 'saved' | 'liked'
}

const props = defineProps<UserPinsProps>()

const emit = defineEmits<{
  delete: [pinId: string]
}>()

const pinsStore = usePinsStore()

const triggerRef = ref<HTMLElement | null>(null)

// ============ COMPUTED ============

type FeedType = 'created' | 'saved' | 'liked'

const feed = computed(() => pinsStore.feeds.get(props.variant as FeedType))
const pins = computed(() => feed.value?.pins || [])
const hasMore = computed(() => feed.value?.hasMore ?? true)
const isLoading = computed(() => feed.value?.isLoading || false)
const isEmpty = computed(() => !isLoading.value && pins.value.length === 0)
const currentPage = computed(() => feed.value?.page ?? -1)

// ✅ FIX: Безопасная конвертация с runtime проверкой
function isPinWithBlob(pin: Pin): pin is PinWithBlob {
  return 'imageBlobUrl' in pin || 'videoBlobUrl' in pin
}

const pinGroups = computed<PinGroup[]>(() => {
  if (pins.value.length === 0) return []

  // ✅ Фильтруем только валидные PinWithBlob
  const validPins = pins.value.filter(isPinWithBlob)

  if (validPins.length === 0) return []

  return [
    {
      id: `${props.variant}-${props.userId}`,
      pins: validPins,
      showAllPins: true,
      loadedCount: validPins.length,
    },
  ]
})

const masonryVariant = computed(() => {
  const variantMap: Record<string, 'default' | 'created' | 'saved' | 'deletable' | 'board'> = {
    created: 'created',
    saved: 'saved',
    liked: 'default',
  }
  return variantMap[props.variant] || 'default'
})

const emptyConfig = computed(() => {
  const configs = {
    created: {
      title: 'No pins created yet',
      description: 'Pins you create will appear here',
      icon: 'pi-plus-circle',
    },
    saved: {
      title: 'No saved pins',
      description: 'Pins you save will appear here',
      icon: 'pi-bookmark',
    },
    liked: {
      title: 'No liked pins',
      description: 'Pins you like will appear here',
      icon: 'pi-heart',
    },
  }
  return configs[props.variant]
})

// ============ INFINITE SCROLL ============

const { isLoading: isLoadingMore } = useInfiniteScroll(triggerRef, loadMore, {
  distance: 200,
  disabled: computed(() => !hasMore.value || isLoading.value),
})

// ============ METHODS ============

function buildFilter(): PinFilter {
  const baseFilter: PinFilter = {}

  switch (props.variant) {
    case 'created':
      baseFilter.authorId = props.userId
      baseFilter.scope = 'CREATED'
      break
    case 'saved':
      baseFilter.savedBy = props.userId
      baseFilter.scope = 'SAVED'
      break
    case 'liked':
      baseFilter.likedBy = props.userId
      baseFilter.scope = 'LIKED'
      break
  }

  return baseFilter
}

async function loadMore() {
  const filter = buildFilter()
  await pinsStore.fetchPins(filter, currentPage.value + 1, 15, props.variant as FeedType)
}

async function initialLoad() {
  pinsStore.resetFeed(props.variant as FeedType)
  const filter = buildFilter()
  await pinsStore.fetchPins(filter, 0, 15, props.variant as FeedType)
}

function handleDelete(pinId: string) {
  emit('delete', pinId)
}

function handleLoadMore() {
  if (hasMore.value && !isLoading.value) {
    loadMore()
  }
}

// ============ LIFECYCLE ============

onMounted(() => {
  initialLoad()
})

watch([() => props.userId, () => props.variant], () => {
  initialLoad()
})
</script>

<template>
  <div class="mt-6 px-4">
    <!-- Initial loading -->
    <div v-if="isLoading && pins.length === 0" class="flex items-center justify-center py-20">
      <BaseLoader variant="spinner" size="lg" />
    </div>

    <!-- Pins grid -->
    <template v-else-if="pinGroups.length > 0">
      <PinMasonry
        :pin-groups="pinGroups"
        :variant="masonryVariant"
        :show-user="true"
        @delete="handleDelete"
        @load-more="handleLoadMore"
      />

      <div ref="triggerRef" class="h-20" />

      <div v-if="isLoadingMore" class="flex justify-center py-8">
        <BaseLoader variant="spinner" size="md" />
      </div>
    </template>

    <!-- Empty state -->
    <EmptyState
      v-else-if="isEmpty"
      :title="emptyConfig.title"
      :description="emptyConfig.description"
      :icon="emptyConfig.icon"
    />
  </div>
</template>
