<!-- src/components/features/pins/detail/PinDetailView.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { usePinDetail } from '@/composables/api/usePinDetail'
import { useBoards } from '@/composables/api/useBoards'
import { useDocumentTitle } from '@/composables/utils/useDocumentTitle'
import { useIntersectionObserver } from '@/composables/utils/useIntersectionObserver'
import PinDetailMedia from './PinDetailMedia.vue'
import PinDetailInfo from './PinDetailInfo.vue'
import PinFullscreen from './PinFullscreen.vue'
import PinDetailSkeleton from './PinDetailSkeleton.vue'
import RelatedPins from './RelatedPins.vue'
import PinLikesModal from '@/components/features/likes/PinLikesModal.vue'
import BoardSelectorModal from '@/components/features/boards/BoardSelectorModal.vue'
import BackButton from '@/components/common/BackButton.vue'
import AppHeader from '@/components/common/AppHeader.vue'

export interface PinDetailViewProps {
  pinId: string
}

const props = defineProps<PinDetailViewProps>()

const router = useRouter()

// ✅ ИСПРАВЛЕНО: правильный composable
const { pin, isLoading, fetchPin, like, unlike } = usePinDetail(() => props.pinId)
const { myBoards, isLoading: isLoadingBoards, fetchMyBoards } = useBoards()

// Refs
const mediaRef = ref<InstanceType<typeof PinDetailMedia> | null>(null)
const relatedObserverTarget = ref<HTMLElement | null>(null)

// State
const pinImageLoaded = ref(false)
const pinVideoLoaded = ref(false)
const showFullscreen = ref(false)
const showLikesModal = ref(false)
const showBoardsModal = ref(false)
const showExplore = ref(false)
const showMoreExplore = ref(true)

// Document title
const pageTitle = computed(() => pin.value?.title || 'Pin')
useDocumentTitle(pageTitle)

// Intersection observer
const { isIntersecting } = useIntersectionObserver(relatedObserverTarget, {
  threshold: [0, 0.2, 1],
})

watch(isIntersecting, (visible) => {
  showMoreExplore.value = !visible
})

// Media loaded state
const mediaLoaded = computed(() => pinImageLoaded.value || pinVideoLoaded.value)

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

// Handle double tap
function handleDoubleTap() {
  if (pin.value && !pin.value.isLiked) {
    handleLike()
  }
}

// Media load handlers
function handleMediaLoad() {
  if (pin.value?.videoPreviewId) {
    pinVideoLoaded.value = true
  } else {
    pinImageLoaded.value = true
  }
}

// Fullscreen
function openFullscreen() {
  showFullscreen.value = true
}

// Board selector
async function openBoardSelector() {
  showBoardsModal.value = true
  if (myBoards.value.length === 0) {
    await fetchMyBoards()
  }
}

// Tag click
function handleTagClick(tagName: string) {
  router.push(`/?tag=${tagName}`)
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
          class="w-4 h-4 text-black"
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

  <!-- Fullscreen -->
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
  <BoardSelectorModal v-model="showBoardsModal" @select="() => (showBoardsModal = false)" />

  <!-- Header -->
  <AppHeader />

  <div class="ml-20 mt-20">
    <BackButton position="absolute" class="ml-20 mt-20" />

    <!-- Loading skeleton -->
    <div v-if="isLoading && !pin">
      <PinDetailSkeleton />
    </div>

    <!-- Main content -->
    <div
      v-show="mediaLoaded"
      class="grid grid-cols-2 gap-10 mx-60 bg-gray-100 rounded-3xl"
      :style="{ boxShadow: `0 0 30px 15px ${accentColor}` }"
    >
      <!-- Left: Media -->
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

      <!-- Right: Info -->
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
