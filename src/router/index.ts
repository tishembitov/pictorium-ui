// frontend/src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import { authGuard, guestGuard } from './guards/auth.guard'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // {
    //   path: '/',
    //   name: 'home',
    //   component: () => import('@/views/HomePage.vue'),
    // },
    {
      path: '/landing',
      name: 'landing',
      component: () => import('@/views/LandingPage.vue'),
      beforeEnter: guestGuard, // Только для гостей
    },
    // {
    //   path: '/create',
    //   name: 'create-pin',
    //   component: () => import('@/views/CreatePinPage.vue'),
    //   beforeEnter: authGuard, // Требует авторизации
    // },
    // {
    //   path: '/settings',
    //   name: 'settings',
    //   component: () => import('@/views/SettingsPage.vue'),
    //   beforeEnter: authGuard,
    // },
    // // ...
  ],
})

export default router
