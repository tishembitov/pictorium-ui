<script setup lang="ts">
import { computed } from 'vue'
import PinCard from './PinCard.vue'
import { useAuthStore } from '@/stores/auth.store'
import type { Pin } from '@/types'

export interface PinVariantsProps {
  pin: Pin
  variant: 'default' | 'created' | 'saved' | 'board' | 'deletable'
  boardId?: string
}

const props = defineProps<PinVariantsProps>()

const emit = defineEmits<{
  (e: 'loaded'): void
  (e: 'save', pinId: string): void
  (e: 'delete', pinId: string): void
  (e: 'deleteFromBoard', boardId: string, pinId: string): void
}>()

const authStore = useAuthStore()

// Determine capabilities based on variant
const canDelete = computed(() => {
  if (props.variant === 'deletable') return true
  if (props.variant === 'created') {
    return authStore.userId === props.pin.userId
  }
  if (props.variant === 'board') {
    return !!props.boardId
  }
  return false
})

const canEdit = computed(() => {
  return authStore.userId === props.pin.userId
})

const showUser = computed(() => {
  return props.variant === 'default' || props.variant === 'saved'
})

const handleDelete = () => {
  if (props.variant === 'board' && props.boardId) {
    emit('deleteFromBoard', props.boardId, props.pin.id)
  } else {
    emit('delete', props.pin.id)
  }
}
</script>

<template>
  <PinCard
    :pin="pin"
    :variant="variant"
    :can-delete="canDelete"
    :can-edit="canEdit"
    :show-user="showUser"
    @loaded="emit('loaded')"
    @save="emit('save', $event)"
    @delete="handleDelete"
  />
</template>
