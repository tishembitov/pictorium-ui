<!-- src/components/ui/BaseLoader.vue -->
<script setup lang="ts">
export interface BaseLoaderProps {
  variant?: 'logo' | 'spinner' | 'dots' | 'colorful'
  size?: 'sm' | 'md' | 'lg'
  color?: string
  fullscreen?: boolean
}

const props = withDefaults(defineProps<BaseLoaderProps>(), {
  variant: 'logo',
  size: 'md',
  color: 'red',
  fullscreen: false,
})

const sizeClasses = {
  sm: 'text-4xl',
  md: 'text-6xl',
  lg: 'text-8xl',
}

const spinnerSizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
}

// Размеры для colorful loader (пропорции из старого проекта)
const colorfulSizeClasses = {
  sm: 'w-6 h-6 border-[2px]',
  md: 'w-12 h-12 border-[3px]',
  lg: 'w-16 h-16 border-[4px]',
}

const colorfulPseudoScale = {
  sm: 0.5,
  md: 1,
  lg: 1.33,
}
</script>

<template>
  <div
    :class="[
      'flex items-center justify-center',
      fullscreen ? 'fixed inset-0 z-50 bg-white' : 'h-full min-h-[200px]',
    ]"
  >
    <!-- Logo variant -->
    <span v-if="variant === 'logo'" :class="['logo', sizeClasses[size]]"> 🐰 </span>

    <!-- Spinner variant -->
    <span v-else-if="variant === 'spinner'" :class="['loader-spinner', spinnerSizeClasses[size]]" />

    <!-- Dots variant -->
    <div v-else-if="variant === 'dots'" class="flex items-center gap-2">
      <span
        v-for="i in 3"
        :key="i"
        :class="[
          'rounded-full bg-red-500 animate-bounce',
          size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : 'w-4 h-4',
        ]"
        :style="{ animationDelay: `${i * 0.15}s` }"
      />
    </div>

    <!-- ✅ Colorful variant (из старого проекта) -->
    <span
      v-else-if="variant === 'colorful'"
      :class="['loader-colorful', colorfulSizeClasses[size]]"
      :style="{ '--pseudo-scale': colorfulPseudoScale[size] }"
    />
  </div>
</template>

<style scoped>
@keyframes pulse-scale {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.5);
  }
  100% {
    transform: scale(1);
  }
}

.logo {
  animation: pulse-scale 1.5s infinite ease-in-out;
}

.loader-spinner {
  background: #fff;
  border-radius: 50%;
  display: inline-block;
  position: relative;
  box-sizing: border-box;
  animation: rotation 1s linear infinite;
}

.loader-spinner::after {
  content: '';
  box-sizing: border-box;
  position: absolute;
  left: 6px;
  top: 10px;
  width: 12px;
  height: 12px;
  color: #ff3d00;
  background: currentColor;
  border-radius: 50%;
  box-shadow:
    25px 2px,
    10px 22px;
}

/* ✅ Colorful loader из старого проекта */
.loader-colorful {
  display: inline-block;
  position: relative;
  border-style: solid dotted solid dotted;
  border-color: #c50000 rgba(10, 255, 39, 0.3) #1c589e rgba(255, 101, 101, 0.836);
  border-radius: 50%;
  box-sizing: border-box;
  animation: rotation 1s linear infinite;
}

.loader-colorful::before,
.loader-colorful::after {
  content: '';
  top: 0;
  left: 0;
  position: absolute;
  border: calc(10px * var(--pseudo-scale, 1)) solid transparent;
  border-bottom-color: #a309d27a;
  transform: translate(calc(-10px * var(--pseudo-scale, 1)), calc(19px * var(--pseudo-scale, 1)))
    rotate(-35deg);
}

.loader-colorful::after {
  border-color: #de3500 transparent transparent transparent;
  transform: translate(calc(32px * var(--pseudo-scale, 1)), calc(3px * var(--pseudo-scale, 1)))
    rotate(-35deg);
}

@keyframes rotation {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
