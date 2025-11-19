import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    layout?: 'default' | 'auth' | 'guest'
    title?: string
    keepAlive?: boolean
    roles?: string[]
  }
}
