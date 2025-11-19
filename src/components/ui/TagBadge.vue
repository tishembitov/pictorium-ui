<script setup lang="ts">
export interface TagBadgeProps {
  label: string
  color?: string
  selected?: boolean
  removable?: boolean
  clickable?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<TagBadgeProps>(), {
  color: 'bg-red-200',
  selected: false,
  removable: false,
  clickable: true,
  size: 'md',
})

const emit = defineEmits<{
  (e: 'click'): void
  (e: 'remove'): void
}>()

const sizeClasses = {
  sm: 'text-xs px-2 py-1',
  md: 'text-sm px-3 py-2',
  lg: 'text-base px-4 py-2',
}

const handleClick = () => {
  if (props.clickable) {
    emit('click')
  }
}

const handleRemove = (event: Event) => {
  event.stopPropagation()
  emit('remove')
}
</script>

<template>
  <div
    @click="handleClick"
    :class="[
      'inline-flex items-center gap-2 rounded-full font-medium transition-all duration-200',
      sizeClasses[size],
      selected ? 'bg-black text-white shadow-lg scale-110' : color,
      clickable && 'cursor-pointer hover:scale-110',
      !clickable && 'cursor-default',
    ]"
  >
    <span class="truncate">{{ label }}</span>

    <button
      v-if="removable"
      @click="handleRemove"
      class="hover:bg-black hover:bg-opacity-20 rounded-full p-0.5 transition"
    >
      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>
  </div>
</template>
