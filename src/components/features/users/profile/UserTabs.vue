<!-- src/components/features/users/profile/UserTabs.vue -->
<script setup lang="ts">
/**
 * UserTabs - Created, Saved, Liked, Boards tabs
 * ✅ Чистый presentational компонент
 */

export interface UserTabsProps {
  activeTab: 'created' | 'saved' | 'liked' | 'boards'
  variant?: 'default' | 'sticky'
}

withDefaults(defineProps<UserTabsProps>(), {
  variant: 'default',
})

const emit = defineEmits<{
  change: [tab: 'created' | 'saved' | 'liked' | 'boards']
}>()

const tabs = [
  { id: 'created' as const, label: 'Created' },
  { id: 'saved' as const, label: 'Saved' },
  { id: 'liked' as const, label: 'Liked' },
  { id: 'boards' as const, label: 'Boards' },
]
</script>

<template>
  <div class="flex items-center justify-center gap-4" :class="variant === 'sticky' && 'py-2'">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      @click="emit('change', tab.id)"
      :class="[
        'relative px-6 py-2 text-black transition rounded-t-2xl animated-border',
        activeTab === tab.id && 'active scale-105',
        variant === 'default' && 'hover:bg-gray-100',
      ]"
    >
      {{ tab.label }}
    </button>
  </div>
</template>

<style scoped>
.animated-border {
  position: relative;
  transition:
    color 0.3s ease-in-out,
    transform 0.2s ease-out;
}

.animated-border::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 50%;
  width: 0;
  height: 2px;
  background-color: #ef4444;
  transition:
    width 0.3s ease-out,
    transform 0.3s ease-out;
  transform: translateX(-50%);
}

.active::after {
  width: 100%;
}

.animated-border:hover {
  color: #ef4444;
  transform: scale(1.05);
}

.animated-border:hover::after {
  width: 100%;
}
</style>
