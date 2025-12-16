// src/modules/pin/components/PinSaveButton.tsx

import React, { useCallback, useMemo } from 'react';
import { Button, IconButton } from 'gestalt';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { useAuth } from '@/modules/auth';
import { useSavePin } from '../hooks/useSavePin';
import { useUnsavePin } from '../hooks/useUnsavePin';
import type { PinResponse } from '../types/pin.types';

interface PinSaveButtonProps {
  pinId: string;
  isSaved: boolean;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  variant?: 'button' | 'icon';
}

// Helper to get icon button size
const getIconButtonSize = (size: 'sm' | 'md' | 'lg'): 'xs' | 'md' | 'lg' => {
  if (size === 'sm') return 'xs';
  if (size === 'lg') return 'lg';
  return 'md';
};

export const PinSaveButton: React.FC<PinSaveButtonProps> = ({
  pinId,
  isSaved: propIsSaved,
  size = 'md',
  fullWidth = false,
  variant = 'button',
}) => {
  const { isAuthenticated, login } = useAuth();
  const queryClient = useQueryClient();

  // ✅ ИСПРАВЛЕНИЕ: Получаем актуальное состояние из cache
  const cachedPin = queryClient.getQueryData<PinResponse>(queryKeys.pins.byId(pinId));
  const isSaved = cachedPin?.isSaved ?? propIsSaved;

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

  return (
    <Button
      text={isSaved ? 'Saved' : 'Save'}
      onClick={handleClick}
      size={size}
      color="red"
      disabled={isLoading}
      fullWidth={fullWidth}
    />
  );
};

export default PinSaveButton;