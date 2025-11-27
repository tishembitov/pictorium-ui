<!-- src/components/features/comments/CommentInput.vue -->
<script setup lang="ts">
/**
 * CommentInput - Input для комментариев
 * ✅ Компонент был чистым, добавлены мелкие улучшения
 */

import { ref, computed, watch, onUnmounted } from 'vue'
import { useFileUpload } from '@/composables/features/useFileUpload'
import { useToast } from '@/composables/ui/useToast'
import { getCommentError } from '@/utils/validators'
import { validateMediaFile } from '@/utils/files'
import EmojiPickerWrapper from '@/components/ui/EmojiPickerWrapper.vue'
import BaseLoader from '@/components/ui/BaseLoader.vue'

export interface CommentInputProps {
  placeholder?: string
  disabled?: boolean
  loading?: boolean
  accentColor?: string
  showEmojiPicker?: boolean
  showMediaUpload?: boolean
  maxLength?: number
  maxVideoDuration?: number
}

const props = withDefaults(defineProps<CommentInputProps>(), {
  placeholder: 'Add Comment',
  disabled: false,
  loading: false,
  accentColor: '#000',
  showEmojiPicker: true,
  showMediaUpload: true,
  maxLength: 500,
  maxVideoDuration: 30,
})

const emit = defineEmits<{
  (e: 'submit', content: string, file: File | null): void
  (e: 'cancel'): void
  (e: 'mediaError', message: string): void
}>()

const { warning } = useToast()

// useFileUpload для preview
const {
  file: mediaFile,
  preview: mediaPreview,
  isImageFile,
  isVideoFile,
  reset: resetFile,
} = useFileUpload({
  accept: 'image/jpeg,image/png,image/gif,image/webp,image/bmp,video/mp4,video/webm',
})

// State
const content = ref('')
const contentError = ref<string | null>(null)
const showPicker = ref(false)
const isTop = ref(true)

// Refs
const inputContainerRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

// Computed
const canSubmit = computed(() => {
  const hasContent = content.value.trim() !== '' || mediaFile.value !== null
  const isValid = !contentError.value
  return hasContent && isValid && !props.loading
})

const isDisabled = computed(() => props.disabled || props.loading)

// Валидация текста
watch(content, (value) => {
  if (value.trim()) {
    contentError.value = getCommentError(value)
  } else {
    contentError.value = null
  }
})

// Methods
function loadPicker() {
  if (!showPicker.value && inputContainerRef.value) {
    const rect = inputContainerRef.value.getBoundingClientRect()
    const distanceToBottom = window.innerHeight - rect.bottom
    isTop.value = distanceToBottom >= 320
  }
}

function onSelectEmoji(emoji: { i: string }) {
  content.value += emoji.i
  inputRef.value?.focus()
}

async function handleMediaSelect(event: Event) {
  const input = event.target as HTMLInputElement
  const selectedFile = input.files?.[0]
  input.value = ''

  if (!selectedFile) return

  const validation = await validateMediaFile(selectedFile, {
    maxVideoDuration: props.maxVideoDuration,
  })

  if (!validation.valid) {
    const errorMessage = validation.errors[0] || 'Invalid file'
    emit('mediaError', errorMessage)
    return
  }

  mediaFile.value = selectedFile
}

function clearMedia() {
  resetFile()
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

function handleSubmit() {
  if (!canSubmit.value) return

  const error = getCommentError(content.value)
  if (error && !mediaFile.value) {
    contentError.value = error
    warning(error)
    return
  }

  emit('submit', content.value.trim(), mediaFile.value)

  // Reset
  content.value = ''
  contentError.value = null
  clearMedia()
  showPicker.value = false
}

function handleCancel() {
  content.value = ''
  contentError.value = null
  clearMedia()
  showPicker.value = false
  emit('cancel')
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    handleSubmit()
  }
}

onUnmounted(() => {
  clearMedia()
})

