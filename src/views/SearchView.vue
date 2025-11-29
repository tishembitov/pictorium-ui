<!-- src/views/SearchView.vue -->
<script setup lang="ts">
/**
 * SearchView - Поиск с TagSearchInput и UserCard
 */

import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePinsStore } from '@/stores/pins.store'
import { useUserSearch } from '@/composables/api/useUserSearch'
import { useDocumentTitle } from '@/composables/utils/useDocumentTitle'
import { useDebouncedRef } from '@/composables/utils/useDebounce'

import AppHeader from '@/components/common/AppHeader.vue'
import PinMasonry from '@/components/features/pins/PinMasonry.vue'
import PinGrid from '@/components/features/pins/PinGrid.vue'
import UserCard from '@/components/features/users/UserCard.vue'
import UserSearchItem from '@/components/features/users/UserSearchItem.vue'
import TagSearchInput from '@/components/features/tags/TagSearchInput.vue'
import TagList from '@/components/features/tags/TagList.vue'
import BaseLoader from '@/components/ui/BaseLoader.vue'
import EmptyState from '@/components/common/EmptyState.vue'

import type { PinGroup } from '@/components/features/pins/PinMasonry.vue'
import type { PinWithBlob, Tag } from '@/types'

const route = useRoute()
const router = useRouter()
const pinsStore = usePinsStore()

// ============ STATE ============

type SearchTab = 'pins' | 'users'
type ViewMode = 'masonry' | 'grid'

const activeTab = ref<SearchTab>('pins')
const viewMode = ref<ViewMode>('masonry')
const searchQuery = ref('')
const debouncedQuery = useDebouncedRef('', 300)
const pinGroups = ref<PinGroup[]>([])
const recentTags = ref<Tag[]>([])

// ============ COMPOSABLES ============

const { users, isLoading: isLoadingUsers, search: searchUsers, clear: clearUsers } = useUserSearch()

const pageTitle = computed(() => {
  if (searchQuery.value) {
    return `"${searchQuery.value}" - Search`
  }
  return 'Search'
})
useDocumentTitle(pageTitle)

// ============ COMPUTED ============

const feed = computed(() => pinsStore.feeds.get('search'))
const pins = computed(() => feed.value?.pins || [])
const isLoadingPins = computed(() => feed.value?.isLoading || false)
const hasMorePins = computed(() => feed.value?.hasMore ?? false)

const isEmpty = computed(() => {
  if (activeTab.value === 'pins') {
    return !isLoadingPins.value && pins.value.length === 0
  }
  return !isLoadingUsers.value && users.value.length === 0
})

// ============ METHODS ============

async function performSearch() {
  const query = debouncedQuery.value.trim()
  if (!query) {
    pinsStore.resetFeed('search')
    clearUsers()
    pinGroups.value = []
    return
  }

  router.replace({ query: { q: query } })

  if (activeTab.value === 'pins') {
    pinsStore.resetFeed('search')
    await pinsStore.fetchPins({ search: query }, 0, 20, 'search')

    if (pins.value.length > 0) {
      pinGroups.value = [
        {
          id: `search-${Date.now()}`,
          pins: pins.value as PinWithBlob[],
          showAllPins: false,
          loadedCount: 0,
        },
      ]
    }
  } else {
    await searchUsers(query)
  }
}

function handleTagSelect(tag: Tag) {
  searchQuery.value = tag.name
  performSearch()
}

function handleGroupLoaded(groupId: string) {
  const group = pinGroups.value.find((g) => g.id === groupId)
  if (group) group.showAllPins = true
}

function toggleViewMode() {
  viewMode.value = viewMode.value === 'masonry' ? 'grid' : 'masonry'
}

// ============ WATCHERS ============

watch(searchQuery, (value) => {
  debouncedQuery.value = value
})

watch(debouncedQuery, () => {
  performSearch()
})

watch(activeTab, () => {
  if (debouncedQuery.value) {
    performSearch()
  }
})

// ============ LIFECYCLE ============

onMounted(() => {
  const q = route.query.q
  if (typeof q === 'string') {
    searchQuery.value = q
  }
})
</script>

<template>
  <div class="min-h-screen">
    <AppHeader />

    <div class="ml-20 mt-20 px-8">
      <!-- Search Input с автокомплитом тегов -->
      <div class="max-w-2xl mx-auto mb-8">
        <TagSearchInput
          v-model="searchQuery"
          placeholder="Search pins, users, or tags..."
          size="lg"
          show-recent
          @select="handleTagSelect"
          @search="debouncedQuery = $event"
        />
      </div>

      <!-- Recent Tags -->
      <div v-if="recentTags.length > 0 && !searchQuery" class="max-w-2xl mx-auto mb-6">
        <h3 class="text-sm font-medium text-gray-500 mb-2">Recent searches</h3>
        <TagList :tags="recentTags" selectable size="sm" @select="handleTagSelect" />
      </div>

      <!-- Tabs & View Toggle -->
      <div class="flex justify-center items-center gap-4 mb-8">
        <div class="flex gap-2">
          <button
            @click="activeTab = 'pins'"
            :class="[
              'px-6 py-2 rounded-full font-medium transition',
              activeTab === 'pins' ? 'bg-black text-white' : 'bg-gray-100 hover:bg-gray-200',
            ]"
          >
            Pins
          </button>
          <button
            @click="activeTab = 'users'"
            :class="[
              'px-6 py-2 rounded-full font-medium transition',
              activeTab === 'users' ? 'bg-black text-white' : 'bg-gray-100 hover:bg-gray-200',
            ]"
          >
            Users
          </button>
        </div>

        <!-- View mode toggle (только для pins) -->
        <button
          v-if="activeTab === 'pins'"
          @click="toggleViewMode"
          class="p-2 rounded-lg hover:bg-gray-100 transition"
          :title="viewMode === 'masonry' ? 'Grid view' : 'Masonry view'"
        >
          <i :class="['pi', viewMode === 'masonry' ? 'pi-th-large' : 'pi-microsoft']" />
        </button>
      </div>

      <!-- Loading -->
      <div
        v-if="(activeTab === 'pins' && isLoadingPins) || (activeTab === 'users' && isLoadingUsers)"
        class="flex justify-center py-20"
      >
        <BaseLoader variant="colorful" size="lg" />
      </div>

      <!-- Empty States -->
      <EmptyState
        v-else-if="isEmpty && debouncedQuery"
        :title="`No ${activeTab} found`"
        message="Try a different search term"
        icon="pi-search"
      />

      <EmptyState
        v-else-if="!debouncedQuery"
        title="Search Pictorium"
        message="Find pins and users you love"
        icon="pi-search"
      />

      <!-- Pins Results -->
      <template v-else-if="activeTab === 'pins'">
        <!-- Masonry View -->
        <PinMasonry
          v-if="viewMode === 'masonry' && pinGroups.length > 0"
          :pin-groups="pinGroups"
          @group-loaded="handleGroupLoaded"
        />

        <!-- Grid View -->
        <PinGrid v-else-if="viewMode === 'grid'" :pins="pins as PinWithBlob[]" :columns="5" />
      </template>

      <!-- Users Results -->
      <div v-else-if="activeTab === 'users'" class="max-w-4xl mx-auto">
        <!-- Grid of UserCards -->
        <div class="grid grid-cols-3 gap-4">
          <UserCard
            v-for="user in users"
            :key="user.id"
            :user="user"
            :avatar-url="user.avatarBlobUrl"
            show-follow-button
          />
        </div>
      </div>
    </div>
  </div>
</template>
