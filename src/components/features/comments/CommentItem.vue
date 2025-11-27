<!-- src/components/features/comments/CommentItem.vue -->
<script setup lang="ts">
/**
 * CommentItem - Один комментарий
 * ✅ ИСПРАВЛЕНО: getter для composable
 */

import { ref, computed, nextTick, watch } from 'vue'
import { RouterLink } from 'vue-router'
import type { CommentWithBlob } from '@/types'
import { useCommentThread } from '@/composables/api/useCommentThread'
import { useToast } from '@/composables/ui/useToast'
import { isVideoUrl } from '@/utils/media'
import ImagePreview from '@/components/ui/ImagePreview.vue'
import MediaErrorDialog from '@/components/ui/MediaErrorDialog.vue'
import BaseLoader from '@/components/ui/BaseLoader.vue'
import CommentActions from './CommentActions.vue'
import CommentInput from './CommentInput.vue'
import CommentReplies from './CommentReplies.vue'

export interface CommentItemProps {
  comment: CommentWithBlob
  userImage?: string | null
  username?: string
}

const props = defineProps<CommentItemProps>()

const emit = defineEmits<{
  (e: 'deleted', commentId: string): void
  (e: 'replyAdded', commentId: string): void
}>()

// ✅ ИСПРАВЛЕНО: getter для реактивности
const { addReply, deleteComment } = useCommentThread(() => props.comment.id)
const { error: showError, success } = useToast()

// State
const showReply = ref(false)
const showReplies = ref(props.comment.replyCount > 0)
const isSubmitting = ref(false)
const localReplyCount = ref(props.comment.replyCount)

// Для MediaErrorDialog и ImagePreview
const showMediaError = ref(false)
const showImagePreview = ref(false)

watch(
  () => props.comment.replyCount,
  (val) => {
    localReplyCount.value = val
  },
)

// isVideoUrl из utils/media
const isVideo = computed(() => {
  if (!props.comment.imageUrl) return false
  return isVideoUrl(props.comment.imageUrl)
})

const isImage = computed(() => props.comment.imageBlobUrl && !isVideo.value)

// Methods
async function handleSubmitReply(content: string, file: File | null) {
  if (!content.trim() && !file) return

  isSubmitting.value = true

  try {
    await addReply(content.trim() || undefined, file || undefined)

    localReplyCount.value += 1

    showReplies.value = false
    await nextTick()
    showReplies.value = true
    showReply.value = false

    emit('replyAdded', props.comment.id)
  } catch (err: any) {
    if (err?.response?.status === 415) {
      showMediaError.value = true
    } else {
      showError('Failed to add reply')
    }
  } finally {
    isSubmitting.value = false
  }
}

function handleMediaError(message: string) {
  showMediaError.value = true
}

function handleCancelReply() {
  showReply.value = false
}

async function handleDelete() {
  try {
    await deleteComment()
    success('Comment deleted')
    emit('deleted', props.comment.id)
  } catch (err) {
    showError('Failed to delete comment')
  }
}

function toggleReplies() {
  showReplies.value = !showReplies.value
}

function openImagePreview() {
  if (isImage.value && props.comment.imageBlobUrl) {
    showImagePreview.value = true
  }
}
</script>

<template>
  <div class="flex flex-col">
    <!-- MediaErrorDialog -->
    <MediaErrorDialog v-model="showMediaError" />

    <!-- ImagePreview -->
    <ImagePreview
      v-if="comment.imageBlobUrl && isImage"
      v-model="showImagePreview"
      :src="comment.imageBlobUrl"
      alt="Comment image"
    />

    <!-- User info -->
    <RouterLink
      :to="`/user/${username}`"
      class="flex items-center space-x-2 hover:underline cursor-pointer"
    >
      <img
        v-if="userImage"
        :src="userImage"
        alt="User Image"
        class="w-10 h-10 rounded-full object-cover"
      />
      <div
        v-else
        class="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold"
      >
        {{ username?.charAt(0).toUpperCase() || '?' }}
      </div>
      <span class="font-bold">{{ username }}</span>
    </RouterLink>

    <span v-if="comment.content" class="font-medium ml-12 mr-12 text-wrap truncate">
      {{ comment.content }}
    </span>

    <!-- Media -->
    <div v-if="comment.imageBlobUrl" class="flex flex-row ml-12">
      <img
        v-if="isImage"
        :src="comment.imageBlobUrl"
        alt="comment image"
        class="h-32 w-32 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
        @click="openImagePreview"
      />
      <video
        v-if="isVideo"
        :src="comment.imageBlobUrl"
        alt="comment video"
        class="h-32 w-32 object-cover rounded-lg"
        autoplay
        loop
        muted
      />
    </div>

    <!-- Reply Input -->
    <div v-if="showReply && !isSubmitting" class="flex items-center space-x-2 ml-12 mr-4 mt-2">
      <i
        @click="handleCancelReply"
        class="pi pi-times text-xs cursor-pointer p-2 text-white bg-black rounded-full hover:bg-gray-800 transition"
      />
      <CommentInput
        placeholder="Add Reply"
        :loading="isSubmitting"
        @submit="handleSubmitReply"
        @media-error="handleMediaError"
      />
    </div>

    <!-- Loading -->
    <div v-if="isSubmitting" class="flex items-center space-x-2 ml-12 mr-4 mt-2 justify-center">
      <BaseLoader variant="colorful" size="md" :fullscreen="false" />
    </div>

    <!-- Actions -->
    <div class="flex items-center space-x-2 ml-12 mt-2">
      <CommentActions
        :comment-id="comment.id"
        :user-id="comment.userId"
        :is-liked="comment.isLiked"
        :like-count="comment.likeCount"
        :created-at="comment.createdAt"
        @reply="showReply = !showReply"
        @delete="handleDelete"
      />
    </div>

    <!-- Replies toggle -->
    <div
      v-if="localReplyCount > 0"
      class="ml-12 text-gray-700 text-sm mt-4 italic cursor-pointer mb-2 flex items-center justify-between"
      @click="toggleReplies"
    >
      <h1 v-if="!showReplies">⎯⎯ View {{ localReplyCount }} replies</h1>
      <h1 v-else>⎯⎯ Hide replies</h1>
      <span class="transition-transform duration-300 mr-5" :class="{ 'rotate-180': showReplies }">
        <i class="pi pi-angle-down text-sm" />
      </span>
    </div>

    <div v-if="showReplies" class="ml-12">
      <CommentReplies
        :comment-id="comment.id"
        @reply-deleted="localReplyCount = Math.max(0, localReplyCount - 1)"
      />
    </div>
  </div>
</template>
