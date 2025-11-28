<script setup lang="ts">
/**
 * PinVariants - Unified wrapper for different pin display modes
 * ✅ ИСПРАВЛЕНО: использует useAuthState вместо store
 */

import { computed } from 'vue'
import { useAuth } from '@/composables/auth/useAuth' // ✅ Composable
import { useOwnership } from '@/composables/auth/usePermissions'
import PinCard from './PinCard.vue'
import type { PinWithBlob } from '@/types'

export interface PinVariantsProps {
  pin: PinWithBlob
  variant: 'default' | 'created' | 'saved' | 'board'
  canDelete?: boolean
  boardId?: string
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

// ✅ FIX: Используем composable вместо store
const { userId: currentUserId } = useAuth()
const { isOwner, canDelete: hasDeletePermission } = useOwnership(computed(() => props.pin.userId))

// Determine if delete should be shown
const showDelete = computed(() => {
  if (props.canDelete) return true

  if (props.variant === 'created') {
    return isOwner.value || hasDeletePermission.value
  }

  if (props.variant === 'saved') {
    return props.authUserId === currentUserId.value
  }

  if (props.variant === 'board') {
    return props.authUserId === currentUserId.value
  }

  return false
})

// Map to PinCard variant
const cardVariant = computed(() => {
  if (showDelete.value) return 'deletable'
  return props.variant === 'created' ? 'created' : 'default'
})

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
