<!-- src/components/layout/AppLayout.vue -->
<script setup lang="ts">
import { computed, provide } from 'vue'
import { useAuth } from '@/composables/auth/useAuth'

import Navigation from '@/components/common/Navigation.vue'
import ScrollToTop from '@/components/common/ScrollToTop.vue'

interface Props {
  showNavigation?: boolean
  showScrollTop?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showNavigation: true,
  showScrollTop: true,
})

const { isAuthenticated, isInitialized, userId, username } = useAuth()

// Navigation только для авторизованных
const showNav = computed(() => props.showNavigation && isAuthenticated.value)

const contentClasses = computed(() => {
  const classes: string[] = ['min-h-screen']
  if (showNav.value) classes.push('ml-20')
  return classes
})

provide('layout', { isAuthenticated, userId, username })
</script>

<template>
  <div class="relative">
    <!-- Navigation -->
    <Navigation v-if="showNav" />

    <!-- ✅ ИСПРАВЛЕНИЕ: RouterView вместо slot -->
    <main :class="contentClasses">
      <RouterView />
    </main>

    <!-- ScrollToTop -->
    <ScrollToTop v-if="showScrollTop" />
  </div>
</template>
