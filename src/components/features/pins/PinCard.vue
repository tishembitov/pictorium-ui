<!-- src/components/features/pin/PinCard.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useUserStore } from '@/stores/user.store'
import { useAuthStore } from '@/stores/auth.store'
import { useHover } from '@/composables/features/useHover'
import { useOwnership } from '@/composables/auth/usePermissions'
import PinMedia from './PinMedia.vue'
import PinActions from './PinActions.vue'
import PinUserInfo from './PinUserInfo.vue'
import PinInfo from './PinInfo.vue'
import type { PinWithBlob } from '@/types'

export interface PinCardProps {
  pin: PinWithBlob
  showUser?: boolean
  showActions?: boolean
  showAllPins?: boolean
  variant?: 'default' | 'created' | 'saved' | 'deletable' | 'board'
}

const props = withDefaults(defineProps<PinCardProps>(), {
  showUser: true,
  showActions: true,
  showAllPins: true,
  variant: 'default',
})

const emit = defineEmits<{
  (e: 'load'): void
  (e: 'delete'): void
  (e: 'openBoardSelector'): void
}>()

// Stores
const userStore = useUserStore()
const authStore = useAuthStore()

// Refs
const cardRef = ref<HTMLElement | null>(null)

// Composables
const { isHovered } = useHover(cardRef, { enterDelay: 50, leaveDelay: 100 })
const { isOwner, canDelete } = useOwnership(computed(() => props.pin.userId))

// State
const isMediaLoaded = ref(false)
const user = ref<any>(null)
const userImage = ref<string | null>(null)

// Computed
const showActionButtons = computed(() => props.showActions && isHovered.value && props.showAllPins)

const showDeleteButton = computed(() => {
  if (props.variant === 'deletable') return true
  if (props.variant === 'saved' && isOwner.value) return true
  if (props.variant === 'created' && canDelete.value) return true
  return false
})

const deleteButtonText = computed(() => {
  if (props.variant === 'saved') return 'Remove'
  if (props.variant === 'board') return 'Remove from Board'
  return 'Delete'
})

// Load user data
onMounted(async () => {
  if (!props.showUser || !props.pin.userId) return

  try {
    user.value = await userStore.loadUserById(props.pin.userId)
    userImage.value = userStore.getAvatarUrl(props.pin.userId) || null
  } catch (error) {
    console.error('[PinCard] Failed to load user:', error)
  }
})

// Handlers
function handleMediaLoad() {
  isMediaLoaded.value = true
  emit('load')
}

function handleDelete() {
  emit('delete')
}

function handleOpenBoardSelector() {
  emit('openBoardSelector')
}
</script>

<template>
  <div class="w-1/5 p-2">
    <div
      ref="cardRef"
      class="relative block transition-transform duration-100 transform hover:scale-105"
    >
      <!-- Action buttons overlay -->
      <div v-if="showActionButtons" class="absolute top-2 right-2 z-20">
        <PinActions
          :pin-id="pin.id"
          :is-saved="pin.isSaved"
          :rgb="pin.rgb || undefined"
          variant="card"
          :show-delete="showDeleteButton"
          :delete-text="deleteButtonText"
          @save="() => {}"
          @delete="handleDelete"
          @open-board-selector="handleOpenBoardSelector"
        />
      </div>

      <!-- Link wrapper -->
      <RouterLink :to="`/pin/${pin.id}`">
        <!-- Placeholder while not loaded -->
        <div
          v-show="!showAllPins"
          class="w-full rounded-3xl"
          :style="{
            backgroundColor: pin.rgb || '#e5e7eb',
            height: `${pin.height || 200}px`,
          }"
        />

        <!-- Media content -->
        <PinMedia
          v-show="showAllPins"
          :image-src="pin.imageBlobUrl"
          :video-src="pin.videoBlobUrl"
          :is-gif="pin.isGif"
          :height="pin.height || undefined"
          :rgb="pin.rgb || undefined"
          :alt="pin.title || 'Pin'"
          :show-placeholder="false"
          @load="handleMediaLoad"
        />

        <!-- Title (inside link for card variant) -->
        <PinInfo v-if="showAllPins && isMediaLoaded" :title="pin.title" variant="card" />
      </RouterLink>

      <!-- User info (outside link for popover interaction) -->
      <PinUserInfo
        v-if="showUser && user && showAllPins && isMediaLoaded"
        :user-id="pin.userId"
        :username="user.username"
        :image-blob-url="userImage || undefined"
        :verified="user.verified"
        size="sm"
      />

      <!-- User placeholder while loading -->
      <div v-else-if="showUser && !isMediaLoaded" class="flex items-center mt-2">
        <div class="bg-gray-300 w-8 h-8 rounded-full" />
        <span class="ml-2 text-sm font-medium" />
      </div>
    </div>
  </div>
</template>
