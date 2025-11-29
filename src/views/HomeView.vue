<!-- src/views/HomeView.vue -->
<script setup lang="ts">
/**
 * HomeView - Главная страница с лентой пинов
 */

import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePinsStore } from '@/stores/pins.store'
import { useCategories } from '@/composables/api/useTagSearch'
import { useDocumentTitle } from '@/composables/utils/useDocumentTitle'
import { storageApi } from '@/api'
import { isVideoUrl } from '@/utils/media'
import { randomTagColor } from '@/utils/colors'

// Components
import AppHeader from '@/components/common/AppHeader.vue'
import TagsFilter from '@/components/features/tags/TagsFilter.vue'
import PinMasonry from '@/components/features/pins/PinMasonry.vue'
import BoardSelectorModal from '@/components/features/boards/BoardSelectorModal.vue'
import BoardCreateModal from '@/components/features/boards/BoardCreateModal.vue'
import SelectedBoardBadge from '@/components/features/boards/SelectedBoardBadge.vue'
import BaseLoader from '@/components/ui/BaseLoader.vue'
import EmptyState from '@/components/common/EmptyState.vue'

import type { PinFilter, PinWithBlob } from '@/types'
import type { PinGroup } from '@/components/features/pins/PinMasonry.vue'
import type { TagFilterCategory } from '@/components/features/tags/TagsFilter.vue'

// ============ COMPOSABLES ============

const route = useRoute()
const router = useRouter()
const pinsStore = usePinsStore()
const { categories, fetch: fetchCategories, isLoading: isLoadingCategories } = useCategories()

const pageTitle = computed(() => {
  if (selectedTag.value && selectedTag.value !== 'Everything') {
    return `${selectedTag.value} - Pictorium`
  }
  return 'Pictorium'
})
useDocumentTitle(pageTitle)

// ============ STATE ============

const selectedTag = ref<string | null>(null)
const pinGroups = ref<PinGroup[]>([])
const categoriesWithBlobs = ref<TagFilterCategory[]>([])

// Modals
const showBoardSelector = ref(false)
const showBoardCreate = ref(false)
const selectedPinId = ref<string | null>(null)

// ============ COMPUTED ============

const feed = computed(() => pinsStore.feeds.get('home'))
const pins = computed(() => feed.value?.pins || [])
const hasMore = computed(() => feed.value?.hasMore ?? true)
const isLoading = computed(() => feed.value?.isLoading || false)
const currentPage = computed(() => feed.value?.page ?? -1)
const isEmpty = computed(() => !isLoading.value && pins.value.length === 0)

// ============ METHODS ============

function buildFilter(): PinFilter {
  const filter: PinFilter = { scope: 'ALL' }
  if (selectedTag.value && selectedTag.value !== 'Everything') {
    filter.tag = selectedTag.value
  }
  return filter
}

async function loadPins(reset = false) {
  if (reset) {
    pinsStore.resetFeed('home')
    pinGroups.value = []
  }

  const filter = buildFilter()
  const page = reset ? 0 : currentPage.value + 1

  await pinsStore.fetchPins(filter, page, 20, 'home')

  const newPins = pins.value.slice(page * 20)
  if (newPins.length > 0) {
    pinGroups.value.push({
      id: `group-${Date.now()}`,
      pins: newPins as PinWithBlob[],
      showAllPins: false,
      loadedCount: 0,
    })
  }
}

async function loadCategories() {
  await fetchCategories(20)

  const withBlobs: TagFilterCategory[] = []

  for (const cat of categories.value) {
    const item: TagFilterCategory = {
      id: cat.tagId,
      name: cat.tagName,
      color: randomTagColor(),
    }

    if (cat.pin?.imageUrl) {
      try {
        const blob = await storageApi.downloadImage(cat.pin.imageUrl)
        item.previewBlobUrl = URL.createObjectURL(blob)
        item.isVideo = blob.type.startsWith('video/') || isVideoUrl(cat.pin.imageUrl)
      } catch {
        item.previewUrl = cat.pin.imageUrl
      }
    }

    withBlobs.push(item)
  }

  categoriesWithBlobs.value = withBlobs
}

function handleTagSelect(tagName: string) {
  if (tagName === 'Everything') {
    selectedTag.value = null
    router.push({ path: '/', query: {} })
  } else {
    selectedTag.value = tagName
    router.push({ path: '/', query: { tag: tagName } })
  }
}

function handleGroupLoaded(groupId: string) {
  const group = pinGroups.value.find((g) => g.id === groupId)
  if (group) {
    group.showAllPins = true
  }
}

function handleLoadMore() {
  if (hasMore.value && !isLoading.value) {
    loadPins(false)
  }
}

function handleOpenBoardSelector(pinId: string) {
  selectedPinId.value = pinId
  showBoardSelector.value = true
}

function handleBoardCreated(boardId: string) {
  showBoardCreate.value = false
}

// ============ WATCHERS ============

watch(
  () => route.query.tag,
  (tag) => {
    const tagValue = typeof tag === 'string' ? tag : null
    if (tagValue !== selectedTag.value) {
      selectedTag.value = tagValue
      loadPins(true)
    }
  },
  { immediate: true },
)

// ============ LIFECYCLE ============

onMounted(async () => {
  await Promise.all([loadCategories(), loadPins(true)])
})
</script>

<template>
  <div class="min-h-screen">
    <AppHeader>
      <!-- Selected Board Badge в header -->
      <template #actions>
        <SelectedBoardBadge variant="badge" size="sm" @click="showBoardSelector = true" />
      </template>
    </AppHeader>

    <!-- Modals -->
    <BoardSelectorModal v-model="showBoardSelector" @select="showBoardSelector = false" />

    <BoardCreateModal v-model="showBoardCreate" @created="handleBoardCreated" />

    <!-- Tags Filter -->
    <div class="fixed top-14 left-20 right-0 z-20 bg-white py-2">
      <TagsFilter
        :categories="categoriesWithBlobs"
        :selected-tag="selectedTag"
        :loading="isLoadingCategories"
        show-everything
        @select="handleTagSelect"
      />
    </div>

    <!-- Main Content -->
    <div class="pt-32 ml-20">
      <div v-if="isLoading && pinGroups.length === 0" class="flex justify-center py-20">
        <BaseLoader variant="colorful" size="lg" />
      </div>

      <EmptyState
        v-else-if="isEmpty"
        :title="selectedTag ? `No pins for '${selectedTag}'` : 'No pins yet'"
        message="Be the first to create a pin!"
        action-text="Create Pin"
        @action="router.push('/create')"
      />

      <PinMasonry
        v-else
        :pin-groups="pinGroups"
        :show-user="true"
        variant="default"
        @group-loaded="handleGroupLoaded"
        @load-more="handleLoadMore"
        @open-board-selector="handleOpenBoardSelector"
      />
    </div>

    <!-- FAB для создания доски -->
    <button
      @click="showBoardCreate = true"
      class="fixed bottom-6 right-6 w-14 h-14 bg-pictorium-red text-white rounded-full shadow-lg hover:bg-pictorium-red-hover transition flex items-center justify-center"
      title="Create Board"
    >
      <i class="pi pi-plus text-xl" />
    </button>
  </div>
</template>
