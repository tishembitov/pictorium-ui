<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import LikeUserItem from './LikeUserItem.vue'
import { usePinLikes } from '@/composables/api/useLikes'
import { useIntersectionObserver } from '@/composables/utils'

export interface PinLikesModalProps {
  pinId: string
  modelValue: boolean
  likeCount: number
}

const props = withDefaults(defineProps<PinLikesModalProps>(), {
  modelValue: false,
  likeCount: 0,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const { likes, isLoading, hasMore, fetchLikes, loadMore } = usePinLikes(props.pinId)

// Load more trigger element
const loadMoreRef = ref<HTMLElement | null>(null)

// Intersection observer for infinite scroll
const { isIntersecting } = useIntersectionObserver(loadMoreRef, {
  threshold: 0.1,
})

// Load more when intersecting
watch(isIntersecting, (intersecting) => {
  if (intersecting && hasMore.value && !isLoading.value) {
    loadMore()
  }
})

// Initial fetch when modal opens
watch(
  () => props.modelValue,
  async (isOpen) => {
    if (isOpen && likes.value.length === 0) {
      await fetchLikes()
    }
  },
)
</script>

<template>
  <BaseModal
    :modelValue="modelValue"
    @update:modelValue="emit('update:modelValue', $event)"
    size="md"
    :closable="true"
    :closeOnOverlay="true"
    :showHeader="false"
    :maxHeight="true"
  >
    <!-- Custom header with likes count -->
    <div class="flex flex-col items-center justify-center py-6 border-b border-gray-200">
      <h1 class="text-6xl font-bold mb-2">{{ likeCount }} ❤️</h1>
      <p class="text-gray-600">{{ likeCount === 1 ? 'Like' : 'Likes' }}</p>
    </div>

    <!-- Users list -->
    <div class="py-4">
      <!-- Loading initial -->
      <div v-if="isLoading && likes.length === 0" class="flex justify-center py-8">
        <BaseSpinner size="lg" color="red" />
      </div>

      <!-- Users -->
      <div v-else-if="likes.length > 0" class="space-y-4">
        <LikeUserItem v-for="user in likes" :key="user.id" :user="user" size="lg" class="px-4" />

        <!-- Load more trigger -->
        <div v-if="hasMore" ref="loadMoreRef" class="flex justify-center py-4">
          <BaseSpinner size="md" color="red" />
        </div>

        <!-- End of list -->
        <div v-else class="text-center text-gray-500 text-sm py-4">No more likes</div>
      </div>

      <!-- Empty state -->
      <EmptyState
        v-else
        title="No likes yet"
        message="Be the first to like this pin!"
        icon="pi-heart"
        variant="minimal"
      />
    </div>
  </BaseModal>
</template>
