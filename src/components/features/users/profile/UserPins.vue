<!-- src/components/features/user/profile/UserPins.vue -->
<script setup lang="ts">
/**
 * UserPins - Пины пользователя с infinite scroll
 * Использует: usePinsStore, PinMasonry
 */

import { ref, watch, onMounted, onBeforeUnmount, onActivated, onDeactivated } from 'vue'
import { usePinsStore } from '@/stores/pins.store'
import PinMasonry from '@/components/features/pins/PinMasonry.vue'
import type { PinGroup } from '@/components/features/pins/PinMasonry.vue'
import type { PinWithBlob } from '@/types'

export interface UserPinsProps {
  userId: string
  variant: 'created' | 'saved' | 'liked'
  authUserId?: string
}

const props = defineProps<UserPinsProps>()

const emit = defineEmits<{
  (e: 'delete', pinId: string): void
}>()

// Store
const pinsStore = usePinsStore()

// State
const pinGroups = ref<PinGroup[]>([])
const isLoading = ref(false)
const hasMore = ref(true)
const page = ref(0)
const showNoPins = ref(false)

// Fetch pins based on variant
async function fetchPins(pageNum: number, reset = false) {
  if (isLoading.value || (!hasMore.value && !reset)) return

  isLoading.value = true

  try {
    const filter = {
      authorId: props.variant === 'created' ? props.userId : undefined,
      savedBy: props.variant === 'saved' ? props.userId : undefined,
      likedBy: props.variant === 'liked' ? props.userId : undefined,
      scope: props.variant.toUpperCase() as 'CREATED' | 'SAVED' | 'LIKED',
    }

    const pins = await pinsStore.fetchPins(filter, pageNum, 15)

    if (pins.length === 0 && pageNum === 0) {
      showNoPins.value = true
      return
    }

    if (pins.length < 15) {
      hasMore.value = false
    }

    const groupId = `group-${pageNum}-${Date.now()}`

    if (reset) {
      pinGroups.value = [{ id: groupId, pins, showAllPins: false }]
    } else {
      pinGroups.value.push({ id: groupId, pins, showAllPins: false })
    }

    page.value = pageNum
    showNoPins.value = false
  } catch (error) {
    console.error('[UserPins] Failed to fetch pins:', error)
  } finally {
    isLoading.value = false
  }
}

// Load more
function handleLoadMore() {
  if (!hasMore.value || isLoading.value) return
  fetchPins(page.value + 1)
}

// Group loaded handler
function handleGroupLoaded(groupId: string) {
  const group = pinGroups.value.find((g) => g.id === groupId)
  if (group) {
    group.showAllPins = true
  }
}

// Delete handler
function handleDelete(pinId: string) {
  emit('delete', pinId)
}

// Initial load
onMounted(() => {
  fetchPins(0, true)
})

// Watch for userId or variant changes
watch([() => props.userId, () => props.variant], () => {
  pinGroups.value = []
  page.value = 0
  hasMore.value = true
  showNoPins.value = false
  fetchPins(0, true)
})

// Determine card variant
const cardVariant = props.variant === 'saved' ? 'saved' : 'created'
</script>

<template>
  <!-- Masonry grid -->
  <PinMasonry
    v-if="pinGroups.length > 0"
    :pin-groups="pinGroups"
    :variant="cardVariant"
    :empty-title="`No ${variant} pins`"
    @group-loaded="handleGroupLoaded"
    @load-more="handleLoadMore"
    @delete="handleDelete"
  />

  <!-- No pins message -->
  <div v-if="showNoPins" class="mt-10">
    <section class="text-center flex flex-col justify-center items-center relative">
      <h1 class="text-2xl font-bold mb-4">no pins</h1>
      <img
        class="h-72 rounded-xl"
        src="https://i.pinimg.com/736x/40/f1/b0/40f1b01bf3df9bc24bdbad4589125023.jpg"
        alt="not found image"
      />
    </section>
  </div>
</template>
