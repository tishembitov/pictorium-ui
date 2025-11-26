<!-- src/components/features/pin/PinUserInfo.vue -->
<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useUserStore } from '@/stores/user.store'
import { useSubscriptionsStore } from '@/stores/subscriptions.store'
import { useFollow } from '@/composables/api/useFollow'
import { useClickOutside } from '@/composables/utils/useClickOutside'
import BaseAvatar from '@/components/ui/BaseAvatar.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

export interface PinUserInfoProps {
  userId: string
  username?: string | null
  imageUrl?: string | null
  imageBlobUrl?: string | null
  verified?: boolean
  showPopover?: boolean
  showFollowButton?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<PinUserInfoProps>(), {
  showPopover: true,
  showFollowButton: true,
  size: 'sm',
})

const emit = defineEmits<{
  (e: 'showFollowers'): void
  (e: 'showFollowing'): void
}>()

// Stores
const userStore = useUserStore()
const subscriptionsStore = useSubscriptionsStore()

// Refs
const containerRef = ref<HTMLElement | null>(null)
const triggerRef = ref<HTMLElement | null>(null)

// State
const isPopoverOpen = ref(false)
const popoverUser = ref<any>(null)
const popoverImage = ref<string | null>(null)
const isTop = ref(true)
const isLoadingUser = ref(false)

// Composables
const { isFollowing, isLoading: isFollowLoading, follow, unfollow, check } = useFollow(props.userId)

// Click outside to close popover
useClickOutside(
  containerRef,
  () => {
    if (isPopoverOpen.value) {
      isPopoverOpen.value = false
    }
  },
  { ignore: [triggerRef] },
)

// Computed
const isCurrentUser = computed(() => userStore.userId === props.userId)

const followersCount = computed(() => subscriptionsStore.getFollowers(props.userId)?.length || 0)

const followingCount = computed(() => subscriptionsStore.getFollowing(props.userId)?.length || 0)

const avatarSize = computed(
  () =>
    ({
      sm: 'sm' as const,
      md: 'md' as const,
      lg: 'lg' as const,
    })[props.size],
)

const displayImage = computed(
  () => props.imageBlobUrl || popoverImage.value || props.imageUrl || undefined,
)

// Methods
async function loadPopoverData() {
  if (popoverUser.value || isLoadingUser.value) return

  // Calculate position based on viewport
  if (triggerRef.value) {
    const rect = triggerRef.value.getBoundingClientRect()
    const distanceToBottom = window.innerHeight - rect.bottom
    isTop.value = distanceToBottom >= 220
  }

  isLoadingUser.value = true

  try {
    // Load user data
    popoverUser.value = await userStore.loadUserById(props.userId)
    popoverImage.value = userStore.getAvatarUrl(props.userId) || null

    // Check follow status
    if (!isCurrentUser.value) {
      await check()
    }

    // Load followers/following counts
    await Promise.all([
      subscriptionsStore.fetchFollowers(props.userId, 0, 1),
      subscriptionsStore.fetchFollowing(props.userId, 0, 1),
    ])
  } catch (error) {
    console.error('[PinUserInfo] Failed to load user:', error)
  } finally {
    isLoadingUser.value = false
  }
}

function handleTriggerClick(e: Event) {
  if (!props.showPopover) return
  e.preventDefault()
  e.stopPropagation()

  if (isPopoverOpen.value) {
    isPopoverOpen.value = false
  } else {
    isPopoverOpen.value = true
    loadPopoverData()
  }
}

async function handleFollow() {
  try {
    await follow()
  } catch (error) {
    console.error('[PinUserInfo] Failed to follow:', error)
  }
}

async function handleUnfollow() {
  try {
    await unfollow()
  } catch (error) {
    console.error('[PinUserInfo] Failed to unfollow:', error)
  }
}
</script>

