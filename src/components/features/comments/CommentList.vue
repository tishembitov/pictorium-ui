<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import CommentItem from './CommentItem.vue'
import { useComments } from '@/composables/api/useComments'
import { useIntersectionObserver } from '@/composables/utils'
import { useAuthStore } from '@/stores/auth.store'
import { useConfirm } from '@/composables/ui/useConfirm'
import { useToast } from '@/composables/ui/useToast'
import type { Comment } from '@/types'

export interface CommentListProps {
  pinId: string
  maxHeight?: string
}

const props = withDefaults(defineProps<CommentListProps>(), {
  maxHeight: '24rem', // max-h-96
})

const emit = defineEmits<{
  (e: 'commentsLoaded', count: number): void
}>()

const authStore = useAuthStore()
const { confirm } = useConfirm()
const { showToast } = useToast()

const {
  comments,
  isLoading,
  hasMore,
  currentPage,
  totalElements,
  fetchComments,
  deleteComment,
  loadMore,
} = useComments()

// Load more trigger
const loadMoreRef = ref<HTMLElement | null>(null)

const { isIntersecting } = useIntersectionObserver(loadMoreRef, {
  threshold: 0.1,
})

watch(isIntersecting, (intersecting) => {
  if (intersecting && hasMore.value && !isLoading.value) {
    loadMore()
  }
})

// Initial load
const loadInitial = async () => {
  try {
    await fetchComments(props.pinId, 0, 10)
    emit('commentsLoaded', totalElements.value)
  } catch (error) {
    console.error('[CommentList] Load failed:', error)
  }
}

// Load on mount
onMounted(() => {
  loadInitial()
})

// Check if user can delete
const canDelete = (comment: Comment) => {
  return authStore.isAdmin || comment.userId === authStore.userId
}

// Handle delete
const handleDelete = async (commentId: string) => {
  const confirmed = await confirm({
    title: 'Delete Comment',
    message: 'Are you sure you want to delete this comment? This action cannot be undone.',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    type: 'danger',
  })

  if (!confirmed) return

  try {
    await deleteComment(commentId)
    showToast('Comment deleted', 'success')
    emit('commentsLoaded', totalElements.value)
  } catch (error) {
    console.error('[CommentList] Delete failed:', error)
    showToast('Failed to delete comment', 'error')
  }
}
</script>

<template>
  <div
    class="flex flex-col gap-3 bg-gray-100 text-sm font-medium text-black overflow-y-auto border-2 border-gray-300 rounded-3xl p-4"
    :style="{ maxHeight }"
  >
    <!-- Loading skeleton (initial) -->
    <div v-if="isLoading && comments.length === 0" class="space-y-4">
      <div v-for="i in 3" :key="i" class="flex flex-col gap-2">
        <div class="flex items-center gap-2">
          <BaseSkeleton variant="circular" width="40px" height="40px" />
          <BaseSkeleton width="120px" height="16px" />
        </div>
        <BaseSkeleton width="80%" height="14px" class="ml-12" />
        <BaseSkeleton width="60%" height="14px" class="ml-12" />
      </div>
    </div>

    <!-- Comments list -->
    <div v-else-if="comments.length > 0" class="space-y-4">
      <CommentItem
        v-for="comment in comments"
        :key="comment.id"
        :comment="comment"
        :canDelete="canDelete(comment)"
        @deleted="handleDelete"
      />

      <!-- Load more trigger -->
      <div v-if="hasMore" ref="loadMoreRef" class="flex justify-center py-4">
        <BaseSpinner size="md" color="red" />
      </div>

      <!-- End of list -->
      <div v-else-if="comments.length > 0" class="text-center text-gray-500 text-sm py-2">
        No more comments
      </div>
    </div>

    <!-- Empty state -->
    <EmptyState
      v-else
      title="No comments yet"
      message="Be the first to share your thoughts!"
      icon="pi-comments"
      variant="minimal"
    />
  </div>
</template>

<style scoped>
/* Custom scrollbar */
.overflow-y-auto::-webkit-scrollbar {
  width: 8px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
