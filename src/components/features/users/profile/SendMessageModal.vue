<!-- src/components/features/user/profile/SendMessageModal.vue -->
<script setup lang="ts">
/**
 * SendMessageModal - Модалка отправки сообщения
 * Визуальный стиль из старого UserView.vue (openSendMessage)
 */

import { ref, computed, watch } from 'vue'
import { useEscapeKey } from '@/composables/utils/useClickOutside'
import BaseLoader from '@/components/ui/BaseLoader.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

export interface SendMessageModalProps {
  modelValue: boolean
  username: string
}

const props = defineProps<SendMessageModalProps>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'send', content: string): void
}>()

const messageContent = ref('')
const isSending = ref(false)

// Reset on close
watch(
  () => props.modelValue,
  (isOpen) => {
    if (!isOpen) {
      messageContent.value = ''
    }
  },
)

function close() {
  emit('update:modelValue', false)
}

function handleSend() {
  if (messageContent.value.trim()) {
    isSending.value = true
    emit('send', messageContent.value.trim())
  }
}

// Escape key
const isOpen = computed(() => props.modelValue)
useEscapeKey(close, { enabled: isOpen })
</script>

<template>
  <Transition name="fade">
    <div
      v-if="modelValue"
      class="fixed inset-0 bg-black bg-opacity-50 z-50 p-6"
      @click.self="close"
    >
      <div class="ml-20 flex justify-center items-center min-h-screen">
        <!-- Content -->
        <div
          v-if="!isSending"
          class="flex flex-col gap-2 bg-gray-200 h-auto max-h-[600px] text-2xl rounded-3xl z-50 w-[800px] overflow-y-auto py-2 items-center"
        >
          <h1 class="text-center text-6xl text-black mt-4 mb-4">Message to {{ username }}</h1>

          <textarea
            v-model="messageContent"
            placeholder="Write your message..."
            class="cursor-pointer text-black text-3xl rounded-3xl block w-3/4 py-10 px-10 focus:ring-black bg-white focus:border-4 focus:border-white resize-none"
            style="height: 200px"
          />

          <BaseButton
            @click="handleSend"
            variant="secondary"
            class="my-5 !w-[400px] !bg-white !text-black hover:!bg-indigo-300"
          >
            Send
          </BaseButton>
        </div>

        <!-- Loading -->
        <div
          v-else
          class="flex flex-col gap-2 bg-gray-200 h-auto max-h-[600px] text-2xl rounded-3xl z-50 w-[800px] overflow-y-auto py-20 items-center"
        >
          <BaseLoader variant="spinner" size="lg" color="red" />
        </div>
      </div>

      <!-- Close button -->
      <i
        @click="close"
        class="absolute right-20 top-20 pi pi-times text-white text-4xl cursor-pointer transition-transform duration-200 transform hover:scale-150"
        style="
          text-shadow:
            0 0 20px rgba(255, 255, 255, 0.9),
            0 0 40px rgba(255, 255, 255, 0.8),
            0 0 80px rgba(255, 255, 255, 0.7);
        "
      />
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
