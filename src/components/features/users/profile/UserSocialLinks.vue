<script setup lang="ts">
import { computed } from 'vue'

export interface UserSocialLinksProps {
  instagram?: string | null
  tiktok?: string | null
  telegram?: string | null
  pinterest?: string | null
  compact?: boolean
  maxWidth?: string
}

const props = withDefaults(defineProps<UserSocialLinksProps>(), {
  compact: false,
  maxWidth: '100px',
})

const formatLink = (url: string) => {
  return url.replace(/^https?:\/\//, '')
}

const socialLinks = computed(() => {
  const links = []

  if (props.instagram) {
    links.push({
      icon: 'pi-instagram',
      url: props.instagram,
      name: 'Instagram',
    })
  }

  if (props.telegram) {
    links.push({
      icon: 'pi-telegram',
      url: props.telegram,
      name: 'Telegram',
    })
  }

  if (props.tiktok) {
    links.push({
      icon: 'pi-tiktok',
      url: props.tiktok,
      name: 'TikTok',
    })
  }

  if (props.pinterest) {
    links.push({
      icon: 'pi-pinterest',
      url: props.pinterest,
      name: 'Pinterest',
    })
  }

  return links
})
</script>

<template>
  <div
    v-if="socialLinks.length > 0"
    :class="['flex gap-2 mt-2', compact ? 'flex-row flex-wrap' : 'flex-col space-y-2']"
  >
    <a
      v-for="link in socialLinks"
      :key="link.name"
      :href="link.url"
      target="_blank"
      rel="noopener noreferrer"
      :class="[
        'flex items-center gap-2 text-gray-700 hover:text-black transition',
        compact && 'truncate',
      ]"
      :style="compact ? { maxWidth: maxWidth } : {}"
    >
      <i :class="['pi', link.icon]"></i>
      <span :class="compact ? 'truncate' : ''">
        {{ formatLink(link.url) }}
      </span>
    </a>
  </div>
</template>
