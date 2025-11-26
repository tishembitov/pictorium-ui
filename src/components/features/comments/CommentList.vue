<!-- src/components/features/comments/CommentList.vue -->
<script setup lang="ts">
/**
 * CommentList - Список комментариев
 * Гибрид: BaseSkeleton + стиль старого проекта
 */

import { ref, watch, onMounted, computed } from 'vue'
import type { CommentWithBlob } from '@/types'
import { useUserStore } from '@/stores/user.store'
import CommentItem from './CommentItem.vue'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'
import BaseLoader from '@/components/ui/BaseLoader.vue'

export interface CommentListProps {
  comments: CommentWithBlob[]
  isLoading?: boolean
  isInitialLoad?: boolean
}

const props = withDefaults(defineProps<CommentListProps>(), {
  isLoading: false,
  isInitialLoad: false,
})

const emit = defineEmits<{
  (e: 'loadMore'): void
  (e: 'commentDeleted', commentId: string): void
  (e: 'replyAdded', commentId: string): void
}>()

const userStore = useUserStore()

// User data cache
const userDataCache = ref(new Map<string, { username: string; image: string | null }>())

// ✅ BaseSkeleton при initial load
const showSkeleton = computed(
  () => props.isInitialLoad && props.isLoading && props.comments.length === 0,
)

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
  const userIds = [...new Set(props.comments.map((c) => c.userId))]
  await Promise.all(userIds.map(loadUserData))
}

function getUserData(userId: string) {
  return userDataCache.value.get(userId) || { username: 'Loading...', image: null }
}

function handleScroll(event: Event) {
  const container = event.target as HTMLElement
  if (container.scrollTop + container.clientHeight >= container.scrollHeight - 10) {
    emit('loadMore')
  }
}

watch(
  () => props.comments,
  () => {
    loadAllUserData()
  },
  { deep: true },
)

onMounted(() => {
  loadAllUserData()
})
</script>

<template>
  <div @scroll="handleScroll" class="flex flex-col gap-1 overflow-y-auto">
    <!-- ✅ BaseSkeleton для initial load -->
    <div v-if="showSkeleton" class="p-3 space-y-4">
      <div v-for="i in 3" :key="i" class="flex items-start gap-3">
        <BaseSkeleton variant="circular" :width="40" :height="40" />
        <div class="flex-1 space-y-2">
          <BaseSkeleton variant="text" width="25%" height="1rem" />
          <BaseSkeleton variant="text" width="70%" height="0.875rem" />
          <BaseSkeleton variant="rounded" :width="128" :height="128" class="mt-2" />
        </div>
      </div>
    </div>

    <!-- Comments list -->
    <template v-else>
      <CommentItem
        v-for="comment in comments"
        :key="comment.id"
        :comment="comment"
        :username="getUserData(comment.userId).username"
        :user-image="getUserData(comment.userId).image"
        @deleted="emit('commentDeleted', $event)"
        @reply-added="emit('replyAdded', $event)"
      />

      <!-- ✅ Colorful loader для load more -->
      <div v-if="isLoading && comments.length > 0" class="flex justify-center py-4">
        <BaseLoader variant="colorful" size="md" :fullscreen="false" />
      </div>
    </template>
  </div>
</template>
