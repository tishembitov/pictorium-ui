// src/modules/user/components/UserCard.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Flex, Text, TapArea } from 'gestalt';
import { buildPath } from '@/app/router/routeConfig';
import { UserAvatar } from './UserAvatar';
import { FollowButton } from './FollowButton';
import { useAuth } from '@/modules/auth';
import { formatUsername, getDisplayName } from '../utils/userUtils';
import type { UserResponse } from '../types/user.types';

interface UserCardProps {
  user: UserResponse;
  showFollowButton?: boolean;
  showDescription?: boolean;
  showFormattedUsername?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export const UserCard: React.FC<UserCardProps> = ({
  user,
  showFollowButton = true,
  showDescription = false,
  showFormattedUsername = false,
  onClick,
  size = 'md',
}) => {
  const { user: currentUser } = useAuth();
  const isCurrentUser = currentUser?.id === user.id;

  const avatarSize = size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md';
  const textSize = size === 'sm' ? '200' : size === 'lg' ? '400' : '300';

  // Используем утилиты для форматирования
  const displayName = getDisplayName(user);
  const formattedUsername = formatUsername(user.username);

  const content = (
    <Box padding={2}>
      <Flex alignItems="center" gap={3}>
        <UserAvatar
          imageId={user.imageId}
          name={user.username}
          size={avatarSize}
        />
        
        <Box flex="grow" minWidth={0}>
          <Text weight="bold" size={textSize} lineClamp={1}>
            {displayName}
          </Text>
          
          {showFormattedUsername && (
            <Text color="subtle" size="100">
              {formattedUsername}
            </Text>
          )}
          
          {showDescription && user.description && (
            <Text color="subtle" size="200" lineClamp={2}>
              {user.description}
            </Text>
          )}
        </Box>
        
        {showFollowButton && !isCurrentUser && (
          <FollowButton userId={user.id} size="sm" />
        )}
      </Flex>
    </Box>
  );

  if (onClick) {
    return (
      <TapArea onTap={onClick} rounding={2}>
        {content}
      </TapArea>
    );
  }

  return (
    <Link to={buildPath.profile(user.username)} style={{ textDecoration: 'none' }}>
      <TapArea rounding={2}>
        {content}
      </TapArea>
    </Link>
  );
};

export default UserCard;