<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import type { Board, Pin } from '@/types'

export interface BoardCardProps {
  board: Board & {
    pins?: Pin[]
    pinsCount?: number
  }
  selected?: boolean
  canEdit?: boolean
  variant?: 'grid' | 'selector'
  clickable?: boolean
}

const props = withDefaults(defineProps<BoardCardProps>(), {
  selected: false,
  canEdit: false,
  variant: 'grid',
  clickable: true,
})

const emit = defineEmits<{
  (e: 'click', board: Board): void
  (e: 'delete', boardId: string): void
  (e: 'edit', board: Board): void
}>()

const router = useRouter()

const handleClick = () => {
  if (!props.clickable) return
  emit('click', props.board)
}

const handleDelete = (event: Event) => {
  event.stopPropagation()
  emit('delete', props.board.id)
}

const handleEdit = (event: Event) => {
  event.stopPropagation()
  emit('edit', props.board)
}

// Layout based on pins count (из старого кода)
const layoutVariant = computed(() => {
  const pinsCount = props.board.pins?.length || 0
  if (pinsCount === 0) return 'empty'
  if (pinsCount === 1) return 'single'
  if (pinsCount === 2) return 'double'
  if (pinsCount === 3) return 'triple'
  return 'quad'
})
</script>

<template>
  <div
    @click="handleClick"
    :class="[
      'rounded-2xl transition-all cursor-pointer overflow-hidden relative',
      'hover:scale-105',
      variant === 'grid' ? 'w-full h-48' : 'min-h-24',
      selected && 'ring-4 ring-red-600',
    ]"
  >
    <!-- Empty State -->
    <div
      v-if="layoutVariant === 'empty'"
      class="flex items-center justify-center w-full h-full bg-black"
    >
      <h3 class="bg-black/70 text-white text-lg font-bold px-4 py-2 rounded">
        {{ board.title }}
      </h3>
    </div>

    <!-- Single Pin (1 пин на весь контейнер) -->
    <div v-else-if="layoutVariant === 'single'" class="w-full h-full">
      <img
        v-if="board.pins![0].imageBlobUrl"
        :src="board.pins![0].imageBlobUrl"
        alt="Pin"
        class="object-cover w-full h-full"
      />
      <video
        v-else-if="board.pins![0].videoBlobUrl"
        :src="board.pins![0].videoBlobUrl"
        class="object-cover w-full h-full"
        autoplay
        loop
        muted
      />
    </div>

    <!-- Double Pins (Grid 1x2) -->
    <div v-else-if="layoutVariant === 'double'" class="w-full h-full grid grid-cols-2 gap-1">
      <div v-for="(pin, index) in board.pins!.slice(0, 2)" :key="index">
        <img
          v-if="pin.imageBlobUrl"
          :src="pin.imageBlobUrl"
          alt="Pin"
          class="object-cover w-full h-full"
        />
        <video
          v-else-if="pin.videoBlobUrl"
          :src="pin.videoBlobUrl"
          class="object-cover w-full h-full"
          autoplay
          loop
          muted
        />
      </div>
    </div>

    <!-- Triple Pins (1 сверху + 2 снизу) -->
    <div v-else-if="layoutVariant === 'triple'" class="w-full h-full grid grid-rows-2 gap-1">
      <!-- Top: 1 pin -->
      <div class="w-full h-full">
        <img
          v-if="board.pins![0].imageBlobUrl"
          :src="board.pins![0].imageBlobUrl"
          alt="Pin"
          class="object-cover w-full h-full"
        />
        <video
          v-else-if="board.pins![0].videoBlobUrl"
          :src="board.pins![0].videoBlobUrl"
          class="object-cover w-full h-full"
          autoplay
          loop
          muted
        />
      </div>

      <!-- Bottom: 2 pins -->
      <div class="w-full h-full grid grid-cols-2 gap-1">
        <div v-for="(pin, index) in board.pins!.slice(1, 3)" :key="index">
          <img
            v-if="pin.imageBlobUrl"
            :src="pin.imageBlobUrl"
            alt="Pin"
            class="object-cover w-full h-full"
          />
          <video
            v-else-if="pin.videoBlobUrl"
            :src="pin.videoBlobUrl"
            class="object-cover w-full h-full"
            autoplay
            loop
            muted
          />
        </div>
      </div>
    </div>

    <!-- Quad Pins (Grid 2x2) -->
    <div v-else class="w-full h-full grid grid-cols-2 grid-rows-2 gap-1">
      <div v-for="(pin, index) in board.pins!.slice(0, 4)" :key="index" class="relative">
        <img
          v-if="pin.imageBlobUrl"
          :src="pin.imageBlobUrl"
          alt="Pin"
          class="object-cover w-full h-full"
        />
        <video
          v-else-if="pin.videoBlobUrl"
          :src="pin.videoBlobUrl"
          class="object-cover w-full h-full"
          autoplay
          loop
          muted
        />
      </div>
    </div>

    <!-- Title Overlay -->
    <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
      <h3
        :class="[
          'bg-black/70 text-white text-lg font-bold px-4 py-2 rounded',
          selected && 'ring-4 ring-red-600',
        ]"
      >
        {{ board.title }}
      </h3>
    </div>

    <!-- Delete Button (только если canEdit) -->
    <div v-if="canEdit" class="absolute top-2 right-2 z-10">
      <button
        @click="handleDelete"
        class="px-3 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
      >
        Delete
      </button>
    </div>

    <!-- Pins Count Badge -->
    <div
      v-if="board.pinsCount && board.pinsCount > 4"
      class="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full"
    >
      {{ board.pinsCount }} pins
    </div>
  </div>
</template>
