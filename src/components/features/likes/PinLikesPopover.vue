<!-- src/components/features/likes/PinLikesPopover.vue -->
<script setup lang="ts">
/**
 * PinLikesPopover - Popover со списком лайков
 * ✅ ИСПРАВЛЕНО: getter для composable + useInfiniteScroll
 */

import { ref, computed } from 'vue'
import { usePinLikes } from '@/composables/api/usePinLikes'
import { useInfiniteScroll } from '@/composables/utils/useIntersectionObserver'
import LikeUserItem from './LikeUserItem.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'

export interface PinLikesPopoverProps {
  pinId: string
  maxUsers?: number
}

const props = withDefaults(defineProps<PinLikesPopoverProps>(), {
  maxUsers: 5,
})

// ✅ ИСПРАВЛЕНО: getter для реактивности
const { users, isLoading, hasMore, loadMore } = usePinLikes(() => props.pinId, {
  pageSize: props.maxUsers,
  immediate: true,
})

// ✅ ИСПРАВЛЕНО: useInfiniteScroll вместо ручного scroll handler
const triggerRef = ref<HTMLElement | null>(null)

const { isLoading: isLoadingMore } = useInfiniteScroll(triggerRef, loadMore, {
  disabled: computed(() => !hasMore.value || isLoading.value),
  distance: 20,
})
</script>

<template>
  <div
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

    <!-- Infinite scroll trigger -->
    <div ref="triggerRef" class="h-2 shrink-0" />

    <!-- Loading more indicator -->
    <div v-if="isLoadingMore" class="flex justify-center py-2">
      <BaseSpinner size="sm" color="white" />
    </div>

    <!-- Empty state -->
    <div v-if="!isLoading && users.length === 0" class="text-center py-4 text-gray-400 text-sm">
      No likes yet
    </div>
  </div>
</template>
