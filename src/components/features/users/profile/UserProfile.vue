<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import UserHeader from './UserHeader.vue'
import UserTabs from './UserTabs.vue'
import UserPins from './UserPins.vue'
import UserBoards from './UserBoards.vue'
import UserEditModal from './UserEditModal.vue'
import UserAvatarUpload from './UserAvatarUpload.vue'
import FollowersModal from '../follow/FollowersModal.vue'
import FollowingModal from '../follow/FollowingModal.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { useAuthStore } from '@/stores/auth.store'
import { subscriptionsApi } from '@/api/subscriptions.api'
import type { User, UserTab } from '@/types'

export interface UserProfileProps {
  user: User
}

const props = defineProps<UserProfileProps>()

const authStore = useAuthStore()
const router = useRouter()

const activeTab = ref<UserTab>('created')
const followersCount = ref(0)
const followingCount = ref(0)
const hasChat = ref(false)

// Modals
const showEditModal = ref(false)
const showAvatarUpload = ref(false)
const showBannerUpload = ref(false)
const showFollowersModal = ref(false)
const showFollowingModal = ref(false)

const isMe = computed(() => authStore.userId === props.user.id)
const hasBanner = computed(() => !!props.user.bannerImageUrl)
const layout = computed(() => (hasBanner.value ? 'with-banner' : 'default'))

const scopeMap = {
  created: 'CREATED',
  saved: 'SAVED',
  liked: 'LIKED',
  boards: null,
} as const

const currentScope = computed(() => {
  return activeTab.value === 'boards' ? null : scopeMap[activeTab.value]
})

// Load user stats
onMounted(async () => {
  try {
    const [followersRes, followingRes] = await Promise.all([
      subscriptionsApi.getFollowers(props.user.id, { page: 0, size: 1, sort: [] }),
      subscriptionsApi.getFollowing(props.user.id, { page: 0, size: 1, sort: [] }),
    ])

    followersCount.value = followersRes.totalElements
    followingCount.value = followingRes.totalElements

    // TODO: Check if chat exists with this user
    // hasChat.value = await checkUserChat(props.user.id)
  } catch (error) {
    console.error('[UserProfile] Load stats failed:', error)
  }
})

const handleEditProfile = () => {
  showEditModal.value = true
}

const handleSendMessage = () => {
  // TODO: Open send message modal or create chat
  console.log('Send message to', props.user.username)
}

const handleGoToChat = () => {
  // TODO: Navigate to chat
  router.push('/messages')
}

const handleProfileUpdated = () => {
  // Refresh user data if needed
  window.location.reload()
}
</script>

<template>
  <div class="min-h-screen pb-20">
    <!-- User Header -->
    <UserHeader
      :user="user"
      :followers-count="followersCount"
      :following-count="followingCount"
      :has-chat="hasChat"
      :layout="layout"
      @followers-click="showFollowersModal = true"
      @following-click="showFollowingModal = true"
      @edit-profile="handleEditProfile"
      @send-message="handleSendMessage"
      @go-to-chat="handleGoToChat"
      @edit-banner="showBannerUpload = true"
    />

    <!-- Edit Profile Buttons (for me) -->
    <div v-if="isMe" class="flex items-center justify-center gap-3 mt-6">
      <BaseButton variant="outline" size="sm" @click="showEditModal = true">
        Edit Information
      </BaseButton>
      <BaseButton variant="outline" size="sm" @click="showAvatarUpload = true">
        Change Avatar
      </BaseButton>
      <BaseButton variant="outline" size="sm" @click="showBannerUpload = true">
        Change Banner
      </BaseButton>
    </div>

    <!-- Tabs -->
    <UserTabs v-model="activeTab" :show-liked="isMe" />

    <!-- Content -->
    <div class="max-w-7xl mx-auto px-4">
      <!-- Pins (Created/Saved/Liked) -->
      <UserPins
        v-if="activeTab !== 'boards' && currentScope"
        :key="`${user.id}-${activeTab}`"
        :user-id="user.id"
        :scope="currentScope"
      />

      <!-- Boards -->
      <UserBoards v-if="activeTab === 'boards'" :key="`${user.id}-boards`" :user-id="user.id" />
    </div>

    <!-- Modals -->
    <UserEditModal v-model="showEditModal" :user="user" @updated="handleProfileUpdated" />

    <UserAvatarUpload v-model="showAvatarUpload" @uploaded="handleProfileUpdated" />

    <!-- TODO: Create UserBannerUpload component -->
    <!-- <UserBannerUpload
      v-model="showBannerUpload"
      @uploaded="handleProfileUpdated"
    /> -->

    <FollowersModal v-model="showFollowersModal" :user-id="user.id" :count="followersCount" />

    <FollowingModal v-model="showFollowingModal" :user-id="user.id" :count="followingCount" />
  </div>
</template>
