<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { shouldPositionTop } from '@/utils/positioning'

export interface BasePopoverProps {
  modelValue: boolean
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto'
  offset?: number
  trigger?: 'hover' | 'click'
  closeOnClickOutside?: boolean
}

const props = withDefaults(defineProps<BasePopoverProps>(), {
  modelValue: false,
  position: 'auto',
  offset: 10,
  trigger: 'hover',
  closeOnClickOutside: true,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const triggerRef = ref<HTMLElement | null>(null)
const popoverRef = ref<HTMLElement | null>(null)
const isTop = ref(true)

const calculatePosition = async () => {
  await nextTick()

  if (!triggerRef.value || !popoverRef.value) return

  if (props.position === 'auto') {
    isTop.value = shouldPositionTop(triggerRef.value)
  } else {
    isTop.value = props.position === 'top'
  }
}

const show = async () => {
  emit('update:modelValue', true)
  await calculatePosition()
}

const hide = () => {
  emit('update:modelValue', false)
}

const toggle = async () => {
  if (props.modelValue) {
    hide()
  } else {
    await show()
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
    hide()
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
        :style="{
          top: isTop ? 'auto' : `${offset}px`,
          bottom: isTop ? `${offset}px` : 'auto',
        }"
      >
        <slot />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.popover-fade-enter-active,
.popover-fade-leave-active {
  transition: opacity 0.2s ease;
}

.popover-fade-enter-from,
.popover-fade-leave-to {
  opacity: 0;
}
</style>
