<!-- frontend/src/views/LandingPage.vue -->
<template>
  <div class="min-h-screen bg-gradient-to-b from-white to-gray-50">
    <!-- Hero Section -->
    <section class="relative overflow-hidden">
      <!-- Background pattern -->
      <div class="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />

      <div class="container mx-auto px-4 py-20">
        <div class="max-w-4xl mx-auto text-center">
          <!-- Logo -->
          <div class="flex justify-center mb-8">
            <div class="w-16 h-16 bg-pictorium-red rounded-full flex items-center justify-center">
              <span class="text-white text-2xl font-bold">P</span>
            </div>
          </div>

          <h1 class="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Найди свою
            <span class="text-pictorium-red">идею</span>
          </h1>

          <p class="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Pictorium — место, где живут идеи. Сохраняйте, организуйте и делитесь вдохновением с
            миллионами людей.
          </p>

          <!-- Auth buttons -->
          <div v-if="!isAuthenticated" class="flex flex-col sm:flex-row gap-4 justify-center">
            <LoginButton size="lg" class="min-w-[200px]"> Войти </LoginButton>

            <button
              @click="register"
              class="px-8 py-4 text-lg font-semibold rounded-full border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all min-w-[200px]"
            >
              Зарегистрироваться
            </button>
          </div>

          <!-- Authenticated state -->
          <div v-else class="flex flex-col items-center gap-4">
            <p class="text-lg text-gray-600">
              С возвращением, <span class="font-semibold">{{ username }}</span
              >! 👋
            </p>
            <RouterLink
              to="/"
              class="px-8 py-4 text-lg font-semibold rounded-full bg-pictorium-red text-white hover:bg-pictorium-red-hover transition-all"
            >
              Перейти к лентам
            </RouterLink>
          </div>

          <!-- Social login -->
          <div v-if="!isAuthenticated" class="mt-8">
            <SocialLoginButtons divider-text="или продолжите с" class="max-w-sm mx-auto" />
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="py-20 bg-white">
      <div class="container mx-auto px-4">
        <div class="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon="🔍"
            title="Ищите идеи"
            description="Миллионы пинов с идеями для дома, моды, рецептов и многого другого"
          />
          <FeatureCard
            icon="📌"
            title="Сохраняйте"
            description="Собирайте идеи на досках и возвращайтесь к ним когда угодно"
          />
          <FeatureCard
            icon="✨"
            title="Создавайте"
            description="Делитесь своими работами и вдохновляйте других"
          />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useAuth } from '@/composables/auth/useAuth'
import LoginButton from '@/components/auth/LoginButton.vue'
import SocialLoginButtons from '@/components/auth/SocialLoginButtons.vue'
import FeatureCard from '@/components/landing/FeatureCard.vue'

const { isAuthenticated, username, register } = useAuth()
</script>
