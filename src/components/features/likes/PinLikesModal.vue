<!-- src/components/features/likes/PinLikesModal.vue -->
<script setup lang="ts">
/**
 * PinLikesModal - Модалка со списком лайков
 * ✅ ИСПРАВЛЕНО: getter для composable + useScrollLock
 */

import { ref, computed, watch } from 'vue'
import { usePinLikes } from '@/composables/api/usePinLikes'
import { useInfiniteScroll } from '@/composables/utils/useIntersectionObserver'
import { useEscapeKey } from '@/composables/utils/useClickOutside'
import { useScrollLock } from '@/composables/utils/useScrollLock'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import LikeUserItem from './LikeUserItem.vue'

export interface PinLikesModalProps {
  modelValue: boolean
  pinId: string
  likeCount?: number
}

const props = withDefaults(defineProps<PinLikesModalProps>(), {
  likeCount: 0,
})

const emit = defineEmits<(e: 'update:modelValue', value: boolean) => void>()

// ✅ ИСПРАВЛЕНО: getter для реактивности
const { users, isLoading, hasMore, totalElements, fetch, loadMore, reset } = usePinLikes(
  () => props.pinId,
  {
    pageSize: 7,
    immediate: false,
  },
)

// Infinite scroll trigger
const triggerRef = ref<HTMLElement | null>(null)

const { isLoading: isLoadingMore } = useInfiniteScroll(triggerRef, loadMore, {
  disabled: computed(() => !hasMore.value || isLoading.value),
  distance: 100,
})

// Close function
function close() {
  emit('update:modelValue', false)
}

// Escape key handler
const isOpen = computed(() => props.modelValue)
useEscapeKey(close, { enabled: isOpen })

// ✅ ИСПРАВЛЕНО: useScrollLock вместо document.body напрямую
useScrollLock(isOpen)

// Load when modal opens
watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      reset()
      fetch()
    }
  },
)

// Display count
const displayCount = computed(() => {
  return props.likeCount || totalElements.value || 0
})
</script>

<template>
  <Teleport to="body">
    <Transition name="fade" appear>
      <div
        v-if="modelValue"
        class="fixed inset-0 bg-black bg-opacity-75 z-50 p-6"
        @click.self="close"
        role="dialog"
        aria-modal="true"
        aria-labelledby="likes-modal-title"
      >
        <div class="flex justify-center items-center min-h-screen">
          <!-- Modal Content -->
          <div
            class="flex flex-col bg-black shadow-2xl h-auto max-h-[600px] text-2xl rounded-3xl text-white z-50 w-[600px] overflow-hidden"
            style="
              box-shadow:
                0 0 15px rgba(255, 255, 255, 0.8),
                0 0 30px rgba(255, 255, 255, 0.6);
            "
          >
            <!-- Header -->
            <h1 id="likes-modal-title" class="text-7xl text-center py-6 border-b border-gray-800">
              {{ displayCount }} ❤️
            </h1>

            <!-- Scrollable users list -->
            <div class="overflow-y-auto flex-1 min-h-0">
              <!-- Initial loading -->
              <div v-if="isLoading && users.length === 0" class="flex justify-center py-12">
                <span class="loader2"></span>
              </div>

              <!-- Users list -->
              <div class="py-2">
                <LikeUserItem
                  v-for="user in users"
                  :key="user.id"
                  :user="user"
                  :avatar-url="user.avatarBlobUrl"
                  size="lg"
                  class="text-white hover:bg-gray-900 transition-colors"
                />
              </div>

              <!-- Infinite scroll trigger -->
              <div ref="triggerRef" class="h-4" />

              <!-- Loading more -->
              <div
                v-if="isLoadingMore || (isLoading && users.length > 0)"
                class="flex justify-center py-4"
              >
                <BaseSpinner size="md" color="white" />
              </div>

              <!-- Empty state -->
              <div v-if="!isLoading && users.length === 0" class="text-center py-12 text-gray-400">
                <i class="pi pi-heart text-6xl mb-4 block opacity-50" />
                <p>No likes yet</p>
                <p class="text-sm mt-2">Be the first to like this pin!</p>
              </div>
            </div>
          </div>

          <!-- Close button -->
          <button
            @click="close"
            class="absolute right-20 top-20 text-white text-4xl cursor-pointer transition-transform duration-200 transform hover:scale-150 focus:outline-none"
            style="
              text-shadow:
                0 0 20px rgba(255, 255, 255, 0.9),
                0 0 40px rgba(255, 255, 255, 0.8),
                0 0 80px rgba(255, 255, 255, 0.7);
            "
            aria-label="Close"
          >
            <i class="pi pi-times" />
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.loader2 {
  width: 48px;
  height: 48px;
  background: #f3f4f6;
  border-radius: 50%;
  display: inline-block;
  position: relative;
  box-sizing: border-box;
  animation: rotation 1s linear infinite;
}

.loader2::after {
  content: '';
  box-sizing: border-box;
  position: absolute;
  left: 6px;
  top: 10px;
  width: 12px;
  height: 12px;
  color: #ff3d00;
  background: currentColor;
  border-radius: 50%;
  box-shadow:
    25px 2px,
    10px 22px;
}

@keyframes rotation {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
