// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { authGuard } from './guards'

// ============================================================================
// LAZY-LOADED VIEWS
// ============================================================================

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

// Layouts
const AppLayout = () => import('@/components/layout/AppLayout.vue')
const AuthLayout = () => import('@/components/layout/AuthLayout.vue')

// ============================================================================
// ROUTE DEFINITIONS
// ============================================================================

const routes: RouteRecordRaw[] = [
  // ══════════════════════════════════════════════════════════════════════════
  // PUBLIC ROUTES (доступны всем, Navigation показывается только auth users)
  // ══════════════════════════════════════════════════════════════════════════
  {
    path: '/',
    component: AppLayout,
    children: [
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
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // PROTECTED ROUTES (требуют авторизации - редирект на Keycloak)
  // ══════════════════════════════════════════════════════════════════════════
  {
    path: '/',
    component: AuthLayout,
    meta: { requiresAuth: true },
    children: [
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
      // Добавьте другие protected routes здесь
      // {
      //   path: 'saved',
      //   name: 'saved',
      //   component: SavedPinsView,
      //   meta: { title: 'Saved Pins', requiresAuth: true },
      // },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ERROR ROUTES
  // ══════════════════════════════════════════════════════════════════════════
  {
    path: '/error',
    name: 'error',
    component: ErrorView,
    meta: { title: 'Error' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFoundView,
    meta: { title: 'Page Not Found' },
  },
]

// ============================================================================
// ROUTER INSTANCE
// ============================================================================

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    if (to.hash) {
      return { el: to.hash, behavior: 'smooth' }
    }
    return { top: 0, behavior: 'smooth' }
  },
})

// ============================================================================
// NAVIGATION GUARDS
// ============================================================================

router.beforeEach(async (to, from, next) => {
  // 1. Обновляем title
  const title = to.meta.title as string | undefined
  document.title = title ? `${title} | Pictorium` : 'Pictorium'

  // 2. Проверяем auth для protected routes
  if (to.matched.some((record) => record.meta.requiresAuth)) {
    return authGuard(to, from, next)
  }

  // 3. Public routes - пропускаем
  next()
})

// Error handling
router.onError((error) => {
  console.error('[Router] Navigation error:', error)

  if (error.message.includes('Failed to fetch dynamically imported module')) {
    window.location.reload()
  }
})

export default router

// ============================================================================
// TYPE AUGMENTATION
// ============================================================================

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    requiresAuth?: boolean
    roles?: string[]
  }
}
