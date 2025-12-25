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

/**
 * Заголовок детальной страницы пина.
 * Содержит все действия: навигация, лайк, сохранение, шаринг, меню.
 */
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
        {/* Left side - Back & secondary actions */}
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

        {/* Right side - Save section with Profile support */}
        <PinSaveSection
          pinId={pin.id}
          isSaved={pin.isSaved}
          isSavedToProfile={pin.isSavedToProfile}
          size="md"
        />
      </Flex>
    </Box>
  );
};

export default PinDetailHeader;