<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PinDetailMedia from './PinDetailMedia.vue'
import PinDetailInfo from './PinDetailInfo.vue'
import PinFullscreen from './PinFullscreen.vue'
import RelatedPins from './RelatedPins.vue'
import PinDetailSkeleton from './PinDetailSkeleton.vue'
import BackButton from '@/components/common/BackButton.vue'
import ErrorMessage from '@/components/common/ErrorMessage.vue'
import { usePinDetail } from '@/composables/api/usePins'
import { useDocumentTitle } from '@/composables/utils'

const route = useRoute()
const router = useRouter()

const pinId = computed(() => route.params.id as string)

const { pin, relatedPins, isLoading, isLoadingRelated, fetchPin, fetchRelated } =
  usePinDetail(pinId)

const error = ref<Error | null>(null)
const showFullscreen = ref(false)

// Document title
useDocumentTitle(
  computed(() => {
    if (pin.value?.title) return pin.value.title
    return 'Pin Detail'
  }),
  { template: '%s | Pinterest Clone' },
)

// Load pin data
onMounted(async () => {
  try {
    await fetchPin()
    await fetchRelated()
  } catch (err) {
    console.error('[PinDetailView] Load failed:', err)
    error.value = err as Error
  }
})

const handleFullscreen = () => {
  showFullscreen.value = true
}

const handleCloseFullscreen = () => {
  showFullscreen.value = false
}

const handleDelete = () => {
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen bg-white">
    <!-- Back Button -->
    <BackButton position="fixed" variant="icon" size="lg" />

    <!-- Loading Skeleton -->
    <PinDetailSkeleton v-if="isLoading" />

    <!-- Error State -->
    <ErrorMessage
      v-else-if="error"
      :error="error"
      variant="fullscreen"
      :retryable="true"
      @retry="fetchPin"
    />

    <!-- Content -->
    <div v-else-if="pin" class="w-full">
      <!-- Main Content (Media + Info) -->
      <div class="flex items-start justify-center min-h-screen p-6 pt-20">
        <div
          class="flex flex-col lg:flex-row gap-8 w-full max-w-7xl bg-white rounded-3xl shadow-2xl overflow-hidden"
        >
          <!-- Left: Media -->
          <div class="lg:w-1/2 flex items-center justify-center bg-black">
            <PinDetailMedia :pin="pin" @fullscreen="handleFullscreen" />
          </div>

          <!-- Right: Info + Comments -->
          <div class="lg:w-1/2 flex flex-col max-h-[90vh] overflow-hidden">
            <PinDetailInfo :pin="pin" @deleted="handleDelete" />
          </div>
        </div>
      </div>

      <!-- Related Pins Section -->
      <div v-if="!isLoadingRelated && relatedPins.length > 0" class="mt-12 px-6 pb-12">
        <RelatedPins :pins="relatedPins" :current-pin-id="pin.id" />
      </div>
    </div>

    <!-- Fullscreen Modal -->
    <PinFullscreen v-if="pin" v-model="showFullscreen" :pin="pin" @close="handleCloseFullscreen" />
  </div>
</template>
