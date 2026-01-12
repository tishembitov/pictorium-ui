// src/modules/chat/hooks/useRecipients.ts

import { useQueries } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { userApi } from '@/modules/user';
import type { UserResponse } from '@/modules/user';

interface UseUsersResult {
  users: Record<string, UserResponse>;
  isLoading: boolean;
  isError: boolean;
}

export const useUsers = (userIds: string[]): UseUsersResult => {
  const queries = useQueries({
    queries: userIds.map((userId) => ({
      queryKey: queryKeys.users.byId(userId),
      queryFn: () => userApi.getById(userId),
      staleTime: 1000 * 60 * 5, // 5 minutes
      enabled: !!userId,
    })),
  });

  const users: Record<string, UserResponse> = {};
  let isLoading = false;
  let isError = false;

  queries.forEach((query, index) => {
    if (query.isLoading) {
      isLoading = true;
    }
    if (query.isError) {
      isError = true;
    }
    if (query.data) {
      const userId = userIds[index];
      if (userId) {
        users[userId] = query.data;
      }
    }
  });

  return { users, isLoading, isError };
};

export default useUsers;