<!-- src/components/pin/likes/PinLikesPopover.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { usePinLikes } from '@/composables/api/usePinLikes'
import LikeUserItem from './LikeUserItem.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'

export interface PinLikesPopoverProps {
  pinId: string
  maxUsers?: number
}

const props = withDefaults(defineProps<PinLikesPopoverProps>(), {
  maxUsers: 5,
})

// Composable для загрузки лайков
const { users, isLoading, hasMore, fetch, loadMore } = usePinLikes(props.pinId, {
  pageSize: props.maxUsers,
  immediate: true,
})

// Scroll container ref
const scrollContainer = ref<HTMLElement | null>(null)

// Handle scroll for infinite loading
function handleScroll(event: Event) {
  const container = event.target as HTMLElement
  const isNearBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 10

  if (isNearBottom && hasMore.value && !isLoading.value) {
    loadMore()
  }
}
</script>

<template>
  <div
    ref="scrollContainer"
    @scroll="handleScroll"
    class="flex flex-col gap-2 bg-black shadow-2xl h-auto max-h-60 text-sm rounded-3xl text-white z-50 w-60 overflow-y-auto py-2"
  >
    <!-- Loading state -->
    <div v-if="isLoading && users.length === 0" class="flex justify-center py-4">
      <BaseSpinner size="sm" color="white" />
    </div>

    <!-- Users list -->
    <LikeUserItem
      v-for="user in users"
      :key="user.id"
      :user="user"
      :avatar-url="user.avatarBlobUrl"
      size="sm"
      class="text-white"
    />

    <!-- Loading more indicator -->
    <div v-if="isLoading && users.length > 0" class="flex justify-center py-2">
      <BaseSpinner size="sm" color="white" />
    </div>

    <!-- Empty state -->
    <div v-if="!isLoading && users.length === 0" class="text-center py-4 text-gray-400 text-sm">
      No likes yet
    </div>
  </div>
</template>
