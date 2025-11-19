// import { RouteRecordRaw } from 'vue-router'

// const routes: RouteRecordRaw[] = [
//   // Landing (Guest)
//   {
//     path: '/landing',
//     name: 'landing',
//     component: () => import('@/views/Landing.vue'),
//     meta: {
//       requiresAuth: false,
//       layout: 'guest',
//       title: 'Welcome',
//     },
//   },

//   // Portfolio (Guest)
//   {
//     path: '/portfolio',
//     name: 'portfolio',
//     component: () => import('@/views/Portfolio.vue'),
//     meta: {
//       requiresAuth: false,
//       layout: 'guest',
//       title: 'Portfolio',
//     },
//   },

//   // Home (Auth)
//   {
//     path: '/',
//     name: 'home',
//     component: () => import('@/views/Home.vue'),
//     meta: {
//       requiresAuth: true,
//       layout: 'auth',
//       keepAlive: true,
//       title: 'Home',
//     },
//   },

//   // Pin Detail (Auth)
//   {
//     path: '/pin/:id',
//     name: 'pin',
//     component: () => import('@/views/PinDetail.vue'),
//     meta: {
//       requiresAuth: true,
//       layout: 'auth',
//       keepAlive: true,
//       title: 'Pin',
//     },
//   },

//   // Create Pin (Auth)
//   {
//     path: '/create-pin',
//     name: 'create-pin',
//     component: () => import('@/views/CreatePin.vue'),
//     meta: {
//       requiresAuth: true,
//       layout: 'auth',
//       title: 'Create Pin',
//     },
//   },

//   // User Profile (Auth)
//   {
//     path: '/user/:username',
//     name: 'user',
//     component: () => import('@/views/UserProfile.vue'),
//     meta: {
//       requiresAuth: true,
//       layout: 'auth',
//       keepAlive: true,
//       title: 'Profile',
//     },
//   },

//   // Edit Profile (Auth)
//   {
//     path: '/settings/profile',
//     name: 'edit-profile',
//     component: () => import('@/views/EditProfile.vue'),
//     meta: {
//       requiresAuth: true,
//       layout: 'auth',
//       title: 'Edit Profile',
//     },
//   },

//   // Board Detail (Auth)
//   {
//     path: '/board/:id',
//     name: 'board',
//     component: () => import('@/views/BoardDetail.vue'),
//     meta: {
//       requiresAuth: true,
//       layout: 'auth',
//       title: 'Board',
//     },
//   },

//   // Search Results (Auth)
//   {
//     path: '/search',
//     name: 'search',
//     component: () => import('@/views/SearchResults.vue'),
//     meta: {
//       requiresAuth: true,
//       layout: 'auth',
//       title: 'Search',
//     },
//   },

//   // Tag Pins (Auth)
//   {
//     path: '/tag/:name',
//     name: 'tag',
//     component: () => import('@/views/TagPins.vue'),
//     meta: {
//       requiresAuth: true,
//       layout: 'auth',
//       title: 'Tag',
//     },
//   },

//   // Categories (Auth)
//   {
//     path: '/categories',
//     name: 'categories',
//     component: () => import('@/views/Categories.vue'),
//     meta: {
//       requiresAuth: true,
//       layout: 'auth',
//       title: 'Categories',
//     },
//   },

//   // Saved Pins (Auth)
//   {
//     path: '/saved',
//     name: 'saved',
//     component: () => import('@/views/SavedPins.vue'),
//     meta: {
//       requiresAuth: true,
//       layout: 'auth',
//       title: 'Saved',
//     },
//   },

//   // Messages (Auth)
//   {
//     path: '/messages',
//     name: 'messages',
//     component: () => import('@/views/Messages.vue'),
//     meta: {
//       requiresAuth: true,
//       layout: 'auth',
//       title: 'Messages',
//     },
//   },

//   // Notifications (Auth)
//   {
//     path: '/notifications',
//     name: 'notifications',
//     component: () => import('@/views/Notifications.vue'),
//     meta: {
//       requiresAuth: true,
//       layout: 'auth',
//       title: 'Notifications',
//     },
//   },

//   // Recommendations (Auth)
//   {
//     path: '/recommendations/:id',
//     name: 'recommendations',
//     component: () => import('@/views/Recommendations.vue'),
//     meta: {
//       requiresAuth: true,
//       layout: 'auth',
//       keepAlive: true,
//       title: 'Recommendations',
//     },
//   },

//   // Error Pages
//   {
//     path: '/unauthorized',
//     name: 'unauthorized',
//     component: () => import('@/views/Unauthorized.vue'),
//     meta: {
//       requiresAuth: false,
//       layout: 'guest',
//       title: 'Unauthorized',
//     },
//   },
//   {
//     path: '/forbidden',
//     name: 'forbidden',
//     component: () => import('@/views/Forbidden.vue'),
//     meta: {
//       requiresAuth: false,
//       layout: 'guest',
//       title: 'Forbidden',
//     },
//   },
//   {
//     path: '/:pathMatch(.*)*',
//     name: 'not-found',
//     component: () => import('@/views/NotFound.vue'),
//     meta: {
//       requiresAuth: false,
//       layout: 'guest',
//       title: 'Not Found',
//     },
//   },
// ]

// export default routes
