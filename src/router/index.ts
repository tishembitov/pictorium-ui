// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { authGuard } from './guards'

// Views
const HomeView = () => import('@/views/HomeView.vue')
const PinView = () => import('@/views/PinView.vue')
const CreatePinView = () => import('@/views/CreatePinView.vue')
const UserView = () => import('@/views/UserView.vue')
const BoardView = () => import('@/views/BoardView.vue')
const SearchView = () => import('@/views/SearchView.vue')
const ExploreView = () => import('@/views/ExploreView.vue')
const SettingsView = () => import('@/views/SettingsView.vue')
const NotFoundView = () => import('@/views/errors/NotFoundView.vue')
const ErrorView = () => import('@/views/errors/ErrorView.vue')

// Layout
const AppLayout = () => import('@/components/layout/AppLayout.vue')

const routes: RouteRecordRaw[] = [
  // ✅ ОДИН layout для ВСЕХ страниц
  {
    path: '/',
    component: AppLayout,
    children: [
      // Public
      {
        path: '',
        name: 'home',
        component: HomeView,
        meta: { title: 'Home' },
      },
      {
        path: 'pin/:id',
        name: 'pin',
        component: PinView,
        meta: { title: 'Pin' },
      },
      {
        path: 'user/:username',
        name: 'user',
        component: UserView,
        meta: { title: 'Profile' },
      },
      {
        path: 'board/:id',
        name: 'board',
        component: BoardView,
        meta: { title: 'Board' },
      },
      {
        path: 'search',
        name: 'search',
        component: SearchView,
        meta: { title: 'Search' },
      },
      {
        path: 'explore',
        name: 'explore',
        component: ExploreView,
        meta: { title: 'Explore' },
      },

      // Protected (guard проверит auth)
      {
        path: 'create',
        name: 'create',
        component: CreatePinView,
        meta: { title: 'Create Pin', requiresAuth: true },
      },
      {
        path: 'settings',
        name: 'settings',
        component: SettingsView,
        meta: { title: 'Settings', requiresAuth: true },
      },
    ],
  },

  // Error pages (без layout)
  {
    path: '/error',
    name: 'error',
    component: ErrorView,
    meta: { title: 'Error' },
  },

  // ⚠️ Catch-all ДОЛЖЕН быть ПОСЛЕДНИМ
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFoundView,
    meta: { title: 'Page Not Found' },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0, behavior: 'smooth' }
  },
})

// Guards
router.beforeEach(async (to, from, next) => {
  // Title
  const title = to.meta.title as string | undefined
  document.title = title ? `${title} | Pictorium` : 'Pictorium'

  // Auth check
  if (to.meta.requiresAuth) {
    return authGuard(to, from, next)
  }

  next()
})

export default router
