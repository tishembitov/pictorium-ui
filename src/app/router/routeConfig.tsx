// src/app/router/routeConfig.tsx

import React from 'react';
import { Navigate, type RouteObject } from 'react-router-dom';
import { MainLayout } from '@/shared/components';
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
  MessagesPage,
  NotFoundPage,
  ErrorPage,
  NotificationsPage,
} from './LazyRoutes';

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
      { path: 'board/:boardId', element: <BoardDetailPage /> },
      
      // ✅ Messages - единый маршрут для существующих и новых чатов
      { 
        path: 'messages', 
        element: <ProtectedRoute><MessagesPage /></ProtectedRoute> 
      },
      { 
        path: 'messages/:chatId',  // chatId = recipientUserId для новых чатов
        element: <ProtectedRoute><MessagesPage /></ProtectedRoute> 
      },

      { 
        path: 'notifications', 
        element: <ProtectedRoute><NotificationsPage /></ProtectedRoute> 
      },
      
      { path: '404', element: <NotFoundPage /> },
      { path: '*', element: <Navigate to="/404" replace /> },
    ],
  },
];

export default routes;