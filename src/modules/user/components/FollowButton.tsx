// src/modules/user/components/FollowButton.tsx

import React, { useState, useCallback } from 'react';
import { Box, Button, TapArea, Spinner } from 'gestalt';
import { useFollow } from '../hooks/useFollow';
import { useUnfollow } from '../hooks/useUnfollow';
import { useFollowCheck } from '../hooks/useFollowCheck';
import { useAuth } from '@/modules/auth';

interface FollowButtonProps {
  userId: string;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  variant?: 'default' | 'outline';
}

export const FollowButton: React.FC<FollowButtonProps> = ({
  userId,
  size = 'md',
  fullWidth = false,
  variant = 'default',
}) => {
  const { isAuthenticated, login } = useAuth();
  const { isFollowing, isLoading: isCheckLoading } = useFollowCheck(userId);
  const { follow, isLoading: isFollowLoading } = useFollow();
  const { unfollow, isLoading: isUnfollowLoading } = useUnfollow();
  
  const [isHovered, setIsHovered] = useState(false);

  const isLoading = isCheckLoading || isFollowLoading || isUnfollowLoading;

  const handleAction = useCallback(() => {
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

  // Gestalt Button передаёт объект с event
  const handleButtonClick = useCallback(
    ({ event }: { event: React.SyntheticEvent<HTMLButtonElement> }) => {
      event.stopPropagation();
      event.preventDefault();
      handleAction();
    },
    [handleAction]
  );

  // Gestalt TapArea передаёт объект с event
  const handleTapAreaClick = useCallback(
    ({ event }: { event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement> }) => {
      event.stopPropagation();
      event.preventDefault();
      handleAction();
    },
    [handleAction]
  );

  const getButtonText = (): string => {
    if (isLoading) return '';
    if (isFollowing) {
      return isHovered ? 'Unfollow' : 'Following';
    }
    return 'Follow';
  };

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);

  const getPadding = (): 2 | 3 => (size === 'sm' ? 2 : 3);
  const getMinWidth = (): number => (size === 'sm' ? 80 : 100);
  const getFontSize = (): number => (size === 'sm' ? 14 : 16);

  // Outline variant for "Following" state
  if (variant === 'outline' && isFollowing) {
    return (
      <Box
        display={fullWidth ? 'block' : 'inlineBlock'}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        width={fullWidth ? '100%' : undefined}
      >
        <TapArea
          onTap={handleTapAreaClick}
          rounding="pill"
          disabled={isLoading}
          tapStyle="compress"
        >
          <Box
            rounding="pill"
            padding={getPadding()}
            display="flex"
            alignItems="center"
            justifyContent="center"
            dangerouslySetInlineStyle={{
              __style: {
                border: '2px solid var(--color-primary)',
                backgroundColor: isHovered ? 'var(--color-primary-light)' : 'transparent',
                cursor: isLoading ? 'wait' : 'pointer',
                transition: 'all 0.15s ease',
                minWidth: getMinWidth(),
              },
            }}
          >
            {isLoading ? (
              <Spinner accessibilityLabel="Loading" size="sm" show />
            ) : (
              <span
                style={{
                  color: 'var(--color-primary)',
                  fontWeight: 600,
                  fontSize: getFontSize(),
                }}
              >
                {getButtonText()}
              </span>
            )}
          </Box>
        </TapArea>
      </Box>
    );
  }

  // Default variant
  return (
    <Box
      display={fullWidth ? 'block' : 'inlineBlock'}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      width={fullWidth ? '100%' : undefined}
    >
      <Button
        text={getButtonText()}
        onClick={handleButtonClick}
        size={size}
        color={isFollowing ? 'gray' : 'red'}
        disabled={isLoading}
        fullWidth={fullWidth}
      />
    </Box>
  );
};

export default FollowButton;