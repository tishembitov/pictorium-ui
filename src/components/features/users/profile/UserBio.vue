<!-- src/components/features/users/profile/UserBio.vue -->
<script setup lang="ts">
/**
 * UserBio - Описание пользователя с "More" кнопкой
 * ✅ Чистый presentational компонент
 */

import { computed } from 'vue'

export interface UserBioProps {
  description?: string | null
  maxLength?: number
}

const props = withDefaults(defineProps<UserBioProps>(), {
  maxLength: 200,
})

const emit = defineEmits<{
  showMore: []
}>()

const shouldTruncate = computed(() => {
  return props.description && props.description.length > props.maxLength
})
</script>

<template>
  <div v-if="description" class="mt-4">
    <p class="description-box text-center text-md mx-auto max-w-[500px]">
      {{ description }}
    </p>
    <button
      v-if="shouldTruncate"
      @click="emit('showMore')"
      class="text-black cursor-pointer justify-center flex font-extrabold hover:underline transition mt-1"
    >
      More
    </button>
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
