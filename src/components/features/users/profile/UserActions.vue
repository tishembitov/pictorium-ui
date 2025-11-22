<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import BaseButton from '@/components/ui/BaseButton.vue'
import FollowButton from '../follow/FollowButton.vue'

export interface UserActionsProps {
  userId: string
  username: string
  hasChat?: boolean
}

const props = withDefaults(defineProps<UserActionsProps>(), {
  hasChat: false,
})

const emit = defineEmits<{
  (e: 'edit-profile'): void
  (e: 'send-message'): void
  (e: 'go-to-chat'): void
}>()

const authStore = useAuthStore()
const router = useRouter()

const isMe = computed(() => authStore.userId === props.userId)

const handleMessageClick = () => {
  if (props.hasChat) {
    emit('go-to-chat')
  } else {
    emit('send-message')
  }
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-3 mt-6">
    <!-- Edit Profile (для своего профиля) -->
    <BaseButton v-if="isMe" variant="secondary" size="md" @click="emit('edit-profile')">
      Edit Profile
    </BaseButton>

    <!-- Follow Button (для чужого профиля) -->
    <FollowButton v-if="!isMe" :user-id="userId" variant="primary" size="md" />

    <!-- Message Button (для чужого профиля) -->
    <BaseButton v-if="!isMe" variant="outline" size="md" @click="handleMessageClick">
      {{ hasChat ? 'Go to Chat' : 'Send Message' }}
    </BaseButton>
  </div>
</template>
