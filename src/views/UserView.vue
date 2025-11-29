<!-- src/views/UserView.vue -->
<script setup lang="ts">
/**
 * UserView - Страница профиля пользователя
 *
 * Wrapper над UserProfile с route params
 */

import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import UserProfile from '@/components/features/users/profile/UserProfile.vue'

const route = useRoute()
const router = useRouter()

const username = computed(() => route.params.username as string)

// Redirect if no username
watch(
  username,
  (value) => {
    if (!value) {
      router.push('/')
    }
  },
  { immediate: true },
)
</script>

<template>
  <UserProfile v-if="username" :username="username" />
</template>
