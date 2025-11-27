<!-- frontend/src/components/auth/LoginButton.vue -->
<template>
  <button
    @click="handleLogin"
    :disabled="isLoading"
    :class="[
      'inline-flex items-center justify-center gap-2 font-semibold transition-all',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      variantClasses,
      sizeClasses,
      { 'opacity-50 cursor-not-allowed': isLoading },
    ]"
  >
    <!-- Loading spinner -->
    <svg v-if="isLoading" class="animate-spin -ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>

    <!-- Icon slot -->
    <slot name="icon" />

    <!-- Text -->
    <span>
      <slot>{{ isLoading ? 'Загрузка...' : 'Войти' }}</slot>
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuth } from '@/composables/auth/useAuth'

interface Props {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  redirectUri?: string
  /** Pre-fill email/username */
  loginHint?: string
  /** Сразу перейти на провайдера */
  provider?: 'google' | 'github'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
})

const emit = defineEmits<{
  click: []
}>()

const { login, loginWithGoogle, loginWithGitHub, isLoggingIn, getReturnUrl } = useAuth()

const isLoading = computed(() => isLoggingIn.value)

const variantClasses = computed(() => {
  const variants = {
    primary:
      'bg-pictorium-red text-white hover:bg-pictorium-red-hover focus:ring-pictorium-red/50 rounded-full',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500/50 rounded-full',
    outline:
      'border-2 border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500/50 rounded-full',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500/50 rounded-lg',
  }
  return variants[props.variant]
})

const sizeClasses = computed(() => {
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  }
  return sizes[props.size]
})

function handleLogin() {
  emit('click')

  const redirectUri = props.redirectUri || getReturnUrl()

  if (props.provider === 'google') {
    loginWithGoogle(redirectUri)
  } else if (props.provider === 'github') {
    loginWithGitHub(redirectUri)
  } else {
    login({ redirectUri, loginHint: props.loginHint })
  }
}
</script>
