<script setup lang="ts">
import EmojiPicker from 'vue3-emoji-picker'
import 'vue3-emoji-picker/css'

export interface EmojiObject {
  /** Emoji character (e.g., "😀") */
  i: string
  /** Emoji names/aliases */
  n?: string[]
  /** Emoji category */
  r?: string
  /** Emoji tone */
  t?: string
  /** Unicode representation */
  u?: string
}

export interface EmojiPickerWrapperProps {
  modelValue: boolean
  theme?: 'light' | 'dark' | 'auto'
  native?: boolean
  hideSearch?: boolean
  hideGroupIcons?: boolean
  hideGroupNames?: boolean
  disableSkinTones?: boolean
  displayRecent?: boolean
}

const props = withDefaults(defineProps<EmojiPickerWrapperProps>(), {
  modelValue: false,
  theme: 'dark',
  native: true,
  hideSearch: true,
  hideGroupIcons: false,
  hideGroupNames: false,
  disableSkinTones: false,
  displayRecent: true,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'select', emoji: EmojiObject): void
}>()

function handleSelect(emoji: EmojiObject) {
  emit('select', emoji)
}

const close = () => {
  emit('update:modelValue', false)
}
</script>

<template>
  <Transition name="fade">
    <div v-if="modelValue" class="relative">
      <EmojiPicker
        :theme="theme"
        :native="native"
        :hide-search="hideSearch"
        :hide-group-icons="hideGroupIcons"
        :hide-group-names="hideGroupNames"
        :disable-skin-tones="disableSkinTones"
        :display-recent="displayRecent"
        @select="handleSelect"
      />
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
