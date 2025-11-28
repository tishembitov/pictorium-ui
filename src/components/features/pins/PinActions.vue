<!-- src/components/features/pins/PinActions.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePinActions } from '@/composables/api/usePinActions'
import { useSelectedBoard } from '@/composables/api/useSelectedBoard'

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

// ✅ ИСПРАВЛЕНО: getter для реактивности
const { saveState, saveButtonText, save } = usePinActions(() => props.pinId)
const { boardTitle } = useSelectedBoard()

// State
const deleteState = ref<'idle' | 'deleting' | 'deleted'>('idle')

// Computed
const saveButtonBg = computed(() => {
  if (saveState.value === 'saving' || saveState.value === 'saved') {
    return 'bg-black'
  }
  return 'bg-red-600 hover:bg-red-700'
})

const displayBoardTitle = computed(() => boardTitle.value || 'Profile')

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

// Handlers
async function handleSave() {
  emit('save')
  const success = await save()
  if (success) {
    emit('saved')
  }
}

function handleDelete() {
  if (deleteState.value === 'deleting') return
  deleteState.value = 'deleting'
  emit('delete')
}

function handleOpenBoardSelector() {
  emit('openBoardSelector')
}
</script>

<template>
  <!-- Card variant -->
  <div v-if="variant === 'card'" class="flex flex-col gap-2">
    <button
      @click.stop.prevent="handleSave"
      :class="['px-6 py-3 text-sm text-white rounded-3xl transition font-medium', saveButtonBg]"
      :disabled="saveState === 'saving'"
    >
      {{ saveButtonText }}
    </button>

    <button
      v-if="showBoardSelector"
      @click.stop.prevent="handleOpenBoardSelector"
      class="px-6 py-3 text-sm bg-gray-800 hover:bg-black text-white rounded-3xl transition font-medium"
    >
      {{ displayBoardTitle }}
    </button>

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

  <!-- Detail variant -->
  <div v-else-if="variant === 'detail'" class="flex flex-row gap-2">
    <button
      v-if="showBoardSelector"
      @click.stop="handleOpenBoardSelector"
      class="px-6 py-3 text-sm bg-gray-800 hover:bg-black text-white rounded-3xl transition cursor-pointer font-medium"
    >
      {{ displayBoardTitle }}
    </button>

    <button
      @click="handleSave"
      :style="{ backgroundColor: saveState === 'idle' ? rgb : '#000' }"
      class="px-6 py-3 text-sm text-white rounded-3xl transition transform hover:scale-105 font-medium"
      :disabled="saveState === 'saving'"
    >
      {{ saveButtonText }}
    </button>
  </div>

  <!-- Minimal variant -->
  <div v-else class="flex items-center gap-2">
    <button
      @click.stop="handleSave"
      class="p-2 rounded-full hover:bg-gray-100 transition"
      :title="isSaved ? 'Saved' : 'Save'"
    >
      <i
        :class="[
          'pi text-xl',
          isSaved ? 'pi-bookmark-fill text-red-600' : 'pi-bookmark text-gray-600',
        ]"
      />
    </button>
  </div>
</template>
