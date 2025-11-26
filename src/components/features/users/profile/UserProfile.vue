<!-- src/components/features/user/profile/UserProfile.vue -->
<script setup lang="ts">
/**
 * UserProfile - Обёртка профиля пользователя
 * Объединяет все компоненты профиля
 */

import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserProfile, useCurrentUser } from '@/composables/api/useUserProfile'
import { useDocumentTitle } from '@/composables/utils/useDocumentTitle'
import { useIntersectionObserver } from '@/composables/utils/useIntersectionObserver'
import UserHeader from './UserHeader.vue'
import UserTabs from './UserTabs.vue'
import UserPins from './UserPins.vue'
import UserBoards from './UserBoards.vue'
import UserEditModal from './UserEditModal.vue'
import UserAvatarUpload from './UserAvatarUpload.vue'
import UserBannerUpload from '../UserBannerUpload.vue'
import FollowersModal from '../follow/FollowersModal.vue'
import FollowingModal from '../follow/FollowingModal.vue'
import SendMessageModal from './SendMessageModal.vue'
import AboutUserModal from './AboutUserModal.vue'
import BaseLoader from '@/components/ui/BaseLoader.vue'
import BackButton from '@/components/common/BackButton.vue'
import AppHeader from '@/components/common/AppHeader.vue'

export interface UserProfileProps {
  username: string
}

const props = defineProps<UserProfileProps>()

const router = useRouter()

// Composables
const {
  user,
  isCurrentUser,
  isFollowing,
  avatarUrl,
  pins,
  followers,
  following,
  isLoading,
  fetchUser,
  fetchPins,
  follow,
  unfollow,
} = useUserProfile(() => props.username)

const { bannerUrl } = useCurrentUser()

// Document title
const pageTitle = computed(() => user.value?.username || 'Profile')
useDocumentTitle(pageTitle)

// State
const activeTab = ref<'created' | 'saved' | 'liked' | 'boards'>('created')
const showFollowersModal = ref(false)
const showFollowingModal = ref(false)
const showEditModal = ref(false)
const showAvatarModal = ref(false)
const showBannerModal = ref(false)
const showMessageModal = ref(false)
const showAboutModal = ref(false)
const checkUserChat = ref(false)

// Header sticky state
const observerTargetHeader = ref<HTMLElement | null>(null)
const showStickyHeader = ref(false)

const { isIntersecting } = useIntersectionObserver(observerTargetHeader, {
  threshold: 1,
  rootMargin: '-20px 0px 0px 0px',
})

watch(isIntersecting, (visible) => {
  showStickyHeader.value = !visible
})

// Counts
const followersCount = computed(() => followers.value?.length || 0)
const followingCount = computed(() => following.value?.length || 0)

// Load user on mount
onMounted(async () => {
  try {
    await fetchUser()
  } catch (error) {
    router.push('/not-found')
  }
})

// Tab change
function handleTabChange(tab: 'created' | 'saved' | 'liked' | 'boards') {
  activeTab.value = tab
}

// Message handlers
function handleSendMessage() {
  showMessageModal.value = true
}

function handleGoToChat() {
  // Navigate to chat
  router.push('/messages')
}

// Edit handlers
function handleEditProfile() {
  showEditModal.value = true
}

function handleEditImage() {
  showAvatarModal.value = true
}

function handleEditBanner() {
  showBannerModal.value = true
}
</script>

<template>
  <!-- Modals -->
  <FollowersModal
    v-if="user"
    v-model="showFollowersModal"
    :user-id="user.id"
    :count="followersCount"
  />

  <FollowingModal
    v-if="user"
    v-model="showFollowingModal"
    :user-id="user.id"
    :count="followingCount"
  />

  <UserEditModal
    v-if="user && isCurrentUser"
    v-model="showEditModal"
    :user="user"
    @updated="fetchUser()"
  />

  <UserAvatarUpload v-if="isCurrentUser" v-model="showAvatarModal" @uploaded="fetchUser()" />

  <UserBannerUpload v-if="isCurrentUser" v-model="showBannerModal" @uploaded="fetchUser()" />

  <AboutUserModal
    v-if="user"
    v-model="showAboutModal"
    :user="user"
    :followers-count="followersCount"
    :following-count="followingCount"
    :is-current-user="isCurrentUser"
    :is-following="isFollowing"
    :has-chat="checkUserChat"
    @show-followers="showFollowersModal = true"
    @show-following="showFollowingModal = true"
    @send-message="handleSendMessage"
    @go-to-chat="handleGoToChat"
    @follow="follow()"
    @unfollow="unfollow()"
  />

  <!-- Header -->
  <AppHeader />

  <div class="flex items-center justify-center mt-20 ml-20">
    <!-- Loading -->
    <BaseLoader v-if="isLoading" variant="spinner" size="lg" color="red" />

    <div v-else-if="user">
      <!-- Back button -->
      <BackButton position="absolute" class="ml-20 mt-20" />

      <!-- Sticky header (когда основной header уходит из view) -->
      <div
        v-if="showStickyHeader"
        class="fixed left-20 right-0 top-14 w-full z-20 bg-white bg-opacity-20 backdrop-blur-sm"
      >
        <div class="ml-[140px] flex items-center gap-4">
          <img v-if="avatarUrl" :src="avatarUrl" class="w-12 h-12 rounded-full object-cover" />
          <span class="text-2xl font-semibold text-black">{{ user.username }}</span>

          <div class="ml-[195px]">
            <UserTabs :active-tab="activeTab" variant="sticky" @change="handleTabChange" />
          </div>
        </div>
      </div>

      <!-- Main header -->
      <div ref="observerTargetHeader">
        <UserHeader
          :user="user"
          :avatar-url="avatarUrl"
          :banner-url="bannerUrl"
          :followers-count="followersCount"
          :following-count="followingCount"
          :is-current-user="isCurrentUser"
          :is-following="isFollowing"
          :has-chat="checkUserChat"
          @show-followers="showFollowersModal = true"
          @show-following="showFollowingModal = true"
          @show-more-bio="showAboutModal = true"
          @send-message="handleSendMessage"
          @go-to-chat="handleGoToChat"
          @edit-profile="handleEditProfile"
          @edit-image="handleEditImage"
          @edit-banner="handleEditBanner"
        />
      </div>

      <!-- Tabs -->
      <div class="mt-6">
        <UserTabs :active-tab="activeTab" @change="handleTabChange" />
      </div>
    </div>
  </div>

  <!-- Content -->
  <div class="min-h-[500px]">
    <UserPins
      v-if="user && (activeTab === 'created' || activeTab === 'saved' || activeTab === 'liked')"
      :user-id="user.id"
      :variant="activeTab"
    />

    <UserBoards v-if="user && activeTab === 'boards'" :user-id="user.id" />
  </div>
</template>
