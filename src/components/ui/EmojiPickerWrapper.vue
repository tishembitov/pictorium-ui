<script setup lang="ts">
import EmojiPicker from 'vue3-emoji-picker'
import 'vue3-emoji-picker/css'

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
  (e: 'select', emoji: any): void
}>()

const handleSelect = (emoji: any) => {
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
