// src/modules/pin/components/PinLikeButton.tsx

import React, { useCallback, useMemo } from 'react';
import { Button, IconButton, Flex, Text } from 'gestalt';
import { useAuth } from '@/modules/auth';
import { useLikePin } from '../hooks/useLikePin';
import { useUnlikePin } from '../hooks/useUnlikePin';
import { formatCompactNumber } from '@/shared/utils/formatters';

interface PinLikeButtonProps {
  pinId: string;
  isLiked: boolean;
  likeCount: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'button' | 'icon';
}

// Helper to get icon button size
const getIconButtonSize = (size: 'sm' | 'md' | 'lg'): 'xs' | 'md' | 'lg' => {
  if (size === 'sm') return 'xs';
  if (size === 'lg') return 'lg';
  return 'md';
};

export const PinLikeButton: React.FC<PinLikeButtonProps> = ({
  pinId,
  isLiked,
  likeCount,
  size = 'md',
  variant = 'button',
}) => {
  const { isAuthenticated, login } = useAuth();

  // Use the props directly instead of local state that syncs with props
  const { likePin, isLoading: isLiking } = useLikePin();
  const { unlikePin, isLoading: isUnliking } = useUnlikePin();

  const isLoading = isLiking || isUnliking;
  const iconButtonSize = useMemo(() => getIconButtonSize(size), [size]);

  const handleClick = useCallback(() => {
    if (!isAuthenticated) {
      login();
      return;
    }

    if (isLiked) {
      unlikePin(pinId);
    } else {
      likePin(pinId);
    }
  }, [isAuthenticated, login, isLiked, pinId, likePin, unlikePin]);

  if (variant === 'icon') {
    return (
      <Flex alignItems="center" gap={1}>
        <IconButton
          accessibilityLabel={isLiked ? 'Unlike' : 'Like'}
          icon="heart"
          size={iconButtonSize}
          bgColor={isLiked ? 'red' : 'transparentDarkGray'}
          iconColor="white"
          onClick={handleClick}
          disabled={isLoading}
        />
        {likeCount > 0 && (
          <Text size="100" color="inverse">
            {formatCompactNumber(likeCount)}
          </Text>
        )}
      </Flex>
    );
  }

  return (
    <Button
      text={isLiked ? 'Liked' : 'Like'}
      onClick={handleClick}
      size={size}
      color={isLiked ? 'red' : 'gray'}
      disabled={isLoading}
      iconEnd="heart"
    />
  );
};

export default PinLikeButton;