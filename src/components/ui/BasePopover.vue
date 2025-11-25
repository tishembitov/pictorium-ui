<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { usePopover } from '@/composables/ui/usePopover'

export interface BasePopoverProps {
  modelValue: boolean
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto'
  offset?: number
  trigger?: 'hover' | 'click'
  closeOnClickOutside?: boolean
  closeOnEscape?: boolean
}

const props = withDefaults(defineProps<BasePopoverProps>(), {
  modelValue: false,
  position: 'auto',
  offset: 10,
  trigger: 'hover',
  closeOnClickOutside: true,
  closeOnEscape: true,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const triggerRef = ref<HTMLElement | null>(null)
const popoverRef = ref<HTMLElement | null>(null)

// ✅ Используем usePopover composable
const { isOpen, open, close, toggle, updatePosition } = usePopover(triggerRef, popoverRef, {
  position: props.position === 'auto' ? 'bottom' : props.position,
  offset: props.offset,
  closeOnClickOutside: props.closeOnClickOutside,
  closeOnEscape: props.closeOnEscape,
})

// Sync with v-model
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue && !isOpen.value) {
      open()
    } else if (!newValue && isOpen.value) {
      close()
    }
  },
)

watch(isOpen, (newValue) => {
  emit('update:modelValue', newValue)
})

// Hover handling с задержкой для плавного перехода на popover
let hoverTimeout: ReturnType<typeof setTimeout> | undefined
const insidePopover = ref(false)

const handleTriggerEnter = () => {
  if (props.trigger !== 'hover') return
  if (hoverTimeout) clearTimeout(hoverTimeout)
  open()
}

const handleTriggerLeave = () => {
  if (props.trigger !== 'hover') return
  hoverTimeout = setTimeout(() => {
    if (!insidePopover.value) {
      close()
    }
  }, 100)
}

const handlePopoverEnter = () => {
  insidePopover.value = true
  if (hoverTimeout) clearTimeout(hoverTimeout)
}

const handlePopoverLeave = () => {
  insidePopover.value = false
  if (props.trigger === 'hover') {
    close()
  }
}

const handleTriggerClick = () => {
  if (props.trigger === 'click') {
    toggle()
  }
}
</script>

<template>
  <div class="relative inline-block">
    <!-- Trigger -->
    <div
      ref="triggerRef"
      @mouseenter="handleTriggerEnter"
      @mouseleave="handleTriggerLeave"
      @click="handleTriggerClick"
    >
      <slot name="trigger" />
    </div>

    <!-- Popover -->
    <Transition name="popover-fade">
      <div
        v-if="isOpen"
        ref="popoverRef"
        class="absolute z-50"
        @mouseenter="handlePopoverEnter"
        @mouseleave="handlePopoverLeave"
      >
        <slot />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.popover-fade-enter-active,
.popover-fade-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.popover-fade-enter-from,
.popover-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
