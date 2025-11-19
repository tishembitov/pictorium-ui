<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

export interface AppHeaderProps {
  showSearch?: boolean
}

const emit = defineEmits<(e: 'search', value: string) => void>()

const router = useRouter()

const searchValue = ref('')
const showSearchSection = ref(false)

const handleSearch = () => {
  if (searchValue.value.trim()) {
    emit('search', searchValue.value.trim())
    router.push(`/search?q=${encodeURIComponent(searchValue.value.trim())}`)
  }
}

const handleEnter = () => {
  handleSearch()
  showSearchSection.value = false
}

const clearSearch = () => {
  searchValue.value = ''
  showSearchSection.value = false
}
</script>

<template>
  <nav
    :class="[
      'fixed top-0 left-20 right-0 z-40 transition-all',
      showSearchSection ? 'bg-white' : 'bg-white/20 backdrop-blur-sm',
    ]"
  >
    <div class="flex items-center justify-between px-6 py-2">
      <!-- Search bar -->
      <div v-if="onSearch" class="relative flex-1 mr-20">
        <input
          v-model="searchValue"
          type="text"
          placeholder="Search"
          @click="showSearchSection = true"
          @keydown.enter="handleEnter"
          class="transition-all duration-300 cursor-text bg-white bg-opacity-20 backdrop-blur-sm text-black text-md rounded-full block w-full py-3 pl-12 pr-12 outline-none border border-black focus:shadow-lg focus:shadow-blue-500/50"
        />

        <!-- Search icon -->
        <div class="absolute left-1 top-4 pl-3 flex items-center pointer-events-none">
          <i class="pi pi-search text-black"></i>
        </div>

        <!-- Clear button -->
        <button
          v-if="showSearchSection"
          @click="clearSearch"
          class="absolute right-3 top-1/2 transform -translate-y-1/2 px-3 py-1 rounded-full text-lg text-white bg-black hover:bg-gray-800 transition"
        >
          ✕
        </button>
      </div>

      <!-- Right side slot -->
      <slot name="right" />
    </div>

    <!-- Search section dropdown -->
    <Transition name="slide-down">
      <div
        v-if="showSearchSection"
        class="absolute left-0 right-0 top-full bg-white shadow-lg"
        @click.self="showSearchSection = false"
      >
        <slot name="searchSection" :searchValue="searchValue" />
      </div>
    </Transition>
  </nav>
</template>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}
</style>
