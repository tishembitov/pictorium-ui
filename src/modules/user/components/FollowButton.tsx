// src/modules/user/components/FollowButton.tsx

import React, { useState, useCallback } from 'react';
import { Box, Button } from 'gestalt';
import { useFollow } from '../hooks/useFollow';
import { useUnfollow } from '../hooks/useUnfollow';
import { useFollowCheck } from '../hooks/useFollowCheck';
import { useAuth } from '@/modules/auth';

interface FollowButtonProps {
  userId: string;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const FollowButton: React.FC<FollowButtonProps> = ({
  userId,
  size = 'md',
  fullWidth = false,
}) => {
  const { isAuthenticated, login } = useAuth();
  const { isFollowing, isLoading: isCheckLoading } = useFollowCheck(userId);
  const { follow, isLoading: isFollowLoading } = useFollow();
  const { unfollow, isLoading: isUnfollowLoading } = useUnfollow();
  
  const [isHovered, setIsHovered] = useState(false);

  const isLoading = isCheckLoading || isFollowLoading || isUnfollowLoading;

  const handleClick = useCallback(() => {
    if (!isAuthenticated) {
      login();
      return;
    }

    if (isFollowing) {
      unfollow(userId);
    } else {
      follow(userId);
    }
  }, [isAuthenticated, isFollowing, userId, login, follow, unfollow]);

  const getButtonText = () => {
    if (isFollowing) {
      return isHovered ? 'Unfollow' : 'Following';
    }
    return 'Follow';
  };

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);

  return (
    <Box
      display={fullWidth ? 'block' : 'inlineBlock'}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Button
        text={getButtonText()}
        onClick={handleClick}
        size={size}
        color={isFollowing ? 'gray' : 'red'}
        disabled={isLoading}
        fullWidth={fullWidth}
      />
    </Box>
  );
};

export default FollowButton;