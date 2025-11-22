<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import PinGrid from '@/components/features/pin/PinGrid.vue'
import BaseLoader from '@/components/ui/BaseLoader.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { pinsApi } from '@/api/pins.api'
import type { Pin, PinScope } from '@/types'

export interface UserPinsProps {
  userId: string
  scope: PinScope // 'CREATED' | 'SAVED' | 'LIKED'
  autoLoad?: boolean
}

const props = withDefaults(defineProps<UserPinsProps>(), {
  autoLoad: true,
})

const pins = ref<Pin[]>([])
const isLoading = ref(false)
const hasMore = ref(true)
const currentPage = ref(0)
const pageSize = 15

const loadPins = async (page = 0) => {
  if (isLoading.value) return

  try {
    isLoading.value = true

    const filter = {
      scope: props.scope,
      authorId: props.scope === 'CREATED' ? props.userId : undefined,
      savedBy: props.scope === 'SAVED' ? props.userId : undefined,
      likedBy: props.scope === 'LIKED' ? props.userId : undefined,
    }

    const response = await pinsApi.getPins(filter, {
      page,
      size: pageSize,
      sort: ['createdAt,desc'],
    })

    if (page === 0) {
      pins.value = response.content
    } else {
      pins.value.push(...response.content)
    }

    currentPage.value = page
    hasMore.value = !response.last
  } catch (error) {
    console.error('[UserPins] Load pins failed:', error)
  } finally {
    isLoading.value = false
  }
}

const loadMore = () => {
  if (hasMore.value) {
    loadPins(currentPage.value + 1)
  }
}

const refresh = () => {
  pins.value = []
  currentPage.value = 0
  hasMore.value = true
  loadPins(0)
}

// Watch for scope changes
watch(() => props.scope, refresh)

onMounted(() => {
  if (props.autoLoad) {
    loadPins()
  }
})

defineExpose({
  refresh,
  loadMore,
})

const emptyStateConfig = computed(() => {
  const configs = {
    CREATED: {
      title: 'No pins created yet',
      message: 'Start creating pins to see them here',
      icon: 'pi-plus-circle',
    },
    SAVED: {
      title: 'No saved pins',
      message: 'Save pins you like to see them here',
      icon: 'pi-bookmark',
    },
    LIKED: {
      title: 'No liked pins',
      message: 'Like pins to see them here',
      icon: 'pi-heart',
    },
  }
  return configs[props.scope] || configs.CREATED
})
</script>

<template>
  <div class="py-6">
    <!-- Loading State (initial) -->
    <div v-if="isLoading && pins.length === 0" class="flex justify-center py-12">
      <BaseLoader variant="spinner" size="lg" />
    </div>

    <!-- Pins Grid -->
    <PinGrid v-else-if="pins.length > 0" :pins="pins" />

    <!-- Empty State -->
    <EmptyState
      v-else-if="!isLoading && pins.length === 0"
      :title="emptyStateConfig.title"
      :message="emptyStateConfig.message"
      :icon="emptyStateConfig.icon"
      variant="default"
    />

    <!-- Load More Trigger -->
    <div v-if="hasMore && pins.length > 0" class="flex justify-center py-8">
      <BaseLoader v-if="isLoading" variant="spinner" size="md" />
    </div>
  </div>
</template>
