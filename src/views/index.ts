// src/views/index.ts
/**
 * Views Index
 * Lazy-loaded views для оптимизации bundle size
 */

// Main views
export const HomeView = () => import('./HomeView.vue')
export const PinView = () => import('./PinView.vue')
export const CreatePinView = () => import('./CreatePinView.vue')
export const UserView = () => import('./UserView.vue')
export const BoardView = () => import('./BoardView.vue')
export const SearchView = () => import('./SearchView.vue')
export const ExploreView = () => import('./ExploreView.vue')
export const SettingsView = () => import('./SettingsView.vue')

// Auth views
export const LoginView = () => import('./auth/LoginView.vue')
export const RegisterView = () => import('./auth/RegisterView.vue')
export const CallbackView = () => import('./auth/CallbackView.vue')

// Error views
export const NotFoundView = () => import('./errors/NotFoundView.vue')
export const ErrorView = () => import('./errors/ErrorView.vue')
