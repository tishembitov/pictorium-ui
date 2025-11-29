<!-- src/views/PinView.vue -->
<script setup lang="ts">
/**
 * PinView - Детальная страница пина с редактированием
 */

import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuth } from '@/composables/auth/useAuth'
import { usePinDetail } from '@/composables/api/usePinDetail'
import PinDetailView from '@/components/features/pins/detail/PinDetailView.vue'
import PinEditForm from '@/components/features/pins/PinEditForm.vue'
import BaseModal from '@/components/ui/BaseModal.vue'

const route = useRoute()
const { userId } = useAuth()

const pinId = computed(() => route.params.id as string)
const { pin } = usePinDetail(() => pinId.value)

// Edit modal
const showEditModal = ref(false)

const canEdit = computed(() => {
  return pin.value && userId.value === pin.value.userId
})

function handleEditSaved() {
  showEditModal.value = false
}
</script>

<template>
  <!-- Edit Modal -->
  <BaseModal v-model="showEditModal" title="Edit Pin" size="lg">
    <PinEditForm v-if="pin" :pin="pin" @saved="handleEditSaved" @cancel="showEditModal = false" />
  </BaseModal>

  <PinDetailView :pin-id="pinId">
    <!-- Inject edit button -->
    <template v-if="canEdit" #actions>
      <button
        @click="showEditModal = true"
        class="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-full transition"
      >
        Edit
      </button>
    </template>
  </PinDetailView>
</template>
