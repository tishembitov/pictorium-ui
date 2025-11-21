<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import EmojiPickerWrapper from '@/components/ui/EmojiPickerWrapper.vue'
import CommentMediaUpload from './CommentMediaUpload.vue'
import { shouldPositionTop } from '@/utils/positioning'
import { COMMENT_MAX_LENGTH } from '@/utils/constants'

export interface CommentInputProps {
  modelValue: string
  placeholder?: string
  disabled?: boolean
  loading?: boolean
  showMediaUpload?: boolean
  showEmojiPicker?: boolean
  autoFocus?: boolean
}

const props = withDefaults(defineProps<CommentInputProps>(), {
  modelValue: '',
  placeholder: 'Add a comment...',
  disabled: false,
  loading: false,
  showMediaUpload: true,
  showEmojiPicker: true,
  autoFocus: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'submit'): void
  (e: 'cancel'): void
  (e: 'mediaChange', file: File | null): void
  (e: 'mediaError', errors: string[]): void
}>()

// Refs
const inputRef = ref<HTMLElement | null>(null)
const containerRef = ref<HTMLElement | null>(null)

// State
const showPicker = ref(false)
const pickerPosition = ref<'top' | 'bottom'>('bottom')
const mediaFile = ref<File | null>(null)

// Computed
const hasContent = computed(() => props.modelValue.trim() !== '' || mediaFile.value !== null)

const canSubmit = computed(() => hasContent.value && !props.loading && !props.disabled)

// Emoji picker positioning
const calculatePickerPosition = async () => {
  await nextTick()
  if (inputRef.value && containerRef.value) {
    const isTop = shouldPositionTop(inputRef.value, containerRef.value)
    pickerPosition.value = isTop ? 'bottom' : 'top'
  }
}

watch(showPicker, async (show) => {
  if (show) {
    await calculatePickerPosition()
  }
})

// Handlers
const handleInput = (value: string | number) => {
  emit('update:modelValue', String(value))
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    handleSubmit()
  }

  if (event.key === 'Escape') {
    emit('cancel')
  }
}

const handleSubmit = () => {
  if (canSubmit.value) {
    emit('submit')
  }
}

const togglePicker = async () => {
  showPicker.value = !showPicker.value
}

const handleEmojiSelect = (emoji: any) => {
  const newValue = props.modelValue + emoji.i
  emit('update:modelValue', newValue)
}

const handleMediaChange = (file: File | null) => {
  mediaFile.value = file
  emit('mediaChange', file)
}

const handleMediaError = (errors: string[]) => {
  emit('mediaError', errors)
}

const removeMedia = () => {
  mediaFile.value = null
  emit('mediaChange', null)
}
</script>

<template>
  <div ref="containerRef" class="relative w-full">
    <!-- Media Preview (if exists) -->
    <div v-if="mediaFile && !loading" class="mb-2">
      <CommentMediaUpload
        :modelValue="mediaFile"
        @update:modelValue="handleMediaChange"
        @error="handleMediaError"
        :disabled="disabled || loading"
      />
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex items-center justify-center py-4">
      <BaseSpinner size="md" color="red" />
    </div>

    <!-- Input with buttons -->
    <div v-else class="flex items-center gap-2">
      <!-- Cancel button (if has content) -->
      <button
        v-if="hasContent"
        @click="emit('cancel')"
        type="button"
        class="p-2 text-white bg-black rounded-full hover:bg-gray-800 transition flex-shrink-0"
      >
        <i class="pi pi-times text-xs"></i>
      </button>

      <!-- Input container -->
      <div ref="inputRef" class="relative flex-1">
        <BaseInput
          :modelValue="modelValue"
          @update:modelValue="handleInput"
          @keydown="handleKeydown"
          :placeholder="placeholder"
          :disabled="disabled"
          :maxLength="COMMENT_MAX_LENGTH"
          size="md"
          rounded="full"
          class="pr-20"
        />

        <!-- Right icons container -->
        <div class="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <!-- Emoji picker button -->
          <button
            v-if="showEmojiPicker"
            @click="togglePicker"
            type="button"
            class="p-2 hover:bg-gray-100 rounded-full transition"
            :disabled="disabled"
          >
            <i class="pi pi-face-smile text-xl text-gray-600"></i>
          </button>

          <!-- Media upload button -->
          <label
            v-if="showMediaUpload && !mediaFile"
            class="p-2 hover:bg-gray-100 rounded-full transition cursor-pointer"
          >
            <i class="pi pi-images text-xl text-gray-600"></i>
            <input
              type="file"
              accept=".jpg,.jpeg,.gif,.webp,.png,.bmp,.mp4,.webm"
              @change="
                (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0]
                  if (file) handleMediaChange(file)
                }
              "
              class="hidden"
              :disabled="disabled"
            />
          </label>
        </div>

        <!-- Emoji Picker -->
        <div
          v-if="showPicker"
          class="absolute right-0 z-50"
          :class="{
            'top-full mt-2': pickerPosition === 'bottom',
            'bottom-full mb-2': pickerPosition === 'top',
          }"
        >
          <EmojiPickerWrapper
            v-model="showPicker"
            @select="handleEmojiSelect"
            theme="dark"
            :native="true"
            :hideSearch="true"
          />
        </div>
      </div>
    </div>
  </div>
</template>
