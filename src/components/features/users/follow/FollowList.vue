<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import FollowUserItem from './FollowUserItem.vue'
import BaseLoader from '@/components/ui/BaseLoader.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { useInfiniteScroll } from '@/composables/features/useInfiniteScroll'
import type { User } from '@/types'

export interface FollowListProps {
  userId: string
  type: 'followers' | 'following'
  fetchUsers: (page: number, size: number) => Promise<{ items: User[]; total: number }>
}

const props = defineProps<FollowListProps>()

const containerRef = ref<HTMLElement | null>(null)
const users = ref<User[]>([])
const isLoading = ref(false)
const currentPage = ref(0)
const hasMore = ref(true)
const pageSize = 20

const loadUsers = async () => {
  if (isLoading.value || !hasMore.value) return

  try {
    isLoading.value = true
    const response = await props.fetchUsers(currentPage.value, pageSize)

    users.value.push(...response.items)
    currentPage.value++
    hasMore.value = response.items.length === pageSize
  } catch (error) {
    console.error('[FollowList] Load users failed:', error)
  } finally {
    isLoading.value = false
  }
}

const handleScroll = (event: Event) => {
  const container = event.target as HTMLElement
  if (container.scrollTop + container.clientHeight >= container.scrollHeight - 10) {
    loadUsers()
  }
}

onMounted(() => {
  loadUsers()
})
</script>

<template>
  <div ref="containerRef" @scroll="handleScroll" class="overflow-y-auto max-h-[500px] px-2">
    <!-- Users List -->
    <div v-if="users.length > 0" class="space-y-2">
      <FollowUserItem v-for="user in users" :key="user.id" :user="user" />
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex justify-center py-4">
      <BaseLoader variant="spinner" size="md" />
    </div>

    <!-- Empty State -->
    <EmptyState
      v-if="!isLoading && users.length === 0"
      :title="`No ${type}`"
      icon="pi-users"
      variant="minimal"
    />
  </div>
</template>