<template>
  <div ref="containerRef" class="relative">
    <!-- User link with avatar -->
    <RouterLink
      v-if="username"
      :to="`/user/${username}`"
      class="flex items-center mt-2 hover:underline cursor-pointer"
    >
      <!-- Avatar -->
      <BaseAvatar v-if="displayImage" :src="displayImage" :alt="username" :size="avatarSize" />
      <div v-else class="bg-gray-300 w-8 h-8 rounded-full animate-pulse" />

      <!-- Username (popover trigger) -->
      <span
        ref="triggerRef"
        @click="handleTriggerClick"
        class="ml-2 text-sm font-medium cursor-pointer hover:underline"
      >
        {{ username }}
      </span>
    </RouterLink>

    <!-- Loading placeholder -->
    <div v-else class="flex items-center mt-2">
      <div class="bg-gray-300 w-8 h-8 rounded-full animate-pulse" />
      <span class="ml-2 w-20 h-4 bg-gray-200 rounded animate-pulse" />
    </div>

    <!-- User Popover -->
    <Transition name="popover-fade">
      <div
        v-if="isPopoverOpen && showPopover"
        class="absolute left-0 bg-white/20 backdrop-blur-md rounded-3xl font-medium text-white z-30 w-[271px] shadow-xl"
        :class="isTop ? 'top-10' : 'bottom-10'"
      >
        <div class="relative flex flex-col items-center justify-center py-6 px-4">
          <!-- Loading state -->
          <div v-if="isLoadingUser" class="py-8">
            <div class="w-20 h-20 bg-gray-300 rounded-full animate-pulse mb-3" />
            <div class="w-24 h-4 bg-gray-300 rounded animate-pulse" />
          </div>

          <!-- User content -->
          <template v-else-if="popoverUser">
            <!-- Avatar with link -->
            <RouterLink
              :to="`/user/${popoverUser.username}`"
              class="relative transition-transform duration-200 transform hover:scale-110"
            >
              <i
                v-if="popoverUser.verified"
                class="absolute -top-1 -right-1 pi pi-verified text-xl text-blue-400"
              />
              <BaseAvatar
                :src="popoverImage || popoverUser.imageUrl"
                :alt="popoverUser.username"
                size="xl"
                class="border-2 border-red-500"
              />
            </RouterLink>

            <!-- Username -->
            <RouterLink
              :to="`/user/${popoverUser.username}`"
              class="mt-2 text-xl font-bold hover:underline text-shadow"
            >
              {{ popoverUser.username }}
            </RouterLink>

            <!-- Stats -->
            <div class="flex gap-4 mt-1 text-sm">
              <button
                v-if="followersCount > 0"
                @click.prevent="emit('showFollowers')"
                class="hover:underline text-shadow cursor-pointer transition-transform hover:scale-105"
              >
                {{ followersCount }} followers
              </button>
              <button
                v-if="followingCount > 0"
                @click.prevent="emit('showFollowing')"
                class="hover:underline text-shadow cursor-pointer transition-transform hover:scale-105"
              >
                {{ followingCount }} following
              </button>
            </div>

            <!-- Follow button -->
            <div v-if="showFollowButton && !isCurrentUser" class="absolute top-2 right-2">
              <BaseButton
                v-if="!isFollowing"
                @click.prevent="handleFollow"
                :loading="isFollowLoading"
                size="sm"
                variant="primary"
                class="!px-3 !py-1.5 !text-xs"
              >
                Follow
              </BaseButton>
              <BaseButton
                v-else
                @click.prevent="handleUnfollow"
                :loading="isFollowLoading"
                size="sm"
                variant="secondary"
                class="!px-3 !py-1.5 !text-xs"
              >
                Unfollow
              </BaseButton>
            </div>
          </template>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.text-shadow {
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.6);
}

.popover-fade-enter-active {
  animation: popoverIn 0.3s ease-out;
}

.popover-fade-leave-active {
  animation: popoverIn 0.2s ease-in reverse;
}

@keyframes popoverIn {
  0% {
    opacity: 0;
    transform: scale(0.8);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
