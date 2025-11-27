<!-- src/components/features/comments/PinComments.vue -->
<script setup lang="ts">
/**
 * PinComments - Главный контейнер комментариев
 * ✅ ИСПРАВЛЕНО: getter для composable
 */

import { ref, onMounted, nextTick, watch } from 'vue'
import { usePinComments } from '@/composables/api/usePinComments'
import { useToast } from '@/composables/ui/useToast'
import CommentList from './CommentList.vue'
import CommentInput from './CommentInput.vue'
import MediaErrorDialog from '@/components/ui/MediaErrorDialog.vue'

export interface PinCommentsProps {
  pinId: string
  commentCount?: number
  accentColor?: string
}

const props = withDefaults(defineProps<PinCommentsProps>(), {
  commentCount: 0,
  accentColor: '#000',
})

const emit = defineEmits<(e: 'countChange', count: number) => void>()

// ✅ ИСПРАВЛЕНО: getter для реактивности
const { comments, hasMore, isLoading, fetch, loadMore, add } = usePinComments(() => props.pinId)
const { error: showError } = useToast()

// State
const showComments = ref(false)
const isSubmitting = ref(false)
const localCommentCount = ref(props.commentCount)
const isInitialLoad = ref(true)

// MediaErrorDialog
const showMediaError = ref(false)

// Initialize
if (props.commentCount > 0) {
  showComments.value = true
}

watch(
  () => props.commentCount,
  (val) => {
    localCommentCount.value = val
  },
)

// Methods
async function handleLoadMore() {
  if (!hasMore.value || isLoading.value) return
  await loadMore()
}

async function handleSubmitComment(content: string, file: File | null) {
  if (!content.trim() && !file) return

  isSubmitting.value = true

  try {
    await add(content.trim() || undefined, file || undefined)

    localCommentCount.value += 1
    emit('countChange', localCommentCount.value)

    showComments.value = false
    await nextTick()
    showComments.value = true
  } catch (err: any) {
    if (err?.response?.status === 415) {
      showMediaError.value = true
    } else {
      showError('Failed to add comment')
    }
  } finally {
    isSubmitting.value = false
  }
}

function handleMediaError(message: string) {
  showMediaError.value = true
}

function handleCommentDeleted(commentId: string) {
  localCommentCount.value = Math.max(0, localCommentCount.value - 1)
  emit('countChange', localCommentCount.value)
}

function toggleComments() {
  showComments.value = !showComments.value
}

onMounted(async () => {
  if (showComments.value) {
    await fetch(0)
    isInitialLoad.value = false
  }
})

watch(showComments, async (show) => {
  if (show && comments.value.length === 0) {
    await fetch(0)
    isInitialLoad.value = false
  }
})
</script>

<template>
  <div class="w-full">
    <!-- MediaErrorDialog -->
    <MediaErrorDialog v-model="showMediaError" />

    <!-- Comments Header -->
    <div
      v-if="localCommentCount > 0"
      class="mt-5 mb-2 flex items-center justify-between cursor-pointer"
      @click="toggleComments"
    >
      <h1 class="text-xl">{{ localCommentCount }} Comments</h1>
      <span class="transition-transform duration-300 mr-5" :class="{ 'rotate-180': showComments }">
        <i class="pi pi-angle-down text-xl" />
      </span>
    </div>

    <!-- No comments -->
    <div v-else class="mt-5 mb-1">
      <h1 class="text-md text-black ml-1">Your opinion?</h1>
    </div>

    <!-- Comments container -->
    <div
      v-if="showComments"
      class="flex flex-col gap-1 bg-gray-100 text-sm font-medium text-black h-auto max-h-96 w-full overflow-y-auto border-2 border-gray-300 rounded-3xl mb-5"
    >
      <CommentList
        :comments="comments"
        :is-loading="isLoading"
        :is-initial-load="isInitialLoad"
        @load-more="handleLoadMore"
        @comment-deleted="handleCommentDeleted"
      />
    </div>

    <!-- Comment Input -->
    <div class="flex items-center justify-center space-x-2 mb-4 mr-6 mt-2">
      <CommentInput
        placeholder="Add Comment"
        :loading="isSubmitting"
        :accent-color="accentColor"
        @submit="handleSubmitComment"
        @media-error="handleMediaError"
      />
    </div>
  </div>
</template>
