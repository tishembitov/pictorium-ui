<script setup lang="ts">
export interface BaseLoaderProps {
  variant?: 'logo' | 'spinner' | 'dots'
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
</script>

<template>
  <div
    :class="[
      'flex items-center justify-center',
      fullscreen ? 'fixed inset-0 z-50 bg-white' : 'h-full min-h-[200px]',
    ]"
  >
    <!-- Logo variant (из старого кода) -->
    <span v-if="variant === 'logo'" :class="['logo', sizeClasses[size]]"> 🐰 </span>

    <!-- Spinner variant (из старого loader2) -->
    <span v-else-if="variant === 'spinner'" :class="['loader2', spinnerSizeClasses[size]]"></span>

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
      ></span>
    </div>
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

.loader2 {
  background: #fff;
  border-radius: 50%;
  display: inline-block;
  position: relative;
  box-sizing: border-box;
  animation: rotation 1s linear infinite;
}

.loader2::after {
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

@keyframes rotation {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
