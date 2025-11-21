<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import CommentReplyItem from './CommentReplyItem.vue'
import { useCommentReplies } from '@/composables/api/useComments'
import { useIntersectionObserver } from '@/composables/utils'
import { useAuthStore } from '@/stores/auth.store'

export interface CommentRepliesProps {
  commentId: string
  modelValue: boolean
}

const props = withDefaults(defineProps<CommentRepliesProps>(), {
  modelValue: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const authStore = useAuthStore()

const { replies, isLoading, hasMore, fetchReplies, loadMore } = useCommentReplies(props.commentId)

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

// Initial fetch when opened
watch(
  () => props.modelValue,
  async (isOpen) => {
    if (isOpen && replies.value.length === 0) {
      await fetchReplies()
    }
  },
  { immediate: true },
)

// Check if user can delete (admin or own comment)
const canDelete = (reply: any) => {
  return authStore.isAdmin || reply.userId === authStore.userId
}
</script>

<template>
  <div
    v-if="modelValue"
    class="flex flex-col gap-2 bg-gray-100 text-sm font-medium h-auto max-h-60 w-full overflow-y-auto border-2 border-gray-300 rounded-3xl p-2"
  >
    <!-- Loading initial -->
    <div v-if="isLoading && replies.length === 0" class="flex justify-center py-4">
      <BaseSpinner size="md" color="red" />
    </div>

    <!-- Replies list -->
    <div v-else-if="replies.length > 0" class="space-y-3">
      <CommentReplyItem
        v-for="reply in replies"
        :key="reply.id"
        :reply="reply"
        :canDelete="canDelete(reply)"
      />

      <!-- Load more trigger -->
      <div v-if="hasMore" ref="loadMoreRef" class="flex justify-center py-2">
        <BaseSpinner size="sm" color="red" />
      </div>

      <!-- End of list -->
      <div v-else class="text-center text-gray-500 text-xs py-2">No more replies</div>
    </div>

    <!-- Empty state -->
    <EmptyState v-else title="No replies yet" variant="minimal" icon="pi-comments" />
  </div>
</template>
