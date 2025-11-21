<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import CommentList from './CommentList.vue'
import CommentInput from './CommentInput.vue'
import ErrorMessage from '@/components/common/ErrorMessage.vue'
import { useComments } from '@/composables/api/useComments'
import { useToast } from '@/composables/ui/useToast'

export interface PinCommentsProps {
  pinId: string
  commentCount: number
  autoExpand?: boolean
  showTitle?: boolean
  maxHeight?: string
}

const props = withDefaults(defineProps<PinCommentsProps>(), {
  autoExpand: false,
  showTitle: true,
  maxHeight: '24rem',
})

const emit = defineEmits<{
  (e: 'commentAdded'): void
  (e: 'commentsCountChanged', count: number): void
}>()

const { createComment } = useComments()
const { showToast } = useToast()

// State
const isExpanded = ref(props.autoExpand || props.commentCount > 0)
const commentContent = ref('')
const mediaFile = ref<File | null>(null)
const isSubmitting = ref(false)
const submitError = ref<string | null>(null)
const localCommentCount = ref(props.commentCount)

// Computed
const hasContent = computed(() => commentContent.value.trim() !== '' || mediaFile.value !== null)

const titleText = computed(() => {
  if (localCommentCount.value === 0) return 'Your opinion?'
  return `${localCommentCount.value} Comment${localCommentCount.value === 1 ? '' : 's'}`
})

// Watch comment count prop
watch(
  () => props.commentCount,
  (newCount) => {
    localCommentCount.value = newCount
  },
)

// Handlers
const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}

const handleSubmit = async () => {
  if (!hasContent.value || isSubmitting.value) return

  try {
    isSubmitting.value = true
    submitError.value = null

    // Create comment
    await createComment(props.pinId, {
      content: commentContent.value.trim() || undefined,
      imageUrl: mediaFile.value ? 'temp' : undefined,
    })

    // Success
    showToast('Comment added!', 'success')
    commentContent.value = ''
    mediaFile.value = null
    localCommentCount.value += 1

    // Expand comments
    if (!isExpanded.value) {
      isExpanded.value = true
    }

    emit('commentAdded')
    emit('commentsCountChanged', localCommentCount.value)
  } catch (error) {
    console.error('[PinComments] Submit failed:', error)
    submitError.value = 'Failed to add comment. Please try again.'
    showToast('Failed to add comment', 'error')
  } finally {
    isSubmitting.value = false
  }
}

const handleCancel = () => {
  commentContent.value = ''
  mediaFile.value = null
  submitError.value = null
}

const handleMediaChange = (file: File | null) => {
  mediaFile.value = file
}

const handleMediaError = (errors: string[]) => {
  showToast(errors[0] || 'Invalid file', 'error')
}

const handleCommentsLoaded = (count: number) => {
  localCommentCount.value = count
  emit('commentsCountChanged', count)
}
</script>

<template>
  <div class="w-full">
    <!-- Title / Toggle -->
    <div
      v-if="showTitle"
      @click="localCommentCount > 0 && toggleExpanded()"
      :class="[
        'mt-5 mb-2 flex items-center justify-between',
        localCommentCount > 0 && 'cursor-pointer',
      ]"
    >
      <h1 class="text-xl font-medium">{{ titleText }}</h1>

      <!-- Expand/Collapse icon -->
      <span
        v-if="localCommentCount > 0"
        class="transition-transform duration-300 mr-5"
        :class="{ 'rotate-180': isExpanded }"
      >
        <i class="pi pi-angle-down text-xl"></i>
      </span>
    </div>

    <!-- Comments List -->
    <CommentList
      v-if="isExpanded && localCommentCount > 0"
      :pinId="pinId"
      :maxHeight="maxHeight"
      @commentsLoaded="handleCommentsLoaded"
      class="mb-5"
    />

    <!-- Submit Error -->
    <ErrorMessage
      v-if="submitError"
      :error="submitError"
      variant="inline"
      :closable="true"
      @close="submitError = null"
      class="mb-3"
    />

    <!-- Comment Input -->
    <CommentInput
      v-model="commentContent"
      :placeholder="localCommentCount === 0 ? 'Be the first to comment...' : 'Add a comment...'"
      :loading="isSubmitting"
      :showMediaUpload="true"
      :showEmojiPicker="true"
      @submit="handleSubmit"
      @cancel="handleCancel"
      @mediaChange="handleMediaChange"
      @mediaError="handleMediaError"
    />
  </div>
</template>
