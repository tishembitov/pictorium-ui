<!-- src/components/features/users/profile/UserProfile.vue -->
<script setup lang="ts">
/**
 * UserProfile - Container компонент профиля
 * ✅ ИСПРАВЛЕНО: вынесена логика модалок, используются composables
 */

import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserProfile, useCurrentUser } from '@/composables/api/useUserProfile'
import { useDocumentTitle } from '@/composables/utils/useDocumentTitle'
import { useIntersectionObserver } from '@/composables/utils/useIntersectionObserver'
import { useSubscriptionsStore } from '@/stores/subscriptions.store'

// Components
import UserHeader from './UserHeader.vue'
import UserTabs from './UserTabs.vue'
import UserPins from './UserPins.vue'
import UserBoards from './UserBoards.vue'
import UserEditModal from './UserEditModal.vue'
import MediaUploadModal from '../MediaUploadModal.vue'
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
const subscriptionsStore = useSubscriptionsStore()

// ============ COMPOSABLES ============

const {
  user,
  userId,
  isCurrentUser,
  isFollowing,
  avatarUrl,
  isLoading,
  fetchUser,
  follow,
  unfollow,
} = useUserProfile(() => props.username)

const { bannerUrl } = useCurrentUser()

// Document title
const pageTitle = computed(() => user.value?.username || 'Profile')
useDocumentTitle(pageTitle)

// ============ TABS STATE ============

type TabType = 'created' | 'saved' | 'liked' | 'boards'
const activeTab = ref<TabType>('created')

// ============ MODALS STATE ============
// ✅ Группировка модалок в объект для чистоты

const modals = ref({
  followers: false,
  following: false,
  edit: false,
  avatar: false,
  banner: false,
  message: false,
  about: false,
})

function openModal(name: keyof typeof modals.value) {
  modals.value[name] = true
}

function closeModal(name: keyof typeof modals.value) {
  modals.value[name] = false
}

// ============ STICKY HEADER ============

const headerRef = ref<HTMLElement | null>(null)
const showStickyHeader = ref(false)

const { isIntersecting } = useIntersectionObserver(headerRef, {
  threshold: 0,
  rootMargin: '-80px 0px 0px 0px',
})

watch(isIntersecting, (visible) => {
  showStickyHeader.value = !visible
})

// ============ COUNTS ============

const followersCount = computed(() => {
  if (!userId.value) return 0
  return subscriptionsStore.getFollowers(userId.value)?.length || 0
})

const followingCount = computed(() => {
  if (!userId.value) return 0
  return subscriptionsStore.getFollowing(userId.value)?.length || 0
})

// ============ LIFECYCLE ============

onMounted(async () => {
  try {
    await fetchUser()

    // Load follower counts
    if (userId.value) {
      await Promise.all([
        subscriptionsStore.fetchFollowers(userId.value, 0, 1),
        subscriptionsStore.fetchFollowing(userId.value, 0, 1),
      ])
    }
  } catch (error) {
    console.error('[UserProfile] Failed to load user:', error)
    router.push('/not-found')
  }
})

// ============ HANDLERS ============

function handleTabChange(tab: TabType) {
  activeTab.value = tab
}

function handleSendMessage() {
  openModal('message')
}

function handleGoToChat() {
  router.push('/messages')
}

async function handleProfileUpdated() {
  await fetchUser()
}
</script>

<template>
  <!-- ============ MODALS ============ -->

  <FollowModal
    v-if="user"
    v-model="modals.followers"
    :user-id="user.id"
    type="followers"
    :count="followersCount"
  />

  <FollowModal
    v-if="user"
    v-model="modals.following"
    :user-id="user.id"
    type="following"
    :count="followingCount"
  />

  <UserEditModal
    v-if="user && isCurrentUser"
    v-model="modals.edit"
    :user="user"
    @updated="handleProfileUpdated"
  />

  <template>
    <!-- ✅ Один компонент вместо двух -->
    <MediaUploadModal
      v-if="isCurrentUser"
      v-model="modals.avatar"
      type="avatar"
      @uploaded="handleProfileUpdated"
    />

    <MediaUploadModal
      v-if="isCurrentUser"
      v-model="modals.banner"
      type="banner"
      @uploaded="handleProfileUpdated"
    />
  </template>

  <AboutUserModal
    v-if="user"
    v-model="modals.about"
    :user="user"
    :followers-count="followersCount"
    :following-count="followingCount"
    :is-current-user="isCurrentUser"
    :is-following="isFollowing"
    @show-followers="openModal('followers')"
    @show-following="openModal('following')"
    @send-message="handleSendMessage"
    @go-to-chat="handleGoToChat"
    @follow="follow()"
    @unfollow="unfollow()"
  />

  <SendMessageModal
    v-if="user"
    v-model="modals.message"
    :username="user.username"
    @send="(content) => console.log('Send:', content)"
  />

  <!-- ============ HEADER ============ -->

  <AppHeader />

  <!-- ============ MAIN CONTENT ============ -->

  <div class="flex items-center justify-center mt-20 ml-20">
    <!-- Loading -->
    <BaseLoader v-if="isLoading" variant="spinner" size="lg" color="red" />

    <div v-else-if="user" class="w-full max-w-6xl">
      <!-- Back button -->
      <BackButton position="absolute" class="ml-20 mt-20" />

      <!-- Sticky header -->
      <Transition name="slide-down">
        <div
          v-if="showStickyHeader"
          class="fixed left-20 right-0 top-14 w-full z-20 bg-white/80 backdrop-blur-sm border-b"
        >
          <div class="ml-[140px] flex items-center gap-4 py-2">
            <img
              v-if="avatarUrl"
              :src="avatarUrl"
              class="w-12 h-12 rounded-full object-cover"
              :alt="user.username"
            />
            <span class="text-2xl font-semibold text-black">{{ user.username }}</span>

            <div class="ml-auto mr-8">
              <UserTabs :active-tab="activeTab" variant="sticky" @change="handleTabChange" />
            </div>
          </div>
        </div>
      </Transition>

      <!-- Main header -->
      <div ref="headerRef">
        <UserHeader
          :user="user"
          :avatar-url="avatarUrl"
          :banner-url="bannerUrl"
          :followers-count="followersCount"
          :following-count="followingCount"
          :is-current-user="isCurrentUser"
          :is-following="isFollowing"
          @show-followers="openModal('followers')"
          @show-following="openModal('following')"
          @show-more-bio="openModal('about')"
          @send-message="handleSendMessage"
          @go-to-chat="handleGoToChat"
          @edit-profile="openModal('edit')"
          @edit-image="openModal('avatar')"
          @edit-banner="openModal('banner')"
        />
      </div>

      <!-- Tabs -->
      <div class="mt-6">
        <UserTabs :active-tab="activeTab" @change="handleTabChange" />
      </div>
    </div>
  </div>

  <!-- ============ TAB CONTENT ============ -->

  <div class="min-h-[500px]">
    <UserPins v-if="user && activeTab !== 'boards'" :user-id="user.id" :variant="activeTab" />

    <UserBoards v-if="user && activeTab === 'boards'" :user-id="user.id" />
  </div>
</template>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition:
    transform 0.3s ease,
    opacity 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
</style>
