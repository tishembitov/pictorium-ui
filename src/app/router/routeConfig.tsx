// src/app/router/routeConfig.tsx

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
import MessagesPage from '@/pages/MessagesPage';

const MainLayout = React.lazy(() => import('@/shared/components/layout/MainLayout'));

export const ROUTES = {
  HOME: '/',
  EXPLORE: '/explore',
  SEARCH: '/search',
  PIN: '/pin/:pinId',
  PIN_CREATE: '/pin/create',
  PIN_EDIT: '/pin/:pinId/edit',
  PROFILE: '/profile/:username',
  SETTINGS: '/settings',
  BOARD: '/board/:boardId',
  FOLLOWERS: '/profile/:username/followers',
  FOLLOWING: '/profile/:username/following',
  NOT_FOUND: '/404',
  ERROR: '/error',
} as const;

export const buildPath = {
  pin: (pinId: string) => `/pin/${pinId}`,
  pinEdit: (pinId: string) => `/pin/${pinId}/edit`,
  profile: (username: string) => `/profile/${username}`,
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
      { index: true, element: <HomePage /> },
      { path: 'explore', element: <ExplorePage /> },
      { path: 'search', element: <SearchPage /> },
      { path: 'pin/:pinId', element: <PinDetailPage /> },
      { 
        path: 'pin/create', 
        element: <ProtectedRoute><PinCreatePage /></ProtectedRoute> 
      },
      { 
        path: 'pin/:pinId/edit', 
        element: <ProtectedRoute><PinEditPage /></ProtectedRoute> 
      },
      { path: 'profile/:username', element: <ProfilePage /> },
      { path: 'profile/:username/followers', element: <FollowersPage /> },
      { path: 'profile/:username/following', element: <FollowingPage /> },
      { 
        path: 'settings', 
        element: <ProtectedRoute><SettingsPage /></ProtectedRoute> 
      },
      { path: 'messages', element: <ProtectedRoute><MessagesPage /></ProtectedRoute> },
      { path: 'messages/:chatId', element: <ProtectedRoute><MessagesPage /></ProtectedRoute> },
      { path: 'board/:boardId', element: <BoardDetailPage /> },
      { path: '404', element: <NotFoundPage /> },
      { path: '*', element: <Navigate to="/404" replace /> },
    ],
  },
];

export default routes;