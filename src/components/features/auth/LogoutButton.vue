<!-- src/components/auth/LogoutButton.vue -->
<template>
  <button
    @click="handleLogout"
    :disabled="!isAuthenticated"
    class="text-gray-600 hover:text-gray-900 transition-colors"
  >
    <slot>Выйти</slot>
  </button>
</template>

<script setup lang="ts">
import { useAuth } from '@/composables/auth/useAuth'

interface Props {
  redirectUri?: string
  confirmMessage?: string
}

const props = withDefaults(defineProps<Props>(), {
  confirmMessage: '',
})

const { logout, isAuthenticated } = useAuth()

function handleLogout() {
  if (props.confirmMessage) {
    if (!confirm(props.confirmMessage)) return
  }

  logout(props.redirectUri)
}
</script>
