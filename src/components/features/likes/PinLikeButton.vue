<!-- src/components/pin/likes/PinLikeButton.vue -->
<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { usePinActions } from '@/composables/api/usePinActions'
import { useLikeAnimation, useHeartBurst } from '@/composables/features/useAnimations'

export interface PinLikeButtonProps {
  pinId: string
  isLiked?: boolean
  likeCount?: number
  color?: string
  size?: 'sm' | 'md' | 'lg'
  showCount?: boolean
  showAnimation?: boolean
}

const props = withDefaults(defineProps<PinLikeButtonProps>(), {
  isLiked: false,
  likeCount: 0,
  color: '#ef4444',
  size: 'md',
  showCount: true,
  showAnimation: true,
})

const emit = defineEmits<{
  (e: 'like'): void
  (e: 'unlike'): void
  (e: 'countClick'): void
  (e: 'update:isLiked', value: boolean): void
  (e: 'update:likeCount', value: number): void
}>()

// Refs
const buttonRef = ref<HTMLElement | null>(null)
const containerRef = ref<HTMLElement | null>(null)

// Actions from store
const { toggleLike } = usePinActions(props.pinId)

// Local state for optimistic UI
const localIsLiked = ref(props.isLiked)
const localCount = ref(props.likeCount)
const isProcessing = ref(false)

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
    localCount.value = val
  },
)

// Animations
const { isAnimating: isLikeAnimating, animate: animateLike } = useLikeAnimation(buttonRef)
const { burst: burstHearts } = useHeartBurst(containerRef)

// Animation states for flash effect
const showLikeAnimation = ref(false)
const showUnlikeAnimation = ref(false)

// Size classes
const sizeClasses = computed(
  () =>
    ({
      sm: 'text-lg',
      md: 'text-2xl',
      lg: 'text-3xl',
    })[props.size],
)

const countSizeClasses = computed(
  () =>
    ({
      sm: 'text-sm',
      md: 'text-xl',
      lg: 'text-2xl',
    })[props.size],
)

// Handle like
async function handleLike() {
  if (isProcessing.value) return

  const wasLiked = localIsLiked.value

  // Optimistic update
  localIsLiked.value = !wasLiked
  localCount.value += wasLiked ? -1 : 1
  isProcessing.value = true

  // Emit updates
  emit('update:isLiked', localIsLiked.value)
  emit('update:likeCount', localCount.value)

  // Trigger animations
  if (props.showAnimation) {
    if (!wasLiked) {
      showLikeAnimation.value = true
      animateLike()
      burstHearts()
      setTimeout(() => {
        showLikeAnimation.value = false
      }, 500)
      emit('like')
    } else {
      showUnlikeAnimation.value = true
      setTimeout(() => {
        showUnlikeAnimation.value = false
      }, 500)
      emit('unlike')
    }
  }

  try {
    await toggleLike()
  } catch (error) {
    // Rollback on error
    localIsLiked.value = wasLiked
    localCount.value += wasLiked ? 1 : -1
    emit('update:isLiked', localIsLiked.value)
    emit('update:likeCount', localCount.value)
    console.error('[PinLikeButton] Failed to toggle like:', error)
  } finally {
    isProcessing.value = false
  }
}

function handleCountClick() {
  if (localCount.value > 0) {
    emit('countClick')
  }
}
</script>

<template>
  <div ref="containerRef" class="flex items-center space-x-2 relative">
    <!-- Like Button -->
    <button
      ref="buttonRef"
      @click="handleLike"
      :disabled="isLikeAnimating || isProcessing"
      class="transition-transform duration-200 transform hover:scale-125 focus:outline-none disabled:opacity-50"
      :aria-label="localIsLiked ? 'Unlike' : 'Like'"
      :aria-pressed="localIsLiked"
    >
      <i
        :class="['pi', localIsLiked ? 'pi-heart-fill' : 'pi-heart', sizeClasses]"
        :style="{ color: color }"
      />
    </button>

    <!-- Like Count -->
    <button
      v-if="showCount && localCount > 0"
      @click="handleCountClick"
      :class="['font-bold cursor-pointer hover:underline transition-colors', countSizeClasses]"
      :style="{ color: color }"
      type="button"
    >
      {{ localCount }}
    </button>

    <!-- Flash Animation Overlay -->
    <div
      v-if="showAnimation"
      class="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
    >
      <Transition name="flash">
        <i v-if="showLikeAnimation" class="pi pi-heart-fill text-6xl text-white glowing-icon" />
      </Transition>
      <Transition name="flash">
        <i v-if="showUnlikeAnimation" class="pi pi-heart text-6xl text-white glowing-icon" />
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.flash-enter-active,
.flash-leave-active {
  transition:
    opacity 0.5s ease-out,
    transform 0.5s cubic-bezier(0.3, 0.8, 0.2, 1);
}

.flash-enter-from,
.flash-leave-to {
  opacity: 0;
  transform: scale(3);
}

.flash-enter-to,
.flash-leave-from {
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
