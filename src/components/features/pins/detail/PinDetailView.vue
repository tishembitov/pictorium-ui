<!-- src/components/features/pins/detail/PinDetailView.vue -->
<script setup lang="ts">
/**
 * PinDetailView - Главный контейнер детальной страницы пина
 * Использует: usePinDetail, useDocumentTitle, useIntersectionObserver, useMyBoards
 */

import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { usePinDetail } from '@/composables/api/usePinDetail'
import { useMyBoards } from '@/composables/api/useBoardDetail'
import { useSelectedBoard } from '@/composables/api/useSelectedBoard'
import { useDocumentTitle } from '@/composables/utils/useDocumentTitle'
import { useIntersectionObserver } from '@/composables/utils/useIntersectionObserver'
import PinDetailMedia from './PinDetailMedia.vue'
import PinDetailInfo from './PinDetailInfo.vue'
import PinFullscreen from './PinFullscreen.vue'
import PinDetailSkeleton from './PinDetailSkeleton.vue'
import RelatedPins from './RelatedPins.vue'
import PinLikesModal from '@/components/features/likes/PinLikesModal.vue'
import BackButton from '@/components/common/BackButton.vue'
import AppHeader from '@/components/common/AppHeader.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseLoader from '@/components/ui/BaseLoader.vue'

export interface PinDetailViewProps {
  pinId: string
}

const props = defineProps<PinDetailViewProps>()

const router = useRouter()

// Composables
const { pin, isLoading, fetchPin, like, unlike } = usePinDetail(() => props.pinId, {
  loadComments: false,
  loadRelated: false,
})

const { boards, fetch: fetchBoards, isLoading: isLoadingBoards } = useMyBoards()
const { select: selectBoard, deselect: deselectBoard } = useSelectedBoard()

// Refs
const mediaRef = ref<InstanceType<typeof PinDetailMedia> | null>(null)
const relatedObserverTarget = ref<HTMLElement | null>(null)

// State
const mediaLoaded = ref(false)
const showFullscreen = ref(false)
const showLikesModal = ref(false)
const showBoardsModal = ref(false)
const showExplore = ref(false)
const showMoreExplore = ref(true)

// Document title
const pageTitle = computed(() => pin.value?.title || 'Pin')
useDocumentTitle(pageTitle)

// Intersection observer for "More to explore" button
const { isIntersecting } = useIntersectionObserver(relatedObserverTarget, {
  threshold: [0, 0.2, 1],
})

watch(isIntersecting, (visible) => {
  showMoreExplore.value = !visible
})

// Accent color
const accentColor = computed(() => pin.value?.rgb || '#ef4444')

// Load pin on mount
onMounted(async () => {
  try {
    await fetchPin()
  } catch (error) {
    router.push('/not-found')
  }
})

// Handle like
async function handleLike() {
  try {
    await like()
    mediaRef.value?.triggerLikeAnimation()
  } catch (error) {
    console.error('[PinDetailView] Like failed:', error)
  }
}

async function handleUnlike() {
  try {
    await unlike()
    mediaRef.value?.triggerDislikeAnimation()
  } catch (error) {
    console.error('[PinDetailView] Unlike failed:', error)
  }
}

// Handle double tap on media
function handleDoubleTap() {
  if (pin.value && !pin.value.isLiked) {
    handleLike()
  }
}

// Media load handler
function handleMediaLoad() {
  mediaLoaded.value = true
}

// Fullscreen
function openFullscreen() {
  showFullscreen.value = true
}

// Board selector
async function openBoardSelector() {
  showBoardsModal.value = true
  if (boards.value.length === 0) {
    await fetchBoards()
  }
}

async function handleSelectBoard(board: any) {
  await selectBoard(board.id)
  showBoardsModal.value = false
}

async function handleSelectProfile() {
  await deselectBoard()
  showBoardsModal.value = false
}

// Tag click
function handleTagClick(tagName: string) {
  router.push({ path: '/', query: { tag: tagName } })
}

// Scroll to related
function scrollToRelated() {
  relatedObserverTarget.value?.scrollIntoView({ behavior: 'smooth' })
}

// Has related pins
function handleHasRelated() {
  showExplore.value = true
}
</script>

