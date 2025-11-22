<script setup lang="ts">
import { ref, watch } from 'vue'
import BasePopover from '@/components/ui/BasePopover.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import LikeUserItem from '@/components/features/pin/likes/LikeUserItem.vue'
import { useCommentLikes } from '@/composables/api/useLikes'

export interface CommentLikesPopoverProps {
  commentId: string
  modelValue: boolean
  maxUsers?: number
}

const props = withDefaults(defineProps<CommentLikesPopoverProps>(), {
  modelValue: false,
  maxUsers: 5,
})

const emit = defineEmits<(e: 'update:modelValue', value: boolean) => void>()

const { likes, isLoading, fetchLikes } = useCommentLikes(props.commentId)

// Fetch when opened
watch(
  () => props.modelValue,
  async (isOpen) => {
    if (isOpen && likes.value.length === 0) {
      await fetchLikes(props.maxUsers)
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
      class="z-50 flex flex-col gap-2 bg-black shadow-2xl rounded-3xl text-sm text-white h-auto max-h-60 w-60 overflow-y-auto py-2"
    >
      <!-- Loading -->
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
      <div v-else class="text-center py-4 text-gray-400 text-xs">No likes</div>
    </div>
  </BasePopover>
</template>

<style scoped>
/* Custom scrollbar */
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
