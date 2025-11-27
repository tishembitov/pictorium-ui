<!-- src/components/features/users/profile/SendMessageModal.vue -->
<script setup lang="ts">
/**
 * SendMessageModal - Модалка отправки сообщения
 * ✅ ИСПРАВЛЕНО: унифицированы emits, используется useScrollLock
 */

import { ref, computed, watch } from 'vue'
import { useScrollLock } from '@/composables/utils/useScrollLock'
import BaseLoader from '@/components/ui/BaseLoader.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseTextarea from '@/components/ui/BaseTextarea.vue'

export interface SendMessageModalProps {
  modelValue: boolean
  username: string
}

const props = defineProps<SendMessageModalProps>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  send: [content: string]
}>()

// State
const messageContent = ref('')
const isSending = ref(false)

// v-model
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

// Scroll lock
useScrollLock(isOpen)

// Reset on close
watch(isOpen, (open) => {
  if (!open) {
    messageContent.value = ''
    isSending.value = false
  }
})

// Computed
const canSend = computed(() => messageContent.value.trim().length > 0)

// Handlers
function close() {
  isOpen.value = false
}

function handleBackdropClick(e: MouseEvent) {
  if (e.target === e.currentTarget) {
    close()
  }
}

function handleSend() {
  if (!canSend.value) return

  isSending.value = true
  emit('send', messageContent.value.trim())
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="isOpen"
        class="fixed inset-0 bg-black/50 z-50 p-6"
        @click="handleBackdropClick"
        @keydown.escape="close"
      >
        <div class="ml-20 flex justify-center items-center min-h-screen">
          <!-- Content -->
          <div
            v-if="!isSending"
            class="flex flex-col gap-4 bg-gray-200 rounded-3xl z-50 w-full max-w-[800px] py-8 px-6 items-center"
          >
            <h1 class="text-center text-4xl text-black font-bold">Message to {{ username }}</h1>

            <BaseTextarea
              v-model="messageContent"
              placeholder="Write your message..."
              :rows="6"
              class="w-full max-w-[600px]"
              rounded="xl"
            />

            <BaseButton
              @click="handleSend"
              :disabled="!canSend"
              variant="primary"
              class="mt-4 min-w-[200px]"
            >
              Send
            </BaseButton>
          </div>

          <!-- Loading -->
          <div
            v-else
            class="flex flex-col gap-2 bg-gray-200 rounded-3xl z-50 w-full max-w-[800px] py-20 items-center"
          >
            <BaseLoader variant="spinner" size="lg" color="red" />
            <p class="text-gray-600 mt-4">Sending message...</p>
          </div>
        </div>

        <!-- Close button -->
        <button
          @click="close"
          class="absolute right-20 top-20 text-white text-4xl cursor-pointer transition-transform duration-200 transform hover:scale-150"
          aria-label="Close"
        >
          <i class="pi pi-times text-glow" />
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.text-glow {
  text-shadow:
    0 0 20px rgba(255, 255, 255, 0.9),
    0 0 40px rgba(255, 255, 255, 0.8),
    0 0 80px rgba(255, 255, 255, 0.7);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
