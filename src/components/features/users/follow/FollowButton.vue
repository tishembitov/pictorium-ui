<!-- src/components/features/user/follow/FollowButton.vue -->
<script setup lang="ts">
/**
 * FollowButton - Кнопка Follow/Unfollow
 * Использует: useFollow composable
 * Визуальный стиль из старого UserView.vue
 */

import { computed, onMounted } from 'vue'
import { useFollow } from '@/composables/api/useFollow'
import BaseButton from '@/components/ui/BaseButton.vue'

export interface FollowButtonProps {
  userId: string
  /** Начальное состояние (для оптимистичного UI) */
  initialFollowing?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'minimal' | 'outline'
}

const props = withDefaults(defineProps<FollowButtonProps>(), {
  initialFollowing: false,
  size: 'md',
  variant: 'primary',
})

const emit = defineEmits<{
  (e: 'followed'): void
  (e: 'unfollowed'): void
  (e: 'error', error: Error): void
}>()

// Composable
const { isFollowing, isLoading, check, follow, unfollow, toggle, error } = useFollow(props.userId)

// Check follow status on mount
onMounted(async () => {
  try {
    await check()
  } catch (e) {
    console.error('[FollowButton] Failed to check follow status:', e)
  }
})

// Button text
const buttonText = computed(() => {
  if (isLoading.value) return isFollowing.value ? 'Unfollowing...' : 'Following...'
  return isFollowing.value ? 'Unfollow' : 'Follow'
})

// Handle click
async function handleClick() {
  try {
    if (isFollowing.value) {
      await unfollow()
      emit('unfollowed')
    } else {
      await follow()
      emit('followed')
    }
  } catch (e) {
    emit('error', e as Error)
  }
}

// Size classes (из старого проекта)
const sizeClasses = computed(() => {
  const sizes = {
    sm: 'px-3 py-2 text-xs',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base',
  }
  return sizes[props.size]
})
</script>

<template>
  <!-- Primary variant (как в старом UserView.vue) -->
  <button
    v-if="variant === 'primary'"
    @click="handleClick"
    :disabled="isLoading"
    :class="[
      'rounded-2xl transition font-medium',
      sizeClasses,
      isFollowing
        ? 'bg-black text-white hover:bg-gray-900'
        : 'bg-red-500 text-white hover:bg-red-700',
      isLoading && 'opacity-50 cursor-wait',
    ]"
  >
    {{ buttonText }}
  </button>

  <!-- Minimal variant (для popover) -->
  <button
    v-else-if="variant === 'minimal'"
    @click="handleClick"
    :disabled="isLoading"
    :class="[
      'px-3 py-2 bg-red-600 text-white rounded-3xl text-xs transition',
      isLoading && 'opacity-50',
    ]"
  >
    {{ buttonText }}
  </button>

  <!-- Outline variant -->
  <BaseButton
    v-else
    @click="handleClick"
    :loading="isLoading"
    :variant="isFollowing ? 'secondary' : 'primary'"
    :size="size"
  >
    {{ buttonText }}
  </BaseButton>
</template>
