// src/modules/pin/components/PinLikeButton.tsx

import React, { useCallback } from 'react';
import { Box, TapArea, Icon, Text, Flex, Tooltip } from 'gestalt';
import { useAuth } from '@/modules/auth';
import { useLikePin } from '../hooks/useLikePin';
import { useUnlikePin } from '../hooks/useUnlikePin';
import { formatCompactNumber } from '@/shared/utils/formatters';

interface PinLikeButtonProps {
  pinId: string;
  isLiked: boolean;
  likeCount: number;
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
  size = 'md',
  showCount = true,
}) => {
  const { isAuthenticated, login } = useAuth();

  const { likePin, isLoading: isLiking } = useLikePin();
  const { unlikePin, isLoading: isUnliking } = useUnlikePin();

  const isLoading = isLiking || isUnliking;
  const iconSize = getIconSize(size);
  const padding = getPadding(size);

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
              transition: 'transform 0.15s ease, background-color 0.15s ease',
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