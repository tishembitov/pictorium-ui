<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'

export interface BasePopoverProps {
  modelValue: boolean
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto'
  offset?: number
  trigger?: 'hover' | 'click'
  closeOnClickOutside?: boolean
  minDistanceToEdge?: number
}

const props = withDefaults(defineProps<BasePopoverProps>(), {
  modelValue: false,
  position: 'auto',
  offset: 10,
  trigger: 'hover',
  closeOnClickOutside: true,
  minDistanceToEdge: 200,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const triggerRef = ref<HTMLElement | null>(null)
const popoverRef = ref<HTMLElement | null>(null)
const isTop = ref(false)
const isLeft = ref(false)
const insidePopover = ref(false)

const calculatePosition = async () => {
  await nextTick()

  if (!triggerRef.value) return

  const rect = triggerRef.value.getBoundingClientRect()

  if (props.position === 'auto') {
    // Вертикальное позиционирование
    const distanceToBottom = window.innerHeight - rect.bottom
    isTop.value = distanceToBottom < props.minDistanceToEdge

    // Горизонтальное позиционирование
    const distanceToRight = window.innerWidth - rect.right
    isLeft.value = distanceToRight < props.minDistanceToEdge
  } else {
    isTop.value = props.position === 'top'
    isLeft.value = props.position === 'left'
  }
}

const show = async () => {
  emit('update:modelValue', true)
  await calculatePosition()
}

const hide = () => {
  // Задержка для возможности перемещения курсора на popover
  if (props.trigger === 'hover' && insidePopover.value) {
    return
  }
  emit('update:modelValue', false)
}

const toggle = async () => {
  if (props.modelValue) {
    hide()
  } else {
    await show()
  }
}

const handleMouseEnterPopover = () => {
  insidePopover.value = true
}

const handleMouseLeavePopover = () => {
  insidePopover.value = false
  if (props.trigger === 'hover') {
    hide()
  }
}

const handleClickOutside = (event: MouseEvent) => {
  if (!props.closeOnClickOutside) return

  const target = event.target as Node

  if (
    triggerRef.value &&
    popoverRef.value &&
    !triggerRef.value.contains(target) &&
    !popoverRef.value.contains(target)
  ) {
    emit('update:modelValue', false)
  }
}

onMounted(() => {
  if (props.closeOnClickOutside) {
    document.addEventListener('click', handleClickOutside)
  }
})

onBeforeUnmount(() => {
  if (props.closeOnClickOutside) {
    document.removeEventListener('click', handleClickOutside)
  }
})
</script>

<template>
  <div class="relative inline-block">
    <!-- Trigger -->
    <div
      ref="triggerRef"
      @mouseenter="trigger === 'hover' && show()"
      @mouseleave="trigger === 'hover' && hide()"
      @click="trigger === 'click' && toggle()"
    >
      <slot name="trigger" />
    </div>

    <!-- Popover -->
    <Transition name="popover-fade">
      <div
        v-if="modelValue"
        ref="popoverRef"
        class="absolute z-50"
        :class="[isLeft ? 'right-0' : 'left-0']"
        :style="{
          top: isTop ? 'auto' : `calc(100% + ${offset}px)`,
          bottom: isTop ? `calc(100% + ${offset}px)` : 'auto',
        }"
        @mouseenter="handleMouseEnterPopover"
        @mouseleave="handleMouseLeavePopover"
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
