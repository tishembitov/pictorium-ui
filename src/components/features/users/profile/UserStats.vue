<!-- src/components/features/user/profile/UserStats.vue -->
<script setup lang="ts">
/**
 * UserStats - Followers, Following, Pins count
 * Визуальный стиль из старого UserView.vue
 */

export interface UserStatsProps {
  followersCount: number
  followingCount: number
  pinsCount?: number
  boardsCount?: number
  variant?: 'inline' | 'column'
}

const props = withDefaults(defineProps<UserStatsProps>(), {
  variant: 'inline',
})

const emit = defineEmits<{
  (e: 'showFollowers'): void
  (e: 'showFollowing'): void
}>()
</script>

<template>
  <!-- Inline variant (для профиля без баннера) -->
  <div v-if="variant === 'inline'" class="flex gap-4 mt-4">
    <a
      v-if="followersCount > 0"
      @click="emit('showFollowers')"
      class="text-black cursor-pointer hover:underline font-extrabold"
    >
      {{ followersCount }} follower{{ followersCount !== 1 ? 's' : '' }}
    </a>
    <a
      v-if="followingCount > 0"
      @click="emit('showFollowing')"
      class="text-black cursor-pointer hover:underline font-extrabold"
    >
      {{ followingCount }} following
    </a>
  </div>

  <!-- Column variant (для профиля с баннером) -->
  <div v-else class="flex gap-4 mt-4 justify-left">
    <a
      v-if="followersCount > 0"
      @click="emit('showFollowers')"
      class="cursor-pointer hover:underline font-extrabold text-black"
    >
      {{ followersCount }} follower{{ followersCount !== 1 ? 's' : '' }}
    </a>
    <a
      v-if="followingCount > 0"
      @click="emit('showFollowing')"
      class="cursor-pointer hover:underline font-extrabold text-black"
    >
      {{ followingCount }} following
    </a>
  </div>
</template>
