import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { get } from '@/shared/api/apiClient';
import { USER_ENDPOINTS } from '@/shared/api/apiEndpoints';
import { queryKeys } from '@/app/config/queryClient';

// User profile from User Service
interface UserProfile {
  id: string;
  username: string;
  email: string;
  imageId: string | null;
  bannerImageId: string | null;
  description: string | null;
  instagram: string | null;
  tiktok: string | null;
  telegram: string | null;
  pinterest: string | null;
}

/**
 * Hook to get current user profile from User Service
 * Combines auth state with user profile data
 */
export const useCurrentUser = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const authUser = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  // Fetch user profile from API
  const {
    data: profile,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.users.me(),
    queryFn: () => get<UserProfile>(USER_ENDPOINTS.me()),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });

  // Invalidate user data
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.users.me() });
  };

  // Combined user data
  const user = profile ? {
    ...profile,
    // Include auth user data that might not be in profile
    emailVerified: authUser?.emailVerified,
    roles: authUser?.roles || [],
  } : null;

  return {
    // User data
    user,
    profile,
    authUser,
    
    // Status
    isLoading,
    isError,
    error,
    isAuthenticated,
    
    // Helpers
    userId: user?.id || authUser?.id,
    username: user?.username || authUser?.username,
    email: user?.email || authUser?.email,
    imageId: profile?.imageId,
    
    // Actions
    refetch,
    invalidate,
  };
};

/**
 * Hook to check if current user is the owner of a resource
 */
export const useIsOwner = (ownerId: string | undefined | null) => {
  const userId = useAuthStore((state) => state.user?.id);
  
  if (!userId || !ownerId) {
    return false;
  }
  
  return userId === ownerId;
};

/**
 * Hook to get current user ID
 */
export const useCurrentUserId = () => {
  return useAuthStore((state) => state.user?.id);
};

/**
 * Hook to get current username
 */
export const useCurrentUsername = () => {
  return useAuthStore((state) => state.user?.username);
};

export default useCurrentUser;