<!-- src/components/features/users/profile/UserStats.vue -->
<script setup lang="ts">
/**
 * UserStats - Followers, Following counts
 * ✅ Чистый presentational компонент
 */

export interface UserStatsProps {
  followersCount: number
  followingCount: number
  pinsCount?: number
  boardsCount?: number
  variant?: 'inline' | 'column'
}

withDefaults(defineProps<UserStatsProps>(), {
  variant: 'inline',
})

const emit = defineEmits<{
  showFollowers: []
  showFollowing: []
}>()
</script>

<template>
  <div :class="['flex gap-4 mt-4', variant === 'column' ? 'justify-start' : 'justify-center']">
    <button
      v-if="followersCount > 0"
      @click="emit('showFollowers')"
      class="text-black cursor-pointer hover:underline font-extrabold transition"
    >
      {{ followersCount }} follower{{ followersCount !== 1 ? 's' : '' }}
    </button>
    <button
      v-if="followingCount > 0"
      @click="emit('showFollowing')"
      class="text-black cursor-pointer hover:underline font-extrabold transition"
    >
      {{ followingCount }} following
    </button>
  </div>
</template>
