<script setup lang="ts">
import { ref } from 'vue'
import { useDateFormat } from '@/composables/utils'
import CommentLikesPopover from './CommentLikesPopover.vue'
import { useLikes } from '@/composables/api/useLikes'

export interface CommentActionsProps {
  commentId: string
  createdAt: string
  isLiked: boolean
  likeCount: number
  canDelete?: boolean
  showReply?: boolean
}

const props = withDefaults(defineProps<CommentActionsProps>(), {
  canDelete: false,
  showReply: true,
})

const emit = defineEmits<{
  (e: 'like'): void
  (e: 'unlike'): void
  (e: 'reply'): void
  (e: 'delete'): void
}>()

const { likeCommentAction, unlikeCommentAction } = useLikes()
const { relative: timeAgo } = useDateFormat(props.createdAt)

// Local state
const isLikedLocal = ref(props.isLiked)
const likeCountLocal = ref(props.likeCount)
const isLoading = ref(false)

// Popover
const showPopover = ref(false)
const insidePopover = ref(false)

// Like animation
const showLikeAnimation = ref(false)
const showDislikeAnimation = ref(false)

const handleLike = async () => {
  if (isLoading.value) return

  isLoading.value = true

  try {
    if (isLikedLocal.value) {
      // Unlike
      await unlikeCommentAction(props.commentId)
      showDislikeAnimation.value = true
      showLikeAnimation.value = false
      isLikedLocal.value = false
      likeCountLocal.value = Math.max(0, likeCountLocal.value - 1)
      emit('unlike')
    } else {
      // Like
      await likeCommentAction(props.commentId)
      showLikeAnimation.value = true
      showDislikeAnimation.value = false
      isLikedLocal.value = true
      likeCountLocal.value += 1
      emit('like')
    }

    // Reset animation after 500ms
    setTimeout(() => {
      showLikeAnimation.value = false
      showDislikeAnimation.value = false
    }, 500)
  } catch (error) {
    console.error('[CommentActions] Like failed:', error)
    // Revert
    isLikedLocal.value = props.isLiked
    likeCountLocal.value = props.likeCount
  } finally {
    isLoading.value = false
  }
}

const handleMouseEnter = () => {
  if (likeCountLocal.value > 0) {
    showPopover.value = true
  }
}

const handleMouseLeave = () => {
  if (!insidePopover.value) {
    showPopover.value = false
  }
}
</script>

<template>
  <div class="flex items-center gap-2 ml-12 mt-2 text-sm text-gray-600 relative">
    <!-- Timestamp -->
    <span class="font-medium">{{ timeAgo }}</span>

    <!-- Reply button -->
    <button
      v-if="showReply"
      @click="emit('reply')"
      class="hover:underline hover:text-rose-400 cursor-pointer transition"
    >
      Reply
    </button>

    <!-- Like button -->
    <div class="flex items-center gap-2 relative">
      <!-- Heart icon animation container -->
      <div class="relative">
        <Transition name="flash2">
          <i
            v-if="showDislikeAnimation"
            class="pi pi-heart text-3xl text-white glowing-icon absolute top-[-10px] left-[-10px] opacity-0"
          ></i>
        </Transition>
        <Transition name="flash2">
          <i
            v-if="showLikeAnimation"
            class="pi pi-heart-fill text-3xl text-white glowing-icon absolute top-[-10px] left-[-10px] opacity-0"
          ></i>
        </Transition>
      </div>

      <!-- Heart button -->
      <button
        @click="handleLike"
        :disabled="isLoading"
        class="transition-transform duration-200 transform hover:scale-150"
      >
        <i
          :class="[
            'pi',
            isLikedLocal ? 'pi-heart-fill text-red-600' : 'pi-heart text-red-600',
            'text-base cursor-pointer',
          ]"
        ></i>
      </button>

      <!-- Like count with popover -->
      <div
        v-if="likeCountLocal > 0"
        @mouseenter="handleMouseEnter"
        @mouseleave="handleMouseLeave"
        class="font-medium text-base relative cursor-pointer"
      >
        <span>{{ likeCountLocal }}</span>

        <!-- Popover -->
        <CommentLikesPopover
          v-if="showPopover"
          :commentId="commentId"
          v-model="showPopover"
          @mouseenter="insidePopover = true"
          @mouseleave="
            () => {
              insidePopover = false
              showPopover = false
            }
          "
        >
          <template #trigger>
            <span></span>
          </template>
        </CommentLikesPopover>
      </div>
    </div>

    <!-- Delete button -->
    <button
      v-if="canDelete"
      @click="emit('delete')"
      class="hover:underline hover:text-rose-400 cursor-pointer transition"
    >
      Delete
    </button>
  </div>
</template>

<style scoped>
.flash2-enter-active,
.flash2-leave-active {
  transition:
    opacity 0.5s ease-out,
    transform 0.5s cubic-bezier(0.3, 0.8, 0.2, 1);
}

.flash2-enter-from,
.flash2-leave-to {
  opacity: 0;
  transform: scale(3);
}

.flash2-enter-to,
.flash2-leave-from {
  opacity: 1;
  transform: scale(1);
}

.glowing-icon {
  text-shadow:
    0 0 15px rgba(255, 0, 0, 0.7),
    0 0 25px rgba(255, 0, 0, 0.6),
    0 0 35px rgba(255, 0, 0, 0.5);
}
</style>
