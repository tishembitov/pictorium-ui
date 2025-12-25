// src/modules/pin/components/detail/PinDetailActions.tsx

import React from 'react';
import { Box, Flex } from 'gestalt';
import { PinLikeButton } from '../PinLikeButton';
import { PinSaveButton } from '../PinSaveButton';
import type { PinResponse } from '../../types/pin.types';

interface PinDetailActionsProps {
  pin: PinResponse;
}

/**
 * Основные действия над пином: лайк и сохранение.
 * Ответственность: отображение и обработка like/save действий.
 */
export const PinDetailActions: React.FC<PinDetailActionsProps> = ({ pin }) => {
  return (
    <Box paddingY={3}>
      <Flex gap={3} alignItems="center">
        <PinLikeButton
          pinId={pin.id}
          isLiked={pin.isLiked}
          likeCount={pin.likeCount}
          size="lg"
          variant="button"
        />
        <PinSaveButton
          pinId={pin.id}
          isSaved={pin.isSaved}
          size="lg"
          variant="default"
        />
      </Flex>
    </Box>
  );
};

export default PinDetailActions;