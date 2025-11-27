<!-- src/components/features/users/follow/FollowersModal.vue -->
<script setup lang="ts">
/**
 * FollowersModal - Модалка подписчиков
 * ✅ ИСПРАВЛЕНО: использует BaseModal, useEscapeKey
 */

import { computed } from 'vue'
import { useScrollLock } from '@/composables/utils/useScrollLock'
import FollowList from './FollowList.vue'

export interface FollowersModalProps {
  modelValue: boolean
  userId: string
  count: number
}

const props = defineProps<FollowersModalProps>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

// Computed v-model
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

// Scroll lock
useScrollLock(isOpen)

function close() {
  isOpen.value = false
}

function handleBackdropClick(e: MouseEvent) {
  if (e.target === e.currentTarget) {
    close()
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    close()
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="isOpen"
        class="fixed inset-0 bg-black/75 z-40 p-6"
        @click="handleBackdropClick"
        @keydown="handleKeydown"
      >
        <div class="flex justify-center items-center min-h-screen">
          <!-- Modal container -->
          <div
            class="flex flex-col gap-2 bg-black shadow-glow h-auto max-h-[600px] text-2xl rounded-3xl text-white z-50 w-[600px] overflow-hidden"
          >
            <!-- Header -->
            <h1 class="text-7xl text-center my-4 py-2">{{ count }} Followers</h1>

            <!-- Content -->
            <FollowList :user-id="userId" type="followers" />
          </div>

          <!-- Close button -->
          <button
            @click="close"
            class="absolute right-20 top-20 text-white text-4xl cursor-pointer transition-transform duration-200 transform hover:scale-150"
            aria-label="Close"
          >
            <i class="pi pi-times text-glow" />
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.shadow-glow {
  box-shadow:
    0 0 15px rgba(255, 255, 255, 0.8),
    0 0 30px rgba(255, 255, 255, 0.6);
}

.text-glow {
  text-shadow:
    0 0 20px rgba(255, 255, 255, 0.9),
    0 0 40px rgba(255, 255, 255, 0.8),
    0 0 80px rgba(255, 255, 255, 0.7);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
