<script setup lang="ts">
import { ref, computed } from 'vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import PinLikesPopover from './PinLikesPopover.vue'
import PinLikesModal from './PinLikesModal.vue'
import { useLikes } from '@/composables/api/useLikes'
import { useLikeAnimation } from '@/composables/features/useAnimations'

export interface PinLikeButtonProps {
  pinId: string
  isLiked: boolean
  likeCount: number
  color?: string
  size?: 'sm' | 'md' | 'lg'
  showCount?: boolean
  showPopover?: boolean
}

const props = withDefaults(defineProps<PinLikeButtonProps>(), {
  color: '#e11d48',
  size: 'md',
  showCount: true,
  showPopover: true,
})

const emit = defineEmits<{
  (e: 'like'): void
  (e: 'unlike'): void
}>()

const { likePinAction, unlikePinAction } = useLikes()

// Local state
const isLikedLocal = ref(props.isLiked)
const likeCountLocal = ref(props.likeCount)
const isLoading = ref(false)

// Animation
const buttonRef = ref<HTMLElement | null>(null)
const { isAnimating, animate } = useLikeAnimation(buttonRef)

// Popover state
const showPopover = ref(false)
const insidePopover = ref(false)

// Modal state
const showModal = ref(false)

// Icon sizes
const iconSizes = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-3xl',
}

// Handle like/unlike
const handleLike = async () => {
  if (isLoading.value || isAnimating.value) return

  isLoading.value = true

  try {
    // Trigger animation
    await animate()

    if (isLikedLocal.value) {
      // Unlike
      await unlikePinAction(props.pinId)
      isLikedLocal.value = false
      likeCountLocal.value = Math.max(0, likeCountLocal.value - 1)
      emit('unlike')
    } else {
      // Like
      await likePinAction(props.pinId)
      isLikedLocal.value = true
      likeCountLocal.value += 1
      emit('like')
    }
  } catch (error) {
    console.error('[PinLikeButton] Like action failed:', error)
    // Revert optimistic update
    isLikedLocal.value = props.isLiked
    likeCountLocal.value = props.likeCount
  } finally {
    isLoading.value = false
  }
}

// Handle popover
const handleMouseEnter = () => {
  if (props.showPopover && likeCountLocal.value > 0) {
    showPopover.value = true
  }
}

const handleMouseLeave = () => {
  if (!insidePopover.value) {
    showPopover.value = false
  }
}

// Handle modal
const handleCountClick = () => {
  if (likeCountLocal.value > 0) {
    showModal.value = true
  }
}
</script>

<template>
  <div class="flex items-center gap-4 relative">
    <!-- Like button -->
    <button
      ref="buttonRef"
      @click="handleLike"
      :disabled="isLoading"
      :style="{ color: color }"
      :class="[
        'transition-all duration-200 transform hover:scale-125 focus:outline-none',
        iconSizes[size],
        isLoading && 'opacity-50 cursor-not-allowed',
      ]"
      :aria-label="isLikedLocal ? 'Unlike' : 'Like'"
      :aria-pressed="isLikedLocal"
    >
      <i
        :class="['pi', isLikedLocal ? 'pi-heart-fill' : 'pi-heart', isAnimating && 'animate-ping']"
      ></i>
    </button>

    <!-- Like count with popover -->
    <div
      v-if="showCount && likeCountLocal > 0"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
      class="relative"
    >
      <PinLikesPopover
        v-if="showPopover"
        :pinId="pinId"
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
          <button
            @click="handleCountClick"
            :style="{ color: color }"
            class="font-bold text-2xl cursor-pointer hover:underline transition-opacity hover:opacity-80"
          >
            {{ likeCountLocal }}
          </button>
        </template>
      </PinLikesPopover>

      <!-- Without popover -->
      <button
        v-else
        @click="handleCountClick"
        :style="{ color: color }"
        class="font-bold text-2xl cursor-pointer hover:underline transition-opacity hover:opacity-80"
      >
        {{ likeCountLocal }}
      </button>
    </div>

    <!-- Likes Modal -->
    <PinLikesModal
      :pinId="pinId"
      v-model="showModal"
      :likeCount="likeCountLocal"
      @update:modelValue="showModal = $event"
    />
  </div>
</template>

<style scoped>
@keyframes ping {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.animate-ping {
  animation: ping 0.5s ease-in-out;
}
</style>