defineExpose({
  focus: () => inputRef.value?.focus(),
  reset: handleCancel,
  content,
  mediaFile,
})
</script>

<template>
  <div class="w-full">
    <!-- Media Preview -->
    <div v-if="mediaPreview && !loading">
      <div v-if="isImageFile" class="relative mb-2">
        <div class="absolute top-0 left-[-10px] z-20" @click="clearMedia">
          <i
            class="pi pi-times text-xs cursor-pointer p-2 text-white bg-black rounded-full hover:bg-gray-800 transition"
          />
        </div>
        <img :src="mediaPreview" class="h-28 w-28 object-cover rounded-lg" alt="Media Preview" />
      </div>
      <div v-if="isVideoFile" class="relative mb-2">
        <div class="absolute top-0 left-[-10px] z-20" @click="clearMedia">
          <i
            class="pi pi-times text-xs cursor-pointer p-2 text-white bg-black rounded-full hover:bg-gray-800 transition"
          />
        </div>
        <video :src="mediaPreview" class="h-32 w-32 object-cover rounded-lg" autoplay loop muted />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-4">
      <BaseLoader variant="colorful" size="md" :fullscreen="false" />
    </div>

    <!-- Input Row -->
    <div v-else class="flex items-center space-x-2">
      <slot name="cancel" :cancel="handleCancel" />

      <div ref="inputContainerRef" class="relative w-full">
        <input
          ref="inputRef"
          v-model="content"
          type="text"
          :placeholder="placeholder"
          :disabled="isDisabled"
          :maxlength="maxLength"
          autocomplete="off"
          @keydown="handleKeydown"
          :class="[
            'transition cursor-pointer bg-gray-50 border text-black text-sm rounded-3xl py-3 px-5 pr-20 w-full focus:ring-black focus:border-black disabled:opacity-50 disabled:cursor-not-allowed',
            contentError ? 'border-red-500' : 'border-gray-900',
          ]"
        />

        <!-- Emoji button -->
        <button
          v-if="showEmojiPicker"
          @click="
            loadPicker()
            showPicker = !showPicker
          "
          :disabled="isDisabled"
          type="button"
          class="absolute bottom-0.5 right-12 p-1 transition transform hover:scale-105 disabled:opacity-50"
          aria-label="Add emoji"
        >
          <i class="pi pi-face-smile text-2xl" :style="{ color: accentColor }" />
        </button>

        <!-- Media upload -->
        <label v-if="showMediaUpload" class="absolute bottom-0.5 right-4 p-1 cursor-pointer">
          <i
            class="pi pi-images text-2xl transition transform hover:scale-105"
            :style="{ color: accentColor }"
            :class="{ 'opacity-50 cursor-not-allowed': isDisabled }"
          />
          <input
            ref="fileInputRef"
            type="file"
            accept=".jpg,.jpeg,.gif,.webp,.png,.bmp,.mp4,.webm"
            :disabled="isDisabled"
            @change="handleMediaSelect"
            class="hidden"
          />
        </label>

        <!-- Emoji Picker -->
        <EmojiPickerWrapper
          v-show="showPicker"
          :model-value="showPicker"
          @update:model-value="showPicker = $event"
          @select="onSelectEmoji"
          class="absolute right-0 z-40"
          :style="{ top: isTop ? '50px' : 'auto', bottom: isTop ? 'auto' : '50px' }"
        />
      </div>
    </div>

    <!-- Validation & char count -->
    <div
      v-if="!loading && (contentError || content.length > 0)"
      class="flex justify-between mt-1 px-2"
    >
      <p v-if="contentError" class="text-xs text-red-500">{{ contentError }}</p>
      <span v-else />
      <p
        v-if="content.length > 0"
        :class="[
          'text-xs',
          content.length > maxLength
            ? 'text-red-500'
            : content.length > maxLength * 0.8
              ? 'text-yellow-600'
              : 'text-gray-400',
        ]"
      >
        {{ content.length }}/{{ maxLength }}
      </p>
    </div>
  </div>
</template>
