// src/modules/pin/components/PinSaveButton.tsx

import React, { useCallback, useMemo } from 'react';
import { Button, IconButton } from 'gestalt';
import { useAuth } from '@/modules/auth';
import { useSavePin } from '../hooks/useSavePin';
import { useUnsavePin } from '../hooks/useUnsavePin';

interface PinSaveButtonProps {
  pinId: string;
  isSaved: boolean;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  variant?: 'button' | 'icon';
}

const getIconButtonSize = (size: 'sm' | 'md' | 'lg'): 'xs' | 'md' | 'lg' => {
  if (size === 'sm') return 'xs';
  if (size === 'lg') return 'lg';
  return 'md';
};

export const PinSaveButton: React.FC<PinSaveButtonProps> = ({
  pinId,
  isSaved,
  size = 'md',
  fullWidth = false,
  variant = 'button',
}) => {
  const { isAuthenticated, login } = useAuth();

  const { savePin, isLoading: isSaving } = useSavePin();
  const { unsavePin, isLoading: isUnsaving } = useUnsavePin();

  const isLoading = isSaving || isUnsaving;
  const iconButtonSize = useMemo(() => getIconButtonSize(size), [size]);

  const handleClick = useCallback(() => {
    if (!isAuthenticated) {
      login();
      return;
    }

    if (isSaved) {
      unsavePin(pinId);
    } else {
      savePin(pinId);
    }
  }, [isAuthenticated, login, isSaved, pinId, savePin, unsavePin]);

  if (variant === 'icon') {
    return (
      <IconButton
        accessibilityLabel={isSaved ? 'Unsave' : 'Save'}
        icon="add-pin"
        size={iconButtonSize}
        bgColor={isSaved ? 'red' : 'transparentDarkGray'}
        iconColor="white"
        onClick={handleClick}
        disabled={isLoading}
      />
    );
  }

  // ✅ Красная только когда saved, серая когда не saved
  return (
    <Button
      text={isSaved ? 'Saved' : 'Save'}
      onClick={handleClick}
      size={size}
      color={isSaved ? 'red' : 'gray'}
      disabled={isLoading}
      fullWidth={fullWidth}
    />
  );
};

export default PinSaveButton;