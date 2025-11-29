// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import {
  HomeView,
  PinView,
  CreatePinView,
  UserView,
  BoardView,
  SearchView,
  ExploreView,
  SettingsView,
  NotFoundView,
} from '@/views'

const routes: RouteRecordRaw[] = [
  // Main routes
  {
    path: '/',
    name: 'home',
    component: HomeView,
  },
  {
    path: '/pin/:id',
    name: 'pin',
    component: PinView,
  },
  {
    path: '/create',
    name: 'create',
    component: CreatePinView,
    meta: { requiresAuth: true },
  },
  {
    path: '/user/:username',
    name: 'user',
    component: UserView,
  },
  {
    path: '/board/:id',
    name: 'board',
    component: BoardView,
  },
  {
    path: '/search',
    name: 'search',
    component: SearchView,
  },
  {
    path: '/explore',
    name: 'explore',
    component: ExploreView,
  },
  {
    path: '/settings',
    name: 'settings',
    component: SettingsView,
    meta: { requiresAuth: true },
  },

  // Error routes
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFoundView,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    return { top: 0 }
  },
})

export default router
