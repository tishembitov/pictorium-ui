<!-- src/components/features/user/follow/FollowersModal.vue -->
<script setup lang="ts">
/**
 * FollowersModal - Модалка подписчиков
 * Визуальный стиль из старого FollowersSection.vue
 */

import { computed } from 'vue'
import { useEscapeKey } from '@/composables/utils/useClickOutside'
import FollowList from './FollowList.vue'

export interface FollowersModalProps {
  modelValue: boolean
  userId: string
  count: number
}

const props = defineProps<FollowersModalProps>()

const emit = defineEmits<(e: 'update:modelValue', value: boolean) => void>()

function close() {
  emit('update:modelValue', false)
}

// Escape key
const isOpen = computed(() => props.modelValue)
useEscapeKey(close, { enabled: isOpen })
</script>

<template>
  <Transition name="fade">
    <div
      v-if="modelValue"
      class="fixed inset-0 bg-black bg-opacity-75 z-40 p-6"
      @click.self="close"
    >
      <div class="flex justify-center items-center min-h-screen">
        <!-- Контейнер из старого FollowersSection.vue -->
        <div
          class="flex flex-col gap-2 bg-black shadow-2xl h-auto max-h-[600px] text-2xl rounded-3xl text-white z-50 w-[600px] overflow-y-auto py-2"
          style="
            box-shadow:
              0 0 15px rgba(255, 255, 255, 0.8),
              0 0 30px rgba(255, 255, 255, 0.6);
          "
        >
          <h1 class="text-7xl text-center my-2">{{ count }} Followers</h1>

          <FollowList :user-id="userId" type="followers" />
        </div>

        <!-- Close button -->
        <i
          @click="close"
          class="absolute right-20 top-20 pi pi-times text-white text-4xl cursor-pointer transition-transform duration-200 transform hover:scale-150"
          style="
            text-shadow:
              0 0 20px rgba(255, 255, 255, 0.9),
              0 0 40px rgba(255, 255, 255, 0.8),
              0 0 80px rgba(255, 255, 255, 0.7);
          "
        />
      </div>
    </div>
  </Transition>
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
</style>
