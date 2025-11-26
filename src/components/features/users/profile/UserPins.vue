<!-- src/components/features/users/profile/UserPins.vue -->
<script setup lang="ts">
/**
 * UserPins - Пины пользователя с infinite scroll
 * Использует: usePinsStore с page/size пагинацией
 */

import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { usePinsStore } from '@/stores/pins.store'
import BaseLoader from '@/components/ui/BaseLoader.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import type { PinWithBlob, PinScope, PinFilter } from '@/types'

export interface UserPinsProps {
  userId: string
  variant: 'created' | 'saved' | 'liked'
}

const props = defineProps<UserPinsProps>()

const emit = defineEmits<(e: 'delete', pinId: string) => void>()

// Store
const pinsStore = usePinsStore()

// State
const pins = ref<PinWithBlob[]>([])
const currentPage = ref(0)
const pageSize = ref(15)
const isLoading = ref(false)
const hasMore = ref(true)
const showNoPins = ref(false)

// Scope map
const scopeMap: Record<string, PinScope> = {
  created: 'CREATED' as PinScope,
  saved: 'SAVED' as PinScope,
  liked: 'LIKED' as PinScope,
}

// Build filter
function buildFilter(): PinFilter {
  return {
    authorId: props.variant === 'created' ? props.userId : undefined,
    savedBy: props.variant === 'saved' ? props.userId : undefined,
    likedBy: props.variant === 'liked' ? props.userId : undefined,
    scope: scopeMap[props.variant],
  }
}

// Fetch pins
async function fetchPins(page: number, reset = false) {
  if (isLoading.value || (!hasMore.value && !reset)) return

  if (reset) {
    pins.value = []
    currentPage.value = 0
    hasMore.value = true
    showNoPins.value = false
  }

  isLoading.value = true

  try {
    const filter = buildFilter()
    const feedType = props.variant as 'created' | 'saved' | 'liked'

    const loadedPins = await pinsStore.fetchPins(filter, page, pageSize.value, feedType)

    if (loadedPins.length === 0 && page === 0) {
      showNoPins.value = true
      return
    }

    if (loadedPins.length < pageSize.value) {
      hasMore.value = false
    }

    if (reset || page === 0) {
      pins.value = loadedPins
    } else {
      pins.value.push(...loadedPins)
    }

    currentPage.value = page
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
  fetchPins(currentPage.value + 1)
}

// Scroll handler for infinite scroll
function handleScroll() {
  const scrollTop = window.scrollY
  const scrollHeight = document.documentElement.scrollHeight
  const clientHeight = window.innerHeight

  if (scrollTop + clientHeight >= scrollHeight - 200) {
    handleLoadMore()
  }
}

// Delete handler
function handleDelete(pinId: string) {
  emit('delete', pinId)
  pins.value = pins.value.filter((p) => p.id !== pinId)
}

// Initial load
onMounted(() => {
  fetchPins(0, true)
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

// Watch for userId or variant changes
watch([() => props.userId, () => props.variant], () => {
  fetchPins(0, true)
})

// Empty state config
const emptyStateConfig = computed(() => {
  const configs = {
    created: {
      title: 'No pins created yet',
      icon: 'pi-plus-circle',
    },
    saved: {
      title: 'No saved pins',
      icon: 'pi-bookmark',
    },
    liked: {
      title: 'No liked pins',
      icon: 'pi-heart',
    },
  }
  return configs[props.variant]
})
</script>

<template>
  <div class="mt-10 ml-20">
    <!-- Loading -->
    <div v-if="isLoading && pins.length === 0" class="flex items-center justify-center py-12">
      <BaseLoader variant="spinner" size="lg" />
    </div>

    <!-- Pins Masonry Grid -->
    <div v-else-if="pins.length > 0" class="columns-5 gap-4 p-2">
      <div v-for="pin in pins" :key="pin.id" class="break-inside-avoid mb-4">
        <!-- Pin Card - используйте ваш PinCard компонент -->
        <div class="relative group">
          <img
            v-if="pin.imageBlobUrl && pin.isImage"
            :src="pin.imageBlobUrl"
            :alt="pin.title || 'Pin'"
            class="w-full rounded-3xl"
          />
          <video
            v-else-if="pin.videoBlobUrl || pin.isVideo"
            :src="pin.videoBlobUrl || pin.imageBlobUrl"
            class="w-full rounded-3xl"
            autoplay
            loop
            muted
          />
        </div>
        <p v-if="pin.title" class="mt-2 text-sm truncate">{{ pin.title }}</p>
      </div>
    </div>

    <!-- Loading more -->
    <div v-if="isLoading && pins.length > 0" class="flex justify-center py-8">
      <BaseLoader variant="spinner" size="md" />
    </div>

    <!-- Empty state (из старого проекта) -->
    <div v-if="showNoPins">
      <section class="text-center flex flex-col justify-center items-center relative">
        <h1 class="text-2xl font-bold mb-4">no pins</h1>
        <img
          class="h-72 rounded-xl"
          src="https://i.pinimg.com/736x/40/f1/b0/40f1b01bf3df9bc24bdbad4589125023.jpg"
          alt="not found image"
        />
      </section>
    </div>
  </div>
</template>
