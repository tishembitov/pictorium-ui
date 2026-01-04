// src/modules/pin/components/detail/PinDetailHeader.tsx

import React from 'react';
import { Box, Flex, IconButton, Tooltip } from 'gestalt';
import { useNavigate } from 'react-router-dom';
import { PinLikeButton } from '../PinLikeButton';
import { PinSaveSection } from '../PinSaveSection';
import { PinShareButton } from '../PinShareButton';
import { PinMenuButton } from '../PinMenuButton';
import type { PinResponse } from '../../types/pin.types';
import type { PinLocalState, SavedBoardInfo } from '../../hooks/usePinLocalState';

interface PinDetailHeaderProps {
  pin: PinResponse;
  localState: PinLocalState;
  onToggleLike: () => boolean;
  onSave: (board: SavedBoardInfo) => void;
  onRemove: (boardId: string, remainingBoards?: SavedBoardInfo[]) => void;
  onBack?: () => void;
}

export const PinDetailHeader: React.FC<PinDetailHeaderProps> = ({
  pin,
  localState,
  onToggleLike,
  onSave,
  onRemove,
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
        {/* Left side - Navigation and actions */}
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
            isLiked={localState.isLiked}
            likeCount={localState.likeCount}
            onToggle={onToggleLike}
            size="md"
          />
          
          <PinShareButton pin={pin} size="md" />
          <PinMenuButton pin={pin} size="md" />
        </Flex>

        {/* Right side - Board selector + Save */}
        <PinSaveSection
          pinId={pin.id}
          pinTitle={pin.title}
          localState={localState}
          onSave={onSave}
          onRemove={onRemove}
          size="md"
        />
      </Flex>
    </Box>
  );
};

export default PinDetailHeader;