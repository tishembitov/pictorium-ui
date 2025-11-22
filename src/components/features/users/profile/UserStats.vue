<script setup lang="ts">
export interface UserStatsProps {
  followersCount: number
  followingCount: number
  pinsCount?: number
  clickable?: boolean
}

const props = withDefaults(defineProps<UserStatsProps>(), {
  pinsCount: 0,
  clickable: true,
})

const emit = defineEmits<{
  (e: 'followers-click'): void
  (e: 'following-click'): void
}>()
</script>

<template>
  <div class="flex items-center gap-4 text-sm md:text-base">
    <button
      v-if="followersCount > 0"
      @click="emit('followers-click')"
      :class="[
        'font-bold text-gray-900 transition-all duration-200',
        clickable && 'hover:underline cursor-pointer hover:scale-105',
      ]"
    >
      {{ followersCount }} <span class="font-normal text-gray-600">followers</span>
    </button>

    <button
      v-if="followingCount > 0"
      @click="emit('following-click')"
      :class="[
        'font-bold text-gray-900 transition-all duration-200',
        clickable && 'hover:underline cursor-pointer hover:scale-105',
      ]"
    >
      {{ followingCount }} <span class="font-normal text-gray-600">following</span>
    </button>

    <div v-if="pinsCount > 0" class="font-bold text-gray-900">
      {{ pinsCount }} <span class="font-normal text-gray-600">pins</span>
    </div>
  </div>
</template>
