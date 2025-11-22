<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import CommentActions from './CommentActions.vue'
import CommentInput from './CommentInput.vue'
import CommentReplies from './CommentReplies.vue'
import ErrorMessage from '@/components/common/ErrorMessage.vue'
import { useComments } from '@/composables/api/useComments'
import { useToast } from '@/composables/ui/useToast'
import { isImageUrl, isVideoUrl } from '@/utils/helpers'
import type { Comment } from '@/types'

export interface CommentItemProps {
  comment: Comment
  canDelete?: boolean
  isReply?: boolean // ← ДОБАВЛЕНО для унификации
}

const props = withDefaults(defineProps<CommentItemProps>(), {
  canDelete: false,
  isReply: false, // ← ДОБАВЛЕНО
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

// Computed - ИСПРАВЛЕНИЕ: используем utils
const isImage = computed(() => {
  return props.comment.imageUrl ? isImageUrl(props.comment.imageUrl) : false
})

const isVideo = computed(() => {
  return props.comment.imageUrl ? isVideoUrl(props.comment.imageUrl) : false
})

// Стили в зависимости от типа (комментарий или ответ)
const marginLeft = computed(() => (props.isReply ? 'ml-10' : 'ml-12'))
const avatarSize = computed(() => (props.isReply ? 'sm' : 'md'))
const mediaSize = computed(() => (props.isReply ? 'h-24 w-24' : 'h-32 w-32'))
const showReplyButton = computed(() => !props.isReply)

const hasReplyContent = computed(
  () => replyContent.value.trim() !== '' || replyMediaFile.value !== null,
)

// Handlers
const handleReply = () => {
  if (!showReplyButton.value) return
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
      <UserAvatar :user="{ id: comment.userId, username: comment.userId }" :size="avatarSize" />
      <span :class="['font-bold', isReply ? 'text-sm' : 'text-base']">{{ comment.userId }}</span>
    </RouterLink>

    <!-- Content -->
    <p
      v-if="comment.content"
      :class="['font-medium mr-12 text-wrap break-words mt-1', marginLeft, isReply && 'text-sm']"
    >
      {{ comment.content }}
    </p>

    <!-- Media -->
    <div v-if="comment.imageUrl" :class="['flex flex-row mt-2', marginLeft]">
      <img
        v-if="isImage"
        :src="comment.imageUrl"
        alt="Comment media"
        :class="['object-cover rounded-lg', mediaSize]"
      />
      <video
        v-if="isVideo"
        :src="comment.imageUrl"
        :class="['object-cover rounded-lg', mediaSize]"
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
      :showReply="showReplyButton"
      @reply="handleReply"
      @delete="handleDelete"
    />

    <!-- Reply Input (только для главных комментариев) -->
    <div v-if="showReplyInput && !isReply" :class="['mt-2', marginLeft]">
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

    <!-- Replies toggle (только для главных комментариев) -->
    <div
      v-if="comment.replyCount > 0 && !isReply"
      @click="toggleReplies"
      :class="[
        'text-gray-700 text-sm mt-4 italic cursor-pointer mb-2 flex items-center justify-between',
        marginLeft,
      ]"
    >
      <h1 v-if="!showReplies">⎯⎯ View {{ comment.replyCount }} replies</h1>
      <h1 v-else>⎯⎯ Hide replies</h1>

      <span class="transition-transform duration-300 mr-5" :class="{ 'rotate-180': showReplies }">
        <i class="pi pi-angle-down text-sm"></i>
      </span>
    </div>

    <!-- Replies (только для главных комментариев) -->
    <div v-if="comment.replyCount > 0 && !isReply" :class="marginLeft">
      <CommentReplies :commentId="comment.id" v-model="showReplies" />
    </div>
  </div>
</template>
