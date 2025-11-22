<script setup lang="ts">
import { computed } from 'vue'
import { useFollow } from '@/composables/api/useUsers'
import BaseButton from '@/components/ui/BaseButton.vue'

export interface FollowButtonProps {
  userId: string
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  showCount?: boolean
}

const props = withDefaults(defineProps<FollowButtonProps>(), {
  variant: 'primary',
  size: 'md',
  showCount: false,
})

const { isFollowing, isLoading, toggle } = useFollow(props.userId)

const buttonText = computed(() => {
  return isFollowing.value ? 'Unfollow' : 'Follow'
})

const buttonVariant = computed(() => {
  if (isFollowing.value) {
    return 'secondary'
  }
  return props.variant
})
</script>

<template>
  <BaseButton
    :variant="buttonVariant"
    :size="size"
    :loading="isLoading"
    @click="toggle"
    class="transition-all duration-200"
  >
    {{ buttonText }}
  </BaseButton>
</template>
