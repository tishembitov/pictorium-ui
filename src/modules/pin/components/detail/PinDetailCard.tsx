// src/modules/pin/components/detail/PinDetailCard.tsx

import React from 'react';
import { Box, Flex } from 'gestalt';
import { PinDetailImage } from './PinDetailImage';
import { PinDetailContent } from './PinDetailContent';
import type { PinResponse } from '../../types/pin.types';

interface PinDetailCardProps {
  pin: PinResponse;
  onBack?: () => void;
}

export const PinDetailCard: React.FC<PinDetailCardProps> = ({ 
  pin, 
  onBack,
}) => {
  return (
    <Box
      maxWidth={1016}
      marginStart="auto"
      marginEnd="auto"
      rounding={5}
      overflow="hidden"
      color="default"
      dangerouslySetInlineStyle={{
        __style: {
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1), 0 0 1px rgba(0, 0, 0, 0.1)',
        },
      }}
    >
      <Flex wrap>
        {/* Left Side - Image */}
        <Box
          minWidth={300}
          maxWidth={508}
          flex="grow"
          dangerouslySetInlineStyle={{
            __style: { flex: '1 1 50%' },
          }}
        >
          <PinDetailImage pin={pin} />
        </Box>

        {/* Right Side - Content */}
        <Box
          minWidth={300}
          flex="grow"
          dangerouslySetInlineStyle={{
            __style: {
              flex: '1 1 50%',
              maxHeight: '90vh',
              overflowY: 'auto',
            },
          }}
        >
          {/* PinDetailContent сам создаёт свой localState */}
          <PinDetailContent pin={pin} onBack={onBack} />
        </Box>
      </Flex>
    </Box>
  );
};

export default PinDetailCard;