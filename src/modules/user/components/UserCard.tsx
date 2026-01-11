// src/modules/user/components/UserCard.tsx

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Box, Flex, Text, TapArea } from 'gestalt';
import { buildPath } from '@/app/router/routes';
import { UserAvatar } from './UserAvatar';
import { FollowButton } from './FollowButton';
import { useAuth } from '@/modules/auth';
import { formatUsername, getDisplayName } from '../utils/userUtils';
import { formatCompactNumber } from '@/shared/utils/formatters';
import type { UserResponse } from '../types/user.types';

interface UserCardProps {
  user: UserResponse;
  showFollowButton?: boolean;
  showDescription?: boolean;
  showStats?: boolean;
  followersCount?: number;
  onClick?: () => void;
  variant?: 'default' | 'compact' | 'horizontal';
}

export const UserCard: React.FC<UserCardProps> = ({
  user,
  showFollowButton = true,
  showDescription = false,
  showStats = false,
  followersCount,
  onClick,
  variant = 'default',
}) => {
  const { user: currentUser } = useAuth();
  const [isHovered, setIsHovered] = useState(false);
  const isCurrentUser = currentUser?.id === user.id;

  const displayName = getDisplayName(user);
  const formattedUsername = formatUsername(user.username);

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);

  // Compact variant
  if (variant === 'compact') {
    return (
      <Link to={buildPath.profile(user.username)} style={{ textDecoration: 'none' }}>
        <TapArea rounding={3} tapStyle="compress">
          <Box
            padding={2}
            rounding={3}
            color={isHovered ? 'secondary' : 'transparent'}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <Flex alignItems="center" gap={2}>
              <UserAvatar
                imageId={user.imageId}
                name={user.username}
                size="sm"
              />
              <Text weight="bold" size="200" lineClamp={1}>
                {displayName}
              </Text>
            </Flex>
          </Box>
        </TapArea>
      </Link>
    );
  }

  // Horizontal variant
  if (variant === 'horizontal') {
    return (
      <Link to={buildPath.profile(user.username)} style={{ textDecoration: 'none' }}>
        <TapArea rounding={4} tapStyle="compress">
          <Box
            padding={3}
            rounding={4}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            dangerouslySetInlineStyle={{
              __style: {
                backgroundColor: isHovered ? 'var(--bg-secondary)' : 'transparent',
                transition: 'background-color 0.15s ease',
              },
            }}
          >
            <Flex alignItems="center" gap={3}>
              <UserAvatar
                imageId={user.imageId}
                name={user.username}
                size="md"
              />
              
              <Box flex="grow" minWidth={0}>
                <Text weight="bold" size="300" lineClamp={1}>
                  {displayName}
                </Text>
                <Text color="subtle" size="200">
                  {formattedUsername}
                </Text>
                {showStats && followersCount !== undefined && (
                  <Text color="subtle" size="100">
                    {formatCompactNumber(followersCount)} followers
                  </Text>
                )}
              </Box>
              
              {showFollowButton && !isCurrentUser && (
                // ✅ Передаём username
                <FollowButton 
                  userId={user.id} 
                  username={user.username}
                  size="sm" 
                />
              )}
            </Flex>
          </Box>
        </TapArea>
      </Link>
    );
  }

  // Default variant - card style
  const content = (
    <Box
      padding={4}
      rounding={4}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      dangerouslySetInlineStyle={{
        __style: {
          backgroundColor: isHovered ? 'var(--bg-secondary)' : 'var(--bg-default)',
          boxShadow: isHovered 
            ? '0 4px 12px rgba(0,0,0,0.15)' 
            : '0 1px 3px rgba(0,0,0,0.08)',
          transition: 'all 0.2s ease',
          transform: isHovered ? 'translateY(-2px)' : 'none',
        },
      }}
    >
      <Flex direction="column" alignItems="center" gap={3}>
        <UserAvatar
          imageId={user.imageId}
          name={user.username}
          size="lg"
        />
        
        <Box width="100%">
          <Text align="center" weight="bold" size="300" lineClamp={1}>
            {displayName}
          </Text>
          <Text align="center" color="subtle" size="200">
            {formattedUsername}
          </Text>
        </Box>
        
        {showDescription && user.description && (
          <Text align="center" color="subtle" size="200" lineClamp={2}>
            {user.description}
          </Text>
        )}
        
        {showStats && followersCount !== undefined && (
          <Text align="center" color="subtle" size="100">
            {formatCompactNumber(followersCount)} followers
          </Text>
        )}
        
        {showFollowButton && !isCurrentUser && (
          <Box width="100%">
            {/* ✅ Передаём username */}
            <FollowButton 
              userId={user.id} 
              username={user.username}
              size="md" 
              fullWidth 
            />
          </Box>
        )}
      </Flex>
    </Box>
  );

  if (onClick) {
    return (
      <TapArea onTap={onClick} rounding={4}>
        {content}
      </TapArea>
    );
  }

  return (
    <Link to={buildPath.profile(user.username)} style={{ textDecoration: 'none' }}>
      <TapArea rounding={4}>
        {content}
      </TapArea>
    </Link>
  );
};

export default UserCard;