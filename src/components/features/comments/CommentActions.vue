<!-- src/components/features/comments/CommentActions.vue -->
<script setup lang="ts">
/**
 * CommentActions - Действия комментария
 * ✅ ИСПРАВЛЕНО: getter для composables, computed для useOwnership
 */

import { ref, computed, watch } from 'vue'
import { useCommentThread } from '@/composables/api/useCommentThread'
import { useOwnership } from '@/composables/auth/usePermissions'
import { formatRelativeTime } from '@/utils/dates'
import { formatCompactNumber } from '@/utils/formatters'
import CommentLikesPopover from './CommentLikesPopover.vue'

export interface CommentActionsProps {
  commentId: string
  userId: string
  isLiked: boolean
  likeCount: number
  createdAt: string
  showReplyButton?: boolean
  showDeleteButton?: boolean
}

const props = withDefaults(defineProps<CommentActionsProps>(), {
  showReplyButton: true,
  showDeleteButton: true,
})

const emit = defineEmits<{
  (e: 'reply'): void
  (e: 'delete'): void
  (e: 'likeChange', isLiked: boolean, count: number): void
}>()

// ✅ ИСПРАВЛЕНО: getter для реактивности
const { like, unlike } = useCommentThread(() => props.commentId)

// ✅ ИСПРАВЛЕНО: computed вместо ref
const { canDelete } = useOwnership(computed(() => props.userId))

// Local state
const localIsLiked = ref(props.isLiked)
const localLikeCount = ref(props.likeCount)
const isProcessing = ref(false)

// Анимации
const showLikeAnimation = ref(false)
const showDislikeAnimation = ref(false)

// Popover state
const showPopover = ref(false)
const insidePopover = ref(false)
const likesPopoverEl = ref<HTMLElement | null>(null)
const likesIsTop = ref(true)

// Sync with props
watch(
  () => props.isLiked,
  (val) => {
    localIsLiked.value = val
  },
)

watch(
  () => props.likeCount,
  (val) => {
    localLikeCount.value = val
  },
)

// Formatters
const formattedTime = computed(() => formatRelativeTime(props.createdAt))
const formattedLikeCount = computed(() => formatCompactNumber(localLikeCount.value))

// Methods
async function handleLike() {
  if (isProcessing.value) return

  const wasLiked = localIsLiked.value
  isProcessing.value = true

  // Optimistic update
  localIsLiked.value = !wasLiked
  localLikeCount.value += wasLiked ? -1 : 1

  // Анимация
  if (wasLiked) {
    showDislikeAnimation.value = true
    showLikeAnimation.value = false
  } else {
    showLikeAnimation.value = true
    showDislikeAnimation.value = false
  }

  setTimeout(() => {
    showLikeAnimation.value = false
    showDislikeAnimation.value = false
  }, 500)

  try {
    if (wasLiked) {
      await unlike()
    } else {
      await like()
    }
    emit('likeChange', localIsLiked.value, localLikeCount.value)
  } catch (error) {
    // Rollback
    localIsLiked.value = wasLiked
    localLikeCount.value += wasLiked ? 1 : -1
    console.error('[CommentActions] Like failed:', error)
  } finally {
    isProcessing.value = false
  }
}

function loadLikesPopover() {
  if (likesPopoverEl.value) {
    const rect = likesPopoverEl.value.getBoundingClientRect()
    const distanceToBottom = window.innerHeight - rect.bottom
    likesIsTop.value = distanceToBottom >= 250
  }
}

function handleMouseLeave() {
  if (!insidePopover.value) {
    showPopover.value = false
  }
}

function handleLikesMouseOver() {
  loadLikesPopover()
  showPopover.value = true
}

function handlePopoverMouseLeave() {
  insidePopover.value = false
  showPopover.value = false
}
</script>

<template>
  <div class="flex items-center space-x-2 relative">
    <!-- Animation overlay -->
    <div class="absolute top-[-20px] left-10 pointer-events-none">
      <Transition name="flash2">
        <i
          v-if="showDislikeAnimation"
          class="pi pi-heart text-5xl text-white glowing-icon"
          aria-hidden="true"
        />
      </Transition>
      <Transition name="flash2">
        <i
          v-if="showLikeAnimation"
          class="pi pi-heart-fill text-5xl text-white glowing-icon"
          aria-hidden="true"
        />
      </Transition>
    </div>

    <!-- Time -->
    <span class="font-medium text-gray-600">{{ formattedTime }}</span>

    <!-- Reply button -->
    <span
      v-if="showReplyButton"
      @click="emit('reply')"
      class="text-md hover:underline hover:text-rose-400 cursor-pointer"
    >
      Reply
    </span>

    <!-- Like section -->
    <div class="flex items-center space-x-2">
      <i
        v-if="localIsLiked"
        @click="handleLike"
        class="text-red-600 pi pi-heart-fill text-md cursor-pointer transition-transform duration-200 transform hover:scale-150"
        :class="{ 'opacity-50 pointer-events-none': isProcessing }"
      />
      <i
        v-else
        @click="handleLike"
        class="text-red-600 pi pi-heart text-md cursor-pointer transition-transform duration-200 transform hover:scale-150"
        :class="{ 'opacity-50 pointer-events-none': isProcessing }"
      />

      <!-- Like count с popover -->
      <div
        v-if="localLikeCount > 0"
        class="font-medium text-md relative cursor-pointer"
        @mouseover="handleLikesMouseOver"
        @mouseleave="handleMouseLeave"
      >
        <span ref="likesPopoverEl">{{ formattedLikeCount }}</span>

        <div
          v-if="showPopover"
          @mouseover="insidePopover = true"
          @mouseleave="handlePopoverMouseLeave"
          class="absolute left-[-100px]"
          :style="{ top: likesIsTop ? '20px' : 'auto', bottom: likesIsTop ? 'auto' : '20px' }"
        >
          <CommentLikesPopover :comment-id="commentId" />
        </div>
      </div>
    </div>

    <!-- Delete button -->
    <span
      v-if="showDeleteButton && canDelete"
      @click="emit('delete')"
      class="text-md hover:underline hover:text-rose-400 cursor-pointer"
    >
      Delete
    </span>
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
