// src/components/layout/index.ts
/**
 * Layout Components
 *
 * AppLayout - базовый layout с Navigation и Header
 * AuthLayout - для авторизованных пользователей (с редиректом на Keycloak)
 * GuestLayout - для гостей (без Navigation)
 */

export { default as AppLayout } from './AppLayout.vue'
export { default as AuthLayout } from './AuthLayout.vue'
export { default as GuestLayout } from './GuestLayout.vue'
