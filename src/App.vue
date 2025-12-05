<!-- src/App.vue -->
<script setup lang="ts">
import { RouterView } from 'vue-router'
import LoadingScreen from '@/components/common/LoadingScreen.vue'
</script>

<template>
  <Suspense>
    <template #default>
      <RouterView />
    </template>
    <template #fallback>
      <LoadingScreen />
    </template>
  </Suspense>
</template>

<style>
/* Global transitions for route changes */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
