<!-- src/components/features/comments/CommentLikesPopover.vue -->
<script setup lang="ts">
/**
 * CommentLikesPopover - Popover со списком лайкнувших
 * Гибрид: useCommentLikes + useInfiniteScroll + стиль старого проекта
 */

import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useCommentLikes } from '@/composables/api/useCommentLikes'
import { useInfiniteScroll } from '@/composables/utils/useIntersectionObserver'

export interface CommentLikesPopoverProps {
  commentId: string
  maxUsers?: number
}

const props = withDefaults(defineProps<CommentLikesPopoverProps>(), {
  maxUsers: 5,
})

// ✅ useCommentLikes для загрузки данных
const { users, isLoading, hasMore, loadMore } = useCommentLikes(props.commentId, {
  pageSize: props.maxUsers,
  immediate: true,
})

// ✅ useInfiniteScroll для подгрузки
const triggerRef = ref<HTMLElement | null>(null)

const { isLoading: isLoadingMore } = useInfiniteScroll(triggerRef, loadMore, {
  disabled: computed(() => !hasMore.value || isLoading.value),
  distance: 20,
})
</script>

<template>
  <!-- ✅ Стиль контейнера из старого CommentLikesPopover.vue -->
  <div
    class="z-50 flex flex-col gap-2 bg-black shadow-2xl rounded-3xl text-sm text-white h-auto max-h-60 w-60 overflow-y-auto py-2"
  >
    <!-- ✅ User item (структура из старого проекта) -->
    <RouterLink
      v-for="user in users"
      :key="user.id"
      :to="`/user/${user.username}`"
      class="ml-2 flex items-center space-x-2 hover:underline cursor-pointer"
    >
      <img
        v-if="user.avatarBlobUrl"
        :src="user.avatarBlobUrl"
        alt="User Image"
        class="w-10 h-10 rounded-full object-cover"
      />
      <div
        v-else
        class="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-white font-bold"
      >
        {{ user.username.charAt(0).toUpperCase() }}
      </div>
      <span class="truncate">{{ user.username }}</span>
    </RouterLink>

    <!-- Infinite scroll trigger -->
    <div ref="triggerRef" class="h-2 shrink-0" />

    <!-- Loading -->
    <div v-if="isLoading || isLoadingMore" class="flex justify-center py-2">
      <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
    </div>

    <!-- Empty state -->
    <div
      v-if="!isLoading && !isLoadingMore && users.length === 0"
      class="text-center py-4 text-gray-400 text-sm"
    >
      No likes yet
    </div>
  </div>
</template>
