<!-- src/components/features/pin/PinActions.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePinActions } from '@/composables/api/usePinActions'
import { useSelectedBoard } from '@/composables/api/useSelectedBoard'
import { useSuccessToast, useErrorToast } from '@/composables/ui/useToast'

export interface PinActionsProps {
  pinId: string
  isSaved?: boolean
  rgb?: string
  variant?: 'card' | 'detail' | 'minimal'
  showBoardSelector?: boolean
  showDelete?: boolean
  deleteText?: string
}

const props = withDefaults(defineProps<PinActionsProps>(), {
  isSaved: false,
  rgb: '#dc2626',
  variant: 'card',
  showBoardSelector: true,
  showDelete: false,
  deleteText: 'Delete',
})

const emit = defineEmits<{
  (e: 'save'): void
  (e: 'saved'): void
  (e: 'delete'): void
  (e: 'openBoardSelector'): void
}>()

// Composables
const { save, unsave, toggleSave, isSaved: storeSaved } = usePinActions(props.pinId)
const { boardTitle, hasSelected } = useSelectedBoard()
const successToast = useSuccessToast()
const { showError } = useErrorToast()

// State
const saveState = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')
const deleteState = ref<'idle' | 'deleting' | 'deleted'>('idle')

// Sync with props/store
const localIsSaved = computed(() => storeSaved.value || props.isSaved)

// Computed
const saveButtonText = computed(() => {
  switch (saveState.value) {
    case 'saving':
      return 'Saving...'
    case 'saved':
      return 'Saved'
    case 'error':
      return 'Already saved!'
    default:
      return 'Save'
  }
})

const deleteButtonText = computed(() => {
  switch (deleteState.value) {
    case 'deleting':
      return 'Deleting...'
    case 'deleted':
      return 'Deleted'
    default:
      return props.deleteText
  }
})

const saveButtonBg = computed(() => {
  if (saveState.value === 'saving' || saveState.value === 'saved') {
    return 'bg-black'
  }
  return 'bg-red-600 hover:bg-red-700'
})

const displayBoardTitle = computed(() => {
  return boardTitle.value || 'Profile'
})

// Handlers
async function handleSave() {
  if (saveState.value === 'saving') return

  emit('save')
  saveState.value = 'saving'

  try {
    await save()
    saveState.value = 'saved'
    successToast.pinSaved()
    emit('saved')
  } catch (error: any) {
    if (error?.response?.status === 409) {
      saveState.value = 'error'
    } else {
      saveState.value = 'idle'
      showError(error)
    }
  }
}

async function handleDelete() {
  if (deleteState.value === 'deleting') return

  deleteState.value = 'deleting'
  emit('delete')
}

function handleOpenBoardSelector() {
  emit('openBoardSelector')
}
</script>

<template>
  <!-- Card variant (positioned absolutely, shown on hover) -->
  <div v-if="variant === 'card'" class="flex flex-col gap-2">
    <!-- Save button -->
    <button
      @click.stop.prevent="handleSave"
      :class="['px-6 py-3 text-sm text-white rounded-3xl transition font-medium', saveButtonBg]"
      :disabled="saveState === 'saving'"
    >
      {{ saveButtonText }}
    </button>

    <!-- Board selector button -->
    <button
      v-if="showBoardSelector"
      @click.stop.prevent="handleOpenBoardSelector"
      class="px-6 py-3 text-sm bg-gray-800 hover:bg-black text-white rounded-3xl transition font-medium"
    >
      {{ displayBoardTitle }}
    </button>

    <!-- Delete button -->
    <button
      v-if="showDelete"
      @click.stop.prevent="handleDelete"
      :class="[
        'px-6 py-3 text-sm text-white rounded-3xl transition font-medium',
        deleteState === 'deleting' ? 'bg-black' : 'bg-gray-800 hover:bg-black',
      ]"
      :disabled="deleteState === 'deleting'"
    >
      {{ deleteButtonText }}
    </button>
  </div>

  <!-- Detail variant (inline row) -->
  <div v-else-if="variant === 'detail'" class="flex flex-row gap-2">
    <!-- Board selector -->
    <button
      v-if="showBoardSelector"
      @click.stop="handleOpenBoardSelector"
      class="px-6 py-3 text-sm bg-gray-800 hover:bg-black text-white rounded-3xl transition cursor-pointer font-medium"
    >
      {{ displayBoardTitle }}
    </button>

    <!-- Save button with dynamic color -->
    <button
      @click="handleSave"
      :style="{ backgroundColor: saveState === 'idle' ? rgb : '#000' }"
      class="px-6 py-3 text-sm text-white rounded-3xl transition transform hover:scale-105 font-medium"
      :disabled="saveState === 'saving'"
    >
      {{ saveButtonText }}
    </button>
  </div>

  <!-- Minimal variant (icon only) -->
  <div v-else class="flex items-center gap-2">
    <button
      @click.stop="handleSave"
      class="p-2 rounded-full hover:bg-gray-100 transition"
      :title="localIsSaved ? 'Saved' : 'Save'"
    >
      <i
        :class="[
          'pi text-xl',
          localIsSaved ? 'pi-bookmark-fill text-red-600' : 'pi-bookmark text-gray-600',
        ]"
      />
    </button>
  </div>
</template>
