<script setup lang="ts">
import BaseAvatar from '@/components/ui/BaseAvatar.vue'

export interface UserAvatarProps {
  user: {
    id: string
    username: string
    imageUrl?: string
    verified?: boolean
  }
  imageUrl?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  online?: boolean
  showUsername?: boolean
  clickable?: boolean
}

const props = withDefaults(defineProps<UserAvatarProps>(), {
  size: 'md',
  online: false,
  showUsername: false,
  clickable: true,
})

const emit = defineEmits<(e: 'click') => void>()

const handleClick = () => {
  if (props.clickable) {
    emit('click')
  }
}
</script>

<template>
  <div
    @click="handleClick"
    :class="['flex items-center gap-2', clickable && 'cursor-pointer hover:opacity-80 transition']"
  >
    <BaseAvatar
      :src="imageUrl || user.imageUrl"
      :alt="user.username"
      :size="size"
      :status="online ? 'online' : null"
    />

    <div v-if="showUsername" class="flex items-center gap-1">
      <span class="font-medium truncate">{{ user.username }}</span>
      <i v-if="user.verified" class="pi pi-verified text-blue-500 text-sm"></i>
    </div>
  </div>
</template>
