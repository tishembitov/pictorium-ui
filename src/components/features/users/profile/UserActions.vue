<!-- src/components/features/users/profile/UserActions.vue -->
<script setup lang="ts">
/**
 * UserActions - Follow, Message, Edit buttons
 * ✅ Чистый presentational компонент с slot для edit buttons
 */

import { ref } from 'vue'
import FollowButton from '../follow/FollowButton.vue'

export interface UserActionsProps {
  userId: string
  isCurrentUser: boolean
  isFollowing?: boolean
  hasChat?: boolean
}

withDefaults(defineProps<UserActionsProps>(), {
  isFollowing: false,
  hasChat: false,
})

const emit = defineEmits<{
  sendMessage: []
  goToChat: []
  editProfile: []
}>()

const showEditButtons = ref(false)
</script>

<template>
  <!-- For other users -->
  <div v-if="!isCurrentUser" class="flex flex-row gap-4 mt-4">
    <!-- Message button -->
    <button
      v-if="!hasChat"
      @click="emit('sendMessage')"
      class="px-6 py-3 bg-gray-300 hover:bg-gray-400 text-black rounded-2xl transition"
    >
      Send Message
    </button>
    <button
      v-else
      @click="emit('goToChat')"
      class="px-6 py-3 bg-gray-300 hover:bg-gray-400 text-black rounded-2xl transition"
    >
      Go to Chat
    </button>

    <!-- Follow button -->
    <FollowButton :user-id="userId" :initial-following="isFollowing" size="md" variant="primary" />
  </div>

  <!-- For current user (edit profile) -->
  <div v-else class="flex flex-col items-center mt-4">
    <button
      @click="showEditButtons = !showEditButtons"
      class="px-5 py-2 bg-red-600 text-white font-medium rounded-full transition duration-300 hover:bg-red-700 focus:outline-none"
    >
      Edit Profile
    </button>

    <!-- Edit sub-buttons -->
    <Transition name="slide-fade">
      <div v-if="showEditButtons" class="mt-4 flex flex-wrap gap-3 justify-center">
        <slot name="edit-buttons">
          <button
            @click="emit('editProfile')"
            class="px-5 py-2 bg-gray-100 text-gray-800 font-medium rounded-full transition duration-300 hover:bg-gray-200"
          >
            Information
          </button>
        </slot>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}
</style>
