<script setup lang="ts">
import { ref, watch } from 'vue'
import BasePopover from '@/components/ui/BasePopover.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import LikeUserItem from './LikeUserItem.vue'
import { usePinLikes } from '@/composables/api/useLikes'

export interface PinLikesPopoverProps {
  pinId: string
  modelValue: boolean
  maxUsers?: number
}

const props = withDefaults(defineProps<PinLikesPopoverProps>(), {
  modelValue: false,
  maxUsers: 5,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const { likes, isLoading, fetchLikes } = usePinLikes(props.pinId)

// Fetch likes when popover opens
watch(
  () => props.modelValue,
  async (isOpen) => {
    if (isOpen && likes.value.length === 0) {
      await fetchLikes(0, props.maxUsers)
    }
  },
)
</script>

<template>
  <BasePopover
    :modelValue="modelValue"
    @update:modelValue="emit('update:modelValue', $event)"
    position="auto"
    :offset="10"
    trigger="hover"
    :closeOnClickOutside="true"
  >
    <template #trigger>
      <slot name="trigger" />
    </template>

    <!-- Popover content -->
    <div
      class="flex flex-col gap-2 bg-black shadow-2xl h-auto max-h-60 text-sm rounded-3xl text-white z-50 w-60 overflow-y-auto py-2"
    >
      <!-- Loading state -->
      <div v-if="isLoading" class="flex items-center justify-center py-4">
        <BaseSpinner size="sm" color="white" />
      </div>

      <!-- Users list -->
      <div v-else-if="likes.length > 0" class="px-2 space-y-2">
        <LikeUserItem
          v-for="user in likes"
          :key="user.id"
          :user="user"
          size="sm"
          class="text-white hover:text-white"
        />
      </div>

      <!-- Empty state -->
      <div v-else class="text-center py-4 text-gray-400">No likes yet</div>
    </div>
  </BasePopover>
</template>

<style scoped>
/* Custom scrollbar for dark background */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}
</style>
