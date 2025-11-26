<!-- src/components/features/comments/CommentReplies.vue -->
<script setup lang="ts">
/**
 * CommentReplies - Контейнер ответов
 * Гибрид: composables + BaseSkeleton + стиль старого проекта
 */

import { ref, computed, onMounted, watch } from 'vue'
import { useCommentThread } from '@/composables/api/useCommentThread'
import { useInfiniteScroll } from '@/composables/utils/useIntersectionObserver'
import { useUserStore } from '@/stores/user.store'
import CommentReplyItem from './CommentReplyItem.vue'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'
import BaseLoader from '@/components/ui/BaseLoader.vue'

export interface CommentRepliesProps {
  commentId: string
}

const props = defineProps<CommentRepliesProps>()

const emit = defineEmits<(e: 'replyDeleted', commentId: string) => void>()

// ✅ Composables
const { replies, hasMoreReplies, isLoadingReplies, fetchReplies, loadMoreReplies, deleteComment } =
  useCommentThread(props.commentId)

const userStore = useUserStore()

// Refs
const triggerRef = ref<HTMLElement | null>(null)
const isInitialLoad = ref(true)

// ✅ useInfiniteScroll
const { isLoading: isLoadingMore } = useInfiniteScroll(triggerRef, loadMoreReplies, {
  disabled: computed(() => !hasMoreReplies.value || isLoadingReplies.value),
  distance: 50,
})

// User data cache
const userDataCache = ref(new Map<string, { username: string; image: string | null }>())

async function loadUserData(userId: string) {
  if (userDataCache.value.has(userId)) return

  try {
    const user = await userStore.loadUserById(userId)
    const avatarUrl = userStore.getAvatarUrl(userId)
    userDataCache.value.set(userId, { username: user.username, image: avatarUrl || null })
  } catch (error) {
    userDataCache.value.set(userId, { username: 'Unknown', image: null })
  }
}

async function loadAllUserData() {
  const userIds = [...new Set(replies.value.map((r) => r.userId))]
  await Promise.all(userIds.map(loadUserData))
}

function getUserData(userId: string) {
  return userDataCache.value.get(userId) || { username: 'Loading...', image: null }
}

async function handleDelete(replyId: string) {
  try {
    await deleteComment()
    emit('replyDeleted', replyId)
  } catch (error) {
    console.error('[CommentReplies] Failed to delete reply:', error)
  }
}

watch(
  replies,
  () => {
    loadAllUserData()
  },
  { deep: true },
)

onMounted(async () => {
  await fetchReplies(0)
  await loadAllUserData()
  isInitialLoad.value = false
})
</script>

<template>
  <!-- ✅ Контейнер из старого ReplyCommentSection.vue -->
  <div
    class="flex flex-col gap-1 bg-gray-100 text-sm font-medium z-30 h-auto max-h-60 w-full overflow-y-auto border-2 border-gray-300 rounded-3xl"
  >
    <!-- ✅ BaseSkeleton для initial load -->
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
        :username="getUserData(reply.userId).username"
        :user-image="getUserData(reply.userId).image"
        @delete="handleDelete"
      />

      <div ref="triggerRef" class="h-4 shrink-0" />

      <!-- ✅ Colorful loader для load more -->
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
