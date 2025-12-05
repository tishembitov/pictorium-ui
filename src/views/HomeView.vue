<!-- src/views/HomeView.vue -->
<script setup lang="ts">
/**
 * HomeView - Главная страница с лентой пинов
 */

import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePinsStore } from '@/stores/pins.store'
import { useCategories } from '@/composables/api/useTagSearch'
import { useAuth } from '@/composables/auth/useAuth'
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

// ✅ Auth components
import LoginButton from '@/components/features/auth/LoginButton.vue'

import type { PinFilter, PinWithBlob } from '@/types'
import type { PinGroup } from '@/components/features/pins/PinMasonry.vue'
import type { TagFilterCategory } from '@/components/features/tags/TagsFilter.vue'

// ============ COMPOSABLES ============

const route = useRoute()
const router = useRouter()
const pinsStore = usePinsStore()
const { categories, fetch: fetchCategories, isLoading: isLoadingCategories } = useCategories()

// ✅ Auth
const { isAuthenticated, isInitialized, username, logout } = useAuth()

// ============ STATE ============

const selectedTag = ref<string | null>(null)
const pinGroups = ref<PinGroup[]>([])
const categoriesWithBlobs = ref<TagFilterCategory[]>([])

// Modals
const showBoardSelector = ref(false)
const showBoardCreate = ref(false)
const showAuthDropdown = ref(false)
const selectedPinId = ref<string | null>(null)

// ============ COMPUTED ============

const pageTitle = computed(() => {
  if (selectedTag.value && selectedTag.value !== 'Everything') {
    return `${selectedTag.value} - Pictorium`
  }
  return 'Pictorium'
})
useDocumentTitle(pageTitle)

const feed = computed(() => pinsStore.feeds.get('all'))
const pins = computed(() => feed.value?.pins || [])
const hasMore = computed(() => feed.value?.hasMore ?? true)
const isLoading = computed(() => feed.value?.isLoading || false)
const currentPage = computed(() => feed.value?.page ?? -1)
const isEmpty = computed(() => !isLoading.value && pins.value.length === 0)

// ============ METHODS ============

function buildFilter(): PinFilter {
  const filter: PinFilter = { scope: 'ALL' }

  if (selectedTag.value && selectedTag.value !== 'Everything') {
    filter.tags = [selectedTag.value]
  }

  return filter
}

async function loadPins(reset = false) {
  if (reset) {
    pinsStore.resetFeed('all')
    pinGroups.value = []
  }

  const filter = buildFilter()
  const page = reset ? 0 : currentPage.value + 1

  await pinsStore.fetchPins(filter, page, 20, 'all')

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

    if (cat.pin?.imageId) {
      try {
        const blob = await storageApi.downloadImage(cat.pin.imageId)
        item.previewBlobUrl = URL.createObjectURL(blob)
        item.isVideo = blob.type.startsWith('video/')
      } catch {
        // Preview URL будет загружен через composable
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

function handleLogout() {
  showAuthDropdown.value = false
  logout()
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
      <!-- ✅ Right side: Auth buttons -->
      <template #right>
        <div class="flex items-center gap-3">
          <!-- Board selector (только для авторизованных) -->
          <SelectedBoardBadge
            v-if="isAuthenticated"
            variant="badge"
            size="sm"
            @click="showBoardSelector = true"
          />

          <!-- Auth loading -->
          <div v-if="!isInitialized" class="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />

          <!-- Not authenticated -->
          <template v-else-if="!isAuthenticated">
            <LoginButton variant="outline" size="sm"> Log in </LoginButton>
            <LoginButton variant="primary" size="sm" provider="google">
              <template #icon>
                <svg class="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#fff"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#fff"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#fff"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#fff"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              </template>
              Sign up
            </LoginButton>
          </template>

          <!-- Authenticated - User menu -->
          <template v-else>
            <div class="relative">
              <button
                @click="showAuthDropdown = !showAuthDropdown"
                class="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-gray-100 transition"
              >
                <div
                  class="w-8 h-8 rounded-full bg-pictorium-red text-white flex items-center justify-center font-semibold text-sm"
                >
                  {{ username?.charAt(0)?.toUpperCase() || 'U' }}
                </div>
                <span class="hidden sm:inline text-sm font-medium text-gray-700">
                  {{ username }}
                </span>
                <i class="pi pi-chevron-down text-xs text-gray-500" />
              </button>

              <!-- Dropdown -->
              <Transition name="fade-scale">
                <div
                  v-if="showAuthDropdown"
                  class="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border py-2 z-50"
                  @click.stop
                >
                  <router-link
                    to="/profile"
                    class="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-gray-700"
                    @click="showAuthDropdown = false"
                  >
                    <i class="pi pi-user" />
                    Profile
                  </router-link>

                  <router-link
                    to="/settings"
                    class="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-gray-700"
                    @click="showAuthDropdown = false"
                  >
                    <i class="pi pi-cog" />
                    Settings
                  </router-link>

                  <hr class="my-2" />

                  <button
                    @click="handleLogout"
                    class="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-red-600"
                  >
                    <i class="pi pi-sign-out" />
                    Log out
                  </button>
                </div>
              </Transition>
            </div>

            <!-- Click outside to close -->
            <div
              v-if="showAuthDropdown"
              class="fixed inset-0 z-40"
              @click="showAuthDropdown = false"
            />
          </template>
        </div>
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

    <!-- FAB для создания доски (только для авторизованных) -->
    <button
      v-if="isAuthenticated"
      @click="showBoardCreate = true"
      class="fixed bottom-6 right-6 w-14 h-14 bg-pictorium-red text-white rounded-full shadow-lg hover:bg-pictorium-red-hover transition flex items-center justify-center"
      title="Create Board"
    >
      <i class="pi pi-plus text-xl" />
    </button>
  </div>
</template>

<style scoped>
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.15s ease;
}

.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(-4px);
}
</style>
