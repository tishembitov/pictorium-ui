<!-- src/components/features/pins/detail/PinDetailSkeleton.vue -->
<script setup lang="ts">
/**
 * PinDetailSkeleton - Loading skeleton для детальной страницы
 * Использует: BaseSkeleton, BaseLoader
 */

import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'
import BaseLoader from '@/components/ui/BaseLoader.vue'

export interface PinDetailSkeletonProps {
  variant?: 'full' | 'info-only'
}

withDefaults(defineProps<PinDetailSkeletonProps>(), {
  variant: 'full',
})
</script>

<template>
  <!-- Full page skeleton -->
  <div v-if="variant === 'full'" class="grid grid-cols-2 gap-10 mx-60 bg-gray-100 rounded-3xl p-6">
    <!-- Left column: Media skeleton -->
    <div class="flex justify-center items-center">
      <BaseSkeleton variant="rounded" width="100%" :height="500" animation="pulse" />
    </div>

    <!-- Right column: Info skeleton -->
    <div class="flex flex-col space-y-4 p-4">
      <!-- Actions row -->
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <BaseSkeleton variant="circular" :width="32" :height="32" />
          <BaseSkeleton variant="text" :width="50" height="1.5rem" />
        </div>
        <div class="flex gap-2">
          <BaseSkeleton variant="rounded" :width="100" :height="44" />
          <BaseSkeleton variant="rounded" :width="80" :height="44" />
        </div>
      </div>

      <!-- Title -->
      <BaseSkeleton variant="text" width="70%" height="2rem" />

      <!-- Description -->
      <div class="space-y-2">
        <BaseSkeleton variant="text" width="100%" height="1rem" />
        <BaseSkeleton variant="text" width="85%" height="1rem" />
        <BaseSkeleton variant="text" width="60%" height="1rem" />
      </div>

      <!-- Tags -->
      <div class="flex flex-wrap gap-2 mt-4">
        <BaseSkeleton v-for="i in 4" :key="i" variant="rounded" :width="80" :height="32" />
      </div>

      <!-- User info -->
      <div class="flex items-center mt-4 gap-3">
        <BaseSkeleton variant="circular" :width="40" :height="40" />
        <BaseSkeleton variant="text" :width="120" height="1rem" />
      </div>

      <!-- Comments section -->
      <div class="mt-6 space-y-3">
        <BaseSkeleton variant="text" :width="150" height="1.5rem" />
        <BaseSkeleton variant="rounded" width="100%" :height="48" />
      </div>
    </div>
  </div>

  <!-- Info only skeleton -->
  <div v-else class="flex flex-col w-full h-full p-2">
    <div class="flex items-center justify-center w-full h-full">
      <BaseLoader variant="spinner" size="lg" />
    </div>
  </div>
</template>
