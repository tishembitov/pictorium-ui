// src/modules/user/hooks/useUpdateUser.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { userApi } from '../api/userApi';
import { useAuthStore } from '@/modules/auth';
import { useToast } from '@/shared/hooks/useToast';
import { ERROR_MESSAGES } from '@/shared/utils/constants';
import type { UserResponse, UserUpdateRequest } from '../types/user.types';

interface UseUpdateUserOptions {
  onSuccess?: (data: UserResponse) => void;
  onError?: (error: Error) => void;
  showToast?: boolean;
}

/**
 * Hook to update current user profile
 */
export const useUpdateUser = (options: UseUpdateUserOptions = {}) => {
  const { onSuccess, onError, showToast = true } = options;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: (data: UserUpdateRequest) => userApi.updateMe(data),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.users.me(), data);
      queryClient.setQueryData(queryKeys.users.byId(data.id), data);
      queryClient.setQueryData(queryKeys.users.byUsername(data.username), data);
      

      const authStore = useAuthStore.getState();
      if (authStore.user) {
        authStore.setUser({
          ...authStore.user,
          username: data.username,
        });
      }
      
      const currentUser = authStore.user;
      if (currentUser && currentUser.username !== data.username) {
        queryClient.setQueryData(
          queryKeys.users.byUsername(currentUser.username), 
          data
        );
      }

      if (showToast) {
        toast.profile.updated();
      }
      
      onSuccess?.(data);
    },
    onError: (error: Error) => {
      if (showToast) {
        toast.error(error.message || ERROR_MESSAGES.UNKNOWN_ERROR); // Можно поменять на пресет, если потребуется
      }
      
      onError?.(error);
    },
  });

  return {
    updateUser: mutation.mutate,
    updateUserAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    data: mutation.data,
    reset: mutation.reset,
  };
};

export default useUpdateUser;