// src/modules/pin/components/PinDetailActions.tsx

import React from 'react';
import { Box, Flex } from 'gestalt';
import { PinLikeButton } from './PinLikeButton';
import { PinSaveButton } from './PinSaveButton';
import type { PinResponse } from '../types/pin.types';

interface PinDetailActionsProps {
  pin: PinResponse;
}

export const PinDetailActions: React.FC<PinDetailActionsProps> = ({ pin }) => {
  return (
    <Box>
      <Flex gap={3}>
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
        />
      </Flex>
    </Box>
  );
};

export default PinDetailActions;