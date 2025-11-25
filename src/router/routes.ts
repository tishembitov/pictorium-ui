// // src/router/routes.ts
// import type { RouteRecordRaw } from 'vue-router'

// const routes: RouteRecordRaw[] = [
//   // ============================================================================
//   // PUBLIC ROUTES (Guest)
//   // ============================================================================
//   {
//     path: '/landing',
//     name: 'landing',
//     component: () => import('@/views/LandingView.vue'),
//     meta: {
//       requiresAuth: false,
//       layout: 'guest',
//       title: 'Welcome',
//     },
//   },
//   {
//     path: '/portfolio',
//     name: 'portfolio',
//     component: () => import('@/views/PortfolioView.vue'),
//     meta: {
//       requiresAuth: false,
//       layout: 'guest',
//       title: 'Portfolio',
//     },
//   },

//   // ============================================================================
//   // AUTHENTICATED ROUTES
//   // ============================================================================
//   {
//     path: '/',
//     name: 'home',
//     component: () => import('@/views/HomeView.vue'),
//     meta: {
//       requiresAuth: true,
//       layout: 'default',
//       keepAlive: true,
//       title: 'Home',
//     },
//   },
//   {
//     path: '/pin/:id',
//     name: 'pin',
//     component: () => import('@/views/PinDetailView.vue'),
//     meta: {
//       requiresAuth: true,
//       layout: 'default',
//       title: 'Pin',
//     },
//     props: true,
//   },
//   {
//     path: '/create-pin',
//     name: 'create-pin',
//     component: () => import('@/views/CreatePinView.vue'),
//     meta: {
//       requiresAuth: true,
//       layout: 'default',
//       title: 'Create Pin',
//     },
//   },
//   {
//     path: '/user/:username',
//     name: 'user-profile',
//     component: () => import('@/views/UserProfileView.vue'),
//     meta: {
//       requiresAuth: true,
//       layout: 'default',
//       keepAlive: true,
//       title: 'Profile',
//     },
//     props: true,
//   },
//   {
//     path: '/settings/profile',
//     name: 'edit-profile',
//     component: () => import('@/views/EditProfileView.vue'),
//     meta: {
//       requiresAuth: true,
//       layout: 'default',
//       title: 'Edit Profile',
//     },
//   },
//   {
//     path: '/board/:id',
//     name: 'board',
//     component: () => import('@/views/BoardDetailView.vue'),
//     meta: {
//       requiresAuth: true,
//       layout: 'default',
//       title: 'Board',
//     },
//     props: true,
//   },
//   {
//     path: '/search',
//     name: 'search',
//     component: () => import('@/views/SearchView.vue'),
//     meta: {
//       requiresAuth: true,
//       layout: 'default',
//       title: 'Search',
//     },
//   },
//   {
//     path: '/tag/:name',
//     name: 'tag',
//     component: () => import('@/views/TagPinsView.vue'),
//     meta: {
//       requiresAuth: true,
//       layout: 'default',
//       title: 'Tag',
//     },
//     props: true,
//   },
//   {
//     path: '/categories',
//     name: 'categories',
//     component: () => import('@/views/CategoriesView.vue'),
//     meta: {
//       requiresAuth: true,
//       layout: 'default',
//       title: 'Categories',
//     },
//   },
//   {
//     path: '/saved',
//     name: 'saved',
//     component: () => import('@/views/SavedPinsView.vue'),
//     meta: {
//       requiresAuth: true,
//       layout: 'default',
//       title: 'Saved',
//     },
//   },
//   {
//     path: '/messages',
//     name: 'messages',
//     component: () => import('@/views/MessagesView.vue'),
//     meta: {
//       requiresAuth: true,
//       layout: 'default',
//       title: 'Messages',
//     },
//   },
//   {
//     path: '/notifications',
//     name: 'notifications',
//     component: () => import('@/views/NotificationsView.vue'),
//     meta: {
//       requiresAuth: true,
//       layout: 'default',
//       title: 'Notifications',
//     },
//   },

//   // ============================================================================
//   // ERROR ROUTES
//   // ============================================================================
//   {
//     path: '/unauthorized',
//     name: 'unauthorized',
//     component: () => import('@/views/errors/UnauthorizedView.vue'),
//     meta: {
//       requiresAuth: false,
//       layout: 'guest',
//       title: 'Unauthorized',
//     },
//   },
//   {
//     path: '/forbidden',
//     name: 'forbidden',
//     component: () => import('@/views/errors/ForbiddenView.vue'),
//     meta: {
//       requiresAuth: false,
//       layout: 'guest',
//       title: 'Forbidden',
//     },
//   },
//   {
//     path: '/:pathMatch(.*)*',
//     name: 'not-found',
//     component: () => import('@/views/errors/NotFoundView.vue'),
//     meta: {
//       requiresAuth: false,
//       layout: 'guest',
//       title: 'Not Found',
//     },
//   },
// ]

// export default routes
