// src/modules/pin/components/PinLikeButton.tsx

import React, { useCallback } from 'react';
import { Box, TapArea, Icon, Text, Flex, Tooltip } from 'gestalt';
import { useAuth } from '@/modules/auth';
import { useLikePin } from '../hooks/useLikePin';
import { useUnlikePin } from '../hooks/useUnlikePin';
import { formatCompactNumber } from '@/shared/utils/formatters';

interface PinLikeButtonProps {
  pinId: string;
  /** Контролируемое состояние лайка */
  isLiked: boolean;
  /** Контролируемый счётчик */
  likeCount: number;
  /** Callback для обновления состояния */
  onToggle: () => boolean;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
}

const getIconSize = (size: 'sm' | 'md' | 'lg'): 16 | 20 | 24 => {
  switch (size) {
    case 'sm': return 16;
    case 'lg': return 24;
    default: return 20;
  }
};

const getPadding = (size: 'sm' | 'md' | 'lg'): 1 | 2 | 3 => {
  switch (size) {
    case 'sm': return 1;
    case 'lg': return 3;
    default: return 2;
  }
};

export const PinLikeButton: React.FC<PinLikeButtonProps> = ({
  pinId,
  isLiked,
  likeCount,
  onToggle,
  size = 'md',
  showCount = true,
}) => {
  const { isAuthenticated, login } = useAuth();

  const { likePin, isLoading: isLiking } = useLikePin({
    onError: () => {
      // Revert on error
      onToggle();
    },
  });

  const { unlikePin, isLoading: isUnliking } = useUnlikePin({
    onError: () => {
      // Revert on error  
      onToggle();
    },
  });

  const isLoading = isLiking || isUnliking;
  const iconSize = getIconSize(size);
  const padding = getPadding(size);

  const handleClick = useCallback(() => {
    if (!isAuthenticated) {
      login();
      return;
    }

    // 1. Immediate UI update (parent updates state)
    const newIsLiked = onToggle();

    // 2. Background mutation
    if (newIsLiked) {
      likePin(pinId);
    } else {
      unlikePin(pinId);
    }
  }, [isAuthenticated, login, onToggle, likePin, unlikePin, pinId]);

  return (
    <Tooltip text={isLiked ? 'Unlike' : 'Like'}>
      <TapArea onTap={handleClick} disabled={isLoading} rounding="circle">
        <Box
          padding={padding}
          rounding="circle"
          display="flex"
          alignItems="center"
          dangerouslySetInlineStyle={{
            __style: {
              transition: 'transform 0.15s ease',
              cursor: isLoading ? 'wait' : 'pointer',
            },
          }}
        >
          <Flex alignItems="center" gap={1}>
            <Icon
              accessibilityLabel={isLiked ? 'Unlike' : 'Like'}
              icon="heart"
              size={iconSize}
              color={isLiked ? 'error' : 'default'}
            />
            {showCount && likeCount > 0 && (
              <Text 
                size={size === 'sm' ? '100' : '200'} 
                weight="bold"
                color={isLiked ? 'error' : 'default'}
              >
                {formatCompactNumber(likeCount)}
              </Text>
            )}
          </Flex>
        </Box>
      </TapArea>
    </Tooltip>
  );
};

export default PinLikeButton;