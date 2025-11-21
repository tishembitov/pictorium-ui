<script setup lang="ts">
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'
</script>

<template>
  <div class="flex items-start justify-center min-h-screen p-6 pt-20">
    <div
      class="flex flex-col lg:flex-row gap-8 w-full max-w-7xl bg-white rounded-3xl shadow-2xl overflow-hidden p-6"
    >
      <!-- Left: Media Skeleton -->
      <div class="lg:w-1/2 flex flex-col gap-4">
        <!-- Main image skeleton -->
        <BaseSkeleton variant="rounded" height="600px" width="100%" animation="wave" />
      </div>

      <!-- Right: Info Skeleton -->
      <div class="lg:w-1/2 flex flex-col gap-4">
        <!-- Actions row skeleton -->
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <BaseSkeleton variant="circular" width="40px" height="40px" />
            <BaseSkeleton variant="circular" width="40px" height="40px" />
          </div>
          <BaseSkeleton variant="rounded" width="100px" height="40px" />
        </div>

        <!-- Title skeleton -->
        <BaseSkeleton variant="text" width="80%" height="32px" />
        <BaseSkeleton variant="text" width="60%" height="32px" />

        <!-- Description skeleton -->
        <div class="space-y-2 mt-4">
          <BaseSkeleton variant="text" width="100%" height="16px" count="3" />
          <BaseSkeleton variant="text" width="70%" height="16px" />
        </div>

        <!-- Tags skeleton -->
        <div class="flex gap-2 mt-4">
          <BaseSkeleton variant="rounded" width="80px" height="28px" />
          <BaseSkeleton variant="rounded" width="100px" height="28px" />
          <BaseSkeleton variant="rounded" width="90px" height="28px" />
        </div>

        <!-- Stats skeleton -->
        <div class="flex gap-6 mt-6">
          <BaseSkeleton variant="text" width="60px" height="20px" />
          <BaseSkeleton variant="text" width="60px" height="20px" />
          <BaseSkeleton variant="text" width="60px" height="20px" />
        </div>

        <!-- Divider -->
        <div class="border-t my-6"></div>

        <!-- User info skeleton -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <BaseSkeleton variant="circular" width="48px" height="48px" />
            <div class="space-y-2">
              <BaseSkeleton variant="text" width="120px" height="16px" />
              <BaseSkeleton variant="text" width="80px" height="14px" />
            </div>
          </div>
          <BaseSkeleton variant="rounded" width="90px" height="36px" />
        </div>

        <!-- Divider -->
        <div class="border-t my-6"></div>

        <!-- Like button skeleton -->
        <div class="flex items-center gap-4">
          <BaseSkeleton variant="circular" width="40px" height="40px" />
          <BaseSkeleton variant="text" width="60px" height="24px" />
        </div>

        <!-- Divider -->
        <div class="border-t my-6"></div>

        <!-- Comments skeleton -->
        <div class="space-y-4">
          <BaseSkeleton variant="text" width="120px" height="20px" />

          <!-- Comment items -->
          <div v-for="i in 3" :key="i" class="flex gap-3">
            <BaseSkeleton variant="circular" width="32px" height="32px" />
            <div class="flex-1 space-y-2">
              <BaseSkeleton variant="text" width="100px" height="14px" />
              <BaseSkeleton variant="text" width="100%" height="12px" count="2" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
