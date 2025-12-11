import React from 'react';
import { RouteObject, Navigate } from 'react-router-dom';
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
            element: <ProfilePage />,
          },
          {
            path: 'saved',
            element: <ProfilePage />,
          },
          {
            path: 'boards',
            element: <ProfilePage />,
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