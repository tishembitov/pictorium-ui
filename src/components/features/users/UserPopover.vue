<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { RouterLink } from 'vue-router'
import UserAvatar from '@/components/common/UserAvatar.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseLoader from '@/components/ui/BaseLoader.vue'
import FollowersModal from './follow/FollowersModal.vue'
import FollowingModal from './follow/FollowingModal.vue'
import { useUsers } from '@/composables/api/useUsers'
import { useFollow } from '@/composables/api/useUsers'
import { useAuthStore } from '@/stores/auth.store'
import { storageApi } from '@/api/storage.api'

export interface UserPopoverProps {
  modelValue: boolean
  userId: string
  position?: 'top' | 'bottom'
}

const props = withDefaults(defineProps<UserPopoverProps>(), {
  position: 'bottom',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const authStore = useAuthStore()
const { fetchUserById } = useUsers()
const { isFollowing, follow, unfollow, check } = useFollow(props.userId)

// State
const user = ref<User | null>(null)
const userImage = ref<string | null>(null)
const followersCount = ref(0)
const followingCount = ref(0)
const isLoading = ref(false)
const showFollowers = ref(false)
const showFollowing = ref(false)

// Computed
const isMe = computed(() => {
  return authStore.userId === props.userId
})

// Watch for open state
watch(
  () => props.modelValue,
  async (isOpen) => {
    if (isOpen && !user.value) {
      await loadUser()
    }
  },
)

// Methods
const loadUser = async () => {
  try {
    isLoading.value = true

    // Load user data
    user.value = await fetchUserById(props.userId)

    // Load avatar
    if (user.value.imageUrl) {
      try {
        const blob = await storageApi.downloadImage(user.value.imageUrl)
        userImage.value = URL.createObjectURL(blob)
      } catch (error) {
        console.error('[UserPopover] Avatar load failed:', error)
      }
    }

    // Load follow status
    if (!isMe.value) {
      await check()
    }

    // Load counts (from API - добавить endpoints если нужно)
    // Пока используем заглушки
    followersCount.value = 0
    followingCount.value = 0
  } catch (error) {
    console.error('[UserPopover] Load user failed:', error)
  } finally {
    isLoading.value = false
  }
}

const handleFollow = async () => {
  try {
    if (isFollowing.value) {
      await unfollow()
      followersCount.value = Math.max(0, followersCount.value - 1)
    } else {
      await follow()
      followersCount.value += 1
    }
  } catch (error) {
    console.error('[UserPopover] Follow action failed:', error)
  }
}

const handleFollowersClick = () => {
  showFollowers.value = true
}

const handleFollowingClick = () => {
  showFollowing.value = true
}

const close = () => {
  emit('update:modelValue', false)
}
</script>

<template>
  <Transition name="flash">
    <div
      v-if="modelValue"
      :class="[
        'absolute left-0 z-50',
        'bg-white bg-opacity-20 backdrop-blur-md rounded-3xl',
        'shadow-2xl border border-white/30',
        'w-[271px] h-[200px]',
        'font-medium text-white',
        position === 'bottom' ? 'top-[30px]' : 'bottom-[30px]',
      ]"
    >
      <!-- Loading State -->
      <div v-if="isLoading" class="flex items-center justify-center h-full">
        <BaseLoader variant="spinner" size="md" color="white" />
      </div>

      <!-- Content -->
      <div v-else-if="user" class="relative flex flex-col items-center justify-center p-6 h-full">
        <!-- Avatar -->
        <RouterLink
          :to="`/user/${user.username}`"
          @click="close"
          class="relative transition-transform duration-200 hover:scale-110"
        >
          <i
            v-if="user.verified"
            class="absolute top-0 left-16 pi pi-verified text-2xl text-blue-500"
          ></i>
          <UserAvatar
            v-if="userImage"
            :user="user"
            :image-url="userImage"
            size="xl"
            class="border-2 border-red-500 rounded-full"
          />
        </RouterLink>

        <!-- Username -->
        <RouterLink
          :to="`/user/${user.username}`"
          @click="close"
          class="mt-3 text-xl font-bold hover:underline text-center"
          style="text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.6)"
        >
          {{ user.username }}
        </RouterLink>

        <!-- Stats -->
        <div class="flex space-x-4 mt-2">
          <button
            v-if="followersCount > 0"
            @click="handleFollowersClick"
            class="cursor-pointer transition-transform duration-200 hover:scale-110"
            style="text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.6)"
          >
            {{ followersCount }} followers
          </button>

          <button
            v-if="followingCount > 0"
            @click="handleFollowingClick"
            class="cursor-pointer transition-transform duration-200 hover:scale-110"
            style="text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.6)"
          >
            {{ followingCount }} following
          </button>
        </div>

        <!-- Follow Button -->
        <div
          v-if="!isMe"
          class="absolute top-2 right-2 transition-transform duration-200 hover:scale-110"
        >
          <BaseButton variant="primary" size="sm" @click="handleFollow">
            {{ isFollowing ? 'Unfollow' : 'Follow' }}
          </BaseButton>
        </div>
      </div>
    </div>
  </Transition>

  <!-- Followers Modal -->
  <FollowersModal v-if="user" v-model="showFollowers" :user-id="user.id" :count="followersCount" />

  <!-- Following Modal -->
  <FollowingModal v-if="user" v-model="showFollowing" :user-id="user.id" :count="followingCount" />
</template>

<style scoped>
.flash-enter-active {
  animation: flashEffect 0.5s ease-out;
}

@keyframes flashEffect {
  0% {
    opacity: 0;
    transform: scale(0.1);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
