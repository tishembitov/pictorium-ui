<!-- src/components/features/pin/PinVariants.vue -->
<script setup lang="ts">
/**
 * PinVariants - Unified wrapper for different pin display modes
 *
 * Replaces old components:
 * - CreatedPin.vue → variant="created"
 * - CreatedDeletedPin.vue → variant="created" + canDelete
 * - SavedPin.vue → variant="saved"
 * - DeleteSavedPin.vue → variant="saved" + canDelete
 * - CreatedPinBoard.vue → variant="board"
 * - CreatedDeletedPinBoard.vue → variant="board" + canDelete
 */

import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useOwnership } from '@/composables/auth/usePermissions'
import PinCard from './PinCard.vue'
import type { PinWithBlob } from '@/types'

export interface PinVariantsProps {
  pin: PinWithBlob
  variant: 'default' | 'created' | 'saved' | 'board'
  /** Force show delete button regardless of ownership */
  canDelete?: boolean
  /** Board ID for board variant */
  boardId?: string
  /** Current authenticated user ID (for ownership check) */
  authUserId?: string
  showUser?: boolean
  showAllPins?: boolean
}

const props = withDefaults(defineProps<PinVariantsProps>(), {
  canDelete: false,
  showUser: true,
  showAllPins: true,
})

const emit = defineEmits<{
  (e: 'load'): void
  (e: 'delete'): void
  (e: 'deleteFromBoard'): void
  (e: 'unsave'): void
  (e: 'openBoardSelector'): void
}>()

// Auth
const authStore = useAuthStore()
const { isOwner, canDelete: hasDeletePermission } = useOwnership(computed(() => props.pin.userId))

// Determine if delete should be shown
const showDelete = computed(() => {
  if (props.canDelete) return true

  // For created pins, only owner can delete
  if (props.variant === 'created') {
    return isOwner.value || hasDeletePermission.value
  }

  // For saved pins, owner can unsave
  if (props.variant === 'saved') {
    return props.authUserId === authStore.userId
  }

  // For board pins, board owner can remove
  if (props.variant === 'board') {
    return props.authUserId === authStore.userId
  }

  return false
})

// Map to PinCard variant
const cardVariant = computed(() => {
  if (showDelete.value) return 'deletable'
  return props.variant === 'created' ? 'created' : 'default'
})

// Handle delete based on variant
function handleDelete() {
  if (props.variant === 'board' && props.boardId) {
    emit('deleteFromBoard')
  } else if (props.variant === 'saved') {
    emit('unsave')
  } else {
    emit('delete')
  }
}

function handleLoad() {
  emit('load')
}

function handleOpenBoardSelector() {
  emit('openBoardSelector')
}
</script>

<template>
  <PinCard
    :pin="pin"
    :variant="cardVariant"
    :show-user="showUser"
    :show-all-pins="showAllPins"
    @load="handleLoad"
    @delete="handleDelete"
    @open-board-selector="handleOpenBoardSelector"
  />
</template>
