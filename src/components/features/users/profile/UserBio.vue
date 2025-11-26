<!-- src/components/features/user/profile/UserBio.vue -->
<script setup lang="ts">
/**
 * UserBio - Описание пользователя с "More" кнопкой
 * Визуальный стиль из старого UserView.vue
 */

import { ref, computed } from 'vue'

export interface UserBioProps {
  description?: string | null
  maxLength?: number
}

const props = withDefaults(defineProps<UserBioProps>(), {
  maxLength: 200,
})

const emit = defineEmits<{
  (e: 'showMore'): void
}>()

const shouldTruncate = computed(() => {
  return props.description && props.description.length > props.maxLength
})
</script>

<template>
  <div v-if="description">
    <p class="description-box text-center mt-4 text-md mx-auto w-[500px]">
      {{ description }}
    </p>
    <span
      v-if="shouldTruncate"
      class="text-black cursor-pointer justify-center flex font-extrabold"
      @click="emit('showMore')"
    >
      More
    </span>
  </div>
</template>

<style scoped>
.description-box {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  overflow: hidden;
}
</style>
