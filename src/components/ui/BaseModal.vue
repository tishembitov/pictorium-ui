<script setup lang="ts">
import { onMounted, onBeforeUnmount, watch } from 'vue'

export interface BaseModalProps {
  modelValue: boolean
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  closable?: boolean
  closeOnOverlay?: boolean
  persistent?: boolean
  showHeader?: boolean
  showFooter?: boolean
  maxHeight?: boolean
}

const props = withDefaults(defineProps<BaseModalProps>(), {
  modelValue: false,
  title: '',
  size: 'md',
  closable: true,
  closeOnOverlay: true,
  persistent: false,
  showHeader: true,
  showFooter: false,
  maxHeight: true,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'close'): void
  (e: 'opened'): void
  (e: 'closed'): void
}>()

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
  full: 'max-w-full mx-4',
}

const close = () => {
  if (!props.persistent) {
    emit('update:modelValue', false)
    emit('close')
  }
}

const handleOverlayClick = () => {
  if (props.closeOnOverlay && !props.persistent) {
    close()
  }
}

const handleEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.closable && !props.persistent) {
    close()
  }
}

watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      document.body.classList.add('overflow-hidden')
      emit('opened')
    } else {
      document.body.classList.remove('overflow-hidden')
      emit('closed')
    }
  },
)

onMounted(() => {
  window.addEventListener('keydown', handleEscape)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleEscape)
  document.body.classList.remove('overflow-hidden')
})
</script>

<template>
  <Transition name="modal-fade">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4"
      @click.self="handleOverlayClick"
    >
      <Transition name="modal-slide">
        <div
          v-if="modelValue"
          :class="[
            'relative bg-white rounded-2xl shadow-2xl w-full',
            sizeClasses[size],
            maxHeight && 'max-h-[90vh] overflow-hidden flex flex-col',
          ]"
        >
          <!-- Header -->
          <div
            v-if="showHeader || $slots.header"
            class="flex items-center justify-between p-6 border-b border-gray-200"
          >
            <slot name="header">
              <h2 class="text-xl font-semibold text-gray-900">{{ title }}</h2>
            </slot>

            <button
              v-if="closable"
              @click="close"
              class="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <!-- Body -->
          <div :class="['p-6', maxHeight && 'overflow-y-auto flex-1']">
            <slot />
          </div>

          <!-- Footer -->
          <div
            v-if="showFooter || $slots.footer"
            class="flex items-center justify-end gap-3 p-6 border-t border-gray-200"
          >
            <slot name="footer">
              <button
                @click="close"
                class="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-full hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                class="px-6 py-2 text-sm font-medium text-white bg-red-600 rounded-full hover:bg-red-700 transition"
              >
                Confirm
              </button>
            </slot>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-slide-enter-active,
.modal-slide-leave-active {
  transition:
    transform 0.3s ease,
    opacity 0.3s ease;
}

.modal-slide-enter-from,
.modal-slide-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}
</style>
