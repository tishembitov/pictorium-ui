// src/modules/pin/components/PinSaveButton.tsx

import React, { useCallback } from 'react';
import { 
  Box, 
  Text, 
  TapArea, 
  Spinner,
} from 'gestalt';
import { useAuth } from '@/modules/auth';

interface PinSaveButtonProps {
  isSaved: boolean;
  onSave?: () => void;
  onUnsave?: () => void;
  isLoading?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

type ButtonSize = 'sm' | 'md' | 'lg';

const getButtonHeight = (size: ButtonSize): number => {
  switch (size) {
    case 'lg': return 48;
    case 'sm': return 32;
    default: return 40;
  }
};

const getPaddingX = (size: ButtonSize): number => {
  switch (size) {
    case 'lg': return 24;
    case 'sm': return 16;
    default: return 20;
  }
};

export const PinSaveButton: React.FC<PinSaveButtonProps> = ({
  isSaved,
  onSave,
  onUnsave,
  isLoading = false,
  size = 'md',
}) => {
  const { isAuthenticated, login } = useAuth();

  const handleClick = useCallback((e?: { event: React.MouseEvent | React.KeyboardEvent }) => {
    e?.event.stopPropagation();
    
    if (!isAuthenticated) {
      login();
      return;
    }

    if (isSaved) {
      onUnsave?.();
    } else {
      onSave?.();
    }
  }, [isAuthenticated, login, isSaved, onSave, onUnsave]);

  const buttonHeight = getButtonHeight(size);
  const paddingX = getPaddingX(size);

  return (
    <TapArea 
      onTap={handleClick} 
      disabled={isLoading}
      rounding={2}
    >
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        rounding={2}
        dangerouslySetInlineStyle={{
          __style: {
            height: buttonHeight,
            paddingLeft: paddingX,
            paddingRight: paddingX,
            backgroundColor: isSaved ? '#111' : '#e60023',
            cursor: isLoading ? 'wait' : 'pointer',
            opacity: isLoading ? 0.7 : 1,
            transition: 'all 0.15s ease',
          },
        }}
      >
        {isLoading ? (
          <Spinner accessibilityLabel="Processing" show size="sm" />
        ) : (
          <Text color="inverse" weight="bold" size="300">
            {isSaved ? 'Saved' : 'Save'}
          </Text>
        )}
      </Box>
    </TapArea>
  );
};

export default PinSaveButton;