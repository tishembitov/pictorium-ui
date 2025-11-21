<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseLoader from '@/components/ui/BaseLoader.vue'
import FollowUserItem from './FollowUserItem.vue'
import { useUsers } from '@/composables/api/useUsers'
import { useIntersectionObserver } from '@/composables/utils'

export interface FollowersModalProps {
  modelValue: boolean
  userId: string
  count: number
}

const props = defineProps<FollowersModalProps>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const { fetchFollowers } = useUsers()

const followers = ref<User[]>([])
const isLoading = ref(false)
const hasMore = ref(true)
const currentPage = ref(0)
const loadMoreRef = ref<HTMLElement | null>(null)

// Intersection observer for infinite scroll
const { isIntersecting } = useIntersectionObserver(loadMoreRef, {
  threshold: 0.1,
})

watch(isIntersecting, (intersecting) => {
  if (intersecting && hasMore.value && !isLoading.value) {
    loadMore()
  }
})

// Load initial followers when modal opens
watch(
  () => props.modelValue,
  async (isOpen) => {
    if (isOpen && followers.value.length === 0) {
      await loadFollowers()
    }
  },
)

const loadFollowers = async () => {
  try {
    isLoading.value = true
    const users = await fetchFollowers(props.userId, 0, 20)
    followers.value = users
    currentPage.value = 0
    hasMore.value = users.length === 20
  } catch (error) {
    console.error('[FollowersModal] Load failed:', error)
  } finally {
    isLoading.value = false
  }
}

const loadMore = async () => {
  if (!hasMore.value || isLoading.value) return

  try {
    isLoading.value = true
    const nextPage = currentPage.value + 1
    const users = await fetchFollowers(props.userId, nextPage, 20)

    followers.value.push(...users)
    currentPage.value = nextPage
    hasMore.value = users.length === 20
  } catch (error) {
    console.error('[FollowersModal] Load more failed:', error)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    size="md"
    :show-header="false"
    :show-footer="false"
  >
    <!-- Header -->
    <div class="flex flex-col items-center justify-center py-6 border-b border-gray-200">
      <h1 class="text-6xl font-bold mb-2">{{ count }}</h1>
      <p class="text-gray-600">{{ count === 1 ? 'Follower' : 'Followers' }}</p>
    </div>

    <!-- List -->
    <div class="py-4 max-h-[500px] overflow-y-auto">
      <!-- Loading initial -->
      <div v-if="isLoading && followers.length === 0" class="flex justify-center py-8">
        <BaseLoader variant="spinner" size="lg" />
      </div>

      <!-- Followers -->
      <div v-else-if="followers.length > 0" class="space-y-2 px-4">
        <FollowUserItem v-for="user in followers" :key="user.id" :user="user" />

        <!-- Load more trigger -->
        <div v-if="hasMore" ref="loadMoreRef" class="flex justify-center py-4">
          <BaseLoader v-if="isLoading" variant="spinner" size="md" />
        </div>

        <!-- End of list -->
        <div v-else class="text-center text-gray-500 text-sm py-4">No more followers</div>
      </div>

      <!-- Empty state -->
      <div v-else class="text-center py-8 text-gray-500">No followers yet</div>
    </div>
  </BaseModal>
</template>
