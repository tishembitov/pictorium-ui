<!-- src/components/features/user/profile/UserSocialLinks.vue -->
<script setup lang="ts">
/**
 * UserSocialLinks - Социальные ссылки пользователя
 * Визуальный стиль из старого UserView.vue
 */

import { computed } from 'vue'

export interface UserSocialLinksProps {
  instagram?: string | null
  tiktok?: string | null
  telegram?: string | null
  pinterest?: string | null
  variant?: 'inline' | 'full'
}

const props = withDefaults(defineProps<UserSocialLinksProps>(), {
  variant: 'inline',
})

// Format link (убираем https://)
const formatLink = (url: string) => {
  return url.replace(/^https?:\/\//, '')
}

const hasLinks = computed(() => {
  return props.instagram || props.tiktok || props.telegram || props.pinterest
})
</script>

<template>
  <!-- Inline variant (миниатюрные ссылки) -->
  <div
    v-if="variant === 'inline' && hasLinks"
    class="flex flex-row gap-2 text-md text-black max-w-[500px] mt-2"
  >
    <a
      v-if="instagram"
      :href="instagram"
      class="truncate inline-block max-w-[100px]"
      target="_blank"
      rel="noopener noreferrer"
    >
      <i class="pi pi-instagram" /> {{ formatLink(instagram) }}
    </a>
    <a
      v-if="telegram"
      :href="telegram"
      class="truncate inline-block max-w-[100px]"
      target="_blank"
      rel="noopener noreferrer"
    >
      <i class="pi pi-telegram" /> {{ formatLink(telegram) }}
    </a>
    <a
      v-if="tiktok"
      :href="tiktok"
      class="truncate inline-block max-w-[100px]"
      target="_blank"
      rel="noopener noreferrer"
    >
      <i class="pi pi-tiktok" /> {{ formatLink(tiktok) }}
    </a>
    <a
      v-if="pinterest"
      :href="pinterest"
      class="truncate inline-block max-w-[100px]"
      target="_blank"
      rel="noopener noreferrer"
    >
      <i class="pi pi-pinterest" /> {{ formatLink(pinterest) }}
    </a>
  </div>

  <!-- Full variant (для модалки About) -->
  <div v-else-if="variant === 'full' && hasLinks" class="space-y-6 text-md ml-4 mb-6">
    <a
      v-if="instagram"
      :href="instagram"
      class="block w-full"
      target="_blank"
      rel="noopener noreferrer"
    >
      <i class="pi pi-instagram mr-5" /> {{ formatLink(instagram) }}
    </a>
    <a
      v-if="telegram"
      :href="telegram"
      class="block w-full"
      target="_blank"
      rel="noopener noreferrer"
    >
      <i class="pi pi-telegram mr-5" /> {{ formatLink(telegram) }}
    </a>
    <a v-if="tiktok" :href="tiktok" class="block w-full" target="_blank" rel="noopener noreferrer">
      <i class="pi pi-tiktok mr-5" /> {{ formatLink(tiktok) }}
    </a>
    <a
      v-if="pinterest"
      :href="pinterest"
      class="block w-full"
      target="_blank"
      rel="noopener noreferrer"
    >
      <i class="pi pi-pinterest mr-5" /> {{ formatLink(pinterest) }}
    </a>
  </div>
</template>
