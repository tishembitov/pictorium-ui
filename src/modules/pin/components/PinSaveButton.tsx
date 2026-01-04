// src/modules/pin/components/PinSaveButton.tsx

import React from 'react';
import { Box, Text, TapArea, Spinner } from 'gestalt';

interface PinSaveButtonProps {
  isSaved: boolean;
  onClick: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const getButtonDimensions = (size: 'sm' | 'md' | 'lg') => {
  switch (size) {
    case 'sm': return { height: 32, paddingX: 12, fontSize: '100' as const };
    case 'lg': return { height: 48, paddingX: 24, fontSize: '300' as const };
    default: return { height: 40, paddingX: 16, fontSize: '200' as const };
  }
};

export const PinSaveButton: React.FC<PinSaveButtonProps> = ({
  isSaved,
  onClick,
  isLoading = false,
  disabled = false,
  size = 'md',
}) => {
  const dimensions = getButtonDimensions(size);
  const isDisabled = disabled || isLoading;

  return (
    <TapArea 
      onTap={({ event }) => {
        event.stopPropagation();
        if (!isDisabled) {
          onClick();
        }
      }} 
      disabled={isDisabled}
      rounding={2}
      tapStyle="compress"
    >
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        rounding={2}
        dangerouslySetInlineStyle={{
          __style: {
            height: dimensions.height,
            paddingLeft: dimensions.paddingX,
            paddingRight: dimensions.paddingX,
            backgroundColor: isSaved ? '#111' : '#e60023',
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            opacity: isDisabled ? 0.6 : 1,
            transition: 'all 0.15s ease',
            minWidth: 64,
          },
        }}
      >
        {isLoading ? (
          <Spinner accessibilityLabel="Processing" show size="sm" />
        ) : (
          <Text color="inverse" weight="bold" size={dimensions.fontSize}>
            {isSaved ? 'Saved' : 'Save'}
          </Text>
        )}
      </Box>
    </TapArea>
  );
};

export default PinSaveButton;