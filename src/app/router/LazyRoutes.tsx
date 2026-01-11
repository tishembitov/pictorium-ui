import { lazy, Suspense, type FC, type ComponentType } from 'react';
import { FullPageLoader } from '@/shared/components';

const lazyLoad = (
  factory: () => Promise<{ default: ComponentType }>
): FC => {
  const LazyComponent = lazy(factory);
  
  return function LazyWrapper() {
    return (
      <Suspense fallback={<FullPageLoader />}>
        <LazyComponent />
      </Suspense>
    );
  };
};

// Page components - lazy loaded
export const HomePage = lazyLoad(() => import('@/pages/HomePage'));
export const ExplorePage = lazyLoad(() => import('@/pages/ExplorePage'));
export const SearchPage = lazyLoad(() => import('@/pages/SearchPage'));
export const PinDetailPage = lazyLoad(() => import('@/pages/PinDetailPage'));
export const PinCreatePage = lazyLoad(() => import('@/pages/PinCreatePage'));
export const PinEditPage = lazyLoad(() => import('@/pages/PinEditPage'));
export const ProfilePage = lazyLoad(() => import('@/pages/ProfilePage'));
export const SettingsPage = lazyLoad(() => import('@/pages/SettingsPage'));
export const BoardDetailPage = lazyLoad(() => import('@/pages/BoardDetailPage'));
export const FollowersPage = lazyLoad(() => import('@/pages/FollowersPage'));
export const FollowingPage = lazyLoad(() => import('@/pages/FollowingPage'));
export const MessagesPage = lazyLoad(() => import('@/pages/MessagesPage'));
export const NotFoundPage = lazyLoad(() => import('@/pages/NotFoundPage'));
export const ErrorPage = lazyLoad(() => import('@/pages/ErrorPage'));