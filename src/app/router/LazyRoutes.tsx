import { lazy, Suspense, type ComponentType } from 'react';
import { FullPageLoader } from '@/shared/components/feedback/FullPageLoader';

// Helper for lazy loading with fallback
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const lazyLoad = <T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) => {
  const LazyComponent = lazy(factory);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (props: any) => (
    <Suspense fallback={<FullPageLoader />}>
      <LazyComponent {...props} />
    </Suspense>
  );
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

export const NotFoundPage = lazyLoad(() => import('@/pages/NotFoundPage'));
export const ErrorPage = lazyLoad(() => import('@/pages/ErrorPage'));