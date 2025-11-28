<!-- src/components/features/users/UserPopover.vue -->
<script setup lang="ts">
/**
 * UserPopover - Popover при hover на username
 * ✅ ИСПРАВЛЕНО: использует useUsersWithAvatars вместо store
 */

import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuth } from '@/composables/auth/useAuth'
import { useUsersWithAvatars } from '@/composables/api/useUsersWithAvatars'
import { useFollow } from '@/composables/api/useFollow'
import { useSubscriptionsStore } from '@/stores/subscriptions.store'
import BaseAvatar from '@/components/ui/BaseAvatar.vue'
import FollowButton from './follow/FollowButton.vue'

export interface UserPopoverProps {
  userId: string
  position?: 'top' | 'bottom'
}

const props = withDefaults(defineProps<UserPopoverProps>(), {
  position: 'bottom',
})

const emit = defineEmits<{
  showFollowers: []
  showFollowing: []
}>()

// ✅ FIX: Используем composables
const { userId: currentUserId } = useAuth()
const { loadUser, getUser, isLoading: isLoadingUser } = useUsersWithAvatars()
const { isFollowing, check } = useFollow(() => props.userId)
const subscriptionsStore = useSubscriptionsStore()

// State
const followersCount = ref(0)
const followingCount = ref(0)

// Computed
const isCurrentUser = computed(() => currentUserId.value === props.userId)
const user = computed(() => getUser(props.userId))
const positionClass = computed(() => (props.position === 'top' ? 'bottom-10' : 'top-10'))

// Load user data
onMounted(async () => {
  try {
    await loadUser(props.userId)

    if (!isCurrentUser.value) {
      await check()
    }

    // Load counts
    const [followers, following] = await Promise.all([
      subscriptionsStore.fetchFollowers(props.userId, 0, 1),
      subscriptionsStore.fetchFollowing(props.userId, 0, 1),
    ])

    followersCount.value = followers?.length || 0
    followingCount.value = following?.length || 0
  } catch (error) {
    console.error('[UserPopover] Failed to load user:', error)
  }
})
</script>

<template>
  <div
    :class="[
      'bg-white/20 backdrop-blur-md rounded-3xl font-medium text-white z-30 w-[271px] shadow-xl',
      positionClass,
    ]"
  >
    <div class="relative flex flex-col items-center justify-center py-6 px-4">
      <!-- Loading -->
      <div v-if="isLoadingUser" class="py-8">
        <div class="w-20 h-20 bg-gray-300 rounded-full animate-pulse mb-3" />
        <div class="w-24 h-4 bg-gray-300 rounded animate-pulse" />
      </div>

      <!-- Content -->
      <template v-else-if="user.username !== 'Loading...'">
        <!-- Avatar -->
        <RouterLink
          :to="`/user/${user.username}`"
          class="relative transition-transform duration-200 transform hover:scale-110"
        >
          <BaseAvatar
            :src="user.image || undefined"
            :alt="user.username"
            size="xl"
            class="border-2 border-red-500 !w-20 !h-20"
          />
        </RouterLink>

        <!-- Username -->
        <RouterLink
          :to="`/user/${user.username}`"
          class="mt-2 text-xl font-bold hover:underline text-shadow"
        >
          {{ user.username }}
        </RouterLink>

        <!-- Stats -->
        <div class="flex gap-4 mt-1 text-sm">
          <button
            v-if="followersCount > 0"
            @click.prevent="emit('showFollowers')"
            class="hover:underline cursor-pointer transition-transform hover:scale-105 text-shadow"
          >
            {{ followersCount }} followers
          </button>
          <button
            v-if="followingCount > 0"
            @click.prevent="emit('showFollowing')"
            class="hover:underline cursor-pointer transition-transform hover:scale-105 text-shadow"
          >
            {{ followingCount }} following
          </button>
        </div>

        <!-- Follow button -->
        <div v-if="!isCurrentUser" class="absolute top-2 right-2">
          <FollowButton :user-id="userId" size="sm" variant="minimal" />
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.text-shadow {
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.6);
}
</style>
