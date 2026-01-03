// src/modules/pin/components/detail/PinDetailHeader.tsx

import React from 'react';
import { Box, Flex, IconButton, Tooltip } from 'gestalt';
import { useNavigate } from 'react-router-dom';
import { PinLikeButton } from '../PinLikeButton';
import { PinSaveSection } from '../PinSaveSection';
import { PinShareButton } from '../PinShareButton';
import { PinMenuButton } from '../PinMenuButton';
import type { PinResponse } from '../../types/pin.types';

interface PinDetailHeaderProps {
  pin: PinResponse;
  onBack?: () => void;
}

export const PinDetailHeader: React.FC<PinDetailHeaderProps> = ({
  pin,
  onBack,
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <Box paddingY={2}>
      <Flex justifyContent="between" alignItems="center">
        {/* Left side */}
        <Flex gap={1} alignItems="center">
          <Tooltip text="Go back">
            <IconButton
              accessibilityLabel="Go back"
              icon="arrow-back"
              onClick={handleBack}
              size="md"
              bgColor="transparent"
            />
          </Tooltip>
          
          <PinLikeButton
            pinId={pin.id}
            isLiked={pin.isLiked}
            likeCount={pin.likeCount}
            size="md"
          />
          
          <PinShareButton pin={pin} size="md" />
          <PinMenuButton pin={pin} size="md" />
        </Flex>

        {/* Right side - ✅ Обновленные пропсы */}
        <PinSaveSection
          pinId={pin.id}
          lastSavedBoardId={pin.lastSavedBoardId}
          lastSavedBoardName={pin.lastSavedBoardName}
          savedToBoardsCount={pin.savedToBoardsCount}
          size="md"
        />
      </Flex>
    </Box>
  );
};

export default PinDetailHeader;