<!-- src/components/pin/likes/PinLikeAnimation.vue -->
<script setup lang="ts">
/**
 * Анимация лайка НА ИЗОБРАЖЕНИИ пина
 * Это signature feature Pinterest!
 */

export interface PinLikeAnimationProps {
  showLike: boolean
  showUnlike: boolean
}

defineProps<PinLikeAnimationProps>()
</script>

<template>
  <!-- Точная структура из старого PinView.vue -->
  <div
    class="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
  >
    <div class="relative flex items-center justify-center w-12 h-12">
      <!-- Unlike animation (outline heart) -->
      <Transition name="flash2">
        <i
          v-if="showUnlike"
          class="absolute pi pi-heart text-8xl text-white glowing-icon"
          aria-hidden="true"
        />
      </Transition>

      <!-- Like animation (filled heart) -->
      <Transition name="flash2">
        <i
          v-if="showLike"
          class="absolute pi pi-heart-fill text-8xl text-white glowing-icon"
          aria-hidden="true"
        />
      </Transition>
    </div>
  </div>
</template>

<style scoped>
/* Точные стили анимации из старого проекта */
.flash2-enter-active,
.flash2-leave-active {
  transition:
    opacity 0.5s ease-out,
    transform 0.5s cubic-bezier(0.3, 0.8, 0.2, 1);
}

.flash2-enter-from,
.flash2-leave-to {
  opacity: 0;
  transform: scale(3);
}

.flash2-enter-to,
.flash2-leave-from {
  opacity: 1;
  transform: scale(1);
}

.glowing-icon {
  text-shadow:
    0 0 15px rgba(255, 0, 0, 0.7),
    0 0 25px rgba(255, 0, 0, 0.6),
    0 0 35px rgba(255, 0, 0, 0.5);
}
</style>
