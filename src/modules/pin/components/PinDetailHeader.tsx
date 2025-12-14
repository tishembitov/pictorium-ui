// src/modules/pin/components/PinDetailHeader.tsx

import React from 'react';
import { Box, Flex, IconButton, Tooltip } from 'gestalt';
import { useNavigate } from 'react-router-dom';
import { PinMenuButton } from './PinMenuButton';
import { PinShareButton } from './PinShareButton';
import type { PinResponse } from '../types/pin.types';

interface PinDetailHeaderProps {
  pin: PinResponse;
}

export const PinDetailHeader: React.FC<PinDetailHeaderProps> = ({ pin }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <Box>
      <Flex justifyContent="between" alignItems="center">
        <Tooltip text="Go back">
          <IconButton
            accessibilityLabel="Go back"
            icon="arrow-back"
            onClick={handleBack}
            size="lg"
            bgColor="transparent"
          />
        </Tooltip>

        <Flex gap={2}>
          <PinShareButton pin={pin} />
          <PinMenuButton pin={pin} size="lg" />
        </Flex>
      </Flex>
    </Box>
  );
};

export default PinDetailHeader;