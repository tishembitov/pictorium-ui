// src/modules/pin/components/detail/PinDetailAuthor.tsx

import React from 'react';
import { Box, Text } from 'gestalt';
import { UserCard, useUser } from '@/modules/user';

interface PinDetailAuthorProps {
  userId: string;
}

/**
 * Блок с информацией об авторе пина.
 * Ответственность: отображение карточки автора с кнопкой подписки.
 */
export const PinDetailAuthor: React.FC<PinDetailAuthorProps> = ({ userId }) => {
  const { user, isLoading, isError } = useUser(userId);

  if (isLoading) {
    return (
      <Box paddingY={3}>
        <Box height={60} color="secondary" rounding={3} />
      </Box>
    );
  }

  if (isError || !user) {
    return null;
  }

  return (
    <Box paddingY={3}>
      <Box marginBottom={2}>
        <Text size="100" color="subtle" weight="bold">
          Created by
        </Text>
      </Box>
      <UserCard user={user} showFollowButton variant="horizontal" />
    </Box>
  );
};

export default PinDetailAuthor;