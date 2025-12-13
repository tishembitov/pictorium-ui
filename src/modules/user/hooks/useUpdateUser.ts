// src/modules/user/hooks/useUpdateUser.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { userApi } from '../api/userApi';
import { useToast } from '@/shared/hooks/useToast';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '@/shared/utils/constants';
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
      // Invalidate user queries
      queryClient.invalidateQueries({ queryKey: queryKeys.users.me() });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.byId(data.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.byUsername(data.username) });
      
      if (showToast) {
        toast.success(SUCCESS_MESSAGES.PROFILE_UPDATED);
      }
      
      onSuccess?.(data);
    },
    onError: (error: Error) => {
      if (showToast) {
        toast.error(error.message || ERROR_MESSAGES.UNKNOWN_ERROR);
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