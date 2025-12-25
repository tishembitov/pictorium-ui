// src/modules/pin/components/detail/PinDetailHeader.tsx

import React from 'react';
import { Box, Flex, IconButton, Tooltip } from 'gestalt';
import { useNavigate } from 'react-router-dom';
import { PinShareButton } from '../PinShareButton';
import { PinMenuButton } from '../PinMenuButton';
import type { PinResponse } from '../../types/pin.types';

interface PinDetailHeaderProps {
  pin: PinResponse;
  onBack?: () => void;
}

/**
 * Заголовок детальной страницы пина.
 * Ответственность: навигация назад, меню действий, кнопка шаринга.
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
        {/* Back Button */}
        <Tooltip text="Go back">
          <IconButton
            accessibilityLabel="Go back"
            icon="arrow-back"
            onClick={handleBack}
            size="lg"
            bgColor="transparent"
          />
        </Tooltip>

        {/* Right Actions */}
        <Flex gap={2} alignItems="center">
          <PinShareButton pin={pin} size="lg" />
          <PinMenuButton pin={pin} size="lg" />
        </Flex>
      </Flex>
    </Box>
  );
};

export default PinDetailHeader;