<template>
  <!-- "More to explore" floating button -->
  <Transition name="fade">
    <div
      v-if="showExplore && showMoreExplore"
      class="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-30"
    >
      <button
        @click="scrollToRelated"
        class="flex items-center gap-2 px-3 py-3 bg-white/60 backdrop-blur text-black rounded-full hover:bg-white transition-all duration-300 text-sm font-medium"
      >
        More to explore
        <svg
          class="w-4 h-4 text-black transition-transform group-hover:translate-y-1"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>
  </Transition>

  <!-- Fullscreen image viewer -->
  <PinFullscreen
    v-if="pin?.imageBlobUrl"
    v-model="showFullscreen"
    :src="pin.imageBlobUrl"
    :pin-id="pin.id"
    :rgb="accentColor"
    @open-board-selector="openBoardSelector"
  />

  <!-- Likes modal -->
  <PinLikesModal v-if="pin" v-model="showLikesModal" :pin-id="pin.id" :like-count="pin.likeCount" />

  <!-- Board selector modal -->
  <BaseModal v-model="showBoardsModal" size="lg" :show-header="false" :show-footer="false">
    <div v-if="isLoadingBoards" class="min-h-[300px] flex items-center justify-center">
      <BaseLoader variant="spinner" size="lg" />
    </div>

    <div v-else class="p-6">
      <h2 class="text-xl font-semibold mb-4 text-center text-black">Choose where to save</h2>
      <div class="flex justify-center">
        <button
          @click="handleSelectProfile"
          class="w-1/2 px-6 py-3 text-md bg-gray-800 hover:bg-black text-white rounded-3xl transition cursor-pointer"
        >
          Profile
        </button>
      </div>

      <h2 class="text-xl font-semibold mb-4 mt-4 text-center text-black">Boards</h2>

      <div class="columns-2 gap-4">
        <div
          v-for="board in boards"
          :key="board.id"
          class="mb-4 break-inside-avoid relative rounded-md cursor-pointer min-h-24 overflow-hidden transform transition-transform hover:scale-105"
          @click="handleSelectBoard(board)"
        >
          <div class="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <h3
              class="text-3xl font-semibold text-white text-center px-4 py-2 bg-black/70 rounded-lg shadow-lg"
            >
              {{ board.title }}
            </h3>
          </div>

          <div class="columns-2 gap-1 relative z-0">
            <div
              v-for="(boardPin, index) in board.pins?.slice(0, 4)"
              :key="index"
              class="mb-2 break-inside-avoid"
            >
              <img
                v-if="boardPin.isImage"
                :src="boardPin.imageBlobUrl"
                :alt="boardPin.title || 'Pin'"
                class="w-full object-cover rounded-md"
              />
              <video
                v-else-if="boardPin.isVideo"
                :src="boardPin.videoBlobUrl"
                class="w-full object-cover rounded-md"
                autoplay
                loop
                muted
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </BaseModal>

  <!-- Header -->
  <AppHeader />

  <div class="ml-20 mt-20">
    <!-- Back button -->
    <BackButton position="absolute" class="ml-20 mt-20" />

    <!-- Loading skeleton -->
    <div v-if="isLoading && !pin">
      <PinDetailSkeleton />
    </div>

    <!-- Main content -->
    <div
      v-show="mediaLoaded"
      class="grid grid-cols-2 gap-10 mx-60 bg-gray-100 rounded-3xl"
      :style="{
        boxShadow: `0 0 30px 15px ${accentColor}`,
      }"
    >
      <!-- Left column: Media -->
      <div>
        <PinDetailMedia
          v-if="pin"
          ref="mediaRef"
          :image-src="pin.imageBlobUrl"
          :video-src="pin.videoBlobUrl"
          :alt="pin.title || 'Pin'"
          :rgb="pin.rgb"
          :href="pin.href"
          :is-gif="pin.isGif"
          @load="handleMediaLoad"
          @open-fullscreen="openFullscreen"
          @double-tap="handleDoubleTap"
        />
      </div>

      <!-- Right column: Info -->
      <div v-if="pin" v-show="!isLoading">
        <PinDetailSkeleton v-if="isLoading" variant="info-only" />

        <PinDetailInfo
          v-else
          :pin="pin"
          @like="handleLike"
          @unlike="handleUnlike"
          @show-likes-modal="showLikesModal = true"
          @open-board-selector="openBoardSelector"
          @tag-click="handleTagClick"
        />
      </div>
    </div>
  </div>

  <!-- Related pins -->
  <div ref="relatedObserverTarget">
    <RelatedPins v-if="mediaLoaded && pin" :pin-id="pin.id" @has-related="handleHasRelated" />
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
