<!-- src/components/features/pins/PinUserInfo.vue -->
<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useUsersWithAvatars } from '@/composables/api/useUsersWithAvatars'
import { useFollow } from '@/composables/api/useFollow'
import { useClickOutside } from '@/composables/utils/useClickOutside'
import { useAuth } from '@/composables/auth/useAuth'
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

// ✅ ИСПРАВЛЕНО: используем composables вместо stores
const { loadUser, getUser } = useUsersWithAvatars()
const { userId: currentUserId } = useAuth()

// ✅ ИСПРАВЛЕНО: getter для реактивности
const {
  isFollowing,
  isLoading: isFollowLoading,
  follow,
  unfollow,
  check,
} = useFollow(() => props.userId)

// Refs
const containerRef = ref<HTMLElement | null>(null)
const triggerRef = ref<HTMLElement | null>(null)

// State
const isPopoverOpen = ref(false)
const isTop = ref(true)
const isLoadingUser = ref(false)

// Click outside
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
const isCurrentUser = computed(() => currentUserId.value === props.userId)

const popoverUser = computed(() => getUser(props.userId))

const avatarSize = computed(
  () =>
    ({
      sm: 'sm' as const,
      md: 'md' as const,
      lg: 'lg' as const,
    })[props.size],
)

const displayImage = computed(
  () => props.imageBlobUrl || popoverUser.value.image || props.imageUrl || undefined,
)

// Methods
async function loadPopoverData() {
  if (isLoadingUser.value) return

  // Calculate position
  if (triggerRef.value) {
    const rect = triggerRef.value.getBoundingClientRect()
    const distanceToBottom = window.innerHeight - rect.bottom
    isTop.value = distanceToBottom >= 220
  }

  isLoadingUser.value = true

  try {
    await loadUser(props.userId)

    if (!isCurrentUser.value) {
      await check()
    }
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
      <BaseAvatar v-if="displayImage" :src="displayImage" :alt="username" :size="avatarSize" />
      <div v-else class="bg-gray-300 w-8 h-8 rounded-full animate-pulse" />

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
          <!-- Loading -->
          <div v-if="isLoadingUser" class="py-8">
            <div class="w-20 h-20 bg-gray-300 rounded-full animate-pulse mb-3" />
            <div class="w-24 h-4 bg-gray-300 rounded animate-pulse" />
          </div>

          <!-- User content -->
          <template v-else-if="popoverUser.username !== 'Loading...'">
            <RouterLink
              :to="`/user/${popoverUser.username}`"
              class="relative transition-transform duration-200 transform hover:scale-110"
            >
              <BaseAvatar
                :src="popoverUser.image || undefined"
                :alt="popoverUser.username"
                size="xl"
                class="border-2 border-red-500"
              />
            </RouterLink>

            <RouterLink
              :to="`/user/${popoverUser.username}`"
              class="mt-2 text-xl font-bold hover:underline text-shadow"
            >
              {{ popoverUser.username }}
            </RouterLink>

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
