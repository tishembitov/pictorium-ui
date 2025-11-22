<script setup lang="ts">
import { ref, watch } from 'vue'

export type UserTab = 'created' | 'saved' | 'liked' | 'boards'

export interface UserTabsProps {
  modelValue?: UserTab
  showLiked?: boolean
}

const props = withDefaults(defineProps<UserTabsProps>(), {
  modelValue: 'created',
  showLiked: true,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: UserTab): void
}>()

const activeTab = ref<UserTab>(props.modelValue)

watch(
  () => props.modelValue,
  (newValue) => {
    activeTab.value = newValue
  },
)

const selectTab = (tab: UserTab) => {
  activeTab.value = tab
  emit('update:modelValue', tab)
}
</script>

<template>
  <div class="flex items-center justify-center gap-4 mt-6 border-b border-gray-200">
    <button
      @click="selectTab('created')"
      :class="[
        'relative px-6 py-3 font-semibold transition-all duration-200',
        activeTab === 'created'
          ? 'text-black border-b-2 border-red-600'
          : 'text-gray-600 hover:text-black',
      ]"
    >
      Created
    </button>

    <button
      @click="selectTab('saved')"
      :class="[
        'relative px-6 py-3 font-semibold transition-all duration-200',
        activeTab === 'saved'
          ? 'text-black border-b-2 border-red-600'
          : 'text-gray-600 hover:text-black',
      ]"
    >
      Saved
    </button>

    <button
      v-if="showLiked"
      @click="selectTab('liked')"
      :class="[
        'relative px-6 py-3 font-semibold transition-all duration-200',
        activeTab === 'liked'
          ? 'text-black border-b-2 border-red-600'
          : 'text-gray-600 hover:text-black',
      ]"
    >
      Liked
    </button>

    <button
      @click="selectTab('boards')"
      :class="[
        'relative px-6 py-3 font-semibold transition-all duration-200',
        activeTab === 'boards'
          ? 'text-black border-b-2 border-red-600'
          : 'text-gray-600 hover:text-black',
      ]"
    >
      Boards
    </button>
  </div>
</template>
