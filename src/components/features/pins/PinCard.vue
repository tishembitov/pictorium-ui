<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import PinMedia from './PinMedia.vue'
import PinActions from './PinActions.vue'
import PinInfo from './PinInfo.vue'
import PinUserInfo from './PinUserInfo.vue'
import PinSkeleton from './PinSkeleton.vue'
import type { Pin } from '@/types'

export interface PinCardProps {
  pin: Pin
  variant?: 'default' | 'created' | 'saved' | 'board'
  showActions?: boolean
  showUser?: boolean
  showInfo?: boolean
  canDelete?: boolean
  canEdit?: boolean
  loading?: boolean
}

const props = withDefaults(defineProps<PinCardProps>(), {
  variant: 'default',
  showActions: true,
  showUser: true,
  showInfo: true,
  canDelete: false,
  canEdit: false,
  loading: false,
})

const emit = defineEmits<{
  (e: 'loaded'): void
  (e: 'save', pinId: string): void
  (e: 'delete', pinId: string): void
  (e: 'like', pinId: string): void
}>()

const router = useRouter()
const showActionsOverlay = ref(false)
const mediaLoaded = ref(false)

const handleMediaLoaded = () => {
  mediaLoaded.value = true
  emit('loaded')
}

const handlePinClick = () => {
  router.push(`/pin/${props.pin.id}`)
}

const handleSave = () => {
  emit('save', props.pin.id)
}

const handleDelete = () => {
  emit('delete', props.pin.id)
}

const handleLike = () => {
  emit('like', props.pin.id)
}
</script>

<template>
  <div
    class="relative group transition-transform duration-100 hover:scale-105"
    @mouseenter="showActionsOverlay = true"
    @mouseleave="showActionsOverlay = false"
  >
    <!-- Skeleton/Placeholder -->
    <PinSkeleton
      v-if="!mediaLoaded"
      :color="pin.rgb"
      :height="pin.height"
      class="absolute inset-0 z-0"
    />

    <!-- Actions Overlay (hover) -->
    <PinActions
      v-if="showActions && mediaLoaded"
      :show="showActionsOverlay"
      :pin-id="pin.id"
      :can-delete="canDelete"
      :can-edit="canEdit"
      @save="handleSave"
      @delete="handleDelete"
      @like="handleLike"
    />

    <!-- Media -->
    <div @click="handlePinClick" class="cursor-pointer">
      <PinMedia v-show="mediaLoaded" :pin="pin" :auto-play="true" @loaded="handleMediaLoaded" />
    </div>

    <!-- Info -->
    <PinInfo
      v-if="showInfo && mediaLoaded && (pin.title || pin.description)"
      :pin="pin"
      class="mt-2"
    />

    <!-- User Info -->
    <PinUserInfo v-if="showUser && mediaLoaded" :pin="pin" class="mt-2" />
  </div>
</template>
