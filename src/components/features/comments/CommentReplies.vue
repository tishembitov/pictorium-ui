<!-- src/components/features/comments/CommentReplies.vue -->
<script setup lang="ts">
/**
 * CommentReplies - Контейнер ответов
 * ✅ ИСПРАВЛЕНО: getter для composable + useUsersWithAvatars
 */

import { ref, computed, onMounted, watch } from 'vue'
import { useCommentThread } from '@/composables/api/useCommentThread'
import { useUsersWithAvatars } from '@/composables/api/useUsersWithAvatars'
import { useInfiniteScroll } from '@/composables/utils/useIntersectionObserver'
import CommentReplyItem from './CommentReplyItem.vue'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'
import BaseLoader from '@/components/ui/BaseLoader.vue'

export interface CommentRepliesProps {
  commentId: string
}

const props = defineProps<CommentRepliesProps>()

const emit = defineEmits<(e: 'replyDeleted', commentId: string) => void>()

// ✅ ИСПРАВЛЕНО: getter для реактивности
const { replies, hasMoreReplies, isLoadingReplies, fetchReplies, loadMoreReplies, deleteComment } =
  useCommentThread(() => props.commentId)

// ✅ ИСПРАВЛЕНО: используем composable
const { loadUsers, getUser } = useUsersWithAvatars()

// Refs
const triggerRef = ref<HTMLElement | null>(null)
const isInitialLoad = ref(true)

// useInfiniteScroll
const { isLoading: isLoadingMore } = useInfiniteScroll(triggerRef, loadMoreReplies, {
  disabled: computed(() => !hasMoreReplies.value || isLoadingReplies.value),
  distance: 50,
})

// Загрузка пользователей
watch(
  replies,
  async (replyList) => {
    const userIds = [...new Set(replyList.map((r) => r.userId))]
    await loadUsers(userIds)
  },
  { deep: true },
)

async function handleDelete(replyId: string) {
  try {
    await deleteComment()
    emit('replyDeleted', replyId)
  } catch (error) {
    console.error('[CommentReplies] Failed to delete reply:', error)
  }
}

onMounted(async () => {
  await fetchReplies(0)
  const userIds = [...new Set(replies.value.map((r) => r.userId))]
  await loadUsers(userIds)
  isInitialLoad.value = false
})
</script>

<template>
  <div
    class="flex flex-col gap-1 bg-gray-100 text-sm font-medium z-30 h-auto max-h-60 w-full overflow-y-auto border-2 border-gray-300 rounded-3xl"
  >
    <!-- BaseSkeleton для initial load -->
    <div v-if="isInitialLoad && isLoadingReplies" class="p-3 space-y-3">
      <div v-for="i in 3" :key="i" class="flex items-start gap-3">
        <BaseSkeleton variant="circular" :width="40" :height="40" />
        <div class="flex-1 space-y-2">
          <BaseSkeleton variant="text" width="30%" height="1rem" />
          <BaseSkeleton variant="text" width="80%" height="0.875rem" />
        </div>
      </div>
    </div>

    <!-- Replies list -->
    <template v-else>
      <CommentReplyItem
        v-for="reply in replies"
        :key="reply.id"
        :reply="reply"
        :username="getUser(reply.userId).username"
        :user-image="getUser(reply.userId).image"
        @delete="handleDelete"
      />

      <div ref="triggerRef" class="h-4 shrink-0" />

      <!-- Colorful loader для load more -->
      <div v-if="isLoadingMore" class="flex justify-center py-4">
        <BaseLoader variant="colorful" size="sm" :fullscreen="false" />
      </div>

      <div
        v-if="!isLoadingReplies && !isLoadingMore && replies.length === 0"
        class="text-center py-4 text-gray-500"
      >
        No replies yet
      </div>
    </template>
  </div>
</template>
