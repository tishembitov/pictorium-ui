<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import CommentActions from './CommentActions.vue'
import CommentInput from './CommentInput.vue'
import CommentReplies from './CommentReplies.vue'
import ErrorMessage from '@/components/common/ErrorMessage.vue'
import { useComments } from '@/composables/api/useComments'
import { useToast } from '@/composables/ui/useToast'
import type { Comment } from '@/types'

export interface CommentItemProps {
  comment: Comment
  canDelete?: boolean
}

const props = withDefaults(defineProps<CommentItemProps>(), {
  canDelete: false,
})

const emit = defineEmits<{
  (e: 'deleted', commentId: string): void
}>()

const { createReply } = useComments()
const { showToast } = useToast()

// State
const showReplyInput = ref(false)
const showReplies = ref(props.comment.replyCount > 0)
const replyContent = ref('')
const replyMediaFile = ref<File | null>(null)
const isSubmitting = ref(false)
const submitError = ref<string | null>(null)

// Computed
const isImage = computed(() => {
  return props.comment.imageUrl && !props.comment.imageUrl.includes('.mp4')
})

const isVideo = computed(() => {
  return props.comment.imageUrl && props.comment.imageUrl.includes('.mp4')
})

const hasReplyContent = computed(
  () => replyContent.value.trim() !== '' || replyMediaFile.value !== null,
)

// Handlers
const handleReply = () => {
  showReplyInput.value = !showReplyInput.value
}

const handleCancelReply = () => {
  showReplyInput.value = false
  replyContent.value = ''
  replyMediaFile.value = null
  submitError.value = null
}

const handleSubmitReply = async () => {
  if (!hasReplyContent.value) return

  try {
    isSubmitting.value = true
    submitError.value = null

    await createReply(props.comment.id, {
      content: replyContent.value.trim() || undefined,
      imageUrl: replyMediaFile.value ? 'temp' : undefined,
    })

    // Success
    showToast('Reply added!', 'success')
    replyContent.value = ''
    replyMediaFile.value = null
    showReplyInput.value = false

    // Refresh replies
    showReplies.value = false
    await nextTick()
    showReplies.value = true
  } catch (error) {
    console.error('[CommentItem] Submit reply failed:', error)
    submitError.value = 'Failed to add reply. Please try again.'
  } finally {
    isSubmitting.value = false
  }
}

const handleMediaChange = (file: File | null) => {
  replyMediaFile.value = file
}

const handleMediaError = (errors: string[]) => {
  showToast(errors[0] || 'Invalid file', 'error')
}

const handleDelete = () => {
  emit('deleted', props.comment.id)
}

const toggleReplies = () => {
  showReplies.value = !showReplies.value
}
</script>

<template>
  <div class="flex flex-col">
    <!-- User info -->
    <RouterLink
      :to="`/user/${comment.userId}`"
      class="flex items-center gap-2 hover:underline cursor-pointer"
    >
      <UserAvatar :user="{ id: comment.userId, username: comment.userId }" size="md" />
      <span class="font-bold">{{ comment.userId }}</span>
    </RouterLink>

    <!-- Content -->
    <p v-if="comment.content" class="font-medium ml-12 mr-12 text-wrap break-words mt-1">
      {{ comment.content }}
    </p>

    <!-- Media -->
    <div v-if="comment.imageUrl" class="flex flex-row ml-12 mt-2">
      <img
        v-if="isImage"
        :src="comment.imageUrl"
        alt="Comment media"
        class="h-32 w-32 object-cover rounded-lg"
      />
      <video
        v-if="isVideo"
        :src="comment.imageUrl"
        class="h-32 w-32 object-cover rounded-lg"
        autoplay
        loop
        muted
      ></video>
    </div>

    <!-- Actions -->
    <CommentActions
      :commentId="comment.id"
      :createdAt="comment.createdAt"
      :isLiked="comment.isLiked"
      :likeCount="comment.likeCount"
      :canDelete="canDelete"
      :showReply="true"
      @reply="handleReply"
      @delete="handleDelete"
    />

    <!-- Reply Input -->
    <div v-if="showReplyInput" class="ml-12 mt-2">
      <ErrorMessage v-if="submitError" :error="submitError" variant="inline" :closable="true" />

      <CommentInput
        v-model="replyContent"
        placeholder="Add a reply..."
        :loading="isSubmitting"
        :showMediaUpload="true"
        :showEmojiPicker="true"
        @submit="handleSubmitReply"
        @cancel="handleCancelReply"
        @mediaChange="handleMediaChange"
        @mediaError="handleMediaError"
      />
    </div>

    <!-- Replies toggle -->
    <div
      v-if="comment.replyCount > 0"
      @click="toggleReplies"
      class="ml-12 text-gray-700 text-sm mt-4 italic cursor-pointer mb-2 flex items-center justify-between"
    >
      <h1 v-if="!showReplies">⎯⎯ View {{ comment.replyCount }} replies</h1>
      <h1 v-else>⎯⎯ Hide replies</h1>

      <span class="transition-transform duration-300 mr-5" :class="{ 'rotate-180': showReplies }">
        <i class="pi pi-angle-down text-sm"></i>
      </span>
    </div>

    <!-- Replies -->
    <div v-if="comment.replyCount > 0" class="ml-12">
      <CommentReplies :commentId="comment.id" v-model="showReplies" />
    </div>
  </div>
</template>
