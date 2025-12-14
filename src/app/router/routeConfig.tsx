/* eslint-disable react-refresh/only-export-components */
import React from 'react';
import { type RouteObject, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import {
  HomePage,
  ExplorePage,
  SearchPage,
  PinDetailPage,
  PinCreatePage,
  PinEditPage,
  ProfilePage,
  SettingsPage,
  BoardDetailPage,
  FollowersPage,
  FollowingPage,
  NotFoundPage,
  ErrorPage,
} from './LazyRoutes';

// Lazy import MainLayout to avoid circular deps
const MainLayout = React.lazy(() => import('@/shared/components/layout/MainLayout'));

// Route paths constants
export const ROUTES = {
  HOME: '/',
  EXPLORE: '/explore',
  SEARCH: '/search',
  
  // Pin routes
  PIN: '/pin/:pinId',
  PIN_CREATE: '/pin/create',
  PIN_EDIT: '/pin/:pinId/edit',
  
  // Profile routes
  PROFILE: '/profile/:username',
  PROFILE_CREATED: '/profile/:username/created',
  PROFILE_SAVED: '/profile/:username/saved',
  PROFILE_BOARDS: '/profile/:username/boards',
  
  // Settings
  SETTINGS: '/settings',
  
  // Board routes
  BOARD: '/board/:boardId',
  
  // Social routes
  FOLLOWERS: '/profile/:username/followers',
  FOLLOWING: '/profile/:username/following',
  
  // Error routes
  NOT_FOUND: '/404',
  ERROR: '/error',
} as const;

// Helper to build paths
export const buildPath = {
  pin: (pinId: string) => `/pin/${pinId}`,
  pinEdit: (pinId: string) => `/pin/${pinId}/edit`,
  profile: (username: string) => `/profile/${username}`,
  profileCreated: (username: string) => `/profile/${username}/created`,
  profileSaved: (username: string) => `/profile/${username}/saved`,
  profileBoards: (username: string) => `/profile/${username}/boards`,
  board: (boardId: string) => `/board/${boardId}`,
  followers: (username: string) => `/profile/${username}/followers`,
  following: (username: string) => `/profile/${username}/following`,
  search: (query?: string) => query ? `/search?q=${encodeURIComponent(query)}` : '/search',
};

export const routes: RouteObject[] = [
  {
    path: '/',
    element: (
      <React.Suspense fallback={<div>Loading...</div>}>
        <MainLayout />
      </React.Suspense>
    ),
    errorElement: <ErrorPage />,
    children: [
      // Public routes
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'explore',
        element: <ExplorePage />,
      },
      {
        path: 'search',
        element: <SearchPage />,
      },
      
      // Pin routes
      {
        path: 'pin/:pinId',
        element: <PinDetailPage />,
      },
      {
        path: 'pin/create',
        element: (
          <ProtectedRoute>
            <PinCreatePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'pin/:pinId/edit',
        element: (
          <ProtectedRoute>
            <PinEditPage />
          </ProtectedRoute>
        ),
      },
      
      // Profile routes
      {
        path: 'profile/:username',
        element: <ProfilePage />,
        children: [
          {
            index: true,
            element: <Navigate to="created" replace />,
          },
          {
            path: 'created',
            element: null, // Handled by ProfilePage
          },
          {
            path: 'saved',
            element: null,
          },
          {
            path: 'boards',
            element: null,
          },
        ],
      },
      {
        path: 'profile/:username/followers',
        element: <FollowersPage />,
      },
      {
        path: 'profile/:username/following',
        element: <FollowingPage />,
      },
      
      // Settings (protected)
      {
        path: 'settings',
        element: (
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        ),
      },
      
      // Board routes
      {
        path: 'board/:boardId',
        element: <BoardDetailPage />,
      },
      
      // Error routes
      {
        path: '404',
        element: <NotFoundPage />,
      },
      {
        path: '*',
        element: <Navigate to="/404" replace />,
      },
    ],
  },
];

export default routes;