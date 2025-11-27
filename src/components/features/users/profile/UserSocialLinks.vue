<!-- src/components/features/users/profile/UserSocialLinks.vue -->
<script setup lang="ts">
/**
 * UserSocialLinks - Социальные ссылки
 * ✅ Чистый presentational компонент
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
function formatLink(url: string): string {
  return url.replace(/^https?:\/\//, '')
}

const hasLinks = computed(() => {
  return props.instagram || props.tiktok || props.telegram || props.pinterest
})

const links = computed(() => {
  const result = []
  if (props.instagram) result.push({ icon: 'pi-instagram', url: props.instagram })
  if (props.telegram) result.push({ icon: 'pi-telegram', url: props.telegram })
  if (props.tiktok) result.push({ icon: 'pi-tiktok', url: props.tiktok })
  if (props.pinterest) result.push({ icon: 'pi-pinterest', url: props.pinterest })
  return result
})
</script>

<template>
  <!-- Inline variant -->
  <div
    v-if="variant === 'inline' && hasLinks"
    class="flex flex-wrap gap-2 text-md text-black max-w-[500px]"
  >
    <a
      v-for="link in links"
      :key="link.icon"
      :href="link.url"
      class="truncate inline-block max-w-[120px] hover:underline transition"
      target="_blank"
      rel="noopener noreferrer"
    >
      <i :class="['pi', link.icon, 'mr-1']" />
      {{ formatLink(link.url) }}
    </a>
  </div>

  <!-- Full variant (для модалки About) -->
  <div v-else-if="variant === 'full' && hasLinks" class="space-y-4 text-md ml-4 mb-6">
    <a
      v-for="link in links"
      :key="link.icon"
      :href="link.url"
      class="block w-full hover:underline transition"
      target="_blank"
      rel="noopener noreferrer"
    >
      <i :class="['pi', link.icon, 'mr-4']" />
      {{ formatLink(link.url) }}
    </a>
  </div>
</template>
